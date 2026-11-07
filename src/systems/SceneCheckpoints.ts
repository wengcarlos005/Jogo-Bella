import { GameState } from '@/core/GameState';
import type { Direction, SaveData, Vec2 } from '@/core/types';
import { QUESTS } from '@/data/quests';

/**
 * "Cenas": cada missão principal que começa vira um ponto de partida que dá pra jogar de novo
 * direto pelo menu, sem percorrer a história toda. Fica guardado neste navegador (fora dos saves).
 *
 * O ponto salvo é o estado do jogo na ENTRADA do mapa onde a missão começou. Se a missão começa
 * numa cena que termina levando pra outro mapa, vale a entrada desse mapa novo.
 */
export interface Cena {
  quest: string;
  title: string;
  chapter: string;
  mapId: string;
  position: Vec2;
  facing: Direction;
  data: SaveData;
  at: number;
}

const KEY = 'bella-cenas-v1';
const ORDER = Object.keys(QUESTS);

interface Entry {
  mapId: string;
  position: Vec2;
  facing: Direction;
  data: SaveData;
}

let entry: Entry | null = null;
let candidate: { quest: string; from: Entry } | null = null;

function load(): Record<string, Cena> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Cena>;
  } catch {
    return {};
  }
}
function store(all: Record<string, Cena>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* sem espaço / modo privado: segue sem guardar */
  }
}
function commit(quest: string, e: Entry): void {
  const q = QUESTS[quest];
  if (!q) return;
  const all = load();
  if (all[quest]) return;
  all[quest] = { quest, title: q.title, chapter: q.chapter, mapId: e.mapId, position: e.position, facing: e.facing, data: e.data, at: Date.now() };
  store(all);
}

export const SceneCheckpoints = {
  /** Chamado quando um mapa começa (antes do script de entrada). */
  enter(mapId: string, position: Vec2, facing: Direction): void {
    const e: Entry = { mapId, position: { ...position }, facing, data: structuredClone({ ...GameState.data, mapId, position, facing }) };
    // a missão começou numa cena que terminou trocando de mapa: o ponto de partida é este mapa novo
    if (candidate) commit(candidate.quest, e);
    candidate = null;
    entry = e;
  },
  questStarted(id: string): void {
    if (QUESTS[id]?.kind !== 'principal' || !entry) return;
    if (candidate) commit(candidate.quest, candidate.from);
    candidate = { quest: id, from: entry };
  },
  /** A cena acabou no mesmo mapa: vale a entrada dele. */
  settle(): void {
    if (candidate) commit(candidate.quest, candidate.from);
    candidate = null;
  },
  list(): Cena[] {
    return Object.values(load()).sort((a, b) => ORDER.indexOf(a.quest) - ORDER.indexOf(b.quest));
  },
};
