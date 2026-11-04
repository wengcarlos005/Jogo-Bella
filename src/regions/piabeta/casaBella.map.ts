import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';
import { casaScripts } from './casaBella.scripts';
import { PERSONAL } from '@/data/personal';

const Q = 'pia-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);

/**
 * Retângulo medido no cenário ORIGINAL (art-source/maps/piabeta-casa-bella.png,
 * 1536x1024). 48 px da imagem = 1 tile (16 px lógicos).
 */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({
  x: x0 / 48,
  y: y0 / 48,
  w: (x1 - x0) / 48,
  h: (y1 - y0) / 48,
});

// Grade 32x22 (o cenário ocupa 32 x 21,3 tiles). Chão neutro: as paredes
// e móveis vêm dos `blocks`, alinhados ao desenho.
const ROW = '.'.repeat(32);

/** Prólogo — casa da Bella em Piabetá (interior, cenário pintado). */
export const casaBellaMap: MapDef = {
  id: 'piabeta-casa-bella',
  region: 'piabeta',
  name: 'Casa da Bella',
  indoor: true,
  music: 'casa',
  background: '#2b1d1f',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => ROW),

  blocks: [
    // Paredes externas
    R(0, 0, 40, 1024), // esquerda
    R(1496, 0, 1536, 1024), // direita
    // Quarto: parede do fundo + divisória com a cozinha
    R(0, 0, 875, 235),
    R(838, 0, 878, 488),
    // Cozinha: parede, geladeira, fogão e bancada
    R(875, 0, 1536, 300),
    // Divisória do meio + paredes da sala (passagens em x 155–270 e 910–1030)
    R(0, 484, 155, 690),
    R(270, 484, 910, 690),
    R(1030, 484, 1536, 690),
    // Parede de baixo (porta em x 690–800)
    R(0, 925, 690, 1024),
    R(800, 925, 1536, 1024),
    // Quarto
    R(62, 230, 232, 466), // cama
    R(272, 230, 448, 338), // escrivaninha + cadeira
    R(458, 230, 538, 338), // penteadeira + banquinho
    R(538, 230, 640, 322), // espelho + planta
    R(635, 230, 818, 320), // guarda-roupa
    // Cozinha
    R(1045, 318, 1282, 470), // mesa + cadeiras
    R(1408, 300, 1496, 388), // planta
    // Sala
    R(40, 690, 150, 735), // planta
    R(215, 690, 318, 888), // TV
    R(408, 690, 548, 724), // mesinha + abajur
    R(550, 690, 910, 745), // sofá
    R(1062, 690, 1290, 756), // estante
    R(1382, 740, 1480, 808), // planta
  ],

  hotspots: [
    // Quarto
    { rect: R(62, 175, 232, 466), interact: 'cama', label: 'Cama', markerIf: () => objActive('celular') },
    { rect: R(272, 150, 448, 338), interact: 'oculos', label: 'Escrivaninha', markerIf: () => objActive('oculos') },
    { rect: R(458, 150, 536, 338), interact: 'colar', label: 'Penteadeira', markerIf: () => objActive('colar') },
    {
      rect: R(538, 110, 604, 304),
      interact: 'espelho',
      label: 'Espelho',
      markerIf: () => objActive('espelho') && objDone('roupa') && objDone('oculos') && objDone('colar') && objDone('presente'),
    },
    { rect: R(635, 90, 818, 322), interact: 'guarda-roupa', label: 'Guarda-roupa', markerIf: () => objDone('celular') && (objActive('roupa') || objActive('presente')) },
    // Cozinha
    { rect: R(940, 85, 1062, 302), interact: 'geladeira', label: 'Geladeira' },
    { rect: R(1066, 160, 1160, 302), interact: 'fogao', label: 'Fogão' },
    { rect: R(1160, 140, 1350, 302), interact: 'pia', label: 'Pia' },
    // Sala
    { rect: R(215, 650, 318, 888), interact: 'tv', label: 'TV' },
    { rect: R(1062, 545, 1290, 758), interact: 'estante', label: 'Estante' },
    { rect: R(550, 600, 910, 748), interact: 'sofa', label: 'Sofá' },
    {
      rect: R(610, 820, 690, 925),
      interact: 'guarda-chuva',
      label: 'Guarda-chuva',
      markerIf: () => objActive('guarda-chuva') && objDone('espelho'),
    },
  ],

  npcs: [
    { id: 'mae-bella', sprite: 'mae-bella', tx: 12.8, ty: 15.7, facing: 'down', interact: 'mae', markerIf: () => objActive('mae') && GameState.is('weng-entrou') },
    { id: 'pai-bella', sprite: 'pai-bella', tx: 20.4, ty: 8.4, facing: 'right', interact: 'pai', markerIf: () => objActive('pai') && GameState.is('weng-entrou') },
    {
      id: 'weng',
      sprite: 'weng',
      tx: 15.5,
      ty: 16.8,
      facing: 'up',
      interact: 'weng',
      visibleIf: () => GameState.is('weng-entrou') && !objDone('sair'),
    },
  ],
  spawns: {
    start: { tx: 6.8, ty: 7.6, facing: 'down' },
    'from-rua': { tx: 15, ty: 17.5, facing: 'up' },
  },
  exits: [
    {
      rect: R(690, 935, 800, 1000),
      toMap: 'piabeta-rua',
      toSpawn: 'from-casa',
      sfx: 'door',
      blockedIf: () => {
        if (!QuestSystem.isActive(Q)) return false;
        if (!objDone('espelho')) return 'Ainda não tô pronta!';
        if (!objDone('guarda-chuva')) return 'Tá chovendo! Melhor pegar o guarda-chuva perto da porta.';
        if (objDone('esquina') && (!objDone('mae') || !objDone('pai')))
          return `Antes de sair, apresente o Weng para sua mãe e o ${PERSONAL.bellaStepdad.name}.`;
        return false;
      },
    },
  ],
  triggers: [
    {
      id: 'chegou-sala',
      rect: R(150, 600, 275, 700),
      script: 'chegou-sala',
      once: true,
      enabledIf: () => objDone('espelho'),
    },
    {
      id: 'sair-cedo',
      rect: R(150, 490, 275, 545),
      script: 'sair-quarto-cedo',
      enabledIf: () => QuestSystem.isActive(Q) && !objDone('espelho'),
    },
  ],
  scripts: casaScripts,
  onEnter: 'entrar',
};
