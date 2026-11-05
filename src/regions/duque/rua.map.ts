import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';

/**
 * Retângulo medido no cenário ORIGINAL (art-source/maps/duque-rua.webp, 1536x1024).
 * 48 px da imagem = 1 tile (16 px lógicos).
 * Em cima: portaria do prédio do Weng (esq.) e a praça com o Teatro Raul Cortez (dir.);
 * meio: a avenida; embaixo: o Shopping da Multidão.
 */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const ROW = '.'.repeat(32);

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('dq-rua-1')) return;
    ctx.setFlag('dq-rua-1');
    await ctx.say('weng', 'Essa é a minha rua. Ali na frente, o Multidão. E ali do lado, o teatro.');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'Você mora no melhor lugar do mundo e nunca me contou.');
    ctx.toast('A açaiteria fica à direita, pela calçada do Multidão');
  },
  async portaria(ctx) {
    await ctx.teleport('duque-apto', 'porta');
  },
  async teatro(ctx) {
    await ctx.say('bella', 'O Teatro Raul Cortez. Daqui de baixo a rampa parece que flutua mesmo.');
    await ctx.say('weng', 'Um dia a gente vem ver uma peça aqui. Combinado?');
    await ctx.say('bella', 'Combinado. E depois açaí.');
  },
  async multidao(ctx) {
    await ctx.say('bella', 'O Shopping da Multidão... Weng, segura minha mão. Se eu entrar, eu saio sem dinheiro.');
    await ctx.say('weng', 'Hoje não. Mas outro dia eu te trago com um orçamento. Um orçamento PEQUENO.');
    ctx.toast('Os achadinhos do Multidão chegam em breve!');
    await ctx.move('player', 15.2, 17.6, 60);
  },
  async mercado(ctx) {
    await ctx.say('weng', 'O mercado fica pra lá. Fica pra outro dia.');
    await ctx.move('player', 1.4, 16.3, 60);
  },
  async acai(ctx) {
    await ctx.teleport('duque-acai', 'porta');
  },
  async banco1(ctx) {
    await ctx.sit(1008, 352, [['weng', 'Daqui dá pra ver o teatro inteirinho.'], ['bella', 'E as luzes acendendo. Que lindo.']]);
  },
  async banco2(ctx) {
    await ctx.sit(1341, 352, [['bella', 'Esse banco tem a melhor vista da rampa.'], ['weng', 'E eu tenho a melhor vista do banco.']]);
  },
  async onibus(ctx) {
    await ctx.say('bella', 'Ponto de ônibus. Daqui eu volto pra Piabetá... mas hoje não.');
  },
  async vitrine(ctx) {
    await ctx.say('bella', 'Bala de goma, pirulito, pote de doce... a vitrine tá me chamando.');
  },
};

/** Capítulo 1 — rua do prédio do Weng (Duque de Caxias), cenário pintado. */
export const duqueRuaMap: MapDef = {
  id: 'duque-rua',
  region: 'duque-de-caxias',
  name: 'Rua do Weng',
  music: 'fragoso',
  background: '#2a1d2a',
  art: 'native',
  legend: { '.': T.SIDEWALK },
  ground: Array.from({ length: 22 }, () => ROW),

  blocks: [
    // Em cima, à esquerda: prédio, muro, portaria e guarita (o portão é a entrada)
    R(0, 0, 330, 385),
    R(430, 0, 650, 385),
    R(330, 0, 430, 365),
    // Praça: ipê rosa, árvores, teatro e rampa
    R(610, 0, 890, 275),
    R(668, 280, 752, 318), // canteiro redondo do ipê
    R(880, 0, 1470, 235), // teatro
    R(1180, 135, 1450, 305), // rampa
    R(895, 150, 1042, 332), // árvore da frente (copa sólida)
    R(1450, 0, 1536, 330), // árvores da direita
    R(830, 308, 950, 381), // canteiros
    R(1049, 292, 1110, 369),
    R(1210, 315, 1291, 373),
    R(1399, 315, 1536, 381),
    R(765, 280, 832, 323), // banco perto do ipê
    R(964, 327, 1053, 385), // bancos
    R(1291, 327, 1391, 385),
    R(1118, 342, 1145, 385), // lixeira
    R(787, 385, 810, 400), // postes
    R(853, 395, 872, 418),
    R(1064, 380, 1099, 398),
    R(1414, 395, 1449, 418),
    R(25, 535, 60, 555), // postes da avenida
    R(1475, 535, 1510, 555),
    // Embaixo: Shopping da Multidão (a porta fica em x 610–900)
    R(115, 560, 1420, 868),
    R(38, 680, 62, 705), // poste da calçada esquerda
    R(1465, 690, 1495, 710), // poste da calçada direita
    R(560, 840, 600, 882), // vasos da porta
    R(898, 840, 955, 882),
    R(240, 900, 378, 955), // floreiras
    R(997, 900, 1103, 955),
    R(1110, 900, 1149, 950), // lixeira
    R(1150, 860, 1390, 965), // ponto de ônibus
    R(1380, 900, 1410, 962), // placa do ponto
    R(0, 985, 1536, 1024), // meio-fio de baixo
  ],

  overlays: [
    { x0: 1245, y0: 525, x1: 1456, y1: 780, base: 780, cut: 'foliage', fade: true }, // árvore do Multidão
    { x0: 548, y0: 775, x1: 604, y1: 884, base: 882, cut: 'foliage' },
    { x0: 893, y0: 775, x1: 960, y1: 884, base: 882, cut: 'foliage' },
    { x0: 236, y0: 862, x1: 380, y1: 956, base: 955, cut: 'foliage' },
    { x0: 994, y0: 860, x1: 1106, y1: 956, base: 955, cut: 'foliage' },
    { x0: 780, y0: 225, x1: 818, y1: 402, base: 400, cut: 'lamp' },
    { x0: 848, y0: 110, x1: 878, y1: 420, base: 418, cut: 'lamp' },
    { x0: 1060, y0: 222, x1: 1104, y1: 400, base: 398, cut: 'lamp' },
    { x0: 1408, y0: 205, x1: 1455, y1: 420, base: 418, cut: 'lamp' },
  ],

  lighting: {
    darkness: 0.16,
    lights: [
      { x: 798, y: 245, r: 150 },
      { x: 862, y: 130, r: 150 },
      { x: 1082, y: 240, r: 150 },
      { x: 1432, y: 225, r: 150 },
      { x: 220, y: 600, r: 170 },
      { x: 1360, y: 610, r: 170 },
      { x: 750, y: 800, r: 220 },
      { x: 382, y: 290, r: 140 },
    ],
  },

  hotspots: [
    { rect: R(1040, 180, 1300, 300), interact: 'teatro', label: 'Teatro' },
    { rect: R(964, 300, 1053, 387), interact: 'banco1', label: 'Sentar' },
    { rect: R(1291, 300, 1391, 387), interact: 'banco2', label: 'Sentar' },
    { rect: R(1150, 790, 1410, 965), interact: 'onibus', label: 'Ponto' },
    { rect: R(955, 700, 1150, 882), interact: 'vitrine', label: 'Vitrine' },
  ],

  spawns: {
    portaria: { tx: 7.4, ty: 7.8, facing: 'down' },
    'from-acai': { tx: 30.3, ty: 16.3, facing: 'left' },
    'from-multidao': { tx: 15.2, ty: 17.7, facing: 'down' },
  },
  triggers: [
    { id: 'portaria', rect: R(332, 368, 428, 392), script: 'portaria' },
    { id: 'multidao', rect: R(615, 862, 895, 880), script: 'multidao' },
    { id: 'mercado', rect: R(0, 760, 24, 960), script: 'mercado' },
    { id: 'acai', rect: R(1512, 760, 1536, 960), script: 'acai' },
  ],
  scripts,
  onEnter: 'chegada',
};
