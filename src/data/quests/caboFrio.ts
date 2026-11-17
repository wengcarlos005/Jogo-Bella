import type { QuestDef } from './index';

export const CABO_FRIO_QUESTS: QuestDef[] = [
  {
    id: 'cf-m1',
    region: 'cabo-frio',
    chapter: 'Capítulo 7',
    title: 'A virada a pé',
    kind: 'principal',
    description: 'Réveillon em Cabo Frio com a turma: casa de praia em Peró, altinha, pizza, Praia do Japonês, Gatinho-Bomba e 5 km até a virada.',
    objectives: [
      { id: 'chegar', text: 'Chegar na casa de praia', hint: 'Escolha o quarto com a turma.' },
      { id: 'pero', text: 'Altinha na Praia do Peró', hint: 'Saia pela porta e desça pela passarela.' },
      { id: 'pizza', text: 'Noite da pizza', hint: 'A mesa grande da sala.' },
      { id: 'japones', text: 'Churrasco na Praia do Japonês', hint: 'Dia 2: saia pela porta.' },
      { id: 'ilha', text: 'Atravessar até a ilha', hint: 'A faixa de areia dentro da água.' },
      { id: 'cartas', text: 'Gatinho-Bomba com a turma', hint: 'A mesinha perto do sofá.' },
      { id: 'caminhada', text: '5 km até a virada', hint: 'Nenhum Uber aceita...' },
      { id: 'virada', text: 'A virada na Praia do Forte', hint: 'Corram pra areia!' },
    ],
  },
];
