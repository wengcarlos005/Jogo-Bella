import type { RegionId } from '@/core/types';

export interface OutfitDef {
  id: string;
  name: string;
  /** Chave da spritesheet (public/assets/characters/bella-<id>.png). */
  texture: string;
}

/** Guarda-roupa da Bella. Cada roupa = uma spritesheet 4x4 (quadros 48x48). */
export const BELLA_OUTFITS: Record<string, OutfitDef> = {
  casual: { id: 'casual', name: 'Camiseta preta e óculos rosados', texture: 'bella-casual' },
  floral: { id: 'floral', name: 'Vestido amarelo florido', texture: 'bella-floral' },
  linho: { id: 'linho', name: 'Conjunto de linho branco', texture: 'bella-linho' },
  festa: { id: 'festa', name: 'Vestido laranja de festa', texture: 'bella-festa' },
  inverno: { id: 'inverno', name: 'Jaqueta preta de frio', texture: 'bella-inverno' },
};

/**
 * Roupa padrão da Bella em cada cidade — a roupa muda com o ambiente.
 * (O jogador pode sobrescrever em momentos específicos, ex.: guarda-roupa do prólogo.)
 */
export const REGION_OUTFIT: Record<RegionId, string> = {
  piabeta: 'casual',
  'duque-de-caxias': 'casual',
  petropolis: 'inverno', // serra, friozinho
  araruama: 'linho', // ano-novo de branco
  'rio-das-ostras': 'floral', // férias de verão
  niteroi: 'floral',
  lapa: 'festa', // aniversário
  'cabo-frio': 'linho', // outro réveillon de branco
  botafogo: 'casual',
  seropedica: 'festa', // formatura
  curitiba: 'inverno', // frio de Curitiba
};
