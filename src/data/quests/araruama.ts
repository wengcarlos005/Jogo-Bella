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
      { id: 'ceia', text: 'A ceia na mesa giratória', hint: 'A mesa redonda fica no meio da sala, perto da cozinha.' },
      { id: 'virada', text: 'A virada na varanda', hint: 'Saia pelas portas de vidro e vá até o guarda-corpo, de frente pra lagoa.' },
    ],
  },
];
