import type { RegionId } from '@/core/types';

export interface ObjectiveDef {
  id: string;
  text: string;
  /** Objetivos opcionais não bloqueiam a conclusão. */
  optional?: boolean;
  /** Dica exibida se o jogador ficar parado/perdido. */
  hint?: string;
}

export interface QuestDef {
  id: string;
  region: RegionId;
  chapter: string;
  title: string;
  kind: 'principal' | 'secundaria';
  description: string;
  objectives: ObjectiveDef[];
  /** Quest iniciada automaticamente ao concluir esta. */
  next?: string;
  rewardMemory?: string;
}

import { PIABETA_QUESTS } from './piabeta';

export const QUESTS: Record<string, QuestDef> = Object.fromEntries(
  [...PIABETA_QUESTS].map((q) => [q.id, q]),
);
