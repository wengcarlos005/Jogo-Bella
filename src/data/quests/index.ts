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
import { DUQUE_QUESTS } from './duque';
import { PETROPOLIS_QUESTS } from './petropolis';
import { ARARUAMA_QUESTS } from './araruama';
import { RIO_OSTRAS_QUESTS } from './rioDasOstras';

export const QUESTS: Record<string, QuestDef> = Object.fromEntries(
  [...PIABETA_QUESTS, ...DUQUE_QUESTS, ...PETROPOLIS_QUESTS, ...ARARUAMA_QUESTS, ...RIO_OSTRAS_QUESTS].map((q) => [q.id, q]),
);
