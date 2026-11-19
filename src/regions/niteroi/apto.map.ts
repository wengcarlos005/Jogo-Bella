import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';

const Q = 'nt-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/nt-apto.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

/** Quem a Bella cumprimenta logo que chega (a seta fica em cima de cada um). */
const OIS = ['nt-oi-tio', 'nt-oi-lilian', 'nt-oi-vivian', 'nt-oi-diego', 'nt-oi-mingau'];
const precisaOi = (f: string) => QuestSystem.isActive(Q) && objDone('chegar') && !objDone('oi') && !GameState.is(f);

async function oi(ctx: ScriptContext, flag: string): Promise<void> {
  if (!precisaOi(flag)) return;
  ctx.setFlag(flag);
  const falta = OIS.filter((f) => !GameState.is(f)).length;
  if (falta) {
    ctx.toast(falta === 1 ? 'Falta dar oi pra 1 pessoa' : `Falta dar oi pra ${falta} pessoas`);
    return;
  }
  await ctx.wait(300);
  await ctx.say('weng', 'Pronto, deu oi pra todo mundo. Agora o mais perigoso: a mãe da Lilian tá te chamando na cozinha.');
  await ctx.say('bella', 'Perigoso por quê?');
  await ctx.say('weng', 'Você vai ver.');
  ctx.objective(Q, 'oi');
  ctx.toast('A mãe da Lilian tá te esperando na cozinha');
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
    await ctx.say('mae-lilian', 'Chegaram! Entra, entra! Bella, que bom que você veio!');
    await ctx.say('bella', 'Oi! Obrigada por receber a gente!');
    await ctx.say('mae-lilian', 'Imagina, minha filha. Dá oi pra todo mundo e depois vem aqui na cozinha. Eu tenho uma coisinha pra você.');
    await ctx.say('weng', '(cochichando) "Uma coisinha". Prepara a bolsa.');
    ctx.objective(Q, 'chegar');
    ctx.toast('Dê oi pra família (siga as setas)');
  },

  async maeLilian(ctx) {
    if (objActive('oi')) {
      await ctx.say('mae-lilian', 'Vai lá dar oi pro pessoal primeiro! Depois vem aqui, que eu tô te esperando.');
      return;
    }
    if (objActive('chocolates')) return chocolates(ctx);
    const f = ['Já comeu chocolate hoje? Tem mais na cesta, viu?', 'Fica à vontade, a casa é sua. Quer água? Suco? Chocolate?', 'O Weng falava tanto de você. Agora eu entendi por quê.'];
    const n = Number(ctx.flag('nt-mae-n') || 0);
    ctx.setFlag('nt-mae-n', (n + 1) % f.length);
    await ctx.say('mae-lilian', f[n % f.length]);
  },
  async tio(ctx) {
    if (precisaOi('nt-oi-tio')) {
      await ctx.say('tio-nt', 'E aí, Weng! Cresceu, hein? E essa é a famosa Bella?');
      await ctx.say('bella', 'Famosa?');
      await ctx.say('tio-nt', 'Ele só fala de você. A gente já te conhecia antes de te conhecer.');
      await ctx.emote('bella', 'heart');
      await oi(ctx, 'nt-oi-tio');
      return;
    }
    if (objDone('varanda') && objActive('niemeyer')) {
      await ctx.say('tio-nt', 'Bora no Caminho Niemeyer antes do almoço? Dá pra ir andando. É só sair pela porta.');
      return;
    }
    await ctx.say('tio-nt', objDone('chocolates') ? 'Ela te deu chocolate, né? Ela dá chocolate pra todo mundo. Pro porteiro. Pro carteiro.' : 'Senta, fica à vontade. A vista daqui é a melhor parte da casa.');
  },
  async lilian(ctx) {
    if (precisaOi('nt-oi-lilian')) {
      await ctx.say('lilian', 'Bella! De novo junto! Deixa eu te apresentar: esse é o Vinicius, meu namorado.');
      await ctx.say('vinicius', 'Prazer, Bella. Ouvi falar muito de você.');
      await ctx.say('bella', 'O prazer é meu! Agora eu não sou a única pessoa nova da família.');
      await ctx.say('vinicius', 'Ufa. Somos dois.');
      await ctx.say('weng', 'Vinicius, regra número um: aceita tudo que a mãe da Lilian te oferecer.');
      await ctx.say('vinicius', 'Já aprendi. Eu tô com três bombons no bolso.');
      await oi(ctx, 'nt-oi-lilian');
      return;
    }
    await ctx.say('lilian', 'Depois vamos tirar uma foto todo mundo junto na varanda, tá?');
  },
  async vinicius(ctx) {
    if (precisaOi('nt-oi-lilian')) return scripts.lilian(ctx);
    await ctx.say('vinicius', 'Quatro bombons agora. Ela me viu sem nada na mão e resolveu.');
  },
  async vivian(ctx) {
    if (precisaOi('nt-oi-vivian')) {
      await ctx.say('vivian', 'Bella! Que vestido lindo! Laranja combina com você.');
      await ctx.say('bella', 'Obrigada! Eu fiquei com medo de ser demais.');
      await ctx.say('vivian', 'Demais nada. Aqui em casa o demais é a comida. E o chocolate.');
      await oi(ctx, 'nt-oi-vivian');
      return;
    }
    await ctx.say('vivian', 'Já foi na varanda? Dá pra ver o Rio inteiro do outro lado.');
  },
  async diego(ctx) {
    if (precisaOi('nt-oi-diego')) {
      await ctx.say('diego', 'E aí, Bella. Sobreviveu ao ano-novo da tia Tim, sobrevive a esse.');
      await ctx.say('bella', 'Esse parece mais tranquilo.');
      await ctx.say('diego', 'Parece. Espera a cesta de chocolate.');
      await oi(ctx, 'nt-oi-diego');
      return;
    }
    await ctx.say('diego', 'Eu já tô de olho no churrasco. Disseram que é americano. Defumado. Doze horas no fogo.');
  },
  async mingau(ctx) {
    if (precisaOi('nt-oi-mingau')) {
      await ctx.say('mingau', 'Bella! Você vai ganhar chocolate da tia. Se não quiser algum, me dá.');
      await ctx.say('bella', 'E se eu quiser todos?');
      await ctx.say('mingau', '...Aí a gente negocia.');
      await oi(ctx, 'nt-oi-mingau');
      return;
    }
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
    await ctx.say('bella', 'Parece o mar de Icaraí no pôr do sol, em ondas laranjas e azuis.');
  },
  async estante(ctx) {
    await ctx.say('weng', 'Livro, globo, bonequinho... e chocolate escondido atrás. Eu sei porque eu já achei.');
  },
  async cozinha(ctx) {
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
  await ctx.say('mingau', '(aparecendo do nada) Precisa de ajuda pra carregar?');
  await ctx.say('bella', 'Não. Mas toma um, pela coragem.');
  await ctx.say('weng', '(pegando um escondido) E esse é pelo motorista.');
  await ctx.say('bella', 'WENG!');
  await ctx.say('mae-lilian', 'Deixa ele! Tem mais na cesta. Sempre tem mais.');
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
    { id: 'tio-nt', sprite: 'tio-nt', tx: 1372 / 48, ty: 470 / 48, facing: 'left', interact: 'tio', markerIf: () => precisaOi('nt-oi-tio') || (objDone('varanda') && objActive('niemeyer')) },
    { id: 'lilian', sprite: 'lilian', tx: 760 / 48, ty: 398 / 48, facing: 'right', interact: 'lilian', markerIf: () => precisaOi('nt-oi-lilian') },
    { id: 'vinicius', sprite: 'vinicius', tx: 828 / 48, ty: 398 / 48, facing: 'left', interact: 'vinicius' },
    { id: 'vivian', sprite: 'vivian', tx: 610 / 48, ty: 525 / 48, facing: 'left', interact: 'vivian', markerIf: () => precisaOi('nt-oi-vivian') },
    { id: 'diego', sprite: 'diego', tx: 975 / 48, ty: 382 / 48, facing: 'down', interact: 'diego', markerIf: () => precisaOi('nt-oi-diego') },
    { id: 'mingau', sprite: 'mingau', tx: 805 / 48, ty: 560 / 48, facing: 'left', interact: 'mingau', markerIf: () => precisaOi('nt-oi-mingau') },
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
