import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL, dateOrPlaceholder } from '@/data/personal';

const Q = 'pia-m3';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-parque-base.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async entrar(ctx) {
    if (ctx.objectiveDone(Q, 'passear') && !ctx.objectiveDone(Q, 'beijo')) ctx.weather('rain');
    if (ctx.objectiveDone(Q, 'beijo')) ctx.weather('sunset');
    if (ctx.questActive('dq-e2')) ctx.weather('sunset');
    if (ctx.questActive('dq-e2') && !ctx.objectiveDone('dq-e2', 'passeio')) {
      ctx.objective('dq-e2', 'passeio');
      await ctx.wait(300);
      await ctx.say('bella', 'A nossa praça. Olha o coreto ali...');
      await ctx.say('weng', 'Foi ali. Debaixo da chuva.');
      await ctx.emote('bella', 'heart');
      await ctx.say('bella', 'Eu lembro de cada segundo.');
      await ctx.say('weng', 'Tem um restaurante mexicano aqui do lado, seguindo a calçada pra esquerda. Bora conhecer?');
      ctx.toast('Siga pela calçada para a esquerda');
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
    ctx.place('player', 13.0, 5.85, 'right');
    ctx.place('weng', 14.0, 5.85, 'left');
    ctx.scale('player', 0.86);
    ctx.scale('weng', 0.86);
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

    await Promise.all([ctx.move('player', 13.3, 5.85, 12), ctx.move('weng', 13.72, 5.85, 12)]);
    ctx.face('player', 'right');
    ctx.face('weng', 'left');
    await ctx.focus(13.5, 4.7, 2.1, 2200);
    await ctx.kiss();
    await ctx.fadeOut(1600, '#fff3f6');
    ctx.objective(Q, 'beijo');
    await ctx.illustration('memory-pia-03', ['O primeiro beijo.', `Piabetá, ${dateOrPlaceholder(PERSONAL.dates.firstKiss)}. Debaixo de chuva.`]);

    ctx.weather('clear');
    ctx.scale('player', 1);
    ctx.scale('weng', 1);
    // depois do beijo: descem a escadinha e ficam na frente do coreto
    ctx.place('player', 12.9, 8.4, 'down');
    ctx.place('weng', 14.5, 8.4, 'down');
    await ctx.unfocus(10);
    ctx.letterbox(false);
    await ctx.fadeIn(1500);
    await ctx.say('weng', '...A chuva passou.');
    await ctx.say('bella', 'Passou nada. Eu nem percebi.');
    await ctx.emote('weng', 'heart');
    await ctx.memory('mem-pia-03');
    ctx.unlockRegion('duque-de-caxias');
    ctx.follow('weng', true);
    // troca de capítulo: tela preta por trás (o mapa não aparece entre os cartões)
    await ctx.fadeOut(600);
    await ctx.chapterCard('Fim do Prólogo', 'Piabetá', 'Onde tudo começou.', 'Continuar');
    await ctx.chapterCard('Capítulo 1', 'Piabetá', 'O segundo encontro', 'Começar');
    await ctx.phone({ contact: 'Weng ♥', avatar: 'portrait-weng', clock: '23:48', caption: 'Naquela mesma noite...' }, [
      { from: 'them', text: 'Chegou em casa?' },
      { from: 'me', text: 'Cheguei. Encharcada kkkkk' },
      { from: 'them', text: 'Eu também. Mas valeu cada gota.' },
      { from: 'me', text: 'Bobo 🙈' },
      { from: 'info', text: 'Alguns dias depois' },
      { from: 'me', text: 'Domingo vai ter churrasco aqui em casa.' },
      { from: 'me', text: 'Minha mãe quer te conhecer direito. O Alexandre também.' },
      { from: 'me', text: 'Ele já tá afiando a faca kkkkk' },
      { from: 'them', text: '...isso é piada, né?' },
      { from: 'me', text: '😇' },
      { from: 'them', text: 'Bella.' },
      { from: 'me', text: 'Vem uma da tarde! Traz fome.' },
      { from: 'them', text: 'Levo fome. E coragem.' },
    ]);
    ctx.startQuest('dq-e2');
    await ctx.teleport('piabeta-quintal', 'porta');
  },

  async placaMex(ctx) {
    await ctx.say('weng', 'O mexicano é logo ali, seguindo a calçada pra esquerda. Bora?');
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
    await ctx.sit(335, 602, [['weng', 'Um banco na luz do poste. Clássico.'], ['bella', 'Clássico e perfeito.']], { key: 'bench-pq-front-lamp', x: 335, y: 642, w: 150 });
  },
  async banco2(ctx) {
    await ctx.sit(1105, 438, [['bella', 'Olha o laguinho daqui. Dá pra ouvir os sapos.'], ['weng', 'Eles tão cantando pra gente.']], { key: 'bench-pq-front-lamp', x: 1105, y: 478, w: 150 });
  },
  async banco3(ctx) {
    await ctx.sit(1350, 632, [['weng', 'Se eu pudesse, parava o tempo agora.'], ['bella', '...Eu também.']], { key: 'bench-pq-front-lamp', x: 1350, y: 672, w: 150 });
  },
  async banco4(ctx) {
    await ctx.sit(330, 260, [['bella', 'O barulhinho do chafariz é tão calmo.'], ['weng', 'Você também me deixa calmo. Mesmo nervoso.']], { key: 'bench-pq-front-lamp', x: 330, y: 300, w: 150 });
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

  // v2: cenário vazio (art-source/maps/piabeta-parque-base.webp) + objetos da folha (objects/prq-*).
  // Versão anterior (cenário pintado inteiro com recortes) em backups/parque-v1/.
  blocks: [
    R(0, 0, 1536, 115), // árvores do fundo
    // coreto: plataforma inteira (só a cena do beijo entra; a escadinha fica livre)
    R(500, 115, 842, 345),
    R(500, 300, 598, 372),
    R(752, 300, 842, 372),
    R(425, 215, 520, 335), // flores dos lados do coreto
    R(830, 165, 925, 350),
    // lago, pedras, ponte e plantas da beira
    // lago com a ponte LIBERADA: água e pedras bloqueiam; o tabuleiro da ponte é caminho
    R(1000, 115, 1160, 250), // plantas e flores da margem de cima à esquerda
    R(1020, 240, 1250, 400), // lago (parte da esquerda)
    R(1160, 212, 1238, 250), // pedra grande da esquerda da ponte
    R(1250, 272, 1440, 400), // água debaixo da ponte
    R(1380, 268, 1445, 300), // pedra do pé direito da ponte
    R(1440, 115, 1536, 232), // pedras atrás da ponte (direita)
    // tabuleiro da ponte (sobe na diagonal): bloqueia atrás do corrimão e a água logo abaixo
    R(1250, 115, 1280, 192), R(1280, 115, 1310, 199), R(1310, 115, 1340, 205), R(1340, 115, 1370, 212), R(1370, 115, 1400, 218), R(1400, 115, 1430, 225), R(1430, 115, 1460, 232),
    R(1250, 242, 1280, 272), R(1280, 246, 1310, 272), R(1310, 250, 1340, 272), R(1340, 255, 1370, 272), R(1370, 259, 1400, 272), R(1400, 263, 1430, 272), R(1430, 267, 1460, 272),
    R(1140, 380, 1310, 415),
    R(1285, 380, 1390, 440),
    R(1250, 482, 1420, 570),
    // canteiros
    R(175, 172, 360, 235),
    R(35, 370, 180, 410),
    R(225, 375, 435, 465),
    R(755, 482, 920, 570),
    R(310, 738, 470, 800),
    R(90, 778, 250, 850),
    R(1125, 702, 1260, 765),
    R(1160, 778, 1340, 850),
    // grade, pilares e folhas do portão, calçada
    R(0, 835, 640, 945),
    R(860, 835, 1536, 945),
    R(640, 790, 680, 935),
    R(825, 780, 860, 935),
    R(0, 1000, 1536, 1100),
    // chafariz (bacia)
    R(62, 470, 322, 592),
    // troncos das árvores
    R(84, 302, 136, 330),
    R(424, 662, 476, 690),
    R(959, 637, 1011, 665),
    R(1464, 572, 1516, 600),
    R(9, 742, 61, 770),
    // postes, bancos, lixeiras e vasos da escadinha
    R(398, 549, 422, 565),
    R(953, 429, 977, 445),
    R(1438, 674, 1462, 690),
    R(1073, 814, 1097, 830),
    R(238, 304, 262, 320),
    R(263, 608, 407, 642),
    R(1033, 444, 1177, 478),
    R(1278, 638, 1422, 672),
    R(258, 266, 402, 300),
    R(1235, 644, 1275, 668),
    R(405, 274, 445, 298),
    R(545, 395, 605, 428),
    R(740, 395, 800, 428),
  ],

  // Objetos: x = centro, y = base (px da arte original). Profundidade fixa na base.
  objects: [
    { key: 'prq-ipe', x: 110, y: 330, w: 260, fade: true, shadow: 0.55 },
    { key: 'prq-arvore', x: 450, y: 690, w: 290, fade: true, shadow: 0.55 },
    { key: 'prq-arvore2', x: 985, y: 665, w: 240, fade: true, shadow: 0.55 },
    { key: 'prq-arvore', x: 1490, y: 600, w: 260, fade: true, shadow: 0.55 },
    { key: 'prq-arvore2', x: 35, y: 770, w: 220, fade: true, shadow: 0.55 },
    { key: 'prq-poste', x: 410, y: 565, w: 60, shadow: 0.5 },
    { key: 'prq-poste', x: 965, y: 445, w: 60, shadow: 0.5 },
    { key: 'prq-poste', x: 1450, y: 690, w: 60, shadow: 0.5 },
    { key: 'prq-poste', x: 1085, y: 830, w: 60, shadow: 0.5 },
    { key: 'prq-poste', x: 250, y: 320, w: 60, shadow: 0.5 },
    { key: 'prq-banco', x: 335, y: 642, w: 150, shadow: 0.9 },
    { key: 'prq-banco', x: 1105, y: 478, w: 150, shadow: 0.9 },
    { key: 'prq-banco', x: 1350, y: 672, w: 150, shadow: 0.9 },
    { key: 'prq-banco', x: 330, y: 300, w: 150, shadow: 0.9 },
    { key: 'prq-lixeira', x: 1255, y: 668, w: 44, shadow: 0.9 },
    { key: 'prq-lixeira', x: 425, y: 298, w: 44, shadow: 0.9 },
    { key: 'prq-vaso', x: 575, y: 428, w: 70, shadow: 0.7 },
    { key: 'prq-vaso', x: 770, y: 428, w: 70, shadow: 0.7, flip: true },
    { key: 'prq-chafariz', x: 192, y: 594, w: 270, shadow: false },
    // arco de flores logo depois do portão: translúcido quando alguém passa por baixo
    { key: 'prq-arco', x: 752, y: 810, w: 300, fade: true, shadow: false },
  ],

  // Cena do beijo: pilastras da frente e telhado do coreto por cima dos dois
  overlays: [
    // pilares do portão (com os lampiões), folhas do portão e pilares da grade: na frente de quem passa atrás
    { x0: 576, y0: 746, x1: 641, y1: 952, base: 948, cut: 'outline' },
    { x0: 858, y0: 746, x1: 926, y1: 952, base: 948, cut: 'outline' },
    { x0: 638, y0: 774, x1: 678, y1: 940, base: 936, cut: 'outline' },
    { x0: 825, y0: 774, x1: 866, y1: 940, base: 936, cut: 'outline' },
    ...[[52, 104], [302, 356], [1102, 1154], [1299, 1353], [1497, 1536]].map(([x0, x1]) => ({ x0, y0: 820, x1, y1: 950, base: 946, cut: 'outline' as const })),
    // ponte: fatiada (a frente do tabuleiro passa na frente dos pés de quem atravessa)
    { x0: 1238, y0: 140, x1: 1452, y1: 278, base: 276, cut: 'furniture', slice: true },
    { x0: 590, y0: 200, x1: 627, y1: 360, base: 3000, when: () => QuestSystem.isObjectiveDone(Q, 'abrigo') && !QuestSystem.isObjectiveDone(Q, 'beijo') },
    { x0: 710, y0: 200, x1: 748, y1: 360, base: 3000, when: () => QuestSystem.isObjectiveDone(Q, 'abrigo') && !QuestSystem.isObjectiveDone(Q, 'beijo') },
    { x0: 500, y0: 25, x1: 845, y1: 205, base: 3000, when: () => QuestSystem.isObjectiveDone(Q, 'abrigo') && !QuestSystem.isObjectiveDone(Q, 'beijo') },
  ],

  // Noite (o passeio é depois do lanche): véu escuro + postes e lanternas acesos
  lighting: {
    darkness: 0.6,
    when: () => !QuestSystem.isActive('dq-e2'),
    lights: [
      { x: 410, y: 340, r: 230 },
      { x: 965, y: 220, r: 230 },
      { x: 1450, y: 465, r: 230 },
      { x: 1085, y: 605, r: 230 },
      { x: 250, y: 95, r: 230 },
      { x: 607, y: 780, r: 170 },
      { x: 897, y: 775, r: 170 },
      { x: 555, y: 215, r: 140 },
      { x: 620, y: 230, r: 140 },
      { x: 720, y: 230, r: 140 },
      { x: 785, y: 210, r: 140 },
    ],
  },

  hotspots: [
    {
      rect: R(0, 940, 70, 1000),
      interact: 'placaMex',
      label: '← Restaurante',
      marker: { x: 0.6, y: -0.2, dir: 'left' },
      markerIf: () => QuestSystem.isActive('dq-e2') && QuestSystem.isObjectiveDone('dq-e2', 'passeio') && !QuestSystem.isObjectiveDone('dq-e2', 'mexicano'),
    },
    { rect: R(500, 30, 842, 430), interact: 'coreto', label: 'Coreto', markerIf: () => objActive('abrigo') && objDone('passear') },
    { rect: R(60, 330, 325, 595), interact: 'chafariz', label: 'Chafariz' },
    { rect: R(1020, 130, 1490, 400), interact: 'lago', label: 'Lago' },
    { rect: R(260, 562, 410, 642), interact: 'banco', label: 'Sentar' },
    { rect: R(1030, 398, 1180, 478), interact: 'banco2', label: 'Sentar' },
    { rect: R(1275, 592, 1425, 672), interact: 'banco3', label: 'Sentar' },
    { rect: R(255, 220, 405, 300), interact: 'banco4', label: 'Sentar' },
  ],

  // quem vem de Fragoso chega pela calçada da DIREITA; o restaurante mexicano fica pra ESQUERDA
  spawns: {
    'from-rota66': { tx: 30.4, ty: 19.4, facing: 'left' },
    'from-mexicano': { tx: 1.6, ty: 19.4, facing: 'right' },
  },
  exits: [
    { rect: R(1515, 945, 1536, 1000), toMap: 'piabeta-fragoso', toSpawn: 'from-parque' },
    {
      rect: R(0, 945, 22, 1000),
      toMap: 'piabeta-mexicano-fora',
      toSpawn: 'from-parque',
      blockedIf: () => (QuestSystem.isDone('pia-m3') ? false : 'Hoje o caminho é outro.'),
    },
  ],
  triggers: [
    {
      id: 'chuva',
      rect: R(600, 470, 900, 610),
      script: 'chuva',
      once: true,
      enabledIf: () => objActive('passear'),
    },
    {
      id: 'beijo',
      rect: R(600, 345, 755, 415),
      script: 'beijo',
      once: true,
      enabledIf: () => objDone('passear') && objActive('abrigo'),
    },
  ],
  scripts,
  onEnter: 'entrar',
};
