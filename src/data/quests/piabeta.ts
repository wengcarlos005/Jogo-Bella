import type { QuestDef } from './index';
import { PERSONAL } from '../personal';

const ALE = PERSONAL.bellaStepdad.name;
const ROTA = PERSONAL.places.hamburgueria;

export const PIABETA_QUESTS: QuestDef[] = [
  {
    id: 'pia-m1',
    region: 'piabeta',
    chapter: 'Prólogo',
    title: 'O encontro marcado',
    kind: 'principal',
    description: 'O Weng está vindo te buscar para o primeiro encontro. Hora de se arrumar!',
    objectives: [
      { id: 'celular', text: 'Ler a mensagem no celular', hint: 'O celular está na cama.' },
      { id: 'roupa', text: 'Escolher a roupa no guarda-roupa', hint: 'O guarda-roupa fica no seu quarto.' },
      { id: 'oculos', text: 'Pegar os óculos', hint: 'Estão na escrivaninha.' },
      { id: 'colar', text: 'Colocar o colar da sorte', hint: 'Na penteadeira, perto do espelho.' },
      { id: 'espelho', text: 'Dar uma última olhada no espelho', hint: 'O espelho fica ao lado da penteadeira.' },
      { id: 'sala', text: 'Descer até a sala', hint: 'Saia do quarto pela porta de baixo.' },
      { id: 'porta', text: 'Atender a porta', hint: 'A campainha tocou! A porta de entrada fica na sala.' },
      { id: 'mae', text: 'Apresentar o Weng para sua mãe', hint: 'Sua mãe está no sofá.' },
      { id: 'pai', text: `Apresentar o Weng para o ${ALE}`, hint: `O ${ALE} está na cozinha, perto da mesa.` },
      { id: 'sair', text: 'Sair para o encontro', hint: 'Saia pela porta da frente com o Weng.' },
    ],
    next: 'pia-m2',
    rewardMemory: 'mem-pia-01',
  },
  {
    id: 'pia-m2',
    region: 'piabeta',
    chapter: 'Prólogo',
    title: `A ${ROTA}`,
    kind: 'principal',
    description: `O primeiro encontro vai ser na ${ROTA}. O Weng chamou um Uber.`,
    objectives: [
      { id: 'uber', text: 'Esperar o Uber na calçada', hint: 'Fique na calçada em frente de casa.' },
      { id: 'chegar', text: `Chegar na ${ROTA} (em breve)`, hint: 'Disponível na Fase 3.' },
      { id: 'pedido', text: 'Fazer o pedido (em breve)', hint: 'Disponível na Fase 3.' },
    ],
  },
  {
    id: 'pia-s1',
    region: 'piabeta',
    chapter: 'Prólogo',
    title: 'Florzinhas do caminho',
    kind: 'secundaria',
    description: 'Dona Cida, a vizinha, adora flores. Que tal levar algumas pra ela?',
    objectives: [
      { id: 'colher', text: 'Colher 3 flores na rua' },
      { id: 'entregar', text: 'Entregar as flores para Dona Cida' },
    ],
  },
];
