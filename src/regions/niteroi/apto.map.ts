import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';
import { PERSONAL } from '@/data/personal';

const Q = 'nt-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/nt-apto.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

/** Onde cada um fica na roda da sala (tiles) e pra onde olha; depois todos voltam pro seu canto. */
const RODA: [string, number, number, 'up' | 'down' | 'left' | 'right'][] = [
  ['lilian', 6.9, 10.25, 'down'],
  ['vinicius', 8.1, 10.25, 'down'],
  ['tio-nt', 9.8, 10.25, 'down'],
  ['vivian', 11.45, 10.25, 'down'],
  ['diego', 12.7, 11.3, 'left'],
  ['mingau', 6.2, 11.7, 'right'],
  ['mae-lilian', 12.2, 12.5, 'left'],
];
const CANTO: Record<string, [number, number, 'up' | 'down' | 'left' | 'right']> = {
  lilian: [760 / 48, 398 / 48, 'right'],
  vinicius: [828 / 48, 398 / 48, 'left'],
  'tio-nt': [1372 / 48, 470 / 48, 'left'],
  vivian: [610 / 48, 525 / 48, 'left'],
  diego: [975 / 48, 382 / 48, 'down'],
  mingau: [805 / 48, 560 / 48, 'left'],
  'mae-lilian': [1180 / 48, 382 / 48, 'down'],
};
const precisaSabatina = () => QuestSystem.isActive(Q) && objDone('chegar') && !objDone('oi');

/**
 * A sabatina: em vez de sair dando oi um por um (como em Araruama), a família inteira senta em volta
 * da Bella e quer saber TUDO sobre o casal. Perguntas sobre a história deles; errar só rende risada.
 */
async function sabatina(ctx: ScriptContext): Promise<void> {
  ctx.follow('weng', false);
  await ctx.fadeOut(400);
  ctx.place('player', 8.96, 12.5, 'up');
  ctx.place('weng', 10.4, 12.5, 'up');
  for (const [who, x, y, f] of RODA) ctx.place(who, x, y, f);
  ctx.letterbox(true);
  await ctx.frame(9.4, 11.6, 0);
  await ctx.fadeIn(400);
  await ctx.narrate('Cinco minutos depois, a sala inteira em volta da Bella. Ninguém nem fingiu que tava fazendo outra coisa.');
  await ctx.say('lilian', 'Bella, aqui em casa tem uma tradição. Quem chega novo passa pela sabatina.');
  await ctx.say('vinicius', 'Eu passei semana passada. Sobrevivi. Mais ou menos.');
  await ctx.say('weng', '(cochichando) Responde com confiança. Eles sentem o medo.');
  let pontos = 0;

  await ctx.say('tio-nt', 'Primeira pergunta. Onde foi que esse rapaz te deu o primeiro beijo?');
  let c = await ctx.choose('bella', '(A família inteira inclinada pra frente)', ['"No coreto da praça, debaixo de chuva."', '"Na fila do cinema."', '"Ele ainda tá me devendo esse beijo."']);
  if (c === 0) {
    pontos++;
    await ctx.say('tio-nt', 'Debaixo de chuva! Romântico. Puxou o tio.');
  } else if (c === 1) await ctx.say('weng', 'Fila do cinema?! Bella, foi no CORETO. Com chuva. Eu me preparei a semana inteira!');
  else {
    await ctx.emote('weng', 'sweat');
    await ctx.say('diego', 'HAHAHA! Weng, você tá devendo beijo?');
  }

  await ctx.say('vivian', 'Minha vez. Onde foi o primeiro encontro de vocês?');
  c = await ctx.choose('bella', '(A Vivian com cara de quem já sabe a resposta)', [`"Na ${PERSONAL.places.hamburgueria}. Hambúrguer."`, '"Num restaurante francês chiquérrimo."', '"Na casa da minha avó."']);
  if (c === 0) {
    pontos++;
    await ctx.say('vivian', 'Hambúrguer no primeiro encontro. Gostei. Sem frescura.');
  } else if (c === 1) await ctx.say('vivian', 'Francês? O Weng? Ele não sabe nem pronunciar croissant.');
  else await ctx.say('weng', 'Na casa da avó foi depois! O primeiro foi hambúrguer, eu lembro de tudo.');

  await ctx.say('diego', 'Pergunta séria agora. O Weng cozinha?');
  c = await ctx.choose('bella', '(O Diego de braços cruzados)', ['"Fez miojo na primeira noite. Muito bem feito, aliás."', '"Ele assumiu a churrasqueira lá de casa."', '"Eu não deixo ele chegar perto do fogão."']);
  if (c < 2) {
    pontos++;
    await ctx.say('diego', c === 0 ? 'Miojo bem feito é uma arte. Respeito.' : 'Assumiu a churrasqueira do sogro? Corajoso. Ou doido.');
  } else await ctx.say('mae-lilian', 'Faz muito bem, minha filha. Da última vez ele queimou até o arroz.');

  await ctx.say('mingau', 'E qual é o nome da gata dele? Essa é fácil.');
  c = await ctx.choose('bella', '(O Mingau segurando a risada)', ['"Meli."', '"Mingau."', '"Lala."']);
  if (c === 0) {
    pontos++;
    await ctx.say('mingau', 'Acertou. A Meli me odeia, mas tudo bem.');
  } else if (c === 1) {
    await ctx.emote('mingau', 'exclaim');
    await ctx.say('mingau', 'MINGAU SOU EU!');
  } else await ctx.say('weng', 'A Lala é a SUA gata, amor. A minha é a Meli.');

  await ctx.say('lilian', 'Última, e não vale errar porque não tem resposta errada. Do que você mais gosta nele?');
  c = await ctx.choose('bella', '(O Weng olhando pro teto, fingindo que não tá ouvindo)', ['"Do jeito que ele cuida de mim."', '"Que ele me faz rir o dia inteiro."', '"Do abraço. É o melhor lugar do mundo."']);
  await ctx.emote('weng', 'heart');
  await ctx.say('vivian', ['Aaaah. Para.', 'Isso ele faz mesmo. Até sem querer.', 'Gente, eu vou chorar antes do almoço.'][c]);
  await ctx.say('weng', '...Ninguém tinha me avisado que essa pergunta existia.');

  const nota = pontos >= 4 ? 'Quatro de quatro! Aprovada com louvor.' : pontos >= 2 ? `${pontos} de 4. Aprovada! O resto o Weng explica depois.` : 'Aprovada mesmo assim. Quem faz o Weng ficar vermelho desse jeito já tá dentro.';
  await ctx.say('mae-lilian', nota);
  ctx.hearts('player', 6 + pontos * 2);
  ctx.setFlag('nt-sabatina-pontos', pontos);
  await ctx.say('mae-lilian', 'Agora vem comigo na cozinha. Aquela coisinha que eu falei tá te esperando.');
  ctx.objective(Q, 'oi');
  await ctx.fadeOut(400);
  ctx.letterbox(false);
  await ctx.unfocus(10);
  for (const [who, [x, y, f]] of Object.entries(CANTO)) ctx.place(who, x, y, f);
  ctx.follow('weng', true);
  await ctx.fadeIn(400);
  ctx.toast('A mãe da Lilian te espera na cozinha');
}

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('nt-chegou')) return;
    ctx.setFlag('nt-chegou');
    if (!ctx.questActive(Q) && !QuestSystem.isDone(Q)) ctx.startQuest(Q);
    await ctx.narrate('Niterói. Icaraí, do outro lado da baía.');
    await ctx.narrate('O apartamento dos tios do Weng: chão de mármore, vidro do teto ao chão e o mar inteiro na janela.');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Weng... isso aqui é um apartamento ou um hotel?');
    await ctx.say('weng', 'Eu falei que era bonito.');
    await ctx.say('bella', 'Você falou "é legal". LEGAL. Isso aqui tem vista pro Pão de Açúcar!');
    // a mãe da Lilian larga a cozinha e vem receber os dois na sala
    const vindo = ctx.move('mae-lilian', 24.6, 9.6, 90).then(() => ctx.move('mae-lilian', 13.0, 9.6, 90)).then(() => ctx.move('mae-lilian', 13.0, 11.9, 90));
    await ctx.say('mae-lilian', 'Chegaram! Entra, entra! Bella, que bom que você veio!');
    await ctx.move('player', 5.2, 11.9, 70);
    await ctx.move('player', 11.6, 11.9, 70);
    await vindo;
    ctx.face('player', 'right');
    ctx.face('mae-lilian', 'left');
    await ctx.emote('mae-lilian', 'heart');
    await ctx.say('bella', 'Oi! Obrigada por receber a gente!');
    await ctx.say('mae-lilian', 'Imagina, minha filha. Que abraço gostoso! Dá oi pra todo mundo e depois vem aqui na cozinha. Eu tenho uma coisinha pra você.');
    await ctx.say('weng', '(cochichando) "Uma coisinha". Prepara a bolsa.');
    ctx.objective(Q, 'chegar');
    await ctx.say('lilian', '(lá do sofá) Bella! Senta aqui! Todo mundo quer te conhecer direito!');
    await ctx.say('weng', '(baixinho) Ih. Lá vem a sabatina.');
    await sabatina(ctx);
  },

  async maeLilian(ctx) {
    if (precisaSabatina()) return sabatina(ctx);
    if (objActive('chocolates')) return chocolates(ctx);
    const f = ['Já comeu chocolate hoje? Tem mais na cesta, viu?', 'Fica à vontade, a casa é sua. Quer água? Suco? Chocolate?', 'O Weng falava tanto de você. Agora eu entendi por quê.'];
    const n = Number(GameState.getFlag<number>('nt-mae-n') ?? 0);
    ctx.setFlag('nt-mae-n', (n + 1) % f.length);
    await ctx.say('mae-lilian', f[n % f.length]);
  },
  async tio(ctx) {
    if (precisaSabatina()) return sabatina(ctx);
    if (objDone('varanda') && objActive('niemeyer')) {
      await ctx.say('tio-nt', 'Bora no Caminho Niemeyer antes do almoço? Dá pra ir andando. É só sair pela porta.');
      return;
    }
    await ctx.say('tio-nt', objDone('chocolates') ? 'Ela te deu chocolate, né? Ela dá chocolate pra todo mundo. Pro porteiro. Pro carteiro.' : 'Senta, fica à vontade. A vista daqui é a melhor parte da casa.');
  },
  async lilian(ctx) {
    if (precisaSabatina()) return sabatina(ctx);
    await ctx.say('lilian', 'Depois vamos tirar uma foto todo mundo junto na varanda, tá?');
  },
  async vinicius(ctx) {
    if (precisaSabatina()) return sabatina(ctx);
    await ctx.say('vinicius', 'Quatro bombons agora. Ela me viu sem nada na mão e resolveu.');
  },
  async vivian(ctx) {
    if (precisaSabatina()) return sabatina(ctx);
    await ctx.say('vivian', 'Já foi na varanda? Dá pra ver o Rio inteiro do outro lado.');
  },
  async diego(ctx) {
    if (precisaSabatina()) return sabatina(ctx);
    await ctx.say('diego', 'Eu já tô de olho no churrasco. Disseram que é americano. Defumado. Doze horas no fogo.');
  },
  async mingau(ctx) {
    if (precisaSabatina()) return sabatina(ctx);
    await ctx.say('mingau', objDone('chocolates') ? 'Você tem MUITO chocolate. Tipo, muito. Divide comigo? Só um. Dois.' : 'Ainda não foi na cozinha? Vai logo, ela tá com a cesta pronta.');
  },

  async cesta(ctx) {
    await ctx.say('bella', objDone('chocolates') ? 'A cesta continua cheia. Como? Eu já peguei metade!' : 'Uma cesta inteira de chocolate com laço vermelho. Pra quem será?');
    if (!objDone('chocolates')) await ctx.say('weng', 'Eu tenho um palpite.');
  },
  async sofa(ctx) {
    await ctx.say('bella', 'Esse sofá é maior que o meu quarto.');
  },
  async mesa(ctx) {
    await ctx.say('weng', 'Mesa de oito lugares. Aqui em casa sempre cabe mais um.');
  },
  async quadro(ctx) {
    await ctx.say('bella', 'Parece o mar de Icaraí no pôr do sol, em ondas laranja e azuis.');
  },
  async estante(ctx) {
    await ctx.say('weng', 'Livro, globo, bonequinho... e chocolate escondido atrás. Eu sei porque eu já achei.');
  },
  async cozinha(ctx) {
    if (precisaSabatina()) return sabatina(ctx);
    if (objActive('chocolates') && objDone('oi')) return chocolates(ctx);
    await ctx.say('bella', 'Uma ilha de mármore na cozinha. Eu quero uma ilha de mármore.');
  },

  async varanda(ctx) {
    if (!objDone('chocolates')) {
      await ctx.say('weng', 'A vista não foge. Primeiro dá oi e passa na cozinha.');
      return;
    }
    if (objDone('varanda')) {
      await ctx.say('bella', 'Eu podia ficar olhando essa vista o dia inteiro.');
      return;
    }
    await ctx.say('bella', 'Weng, vem! Abre a varanda!');
    await ctx.fadeOut(400);
    ctx.letterbox(true);
    ctx.weather('sunset');
    await ctx.narrate('A porta de vidro abriu e entrou o cheiro de mar.');
    await ctx.narrate('Lá embaixo, a curva da praia de Icaraí e a pedrinha no meio da água. Do outro lado da baía, o Rio inteiro. E o Pão de Açúcar.');
    await ctx.fadeIn(400);
    await ctx.say('bella', 'Dá pra ver o Pão de Açúcar daqui... de DENTRO de uma casa.');
    await ctx.say('weng', 'De Niterói a gente vê o Rio. Do Rio ninguém vê Niterói direito. Por isso a vista daqui é a melhor.');
    const c = await ctx.choose('bella', '(Os dois encostados no vidro da varanda)', ['"Um dia a gente vai ter uma varanda assim."', '"Tira uma foto minha com o Pão de Açúcar?"', 'Encostar a cabeça no ombro dele']);
    if (c === 0) await ctx.say('weng', 'Com rede. E com você brigando comigo por causa do lugar na rede.');
    else if (c === 1) {
      await ctx.say('weng', 'Fica ali no cantinho. Mais pra lá. Isso. Sorri!');
      await ctx.photo('A vista da varanda em Icaraí, com o Pão de Açúcar do outro lado');
    } else {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', '...Melhor vista, de novo.');
    }
    await ctx.say('tio-nt', '(lá de dentro) Ô casal! Bora dar uma volta no Caminho Niemeyer antes do almoço?');
    ctx.letterbox(false);
    await ctx.say('bella', 'Bora!');
    ctx.hearts('player', 6);
    ctx.objective(Q, 'varanda');
    ctx.toast('Saia pela porta de entrada pro Caminho Niemeyer');
  },

  async porta(ctx) {
    if (objDone('varanda') && objActive('niemeyer')) {
      await ctx.say('weng', 'Bora! É pertinho, dá pra ir andando pela orla.');
      await ctx.fadeOut(500);
      await ctx.narrate('Uma caminhada pela orla de Icaraí, a família inteira junto, até as curvas brancas do Niemeyer.');
      await ctx.teleport('nt-niemeyer', 'chegada');
      return;
    }
    await ctx.say('weng', objDone('niemeyer') ? 'O churrasco é depois do passeio.' : 'Calma, a gente acabou de chegar!');
  },
};

/** A cesta: a mãe da Lilian enche a Bella de chocolate (e não aceita "não" como resposta). */
async function chocolates(ctx: ScriptContext): Promise<void> {
  ctx.follow('weng', false);
  await ctx.say('mae-lilian', 'Bella! Vem cá. Isso aqui é pra você.');
  await ctx.say('bella', 'Pra mim? A cesta inteira?!');
  await ctx.say('mae-lilian', 'A cesta é o começo. Toma: bombom de morango, de coco, trufa, barra ao leite...');
  await ctx.say('bella', 'Tia, não precisa, sério!');
  await ctx.say('mae-lilian', 'Precisa sim! Abre essa sacola que eu vou jogando!');
  const r = await ctx.chocolate();
  ctx.setFlag('nt-chocolate-estrelas', r.stars);
  const n = 12 + r.pts;
  await ctx.narrate(`No fim, ${n} chocolates. A Bella mal conseguia segurar.`);
  {
    const t = ctx.playerTile();
    await ctx.move('mingau', t.x + 1.3, t.y + 0.3, 120);
    ctx.face('mingau', 'left');
  }
  await ctx.say('mingau', '(aparecendo do nada) Precisa de ajuda pra carregar?');
  await ctx.say('bella', 'Não. Mas toma um, pela coragem.');
  await ctx.say('weng', '(pegando um escondido) E esse é pelo motorista.');
  await ctx.say('bella', 'WENG!');
  await ctx.say('mae-lilian', 'Deixa ele! Tem mais na cesta. Sempre tem mais.');
  void ctx.move('mingau', 805 / 48, 560 / 48, 90).then(() => ctx.face('mingau', 'left'));
  if (!ctx.has('cesta-chocolates')) await ctx.give('cesta-chocolates', 1, false, 'A mãe da Lilian te deu');
  ctx.hearts('player', 8);
  if (ctx.hasArt('memory-nt-01')) await ctx.memory('mem-nt-01');
  ctx.objective(Q, 'chocolates');
  ctx.follow('weng', true);
  ctx.toast('Agora a vista: a varanda fica embaixo, nas portas de vidro');
}

/** Capítulo 6 — Niterói: o apê dos tios em Icaraí. */
export const ntAptoMap: MapDef = {
  id: 'nt-apto',
  region: 'niteroi',
  name: 'Apê em Icaraí',
  indoor: true,
  music: 'casa',
  background: '#2a1e2e',
  art: 'native',
  lighting: {
    darkness: 0.08,
    color: 0x4a2050,
    lights: [
      { x: 180, y: 60, r: 110 }, { x: 296, y: 60, r: 110 }, { x: 276, y: 240, r: 120 }, { x: 560, y: 240, r: 120 },
      { x: 163, y: 333, r: 110 }, { x: 993, y: 67, r: 110 }, { x: 27, y: 660, r: 110 }, { x: 1504, y: 660, r: 110 },
      { x: 1200, y: 330, r: 220, color: 0xffc070 }, { x: 760, y: 690, r: 300, color: 0xff9a50 },
    ],
  },
  glints: [R(510, 935, 1536, 1024)],
  birds: { y0: 880, y1: 990 },
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 1536, 345), // corredor, quadro, estante, carrinho de bebidas e cozinha
    R(0, 345, 190, 490), // porta de entrada (só pra interagir)
    R(0, 490, 62, 640), // parede da esquerda (cortina)
    R(1478, 345, 1536, 640), // parede da direita (cortina)
    R(195, 380, 262, 445), // planta (esq.)
    R(1410, 440, 1478, 505), // planta (dir.)
    R(0, 632, 1536, 1024), // portas de vidro da varanda e a vista
    // objetos: só a base
    R(245, 400, 620, 470), // sofá
    R(370, 505, 530, 545), // mesinha com os chocolates
    R(860, 470, 1265, 612), // mesa de jantar com as cadeiras
    R(675, 455, 705, 472), // luminária
    R(180, 585, 280, 622), // poltrona (esq.)
    R(650, 590, 750, 627), // poltrona (dir.)
    R(1300, 578, 1380, 602), // cesta
  ],

  objects: [
    { key: 'na-tapete', x: 450, y: 600, w: 380, flat: true, shadow: false },
    { key: 'na-sofa', x: 432, y: 472, w: 400, shadow: 0.9 },
    { key: 'na-mesinha', x: 450, y: 547, w: 200, shadow: 0.8 },
    { key: 'na-mesa', x: 1062, y: 618, w: 430, shadow: 0.85 },
    { key: 'na-luminaria', x: 690, y: 474, w: 55, shadow: 0.5 },
    { key: 'na-poltrona', x: 230, y: 624, w: 110, shadow: 0.7 },
    { key: 'na-poltrona2', x: 700, y: 629, w: 110, shadow: 0.7 },
    { key: 'na-cesta', x: 1340, y: 604, w: 95, shadow: 0.6 },
  ],

  npcs: [
    { id: 'mae-lilian', sprite: 'mae-lilian', tx: 1180 / 48, ty: 382 / 48, facing: 'down', interact: 'maeLilian', markerIf: () => objDone('oi') && objActive('chocolates') },
    { id: 'tio-nt', sprite: 'tio-nt', tx: 1372 / 48, ty: 470 / 48, facing: 'left', interact: 'tio', markerIf: () => (objDone('varanda') && objActive('niemeyer')) },
    { id: 'lilian', sprite: 'lilian', tx: 760 / 48, ty: 398 / 48, facing: 'right', interact: 'lilian' },
    { id: 'vinicius', sprite: 'vinicius', tx: 828 / 48, ty: 398 / 48, facing: 'left', interact: 'vinicius' },
    { id: 'vivian', sprite: 'vivian', tx: 610 / 48, ty: 525 / 48, facing: 'left', interact: 'vivian' },
    { id: 'diego', sprite: 'diego', tx: 975 / 48, ty: 382 / 48, facing: 'down', interact: 'diego' },
    { id: 'mingau', sprite: 'mingau', tx: 805 / 48, ty: 560 / 48, facing: 'left', interact: 'mingau' },
  ],

  hotspots: [
    { rect: R(40, 330, 200, 500), interact: 'porta', label: 'Porta', markerIf: () => objDone('varanda') && objActive('niemeyer'), marker: { dir: 'left' } },
    { rect: R(1045, 300, 1410, 360), interact: 'cozinha', label: 'Cozinha' },
    { rect: R(1290, 560, 1390, 610), interact: 'cesta', label: 'Cesta de chocolate' },
    { rect: R(260, 420, 610, 480), interact: 'sofa', label: 'Sofá' },
    { rect: R(860, 560, 1265, 620), interact: 'mesa', label: 'Mesa' },
    { rect: R(310, 300, 525, 350), interact: 'quadro', label: 'Quadro' },
    { rect: R(600, 300, 800, 350), interact: 'estante', label: 'Estante' },
    { rect: R(300, 615, 1250, 640), interact: 'varanda', label: 'Varanda', marker: { x: 0.5, y: 1.05 }, markerIf: () => objDone('chocolates') && objActive('varanda') },
  ],

  spawns: {
    porta: { tx: 250 / 48, ty: 528 / 48, facing: 'right' },
    // voltando do passeio
    volta: { tx: 250 / 48, ty: 528 / 48, facing: 'right' },
  },
  scripts,
  onEnter: 'chegada',
};
