import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'dq-e2';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-mexicano-base.webp, 1536x1024). 48 px = 1 tile. */
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
    ctx.place('player', 12.3, 10.6, 'right');
    ctx.place('weng', 18.8, 10.6, 'left');
    ctx.place('garcom', 15.2, 13.6, 'up');
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
    await ctx.narrate('O Weng também teve. Tanto que, uns dias depois, mandou mensagem pra uma pessoa muito importante...');
    await ctx.phone({ contact: 'Mãe da Bella', avatar: 'portrait-mae-bella', clock: '21:13', caption: 'No celular do Weng' }, [
      { from: 'me', text: 'Oi, tia! Boa noite. É o Weng' },
      { from: 'me', text: 'Desculpa mandar mensagem a essa hora' },
      { from: 'them', text: 'Oi querido!! Imagina, pode falar' },
      { from: 'them', text: 'Aconteceu alguma coisa com a Bella??' },
      { from: 'me', text: 'Não não, tá tudo bem!' },
      { from: 'me', text: 'É que eu queria pedir uma ajuda... e segredo, tá?' },
      { from: 'them', text: 'Hmmm segredo 👀' },
      { from: 'them', text: 'Fala' },
      { from: 'me', text: 'Eu quero pedir a Bella em namoro' },
      { from: 'me', text: 'No quarto dela. Com luzinha, tsuru de papel, nossas fotos... tudo surpresa' },
      { from: 'them', text: 'AAAAAAAAAAAA' },
      { from: 'them', text: 'ALEXANDRE' },
      { from: 'them', text: 'ALEXANDRE VEM CÁ' },
      { from: 'them', text: 'Desculpa, tô gritando aqui na sala kkkkkk' },
      { from: 'me', text: 'kkkkkkk' },
      { from: 'me', text: 'Mas ela não pode estar em casa enquanto eu arrumo' },
      { from: 'them', text: 'Deixa comigo' },
      { from: 'them', text: 'Leva ela no cinema no sábado' },
      { from: 'them', text: 'Na hora certa eu dou um jeito dela voltar correndo pra casa' },
      { from: 'me', text: 'Que jeito?' },
      { from: 'them', text: 'Confia 😎' },
      { from: 'me', text: 'Tia, por favor não fala que alguém morreu' },
      { from: 'them', text: 'Kkkkkk confia em mim, querido' },
      { from: 'them', text: 'O Alexandre mandou dizer que aprova. Disse "bom rapaz" de novo' },
      { from: 'me', text: '🥹' },
    ]);
    await ctx.phone({ contact: 'Bella ♥', avatar: 'portrait-bella', clock: '21:40', caption: 'Logo depois...' }, [
      { from: 'me', text: 'ei' },
      { from: 'me', text: 'sábado tá livre?' },
      { from: 'them', text: 'pra você? sempre' },
      { from: 'them', text: 'por quêêê' },
      { from: 'me', text: 'cinema no Caxias Shopping?' },
      { from: 'them', text: 'SIMMM' },
      { from: 'them', text: 'que filme?' },
      { from: 'me', text: "Five Nights at Freddy's" },
      { from: 'me', text: 'se você tiver coragem' },
      { from: 'them', text: 'eu nasci com coragem' },
      { from: 'them', text: '(vou apertar seu braço o filme inteiro, tá avisado)' },
      { from: 'me', text: 'aceito o risco' },
      { from: 'them', text: 'e depois a gente come alguma coisa?' },
      { from: 'me', text: 'depois... a gente vê 😌' },
      { from: 'them', text: 'que carinha é essa' },
      { from: 'me', text: 'carinha normal' },
      { from: 'them', text: 'hmmmm' },
      { from: 'them', text: 'tá bom, combinado ❤' },
    ]);
    await ctx.chapterCard('Terceiro encontro', 'Caxias Shopping', 'Cinema, uma ligação inesperada e uma surpresa.', 'Continuar');
    ctx.startQuest('dq-e3');
    await ctx.teleport('duque-cinema', 'shopping');
  },

  async garcom(ctx) {
    if (objActive('mexicano')) {
      await ctx.say('garcom', '¡Hola, hola! Mesa pra dois? A do meio tá livre, com vista pro cacto.');
      await ctx.say('bella', 'Ele falou "hola"! Weng, ele falou "hola"!');
      await ctx.say('weng', 'Eu ouvi. Já tô me sentindo em Cancún.');
      return;
    }
    await ctx.say('garcom', '¿Más bebida de la casa? A primeira foi cortesia... a segunda é por amor. E por conta de vocês.');
  },

  async bar(ctx) {
    await ctx.say('bella', 'Três jarras de suco: limão, manga e morango. A bebida da casa é segredo.');
  },
  async chapeus(ctx) {
    await ctx.say('weng', 'Um cabideiro só de chapéu mexicano. Esse lugar me entende.');
  },
  async saida(ctx) {
    await ctx.teleport('piabeta-mexicano-fora', 'from-dentro');
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

  // v2: cenário vazio (art-source/maps/piabeta-mexicano-base.webp) + objetos da folha (objects/mx-*).
  // Versão anterior em backups/mexicano-v1/.
  blocks: [
    R(0, 0, 1536, 322), // parede do fundo
    R(0, 0, 112, 472), // parede da esquerda (com o quadro)
    R(0, 470, 110, 490), R(0, 490, 100, 510), R(0, 510, 90, 530), R(0, 530, 80, 550), R(0, 550, 70, 570), R(0, 570, 60, 590), R(0, 590, 50, 610), R(0, 610, 40, 630), R(0, 630, 30, 650), R(0, 650, 20, 670),
    R(0, 660, 22, 820),
    R(1440, 330, 1536, 350), R(1445, 350, 1536, 370), R(1450, 370, 1536, 390), R(1454, 390, 1536, 410), R(1459, 410, 1536, 430), R(1464, 430, 1536, 450), R(1469, 450, 1536, 470), R(1474, 470, 1536, 490), R(1478, 490, 1536, 510), R(1483, 510, 1536, 530), R(1488, 530, 1536, 550), R(1493, 550, 1536, 570), R(1498, 570, 1536, 590), R(1502, 590, 1536, 610), R(1507, 610, 1536, 630), R(1512, 630, 1536, 650), R(1517, 650, 1536, 670),
    R(1515, 660, 1536, 820),
    R(105, 300, 592, 474), // balcão
    // parede de baixo (porta em x 700–775)
    R(0, 815, 700, 1024),
    R(775, 815, 1536, 1024),
    R(700, 960, 775, 1024),
    R(653, 493, 883, 640),
    R(1074, 385, 1286, 520),
    R(224, 660, 436, 795),
    R(1094, 660, 1306, 795),
    R(183, 505, 227, 528),
    R(278, 505, 322, 528),
    R(373, 505, 417, 528),
    R(468, 505, 512, 528),
    R(927, 364, 993, 392),
    R(1417, 672, 1487, 700),
    R(45, 612, 99, 640),
    R(1445, 450, 1495, 478),
    R(549, 784, 621, 812),
    R(899, 784, 971, 812),
    R(1019, 370, 1101, 398),
  ],

  objects: [
    { key: 'mx-mesa', x: 768, y: 640, w: 250, shadow: 0.8 },
    { key: 'mx-mesa', x: 1180, y: 520, w: 230, shadow: 0.8 },
    { key: 'mx-mesa', x: 330, y: 795, w: 230, shadow: 0.8 },
    { key: 'mx-mesa', x: 1200, y: 795, w: 230, shadow: 0.8 },
    { key: 'mx-banqueta', x: 205, y: 528, w: 52, shadow: 0.8 },
    { key: 'mx-banqueta', x: 300, y: 528, w: 52, shadow: 0.8 },
    { key: 'mx-banqueta', x: 395, y: 528, w: 52, shadow: 0.8 },
    { key: 'mx-banqueta', x: 490, y: 528, w: 52, shadow: 0.8 },
    { key: 'mx-cacto', x: 960, y: 392, w: 88, shadow: 0.7 },
    { key: 'mx-cacto', x: 1452, y: 700, w: 92, shadow: 0.7, flip: true },
    { key: 'mx-cactoflor', x: 72, y: 640, w: 72, shadow: 0.7 },
    { key: 'mx-cactoflor', x: 1470, y: 478, w: 66, shadow: 0.7, flip: true },
    { key: 'mx-planta', x: 585, y: 812, w: 96, shadow: 0.7 },
    { key: 'mx-planta', x: 935, y: 812, w: 96, shadow: 0.7, flip: true },
    { key: 'mx-cabideiro', x: 1060, y: 398, w: 108, shadow: 0.7 },
  ],

  // porta de entrada (folhas abertas): sempre por cima de quem passa, transparente
  overlays: [{ x0: 620, y0: 728, x1: 856, y1: 950, base: 1000, front: true }],

  npcs: [
    // garçom: anda pertinho do balcão, entre os banquinhos e a mesa do meio
    { id: 'garcom', sprite: 'garcom-mex', tx: 12.0, ty: 10.8, facing: 'down', interact: 'garcom', behavior: 'wander', wanderRadius: 1.2, wanderAxis: 'y' },
  ],

  hotspots: [
    { rect: R(643, 373, 893, 640), interact: 'mesa', label: 'Sentar', markerIf: () => objActive('mexicano') && objDone('passeio') },
    { rect: R(105, 280, 592, 480), interact: 'bar', label: 'Balcão' },
    { rect: R(1000, 190, 1115, 400), interact: 'chapeus', label: 'Chapéus' },
  ],

  spawns: {
    porta: { tx: 14.9, ty: 15.4, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(695, 925, 780, 960), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
