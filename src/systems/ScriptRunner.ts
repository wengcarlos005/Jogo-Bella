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
      if (facing) a.face(facing);
      if (a === scene.player) scene.player.trail.length = 0;
    },

    burger: (opts) => UI.burger(opts),

    focus(tx, ty, zoom = 1.4, ms = 900) {
      const cam = scene.cameras.main;
      const p = scene.tile(tx, ty);
      cam.stopFollow();
      cam.pan(p.x, p.y - 12, ms, 'Sine.easeInOut');
      cam.zoomTo(RENDER_SCALE * zoom, ms, 'Sine.easeInOut');
      // garante o enquadramento final (respeitando as bordas do mapa)
      return new Promise((r) => scene.time.delayedCall(ms + 20, () => { cam.centerOn(p.x, p.y - 12); r(undefined); }));
    },

    unfocus(ms = 700) {
      const cam = scene.cameras.main;
      cam.zoomTo(RENDER_SCALE, ms, 'Sine.easeInOut');
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
    backdrop: (key) => UI.backdrop(key),

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

    async sit(seatX, seatY, lines) {
      const sx = seatX / 3;
      const sy = seatY / 3;
      const weng = scene.npcs.get('weng')?.npc;
      const withWeng = !!weng && weng.visible && weng.behavior === 'follow';
      await UI.fade(1, 220);
      const pl = scene.player;
      pl.scripted = true;
      (pl.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      pl.sit(withWeng ? sx - 9 : sx, sy, 'down');
      if (withWeng) {
        weng!.stopFollowing();
        weng!.behavior = 'scripted';
        weng!.sit(sx + 9, sy, 'down');
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
      pl.standUp();
      const back = 12;
      pl.setPosition(pl.x, sy + back);
      (pl.body as Phaser.Physics.Arcade.Body).reset(pl.x, pl.y);
      pl.face('down');
      pl.scripted = false;
      if (withWeng) {
        weng!.standUp();
        weng!.setPosition(weng!.x, sy + back);
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
      await Promise.all([
        tw({ targets: b, x: midX - 13, duration: 1100, ease: 'Sine.easeInOut' }),
        tw({ targets: w, x: midX + 13, duration: 1100, ease: 'Sine.easeInOut' }),
      ]);
      await Promise.all([
        tw({ targets: b, y: b.y - 2, x: midX - 10.5, duration: 600, ease: 'Sine.easeOut' }),
        tw({ targets: w, x: midX + 10.5, scaleY: w.scaleY * 0.985, duration: 600, ease: 'Sine.easeOut' }),
      ]);
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
    },

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
