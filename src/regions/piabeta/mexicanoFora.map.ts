import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'dq-e2';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-mexicano-fora-base.webp, 1672x941). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (objActive('mexicano') && !ctx.flag('dq-mex-visto')) {
      ctx.setFlag('dq-mex-visto');
      await ctx.say('bella', 'Olha esse restaurante! Tudo colorido, com luzinha e cacto na porta.');
      await ctx.say('weng', 'Tô morrendo de curiosidade. Vamos entrar?');
      ctx.toast('Entre no restaurante');
    }
  },

  async porta(ctx) {
    await ctx.teleport('piabeta-mexicano', 'porta');
  },
  async cardapio(ctx) {
    await ctx.say('bella', 'Um quadro-negro com um chapéu desenhado. "Hoje: nachos e bebida da casa."');
  },
  async mesa(ctx) {
    await ctx.say('bella', 'Mesinha na calçada com toalha listrada e lanterninha. Que charme.');
  },
  async parque(ctx) {
    await ctx.teleport('piabeta-parque', 'from-mexicano');
  },
};

/** Capítulo 1 — rua do restaurante mexicano, ao lado da praça do primeiro beijo. */
export const mexicanoForaMap: MapDef = {
  id: 'piabeta-mexicano-fora',
  region: 'piabeta',
  name: 'Restaurante mexicano',
  music: 'parque',
  background: '#2a1a1e',
  art: 'native',
  legend: { '.': T.SIDEWALK },
  ground: Array.from({ length: 20 }, () => '.'.repeat(35)),

  // v2: cenário vazio (art-source/maps/piabeta-mexicano-fora-base.webp) + objetos da folha (objects/mxf-*).
  // Versão anterior em backups/mexicano-v1/.
  blocks: [
    R(0, 0, 140, 612), // jardim da praça e a grade
    R(140, 0, 305, 300), // árvores da praça (o caminho de pedra fica livre)
    R(300, 0, 356, 612), // pilar do portão
    R(356, 0, 865, 592), // fachada (esq.)
    R(865, 0, 1080, 548), // porta (dá pra chegar no capacho)
    R(1080, 0, 1555, 592), // fachada (dir.)
    R(1550, 0, 1672, 602), // prédio vizinho
    R(0, 772, 1672, 941), // meio-fio e rua
    R(439, 632, 601, 705),
    R(1239, 632, 1401, 705),
    R(759, 584, 811, 610),
    R(1134, 584, 1186, 610),
    R(369, 589, 421, 615),
    R(1489, 589, 1541, 615),
    R(1070, 664, 1120, 690),
    R(688, 738, 712, 755),
    R(1578, 738, 1602, 755),
  ],

  objects: [
    { key: 'mxf-guardasol', x: 520, y: 672, w: 150, shadow: false },
    { key: 'mxf-mesa', x: 520, y: 705, w: 180, shadow: 0.8 },
    { key: 'mxf-guardasol', x: 1320, y: 672, w: 150, shadow: false },
    { key: 'mxf-mesa', x: 1320, y: 705, w: 180, shadow: 0.8 },
    { key: 'mxf-cacto', x: 785, y: 610, w: 64, shadow: 0.7 },
    { key: 'mxf-cacto', x: 1160, y: 610, w: 64, shadow: 0.7, flip: true },
    { key: 'mxf-flores', x: 395, y: 615, w: 64, shadow: 0.7 },
    { key: 'mxf-flores', x: 1515, y: 615, w: 64, shadow: 0.7, flip: true },
    { key: 'mxf-lousa', x: 1095, y: 690, w: 62, shadow: 0.7 },
    { key: 'mxf-poste', x: 700, y: 755, w: 54, shadow: 0.5 },
    { key: 'mxf-poste', x: 1590, y: 755, w: 54, shadow: 0.5 },
  ],

  lighting: {
    darkness: 0.35,
    lights: [
      { x: 975, y: 330, r: 260 },
      { x: 808, y: 385, r: 150 },
      { x: 1135, y: 385, r: 150 },
      { x: 560, y: 380, r: 170 },
      { x: 1400, y: 380, r: 170 },
      { x: 520, y: 640, r: 110, flicker: true },
      { x: 1320, y: 640, r: 110, flicker: true },
      { x: 717, y: 545, r: 210 },
      { x: 1607, y: 545, r: 210 },
    ],
  },

  hotspots: [
    { rect: R(865, 380, 1080, 600), interact: 'porta', label: 'Entrar', markerIf: () => objActive('mexicano') },
    { rect: R(1060, 600, 1130, 690), interact: 'cardapio', label: 'Cardápio' },
    { rect: R(430, 570, 610, 705), interact: 'mesa', label: 'Mesa' },
  ],

  spawns: {
    'from-parque': { tx: 4.1, ty: 12.4, facing: 'down' },
    // saindo do restaurante: na calçada, de frente pra porta
    'from-dentro': { tx: 19.75, ty: 12.4, facing: 'down' },
  },
  triggers: [{ id: 'parque', rect: R(150, 300, 295, 330), script: 'parque' }],
  scripts,
  onEnter: 'chegada',
};
