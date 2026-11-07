import type { QuestDef } from './index';

export const PETROPOLIS_QUESTS: QuestDef[] = [
  {
    id: 'pt-m1',
    region: 'petropolis',
    chapter: 'Capítulo 3',
    title: 'Feliz aniversário, Bella',
    kind: 'principal',
    description: 'Quitandinha com piquenique, a noite no hotel no alto do morro e o almoço de aniversário.',
    objectives: [
      { id: 'quitandinha', text: 'Piquenique no Palácio Quitandinha', hint: 'O passeio pelo Quitandinha chega em breve.' },
      { id: 'mirante', text: 'Ver a serra pela luneta do mirante', hint: 'O mirante fica à direita, subindo pelo gramado.' },
      { id: 'fotos', text: 'Tirar 3 fotos do hotel', hint: 'Procure os ♥: a casa, as hortênsias azuis e a neblina na serra.' },
      { id: 'checkin', text: 'Fazer o check-in', hint: 'A recepção fica no alto da escadaria.' },
      { id: 'cafe', text: 'Café da manhã de aniversário na varanda', hint: 'A varanda fica à esquerda, no alto da escada.' },
      { id: 'almoco', text: 'Almoço de aniversário no restaurante', hint: 'A mesa da rosa fica no meio do salão, debaixo do lustre.' },
    ],
  },
];
