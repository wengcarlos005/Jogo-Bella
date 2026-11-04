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
import Phaser from 'phaser';
import { CHAR_SCALE, RENDER_SCALE } from '@/config/gameConfig';

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

    give(item, qty = 1, silent = false) {
      InventorySystem.add(item, qty);
      if (!silent) scene.notifyItem(item, qty);
    },
    has: (item, qty = 1) => InventorySystem.has(item, qty),
    take: (item, qty = 1) => InventorySystem.remove(item, qty),
    count: (item) => InventorySystem.count(item),

    startQuest: (id) => QuestSystem.start(id),
    objective(q, o) {
      const before = QuestSystem.isObjectiveDone(q, o);
      QuestSystem.complete(q, o);
      if (!before && QuestSystem.isObjectiveDone(q, o) && QuestSystem.isActive(q)) AudioSystem.play('confirm');
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
      // jogador: tween simples com animação
      const dist = Math.hypot(p.x - a.x, p.y - a.y);
      a.faceTowards(p.x, p.y);
      a.anims.play(`${a.charKey}-walk-${a.facing}`, true);
      await new Promise<void>((resolve) =>
        scene.tweens.add({ targets: a, x: p.x, y: p.y, duration: (dist / speed) * 1000, onComplete: () => resolve() }),
      );
      a.face(a.facing);
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
      return new Promise((r) => scene.time.delayedCall(ms, r));
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

    prop(id, key, tx, ty, frame = 0) {
      scene.tempProps.get(id)?.destroy();
      const img = scene.add.image(tx * 16, ty * 16, key, frame).setOrigin(0.5, 1);
      if (img.height >= 64) img.setScale((1 / RENDER_SCALE) * CHAR_SCALE * 0.9);
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
