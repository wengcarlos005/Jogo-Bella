/**
 * Registro de tiles (16x16). O índice = posição no tileset (16 colunas).
 * Se public/assets/tilesets/base-16.png existir, ele é usado; senão,
 * o PlaceholderFactory desenha cada tile proceduralmente.
 */
export interface TileDef {
  name: string;
  solid: boolean;
}

export const T = {
  EMPTY: 0,
  GRASS: 1,
  GRASS_FLOWERS: 2,
  DIRT: 3,
  SIDEWALK: 4,
  ASPHALT: 5,
  ASPHALT_LINE: 6,
  WATER: 7,
  WOOD: 8,
  KITCHEN: 9,
  WALL_TOP: 10,
  WALL_FACE: 11,
  RUG: 12,
  HEDGE: 13,
  FENCE: 14,
  HOUSE_WALL: 15,
  ROOF: 16,
  ROOF_EDGE: 17,
  WINDOW: 18,
  DOOR: 19,
  SAND: 20,
  CURB: 21,
  GRASS_DARK: 22,
  VOID: 23,
  ROOF_BLUE: 24,
  ROOF_BLUE_EDGE: 25,
  HOUSE_WALL_2: 26,
  SHOP_WALL: 27,
  AWNING: 28,
  STAIRS: 29,
} as const;

export const TILE_DEFS: TileDef[] = [
  { name: 'vazio', solid: false },
  { name: 'grama', solid: false },
  { name: 'grama-flores', solid: false },
  { name: 'terra', solid: false },
  { name: 'calçada', solid: false },
  { name: 'asfalto', solid: false },
  { name: 'asfalto-faixa', solid: false },
  { name: 'água', solid: true },
  { name: 'piso-madeira', solid: false },
  { name: 'piso-cozinha', solid: false },
  { name: 'parede-topo', solid: true },
  { name: 'parede-frente', solid: true },
  { name: 'tapete', solid: false },
  { name: 'cerca-viva', solid: true },
  { name: 'cerca', solid: true },
  { name: 'parede-casa', solid: true },
  { name: 'telhado', solid: true },
  { name: 'telhado-beiral', solid: true },
  { name: 'janela', solid: true },
  { name: 'porta', solid: false },
  { name: 'areia', solid: false },
  { name: 'meio-fio', solid: false },
  { name: 'grama-escura', solid: false },
  { name: 'vazio-sólido', solid: true },
  { name: 'telhado-azul', solid: true },
  { name: 'telhado-azul-beiral', solid: true },
  { name: 'parede-casa-2', solid: true },
  { name: 'parede-loja', solid: true },
  { name: 'toldo', solid: true },
  { name: 'escada', solid: false },
];

export const TILESET_COLUMNS = 16;
