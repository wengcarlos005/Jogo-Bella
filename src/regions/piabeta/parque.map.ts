import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL, dateOrPlaceholder } from '@/data/personal';

const Q = 'pia-m3';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-parque.png, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async entrar(ctx) {
    if (ctx.objectiveDone(Q, 'passear') && !ctx.objectiveDone(Q, 'beijo')) ctx.weather('rain');
    if (ctx.objectiveDone(Q, 'beijo')) ctx.weather('sunset');
    if (ctx.questActive('dq-e2') && !ctx.objectiveDone('dq-e2', 'passeio')) {
      ctx.objective('dq-e2', 'passeio');
      await ctx.wait(300);
      await ctx.say('bella', 'A nossa praça. Olha o coreto ali...');
      await ctx.say('weng', 'Foi ali. Debaixo da chuva.');
      await ctx.emote('bella', 'heart');
      await ctx.say('bella', 'Eu lembro de cada segundo.');
      await ctx.say('weng', 'Tem um restaurante mexicano aqui do lado, saindo pela direita. Bora conhecer?');
      ctx.toast('Saia da praça pela direita');
      return;
    }
    if (!ctx.questActive(Q) || ctx.objectiveDone(Q, 'parque')) return;
    ctx.objective(Q, 'parque');
    await ctx.wait(300);
    await ctx.say('weng', 'Olha só esse lugar. Com essas luzinhas acesas fica ainda mais bonito.');
    await ctx.say('bella', 'Parece cenário de filme. Primeiro a jukebox, agora isso...');
    await ctx.say('weng', 'Eu me esforcei, tá? Vamos andar um pouco?');
  },

  async chuva(ctx) {
    ctx.objective(Q, 'passear');
    await ctx.say('weng', 'Sabe o que eu mais gostei de hoje?');
    await ctx.say('bella', 'O hambúrguer?');
    await ctx.say('weng', 'Quase. Foi a parte em que você riu de mim no Uber.');
    await ctx.emote('bella', 'question');
    ctx.weather('rain');
    ctx.shake(200);
    await ctx.wait(900);
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Isso é... chuva?!');
    await ctx.say('weng', 'É chuva! Corre, o coreto! Lá em cima!');
    ctx.toast('Corra para o coreto!');
  },

  async beijo(ctx) {
    ctx.objective(Q, 'abrigo');
    await ctx.fadeOut(300);
    ctx.follow('weng', false);
    // dentro do coreto, no piso, entre as colunas da frente
    ctx.place('player', 12.75, 5.45, 'right');
    ctx.place('weng', 14.35, 5.45, 'left');
    await ctx.fadeIn(500);
    ctx.letterbox(true);
    await ctx.focus(13.5, 4.9, 1.5, 1200);

    await ctx.say('bella', 'Que chuva é essa?! Do nada!');
    await ctx.say('weng', 'Pelo menos a gente achou o coreto a tempo. Mais ou menos a tempo.');
    await ctx.say('bella', 'Eu tô encharcada. E o meu cabelo...');
    await ctx.say('weng', 'Tá linda mesmo assim.');
    const c1 = await ctx.choose('bella', '(...)', ['Rir de nervoso', 'Dar um empurrãozinho nele', 'Ficar em silêncio, olhando pra ele']);
    if (c1 === 0) await ctx.say('weng', 'Viu? Você ri e eu fico sem saber o que falar.');
    else if (c1 === 1) await ctx.say('weng', 'Ei! Eu tô sendo romântico aqui!');
    else await ctx.emote('weng', 'sweat');

    await ctx.narrate('A chuva caía forte lá fora. Mas, ali dentro, o mundo parecia ter parado.');
    await ctx.say('weng', 'Bella... posso te falar uma coisa?');
    await ctx.say('weng', 'Hoje foi o melhor dia que eu tive em muito tempo.');
    await ctx.choose('bella', '(O coração disparou)', ['"Pra mim também."', 'Chegar mais perto']);
    if (ctx.flag('vale-beijo-entregue')) {
      await ctx.say('weng', 'Será que... eu já posso usar o meu Vale Beijo?');
      await ctx.choose('bella', '(...)', ['"Pode."', 'Responder com um sorriso']);
    }

    await Promise.all([ctx.move('player', 13.2, 5.45, 12), ctx.move('weng', 13.85, 5.45, 12)]);
    ctx.face('player', 'right');
    ctx.face('weng', 'left');
    await ctx.focus(13.5, 4.7, 2.1, 2200);
    await ctx.kiss();
    await ctx.fadeOut(1600, '#fff3f6');
    ctx.objective(Q, 'beijo');
    await ctx.illustration('memory-pia-03', ['O primeiro beijo.', `Piabetá, ${dateOrPlaceholder(PERSONAL.dates.firstKiss)}. Debaixo de chuva.`]);

    ctx.weather('clear');
    await ctx.unfocus(10);
    ctx.letterbox(false);
    await ctx.fadeIn(1500);
    await ctx.say('weng', '...A chuva passou.');
    await ctx.say('bella', 'Passou nada. Eu nem percebi.');
    await ctx.emote('weng', 'heart');
    await ctx.memory('mem-pia-03');
    ctx.unlockRegion('duque-de-caxias');
    ctx.follow('weng', true);
    await ctx.chapterCard('Fim do Prólogo', 'Piabetá', 'Onde tudo começou.', 'Continuar');
    await ctx.chapterCard('Capítulo 1', 'Duque de Caxias', 'Nosso cantinho', 'Começar');
    ctx.startQuest('dq-e2');
    await ctx.teleport('piabeta-quintal', 'porta');
  },

  async coreto(ctx) {
    if (objActive('abrigo') && objDone('passear')) {
      await ctx.say('weng', 'Sobe, sobe! Pela escadinha!');
      return;
    }
    if (objDone('beijo')) {
      await ctx.say('bella', 'O nosso coreto.');
      return;
    }
    await ctx.say('bella', 'Um coreto todo iluminado. Que lindo.');
  },
  async chafariz(ctx) {
    if (ctx.flag('desejo-chafariz')) {
      await ctx.say('bella', 'Já fiz meu pedido. E não conto!');
      return;
    }
    const c = await ctx.choose('bella', 'Um chafariz... jogar uma moedinha e fazer um pedido?', ['Jogar a moeda', 'Agora não']);
    if (c === 1) return;
    ctx.setFlag('desejo-chafariz');
    ctx.sfx('pickup');
    await ctx.say('weng', 'O que você pediu?');
    await ctx.say('bella', 'Se eu contar, não se realiza.');
    await ctx.emote('weng', 'heart');
  },
  async lago(ctx) {
    await ctx.say('bella', 'Um laguinho com vitórias-régias e uma pontezinha. Esse parque pensou em tudo.');
  },
  async banco(ctx) {
    await ctx.sit(325, 628, [['weng', 'Um banco na luz do poste. Clássico.'], ['bella', 'Clássico e perfeito.']], { key: 'bench-pq-front-lamp', x: 325, y: 668, w: 140 });
  },
  async banco2(ctx) {
    await ctx.sit(1052, 424, [['bella', 'Olha o laguinho daqui. Dá pra ouvir os sapos.'], ['weng', 'Eles tão cantando pra gente.']], { key: 'bench-pq-ang-l', x: 1052, y: 466, w: 135 });
  },
  async banco3(ctx) {
    await ctx.sit(1367, 655, [['weng', 'Se eu pudesse, parava o tempo agora.'], ['bella', '...Eu também.']], { key: 'bench-pq-front-bin', x: 1343, y: 686, w: 185 });
  },
  async banco4(ctx) {
    await ctx.sit(275, 262, [['bella', 'O barulhinho do chafariz é tão calmo.'], ['weng', 'Você também me deixa calmo. Mesmo nervoso.']], { key: 'bench-pq-ang-r', x: 285, y: 294, w: 128 });
  },
  async weng(ctx) {
    if (objActive('passear')) await ctx.say('weng', 'Vamos seguindo o caminho, pro meio do parque.');
    else if (objActive('abrigo')) await ctx.say('weng', 'Corre! O coreto, lá em cima!');
    else await ctx.say('weng', 'Melhor primeiro encontro de todos.');
  },
};

/** Prólogo — parque arborizado ao lado da Rota 66 (cenário pintado). */
export const parqueMap: MapDef = {
  id: 'piabeta-parque',
  region: 'piabeta',
  name: 'Parque',
  music: 'parque',
  background: '#3f6a2e',
  ambient: 'petals',
  art: 'native',
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    // fundo de árvores + bordas
    R(0, 0, 1536, 150),
    R(0, 150, 70, 830),
    R(1490, 150, 1536, 690), // borda direita (passagem para a rua do mexicano em y 690–830)
    R(0, 1005, 1536, 1100),
    // pilares do portão (com lampião) e as folhas do portão abertas: ninguém sobe neles
    R(576, 788, 640, 952),
    R(860, 788, 930, 952),
    R(640, 770, 678, 945),
    R(826, 770, 860, 945),
    // grade da frente (portão em x 650–830)
    R(0, 830, 650, 925),
    R(830, 830, 1536, 925),
    // coreto: telhado/fundo e laterais (entra pela escadinha)
    R(505, 150, 840, 300), // coreto: telhado e interior (só a cena do beijo entra)
    R(505, 180, 555, 400),
    R(790, 180, 840, 400),
    R(495, 330, 588, 410),
    R(758, 330, 852, 410),
    R(432, 272, 503, 330),
    R(845, 292, 908, 340),
    // canto superior esquerdo: ipê, banco, lixeira, poste
    R(110, 150, 190, 290),
    R(200, 235, 350, 290),
    R(355, 225, 392, 265),
    // chafariz
    R(80, 428, 326, 540),
    // lago e pedras
    R(1040, 140, 1395, 395),
    R(1285, 330, 1365, 410),
    // postes
    R(395, 600, 440, 640),
    R(930, 410, 968, 448),
    R(1460, 640, 1500, 682),
    R(1040, 820, 1080, 862),
    // bancos e lixeira
    R(255, 625, 395, 665),
    R(985, 420, 1120, 460),
    R(1300, 640, 1435, 680),
    R(1250, 630, 1292, 682),
    // canteiros
    R(1258, 505, 1402, 552),
    R(768, 505, 892, 542),
    R(318, 738, 466, 792),
    R(1128, 718, 1260, 760),
    R(1158, 792, 1308, 830),
    R(92, 788, 260, 828),
    // árvores: copa inteira sólida (ninguém anda dentro da árvore)
    // só o tronco é sólido: dá pra passar por baixo da copa (a copa fica na frente, translúcida)
    R(528, 690, 594, 732),
    R(600, 718, 650, 752), // moita de flores ao lado do tronco (o caminho do arco fica livre)
    R(946, 722, 1014, 768),
    R(0, 718, 64, 818),
    R(0, 772, 182, 830), // moita embaixo da árvore do canto
    // atrás dos postes
    R(395, 585, 440, 640),
    R(1040, 790, 1082, 862),
    R(1458, 625, 1500, 682),
  ],

  overlays: [
    // pilares e lampiões do portão: na frente de quem está logo atrás deles
    { x0: 576, y0: 740, x1: 640, y1: 952, base: 950 },
    { x0: 860, y0: 740, x1: 930, y1: 952, base: 950 },
    // copas das árvores: na frente de quem está atrás do tronco, translúcidas
    { x0: 430, y0: 490, x1: 725, y1: 700, base: 730, cut: 'foliage', fade: true },
    { x0: 835, y0: 480, x1: 1135, y1: 735, base: 766, cut: 'foliage', fade: true },
    { x0: 0, y0: 500, x1: 195, y1: 832, base: 830, cut: 'foliage', fade: true },
    // canteiros e moitas: a parte de cima fica na frente de quem passa atrás
    { x0: 1248, y0: 440, x1: 1412, y1: 556, base: 554, cut: 'foliage' },
    { x0: 758, y0: 455, x1: 902, y1: 546, base: 544, cut: 'foliage' },
    { x0: 310, y0: 675, x1: 474, y1: 796, base: 794, cut: 'foliage' },
    { x0: 1120, y0: 668, x1: 1266, y1: 764, base: 762, cut: 'foliage' },
    { x0: 1150, y0: 748, x1: 1314, y1: 834, base: 832, cut: 'foliage' },
    { x0: 85, y0: 742, x1: 266, y1: 832, base: 830, cut: 'foliage' },
    { x0: 422, y0: 205, x1: 508, y1: 332, base: 330, cut: 'foliage' },
    { x0: 838, y0: 225, x1: 912, y1: 342, base: 340, cut: 'foliage' },
    // topo do arco de flores (só sobre a passagem)
    { x0: 655, y0: 640, x1: 840, y1: 705, base: 930, cut: 'foliage', fade: true },
  ],

  // Noite (o passeio é depois do lanche): véu escuro + postes e lanternas acesos
  lighting: {
    darkness: 0.6,
    lights: [
      { x: 416, y: 508, r: 230 },
      { x: 959, y: 334, r: 230 },
      { x: 1063, y: 740, r: 230 },
      { x: 1473, y: 556, r: 230 },
      { x: 605, y: 797, r: 180 },
      { x: 897, y: 797, r: 180 },
      { x: 616, y: 240, r: 150 },
      { x: 730, y: 241, r: 150 },
    ],
  },

  hotspots: [
    { rect: R(505, 30, 840, 432), interact: 'coreto', label: 'Coreto', markerIf: () => objActive('abrigo') && objDone('passear') },
    { rect: R(80, 380, 380, 560), interact: 'chafariz', label: 'Chafariz' },
    { rect: R(1040, 130, 1400, 400), interact: 'lago', label: 'Lago' },
    { rect: R(255, 575, 395, 665), interact: 'banco', label: 'Sentar' },
    { rect: R(985, 370, 1120, 460), interact: 'banco2', label: 'Sentar' },
    { rect: R(1300, 600, 1435, 690), interact: 'banco3', label: 'Sentar' },
    { rect: R(200, 205, 350, 295), interact: 'banco4', label: 'Sentar' },
  ],

  spawns: {
    'from-rota66': { tx: 14.9, ty: 19.1, facing: 'up' },
    'from-mexicano': { tx: 30.4, ty: 15.0, facing: 'left' },
  },
  exits: [
    { rect: R(650, 985, 830, 1005), toMap: 'piabeta-fragoso', toSpawn: 'from-parque' },
    {
      rect: R(1515, 690, 1536, 830),
      toMap: 'piabeta-mexicano-fora',
      toSpawn: 'from-parque',
      blockedIf: () => (QuestSystem.isDone('pia-m3') ? false : 'Hoje o caminho é outro.'),
    },
  ],
  triggers: [
    {
      id: 'chuva',
      rect: R(580, 470, 940, 610),
      script: 'chuva',
      once: true,
      enabledIf: () => objActive('passear'),
    },
    {
      id: 'beijo',
      rect: R(560, 285, 790, 395),
      script: 'beijo',
      once: true,
      enabledIf: () => objDone('passear') && objActive('abrigo'),
    },
  ],
  scripts,
  onEnter: 'entrar',
};
