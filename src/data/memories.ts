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
    text: 'Fui buscar o Weng na esquina, escondida debaixo do guarda-chuva. Ele me deu uma rosa rosa e depois conheceu minha mãe e o Alexandre.',
    date: PERSONAL.dates.firstDate,
    image: 'memory-pia-01',
  },
  {
    id: 'mem-pia-02',
    region: 'piabeta',
    title: `A ${PERSONAL.places.hamburgueria}`,
    year: 'O começo',
    text: `De Uber até a ${PERSONAL.places.hamburgueria}. O primeiro lanche juntos, e o Vale Beijo, o Vale Abraço e os chocolates que eu dei pra ele.`,
    date: PERSONAL.dates.firstDate,
    image: 'memory-pia-02',
  },
  {
    id: 'mem-pia-04',
    region: 'piabeta',
    title: 'Caminhando por Fragoso',
    year: 'O começo',
    text: 'Eu estava nervosa desde o começo do encontro. Foi andando por Fragoso, de mãos dadas, que eu finalmente me acalmei.',
    date: PERSONAL.dates.firstDate,
    image: 'memory-pia-04',
  },
  {
    id: 'mem-pia-03',
    region: 'piabeta',
    title: 'O primeiro beijo',
    year: 'O começo',
    text: 'No coreto do parque, debaixo de chuva.',
    date: PERSONAL.dates.firstKiss,
    image: 'memory-pia-03',
  },
  {
    id: 'mem-dq-01',
    region: 'duque-de-caxias',
    title: 'A Meli aprovou',
    year: 'Ano 1',
    text: 'A primeira vez no apê do Weng. A Meli se escondeu, eu conquistei ela com sachê, novelo e carinho, e da janela a gente viu o Teatro Raul Cortez todo iluminado.',
    image: 'memory-dq-01',
  },
  {
    id: 'mem-dq-02',
    region: 'duque-de-caxias',
    title: 'Açaí cheio de complemento',
    year: 'Ano 1',
    text: 'O Weng disse "pede o que você quiser". Eu pedi. Ele ficou com a parte sem complemento, como manda a regra de dividir açaí.',
    image: 'memory-dq-02',
  },
  {
    id: 'mem-dq-03',
    region: 'duque-de-caxias',
    title: 'O imbatível perdeu',
    year: 'Ano 1',
    text: 'O Weng jurava que era imbatível nas cartas. Até jogar comigo.',
    image: 'memory-dq-03',
  },
  {
    id: 'mem-dq-04',
    region: 'duque-de-caxias',
    title: 'Chapéus mexicanos',
    year: 'Ano 1',
    text: 'Segundo encontro: churrasco com a minha mãe e o Alexandre, filme no sofá, a caminhada até a nossa praça e o restaurante mexicano que deu bebida de cortesia. A gente de chapéu gigante, rindo de tudo.',
    image: 'memory-dq-04',
  },
];

export const MEMORY_GOAL = 50;
