import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';

const Q = 'nt-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/nt-niemeyer.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

/** Os três cantinhos do passeio (teatro, cúpula e escultura). */
const CANTOS = ['nt-teatro', 'nt-cupula', 'nt-escultura'];
const precisa = (f: string) => QuestSystem.isActive(Q) && objActive('niemeyer') && !GameState.is(f);
async function canto(ctx: ScriptContext, flag: string): Promise<void> {
  if (!precisa(flag)) return;
  ctx.setFlag(flag);
  const falta = CANTOS.filter((f) => !GameState.is(f)).length;
  if (falta) {
    ctx.toast(falta === 1 ? 'Falta 1 cantinho do Caminho Niemeyer' : `Faltam ${falta} cantinhos do Caminho Niemeyer`);
    return;
  }
  await ctx.wait(300);
  await ctx.say('bella', 'Weng, o sol tá baixando e a baía tá ficando dourada. Foto. Agora. Na beira da água.');
  await ctx.say('weng', 'Sim, senhora fotógrafa.');
  ctx.objective(Q, 'niemeyer');
  ctx.toast('Tire uma foto na beira da baía (lá embaixo)');
}

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('nt-nie-chegou')) return;
    ctx.setFlag('nt-nie-chegou');
    await ctx.narrate('O Caminho Niemeyer. Concreto branco, curvas no lugar de esquinas, e a baía de Guanabara logo ali.');
    await ctx.say('bella', 'Parece que os prédios tão dançando.');
    await ctx.say('weng', 'O Niemeyer odiava linha reta. Ele dizia que a curva é a forma das montanhas, do mar... e do corpo da mulher amada.');
    await ctx.say('bella', '...Você decorou isso pra me impressionar?');
    await ctx.say('weng', 'Decorei. Funcionou?');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'Funcionou.');
    await ctx.say('tio-nt', 'Vão passeando, a gente espera aqui na sombra. Depois é churrasco!');
    ctx.toast('Conheça o teatro da rampa vermelha, a cúpula e a escultura');
  },
  async teatro(ctx) {
    await ctx.say('bella', 'O Teatro Popular! Essa rampa vermelha parece uma fita saindo do prédio.');
    await ctx.say('weng', 'Lá dentro tem um painel enorme que o próprio Niemeyer desenhou.');
    await ctx.say('bella', 'Um dia a gente vem ver uma peça aqui. Combinado?');
    await canto(ctx, 'nt-teatro');
  },
  async cupula(ctx) {
    await ctx.say('bella', 'Essa parece um disco voador que pousou e resolveu ficar.');
    await ctx.say('weng', 'Os de Niterói já se acostumaram. O MAC, o museu famoso, fica ali perto também. Esse aqui é o primo dele.');
    await canto(ctx, 'nt-cupula');
  },
  async escultura(ctx) {
    await ctx.say('bella', 'Uma escultura que é uma onda. Ou uma pessoa deitada. Ou um laço.');
    await ctx.say('weng', 'É o que você quiser que seja. Arte moderna.');
    await ctx.say('bella', 'Então é um laço. De presente. Pra mim.');
    await canto(ctx, 'nt-escultura');
  },
  async coco(ctx) {
    if (ctx.flag('nt-coco')) {
      await ctx.say('bella', 'Água de coco gelada no fim de tarde. Melhor coisa.');
      return;
    }
    ctx.setFlag('nt-coco');
    await ctx.say('weng', 'Dois cocos, moço. Bem gelados.');
    ctx.sfx('pickup');
    await ctx.say('bella', 'Canudinho de papel! Que chique.');
    await ctx.say('mingau', '(chegando correndo) E o meu?');
    await ctx.say('weng', '...Três cocos, moço.');
    ctx.hearts('player', 3);
  },
  async pombos(ctx) {
    await ctx.say('bella', 'Os pombos do Niemeyer. Até eles andam em curva.');
  },
  async banco(ctx) {
    await ctx.sit(620, 600, [['bella', 'Até o banco é curvinho. Encosta aqui.'], ['weng', 'Cabe nós dois certinho. Ele pensou em tudo.']]);
  },
  async baia(ctx) {
    if (objActive('niemeyer')) {
      await ctx.say('bella', 'A baía tá linda... mas antes eu quero ver o teatro, a cúpula e a escultura.');
      return;
    }
    if (objDone('foto')) {
      await ctx.say('bella', 'O Rio do outro lado e a gente aqui. Gosto mais daqui.');
      return;
    }
    await ctx.say('bella', 'Aqui! Com a água e o Pão de Açúcar atrás. Encosta a bochecha.');
    await ctx.say('weng', 'Bochecha encostada. Três, dois...');
    await ctx.photo('Caminho Niemeyer, com o Rio do outro lado da baía');
    await ctx.say('bella', 'Ficou perfeita. A luz do fim de tarde ajudou.');
    await ctx.say('weng', 'A luz ajudou um pouco. Você ajudou o resto.');
    ctx.hearts('player', 8);
    ctx.objective(Q, 'foto');
    await ctx.say('tio-nt', '(de longe) Casal! Bora? O On Fire tá esperando, eu reservei pra todo mundo!');
    await ctx.say('diego', 'Doze horas de defumação, Bella. DOZE.');
    ctx.toast('Em breve: o churrasco no On Fire (Capítulo 6 continua)');
  },
  async tioTalk(ctx) {
    await ctx.say('tio-nt', objDone('foto') ? 'Bora comer! Reservei a mesa grande.' : 'Vão lá, aproveitem. A gente fica aqui na sombra.');
  },
  async maeTalk(ctx) {
    await ctx.say('mae-lilian', 'Trouxe um chocolatinho na bolsa, caso alguém fique com fome no caminho. Quer?');
    await ctx.say('bella', 'Tia, eu ainda tô com 20 na bolsa!');
    await ctx.say('mae-lilian', 'Então agora são 21.');
  },
  async lilianTalk(ctx) {
    await ctx.say('lilian', 'O Vinicius nunca tinha vindo aqui. Tô mostrando tudo pra ele.');
    await ctx.say('vinicius', 'Eu achei que era um disco voador. Sério.');
  },
  async mingauTalk(ctx) {
    await ctx.say('mingau', 'Eu desci a rampa vermelha correndo. Duas vezes. Não conta pra tia.');
  },
};

/** Capítulo 6 — Niterói: o Caminho Niemeyer, de frente pra baía. */
export const ntNiemeyerMap: MapDef = {
  id: 'nt-niemeyer',
  region: 'niteroi',
  name: 'Caminho Niemeyer',
  music: 'parque',
  background: '#2a6ab8',
  art: 'native',
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 1536, 150), // morro, céu e o Rio do outro lado
    R(0, 150, 830, 292), // Teatro Popular
    R(30, 180, 410, 428), // rampa vermelha
    R(0, 240, 120, 395), // árvores (esq., em cima)
    R(0, 440, 218, 690), // gramado e árvores (esq.)
    R(1030, 150, 1430, 306), // cúpula
    R(1380, 150, 1536, 330), // começo da passarela
    R(1250, 330, 1536, 560), // passarela curva
    R(1360, 560, 1536, 720), // fim da passarela
    R(1160, 360, 1300, 450), // canteiro de grama (dir.)
    // orla: palmeiras, mureta e a água
    R(0, 760, 760, 1024),
    R(760, 735, 1160, 1024),
    R(1160, 712, 1536, 1024),
    // objetos: só a base
    R(520, 580, 720, 612), // banco
    R(905, 588, 1100, 620), // banco (dir.)
    R(458, 628, 482, 646), // poste
    R(1108, 632, 1132, 650), // poste
    R(800, 478, 980, 520), // carrinho de coco
    R(690, 400, 830, 432), // escultura
  ],

  objects: [
    { key: 'nn-banco', x: 620, y: 612, w: 230, shadow: 0.7 },
    { key: 'nn-banco', x: 1000, y: 620, w: 220, shadow: 0.7, flip: true },
    { key: 'nn-poste', x: 470, y: 648, w: 48, shadow: 0.4 },
    { key: 'nn-poste', x: 1120, y: 652, w: 48, shadow: 0.4 },
    { key: 'nn-carrinho', x: 890, y: 522, w: 170, shadow: 0.7 },
    { key: 'nn-escultura', x: 760, y: 434, w: 170, shadow: 0.7 },
    { key: 'nn-pombos', x: 600, y: 500, w: 90, shadow: false },
  ],

  overlays: [
    // as copas das palmeiras da orla passam na frente de quem anda atrás delas
    { x0: 0, y0: 540, x1: 1536, y1: 790, base: 800, cut: 'foliage', fade: true },
  ],

  npcs: [
    { id: 'tio-nt', sprite: 'tio-nt', tx: 270 / 48, ty: 470 / 48, facing: 'right', interact: 'tioTalk' },
    { id: 'mae-lilian', sprite: 'mae-lilian', tx: 330 / 48, ty: 470 / 48, facing: 'left', interact: 'maeTalk' },
    { id: 'lilian', sprite: 'lilian', tx: 1050 / 48, ty: 360 / 48, facing: 'up', interact: 'lilianTalk' },
    { id: 'vinicius', sprite: 'vinicius', tx: 1110 / 48, ty: 360 / 48, facing: 'up', interact: 'lilianTalk' },
    { id: 'mingau', sprite: 'mingau', tx: 420 / 48, ty: 450 / 48, facing: 'down', interact: 'mingauTalk' },
  ],

  hotspots: [
    { rect: R(150, 400, 430, 470), interact: 'teatro', label: 'Teatro Popular', markerIf: () => precisa('nt-teatro') },
    { rect: R(1040, 300, 1420, 360), interact: 'cupula', label: 'Cúpula', markerIf: () => precisa('nt-cupula') },
    { rect: R(680, 380, 840, 450), interact: 'escultura', label: 'Escultura', markerIf: () => precisa('nt-escultura') },
    { rect: R(790, 470, 990, 535), interact: 'coco', label: 'Água de coco' },
    { rect: R(560, 470, 650, 520), interact: 'pombos', label: 'Pombos' },
    { rect: R(520, 560, 720, 625), interact: 'banco', label: 'Banco' },
    { rect: R(500, 700, 1000, 745), interact: 'baia', label: 'Baía', marker: { x: 0.5, y: 0 }, markerIf: () => objDone('niemeyer') && objActive('foto') },
  ],

  spawns: {
    chegada: { tx: 330 / 48, ty: 680 / 48, facing: 'up' },
  },
  scripts,
  onEnter: 'chegada',
};
