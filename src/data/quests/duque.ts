import type { QuestDef } from './index';

export const DUQUE_QUESTS: QuestDef[] = [
  {
    id: 'dq-m1',
    region: 'duque-de-caxias',
    chapter: 'Capítulo 1',
    title: 'Nosso cantinho',
    kind: 'principal',
    description: 'A primeira vez da Bella no apê do Weng. Só falta a Meli aprovar a visita.',
    objectives: [
      { id: 'achar-meli', text: 'Encontrar a Meli', hint: 'Ela adora se esconder nos cantinhos dela. Procure no quarto do Weng.' },
      { id: 'sache', text: 'Pegar um sachê', hint: 'O Weng guarda os sachês no armário da cozinha, perto da pia.' },
      { id: 'potinho', text: 'Colocar o sachê no potinho da Meli', hint: 'Os potinhos dela ficam no chão da cozinha.' },
      { id: 'novelo', text: 'Pegar um novelo', hint: 'Tem um cesto de novelos na sala, perto da mesa.' },
      { id: 'brincar', text: 'Brincar com a Meli', hint: 'Leve o novelo até ela.' },
      { id: 'carinho', text: 'Fazer carinho na Meli', hint: 'Agora ela confia em você. Chegue pertinho.' },
      { id: 'janela', text: 'Ver a vista da janela do quarto do Weng', hint: 'A janela fica em cima da mesa do computador.' },
    ],
    rewardMemory: 'mem-dq-01',
  },
];
