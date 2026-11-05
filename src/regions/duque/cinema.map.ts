import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'dq-e3';
/** Retângulo no cenário ORIGINAL (art-source/maps/duque-cinema.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('dq-cine-1')) return;
    ctx.setFlag('dq-cine-1');
    ctx.place('player', 15.4, 8.6, 'down');
    ctx.place('weng', 17.0, 8.6, 'down');
    await ctx.narrate('Caxias Shopping. A sessão de Five Nights at Freddy\'s acabou de terminar.');
    ctx.face('player', 'right');
    ctx.face('weng', 'left');
    await ctx.say('weng', 'E aí? Deu medo?');
    await ctx.say('bella', 'Medo nenhum. Eu só apertei o seu braço umas... quarenta vezes.');
    await ctx.say('weng', 'Quarenta e três. Eu contei.');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'Bora tomar alguma coisa antes de ir embora?');
    await ctx.emote('weng', 'sweat');
    await ctx.say('weng', '(Ela não pode desconfiar de nada. Age normal, Weng. Normal.)');
    ctx.toast('Vá até a saída do cinema');
  },

  async saida(ctx) {
    if (!QuestSystem.isActive(Q) || ctx.objectiveDone(Q, 'saida')) {
      await ctx.teleport('duque-rua', 'from-multidao');
      return;
    }
    ctx.objective(Q, 'saida');
    ctx.sfx('blip');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Meu celular tá tocando. É a minha mãe.');
    await ctx.say('mae-tel', 'Bella, vem pra casa agora! A sua irmã tá passando mal!');
    await ctx.say('bella', 'Como assim, mãe?! O que ela tem?');
    await ctx.say('mae-tel', '...E a sua avó também! Vem logo, filha!');
    await ctx.say('bella', 'Ai, gente... tá bom. Tô indo.');
    ctx.face('player', 'weng');
    await ctx.emote('bella', 'sweat');
    await ctx.say('bella', 'Desculpa, Weng. Logo hoje... eu tava tão feliz.');
    await ctx.say('weng', 'Ei, relaxa. Eu te levo até em casa. Vai dar tudo certo.');
    await ctx.emote('weng', 'note');
    await ctx.say('weng', '(Vai dar MUITO certo.)');
    await ctx.fadeOut(600);
    await ctx.narrate('A Bella voltou pra Piabetá emburrada. O Weng, estranhamente tranquilo.');
    ctx.objective(Q, 'casa');
    await ctx.teleport('piabeta-casa-pedido', 'porta');
  },

  async bilheteria(ctx) {
    await ctx.say('bella', 'Sala 3, sessão das 19:30. A gente escolheu a de terror. Corajosos.');
  },
  async pipoca(ctx) {
    await ctx.say('weng', 'Pipoca grande. Que a gente comeu antes do filme começar.');
    await ctx.say('bella', 'Clássico.');
  },
  async cartaz(ctx) {
    await ctx.say('bella', 'Um cartaz de terror com uma casa mal-assombrada. Não, obrigada.');
  },
};

/** 3º encontro — saguão do cinema do Caxias Shopping. */
export const cinemaMap: MapDef = {
  id: 'duque-cinema',
  region: 'duque-de-caxias',
  name: 'Cinema do Caxias Shopping',
  indoor: true,
  music: 'rota66',
  background: '#2a1630',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 1536, 398), // fundo: bilheteria, entrada da sala, pipoca
    R(170, 380, 600, 585), // balcão da bilheteria
    R(240, 470, 650, 700), // fila com cordões
    R(955, 398, 1395, 528), // balcão da pipoca
    R(50, 455, 185, 645), // planta da esquerda
    R(0, 620, 150, 880), // sofá da esquerda
    R(1385, 460, 1480, 600), // planta da direita
    R(1285, 545, 1375, 695), // planta do meio
    R(1035, 540, 1240, 680), // sofá de cima
    R(1160, 650, 1300, 745), // mesinha
    R(1190, 715, 1430, 850), // sofá de baixo
    R(1375, 560, 1536, 790), // sofá do canto
    R(120, 842, 470, 1024), // floreira da esquerda
    R(1070, 842, 1410, 1024), // floreira da direita
    R(515, 715, 565, 970), // antifurto
    R(970, 715, 1020, 970),
    R(0, 880, 120, 1024),
    R(1410, 850, 1536, 1024),
  ],

  overlays: [
    { x0: 115, y0: 830, x1: 475, y1: 1000, base: 1000, cut: 'outline' },
    { x0: 1065, y0: 830, x1: 1415, y1: 1000, base: 1000, cut: 'outline' },
    { x0: 510, y0: 700, x1: 570, y1: 975, base: 970 },
    { x0: 965, y0: 700, x1: 1025, y1: 975, base: 970 },
    { x0: 1185, y0: 705, x1: 1435, y1: 855, base: 850, cut: 'outline' },
  ],

  hotspots: [
    { rect: R(170, 330, 600, 590), interact: 'bilheteria', label: 'Bilheteria' },
    { rect: R(955, 330, 1395, 530), interact: 'pipoca', label: 'Pipoca' },
    { rect: R(0, 200, 190, 660), interact: 'cartaz', label: 'Cartaz' },
  ],

  spawns: {
    sala: { tx: 15.4, ty: 8.6, facing: 'down' },
  },
  triggers: [{ id: 'saida', rect: R(575, 965, 965, 1024), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
