import type { QuestDef } from './index';

export const PETROPOLIS_QUESTS: QuestDef[] = [
  {
    id: 'pt-m1',
    region: 'petropolis',
    chapter: 'Capítulo 3',
    title: 'Feliz aniversário, Bella',
    kind: 'principal',
    description: 'Chegamos ao hotel no alto do morro em Petrópolis. Faz frio de verdade!',
    objectives: [
      { id: 'mirante', text: 'Ver a serra pela luneta do mirante', hint: 'O mirante fica à direita, subindo pelo gramado.' },
      { id: 'checkin', text: 'Fazer o check-in', hint: 'A recepção fica no alto da escadaria.' },
    ],
  },
];
