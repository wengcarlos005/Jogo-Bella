import Phaser from 'phaser';
import { AUTOSAVE_INTERVAL_MS, CAMERA, CHAR_SCALE, GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE, TILE } from '@/config/gameConfig';
import { EventBus } from '@/core/EventBus';
import { GameState } from '@/core/GameState';
import type { Direction, RegionId, Vec2 } from '@/core/types';
import type { Script } from '@/core/script';
import { Player } from '@/entities/Player';
import { NPC } from '@/entities/NPC';
import { getMap } from '@/regions';
import { buildMap, tileRect, tileToFeet, type BuiltMap } from '@/world/MapBuilder';
import type { MapDef } from '@/world/MapTypes';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { SaveSystem } from '@/systems/SaveSystem';
import { QuestSystem } from '@/systems/QuestSystem';
import { WeatherSystem } from '@/systems/WeatherSystem';
import { InteractionSystem, type Interactable } from '@/systems/InteractionSystem';
import { createScriptContext } from '@/systems/ScriptRunner';
import { REGIONS, regionMeta } from '@/data/regions';
import { ITEMS } from '@/data/items';
import { OUTFITS, REGION_OUTFIT } from '@/data/outfits';
import { UI } from '@/ui/UIManager';

export interface GameSceneData {
  mapId: string;
  spawn?: string;
  position?: Vec2;
  facing?: Direction;
}

interface NpcEntry {
  npc: NPC;
  def: NonNullable<MapDef['npcs']>[number];
}

/**
 * Cena de exploração. Cada mapa é carregado reiniciando esta cena com
 * outro MapDef — o motor é o mesmo para todas as cidades.
 */
export class GameScene extends Phaser.Scene {
  def!: MapDef;
  built!: BuiltMap;
  player!: Player;
  npcs = new Map<string, NpcEntry>();
  /** Objetos temporários criados por scripts (carro do Uber etc.). */
  tempProps = new Map<string, Phaser.GameObjects.Image>();
  /** Guarda-chuvas presos a personagens: 'up' (aberto) ou 'hide' (abaixado, escondendo o rosto). */
  umbrellas = new Map<string, { img: Phaser.GameObjects.Image; mode: 'up' | 'hide' }>();
  weather!: WeatherSystem;
  interactions!: InteractionSystem;
  private markers: { sprite: Phaser.GameObjects.Image; cond: () => boolean; anchor: () => Vec2 }[] = [];
  private scriptRunning = false;
  private transitioning = false;
  private blockedCooldown = 0;
  private lastTick = 0;
  private autosaveTimer = 0;
  private pendingMemories: string[] = [];
  private busHandlers: [string, (...a: unknown[]) => void][] = [];

  constructor() {
    super('Game');
  }

  init(data: GameSceneData): void {
    this.def = getMap(data.mapId);
    this.npcs = new Map();
    this.tempProps = new Map();
    this.umbrellas = new Map();
    this.markers = [];
    this.scriptRunning = false;
    this.transitioning = false;
    this.pendingMemories = [];
    this.registry.set('gameSceneData', data);
  }

  create(data: GameSceneData): void {
    const def = this.def;
    this.cameras.main.setBackgroundColor(def.background ?? '#1b1838');
    this.built = buildMap(this, def);

    // Jogador
    let pos: Vec2;
    let facing: Direction;
    if (data.position) {
      pos = data.position;
      facing = data.facing ?? 'down';
    } else {
      const sp = def.spawns[data.spawn ?? Object.keys(def.spawns)[0]];
      pos = tileToFeet(sp.tx, sp.ty);
      facing = sp.facing;
    }
    this.player = new Player(this, pos.x, pos.y, this.bellaTexture());
    this.player.face(facing);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, this.built.widthPx, this.built.heightPx);
    this.physics.add.collider(this.player, this.built.collision);
    this.physics.add.collider(this.player, this.built.solids);

    this.interactions = new InteractionSystem(this);
    this.spawnNpcs();
    this.registerPropInteractables();
    this.registerHotspots();
    if (new URLSearchParams(location.search).has('debug')) this.drawDebug();
    this.setupCamera();
    this.weather = new WeatherSystem(this);

    GameState.data.mapId = def.id;
    this.visitRegion(def.region);

    this.listen('memory:unlocked', (id) => this.pendingMemories.push(id as string));
    this.listen('quest:completed', (id) => {
      AudioSystem.play('quest');
      UI.toasts.show(`Missão concluída: ${QuestSystem.def(id as string).title}`);
      void SaveSystem.autosave();
    });
    this.listen('quest:started', (id) => {
      const q = QuestSystem.def(id as string);
      UI.toasts.show(`${q.kind === 'principal' ? 'Nova missão' : 'Missão secundária'}: ${q.title}`);
    });
    this.listen('flag:changed', () => this.refreshVisibility());

    InputSystem.on('game:interact', this.onInteract, this);
    InputSystem.on('game:menu', this.onMenu, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    UI.showGameplayUI(true);
    if (def.music) AudioSystem.playMusic(def.music);
    this.lastTick = this.time.now;

    void UI.fade(0, 350).then(async () => {
      if (def.onEnter) await this.runScript(def.onEnter);
      this.syncPosition();
      void SaveSystem.autosave();
    });
  }

  private listen(event: string, fn: (...a: unknown[]) => void): void {
    EventBus.on(event, fn);
    this.busHandlers.push([event, fn]);
  }

  private cleanup(): void {
    for (const [e, fn] of this.busHandlers) EventBus.off(e, fn);
    this.busHandlers = [];
    InputSystem.off('game:interact', this.onInteract, this);
    InputSystem.off('game:menu', this.onMenu, this);
    this.weather.destroy();
    UI.hud.setPrompt(null);
  }

  private visitRegion(region: RegionId): void {
    const visited = GameState.data.regionsVisited;
    if (!visited.includes(region)) {
      visited.push(region);
      const meta = regionMeta(region);
      this.time.delayedCall(500, () => UI.hud.showBanner(meta.chapter, meta.name, meta.subtitle));
    }
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setZoom(RENDER_SCALE);
    const { widthPx: w, heightPx: h } = this.built;
    const bx = w < GAME_WIDTH ? -(GAME_WIDTH - w) / 2 : 0;
    const by = h < GAME_HEIGHT ? -(GAME_HEIGHT - h) / 2 : 0;
    cam.setBounds(bx, by, Math.max(w, GAME_WIDTH), Math.max(h, GAME_HEIGHT));
    cam.startFollow(this.player, true, CAMERA.lerp, CAMERA.lerp, 0, -8);
    cam.setRoundPixels(true);
  }

  // ------------------------------------------------------------ roupas

  /** Spritesheet da Bella para a região atual (com fallback para o placeholder). */
  bellaTexture(): string {
    return this.spriteFor('bella');
  }

  /**
   * Textura de um personagem na região atual. Bella e Weng trocam de roupa
   * conforme a cidade; demais NPCs usam a própria chave. Sem arte real,
   * cai no placeholder (chave original).
   */
  spriteFor(key: string): string {
    if (key !== 'bella' && key !== 'weng') return key;
    const region = this.def.region;
    const override = key === 'bella' ? GameState.data.regionOutfits[region] : undefined;
    const id = override ?? REGION_OUTFIT[key][region];
    const tex = OUTFITS[key][id]?.texture;
    return tex && this.textures.exists(tex) ? tex : key;
  }

  /** Reaplica a roupa (após troca no guarda-roupa). */
  dressPlayer(): void {
    const facing = this.player.facing;
    this.player.applySheet(this.bellaTexture());
    this.player.face(facing);
  }

  // ------------------------------------------------------------ NPCs / props

  private spawnNpcs(): void {
    for (const def of this.def.npcs ?? []) {
      const p = tileToFeet(def.tx, def.ty);
      const npc = new NPC(this, p.x, p.y, this.spriteFor(def.sprite), def.id);
      npc.face(def.facing ?? 'down');
      npc.behavior = def.behavior ?? 'idle';
      if (def.wanderRadius !== undefined) npc.wanderRadius = def.wanderRadius * TILE;
      if (def.wanderAxis) npc.wanderAxis = def.wanderAxis;
      npc.interactScript = def.interact;
      this.physics.add.collider(this.player, npc);
      if (npc.behavior === 'wander') {
        this.physics.add.collider(npc, this.built.collision);
        this.physics.add.collider(npc, this.built.solids);
      }
      this.npcs.set(def.id, { npc, def });
      if (def.interact) {
        this.interactions.add({
          id: `npc:${def.id}`,
          rect: () => new Phaser.Geom.Rectangle(npc.x - 10, npc.headY, 20, npc.bodyHeight),
          label: () => 'Falar',
          enabled: () => npc.visible,
          run: () => this.talkTo(npc),
          anchor: () => ({ x: npc.x, y: npc.headY - 2 }),
        });
      }
      if (def.markerIf) this.addMarker(def.markerIf, () => ({ x: npc.x, y: npc.headY - 4 }), () => npc.visible);
    }
    // Weng seguindo a Bella
    if (GameState.is('weng-segue')) this.attachFollower(true);
    this.refreshVisibility();
  }

  /** Cria o Weng como seguidor se ele não estiver no mapa. */
  attachFollower(placeBehind = false): void {
    let entry = this.npcs.get('weng');
    if (entry && placeBehind) {
      const back = { down: [0, -18], up: [0, 18], left: [18, 0], right: [-18, 0] }[this.player.facing];
      entry.npc.setPosition(this.player.x + back[0], this.player.y + back[1]);
    }
    if (!entry) {
      const back = { down: [0, -18], up: [0, 18], left: [18, 0], right: [-18, 0] }[this.player.facing];
      const npc = new NPC(this, this.player.x + back[0], this.player.y + back[1], this.spriteFor('weng'), 'weng');
      npc.interactScript = 'weng';
      entry = { npc, def: { id: 'weng', sprite: 'weng', tx: 0, ty: 0, interact: 'weng' } };
      this.npcs.set('weng', entry);
      this.interactions.add({
        id: 'npc:weng',
        rect: () => new Phaser.Geom.Rectangle(npc.x - 10, npc.headY, 20, npc.bodyHeight),
        label: () => 'Falar',
        enabled: () => npc.visible && !!this.def.scripts?.weng,
        run: () => this.talkTo(npc),
        anchor: () => ({ x: npc.x, y: npc.headY - 2 }),
      });
    }
    entry.npc.follow(this.player);
  }

  private registerPropInteractables(): void {
    for (const bp of this.built.props) {
      const { def, sprite } = bp;
      if (def.interact) {
        this.interactions.add({
          id: `prop:${def.id ?? def.key}:${def.tx}:${def.ty}`,
          rect: () => new Phaser.Geom.Rectangle(sprite.x - 2, sprite.y - sprite.height - 2, sprite.width + 4, sprite.height + 4),
          label: () => def.label ?? 'Ver',
          enabled: () => sprite.visible,
          run: () => this.runScript(def.interact!),
          anchor: () => ({ x: sprite.x + sprite.width / 2, y: sprite.y - sprite.height - 2 }),
        });
      }
      if (def.markerIf)
        this.addMarker(def.markerIf, () => ({ x: sprite.x + sprite.width / 2, y: sprite.y - sprite.height - 4 }), () => sprite.visible);
    }
  }

  private registerHotspots(): void {
    (this.def.hotspots ?? []).forEach((h, i) => {
      const r = tileRect(h.rect);
      this.interactions.add({
        id: `hotspot:${i}:${h.interact}`,
        rect: () => r,
        label: () => h.label ?? 'Ver',
        enabled: () => (h.enabledIf ? h.enabledIf() : true),
        run: () => this.runScript(h.interact),
        anchor: () => ({ x: r.centerX, y: r.y - 2 }),
      });
      if (h.markerIf) this.addMarker(h.markerIf, () => ({ x: r.centerX, y: r.y - 4 }), () => true);
    });
  }

  /** ?debug na URL: desenha colisões (vermelho), interações (verde), gatilhos (azul), saídas (amarelo). */
  private drawDebug(): void {
    const g = this.add.graphics().setDepth(300_000);
    const box = (r: Phaser.Geom.Rectangle, color: number) => {
      g.fillStyle(color, 0.25).fillRect(r.x, r.y, r.width, r.height);
      g.lineStyle(1, color, 0.9).strokeRect(r.x, r.y, r.width, r.height);
    };
    for (const b of this.def.blocks ?? []) box(tileRect(b), 0xff3040);
    for (const h of this.def.hotspots ?? []) box(tileRect(h.rect), 0x30ff60);
    for (const t of this.def.triggers ?? []) box(tileRect(t.rect), 0x3080ff);
    for (const e of this.def.exits ?? []) box(tileRect(e.rect), 0xffd030);
    this.built.collision.forEachTile((t) => {
      if (t.collides) box(new Phaser.Geom.Rectangle(t.pixelX, t.pixelY, TILE, TILE), 0xff3040);
    });
  }

  private addMarker(cond: () => boolean, anchor: () => Vec2, visible: () => boolean): void {
    const sprite = this.add.image(0, 0, 'fx-marker').setDepth(150_000).setVisible(false);
    this.markers.push({ sprite, cond: () => visible() && cond(), anchor });
  }

  /** Reavalia visibleIf de props e NPCs (chamado quando flags mudam). */
  refreshVisibility(): void {
    for (const bp of this.built.props) {
      const vis = bp.def.visibleIf ? bp.def.visibleIf() : true;
      bp.sprite.setVisible(vis);
      if (bp.block) (bp.block.body as Phaser.Physics.Arcade.StaticBody).enable = vis;
    }
    for (const { npc, def } of this.npcs.values()) {
      const vis = def.visibleIf ? def.visibleIf() : true;
      npc.setVisible(vis);
      (npc.body as Phaser.Physics.Arcade.Body).enable = vis;
    }
  }

  private async talkTo(npc: NPC): Promise<void> {
    const prevBehavior = npc.behavior;
    npc.pause();
    if (prevBehavior !== 'follow') npc.faceTowards(this.player.x, this.player.y);
    this.player.faceTowards(npc.x, npc.y);
    if (npc.interactScript) await this.runScript(npc.interactScript);
  }

  // ------------------------------------------------------------ scripts

  async runScript(name: string): Promise<void> {
    const script: Script | undefined = this.def.scripts?.[name];
    if (!script) {
      console.warn(`[${this.def.id}] script ausente: ${name}`);
      return;
    }
    if (this.scriptRunning) return;
    this.scriptRunning = true;
    InputSystem.push('script');
    UI.hud.setPrompt(null);
    try {
      await script(createScriptContext(this));
    } catch (err) {
      console.error(`Erro no script ${name}:`, err);
    } finally {
      UI.dialogue.close();
      InputSystem.pop('script');
      this.scriptRunning = false;
      this.syncPosition();
    }
    await this.flushMemories();
  }

  private async flushMemories(): Promise<void> {
    while (this.pendingMemories.length && !this.scriptRunning) {
      const id = this.pendingMemories.shift()!;
      this.scriptRunning = true;
      InputSystem.push('script');
      await UI.memory(id);
      InputSystem.pop('script');
      this.scriptRunning = false;
    }
  }

  /** Mostra a tela de memória já (dentro de um script) e tira da fila. */
  async showMemoryNow(id: string): Promise<void> {
    this.pendingMemories = this.pendingMemories.filter((m) => m !== id);
    await UI.memory(id);
  }

  get busy(): boolean {
    return this.scriptRunning || this.transitioning;
  }

  /** Item ganho com aviso na tela. */
  notifyItem(id: string, qty: number): void {
    const def = ITEMS[id];
    AudioSystem.play('pickup');
    UI.toasts.show(`${def.name}${qty > 1 ? ` ×${qty}` : ''}`, def.icon);
  }

  // ------------------------------------------------------------ transições

  async goTo(mapId: string, spawn: string, sfx?: 'door'): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;
    InputSystem.push('transition');
    if (sfx) AudioSystem.play(sfx);
    await UI.fade(1, 300);
    InputSystem.pop('transition');
    this.scene.restart({ mapId, spawn } satisfies GameSceneData);
  }

  travelTo(region: RegionId): void {
    const meta = REGIONS.find((r) => r.id === region);
    if (!meta?.entryMap) {
      UI.toasts.show('Essa região ainda está em construção!');
      return;
    }
    void this.goTo(meta.entryMap, meta.entrySpawn);
  }

  private syncPosition(): void {
    GameState.data.position = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    GameState.data.facing = this.player.facing;
    GameState.data.mapId = this.def.id;
  }

  // ------------------------------------------------------------ input

  private onInteract(): void {
    if (this.busy) return;
    const target = this.interactions.find(this.player.probe(), this.player.feet);
    if (target) void target.run();
  }

  private onMenu(): void {
    if (this.busy) return;
    UI.openMenu('missoes');
  }

  // ------------------------------------------------------------ loop

  update(time: number, delta: number): void {
    this.player.update();
    for (const { npc } of this.npcs.values()) npc.update(time, delta);
    this.weather.update(this.cameras.main);
    this.updateUmbrellas();

    // tempo de jogo + autosave
    GameState.data.playtimeMs += time - this.lastTick;
    this.lastTick = time;
    this.autosaveTimer += delta;
    if (this.autosaveTimer > AUTOSAVE_INTERVAL_MS && !this.busy) {
      this.autosaveTimer = 0;
      this.syncPosition();
      void SaveSystem.autosave();
    }

    for (const m of this.markers) {
      const on = m.cond();
      m.sprite.setVisible(on);
      if (on) {
        const a = m.anchor();
        m.sprite.setPosition(Math.round(a.x), Math.round(a.y + Math.sin(time / 200) * 1.5));
      }
    }

    if (this.busy || !InputSystem.gameplayEnabled) {
      UI.hud.setPrompt(null);
      return;
    }

    if (this.pendingMemories.length) {
      void this.flushMemories();
      return;
    }

    this.checkExitsAndTriggers(delta);
    this.updatePrompt();
  }

  private checkExitsAndTriggers(delta: number): void {
    const feet = this.player.feet;
    this.blockedCooldown -= delta;

    for (const exit of this.def.exits ?? []) {
      if (!tileRect(exit.rect).contains(feet.x, feet.y)) continue;
      const blocked = exit.blockedIf?.();
      if (blocked) {
        if (this.blockedCooldown <= 0) {
          this.blockedCooldown = 1200;
          AudioSystem.play('cancel');
          UI.toasts.show(blocked);
        }
        const push = { down: [0, -6], up: [0, 6], left: [6, 0], right: [-6, 0] }[this.player.facing];
        this.player.setPosition(this.player.x + push[0], this.player.y + push[1]);
        return;
      }
      void this.goTo(exit.toMap, exit.toSpawn, exit.sfx);
      return;
    }

    for (const tr of this.def.triggers ?? []) {
      if (tr.enabledIf && !tr.enabledIf()) continue;
      const onceKey = `trigger:${this.def.id}:${tr.id}`;
      if (tr.once && GameState.is(onceKey)) continue;
      if (!tileRect(tr.rect).contains(feet.x, feet.y)) continue;
      if (tr.once) GameState.setFlag(onceKey);
      void this.runScript(tr.script);
      return;
    }
  }

  private updatePrompt(): void {
    const target = this.interactions.find(this.player.probe(), this.player.feet);
    if (!target) {
      UI.hud.setPrompt(null);
      return;
    }
    const a = target.anchor();
    const cam = this.cameras.main;
    UI.hud.setPrompt(target.label(), a.x - cam.worldView.x, a.y - cam.worldView.y, UI.touch.usingTouch);
  }

  setUmbrella(who: string, mode: 'up' | 'hide' | 'off'): void {
    const cur = this.umbrellas.get(who);
    if (mode === 'off') {
      cur?.img.destroy();
      this.umbrellas.delete(who);
      return;
    }
    if (cur) {
      cur.mode = mode;
      return;
    }
    const key = who === 'weng' ? 'umbrella-weng' : 'umbrella-bella';
    const img = this.add.image(0, 0, key).setOrigin(0.5, 1);
    img.setScale((img.width >= 64 ? 1 / RENDER_SCALE : 1) * CHAR_SCALE);
    this.umbrellas.set(who, { img, mode });
  }

  private updateUmbrellas(): void {
    for (const [who, u] of this.umbrellas) {
      const a = this.findActor(who);
      if (!a || !a.visible) {
        u.img.setVisible(false);
        continue;
      }
      u.img.setVisible(true);
      // 'up': aberto acima da cabeça; 'hide': abaixado, cobrindo o rosto
      const targetY = u.mode === 'up' ? a.headY + a.bodyHeight * 0.32 : a.headY + a.bodyHeight * 0.62;
      if (!u.img.visible || u.img.y === 0) u.img.y = targetY;
      u.img.y += (targetY - u.img.y) * 0.25;
      u.img.x = a.x + (a.facing === 'left' ? -2 : a.facing === 'right' ? 2 : 0);
      u.img.setDepth(a.depth + 1);
    }
  }

  // ------------------------------------------------------------ util p/ scripts

  findActor(who: string): NPC | Player | null {
    if (who === 'player' || who === 'bella') return this.player;
    return this.npcs.get(who)?.npc ?? null;
  }

  tile(tx: number, ty: number): Vec2 {
    return tileToFeet(tx, ty);
  }

  get tileSize(): number {
    return TILE;
  }
}

export type { Interactable };
