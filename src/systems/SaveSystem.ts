import { GameState } from '@/core/GameState';
import type { SaveData, Settings } from '@/core/types';

const DB_NAME = 'bella-weng';
const STORE = 'saves';
const SETTINGS_KEY = 'bw:settings';
export const AUTOSAVE_SLOT = 'auto';

export interface SaveSummary {
  slot: string;
  savedAt: number;
  playtimeMs: number;
  mapId: string;
  memories: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Salvamento persistente em IndexedDB, com fallback para localStorage
 * (navegação privada em alguns iOS bloqueia IndexedDB).
 */
export const SaveSystem = {
  async write(slot: string, data: SaveData): Promise<void> {
    try {
      await idb('readwrite', (s) => s.put(data, slot));
    } catch {
      localStorage.setItem(`bw:save:${slot}`, JSON.stringify(data));
    }
  },

  async read(slot: string): Promise<SaveData | null> {
    try {
      const v = await idb<SaveData | undefined>('readonly', (s) => s.get(slot));
      if (v) return v;
    } catch {
      /* fallback abaixo */
    }
    const raw = localStorage.getItem(`bw:save:${slot}`);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  },

  async remove(slot: string): Promise<void> {
    try {
      await idb('readwrite', (s) => s.delete(slot));
    } catch {
      /* ignore */
    }
    localStorage.removeItem(`bw:save:${slot}`);
  },

  async save(slot: string): Promise<void> {
    await this.write(slot, GameState.snapshot());
  },

  async autosave(): Promise<void> {
    await this.save(AUTOSAVE_SLOT);
  },

  async summaries(slots: string[]): Promise<(SaveSummary | null)[]> {
    return Promise.all(
      slots.map(async (slot) => {
        const d = await this.read(slot);
        return d
          ? { slot, savedAt: d.savedAt, playtimeMs: d.playtimeMs, mapId: d.mapId, memories: d.memories.length }
          : null;
      }),
    );
  },

  /** Save mais recente entre todos os slots (para "Continuar"). */
  async latest(slots: string[]): Promise<SaveData | null> {
    const all = await Promise.all(slots.map((s) => this.read(s)));
    return all.filter((d): d is SaveData => !!d).sort((a, b) => b.savedAt - a.savedAt)[0] ?? null;
  },
};

const DEFAULT_SETTINGS: Settings = {
  musicVolume: 0.6,
  sfxVolume: 0.7,
  textSpeed: 'normal',
  touchControls: 'auto',
};

/** Preferências pequenas ficam no localStorage. */
export const SettingsStore = {
  data: { ...DEFAULT_SETTINGS } as Settings,
  load(): Settings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) this.data = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return this.data;
  },
  save(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.data));
    } catch {
      /* ignore */
    }
  },
};
