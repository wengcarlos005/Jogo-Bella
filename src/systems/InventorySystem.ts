import { EventBus } from '@/core/EventBus';
import { GameState } from '@/core/GameState';
import { ITEMS, type ItemDef } from '@/data/items';
import type { ItemCategory } from '@/core/types';

export const InventorySystem = {
  add(id: string, qty = 1): void {
    const def = ITEMS[id];
    if (!def) throw new Error(`Item desconhecido: ${id}`);
    const inv = GameState.data.inventory;
    inv[id] = def.unique ? 1 : (inv[id] ?? 0) + qty;
    EventBus.emit('item:added', id, qty);
    EventBus.emit('state:changed');
  },

  remove(id: string, qty = 1): boolean {
    const inv = GameState.data.inventory;
    if ((inv[id] ?? 0) < qty) return false;
    inv[id] -= qty;
    if (inv[id] <= 0) delete inv[id];
    EventBus.emit('state:changed');
    return true;
  },

  count(id: string): number {
    return GameState.data.inventory[id] ?? 0;
  },

  has(id: string, qty = 1): boolean {
    return this.count(id) >= qty;
  },

  list(category?: ItemCategory): { def: ItemDef; qty: number }[] {
    return Object.entries(GameState.data.inventory)
      .map(([id, qty]) => ({ def: ITEMS[id], qty }))
      .filter((e) => e.def && (!category || e.def.category === category));
  },
};
