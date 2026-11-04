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
  /** Sempre abaixo dos personagens (tapetes, capachos). */
  flat?: boolean;
  id?: string;
}

export interface NpcPlacement {
  id: string;
  sprite: string;
  tx: number;
  ty: number;
  facing?: Direction;
  interact?: string;
  behavior?: 'idle' | 'wander';
  visibleIf?: () => boolean;
  markerIf?: () => boolean;
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
  npcs?: NpcPlacement[];
  spawns: Record<string, SpawnDef>;
  exits?: ExitDef[];
  triggers?: TriggerDef[];
  scripts?: Record<string, Script>;
  /** Script ao entrar no mapa (após o fade-in). */
  onEnter?: string;
  music?: string;
  indoor?: boolean;
  /** Cor de fundo fora do mapa. */
  background?: string;
}
