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

  // Gotas caindo nos vidros das janelas do quarto e da cozinha (a arte já é chuvosa).
  rainWindows: {
    glass: false,
    when: () => !QuestSystem.isActive('dq-e2'),
    rects: [
      R(310, 74, 372, 96), R(382, 74, 444, 96), R(310, 103, 372, 143), R(382, 103, 444, 143), // quarto
      R(1206, 74, 1270, 96), R(1281, 74, 1344, 96), R(1206, 103, 1270, 138), R(1281, 103, 1344, 138), // cozinha
      R(373, 918, 434, 967), R(443, 918, 504, 967), R(1032, 918, 1098, 967), R(1101, 918, 1166, 967), // sala (parede de baixo)
    ],
  },

  blocks: [
    // Paredes externas
    R(0, 0, 40, 1024), // esquerda
    R(1496, 0, 1536, 1024), // direita
    // Quarto: parede do fundo + divisória com a cozinha
    R(0, 0, 875, 235),
    R(826, 0, 892, 488),
    // Cozinha: parede, geladeira, fogão e bancada
    R(875, 0, 1536, 300),
    // Divisória do meio + paredes da sala (passagens em x 155–270 e 910–1030)
    R(0, 484, 155, 690),
    R(270, 484, 910, 680),
    R(1030, 484, 1536, 690),
    // Parede de baixo (porta em x 690–800)
    R(0, 912, 690, 1024),
    R(800, 912, 1536, 1024),
    // Quarto
    R(40, 230, 258, 450), // cama (com folga dos lados para o cabelo não passar por cima)
    R(272, 230, 448, 338), // escrivaninha + cadeira
    R(458, 230, 538, 338), // penteadeira + banquinho
    R(538, 230, 640, 322), // espelho + planta
    R(635, 230, 818, 320), // guarda-roupa
    // Cozinha
    R(1045, 362, 1282, 470), // mesa + cadeiras (corredor livre entre o fogão e a cadeira de cima; a cadeira fica na frente de quem passa atrás)
    R(1408, 300, 1496, 388), // planta
    // Sala
    R(60, 700, 138, 735), // planta (vaso)
    R(218, 712, 318, 872), // rack da TV (encostado na parede: sem fresta atrás; embaixo dá pra passar)
    R(408, 690, 548, 724), // mesinha + abajur
    R(550, 690, 910, 745), // sofá
    R(1062, 690, 1290, 756), // estante
    R(1382, 740, 1480, 808), // planta
  ],

  props: [
    // porta-guarda-chuvas ao lado da porta (o rosa some quando a Bella pega)
    { key: 'prop-umbrella-stand', tx: 13.2, ty: 18.1, scale: 0.24, block: [0, 24, 23, 25], visibleIf: () => !objDone('guarda-chuva') },
    { key: 'prop-umbrella-stand-empty', tx: 13.2, ty: 18.1, scale: 0.24, block: [0, 24, 23, 25], visibleIf: () => objDone('guarda-chuva') },
  ],

  // (a chuva nas janelas já está desenhada no cenário)

  // Profundidade: TV e planta da sala na frente de quem passa atrás
  overlays: [
    { x0: 246, y0: 645, x1: 294, y1: 800, base: 882, cut: 'dark' }, // só a tela escura da TV
    { x0: 1360, y0: 660, x1: 1492, y1: 815, base: 808, cut: 'outline' }, // planta (recorte pelo contorno)
    { x0: 40, y0: 605, x1: 165, y1: 745, base: 738, cut: 'outline' }, // planta do canto da sala
    // cozinha: cadeiras dos lados e de baixo, e a planta do canto
    { x0: 1040, y0: 312, x1: 1290, y1: 475, base: 472, cut: 'furniture', slice: true },
    { x0: 1400, y0: 235, x1: 1500, y1: 392, base: 390, cut: 'furniture' },
    // vasos na parede de baixo: na frente de quem passa atrás deles
    { x0: 130, y0: 878, x1: 226, y1: 1012, base: 1010, cut: 'furniture' },
    { x0: 1295, y0: 872, x1: 1392, y1: 1006, base: 1004, cut: 'furniture' },
  ],

  hotspots: [
    // Quarto
    { rect: R(62, 175, 232, 466), interact: 'cama', label: 'Cama', markerIf: () => objActive('celular') },
    { rect: R(272, 150, 448, 338), interact: 'oculos', label: 'Escrivaninha', markerIf: () => objActive('oculos') && objDone('celular') },
    { rect: R(458, 150, 536, 338), interact: 'colar', label: 'Penteadeira', markerIf: () => objActive('colar') },
    {
      rect: R(538, 110, 604, 304),
      interact: 'espelho',
      label: 'Espelho',
      markerIf: () => objActive('espelho') && objDone('roupa') && objDone('oculos') && objDone('colar') && objDone('presente'),
    },
    { rect: R(635, 90, 818, 322), interact: 'guarda-roupa', label: 'Guarda-roupa', markerIf: () => objDone('celular') && objDone('oculos') && (objActive('roupa') || objActive('presente')) },
    // Cozinha
    { rect: R(940, 85, 1062, 302), interact: 'geladeira', label: 'Geladeira' },
    { rect: R(1066, 160, 1160, 302), interact: 'fogao', label: 'Fogão' },
    { rect: R(1160, 140, 1400, 330), interact: 'pia', label: 'Pia' },
    // Sala
    { rect: R(215, 650, 318, 888), interact: 'tv', label: 'TV' },
    { rect: R(1062, 545, 1290, 758), interact: 'estante', label: 'Estante' },
    { rect: R(550, 600, 910, 748), interact: 'sofa', label: 'Sentar' },
    {
      rect: R(620, 820, 700, 925),
      interact: 'guarda-chuva',
      label: 'Guarda-chuva',
      markerIf: () => objActive('guarda-chuva') && objDone('espelho'),
    },
  ],

  npcs: [
    // Pombo, o gato preto, passeando pela sala
    { id: 'pombo', sprite: 'pombo', tx: 20.5, ty: 17.0, facing: 'left', interact: 'pombo', behavior: 'wander', wanderRadius: 3, wanderAxis: 'x' },
    // Lala, a gata da Bella, dormindo no chão do quarto
    { id: 'lala', sprite: 'lala', tx: 14.1, ty: 8.2, facing: 'down', interact: 'lala', pose: { key: 'lala-poses', frame: 1 } },
    { id: 'mae-bella', sprite: 'mae-bella', tx: 23.6, ty: 16.4, facing: 'down', interact: 'mae', behavior: 'wander', wanderRadius: 2.2, wanderAxis: 'x', markerIf: () => objActive('mae') && GameState.is('weng-entrou') },
    { id: 'pai-bella', sprite: 'pai-bella', tx: 21.2, ty: 9.9, facing: 'down', interact: 'pai', behavior: 'wander', wanderRadius: 1.6, wanderAxis: 'x', markerIf: () => objActive('pai') && GameState.is('weng-entrou') },
    {
      id: 'weng',
      sprite: 'weng',
      tx: 15.5,
      ty: 16.8,
      facing: 'up',
      interact: 'weng',
      visibleIf: () => (GameState.is('weng-entrou') && !objDone('sair')) || QuestSystem.isActive('dq-e2'),
    },
  ],
  spawns: {
    start: { tx: 6.8, ty: 7.6, facing: 'down' },
    'from-rua': { tx: 15, ty: 17.5, facing: 'up' },
    'from-quintal': { tx: 14.6, ty: 15.6, facing: 'up' },
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
