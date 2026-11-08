import type { RegionId } from '@/core/types';

export interface OutfitDef {
  id: string;
  name: string;
  description?: string;
  /** Chave da spritesheet (public/assets/characters/<personagem>-<id>.png). */
  texture: string;
}

type Wardrobe = Record<string, OutfitDef>;

const wardrobe = (char: string, list: [id: string, name: string, description?: string][]): Wardrobe =>
  Object.fromEntries(list.map(([id, name, description]) => [id, { id, name, description, texture: `${char}-${id}` }]));

/** Guarda-roupas (cada roupa = spritesheet HD 4x4, quadros 96x96). */
export const OUTFITS: Record<'bella' | 'weng', Wardrobe> = {
  bella: wardrobe('bella', [
    ['pijama', 'Camisola', 'Pijama de coração e pantufas de coelhinho.'],
    ['pijama-oculos', 'Camisola', 'Pijama de coração e pantufas de coelhinho.'],
    ['casual', 'O clássico', 'Camiseta preta, calça larga e tênis. A minha cara.'],
    ['floral', 'Vestido amarelo', 'Florido e alegre, com cara de primeiro encontro.'],
    ['linho', 'Linho branco', 'Leve e elegante. Combina com a noite.'],
    ['festa', 'Vestido laranja', 'Pra brilhar. Talvez demais pra uma hamburgueria?'],
    ['inverno', 'Jaqueta preta', 'Quentinha pra noite de chuva.'],
  ]),
  weng: wardrobe('weng', [
    ['casual', 'Camiseta preta com estampa'],
    ['basica', 'Camiseta branca'],
    ['social', 'Colete e gravata'],
    ['xadrez', 'Camisa xadrez preta'],
    ['reveillon', 'Camisa branca'],
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
    petropolis: 'floral', // aniversário na serra: o vestido amarelo
    araruama: 'casual', // ano-novo de 2024: "vestimos qualquer coisa"
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
    petropolis: 'reveillon', // camisa branca nova
    araruama: 'casual',
    'rio-das-ostras': 'basica',
    niteroi: 'basica',
    lapa: 'xadrez',
    'cabo-frio': 'reveillon',
    botafogo: 'casual',
    seropedica: 'social', // formatura
    curitiba: 'xadrez',
  },
};
