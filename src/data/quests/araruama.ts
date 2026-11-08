import type { QuestDef } from './index';

export const ARARUAMA_QUESTS: QuestDef[] = [
  {
    id: 'ar-m1',
    region: 'araruama',
    chapter: 'Capítulo 4',
    title: 'Ano-novo em família',
    kind: 'principal',
    description: 'A virada de 2024 na cobertura dos tios do Weng, de frente pra Lagoa de Araruama.',
    objectives: [
      { id: 'chegar', text: 'Chegar na cobertura', hint: 'A porta de entrada fica na parede da esquerda.' },
      { id: 'casa', text: 'Conhecer a cobertura', hint: 'Procure os ♥: a cozinha da tia Tim, a mesa giratória e a varanda.' },
    ],
  },
];
