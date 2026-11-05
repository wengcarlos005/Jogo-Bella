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
    if (!objActive('mexicano')) {
      await ctx.say('bella', 'O nosso mexicano. Ainda dá pra sentir o gosto daquela bebida.');
      return;
    }
    await ctx.fadeOut(400);
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
    await ctx.narrate('O terceiro encontro seria o do pedido de namoro... (essa parte da história chega em breve).');
    await ctx.chapterCard('Fim do Capítulo 1', 'Piabetá', 'O segundo encontro.', 'Continuar');
    await ctx.chapterCard('Capítulo 2', 'Duque de Caxias', 'Nosso cantinho. Já namorando: a primeira vez no apê do Weng.', 'Começar');
    await ctx.teleport('duque-apto', 'porta');
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
    R(365, 560, 470, 640), // vaso
    R(440, 585, 662, 692), // mesa 1
    R(695, 585, 892, 656), // mesa 2
    R(1015, 600, 1135, 662), // cavalete
    R(1150, 585, 1368, 692), // mesa 3
    R(1383, 585, 1612, 656), // mesa 4
    R(1555, 585, 1650, 652), // vaso
    R(0, 762, 1672, 941), // rua
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
    { rect: R(440, 520, 662, 692), interact: 'mesa', label: 'Mesa' },
  ],

  spawns: {
    'from-parque': { tx: 5.2, ty: 12.4, facing: 'down' },
  },
  triggers: [{ id: 'parque', rect: R(195, 300, 310, 330), script: 'parque' }],
  scripts,
  onEnter: 'chegada',
};
