import type { Direction } from './types';
import type { Sfx } from '@/systems/AudioSystem';

export type Emote = 'heart' | 'exclaim' | 'question' | 'note' | 'sweat';

/**
 * API disponível para cenas, diálogos e eventos.
 * Scripts são funções async: o texto da história fica legível,
 * e qualquer sequência (cutscene, minigame, escolha) é expressável.
 */
export interface ScriptContext {
  say(speaker: string, text: string): Promise<void>;
  choose(speaker: string | null, text: string, options: string[]): Promise<number>;
  narrate(text: string): Promise<void>;

  flag(key: string): boolean;
  setFlag(key: string, value?: boolean | number | string): void;
  give(item: string, qty?: number, silent?: boolean): void;
  has(item: string, qty?: number): boolean;
  take(item: string, qty?: number): boolean;
  count(item: string): number;

  startQuest(id: string): void;
  objective(quest: string, objective: string): void;
  questActive(id: string): boolean;
  objectiveDone(quest: string, objective: string): boolean;
  memory(id: string): Promise<void>;

  wait(ms: number): Promise<void>;
  fadeOut(ms?: number, color?: string): Promise<void>;
  fadeIn(ms?: number): Promise<void>;
  shake(ms?: number): void;
  sfx(name: Sfx): void;
  toast(text: string): void;
  weather(kind: 'clear' | 'rain' | 'sunset' | 'night'): void;

  emote(who: string, emote: Emote): Promise<void>;
  face(who: string, dir: Direction | string): void;
  /** Move um NPC (ou 'player') até o tile indicado. */
  move(who: string, tx: number, ty: number, speed?: number): Promise<void>;
  /** Posiciona instantaneamente um NPC (ou 'player'). */
  place(who: string, tx: number, ty: number, facing?: Direction): void;
  /** Troca a roupa da Bella nesta região (ids em data/outfits.ts). */
  outfit(id: string): void;
  /** Minigame do hambúrguer. */
  burger(opts: import('@/ui/screens/BurgerGame').BurgerOptions): Promise<import('@/ui/screens/BurgerGame').BurgerResult>;
  /** Câmera de cinema: foca no tile (tx, ty) com zoom relativo (1 = normal). */
  focus(tx: number, ty: number, zoom?: number, ms?: number): Promise<void>;
  /** Volta a câmera para seguir a Bella. */
  unfocus(ms?: number): Promise<void>;
  letterbox(on: boolean): void;
  /** Explosão de corações sobre um personagem. */
  hearts(who: string, count?: number): void;
  travel(label: string, icon?: string, ms?: number): Promise<void>;
  chapterCard(kicker: string, title: string, sub: string, button?: string): Promise<void>;
  unlockRegion(id: import('./types').RegionId): void;
  /** Cria um objeto temporário de cena (ex.: o carro do Uber). Base-centro em (tx*16, ty*16). */
  prop(id: string, key: string, tx: number, ty: number, frame?: number): void;
  moveProp(id: string, tx: number, ty: number, ms: number): Promise<void>;
  removeProp(id: string): void;
  /** Ilustração em tela cheia com legendas (avança com interagir). */
  illustration(key: string, lines: string[]): Promise<void>;
  /**
   * Nervosismo da Bella (0 a 100), mostrado no HUD enquanto > 0.
   * Use para o medidor do primeiro encontro.
   */
  nerves(value: number, message?: string): void;
  /** Mostra/esconde um personagem (ex.: dentro do carro). */
  visible(who: string, on: boolean): void;
  /** Weng (ou outro NPC) passa a seguir a Bella. */
  follow(who: string, on: boolean): void;
  /** Mostra/esconde NPCs conforme as condições do mapa. */
  refresh(): void;
  teleport(mapId: string, spawn: string): Promise<void>;
  /** id do mapa atual */
  readonly mapId: string;
}

export type Script = (ctx: ScriptContext) => Promise<void>;
