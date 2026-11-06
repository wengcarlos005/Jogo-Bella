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
    description: 'O Weng está chegando para o primeiro encontro. Tá chovendo, e ele vai te esperar na esquina!',
    objectives: [
      { id: 'celular', text: 'Ler a mensagem no celular', hint: 'O celular está na cama.' },
      { id: 'oculos', text: 'Pegar os óculos', hint: 'Estão na escrivaninha.' },
      { id: 'roupa', text: 'Escolher a roupa no guarda-roupa', hint: 'O guarda-roupa fica no seu quarto.' },
      { id: 'colar', text: 'Colocar o colar da sorte', hint: 'Na penteadeira, perto do espelho.' },
      { id: 'presente', text: 'Pegar o presente do Weng', hint: 'Você escondeu no guarda-roupa, atrás das roupas.' },
      { id: 'espelho', text: 'Dar uma última olhada no espelho', hint: 'O espelho fica ao lado da penteadeira.' },
      { id: 'guarda-chuva', text: 'Pegar o guarda-chuva', hint: 'Desça até a sala. O guarda-chuva fica no canto da direita, perto da estante.' },
      { id: 'esquina', text: 'Buscar o Weng na esquina', hint: 'Saia de casa e siga pela calçada para a direita, até a esquina.' },
      { id: 'mae', text: 'Apresentar o Weng para sua mãe', hint: 'Sua mãe está na sala.' },
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
      { id: 'uber', text: 'Esperar o Uber na calçada', hint: 'Fique na beira da calçada, em frente de casa.' },
      { id: 'chegar', text: `Chegar na ${ROTA}` },
      { id: 'pedido', text: 'Montar o seu lanche no balcão', hint: 'O balcão fica no fundo da lanchonete.' },
      { id: 'pedido-weng', text: 'Montar o lanche do Weng', hint: 'Volte ao balcão.' },
      { id: 'mesa', text: 'Sentar na mesinha da janela', hint: 'A mesa para dois fica à esquerda, perto da janela.' },
    ],
    next: 'pia-m3',
    rewardMemory: 'mem-pia-02',
  },
  {
    id: 'pia-m3',
    region: 'piabeta',
    chapter: 'Prólogo',
    title: 'O parque e a chuva',
    kind: 'principal',
    description: 'Depois do lanche, uma caminhada por Fragoso até o parque.',
    objectives: [
      { id: 'gatos', text: 'Fazer carinho nos 3 gatinhos de Fragoso', hint: 'Eles fogem se você chega perto... vá de mansinho, ou espere eles pararem pra se lamber.' },
      { id: 'fragoso', text: 'Caminhar por Fragoso com o Weng', hint: `Saia da ${ROTA} e siga pela calçada à direita.` },
      { id: 'parque', text: 'Chegar no parque', hint: 'No fim da rua de baixo de Fragoso.' },
      { id: 'passear', text: 'Passear pelo parque com o Weng', hint: 'Siga o caminho de terra até o meio do parque.' },
      { id: 'abrigo', text: 'Correr para o coreto!', hint: 'O coreto fica no alto do parque, no centro.' },
      { id: 'beijo', text: '...' },
    ],
    rewardMemory: 'mem-pia-03',
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
