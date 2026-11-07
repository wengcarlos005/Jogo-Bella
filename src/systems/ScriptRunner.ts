import type { GameScene } from '@/scenes/GameScene';
import type { ScriptContext, Emote } from '@/core/script';
import type { Direction } from '@/core/types';
import { GameState } from '@/core/GameState';
import { InventorySystem } from './InventorySystem';
import { QuestSystem } from './QuestSystem';
import { MemoryAlbumSystem } from './MemoryAlbumSystem';
import { AudioSystem } from './AudioSystem';
import { UI } from '@/ui/UIManager';
import { NPC } from '@/entities/NPC';
import { InputSystem } from './InputSystem';
import { ITEMS } from '@/data/items';
import { OUTFITS } from '@/data/outfits';
import Phaser from 'phaser';
import { RENDER_SCALE } from '@/config/gameConfig';

const DIRS: Direction[] = ['down', 'up', 'left', 'right'];

/** Implementa a API de scripts (diálogos/cutscenes) sobre a GameScene. */
/** Emotes em pixel art (desenhados uma vez). X = contorno, letras = cores. */
const EMOTE_ART: Record<string, { rows: string[]; pal: Record<string, string> }> = {
  heart: {
    rows: [
      '..XXX...XXX..',
      '.XwwrX.XrrrX.',
      'XwwrrrXrrrrrX',
      'XwrrrrrrrrrrX',
      'XrrrrrrrrrrdX',
      'XrrrrrrrrrrdX',
      '.XrrrrrrrrdX.',
      '..XrrrrrrdX..',
      '...XrrrrdX...',
      '....XrrdX....',
      '.....XdX.....',
      '......X......',
    ],
    pal: { X: '#5a1030', r: '#ff4d7d', w: '#ffd3e0', d: '#d12f60' },
  },
  mini: {
    rows: ['.X.X.', 'XrXrX', 'XrrrX', '.XrX.', '..X..'],
    pal: { X: '#5a1030', r: '#ff8fb0' },
  },
  exclaim: {
    rows: ['.XXXX.', 'XwyyyX', 'XyyyyX', 'XyyyoX', '.XyyX.', '.XyoX.', '.XyoX.', '..XX..', '.XXXX.', 'XyyyoX', '.XXXX.'],
    pal: { X: '#5a2a08', y: '#ffd23f', w: '#fff6c2', o: '#e89a12' },
  },
  question: {
    rows: ['.XXXXX.', 'XwbbbbX', 'XbXXXbX', '.X..XbX', '...XbX.', '..XbX..', '..XbX..', '..XX...', '.......', '..XX...', '.XbbX..', '..XX...'],
    pal: { X: '#142a5a', b: '#5aa0ff', w: '#d6e8ff' },
  },
  note: {
    rows: ['....XXXX', '....XppX', '....XpX.', '....XpX.', '....XpX.', '.XXXXpX.', 'XpppppX.', 'XwpppdX.', '.XXXXX..'],
    pal: { X: '#2e1450', p: '#b07aff', w: '#e8d8ff', d: '#7c46d6' },
  },
  sweat: {
    rows: ['...X...', '..XbX..', '.XbbbX.', '.XwbbX.', 'XwbbbbX', 'XbbbbdX', 'XbbbbdX', '.XbbdX.', '..XXX..'],
    pal: { X: '#123a5a', b: '#6cc6ff', w: '#e0f6ff', d: '#3a8ed0' },
  },
};

function ensureEmotes(scene: GameScene): void {
  if (scene.textures.exists('emote2-heart')) return;
  for (const [name, { rows, pal }] of Object.entries(EMOTE_ART)) {
    const w = Math.max(...rows.map((r) => r.length));
    const t = scene.textures.createCanvas(`emote2-${name}`, w, rows.length)!;
    const c = t.getContext();
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const col = pal[ch];
        if (!col) return;
        c.fillStyle = col;
        c.fillRect(x, y, 1, 1);
      }),
    );
    t.refresh();
  }
}

export function createScriptContext(scene: GameScene): ScriptContext {
  const actor = (who: string) => {
    const a = scene.findActor(who);
    if (!a) console.warn(`Ator não encontrado: ${who}`);
    return a;
  };

  const ctx: ScriptContext = {
    get mapId() {
      return scene.def.id;
    },

    say: (speaker, text) => UI.dialogue.say(speaker, text),
    narrate: (text) => UI.dialogue.say('narrador', text),
    choose: (speaker, text, options) => UI.dialogue.choose(speaker, text, options),

    flag: (key) => GameState.is(key),
    setFlag: (key, value = true) => GameState.setFlag(key, value),

    async wardrobe(ids) {
      const options = ids
        .map((id) => OUTFITS.bella[id])
        .filter(Boolean)
        .map((o) => ({ id: o.id, name: o.name, description: o.description ?? '', texture: o.texture }));
      const id = await UI.wardrobe('Guarda-roupa', options, options[0]?.id);
      GameState.data.regionOutfits[scene.def.region] = id;
      scene.dressPlayer();
      return id;
    },

    async showItem(item, kicker, name, description) {
      AudioSystem.play('pickup');
      await UI.itemPopup(name, description, ITEMS[item]?.icon ?? item, kicker);
    },

    async give(item, qty = 1, silent = false, kicker = 'Você pegou') {
      InventorySystem.add(item, qty);
      if (!silent) await scene.notifyItem(item, qty, kicker);
    },
    has: (item, qty = 1) => InventorySystem.has(item, qty),
    take: (item, qty = 1) => InventorySystem.remove(item, qty),
    count: (item) => InventorySystem.count(item),

    startQuest: (id) => QuestSystem.start(id),
    objective(q, o) {
      const before = QuestSystem.isObjectiveDone(q, o);
      QuestSystem.complete(q, o);
      if (!before && QuestSystem.isObjectiveDone(q, o)) {
        AudioSystem.play('confirm');
        scene.sparkleBurst(scene.player.x, scene.player.headY + 4, 12);
        scene.floatText(scene.player.x, scene.player.headY - 6, '✓');
      }
    },
    questActive: (id) => QuestSystem.isActive(id),
    objectiveDone: (q, o) => QuestSystem.isObjectiveDone(q, o),
    async memory(id) {
      MemoryAlbumSystem.unlock(id);
      await scene.showMemoryNow(id);
    },

    wait: (ms) => new Promise((r) => scene.time.delayedCall(ms, r)),
    fadeOut: (ms = 400, color) => UI.fade(1, ms, color),
    fadeIn: (ms = 400) => UI.fade(0, ms),
    shake: (ms = 250) => scene.cameras.main.shake(ms, 0.006),
    sfx: (name) => AudioSystem.play(name),
    toast: (text) => UI.toasts.show(text),
    weather: (kind) => scene.weather.set(kind),

    emote(who, emote: Emote) {
      const a = actor(who);
      if (!a) return Promise.resolve();
      ensureEmotes(scene);
      // símbolo em pixel art com contorno (sem balão): pula, flutua e some
      const y0 = a.headY - 6;
      const img = scene.add.image(a.x + 6, y0, `emote2-${emote}`).setOrigin(0.5, 1).setDepth(160_000).setScale(0);
      scene.tweens.add({ targets: img, scale: 1, duration: 220, ease: 'Back.Out' });
      scene.tweens.add({ targets: img, y: y0 - 5, duration: 900, ease: 'Sine.Out' });
      if (emote === 'heart') {
        scene.tweens.add({ targets: img, scale: 1.18, duration: 160, delay: 260, yoyo: true, repeat: 1, ease: 'Sine.InOut' });
        for (let k = 0; k < 3; k++) {
          const m = scene.add.image(a.x + 6, y0 - 6, 'emote2-mini').setDepth(160_001).setAlpha(0);
          scene.tweens.add({
            targets: m,
            alpha: { from: 1, to: 0 },
            x: a.x + 6 + (k - 1) * 9,
            y: y0 - 16 - k * 3,
            duration: 700,
            delay: 200 + k * 120,
            ease: 'Sine.Out',
            onComplete: () => m.destroy(),
          });
        }
      } else if (emote === 'exclaim') {
        scene.tweens.add({ targets: img, angle: { from: -12, to: 12 }, duration: 80, yoyo: true, repeat: 2 });
      } else if (emote === 'note') {
        scene.tweens.add({ targets: img, angle: { from: -10, to: 10 }, duration: 260, yoyo: true, repeat: 1, ease: 'Sine.InOut' });
      }
      return new Promise<void>((resolve) => {
        scene.time.delayedCall(700, () => scene.tweens.add({ targets: img, alpha: 0, duration: 200, onComplete: () => img.destroy() }));
        scene.time.delayedCall(900, () => resolve());
      });
    },

    face(who, dir) {
      const a = actor(who);
      if (!a) return;
      if (DIRS.includes(dir as Direction)) a.face(dir as Direction);
      else {
        const t = actor(dir);
        if (t) a.faceTowards(t.x, t.y);
      }
    },

    async move(who, tx, ty, speed = 55) {
      const a = actor(who);
      if (!a) return;
      const p = scene.tile(tx, ty);
      if (a instanceof NPC) {
        const wasFollowing = a.behavior === 'follow';
        await a.walkTo(p.x, p.y, speed);
        // se no meio da caminhada a cena mandou ele seguir a Bella, não desfaz isso
        if (a.behavior === 'scripted') a.behavior = wasFollowing ? 'follow' : 'idle';
        return;
      }
      // jogador: tween com animação de caminhada na velocidade certa
      const dist = Math.hypot(p.x - a.x, p.y - a.y);
      if (dist < 0.5) return;
      const pl = scene.player;
      pl.scripted = true;
      (pl.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      a.faceTowards(p.x, p.y);
      a.anims.play(`${a.charKey}-walk-${a.facing}`, true);
      a.anims.timeScale = Math.max(0.45, speed / 70);
      await new Promise<void>((resolve) =>
        scene.tweens.add({ targets: a, x: p.x, y: p.y, duration: (dist / speed) * 1000, onComplete: () => resolve() }),
      );
      (pl.body as Phaser.Physics.Arcade.Body).reset(a.x, a.y);
      a.anims.timeScale = 1;
      a.face(a.facing);
      pl.scripted = false;
    },

    place(who, tx, ty, facing) {
      const a = actor(who);
      if (!a) return;
      const p = scene.tile(tx, ty);
      a.setPosition(p.x, p.y);
      (a.body as Phaser.Physics.Arcade.Body).reset(p.x, p.y);
      // NPC que passeia: o novo lugar vira o "canto" dele (não volta atravessando a casa)
      if (a instanceof NPC) a.home.set(p.x, p.y);
      if (facing) a.face(facing);
      if (a === scene.player) scene.player.trail.length = 0;
    },

    burger: (opts) => UI.burger(opts),
    acai: (opts) => UI.acai(opts),
    cards: (opts) => UI.cards(opts),
    grill: (opts) => UI.grill(opts),
    phone: (opts, msgs) => UI.phone(opts, msgs),
    kissGame: () => UI.kissGame(),
    pickItem: (prompt) => UI.pickItem(prompt),
    uberRide: (opts) => UI.uberRide(opts),

    focus(tx, ty, zoom = 1.4, ms = 900) {
      const cam = scene.cameras.main;
      const p = scene.tile(tx, ty);
      cam.stopFollow();
      cam.pan(p.x, p.y - 12, ms, 'Sine.easeInOut');
      cam.zoomTo(scene.baseZoom * zoom, ms, 'Sine.easeInOut');
      // garante o enquadramento final (respeitando as bordas do mapa)
      return new Promise((r) => scene.time.delayedCall(ms + 20, () => { cam.centerOn(p.x, p.y - 12); r(undefined); }));
    },

    scale(who, factor) {
      const a = actor(who);
      if (a) a.setScale(a.baseScale * factor);
    },

    pose(who, key, frame = 0) {
      const a = actor(who);
      if (a) a.pose(key, frame);
    },

    frame(tx, ty, ms = 500) {
      const cam = scene.cameras.main;
      const p = scene.tile(tx, ty);
      cam.stopFollow();
      // a caixa de diálogo cobre ~30% de baixo da tela: deixa a câmera descer além do mapa
      // (essa faixa vazia fica escondida atrás da caixa) e centraliza o grupo na parte visível
      const b = cam.getBounds();
      scene.data.set('camBounds', b);
      cam.setBounds(b.x, b.y, b.width, b.height + 90);
      const cy = p.y + 14;
      if (ms <= 0) cam.centerOn(p.x, cy);
      else cam.pan(p.x, cy, ms, 'Sine.easeInOut');
      return new Promise((r) => scene.time.delayedCall(Math.max(ms, 0) + 20, () => { cam.centerOn(p.x, cy); r(undefined); }));
    },

    unfocus(ms = 700) {
      const cam = scene.cameras.main;
      const saved = scene.data.get('camBounds') as Phaser.Geom.Rectangle | undefined;
      if (saved) {
        cam.setBounds(saved.x, saved.y, saved.width, saved.height);
        scene.data.remove('camBounds');
      }
      cam.zoomTo(scene.baseZoom, ms, 'Sine.easeInOut');
      cam.pan(scene.player.x, scene.player.y - 8, ms, 'Sine.easeInOut');
      return new Promise((r) =>
        scene.time.delayedCall(ms, () => {
          cam.startFollow(scene.player, true, 0.14, 0.14, 0, -8);
          r(undefined);
        }),
      );
    },

    letterbox: (on) => UI.letterbox(on),

    hearts(who, count = 10) {
      const a = actor(who);
      if (!a) return;
      for (let i = 0; i < count; i++) {
        const img = scene.add.image(a.x + Phaser.Math.Between(-10, 10), a.headY + 4, 'fx-heart').setDepth(160_000);
        scene.tweens.add({
          targets: img,
          x: img.x + Phaser.Math.Between(-24, 24),
          y: img.y - Phaser.Math.Between(20, 50),
          alpha: 0,
          scale: { from: 1, to: 1.6 },
          duration: Phaser.Math.Between(900, 1600),
          delay: i * 70,
          onComplete: () => img.destroy(),
        });
      }
    },

    travel: (label, icon, ms) => UI.travel(label, icon, ms),
    chapterCard: (k, t, s, b, r) => UI.chapterCard(k, t, s, b, r),
    unlockRegion(id) {
      if (!GameState.data.regionsUnlocked.includes(id)) GameState.data.regionsUnlocked.push(id);
    },

    prop(id, key, tx, ty, frame = 0, scale, depth) {
      scene.tempProps.get(id)?.destroy();
      if (key === 'burger-full') scene.ensureBurgerTexture();
      if (key === 'fx-novelo' && !scene.textures.exists('fx-novelo')) {
        // novelo de lã em pixel art (azul, igual ao do cesto, com fios mais claros e uma pontinha solta)
        const t = scene.textures.createCanvas('fx-novelo', 12, 11)!;
        const c = t.getContext();
        const px = (x: number, y: number, col: string) => {
          c.fillStyle = col;
          c.fillRect(x, y, 1, 1);
        };
        for (let y = 0; y < 10; y++)
          for (let x = 0; x < 10; x++) {
            const d = Math.hypot(x - 4.5, y - 4.5);
            if (d > 4.6) continue;
            const edge = d > 3.7;
            const strand = (x + y) % 3 === 0 || (x - y + 9) % 4 === 0;
            px(x, y, edge ? '#1c3a78' : strand ? '#a8d4ff' : y < 4 ? '#5aa0ff' : '#3a78d8');
          }
        px(9, 7, '#3a78d8');
        px(10, 8, '#3a78d8');
        px(11, 8, '#5aa0ff');
        px(2, 2, '#eef6ff');
        t.refresh();
      }
      const img = scene.add.image(tx * 16, ty * 16, key, frame).setOrigin(0.5, 1);
      if (scale !== undefined) {
        img.setScale(scale);
        img.setDepth(depth ?? img.y);
        scene.tempProps.set(id, img);
        return;
      }
      // carro HD (quadro de 192px): mesma escala dos carros pintados no cenário (~84px lógicos)
      if (img.height >= 64) img.setScale(0.47);
      img.setDepth(img.y);
      scene.tempProps.set(id, img);
    },
    moveProp(id, tx, ty, ms) {
      const img = scene.tempProps.get(id);
      if (!img) return Promise.resolve();
      return new Promise((r) =>
        scene.tweens.add({ targets: img, x: tx * 16, y: ty * 16, duration: ms, ease: 'Sine.easeInOut', onUpdate: () => img.setDepth(img.y), onComplete: () => r() }),
      );
    },
    removeProp(id) {
      scene.tempProps.get(id)?.destroy();
      scene.tempProps.delete(id);
    },
    illustration: (key, lines) => UI.illustration(key, lines),
    backdrop: (key, rainy) => UI.backdrop(key, rainy),

    nerves(value, message) {
      const v = Math.max(0, Math.min(100, Math.round(value)));
      const before = Number(GameState.getFlag<number>('nervosismo') ?? 0);
      GameState.setFlag('nervosismo', v);
      if (message) UI.toasts.show(message);
      else if (v < before) UI.toasts.show(v === 0 ? 'A Bella se acalmou ♥' : 'A Bella está mais calma');
      if (v < before) ctx.hearts('bella', v === 0 ? 14 : 5);
    },

    umbrella(who, mode) {
      scene.setUmbrella(who === 'player' ? 'bella' : who, mode);
    },

    async sit(seatX, seatY, lines, couple) {
      const sx = seatX / 3;
      const sy = seatY / 3;
      const weng = scene.npcs.get('weng')?.npc;
      const withWeng = !!weng && weng.visible && weng.behavior === 'follow';
      await UI.fade(1, 220);
      const pl = scene.player;
      pl.scripted = true;
      (pl.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      // Com o Weng junto e arte do casal no banco: um sprite só, cobrindo o banco pintado.
      let pair: Phaser.GameObjects.Sprite | null = null;
      let pairTimer: Phaser.Time.TimerEvent | null = null;
      let hiddenBench: Phaser.GameObjects.Image[] = [];
      if (withWeng && couple && scene.textures.exists(couple.key)) {
        pl.setVisible(false);
        weng!.stopFollowing();
        weng!.behavior = 'scripted';
        weng!.setVisible(false);
        // mesma largura do banco pintado no cenário (senão aparecem "dois bancos")
        const BENCH_W: Record<string, number> = { 'bench-pq-ang-r': 150, 'bench-pq-front-lamp': 166, 'bench-pq-ang-l': 139, 'bench-pq-front-bin': 185, 'bench-rua': 166, 'bench-rua-bin': 185 };
        const sc = couple.w && BENCH_W[couple.key] ? couple.w / 3 / BENCH_W[couple.key] : 1 / RENDER_SCALE;
        pair = scene.add.sprite(couple.x / 3, couple.y / 3, couple.key, 0).setOrigin(0.5, 1).setScale(sc);
        // banco solto (objeto da folha) embaixo do casal: some enquanto eles estão sentados
        hiddenBench = scene.built.overlays.filter((o) => o.img.texture.key.includes('banco') && o.img.visible && o.rect.contains(couple.x / 3, couple.y / 3 - 4)).map((o) => o.img);
        hiddenBench.forEach((img) => img.setVisible(false));
        pair.setDepth(couple.y / 3 + 60);
        // as poses da folha foram desenhadas separadas (cabelo muda de um quadro pro outro):
        // fica a pose principal, respirando de leve, com coraçõezinhos subindo de vez em quando
        pairTimer = scene.time.addEvent({
          delay: 2600,
          loop: true,
          callback: () => {
            if (!pair?.active) return;
            ensureEmotes(scene);
            const m = scene.add.image(pair.x + Phaser.Math.Between(-6, 6), pair.y - pair.displayHeight * 0.78, 'emote2-mini').setDepth(pair.depth + 1).setAlpha(0);
            scene.tweens.add({ targets: m, alpha: { from: 1, to: 0 }, y: m.y - 14, duration: 1300, ease: 'Sine.Out', onComplete: () => m.destroy() });
          },
        });
        pl.setPosition(couple.x / 3 - 10, couple.y / 3 + 4);
        weng!.setPosition(couple.x / 3 + 10, couple.y / 3 + 4);
      } else {
        pl.sit(withWeng ? sx - 11 : sx, sy, 'down');
        if (withWeng) {
          weng!.stopFollowing();
          weng!.behavior = 'scripted';
          weng!.sit(sx + 11, sy, 'down');
        }
      }
      await UI.fade(0, 260);
      AudioSystem.play('confirm');
      scene.sparkleBurst(pl.x, pl.headY + 6, 6, true);
      if (lines) for (const [who, text] of lines) await UI.dialogue.say(who, text);
      UI.dialogue.close();
      UI.toasts.show('Ande ou aperte E para levantar');
      // espera levantar
      await new Promise<void>((resolve) => {
        const done = () => {
          InputSystem.off('script:interact', done);
          scene.events.off('update', check);
          resolve();
        };
        const check = () => {
          const v = InputSystem.vector();
          if (v.x !== 0 || v.y !== 0) done();
        };
        InputSystem.on('script:interact', done);
        scene.events.on('update', check);
      });
      if (pair) {
        pairTimer?.remove();
        pair.destroy();
        hiddenBench.forEach((img) => img.setVisible(true));
        pl.setVisible(true);
        weng!.setVisible(true);
      }
      pl.standUp();
      const back = pair ? 0 : 12;
      if (!pair) pl.setPosition(pl.x, sy + back);
      // levanta na frente do banco: desce até achar chão livre (nunca dentro do banco)
      const freeY = (x: number, y: number) => {
        const solid = (yy: number) => {
          let hit = false;
          scene.physics.world.staticBodies.iterate((b) => {
            const sb = b as Phaser.Physics.Arcade.StaticBody;
            if (!hit && sb.enable && x + 5 > sb.x && x - 5 < sb.x + sb.width && yy + 1 > sb.y && yy - 5 < sb.y + sb.height) hit = true;
            return true;
          });
          return hit;
        };
        for (let d = 0; d <= 48; d += 2) if (!solid(y + d)) return y + d;
        return y;
      };
      pl.setPosition(pl.x, freeY(pl.x, pl.y));
      (pl.body as Phaser.Physics.Arcade.Body).reset(pl.x, pl.y);
      pl.face('down');
      pl.scripted = false;
      if (withWeng) {
        weng!.standUp();
        weng!.setPosition(weng!.x, freeY(weng!.x, pair ? pl.y : sy + back));
        (weng!.body as Phaser.Physics.Arcade.Body).reset(weng!.x, weng!.y);
        pl.trail.length = 0;
        weng!.follow(pl);
      }
    },

    async kiss() {
      const b = scene.player;
      const w = scene.npcs.get('weng')?.npc;
      if (!w) return;
      const tw = (cfg: Phaser.Types.Tweens.TweenBuilderConfig) => new Promise<void>((r) => scene.tweens.add({ ...cfg, onComplete: () => r() }));
      const midX = (b.x + w.x) / 2;
      const headY = Math.min(b.headY, w.headY) + 8;
      UI.dialogue.close();
      if (!scene.textures.exists('fx-bigheart')) {
        const t = scene.textures.createCanvas('fx-bigheart', 96, 88)!;
        const c = t.getContext();
        const heart = (s: number, color: string) => {
          c.save();
          c.translate(48, 46);
          c.scale(s, s);
          c.beginPath();
          c.moveTo(0, 30);
          c.bezierCurveTo(-46, 0, -30, -40, 0, -18);
          c.bezierCurveTo(30, -40, 46, 0, 0, 30);
          c.fillStyle = color;
          c.fill();
          c.restore();
        };
        heart(1, '#ff6f9a');
        heart(0.82, '#ff8fb1');
        c.fillStyle = 'rgba(255,255,255,0.7)';
        c.beginPath();
        c.ellipse(32, 30, 7, 5, -0.6, 0, Math.PI * 2);
        c.fill();
        t.refresh();
      }
      // 1) o mundo desacelera: chuva mais lenta, coração batendo
      scene.weather.slow(true);
      AudioSystem.play('memory');
      // 2) chegam mais perto, devagar; a Bella fica na pontinha dos pés
      const k = b.scaleX / b.baseScale;
      const gap = 13 * k;
      await Promise.all([
        tw({ targets: b, x: midX - gap - 3, duration: 1100, ease: 'Sine.easeInOut' }),
        tw({ targets: w, x: midX + gap + 3, duration: 1100, ease: 'Sine.easeInOut' }),
      ]);
      // ela na pontinha dos pés, ele se inclina pra ela (sem encolher, sem nariz com nariz)
      await Promise.all([
        tw({ targets: b, y: b.y - 1.5, x: midX - gap, angle: 3, duration: 650, ease: 'Sine.easeOut' }),
        tw({ targets: w, x: midX + gap, angle: -5, duration: 650, ease: 'Sine.easeOut' }),
      ]);
      // olhos fechados
      b.face('right');
      w.face('left');
      if (scene.textures.exists('bella-kiss')) b.setTexture('bella-kiss');
      if (scene.textures.exists('weng-kiss')) w.setTexture('weng-kiss');
      // 3) o beijo: brilho rosa e um coração grande que pulsa atrás dos dois
      // por cima de tudo (o telhado do coreto fica por cima dos dois, mas não do coração)
      const glow = scene.add.image(midX, headY, 'fx-glow').setTint(0xff7aa8).setBlendMode(Phaser.BlendModes.ADD).setDepth(160_000).setAlpha(0).setDisplaySize(10, 10);
      const big = scene.add.image(midX, headY - 22, 'fx-bigheart').setDepth(160_001).setScale(0).setAlpha(0.9);
      tw({ targets: glow, alpha: 0.55, displayWidth: 90, displayHeight: 90, duration: 900, ease: 'Sine.easeOut' });
      await tw({ targets: big, scale: 0.55, duration: 700, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: big, scale: 0.62, duration: 380, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
      // 4) corações subindo em espiral + brilhos
      for (let i = 0; i < 26; i++) {
        const img = scene.add.image(midX + Phaser.Math.Between(-6, 6), headY, i % 3 ? 'fx-heart' : 'fx-spark').setDepth(170_000).setScale(0.4);
        const ang = (i / 26) * Math.PI * 4;
        scene.tweens.add({
          targets: img,
          x: midX + Math.cos(ang) * Phaser.Math.Between(18, 40),
          y: headY - Phaser.Math.Between(30, 70),
          scale: { from: 0.4, to: 1.4 },
          alpha: { from: 1, to: 0 },
          delay: i * 70,
          duration: 1500,
          ease: 'Sine.easeOut',
          onComplete: () => img.destroy(),
        });
      }
      scene.cameras.main.zoomTo(scene.cameras.main.zoom * 1.12, 2600, 'Sine.easeInOut');
      await new Promise((r) => scene.time.delayedCall(2600, r));
      scene.weather.slow(false);
      glow.destroy();
      big.destroy();
      b.setAngle(0);
      w.setAngle(0);
      b.setTexture(b.charKey);
      w.setTexture(w.charKey);
      b.face('right');
      w.face('left');
    },

    hasArt: (key) => scene.textures.exists(key),

    playerTile: () => ({ x: (scene.player.x - 8) / 16, y: (scene.player.y + 1) / 16 - 1 }),

    visible(who, on) {
      actor(who)?.setVisible(on);
    },

    outfit(id) {
      GameState.data.regionOutfits[scene.def.region] = id;
      scene.dressPlayer();
    },

    follow(who, on) {
      // o acompanhante é sempre o NPC 'weng' (quando o Weng lidera, ele tem a cara da Bella)
      const companion = who === 'weng' || (who === 'bella' && scene.wengLeads);
      if (companion && on) {
        scene.attachFollower();
        return;
      }
      const a = companion ? scene.npcs.get('weng')?.npc : actor(who);
      if (a instanceof NPC) {
        if (on) a.follow(scene.player);
        else a.stopFollowing();
      }
    },

    lead: (who) => scene.setLead(who === 'weng'),
    refresh: () => scene.refreshVisibility(),
    teleport: (mapId, spawn) => scene.goTo(mapId, spawn),
  };
  return ctx;
}
