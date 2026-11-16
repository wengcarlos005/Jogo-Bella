import type { QuestDef } from './index';

export const RIO_OSTRAS_QUESTS: QuestDef[] = [
  {
    id: 'ro-m1',
    region: 'rio-das-ostras',
    chapter: 'Capítulo 5',
    title: 'Um dia de praia',
    kind: 'principal',
    description: 'Uma passagem rápida por Rio das Ostras: sol, guarda-sol, frescobol e petisco até a tempestade.',
    objectives: [
      { id: 'chegar', text: 'Chegar na praia', hint: 'Desça pela areia.' },
      { id: 'sol', text: 'Sobreviver ao sol', hint: 'Fica perto da toalha.' },
      { id: 'guardasol', text: 'Salvar o dia: alugar o guarda-sol', hint: 'O aluguel é a barraquinha listrada, à esquerda.' },
      { id: 'lanche', text: 'O lanche do pai da Bella', hint: 'O isopor vermelho fica do lado da toalha.' },
      { id: 'brincar', text: 'Frescobol', hint: 'As raquetes de frescobol estão na areia, à direita da toalha.' },
      { id: 'castelo', text: 'Fazer um castelo de areia', hint: 'Perto da beira, à esquerda.' },
      { id: 'mar', text: 'Pular onda', hint: 'Vá até a beira do mar.' },
      { id: 'sogro', text: 'Conversa de sogro', hint: 'O pai da Bella quer falar com o Weng.' },
      { id: 'petisco', text: 'Petisco no quiosque', hint: 'O quiosque de toldo amarelo fica lá em cima, à direita.' },
      { id: 'tempestade', text: 'Fugir da tempestade', hint: 'Junto com o petisco.' },
    ],
  },
];
