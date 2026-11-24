import type { QuestDef } from './index';

export const NITEROI_QUESTS: QuestDef[] = [
  {
    id: 'nt-m1',
    region: 'niteroi',
    chapter: 'Capítulo 6',
    title: 'Do outro lado da baía',
    kind: 'principal',
    description: 'Icaraí com a família da mãe da Lilian: a sabatina, os chocolates, o Caminho Niemeyer e o churrasco no On Fire.',
    objectives: [
      { id: 'chegar', text: 'Chegar no apê em Icaraí', hint: 'Entre no apartamento.' },
      { id: 'oi', text: 'Passar pela sabatina da família', hint: 'Todo mundo quer saber da história de vocês. Fale com qualquer um na sala.' },
      { id: 'chocolates', text: 'Os chocolates da mãe da Lilian', hint: 'Ela tá na cozinha, com uma cesta enorme.' },
      { id: 'varanda', text: 'Ver a vista da varanda', hint: 'A porta de vidro da varanda fica embaixo.' },
      { id: 'niemeyer', text: 'Passear no Caminho Niemeyer', hint: 'Saia pela porta de entrada.' },
      { id: 'foto', text: 'Uma foto com a baía atrás', hint: 'Lá embaixo, na beira da baía.' },
      { id: 'almoco', text: 'Churrasco no On Fire', hint: 'A família vai junto.' },
    ],
  },
];
