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
  fadeOut(ms?: number): Promise<void>;
  fadeIn(ms?: number): Promise<void>;
  shake(ms?: number): void;
  sfx(name: Sfx): void;
  toast(text: string): void;
  weather(kind: 'clear' | 'rain' | 'sunset'): void;

  emote(who: string, emote: Emote): Promise<void>;
  face(who: string, dir: Direction | string): void;
  /** Move um NPC (ou 'player') até o tile indicado. */
  move(who: string, tx: number, ty: number, speed?: number): Promise<void>;
  /** Posiciona instantaneamente um NPC (ou 'player'). */
  place(who: string, tx: number, ty: number, facing?: Direction): void;
  /** Weng (ou outro NPC) passa a seguir a Bella. */
  follow(who: string, on: boolean): void;
  /** Mostra/esconde NPCs conforme as condições do mapa. */
  refresh(): void;
  teleport(mapId: string, spawn: string): Promise<void>;
  /** id do mapa atual */
  readonly mapId: string;
}

export type Script = (ctx: ScriptContext) => Promise<void>;
