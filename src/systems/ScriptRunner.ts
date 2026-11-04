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
    },

    wait: (ms) => new Promise((r) => scene.time.delayedCall(ms, r)),
    fadeOut: (ms = 400) => UI.fade(1, ms),
    fadeIn: (ms = 400) => UI.fade(0, ms),
    shake: (ms = 250) => scene.cameras.main.shake(ms, 0.006),
    sfx: (name) => AudioSystem.play(name),
    toast: (text) => UI.toasts.show(text),
    weather: (kind) => scene.weather.set(kind),

    emote(who, emote: Emote) {
      const a = actor(who);
      if (!a) return Promise.resolve();
      const img = scene.add.image(a.x, a.y - a.displayHeight + 4, `emote-${emote}`).setDepth(160_000).setScale(0);
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
