import { SceneCheckpoints } from '@/systems/SceneCheckpoints';
import Phaser from 'phaser';
import { AUTOSAVE_INTERVAL_MS, CAMERA, PROP_SCALE, GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE, TILE } from '@/config/gameConfig';
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
import { setPortraitOverride } from '@/ui/components/DialogueBox';

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
/** NPCs que ainda não têm arte própria usam a folha de outro enquanto isso. */
const SPRITE_FALLBACK: Record<string, string> = { 'garcom-mex': 'garcom', garcom: 'atendente' };

export class GameScene extends Phaser.Scene {
  def!: MapDef;
  built!: BuiltMap;
  player!: Player;
  npcs = new Map<string, NpcEntry>();
  /** Objetos temporários criados por scripts (carro do Uber etc.). */
  tempProps = new Map<string, Phaser.GameObjects.Image>();
  /** Guarda-chuvas presos a personagens: 'up' (aberto) ou 'hide' (abaixado, escondendo o rosto). */
  umbrellas = new Map<string, { img: Phaser.GameObjects.Image; shaft: Phaser.GameObjects.Image; mode: 'up' | 'hide' }>();
  weather!: WeatherSystem;
  interactions!: InteractionSystem;
  private markers: { sprite: Phaser.GameObjects.Image; cond: () => boolean; anchor: () => Vec2; side?: 'left' | 'right'; caption?: Phaser.GameObjects.Text }[] = [];
  private scriptRunning = false;
  private transitioning = false;
  /** Cada entrada num mapa ganha um número: o que sobrou do mapa anterior não mexe no novo. */
  private gen = 0;
  /** Até o script de entrada começar, ninguém sai pelas bordas (segurar a seta não "volta" de mapa). */
  private entering = false;
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
    this.data.set('charScale', this.def.charScale ?? 1);
    this.data.set('perspective', this.def.perspective ?? null);
    this.npcs = new Map();
    this.tempProps = new Map();
    this.umbrellas = new Map();
    this.markers = [];
    this.scriptRunning = false;
    this.transitioning = false;
    this.entering = true;
    this.gen++;
    this.pendingMemories = [];
    // cenas do mapa anterior que ficaram pela metade não podem deixar o controle travado
    InputSystem.reset();
    UI.dialogue.close();
    this.registry.set('gameSceneData', data);
  }

  create(data: GameSceneData): void {
    const def = this.def;
    this.cameras.main.setBackgroundColor(def.background ?? '#1b1838');
    def.beforeBuild?.();
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
    // o Weng só lidera no quintal (churrasco); em qualquer outro lugar a Bella volta a liderar
    if (this.wengLeads && def.id !== 'piabeta-quintal') GameState.setFlag('lider-weng', false);
    this.player = new Player(this, pos.x, pos.y, this.leadTexture());
    this.player.face(facing);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, this.built.widthPx, this.built.heightPx);
    this.physics.add.collider(this.player, this.built.collision);
    this.physics.add.collider(this.player, this.built.solids);

    this.interactions = new InteractionSystem(this);
    this.spawnNpcs();
    if (def.hideActorsOnEnter?.()) {
      this.player.setVisible(false);
      this.npcs.get('weng')?.npc.setVisible(false);
    }
    this.registerPropInteractables();
    this.registerHotspots();
    if (new URLSearchParams(location.search).has('debug')) this.drawDebug();
    this.setupCamera();
    this.weather = new WeatherSystem(this);
    this.addAmbient(def.ambient ?? (def.indoor ? 'dust' : undefined));
    this.addSteam();
    this.addRainWindows();
    this.addLighting();
    this.addBlackout();

    GameState.data.mapId = def.id;
    SceneCheckpoints.enter(def.id, { x: Math.round(pos.x), y: Math.round(pos.y) }, facing);
    this.visitRegion(def.region);

    this.listen('memory:unlocked', (id) => this.pendingMemories.push(id as string));
    this.listen('quest:completed', (id) => {
      AudioSystem.play('quest');
      UI.celebrate('Missão concluída!', QuestSystem.def(id as string).title);
      this.sparkleBurst(this.player.x, this.player.headY, 22, true);
      void SaveSystem.autosave();
    });
    this.listen('quest:started', (id) => {
      SceneCheckpoints.questStarted(id as string);
      const q = QuestSystem.def(id as string);
      UI.toasts.show(`${q.kind === 'principal' ? 'Nova missão' : 'Missão secundária'}: ${q.title}`);
    });
    this.listen('flag:changed', () => this.refreshVisibility());

    InputSystem.on('game:interact', this.onInteract, this);
    InputSystem.on('game:menu', this.onMenu, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    // retrato da caixa de falas = roupa que a Bella/Weng está usando agora
    setPortraitOverride((who) => {
      const comp = this.npcs.get('weng')?.npc;
      if (who === 'bella') {
        if (this.wengLeads) return comp ? `portrait-${comp.texture.key}` : `portrait-${this.bellaTexture()}`;
        return `portrait-${this.player.texture.key}`;
      }
      if (who === 'weng') {
        if (this.wengLeads) return `portrait-${this.player.texture.key}`;
        return comp ? `portrait-${comp.texture.key}` : `portrait-${this.spriteFor('weng')}`;
      }
      // NPC com retrato do próprio sprite (ex.: o garçom do mexicano ≠ o de Petrópolis)
      const npc = this.npcs.get(who)?.npc;
      if (npc && npc.texture.key !== who && this.textures.exists(`portrait-${npc.texture.key}`)) return `portrait-${npc.texture.key}`;
      return null;
    });
    UI.showGameplayUI(true);
    if (def.music) AudioSystem.playMusic(def.music);
    this.lastTick = this.time.now;

    const gen = this.gen;
    void UI.fade(0, 350).then(async () => {
      if (gen !== this.gen || this.transitioning) return;
      if (def.onEnter) await this.runScript(def.onEnter);
      if (gen !== this.gen) return;
      this.entering = false;
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
    // o cinema do 3º encontro fica em Caxias, mas ainda é o Capítulo 1: o cartão do Capítulo 2 espera o apê
    if (this.def.id === 'duque-cinema') return;
    if (!visited.includes(region)) {
      visited.push(region);
      const meta = regionMeta(region);
      this.time.delayedCall(500, () => UI.hud.showBanner(meta.chapter, meta.name, meta.subtitle));
    }
  }

  baseZoom = RENDER_SCALE;
  private wengOverlapMs = 0;

  private setupCamera(): void {
    const cam = this.cameras.main;
    const { widthPx: w, heightPx: h } = this.built;
    // cenário mais estreito/baixo que a tela: aproxima só o necessário pra não sobrar faixa preta
    this.baseZoom = RENDER_SCALE * Math.max(1, GAME_WIDTH / w, GAME_HEIGHT / h);
    cam.setZoom(this.baseZoom);
    cam.setBounds(0, 0, w, h);
    cam.startFollow(this.player, false, CAMERA.lerp, CAMERA.lerp, 0, -8);
    cam.setDeadzone(10, 8);
    cam.setRoundPixels(true);
  }

  // ------------------------------------------------------------ roupas

  /** Spritesheet da Bella para a região atual (com fallback para o placeholder). */
  bellaTexture(): string {
    return this.spriteFor('bella');
  }

  /** Em alguns trechos (o churrasco do Alexandre) quem o jogador controla é o Weng, e a Bella acompanha. */
  get wengLeads(): boolean {
    return GameState.is('lider-weng');
  }
  leadTexture(): string {
    return this.wengLeads ? this.spriteFor('weng') : this.bellaTexture();
  }
  companionTexture(): string {
    return this.wengLeads ? this.bellaTexture() : this.spriteFor('weng');
  }
  /** Troca quem lidera: cada personagem continua no mesmo lugar, só muda quem o jogador controla. */
  setLead(weng: boolean): void {
    if (weng === this.wengLeads) return;
    GameState.setFlag('lider-weng', weng);
    const pl = this.player;
    const comp = this.npcs.get('weng')?.npc;
    const pf = pl.facing;
    const px = pl.x;
    const py = pl.y;
    pl.applySheet(this.leadTexture());
    if (comp) {
      const cf = comp.facing;
      comp.applySheet(this.companionTexture());
      pl.setPosition(comp.x, comp.y);
      (pl.body as Phaser.Physics.Arcade.Body).reset(comp.x, comp.y);
      comp.setPosition(px, py);
      (comp.body as Phaser.Physics.Arcade.Body).reset(px, py);
      pl.face(cf);
      comp.face(pf);
      pl.trail.length = 0;
    } else pl.face(pf);
  }

  /**
   * Textura de um personagem na região atual. Bella e Weng trocam de roupa
   * conforme a cidade; demais NPCs usam a própria chave. Sem arte real,
   * cai no placeholder (chave original).
   */
  spriteFor(key: string): string {
    if (key !== 'bella' && key !== 'weng') {
      // sem a arte ainda: cai no substituto (ex.: garçom do mexicano → garçom → atendente)
      let k = key;
      while (!this.textures.exists(k) && SPRITE_FALLBACK[k]) k = SPRITE_FALLBACK[k];
      return k;
    }
    const region = this.def.region;
    const override = key === 'bella' ? GameState.data.regionOutfits[region] : undefined;
    const id = override ?? REGION_OUTFIT[key][region];
    const tex = OUTFITS[key][id]?.texture;
    if (tex && this.textures.exists(tex)) return tex;
    const casual = OUTFITS[key].casual.texture;
    return this.textures.exists(casual) ? casual : key;
  }

  /** Reaplica a roupa (após troca no guarda-roupa). */
  dressPlayer(): void {
    const facing = this.player.facing;
    this.player.applySheet(this.leadTexture());
    this.player.face(facing);
  }

  // ------------------------------------------------------------ NPCs / props

  private spawnNpcs(): void {
    for (const def of this.def.npcs ?? []) {
      const p = tileToFeet(def.tx, def.ty);
      const npc = new NPC(this, p.x, p.y, this.spriteFor(def.sprite), def.id);
      npc.face(def.facing ?? 'down');
      npc.behavior = def.behavior ?? 'idle';
      if (def.pose && this.textures.exists(def.pose.key)) npc.pose(def.pose.key, def.pose.frame);
      // corpo largo nos NPCs (não só nos pés): a Bella para encostada neles, sem atravessar
      if (def.id !== 'weng') {
        const body = npc.body as Phaser.Physics.Arcade.Body;
        const sc = npc.scaleX;
        const bw = def.pose ? 14 : 18;
        body.setSize(bw / sc, 9 / sc);
        body.setOffset((npc.frame.width - bw / sc) / 2, npc.frame.height - 10 / sc);
        // a Bella não empurra o NPC, mas o NPC continua batendo nas paredes e nos móveis
        body.pushable = false;
      }
      if (def.behavior === 'flee') npc.fleeFrom = this.player;
      if (def.chore) {
        npc.chore = { xs: def.chore.xs.map((x) => x * TILE), y: tileToFeet(0, def.chore.y).y, wy: tileToFeet(0, def.chore.wy ?? def.chore.y).y, i: 0, dir: 1, wipe: 1500 };
        this.addWipeCloth(npc);
      }
      if (def.wanderRadius !== undefined) npc.wanderRadius = def.wanderRadius * TILE;
      if (def.wanderAxis) npc.wanderAxis = def.wanderAxis;
      npc.interactScript = def.interact;
      this.addNpcColliders(npc);
      this.npcs.set(def.id, { npc, def });
      if (def.interact) {
        this.interactions.add({
          id: `npc:${def.id}`,
          rect: () => new Phaser.Geom.Rectangle(npc.x - 16, npc.headY, 32, npc.bodyHeight + 6),
          label: () => 'Falar',
          enabled: () => npc.visible,
          run: () => this.talkTo(npc),
          anchor: () => ({ x: npc.x, y: npc.headY - 2 }),
          priority: def.id === 'weng' ? -1 : 0,
        });
      }
      if (def.markerIf) this.addMarker(def.markerIf, () => ({ x: npc.x, y: npc.headY - 4 }), () => npc.visible);
    }
    // Weng seguindo a Bella
    if (GameState.is('weng-segue')) this.attachFollower(true);
    this.refreshVisibility();
  }

  /**
   * Onde o Weng aparece ao entrar num mapa: ao lado da Bella (direita, esquerda),
   * ou atrás/à frente, o primeiro lugar sem parede, porta ou móvel.
   */
  private followerSpot(): [number, number] {
    const f = this.player.facing;
    const behind: [number, number] = ({ down: [0, -18], up: [0, 18], left: [18, 0], right: [-18, 0] } as Record<string, [number, number]>)[f];
    const cands: [number, number][] = [[20, -2], [-20, -2], [24, 0], [-24, 0], behind, [-behind[0], -behind[1]]];
    const { widthPx: W, heightPx: H } = this.built;
    const free = (x: number, y: number) => {
      if (x < 8 || x > W - 8 || y < 8 || y > H - 2) return false;
      let hit = false;
      this.physics.world.staticBodies.iterate((b) => {
        const sb = b as Phaser.Physics.Arcade.StaticBody;
        if (!hit && sb.enable && x + 6 > sb.x && x - 6 < sb.x + sb.width && y + 1 > sb.y && y - 6 < sb.y + sb.height) hit = true;
        return true;
      });
      if (hit) return false;
      const tile = this.built.collision.getTileAtWorldXY(x, y - 2);
      return !tile || !tile.collides;
    };
    for (const c of cands) if (free(this.player.x + c[0], this.player.y + c[1])) return c;
    return behind;
  }

  /** Cria o Weng como seguidor se ele não estiver no mapa. */
  attachFollower(placeBehind = false): void {
    let entry = this.npcs.get('weng');
    const back = this.followerSpot();
    if (entry && placeBehind) {
      entry.npc.setPosition(this.player.x + back[0], this.player.y + back[1]);
      (entry.npc.body as Phaser.Physics.Arcade.Body).reset(entry.npc.x, entry.npc.y);
    }
    if (!entry) {
      const npc = new NPC(this, this.player.x + back[0], this.player.y + back[1], this.companionTexture(), 'weng');
      npc.interactScript = 'weng';
      this.addNpcColliders(npc);
      entry = { npc, def: { id: 'weng', sprite: 'weng', tx: 0, ty: 0, interact: 'weng' } };
      this.npcs.set('weng', entry);
      this.interactions.add({
        id: 'npc:weng',
        rect: () => new Phaser.Geom.Rectangle(npc.x - 16, npc.headY, 32, npc.bodyHeight + 6),
        label: () => 'Falar',
        enabled: () => npc.visible && !!this.def.scripts?.weng,
        priority: -1,
        run: () => this.talkTo(npc),
        anchor: () => ({ x: npc.x, y: npc.headY - 2 }),
      });
    }
    entry.npc.follow(this.player);
  }

  private lightObjs: Phaser.GameObjects.GameObject[] = [];

  /** Noite: véu azul-escuro sobre o cenário + brilhos quentes nas lâmpadas (blend aditivo). */
  private addLighting(): void {
    this.lightObjs = [];
    const L = this.def.lighting;
    if (!L) return;
    if (!this.textures.exists('fx-glow')) {
      const t = this.textures.createCanvas('fx-glow', 128, 128)!;
      const c = t.getContext();
      const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.15)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 128, 128);
      t.refresh();
    }
    const { widthPx: w, heightPx: h } = this.built;
    const veil = this.add.rectangle(0, 0, w, h, L.color ?? 0x101848, L.darkness).setOrigin(0).setDepth(199_000);
    this.lightObjs.push(veil);
    for (const l of L.lights) {
      const x = l.x / 3;
      const y = l.y / 3;
      const r = l.r / 3;
      const glow = this.add
        .image(x, y, 'fx-glow')
        .setDisplaySize(r * 2, r * 2)
        .setTint(l.color ?? 0xffb04a)
        .setAlpha(0.42)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(199_500);
      const core = this.add
        .image(x, y, 'fx-glow')
        .setDisplaySize(r * 0.32, r * 0.32)
        .setTint(0xffe2a0)
        .setAlpha(0.5)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(199_501);
      if (l.neon) {
        core.setVisible(false);
        glow.setAlpha(0.55);
        this.tweens.add({ targets: glow, alpha: { from: 0.3, to: 0.7 }, duration: Phaser.Math.Between(1300, 1900), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        // falhinha de neon de vez em quando
        this.time.addEvent({
          delay: Phaser.Math.Between(2600, 5200),
          loop: true,
          callback: () => {
            glow.setAlpha(0.08);
            this.time.delayedCall(70, () => glow.setAlpha(0.6));
            this.time.delayedCall(140, () => glow.setAlpha(0.1));
            this.time.delayedCall(210, () => glow.setAlpha(0.6));
          },
        });
      } else if (l.flicker !== false) {
        this.tweens.add({ targets: glow, alpha: { from: 0.34, to: 0.46 }, duration: Phaser.Math.Between(900, 1600), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      this.lightObjs.push(glow, core);
    }
    this.refreshLighting();
  }

  private blackoutRt: Phaser.GameObjects.RenderTexture | null = null;
  private blackoutHole: Phaser.GameObjects.Image | null = null;

  /** Casa às escuras (ex.: chegando para o pedido): só a lanterna do celular em volta da Bella. */
  private addBlackout(): void {
    this.blackoutRt = null;
    const B = this.def.blackout;
    if (!B) return;
    if (!this.textures.exists('fx-hole')) {
      const t = this.textures.createCanvas('fx-hole', 128, 128)!;
      const c = t.getContext();
      const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.45, 'rgba(255,255,255,0.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 128, 128);
      t.refresh();
    }
    const { widthPx: w, heightPx: h } = this.built;
    this.blackoutRt = this.add.renderTexture(0, 0, w, h).setOrigin(0).setDepth(199_800);
    this.blackoutHole = this.make.image({ key: 'fx-hole', add: false });
    this.blackoutRt.setAlpha(B.when() ? 1 : 0);
  }

  private updateBlackout(): void {
    const B = this.def.blackout;
    const rt = this.blackoutRt;
    if (!B || !rt || !this.blackoutHole) return;
    const target = B.when() ? 1 : 0;
    rt.setAlpha(rt.alpha + (target - rt.alpha) * 0.04);
    if (rt.alpha < 0.01) {
      rt.setVisible(false);
      return;
    }
    rt.setVisible(true);
    rt.clear();
    rt.fill(0x06050c, 0.96);
    const hole = this.blackoutHole;
    for (const g of B.glows ?? []) {
      hole.setDisplaySize((g.r / 3) * 2, (g.r / 3) * 2).setAlpha(g.alpha ?? 0.5).setPosition(g.x / 3, g.y / 3);
      rt.erase(hole);
    }
    const r = B.radius ?? 34;
    const flick = 1 + Math.sin(this.time.now / 140) * 0.02;
    hole.setDisplaySize(r * 2 * flick, r * 2 * flick).setAlpha(1).setPosition(this.player.x, this.player.y - 10);
    rt.erase(hole);
  }

  private refreshLighting(): void {
    const on = this.def.lighting?.when ? this.def.lighting.when() : true;
    for (const o of this.lightObjs) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(on);
  }

  private rainWindowObjs: Phaser.GameObjects.GameObject[] = [];

  /** Vidros das janelas: céu cinza + gotas caindo, enquanto estiver chovendo lá fora. */
  private addRainWindows(): void {
    this.rainWindowObjs = [];
    this.sunWindowObjs = [];
    const rw = this.def.rainWindows;
    if (!rw) return;
    for (const r of rw.rects) {
      const rect = tileRect(r);
      const glass = this.add.rectangle(rect.x, rect.y, rect.width, rect.height, 0x5a6a86, rw.glass === false ? 0 : 0.72).setOrigin(0).setDepth(-7);
      const shape = this.make.graphics({}, false).fillRect(rect.x, rect.y, rect.width, rect.height);
      const drops = this.add.particles(0, 0, 'fx-rain', {
        x: { min: rect.x, max: rect.right },
        y: rect.y - 4,
        speedY: { min: 90, max: 130 },
        speedX: -12,
        lifespan: (rect.height / 100) * 1000 + 200,
        frequency: 70,
        scale: 0.6,
        alpha: { min: 0.5, max: 0.9 },
      });
      drops.setDepth(-6).setMask(shape.createGeometryMask());
      this.rainWindowObjs.push(glass, drops);
      if (rw.sunny) {
        // vidro de dia de sol: céu azul clarinho, nuvenzinha e reflexo na diagonal
        const g = this.add.graphics().setDepth(-6.5);
        g.fillGradientStyle(0x8fcdf2, 0x8fcdf2, 0xe6f4fb, 0xe6f4fb, 1);
        g.fillRect(rect.x, rect.y, rect.width, rect.height);
        g.fillStyle(0xffffff, 0.85);
        g.fillRect(rect.x + rect.width * 0.2, rect.y + rect.height * 0.3, Math.max(2, rect.width * 0.3), 1.5);
        g.fillRect(rect.x + rect.width * 0.28, rect.y + rect.height * 0.3 - 1, Math.max(1, rect.width * 0.14), 1);
        g.fillStyle(0xffffff, 0.35);
        g.fillTriangle(rect.x + rect.width * 0.55, rect.y, rect.x + rect.width * 0.75, rect.y, rect.x + rect.width * 0.35, rect.bottom);
        this.sunWindowObjs.push(g);
      }
    }
    this.refreshRainWindows();
    this.refreshLighting();
  }

  private sunWindowObjs: Phaser.GameObjects.GameObject[] = [];

  private refreshRainWindows(): void {
    const sun = this.def.rainWindows?.sunny?.() ?? false;
    for (const o of this.sunWindowObjs) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(sun);
    const on = this.def.rainWindows?.when() ?? false;
    AudioSystem.setMuffledRain(on);
    for (const o of this.rainWindowObjs) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(on);
  }

  private addSteam(): void {
    const pts = this.def.steam;
    if (!pts?.length) return;
    if (!this.textures.exists('fx-puff')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xffffff, 0.5).fillCircle(6, 6, 6).fillStyle(0xffffff, 0.8).fillCircle(5, 5, 3.5);
      g.generateTexture('fx-puff', 12, 12);
      g.destroy();
    }
    for (const p of pts) {
      this.add
        .particles(p.x / 3, p.y / 3, 'fx-puff', {
          x: { min: -3, max: 3 },
          speedY: { min: -14, max: -8 },
          speedX: { min: -3, max: 3 },
          lifespan: { min: 1400, max: 2200 },
          frequency: 260,
          scale: { start: 0.25, end: 0.9 },
          alpha: { start: 0.55, end: 0 },
        })
        .setDepth(p.y / 3 - 1);
    }
  }

  private addAmbient(kind?: 'dust' | 'fireflies' | 'petals'): void {
    if (!kind) return;
    const { widthPx: w, heightPx: h } = this.built;
    const zone = new Phaser.Geom.Rectangle(0, 0, w, h);
    const cfg: Record<string, Phaser.Types.GameObjects.Particles.ParticleEmitterConfig> = {
      dust: {
        speedX: { min: -4, max: 4 }, speedY: { min: -6, max: -1 }, lifespan: 6000, frequency: 260,
        scale: { min: 0.25, max: 0.5 }, alpha: { values: [0, 0.7, 0.7, 0] },
        tint: 0xfff2c4,
      },
      fireflies: {
        speedX: { min: -8, max: 8 }, speedY: { min: -8, max: 4 }, lifespan: 4200, frequency: 300,
        scale: { min: 0.4, max: 0.7 }, alpha: { values: [0, 1, 0.3, 1, 0] },
        tint: 0xffe066, blendMode: 'ADD',
      },
      petals: {
        speedX: { min: 6, max: 16 }, speedY: { min: 8, max: 18 }, lifespan: 7000, frequency: 420,
        rotate: { min: 0, max: 360 }, scale: { min: 0.5, max: 0.8 }, alpha: 0.9, tint: [0xf27a9b, 0xffc2d4, 0xffd75e],
      },
    };
    const key = kind === 'petals' ? 'fx-heart' : 'fx-spark';
    const em = this.add.particles(0, 0, key, { ...cfg[kind], emitZone: { type: 'random', source: zone } as never });
    em.setDepth(kind === 'dust' ? 90_000 : 150_000);
  }

  /** Hambúrguer completo montado a partir das camadas do minigame. */
  ensureBurgerTexture(): void {
    if (this.textures.exists('burger-full')) return;
    const layers = ['pao-baixo', 'carne', 'queijo', 'alface', 'pao-cima'].map((n) => this.textures.get(`burger-${n}`).getSourceImage() as HTMLImageElement);
    const w = 128;
    const step = 22;
    const h = layers[layers.length - 1].height + step * (layers.length - 1) + 10;
    const tex = this.textures.createCanvas('burger-full', w, h)!;
    const ctx = tex.getContext();
    layers.forEach((img, i) => ctx.drawImage(img, 0, h - img.height - i * step));
    tex.refresh();
  }

  /** Ao bater numa quina andando reto, desliza para o lado livre mais próximo. */
  private cornerAssist(): void {
    if (this.busy || !InputSystem.gameplayEnabled || this.player.scripted) return;
    const v = InputSystem.vector();
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const vertical = Math.abs(v.y) > 0.5 && Math.abs(v.x) < 0.3;
    const horizontal = Math.abs(v.x) > 0.5 && Math.abs(v.y) < 0.3;
    if (!vertical && !horizontal) return;
    const blocked = vertical ? (v.y > 0 ? body.blocked.down : body.blocked.up) : v.x > 0 ? body.blocked.right : body.blocked.left;
    if (!blocked) return;
    const free = (dx: number, dy: number) =>
      this.physics.overlapRect(body.x + dx, body.y + dy, body.width, body.height, false, true).length === 0 &&
      !this.built.collision.getTilesWithinWorldXY(body.x + dx, body.y + dy, body.width, body.height, { isColliding: true }).length;
    const step = vertical ? Math.sign(v.y) * 3 : Math.sign(v.x) * 3;
    for (let off = 1; off <= 14; off++) {
      for (const s of [-1, 1]) {
        const ok = vertical ? free(s * off, step) : free(step, s * off);
        if (ok) {
          const sp = 60;
          if (vertical) body.setVelocity(s * sp, body.velocity.y);
          else body.setVelocity(body.velocity.x, s * sp);
          return;
        }
      }
    }
  }

  /** Explosão de brilhos/corações (feedback de coleta, objetivo cumprido). */
  /** Paninho de limpar que acompanha um NPC com rotina (esfregando o balcão, com brilhinhos). */
  private addWipeCloth(npc: NPC): void {
    if (!this.textures.exists('fx-pano')) {
      const t = this.textures.createCanvas('fx-pano', 10, 7)!;
      const c = t.getContext();
      c.fillStyle = '#1e3a5c';
      c.fillRect(1, 0, 8, 7);
      c.fillRect(0, 1, 10, 5);
      c.fillStyle = '#e8f4ff';
      c.fillRect(1, 1, 8, 5);
      c.fillStyle = '#8cc2f0';
      c.fillRect(1, 3, 8, 1);
      c.fillRect(4, 1, 1, 5);
      t.refresh();
    }
    const cloth = this.add.image(npc.x, npc.y, 'fx-pano').setVisible(false);
    let sparkle = 0;
    const tick = (time: number, delta: number) => {
      if (!npc.active) {
        this.events.off('update', tick);
        cloth.destroy();
        return;
      }
      // paninho desenhado à mão desligado: fica só a pausa no balcão até chegar a folha dela limpando
      cloth.setVisible(false);
      if (!npc.wiping || !this.textures.exists('atendente-limpando')) return;
      // vai e volta em cima do balcão, um pouco acima da cabeça (atrás dela)
      cloth.setPosition(npc.x + Math.sin(time / 110) * 6, npc.headY - 6 + Math.cos(time / 220) * 1.5);
      cloth.setDepth(npc.depth - 1);
      sparkle -= delta;
      if (sparkle <= 0) {
        sparkle = 900;
        this.sparkleBurst(cloth.x, cloth.y - 2, 2);
      }
    };
    this.events.on('update', tick);
  }

  sparkleBurst(x: number, y: number, count = 10, hearts = false): void {
    for (let i = 0; i < count; i++) {
      const key = hearts || i % 4 === 0 ? 'fx-heart' : 'fx-spark';
      const img = this.add.image(x, y, key).setDepth(170_000).setScale(0.6);
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 14 + Math.random() * 16;
      this.tweens.add({
        targets: img,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist - 8,
        scale: { from: 1.3, to: 0.2 },
        alpha: { from: 1, to: 0 },
        duration: 650 + Math.random() * 350,
        ease: 'Cubic.easeOut',
        onComplete: () => img.destroy(),
      });
    }
  }

  /** Texto flutuante sobre um ponto (ex.: "✓ Objetivo!"). */
  floatText(x: number, y: number, text: string, color = '#ffd75e'): void {
    const t = this.add
      .text(x, y, text, { fontFamily: 'Pixelify Sans', fontSize: '20px', color, stroke: '#3a2a2e', strokeThickness: 5 })
      .setOrigin(0.5)
      .setScale(0.5)
      .setDepth(171_000);
    this.tweens.add({ targets: t, y: y - 18, alpha: { from: 1, to: 0 }, duration: 1300, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
  }

  private addNpcColliders(npc: NPC): void {
    // o Weng nunca bloqueia a Bella (ele mesmo desvia); os outros NPCs, sim
    // em cena de script (andando para um ponto) ninguém empurra ninguém
    this.physics.add.collider(this.player, npc, undefined, () => !npc.passThroughPlayer && npc.npcId !== 'weng' && npc.behavior !== 'scripted' && npc.behavior !== 'chore');
    // paredes só valem quando o NPC anda sozinho (cenas de script atravessam tudo)
    // só quem passeia sozinho colide com móveis; o Weng seguindo a Bella usa o caminho dela
    const walls = () => npc.behavior === 'wander' || npc.behavior === 'idle' || npc.behavior === 'follow' || npc.behavior === 'flee';
    this.physics.add.collider(npc, this.built.collision, undefined, walls);
    this.physics.add.collider(npc, this.built.solids, undefined, walls);
  }

  private registerPropInteractables(): void {
    for (const bp of this.built.props) {
      const { def, sprite } = bp;
      if (def.interact) {
        this.interactions.add({
          id: `prop:${def.id ?? def.key}:${def.tx}:${def.ty}`,
          rect: () => new Phaser.Geom.Rectangle(sprite.x - 2, sprite.y - sprite.displayHeight - 2, sprite.displayWidth + 4, sprite.displayHeight + 4),
          label: () => def.label ?? 'Ver',
          enabled: () => sprite.visible,
          run: () => this.runScript(def.interact!),
          anchor: () => ({ x: sprite.x + sprite.displayWidth / 2, y: sprite.y - sprite.displayHeight - 2 }),
        });
      }
      if (def.markerIf)
        this.addMarker(def.markerIf, () => ({ x: sprite.x + sprite.displayWidth / 2, y: sprite.y - sprite.displayHeight - 4 }), () => sprite.visible);
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
      if (h.markerIf) {
        const m = h.marker;
        const at = m ? { x: r.x + (m.x ?? 0.5) * r.width, y: r.y + (m.y ?? 0) * r.height - 4 } : { x: r.centerX, y: r.y - 4 };
        const side = m?.dir === 'down' ? undefined : m?.dir;
        // seta de lado: sempre um pouco pra dentro do mapa (senão o balanço corta na borda), com o nome do lugar
        if (side) at.x = Math.max(14, Math.min(this.built.widthPx - 14, at.x));
        this.addMarker(h.markerIf, () => at, () => true, side, side ? (h.label ?? '').replace(/[←→]/g, '').trim() : undefined);
      }
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

  private addMarker(cond: () => boolean, anchor: () => Vec2, visible: () => boolean, side?: 'left' | 'right', label?: string): void {
    const sprite = this.add.image(0, 0, 'fx-marker').setDepth(170_500).setVisible(false);
    // seta deitada apontando pro lado (ex.: "o restaurante é pra lá"), maior e com o nome do lugar
    let caption: Phaser.GameObjects.Text | undefined;
    if (side) {
      sprite.setRotation(side === 'right' ? -Math.PI / 2 : Math.PI / 2);
      if (label)
        caption = this.add
          .text(0, 0, label, { fontFamily: 'Pixelify Sans', fontSize: '18px', color: '#ffe9b0', stroke: '#3a2a2e', strokeThickness: 5 })
          .setOrigin(side === 'right' ? 1 : 0, 1)
          .setScale(0.5)
          .setDepth(170_500)
          .setVisible(false);
    }
    this.markers.push({ sprite, cond: () => visible() && cond(), anchor, side, caption });
  }

  /** Atores escondidos por cena (ctx.visible false): flags mudando no meio da cena não podem reexibi-los. */
  scriptHidden = new Set<Phaser.GameObjects.GameObject>();

  /** Reavalia visibleIf de props e NPCs (chamado quando flags mudam). */
  refreshVisibility(): void {
    this.refreshRainWindows();
    this.refreshLighting();
    for (const bp of this.built.props) {
      const vis = bp.def.visibleIf ? bp.def.visibleIf() : true;
      bp.sprite.setVisible(vis);
      if (bp.block) (bp.block.body as Phaser.Physics.Arcade.StaticBody).enable = vis;
    }
    for (const { npc, def } of this.npcs.values()) {
      if (this.scriptHidden.has(npc)) continue;
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
    const gen = this.gen;
    this.scriptRunning = true;
    InputSystem.push('script');
    UI.hud.setPrompt(null);
    try {
      await script(createScriptContext(this));
    } catch (err) {
      console.error(`Erro no script ${name}:`, err);
    } finally {
      // se o script levou pra outro mapa, o mapa novo já começou limpo: não mexe nele
      if (gen === this.gen) {
        UI.dialogue.close();
        InputSystem.pop('script');
        this.scriptRunning = false;
        this.syncPosition();
        SceneCheckpoints.settle();
      }
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
  notifyItem(id: string, qty: number, kicker = 'Você pegou'): Promise<void> {
    const def = ITEMS[id];
    AudioSystem.play('pickup');
    this.sparkleBurst(this.player.x, this.player.headY + 6, 14);
    return UI.itemPopup(def.name + (qty > 1 ? ` ×${qty}` : ''), def.description, def.icon, kicker);
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
    if (region === 'duque-de-caxias' && !QuestSystem.isDone('dq-e2')) {
      if (!QuestSystem.isActive('dq-e2')) QuestSystem.start('dq-e2');
      void this.goTo('piabeta-quintal', 'porta');
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
    this.cornerAssist();
    for (const { npc } of this.npcs.values()) {
      // em cena, quem tem rotina para e presta atenção
      if (npc.chore && (this.busy || !InputSystem.gameplayEnabled)) npc.holdChore(600);
      // quem trabalha andando (garçonete) espera a pessoa sair da frente, em vez de empurrar
      if (npc.chore) {
        const wg = this.npcs.get('weng')?.npc;
        if ([this.player, wg].some((a) => a && a.visible && Math.abs(a.x - npc.x) < 18 && Math.abs(a.y - npc.y) < 14)) npc.holdChore(500);
      }
      npc.update(time, delta);
    }
    // o Weng nunca fica "dentro" da Bella: se encavalar, ele vai pro lado livre mais próximo
    const wg = this.npcs.get('weng')?.npc;
    if (wg && wg.visible && wg.behavior === 'follow' && !this.busy) {
      const dx = Math.abs(wg.x - this.player.x);
      const dy = Math.abs(wg.y - this.player.y);
      this.wengOverlapMs = dx < 13 && dy < 9 ? this.wengOverlapMs + delta : 0;
      if (this.wengOverlapMs > 300) {
        const [ox, oy] = this.followerSpot();
        wg.setPosition(this.player.x + ox, this.player.y + oy);
        (wg.body as Phaser.Physics.Arcade.Body).reset(wg.x, wg.y);
        this.wengOverlapMs = 0;
      }
    }
    this.weather.update(this.cameras.main);
    this.updateBlackout();
    const br = this.def.bridge;
    if (br) {
      for (const a2 of [this.player, this.npcs.get('weng')?.npc]) {
        if (!a2) continue;
        const ox = a2.x * 3;
        const oy = a2.y * 3;
        const on = ox > br.x0 && ox < br.x1 && oy > br.y0 && oy < br.y1;
        a2.setLift(on ? (Math.sin(((ox - br.x0) / (br.x1 - br.x0)) * Math.PI) * br.h) / 3 : 0);
      }
    }
    // Um recorte só cobre quem está DE FATO atrás do objeto (pés entre o topo e a base).
    // Quem está mais ao norte (acima do objeto) passa por cima, sem corte.
    for (const o of this.built.overlays) {
      if (o.when) {
        const on = o.when();
        o.img.setVisible(on);
        if (!on) continue;
      }
      if (o.front) {
        o.img.setDepth(150_000);
        const behind = [this.player, this.npcs.get('weng')?.npc].some(
          (a) => a && a.visible && a.x + 16 > o.rect.x && a.x - 16 < o.rect.right && a.y > o.rect.y - 4 && a.headY < o.rect.bottom,
        );
        const target = behind ? 0.45 : 1;
        o.img.alpha += (target - o.img.alpha) * 0.2;
        continue;
      }
      let depth = o.base;
      for (const a of [this.player, this.npcs.get('weng')?.npc]) {
        if (!a || !a.visible) continue;
        const overlapX = a.x + 9 > o.rect.x && a.x - 9 < o.rect.right;
        if (!o.tall && overlapX && a.y < o.rect.y + 2) depth = Math.min(depth, a.y - 1);
      }
      o.img.setDepth(depth);
      if (o.fade) {
        // Stardew: copa fica transparente quando alguém está atrás dela
        const behind = [this.player, this.npcs.get('weng')?.npc].some(
          (a) =>
            a && a.visible && a.y < o.base && a.headY < o.rect.bottom && a.x + 10 > o.rect.x && a.x - 10 < o.rect.right &&
            (!o.fadeX || (a.x > o.fadeX[0] && a.x < o.fadeX[1])),
        );
        const target = behind ? 0.42 : 1;
        o.img.alpha += (target - o.img.alpha) * 0.2;
      }
    }
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
      const on = !this.busy && m.cond();
      m.sprite.setVisible(on);
      if (!on) m.caption?.setVisible(false);
      if (on) {
        const a = m.anchor();
        const bob = Math.abs(Math.sin(time / 260)) * 5;
        // fora da tela (ou cortado na borda): a setinha fica na beirada, apontando pra onde ir
        const v = this.cameras.main.worldView;
        const pad = 14;
        if (a.x < v.x + pad || a.x > v.right - pad || a.y - 10 < v.y + pad || a.y > v.bottom - pad) {
          const cx = Math.max(v.x + pad, Math.min(v.right - pad, a.x));
          const cy = Math.max(v.y + pad, Math.min(v.bottom - pad - 40, a.y - 10));
          const ang = Math.atan2(a.y - 10 - cy, a.x - cx);
          const push = Math.abs(Math.sin(time / 200)) * 3;
          m.sprite.setPosition(Math.round(cx + Math.cos(ang) * push), Math.round(cy + Math.sin(ang) * push));
          m.sprite.setRotation(ang - Math.PI / 2);
          m.sprite.setScale(1.35);
          m.caption?.setVisible(false);
          continue;
        }
        if (!m.side) m.sprite.setRotation(0);
        else m.sprite.setRotation(m.side === 'right' ? -Math.PI / 2 : Math.PI / 2);
        if (m.side) {
          // balança só pra dentro do mapa (nunca some na borda)
          const dir = m.side === 'right' ? 1 : -1;
          m.sprite.setPosition(Math.round(a.x - dir * (6 - bob)), Math.round(a.y));
          m.sprite.setScale(1.35 + Math.max(0, Math.sin(time / 260)) * 0.12);
          m.caption?.setPosition(Math.round(a.x + dir * 2), Math.round(a.y - 9)).setVisible(true);
        } else {
          m.sprite.setPosition(Math.round(a.x), Math.round(a.y - 2 - bob));
          m.sprite.setScale(1 + Math.max(0, Math.sin(time / 260)) * 0.12);
        }
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

    if (this.entering) return;
    this.checkExitsAndTriggers(delta);
    this.updatePrompt();
  }

  private checkExitsAndTriggers(delta: number): void {
    const feet = this.player.feet;
    this.blockedCooldown -= delta;

    for (const exit of this.def.exits ?? []) {
      if (exit.when && !exit.when()) continue;
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
      cur?.shaft.destroy();
      this.umbrellas.delete(who);
      return;
    }
    if (cur) {
      cur.mode = mode;
      return;
    }
    const key = who === 'weng' ? 'umbrella-weng' : 'umbrella-bella';
    const img = this.add.image(0, 0, key).setOrigin(0.5, 1);
    // arte HD: 1 pixel da arte = 1 pixel de tela; provisório (pequeno): ampliado
    img.setScale(img.width >= 64 ? 1 / RENDER_SCALE : PROP_SCALE);
    const shaft = this.add.image(0, 0, 'umbrella-shaft').setOrigin(0.5, 0);
    this.umbrellas.set(who, { img, shaft, mode });
  }

  private updateUmbrellas(): void {
    for (const [who, u] of this.umbrellas) {
      const a = this.findActor(who);
      if (!a || !a.visible) {
        u.img.setVisible(false);
        u.shaft.setVisible(false);
        continue;
      }
      // 'up': cobertura logo acima do cabelo, cabo atrás do personagem até a mão.
      // 'hide': guarda-chuva inclinado para a frente, como um escudo na frente do
      // rosto (na direção em que ela olha), cabo escondido atrás da cobertura.
      const dir = a.facing === 'right' ? 1 : a.facing === 'left' ? -1 : 0;
      const hide = u.mode === 'hide';
      const targetY = hide ? a.headY + a.bodyHeight * (dir ? 0.3 : 0.42) : a.headY + 8;
      const targetX = a.x + (hide ? dir * 2 : dir * 3 || 3);
      const targetRot = hide ? dir * 1.3 : 0;
      if (!u.img.visible || u.img.y === 0) {
        u.img.y = targetY;
        u.img.rotation = targetRot;
      }
      u.img.setVisible(true);
      u.img.y += (targetY - u.img.y) * 0.25;
      u.img.rotation += (targetRot - u.img.rotation) * 0.25;
      u.img.x = targetX;
      const hand = a.y - a.bodyHeight * 0.38;
      u.shaft.setVisible(!hide).setPosition(u.img.x, u.img.y - 1);
      u.shaft.setDisplaySize(1, Math.max(2, hand - u.img.y + 1));
      u.shaft.setDepth(a.depth - 1);
      u.img.setDepth(a.depth + 1);
    }
  }

  // ------------------------------------------------------------ util p/ scripts

  findActor(who: string): NPC | Player | null {
    if (this.wengLeads) {
      if (who === 'player' || who === 'weng') return this.player;
      if (who === 'bella') return this.npcs.get('weng')?.npc ?? null;
    }
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
