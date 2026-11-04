import { EventBus } from '@/core/EventBus';
import { GameState } from '@/core/GameState';
import { MEMORIES, type MemoryDef } from '@/data/memories';
import type { RegionId } from '@/core/types';

export const MemoryAlbumSystem = {
  unlock(id: string): boolean {
    if (!MEMORIES.some((m) => m.id === id)) throw new Error(`Memória desconhecida: ${id}`);
    if (GameState.data.memories.includes(id)) return false;
    GameState.data.memories.push(id);
    EventBus.emit('memory:unlocked', id);
    EventBus.emit('state:changed');
    return true;
  },

  isUnlocked(id: string): boolean {
    return GameState.data.memories.includes(id);
  },

  byRegion(region: RegionId): { def: MemoryDef; unlocked: boolean }[] {
    return MEMORIES.filter((m) => m.region === region).map((def) => ({
      def,
      unlocked: this.isUnlocked(def.id),
    }));
  },

  get(id: string): MemoryDef | undefined {
    return MEMORIES.find((m) => m.id === id);
  },
};
