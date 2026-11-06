import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'pt-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/pt-hotel-fora.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('pt-chegou')) return;
    ctx.setFlag('pt-chegou');
    if (!ctx.questActive(Q) && !QuestSystem.isDone(Q)) ctx.startQuest(Q);
    await ctx.narrate('Petrópolis. O aniversário da Bella.');
    await ctx.narrate('Um hotel lá no alto do morro, com neblina e frio de verdade.');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'QUE FRIO! Weng, eu tô vendo a minha respiração!');
    await ctx.say('weng', 'Eu falei pra trazer casaco grosso. Feliz aniversário, meu amor.');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'É o melhor aniversário da minha vida. E ele mal começou.');
    ctx.toast('Explore o hotel. Tem um mirante à direita!');
  },

  async luneta(ctx) {
    await ctx.narrate('Pela luneta: montanhas, neblina e o céu de fim de tarde pintado de rosa e lilás.');
    await ctx.say('bella', 'Parece pintura. Dá pra ver a serra inteira daqui.');
    await ctx.say('weng', 'Eu escolhi esse hotel por causa dessa vista. E por sua causa.');
    if (objActive('mirante')) {
      ctx.objective(Q, 'mirante');
      ctx.hearts('player', 8);
      ctx.toast('Agora, o check-in na recepção');
    }
  },
  async porta(ctx) {
    if (!objDone('mirante')) {
      await ctx.say('weng', 'Antes do check-in... vem ver o mirante. Confia.');
      return;
    }
    if (objActive('checkin')) {
      ctx.objective(Q, 'checkin');
      await ctx.say('bella', 'Check-in feito! Bora ver o quarto!');
      await ctx.narrate('O quarto, o almoço chique, o Quitandinha e o piquenique... essa parte da viagem chega em breve!');
      return;
    }
    await ctx.say('bella', 'A recepção. Tem chocolate quente de boas-vindas!');
  },
  async varanda(ctx) {
    await ctx.say('bella', 'Mesinhas com guarda-sol e velinha. Café da manhã aqui amanhã, combinado?');
  },
  async placa(ctx) {
    await ctx.say('bella', '"Mirante →" e "Recepção ↑". Até a placa é fofa.');
  },
  async banco1(ctx) {
    await ctx.sit(340, 598, [['bella', 'Que friozinho gostoso.'], ['weng', 'Vem mais pra cá. Pra esquentar.']], { key: 'bench-pq-ang-l', x: 340, y: 615, w: 118 });
  },
  async banco2(ctx) {
    await ctx.sit(975, 678, [['weng', 'Feliz aniversário. De novo.'], ['bella', 'Pode falar quantas vezes quiser.']], { key: 'bench-pq-ang-r', x: 975, y: 695, w: 116 });
  },
  async saida(ctx) {
    await ctx.say('weng', 'A estrada tá cheia de neblina. Melhor ficar por aqui hoje.');
    const t = ctx.playerTile();
    await ctx.move('player', t.x, t.y - 1.2, 60);
  },
};

/** Capítulo 3 — Petrópolis: o hotel no alto do morro (exterior). */
export const hotelForaMap: MapDef = {
  id: 'pt-hotel-fora',
  region: 'petropolis',
  name: 'Hotel no morro',
  music: 'parque',
  background: '#2a2440',
  art: 'native',
  ambient: 'fireflies',
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 1536, 250), // céu, telhados e árvores do fundo
    R(140, 250, 572, 452), // casa e varanda (terraço elevado)
    R(668, 250, 965, 392), // casa (direita)
    R(500, 395, 578, 470), // muro à esquerda da escada
    R(714, 388, 760, 472), // muro à direita da escada
    R(760, 392, 1000, 478), // canteiro de hortênsias e pedras
    R(965, 250, 1536, 425), // floresta e serra atrás do mirante
    R(1045, 425, 1068, 505), // grade esquerda do mirante
    R(1150, 500, 1405, 552), // grade da frente do mirante
    R(1395, 420, 1536, 600), // floresta à direita
    R(1068, 552, 1405, 650), // pedras embaixo do mirante
    R(1195, 600, 1536, 820), // árvores da direita
    R(0, 250, 140, 650), // árvores da esquerda
    R(85, 560, 230, 652), // hortênsias da esquerda
    R(0, 640, 665, 1024), // estacionamento e muros
    R(436, 615, 500, 675), // pedra
    R(515, 455, 605, 520), // canteiro ao lado da escada
    R(712, 600, 852, 650), // canteiro de hortênsias azuis
    R(606, 560, 630, 586), // pés dos postes
    R(805, 680, 828, 706),
    R(768, 450, 790, 472),
    R(876, 570, 892, 592), // placa
    R(285, 560, 395, 615), // banco da esquerda
    R(240, 565, 280, 615), // lixeira
    R(918, 640, 1030, 694), // banco da direita
    R(880, 630, 915, 676), // lixeira
    R(672, 790, 742, 945), // pilar do portão (esq.)
    R(940, 770, 1058, 945), // portão aberto + pilar (dir.)
    R(1040, 790, 1536, 1024), // cerca e hortênsias da direita
    R(0, 1000, 1536, 1024),
  ],

  overlays: [
    { x0: 600, y0: 440, x1: 636, y1: 586, base: 586, cut: 'column', tall: true },
    { x0: 800, y0: 600, x1: 832, y1: 706, base: 706, cut: 'column', tall: true },
    { x0: 762, y0: 400, x1: 794, y1: 472, base: 472, cut: 'column', tall: true },
    { x0: 670, y0: 730, x1: 745, y1: 945, base: 945 },
    { x0: 990, y0: 730, x1: 1060, y1: 945, base: 945 },
    { x0: 0, y0: 100, x1: 160, y1: 650, base: 650, cut: 'foliage', fade: true, tall: true },
    { x0: 1200, y0: 560, x1: 1536, y1: 820, base: 820, cut: 'foliage', fade: true, tall: true },
    { x0: 280, y0: 520, x1: 400, y1: 618, base: 615, cut: 'outline' },
    { x0: 912, y0: 600, x1: 1035, y1: 696, base: 694, cut: 'outline' },
  ],

  lighting: {
    darkness: 0.22,
    color: 0x2a2060,
    lights: [
      { x: 618, y: 460, r: 170 }, { x: 816, y: 620, r: 160 }, { x: 778, y: 420, r: 140 },
      { x: 705, y: 760, r: 150 }, { x: 1020, y: 760, r: 150 }, { x: 1200, y: 365, r: 150 }, { x: 1385, y: 405, r: 150 },
      { x: 630, y: 330, r: 200 }, { x: 380, y: 330, r: 220 }, { x: 160, y: 270, r: 130 },
    ],
  },

  hotspots: [
    { rect: R(1265, 395, 1310, 480), interact: 'luneta', label: 'Luneta', markerIf: () => objActive('mirante') },
    { rect: R(595, 300, 672, 400), interact: 'porta', label: 'Recepção', markerIf: () => objActive('checkin') && objDone('mirante') },
    { rect: R(160, 380, 560, 460), interact: 'varanda', label: 'Varanda' },
    { rect: R(855, 500, 910, 595), interact: 'placa', label: 'Placa' },
    { rect: R(285, 520, 395, 618), interact: 'banco1', label: 'Sentar' },
    { rect: R(918, 600, 1030, 696), interact: 'banco2', label: 'Sentar' },
  ],

  spawns: {
    portao: { tx: 17.7, ty: 18.6, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(745, 955, 940, 1000), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
