import { EventBus } from '@/core/EventBus';
import { GameState } from '@/core/GameState';
import { QUESTS, type ObjectiveDef, type QuestDef } from '@/data/quests';
import { MemoryAlbumSystem } from './MemoryAlbumSystem';

function def(id: string): QuestDef {
  const q = QUESTS[id];
  if (!q) throw new Error(`Quest desconhecida: ${id}`);
  return q;
}

export const QuestSystem = {
  start(id: string, track = true): void {
    def(id);
    const quests = GameState.data.quests;
    if (quests[id]) return;
    quests[id] = { status: 'active', done: [] };
    if (track || !GameState.data.trackedQuest) GameState.data.trackedQuest = id;
    EventBus.emit('quest:started', id);
    EventBus.emit('state:changed');
  },

  isActive(id: string): boolean {
    return GameState.data.quests[id]?.status === 'active';
  },

  isDone(id: string): boolean {
    return GameState.data.quests[id]?.status === 'done';
  },

  isObjectiveDone(id: string, obj: string): boolean {
    return GameState.data.quests[id]?.done.includes(obj) ?? false;
  },

  /** Conclui um objetivo. Ignorado se a quest não estiver ativa. */
  complete(id: string, obj: string): void {
    const p = GameState.data.quests[id];
    const q = def(id);
    if (!p || p.status !== 'active' || p.done.includes(obj)) return;
    if (!q.objectives.some((o) => o.id === obj)) throw new Error(`Objetivo ${obj} não existe em ${id}`);
    p.done.push(obj);
    EventBus.emit('quest:objective', id, obj);
    const required = q.objectives.filter((o) => !o.optional);
    if (required.every((o) => p.done.includes(o.id))) this.finish(id);
    EventBus.emit('state:changed');
  },

  finish(id: string): void {
    const p = GameState.data.quests[id];
    const q = def(id);
    if (!p || p.status === 'done') return;
    p.status = 'done';
    EventBus.emit('quest:completed', id);
    if (q.rewardMemory) MemoryAlbumSystem.unlock(q.rewardMemory);
    if (GameState.data.trackedQuest === id) GameState.data.trackedQuest = null;
    if (q.next) this.start(q.next);
    if (!GameState.data.trackedQuest) {
      GameState.data.trackedQuest = this.active()[0]?.id ?? null;
    }
    EventBus.emit('state:changed');
  },

  /** Próximo objetivo obrigatório (na ordem) ainda não concluído. */
  currentObjective(id: string): ObjectiveDef | null {
    const p = GameState.data.quests[id];
    if (!p || p.status !== 'active') return null;
    return def(id).objectives.find((o) => !p.done.includes(o.id) && !o.optional) ?? null;
  },

  progress(id: string): { done: number; total: number } {
    const q = def(id);
    const p = GameState.data.quests[id];
    return { done: p?.done.length ?? 0, total: q.objectives.length };
  },

  active(): QuestDef[] {
    return Object.entries(GameState.data.quests)
      .filter(([, p]) => p.status === 'active')
      .map(([id]) => def(id))
      .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'principal' ? -1 : 1));
  },

  completed(): QuestDef[] {
    return Object.entries(GameState.data.quests)
      .filter(([, p]) => p.status === 'done')
      .map(([id]) => def(id));
  },

  def,
};
