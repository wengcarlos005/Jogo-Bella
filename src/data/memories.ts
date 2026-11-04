import type { RegionId } from '@/core/types';
import { PERSONAL } from './personal';

export interface MemoryDef {
  id: string;
  region: RegionId;
  title: string;
  year: string;
  /** Texto da lembrança. Use [colchetes] para trechos a confirmar. */
  text: string;
  /** Data real, vinda de personal.ts quando conhecida. */
  date?: string;
  /** Chave da ilustração (assets/cinematics). Placeholder se ausente. */
  image: string;
}

/**
 * Álbum de memórias. Meta: ~50 entradas ao longo do jogo.
 * Os textos aqui são provisórios e devem ser revisados pelo Weng.
 */
export const MEMORIES: MemoryDef[] = [
  {
    id: 'mem-pia-01',
    region: 'piabeta',
    title: 'O encontro marcado',
    year: 'O começo',
    text: 'O dia em que o Weng apareceu na porta, nervoso, e conheceu meus pais.',
    date: PERSONAL.dates.firstDate,
    image: 'memory-pia-01',
  },
  {
    id: 'mem-pia-02',
    region: 'piabeta',
    title: 'A hamburgueria',
    year: 'O começo',
    text: '[Lembrança do primeiro lanche juntos — a definir na Fase 3]',
    date: PERSONAL.dates.firstDate,
    image: 'memory-pia-02',
  },
  {
    id: 'mem-pia-03',
    region: 'piabeta',
    title: 'O primeiro beijo',
    year: 'O começo',
    text: 'No parque, debaixo de chuva. [Texto a definir na Fase 3]',
    date: PERSONAL.dates.firstKiss,
    image: 'memory-pia-03',
  },
];

export const MEMORY_GOAL = 50;
