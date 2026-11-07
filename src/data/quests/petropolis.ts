import type { QuestDef } from './index';

export const PETROPOLIS_QUESTS: QuestDef[] = [
  {
    id: 'pt-q1',
    region: 'petropolis',
    chapter: 'Capítulo 3',
    title: 'Um dia no Quitandinha',
    kind: 'principal',
    description: 'O palácio, o lago em formato de Brasil e um piquenique na grama.',
    objectives: [
      { id: 'foto', text: 'Tirar foto na escadaria do palácio', hint: 'A escadaria fica no meio do palácio, lá em cima.' },
      { id: 'pedalinho', text: 'Andar de pedalinho de cisne', hint: 'O píer fica do lado direito do lago.' },
      { id: 'algodao', text: 'Comprar um docinho no carrinho', hint: 'O carrinho de pipoca fica no gramado da direita.' },
      { id: 'piquenique', text: 'Piquenique na grama', hint: 'A toalha xadrez está debaixo da árvore, à esquerda.' },
    ],
  },
  {
    id: 'pt-m1',
    region: 'petropolis',
    chapter: 'Capítulo 3',
    title: 'Feliz aniversário, Bella',
    kind: 'principal',
    description: 'Quitandinha com piquenique, a noite no hotel no alto do morro (com lareira e meia-noite) e o almoço de aniversário.',
    objectives: [
      { id: 'quitandinha', text: 'Piquenique no Palácio Quitandinha', hint: 'Passeie pelo Quitandinha e faça o piquenique.' },
      { id: 'mirante', text: 'Ver a serra pela luneta do mirante', hint: 'O mirante fica à direita, subindo pelo gramado.' },
      { id: 'fotos', text: 'Tirar 3 fotos do hotel', hint: 'Procure os ♥: a casa, as hortênsias azuis e a neblina na serra.' },
      { id: 'checkin', text: 'Fazer o check-in', hint: 'A recepção fica no alto da escadaria.' },
      { id: 'noite', text: 'A primeira noite no quarto 12', hint: 'Lareira primeiro. Depois, a cama (e a meia-noite).' },
      { id: 'cafe', text: 'Café da manhã de aniversário na varanda', hint: 'A varanda fica à esquerda, no alto da escada.' },
      { id: 'almoco', text: 'Almoço de aniversário no restaurante', hint: 'A mesa da rosa fica no meio do salão, debaixo do lustre.' },
    ],
  },
];
