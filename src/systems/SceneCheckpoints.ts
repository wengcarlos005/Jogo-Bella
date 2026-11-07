import { GameState, createNewSave } from '@/core/GameState';
import type { Direction, RegionId, SaveData, Vec2 } from '@/core/types';
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
  position?: Vec2;
  /** Cena liberada sem ter sido jogada: começa no ponto de entrada do mapa. */
  spawn?: string;
  facing: Direction;
  data: SaveData;
  at: number;
}

/**
 * Pontos de partida de TODAS as cenas da história (liberadas desde o começo).
 * Cada uma monta o estado do jogo como se tudo antes dela já tivesse acontecido.
 */
interface Preset {
  quest: string;
  mapId: string;
  spawn: string;
  /** a missão já começa ativa (quando ela começa no meio de uma cena de outro mapa) */
  active?: boolean;
  /** objetivos dela já feitos ao começar */
  doneObjs?: string[];
  flags?: Record<string, boolean | string>;
  outfits?: Partial<Record<RegionId, string>>;
}
const ORDER_FN = (id: string) => (STORY.indexOf(id) >= 0 ? STORY.indexOf(id) : 100 + Object.keys(QUESTS).indexOf(id));
const STORY = ['pia-m1', 'pia-m2', 'pia-m3', 'dq-e2', 'dq-e3', 'dq-m1', 'dq-m2', 'dq-m3', 'dq-m4', 'dq-m5', 'pt-q1', 'pt-m1'];
const PRESETS: Preset[] = [
  { quest: 'pia-m1', mapId: 'piabeta-casa-bella', spawn: 'start' },
  { quest: 'pia-m2', mapId: 'piabeta-rua', spawn: 'from-casa', active: true, flags: { 'weng-segue': true, 'weng-entrou': true, 'look-escolhido': 'casual' }, outfits: { piabeta: 'casual' } },
  { quest: 'pia-m3', mapId: 'piabeta-rota66-fora', spawn: 'from-rota66', active: true, flags: { 'weng-segue': true, 'weng-entrou': true, 'rota66-saudacao': true }, outfits: { piabeta: 'casual' } },
  { quest: 'dq-e2', mapId: 'piabeta-quintal', spawn: 'porta', outfits: { piabeta: 'casual' } },
  { quest: 'dq-e3', mapId: 'duque-cinema', spawn: 'shopping', active: true, flags: { 'weng-segue': true }, outfits: { piabeta: 'casual' } },
  { quest: 'dq-m1', mapId: 'duque-apto', spawn: 'porta', outfits: { piabeta: 'casual' } },
  { quest: 'dq-m2', mapId: 'duque-apto', spawn: 'porta', active: true, flags: { 'dq-chegou': true, 'weng-segue': true }, outfits: { piabeta: 'casual' } },
  { quest: 'dq-m3', mapId: 'duque-apto', spawn: 'porta', active: true, flags: { 'dq-chegou': true, 'weng-segue': true }, outfits: { piabeta: 'casual' } },
  { quest: 'dq-m4', mapId: 'duque-apto', spawn: 'porta', active: true, flags: { 'dq-chegou': true, 'weng-segue': true }, outfits: { piabeta: 'casual' } },
  { quest: 'dq-m5', mapId: 'duque-apto', spawn: 'porta', active: true, flags: { 'dq-chegou': true, 'weng-segue': true }, outfits: { piabeta: 'casual' } },
  { quest: 'pt-q1', mapId: 'pt-quitandinha', spawn: 'entrada', flags: { 'weng-segue': true }, outfits: { piabeta: 'casual', petropolis: 'floral' } },
  { quest: 'pt-m1', mapId: 'pt-hotel-fora', spawn: 'portao', active: true, doneObjs: ['quitandinha'], flags: { 'weng-segue': true }, outfits: { piabeta: 'casual', petropolis: 'floral' } },
];

function presetData(pr: Preset): SaveData {
  const d = createNewSave();
  const idx = STORY.indexOf(pr.quest);
  for (const id of STORY.slice(0, idx)) {
    const q = QUESTS[id];
    d.quests[id] = { status: 'done', done: q.objectives.map((o) => o.id) };
    if (q.rewardMemory && !d.memories.includes(q.rewardMemory)) d.memories.push(q.rewardMemory);
  }
  if (pr.active) {
    d.quests[pr.quest] = { status: 'active', done: [...(pr.doneObjs ?? [])] };
    d.trackedQuest = pr.quest;
  }
  Object.assign(d.flags, pr.flags ?? {});
  Object.assign(d.regionOutfits, pr.outfits ?? {});
  const reg: RegionId[] = ['piabeta'];
  if (idx >= STORY.indexOf('dq-e2')) reg.push('duque-de-caxias');
  if (idx >= STORY.indexOf('pt-q1')) reg.push('petropolis');
  d.regionsUnlocked = reg;
  d.mapId = pr.mapId;
  return d;
}

const KEY = 'bella-cenas-v1';


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
  /** Todas as cenas da história: as já jogadas usam o momento gravado; as outras, o ponto de partida pronto. */
  list(): Cena[] {
    const played = load();
    const all: Cena[] = PRESETS.map((pr) => {
      const q = QUESTS[pr.quest];
      return played[pr.quest] ?? { quest: pr.quest, title: q.title, chapter: q.chapter, mapId: pr.mapId, spawn: pr.spawn, facing: 'down', data: presetData(pr), at: 0 };
    });
    for (const c of Object.values(played)) if (!all.some((x) => x.quest === c.quest)) all.push(c);
    return all.sort((a, b) => ORDER_FN(a.quest) - ORDER_FN(b.quest));
  },
};
