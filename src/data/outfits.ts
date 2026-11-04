import type { RegionId } from '@/core/types';

export interface OutfitDef {
  id: string;
  name: string;
  /** Chave da spritesheet (public/assets/characters/<personagem>-<id>.png). */
  texture: string;
}

type Wardrobe = Record<string, OutfitDef>;

const wardrobe = (char: string, list: [id: string, name: string][]): Wardrobe =>
  Object.fromEntries(list.map(([id, name]) => [id, { id, name, texture: `${char}-${id}` }]));

/** Guarda-roupas (cada roupa = spritesheet HD 4x4, quadros 96x96). */
export const OUTFITS: Record<'bella' | 'weng', Wardrobe> = {
  bella: wardrobe('bella', [
    ['pijama', 'Camisola (sem óculos)'],
    ['pijama-oculos', 'Camisola (com óculos)'],
    ['casual', 'Camiseta preta e óculos rosados'],
    ['floral', 'Vestido amarelo florido'],
    ['linho', 'Conjunto de linho branco'],
    ['festa', 'Vestido laranja de festa'],
    ['inverno', 'Jaqueta preta de frio'],
  ]),
  weng: wardrobe('weng', [
    ['casual', 'Camiseta preta com estampa'],
    ['basica', 'Camiseta branca'],
    ['social', 'Colete e gravata'],
    ['xadrez', 'Camisa xadrez preta'],
    ['reveillon', 'Camisa branca xadrez'],
  ]),
};

/** Mantido por compatibilidade. */
export const BELLA_OUTFITS = OUTFITS.bella;

/**
 * Roupa padrão de cada um em cada cidade — a roupa muda com o ambiente.
 * (A Bella pode sobrescrever em momentos específicos, ex.: guarda-roupa do prólogo.)
 */
export const REGION_OUTFIT: Record<'bella' | 'weng', Record<RegionId, string>> = {
  bella: {
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
  },
  weng: {
    piabeta: 'casual',
    'duque-de-caxias': 'casual',
    petropolis: 'xadrez',
    araruama: 'reveillon',
    'rio-das-ostras': 'basica',
    niteroi: 'basica',
    lapa: 'xadrez',
    'cabo-frio': 'reveillon',
    botafogo: 'casual',
    seropedica: 'social', // formatura
    curitiba: 'xadrez',
  },
};
