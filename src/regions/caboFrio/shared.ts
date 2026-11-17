import type { TileRect } from '@/world/MapTypes';
import { QuestSystem } from '@/systems/QuestSystem';

export const Q = 'cf-m1';
export const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
export const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (1536x1024). 48 px = 1 tile. */
export const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });
/** Faixas de 48 px seguindo uma borda (água, muro). */
export function edgeBlocks(top: (x: number) => number | null, bottom: (x: number) => number | null): TileRect[] {
  const out: TileRect[] = [];
  for (let x = 0; x < 1536; x += 48) {
    const c = x + 24;
    const t = top(c);
    const b = bottom(c);
    if (t !== null) out.push(R(x, 0, x + 48, Math.round(t)));
    if (b !== null) out.push(R(x, Math.round(b), x + 48, 1024));
  }
  return out;
}
