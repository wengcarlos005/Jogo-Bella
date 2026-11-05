import type { Direction, RegionId } from '@/core/types';
import type { Script } from '@/core/script';

/** Retângulo em coordenadas de TILE (pode ser fracionário). */
export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PropPlacement {
  /** Chave de textura (ex.: 'prop-tree'). */
  key: string;
  /** Tile onde fica o canto inferior-esquerdo do sprite. */
  tx: number;
  ty: number;
  /** Colisão em px relativa ao canto sup-esq do sprite. false = atravessável. Padrão: base do objeto. */
  block?: [ox: number, oy: number, w: number, h: number] | false;
  /** Script executado ao interagir. */
  interact?: string;
  /** Rótulo do botão de interação ("Ver", "Abrir"...). */
  label?: string;
  /** Mostra apenas se a condição for verdadeira (avaliada ao entrar no mapa e ao mudar flags). */
  visibleIf?: () => boolean;
  /** Mostra o marcador de objetivo (♥ flutuante) enquanto verdadeiro. */
  markerIf?: () => boolean;
  /** Escala de exibição (ex.: 0.5 para objetos desenhados em resolução HD). */
  scale?: number;
  /** Sempre abaixo dos personagens (tapetes, capachos). */
  flat?: boolean;
  id?: string;
}

/** Área interativa invisível (usada sobre cenários pintados). */
export interface HotspotDef {
  rect: TileRect;
  interact: string;
  label?: string;
  markerIf?: () => boolean;
  enabledIf?: () => boolean;
}

export interface NpcPlacement {
  id: string;
  sprite: string;
  tx: number;
  ty: number;
  facing?: Direction;
  interact?: string;
  behavior?: 'idle' | 'wander';
  /** Raio (em tiles) que o NPC pode se afastar de onde nasceu. Padrão: 1,5. */
  wanderRadius?: number;
  /** Eixos permitidos na caminhada aleatória. Padrão: ambos. */
  wanderAxis?: 'x' | 'y' | 'both';
  visibleIf?: () => boolean;
  markerIf?: () => boolean;
  /** Começa numa pose parada de outra folha (ex.: gato dormindo: { key: 'lala-poses', frame: 1 }). */
  pose?: { key: string; frame: number };
}

export interface ExitDef {
  rect: TileRect;
  toMap: string;
  toSpawn: string;
  /** Se retornar string, a saída é bloqueada e a string é exibida. */
  blockedIf?: () => string | false;
  sfx?: 'door';
}

export interface TriggerDef {
  id: string;
  rect: TileRect;
  script: string;
  /** Dispara uma única vez por save (usa flag `trigger:<mapa>:<id>`). */
  once?: boolean;
  enabledIf?: () => boolean;
}

export interface SpawnDef {
  tx: number;
  ty: number;
  facing: Direction;
}

export interface MapDef {
  id: string;
  region: RegionId;
  name: string;
  /** Legenda: caractere → índice de tile. */
  legend: Record<string, number>;
  /** Camada de chão (linhas de caracteres, todas com a mesma largura). */
  ground: string[];
  /** Camada de detalhes sobre o chão (opcional, mesmas dimensões; ' ' = vazio). */
  detail?: string[];
  props?: PropPlacement[];
  /** Colisões extras em retângulos (unidades de tile, fracionários). Ideal para cenários pintados. */
  blocks?: TileRect[];
  /**
   * Profundidade em cenários pintados: recortes do próprio cenário redesenhados
   * NA FRENTE dos personagens que estiverem acima (atrás) da linha `base`.
   * Coordenadas em pixels da imagem ORIGINAL (art-source). `ellipse` recorta em oval (copas).
   */
  overlays?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    base: number;
    ellipse?: boolean;
    fade?: boolean;
    /** 'foliage': mantém só folhas, flores e contornos (tira chão, asfalto, pedra). */
    cut?: 'foliage' | 'furniture' | 'lamp' | 'dark' | 'booth' | 'column' | 'outline';
    /**
     * Móveis baixos (sofás, mesas): fatia o recorte em faixas horizontais, cada uma com a
     * própria profundidade. Quem passa AO LADO não é cortado; quem passa ATRÁS é.
     */
    slice?: boolean;
    /** Sempre na frente dos personagens (portas, molduras), translúcido quando alguém está atrás. */
    front?: boolean;
    /** Só aparece quando a condição for verdadeira (ex.: telhado do coreto na cena do beijo). */
    when?: () => boolean;
  }[];
  /** Interações invisíveis sobre o cenário. */
  hotspots?: HotspotDef[];
  /**
   * Como o cenário pintado (maps/<id>-bg.png) é exibido:
   *  - 'fill' (padrão): esticado para o tamanho da grade;
   *  - 'native': 1 pixel da imagem = 1 pixel do canvas HD (imagem em 2× a escala lógica).
   */
  art?: 'fill' | 'native';
  npcs?: NpcPlacement[];
  spawns: Record<string, SpawnDef>;
  exits?: ExitDef[];
  triggers?: TriggerDef[];
  scripts?: Record<string, Script>;
  /**
   * Iluminação noturna: escurece o cenário e acende luzes (coordenadas em px do
   * cenário ORIGINAL). `when` decide se está de noite (padrão: sempre).
   */
  lighting?: {
    darkness: number;
    color?: number;
    lights: { x: number; y: number; r: number; color?: number; flicker?: boolean; /** letreiro de neon: pulsa forte e falha de vez em quando */ neon?: boolean }[];
    when?: () => boolean;
  };
  /** Janelas (vidros) onde aparece chuva lá fora enquanto `when()` for verdadeiro. */
  rainWindows?: { rects: TileRect[]; when: () => boolean; /** false: a arte já tem o vidro chuvoso, só cai a chuva. */ glass?: boolean };
  /** Vapor subindo (chapas, panelas, xícaras): pontos em px do cenário ORIGINAL. */
  steam?: { x: number; y: number }[];
  /** Partículas de ambiente: poeira de luz, vaga-lumes, pétalas. */
  ambient?: 'dust' | 'fireflies' | 'petals';
  /** Se verdadeiro, Bella e Weng começam invisíveis (ex.: ainda dentro do carro). */
  hideActorsOnEnter?: () => boolean;
  /** Script ao entrar no mapa (após o fade-in). */
  onEnter?: string;
  music?: string;
  indoor?: boolean;
  /** Tamanho dos personagens neste mapa (cenários desenhados mais de perto). Padrão 1. */
  charScale?: number;
  /** Cor de fundo fora do mapa. */
  background?: string;
}
