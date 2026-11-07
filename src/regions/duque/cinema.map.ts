import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'dq-e3';
/** Retângulo no cenário ORIGINAL (art-source/maps/duque-cinema-base.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('dq-cine-1')) return;
    ctx.setFlag('dq-cine-1');
    // chegam pelo corredor do shopping, lá embaixo (já nascem ali: nada de pular na tela)
    // e entram uns passos, pra ficar acima da caixa de diálogo
    ctx.follow('weng', false);
    ctx.place('player', 14.6, 18.4, 'up');
    ctx.place('weng', 16.4, 18.4, 'up');
    await Promise.all([ctx.move('player', 14.6, 15.2, 45), ctx.move('weng', 16.4, 15.2, 45)]);
    await ctx.narrate('Caxias Shopping. Sábado à noite.');
    await ctx.say('bella', 'Cheiro de pipoca. Esse é o melhor cheiro do mundo.');
    ctx.face('weng', 'bella');
    await ctx.say('weng', 'Já comprei os ingressos. Sala 3, Five Nights at Freddy\'s.');
    await ctx.emote('weng', 'sweat');
    await ctx.say('weng', '(E ela não pode desconfiar de NADA do que vem depois.)');
    ctx.face('player', 'weng');
    await ctx.say('bella', 'Você tá estranho. Tá com medo do filme?');
    await ctx.say('weng', 'Eu? Medo? De um urso animatrônico? ...Um pouco.');
    ctx.follow('weng', true);
    ctx.toast('Pegue a pipoca no balcão da direita');
  },

  async filme(ctx) {
    ctx.objective(Q, 'filme');
    await ctx.fadeOut(600);
    ctx.letterbox(true);
    await ctx.narrate('Sala 3. As luzes se apagam...');
    ctx.shake(400);
    ctx.sfx('cancel');
    await ctx.say('bella', 'AAAAH! (aperta o braço do Weng)');
    await ctx.say('weng', '(Ela tá segurando meu braço. Melhor filme da minha vida.)');
    ctx.shake(300);
    await ctx.say('bella', 'Não olha pra mim! Olha pro filme!');
    await ctx.say('weng', 'Tem filme passando?');
    await ctx.narrate('Duas horas, um balde de pipoca e quarenta e três apertões depois...');
    ctx.letterbox(false);
    ctx.place('player', 15.4, 8.6, 'right');
    ctx.place('weng', 17.0, 8.6, 'left');
    await ctx.fadeIn(600);
    await ctx.say('weng', 'E aí? Deu medo?');
    await ctx.say('bella', 'Medo nenhum. Eu só apertei o seu braço umas... quarenta vezes.');
    await ctx.say('weng', 'Quarenta e três. Eu contei.');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'Bora tomar alguma coisa antes de ir embora?');
    await ctx.emote('weng', 'sweat');
    await ctx.say('weng', '(Ela não pode desconfiar de nada. Age normal, Weng. Normal.)');
    ctx.follow('weng', true);
    ctx.toast('Vá até a saída do cinema');
  },

  async saida(ctx) {
    if (!QuestSystem.isActive(Q) || ctx.objectiveDone(Q, 'saida')) {
      await ctx.teleport('duque-rua', 'from-multidao');
      return;
    }
    if (!ctx.objectiveDone(Q, 'filme')) {
      await ctx.say('bella', 'Ei! A gente nem viu o filme ainda. E a pipoca?!');
      await ctx.move('player', ctx.playerTile().x, 18.4, 60);
      return;
    }
    ctx.objective(Q, 'saida');
    // a câmera sobe pra ver os dois acima da caixa de diálogo
    const t = ctx.playerTile();
    await ctx.frame(t.x, t.y, 400);
    ctx.sfx('msg');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Meu celular tá tocando. É a minha mãe.');
    await ctx.say('mae-tel', 'BELLA! Vem pra casa AGORA! A sua irmã caiu da escada, rolou e saiu voando!');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'COMO ASSIM SAIU VOANDO, MÃE?!');
    await ctx.say('mae-tel', '...E a sua avó também! Caiu da escada, rolou e saiu voando! As duas!');
    await ctx.say('bella', 'As DUAS?! Mãe, que história é essa?!');
    await ctx.say('mae-tel', 'Não discute! Vem logo, filha! Tchau!');
    await ctx.emote('weng', 'sweat');
    await ctx.say('weng', '(Sogra... criatividade nota mil. Credibilidade nota zero.)');
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
    if (QuestSystem.isActive(Q) && !ctx.objectiveDone(Q, 'filme')) {
      await ctx.say('atendente-cine', 'Boa noite! Vai querer qual?');
      const c = await ctx.choose('bella', '(O balde é enorme...)', ['"Uma grande, com bastante manteiga!"', '"Uma grande e um refri de 1 litro!"']);
      await ctx.say('atendente-cine', c === 0 ? 'Saindo uma grande, caprichada na manteiga!' : 'Grande e refrigerante gigante. Corajosos!');
      ctx.sfx('pickup');
      await ctx.emote('bella', 'heart');
      await ctx.say('weng', 'Aposto que acaba antes do filme começar.');
      await ctx.say('bella', 'Clássico.');
      await ctx.say('weng', 'Bora? A sessão já vai começar.');
      await scripts.filme(ctx);
      return;
    }
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

  // v2: cenário vazio (art-source/maps/duque-cinema-base.webp) + objetos da folha (objects/cn-*).
  // Versão anterior em backups/cinema-v1/.
  blocks: [
    R(0, 0, 1536, 398), // fundo: bilheteria, entrada da sala, pipoca
    R(170, 380, 605, 580), // balcão da bilheteria
    R(955, 398, 1395, 528), // balcão da pipoca
    R(0, 0, 40, 1024),
    R(1500, 0, 1536, 1024),
    R(250, 658, 370, 678),
    R(459, 546, 631, 566),
    R(417, 682, 599, 702),
    R(518, 946, 562, 968),
    R(973, 946, 1017, 968),
    R(1050, 610, 1230, 658),
    R(1206, 800, 1404, 848),
    R(24, 735, 120, 785),
    R(1420, 740, 1516, 790),
    R(1184, 692, 1276, 718),
    R(132, 905, 464, 1000),
    R(1074, 905, 1406, 1000),
    R(65, 617, 165, 645),
    R(1395, 537, 1485, 565),
    R(1293, 672, 1383, 700),
    R(593, 404, 657, 432),
    R(893, 404, 957, 432),
  ],

  objects: [
    { key: 'cn-cordao', x: 310, y: 678, w: 125, shadow: 0.7 },
    { key: 'cn-cordao', x: 545, y: 566, w: 180, shadow: 0.7 },
    { key: 'cn-cordao', x: 508, y: 702, w: 190, shadow: 0.7 },
    { key: 'cn-antifurto', x: 540, y: 968, w: 48, shadow: 0.7 },
    { key: 'cn-antifurto', x: 995, y: 968, w: 48, shadow: 0.7, flip: true },
    { key: 'cn-sofa', x: 1140, y: 658, w: 215, shadow: 0.7 },
    { key: 'cn-sofa', x: 1305, y: 848, w: 235, shadow: 0.7 },
    { key: 'cn-poltrona', x: 72, y: 785, w: 115, shadow: 0.7 },
    { key: 'cn-poltrona', x: 1468, y: 790, w: 115, shadow: 0.7, flip: true },
    { key: 'cn-mesinha', x: 1230, y: 718, w: 110, shadow: 0.7 },
    { key: 'cn-floreira', x: 298, y: 1000, w: 345, shadow: false },
    { key: 'cn-floreira', x: 1240, y: 1000, w: 345, shadow: false },
    { key: 'cn-planta', x: 115, y: 645, w: 118, shadow: 0.7 },
    { key: 'cn-planta', x: 1440, y: 565, w: 108, shadow: 0.7, flip: true },
    { key: 'cn-planta', x: 1338, y: 700, w: 108, shadow: 0.7 },
    { key: 'cn-planta', x: 625, y: 432, w: 76, shadow: 0.7 },
    { key: 'cn-planta', x: 925, y: 432, w: 76, shadow: 0.7, flip: true },
  ],

  hotspots: [
    { rect: R(170, 330, 600, 590), interact: 'bilheteria', label: 'Bilheteria' },
    { rect: R(955, 330, 1395, 530), interact: 'pipoca', label: 'Pipoca', markerIf: () => QuestSystem.isActive(Q) && !QuestSystem.isObjectiveDone(Q, 'filme') },
    { rect: R(0, 200, 190, 660), interact: 'cartaz', label: 'Cartaz' },
  ],

  spawns: {
    sala: { tx: 15.4, ty: 8.6, facing: 'down' },
    // chegada pelo corredor do shopping (entre os dois sensores antifurto)
    shopping: { tx: 14.6, ty: 18.4, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(575, 965, 965, 1024), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
