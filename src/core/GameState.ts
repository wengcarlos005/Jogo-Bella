import { VERSION } from '@/config/gameConfig';
import { EventBus } from './EventBus';
import type { FlagValue, SaveData } from './types';

export function createNewSave(): SaveData {
  return {
    version: VERSION,
    savedAt: Date.now(),
    playtimeMs: 0,
    mapId: 'piabeta-casa-bella',
    position: { x: 72, y: 88 },
    facing: 'down',
    flags: {},
    quests: {},
    trackedQuest: null,
    inventory: {},
    memories: [],
    regionsUnlocked: ['piabeta'],
    regionsVisited: [],
    outfits: { bella: 'casual', weng: 'casual' },
    regionOutfits: {},
    outfitsUnlocked: ['casual'],
    houseDecor: {},
  };
}

/** Migra saves antigos preenchendo campos que não existiam. */
function migrate(data: Partial<SaveData>): SaveData {
  return { ...createNewSave(), ...data, version: VERSION };
}

/**
 * Estado único do jogo (fonte da verdade). Tudo que precisa ser salvo
 * mora aqui; sistemas leem e escrevem por meio deste objeto.
 */
class GameStateStore {
  data: SaveData = createNewSave();

  reset(): void {
    this.data = createNewSave();
    EventBus.emit('state:changed');
  }

  load(data: Partial<SaveData>): void {
    this.data = migrate(structuredClone(data));
    EventBus.emit('state:changed');
  }

  snapshot(): SaveData {
    return structuredClone({ ...this.data, savedAt: Date.now() });
  }

  getFlag<T extends FlagValue = boolean>(key: string): T | undefined {
    return this.data.flags[key] as T | undefined;
  }

  is(key: string): boolean {
    return Boolean(this.data.flags[key]);
  }

  setFlag(key: string, value: FlagValue = true): void {
    if (this.data.flags[key] === value) return;
    this.data.flags[key] = value;
    EventBus.emit('flag:changed', key, value);
    EventBus.emit('state:changed');
  }
}

export const GameState = new GameStateStore();
