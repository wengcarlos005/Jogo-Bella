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
    image: 'cena-duque-janela',
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
    region: 'piabeta',
    title: 'Chapéus mexicanos',
    year: 'Ano 1',
    text: 'Segundo encontro: churrasco com a minha mãe e o Alexandre, filme no sofá, a caminhada até a nossa praça e o restaurante mexicano que deu bebida de cortesia. A gente de chapéu gigante, rindo de tudo.',
    image: 'memory-dq-04',
  },
  {
    id: 'mem-dq-05',
    region: 'piabeta',
    title: 'O pedido',
    year: 'O começo',
    text: 'Cinema no Caxias Shopping, a ligação da minha mãe e eu voltando emburrada pra casa. No quarto: luzinhas, nossas fotos, origamis, a cartinha e chocolates. Ele apareceu atrás de mim com um buquê e me pediu em namoro. Eu disse "aceito" rápido demais. E a gente disse "te amo" pela primeira vez.',
    image: 'cena-pedido',
  },
  {
    id: 'mem-dq-06',
    region: 'duque-de-caxias',
    title: 'Páscoa',
    year: 'Ano 1',
    text: 'Eu enchi o Weng de ovo de Páscoa, e ainda sobrou um pra irmã dele. Ele me deu chocolates e uma cartinha em formato de coelho. A Meli queria tudo.',
    image: 'cena-pascoa',
  },
  {
    id: 'mem-dq-07',
    region: 'duque-de-caxias',
    title: 'A primeira noite',
    year: 'Ano 1',
    text: 'Jantar feito a quatro mãos, filme no sofá e a Meli nos pés da cama. A gente conversou baixinho até dormir.',
    image: 'cena-primeira-noite',
  },
  {
    id: 'mem-dq-08',
    region: 'duque-de-caxias',
    title: 'As pazes',
    year: 'Ano 1',
    text: 'A nossa primeira briga foi por nos comparar com casais perfeitos do TikTok. Aprendemos juntos e pedimos desculpas um pro outro. Nada de régua da internet: só a gente.',
    image: 'cena-pazes',
  },
  {
    id: 'mem-dq-09',
    region: 'duque-de-caxias',
    title: 'Achadinhos da Multidão',
    year: 'Ano 1',
    text: 'Uma tarde inteira rodando o Multidão: eu provando tudo, o Weng segurando as sacolas e dizendo que "só ia olhar".',
    image: 'memory-dq-09',
  },
  {
    id: 'mem-dq-10',
    region: 'duque-de-caxias',
    title: 'A lista da Vó',
    year: 'Ano 1',
    text: 'Mercadinho da esquina com a lista da Vó do Weng. A paçoca entrou no carrinho "sozinha", e a moça do caixa perguntou se a gente era casado.',
    image: 'memory-dq-10',
  },
  {
    id: 'mem-pt-01',
    region: 'petropolis',
    title: 'Cisnes e nuvens',
    year: 'Ano 1',
    text: 'No Quitandinha: corrida de pedalinho contra o cisne rosa, foto na frente do palácio e um piquenique achando formas nas nuvens.',
    image: 'memory-pt-01',
  },
  {
    id: 'mem-pt-02',
    region: 'petropolis',
    title: 'Meia-noite em ponto',
    year: 'Ano 1',
    text: 'Ele ficou acordado de propósito só pra ser o primeiro a me dar parabéns. Antes de todo mundo.',
    image: 'memory-pt-02',
  },
  {
    id: 'mem-pt-03',
    region: 'petropolis',
    title: 'Almoço de aniversário',
    year: 'Ano 1',
    text: 'Restaurante chique na serra, um brinde a nós dois e um petit gâteau com velinha. O salão inteiro cantou parabéns.',
    image: 'memory-pt-03',
  },
  {
    id: 'mem-ar-01',
    region: 'araruama',
    title: 'A mesa giratória',
    year: 'Ano 1',
    text: 'A ceia da tia Tim: pato, macarrão de arroz, frango xadrez e a família inteira girando a mesa. Eu estava com medo de ser julgada. Ninguém me julgou.',
    image: 'memory-ar-01',
  },
  {
    id: 'mem-ar-02',
    region: 'araruama',
    title: 'Lá no alto da roda-gigante',
    year: 'Ano 1',
    text: 'Primeiro dia de 2024: suco no Cosechas, parque de diversões com os primos e, no ponto mais alto da roda-gigante, ele olhando pra mim em vez da vista.',
    image: 'memory-ar-02',
  },
  {
    id: 'mem-ar-03',
    region: 'araruama',
    title: 'Feliz 2024',
    year: 'Ano 1',
    text: 'A virada na varanda da cobertura, os fogos estourando sobre a Lagoa de Araruama e o primeiro beijo do ano.',
    image: 'memory-ar-03',
  },
  {
    id: 'mem-ro-01',
    region: 'rio-das-ostras',
    title: 'O salvador do guarda-sol',
    year: 'Ano 1',
    text: 'Meu pai não quis pagar o guarda-sol e a gente virou camarão. O Weng foi lá e salvou o dia: sombra, cadeira e um herói de chinelo.',
    image: 'memory-ro-01',
  },
  {
    id: 'mem-ro-02',
    region: 'rio-das-ostras',
    title: 'Petisco até a tempestade',
    year: 'Ano 1',
    text: 'Torrada do meu pai, frescobol, onda... e no fim, petisco no quiosque até o céu desabar. A gente correu rindo, queimado e molhado.',
    image: 'memory-ro-02',
  },
];

export const MEMORY_GOAL = 50;
