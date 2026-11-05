import type { MapDef } from '@/world/MapTypes';
import { PIABETA_MAPS } from './piabeta';
import { DUQUE_MAPS } from './duque';
import { PETROPOLIS_MAPS } from './petropolis';

/**
 * Registro de todos os mapas jogáveis.
 * Para adicionar uma cidade: crie src/regions/<cidade>/ e inclua aqui.
 */
const ALL: MapDef[] = [...PIABETA_MAPS, ...DUQUE_MAPS, ...PETROPOLIS_MAPS];

export const MAPS: Record<string, MapDef> = Object.fromEntries(ALL.map((m) => [m.id, m]));

export function getMap(id: string): MapDef {
  const m = MAPS[id];
  if (!m) throw new Error(`Mapa não encontrado: ${id}`);
  return m;
}
