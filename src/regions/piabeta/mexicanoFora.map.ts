import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'dq-e2';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-mexicano-fora.webp, 1672x941). 48 px = 1 tile. */
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

  blocks: [
    R(0, 0, 195, 610), // praça: grama e grade
    R(195, 0, 310, 300), // caminho da praça (a saída fica na ponta)
    R(310, 0, 360, 625), // pilar do portão
    R(355, 0, 880, 585), // fachada (esq.)
    R(880, 0, 1080, 520), // porta
    R(1080, 0, 1672, 585), // fachada (dir.)
    R(1610, 0, 1672, 760), // prédio vizinho
    // calçada: mesas medidas pela arte (pés das cadeiras incluídos)
    R(330, 560, 400, 625), // vaso da esquerda
    R(383, 590, 577, 700), // mesa 1 (guarda-sol)
    R(602, 578, 777, 692), // mesa 2
    R(770, 540, 860, 600), // cacto da esquerda
    R(1015, 600, 1135, 662), // cavalete
    R(1105, 540, 1195, 600), // cacto da direita
    R(1181, 585, 1366, 695), // mesa 3
    R(1381, 580, 1547, 695), // mesa 4 (guarda-sol)
    R(1560, 580, 1645, 655), // vaso da direita
    R(0, 762, 1672, 941), // rua
  ],

  // cadeiras e mesas da calçada: cada faixa na sua profundidade (quem passa do lado fica atrás do encosto da frente)
  overlays: [
    { x0: 378, y0: 540, x1: 582, y1: 712, base: 700, cut: 'furniture', slice: true },
    { x0: 597, y0: 535, x1: 782, y1: 700, base: 692, cut: 'furniture', slice: true },
    { x0: 1176, y0: 540, x1: 1371, y1: 705, base: 695, cut: 'furniture', slice: true },
    { x0: 1376, y0: 535, x1: 1552, y1: 705, base: 695, cut: 'furniture', slice: true },
  ],

  lighting: {
    darkness: 0.35,
    lights: [
      { x: 1008, y: 330, r: 240 },
      { x: 625, y: 455, r: 180 },
      { x: 1395, y: 440, r: 180 },
      { x: 550, y: 630, r: 120, flicker: true },
      { x: 788, y: 610, r: 120, flicker: true },
      { x: 1270, y: 640, r: 120, flicker: true },
      { x: 1460, y: 610, r: 120, flicker: true },
      { x: 280, y: 330, r: 160 },
    ],
  },

  hotspots: [
    { rect: R(880, 380, 1080, 590), interact: 'porta', label: 'Entrar', markerIf: () => objActive('mexicano') },
    { rect: R(1015, 520, 1135, 662), interact: 'cardapio', label: 'Cardápio' },
    { rect: R(383, 540, 577, 700), interact: 'mesa', label: 'Mesa' },
  ],

  spawns: {
    'from-parque': { tx: 5.2, ty: 12.4, facing: 'down' },
    // saindo do restaurante: na calçada, de frente pra porta
    'from-dentro': { tx: 19.9, ty: 13.6, facing: 'down' },
  },
  triggers: [{ id: 'parque', rect: R(195, 300, 310, 330), script: 'parque' }],
  scripts,
  onEnter: 'chegada',
};
