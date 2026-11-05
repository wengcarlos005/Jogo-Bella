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
      const img = scene.add.image(a.x, a.headY - 8, `emote-${emote}`).setDepth(160_000).setScale(0);
      scene.tweens.add({ targets: img, scale: 1, duration: 160, ease: 'Back.Out' });
      return new Promise<void>((resolve) => {
        scene.time.delayedCall(850, () => {
          img.destroy();
          resolve();
        });
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
        a.behavior = wasFollowing ? 'follow' : 'idle';
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
    chapterCard: (k, t, s, b) => UI.chapterCard(k, t, s, b),
    unlockRegion(id) {
      if (!GameState.data.regionsUnlocked.includes(id)) GameState.data.regionsUnlocked.push(id);
    },

    prop(id, key, tx, ty, frame = 0, scale, depth) {
      scene.tempProps.get(id)?.destroy();
      if (key === 'burger-full') scene.ensureBurgerTexture();
      if (key === 'fx-novelo' && !scene.textures.exists('fx-novelo')) {
        // novelo de lã em pixel art (rosa com fios mais claros e uma pontinha solta)
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
            px(x, y, edge ? '#7a2346' : strand ? '#ffb3d0' : y < 4 ? '#f27aa8' : '#d9568a');
          }
        px(9, 7, '#d9568a');
        px(10, 8, '#d9568a');
        px(11, 8, '#f27aa8');
        px(2, 2, '#fff1f6');
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
      if (withWeng && couple && scene.textures.exists(couple.key)) {
        pl.setVisible(false);
        weng!.stopFollowing();
        weng!.behavior = 'scripted';
        weng!.setVisible(false);
        // mesma largura do banco pintado no cenário (senão aparecem "dois bancos")
        const BENCH_W: Record<string, number> = { 'bench-pq-ang-r': 150, 'bench-pq-front-lamp': 166, 'bench-pq-ang-l': 139, 'bench-pq-front-bin': 185, 'bench-rua': 166, 'bench-rua-bin': 185 };
        const sc = couple.w && BENCH_W[couple.key] ? couple.w / 3 / BENCH_W[couple.key] : 1 / RENDER_SCALE;
        pair = scene.add.sprite(couple.x / 3, couple.y / 3, couple.key, 0).setOrigin(0.5, 1).setScale(sc);
        pair.setDepth(couple.y / 3 + 60);
        let tick = 0;
        pairTimer = scene.time.addEvent({
          delay: 400,
          loop: true,
          callback: () => {
            tick++;
            // quadros: 0 normal, 1 piscadinha, 2 rindo, 3 ela encosta a cabeça nele
            const f = String(pair!.frame.name);
            if (tick % 18 === 0) pair!.setFrame(3);
            else if (f === '3' && tick % 18 === 6) pair!.setFrame(0);
            else if (f === '0' && tick % 11 === 0) {
              pair!.setFrame(2);
              scene.time.delayedCall(900, () => pair?.active && String(pair.frame.name) === '2' && pair.setFrame(0));
            } else if (f === '0' && tick % 7 === 0) {
              pair!.setFrame(1);
              scene.time.delayedCall(260, () => pair?.active && String(pair.frame.name) === '1' && pair.setFrame(0));
            }
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
      const glow = scene.add.image(midX, headY, 'fx-glow').setTint(0xff7aa8).setBlendMode(Phaser.BlendModes.ADD).setDepth(b.depth - 2).setAlpha(0).setDisplaySize(10, 10);
      const big = scene.add.image(midX, headY - 10, 'fx-bigheart').setDepth(b.depth - 1).setScale(0).setAlpha(0.9);
      tw({ targets: glow, alpha: 0.9, displayWidth: 120, displayHeight: 120, duration: 900, ease: 'Sine.easeOut' });
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
      if (who === 'weng' && on) {
        scene.attachFollower();
        return;
      }
      const a = actor(who);
      if (a instanceof NPC) {
        if (on) a.follow(scene.player);
        else a.stopFollowing();
      }
    },

    refresh: () => scene.refreshVisibility(),
    teleport: (mapId, spawn) => scene.goTo(mapId, spawn),
  };
  return ctx;
}
