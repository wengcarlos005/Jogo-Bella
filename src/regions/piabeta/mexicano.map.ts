import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'dq-e2';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-mexicano.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (!objActive('mexicano') || ctx.flag('dq-mex-dentro')) return;
    ctx.setFlag('dq-mex-dentro');
    await ctx.say('bella', 'Olha isso! Bandeirinha, cacto, chapéu na parede... é tudo colorido!');
    await ctx.say('weng', 'Vamos sentar naquela mesa do meio?');
    ctx.toast('Sentem na mesa do meio');
  },

  async mesa(ctx) {
    if (!objActive('mexicano')) {
      await ctx.say('bella', 'A nossa mesa. Ainda tem gotinha da bebida na toalha.');
      return;
    }
    await ctx.fadeOut(400);
    ctx.follow('weng', false);
    ctx.place('player', 14.0, 10.6, 'right');
    ctx.place('weng', 18.0, 10.6, 'left');
    await ctx.backdrop('memory-dq-04');
    await ctx.say('garcom', '¡Bienvenidos! Primeira vez aqui? Então vocês ganham uma bebida de cortesia da casa!');
    await ctx.say('bella', 'De graça?! Hoje é o nosso dia.');
    await ctx.say('garcom', 'E pra entrar no clima... os chapéus!');
    await ctx.say('weng', 'Bella. Você tá linda de chapéu mexicano.');
    await ctx.say('bella', 'Você tá ridículo. E eu amei.');
    const c = await ctx.choose('bella', '(A bebida chegou, gelada e colorida)', ['Brindar: "Ao segundo encontro!"', 'Brindar: "Aos próximos!"']);
    await ctx.say('weng', c === 0 ? 'Ao segundo encontro! E ao churrasco do Alexandre, que eu sobrevivi.' : 'Aos próximos. Muitos próximos.');
    await ctx.say('bella', 'Hmm... que bebida gostosa! O que tem nisso?');
    await ctx.say('garcom', 'Segredo da casa, señorita.');
    await ctx.say('weng', 'A gente vai ter que voltar até descobrir.');
    await ctx.backdrop(null);
    ctx.objective(Q, 'mexicano');
    await ctx.memory('mem-dq-04');
    await ctx.fadeOut(600);
    await ctx.narrate('E ali, de chapéu gigante e rindo de tudo, a Bella teve certeza: era ele.');
    await ctx.chapterCard('Terceiro encontro', 'Caxias Shopping', 'Cinema, uma ligação inesperada e uma surpresa.', 'Continuar');
    ctx.startQuest('dq-e3');
    await ctx.teleport('duque-cinema', 'sala');
  },

  async bar(ctx) {
    await ctx.say('bella', 'Três jarras de suco: limão, manga e morango. A bebida da casa é segredo.');
  },
  async chapeus(ctx) {
    await ctx.say('weng', 'Um cabideiro só de chapéu mexicano. Esse lugar me entende.');
  },
  async saida(ctx) {
    await ctx.teleport('piabeta-mexicano-fora', 'from-parque');
  },
};

/** 2º encontro — restaurante mexicano por dentro. */
export const mexicanoMap: MapDef = {
  id: 'piabeta-mexicano',
  region: 'piabeta',
  name: 'Restaurante mexicano',
  indoor: true,
  music: 'rota66',
  background: '#3a1a10',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 1536, 318), // paredes do fundo
    R(0, 0, 44, 1024),
    R(1496, 0, 1536, 1024),
    R(100, 290, 592, 500), // balcão + banquetas
    R(925, 290, 1010, 372), // cacto
    R(1040, 268, 1308, 520), // mesa de cima à direita
    R(1360, 440, 1455, 545), // cacto grande
    R(55, 545, 140, 635), // cacto florido
    R(30, 745, 175, 835), // planta
    R(650, 410, 912, 662), // mesa do meio
    R(250, 530, 528, 768), // mesa da esquerda
    R(1048, 535, 1335, 798), // mesa da direita
    R(1410, 760, 1495, 835), // cacto da direita
    R(0, 835, 640, 1024), // parede de baixo (porta em x 640–840)
    R(840, 835, 1536, 1024),
    R(640, 960, 840, 1024),
  ],

  overlays: [
    { x0: 640, y0: 380, x1: 918, y1: 666, base: 662, cut: 'furniture', slice: true },
    { x0: 244, y0: 525, x1: 532, y1: 772, base: 768, cut: 'furniture', slice: true },
    { x0: 1042, y0: 530, x1: 1340, y1: 802, base: 798, cut: 'furniture', slice: true },
    { x0: 1034, y0: 260, x1: 1312, y1: 522, base: 520, cut: 'furniture', slice: true },
    { x0: 920, y0: 210, x1: 1012, y1: 376, base: 372, cut: 'outline', fade: true },
    { x0: 1350, y0: 310, x1: 1460, y1: 548, base: 545, cut: 'outline', fade: true },
    { x0: 45, y0: 455, x1: 145, y1: 638, base: 635, cut: 'outline', fade: true },
    { x0: 20, y0: 655, x1: 185, y1: 838, base: 835, cut: 'outline', fade: true },
    { x0: 1400, y0: 668, x1: 1500, y1: 838, base: 835, cut: 'outline', fade: true },
    { x0: 100, y0: 285, x1: 595, y1: 505, base: 500, cut: 'furniture', slice: true },
  ],

  hotspots: [
    { rect: R(650, 380, 912, 662), interact: 'mesa', label: 'Sentar', markerIf: () => objActive('mexicano') && objDone('passeio') },
    { rect: R(100, 280, 592, 505), interact: 'bar', label: 'Balcão' },
    { rect: R(915, 745, 1065, 840), interact: 'chapeus', label: 'Chapéus' },
  ],

  spawns: {
    porta: { tx: 14.9, ty: 17.4, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(650, 925, 830, 960), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
