import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';

const Q = 'ro-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/ro-praia.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

/** Muro do calçadão (em cima) e espuma do mar (embaixo), em faixas de 48 px seguindo as linhas da arte. */
const wallEdge = (x: number) => (x < 650 ? 388 : x < 830 ? 360 : 352 - (x - 830) * 0.075);
const waterEdge = (x: number) => 872 - x * 0.163;
const bordas: TileRect[] = [];
for (let x = 0; x < 1536; x += 48) {
  const c = x + 24;
  bordas.push(R(x, 0, x + 48, Math.round(wallEdge(c))));
  bordas.push(R(x, Math.round(waterEdge(c)), x + 48, 1024));
}

/** O guarda-sol já foi alugado? (o Weng, o salvador) */
const comSombra = () => GameState.is('ro-guardasol');

/** Depois de cada parte, o que falta. */
async function proximo(ctx: ScriptContext): Promise<void> {
  if (!objDone('guardasol')) ctx.toast('Procure o barraqueiro do aluguel (a barraquinha listrada, à esquerda)');
  else if (!objDone('lanche')) ctx.toast('O isopor do seu pai tá do lado da toalha');
  else if (!objDone('brincar')) ctx.toast('As raquetes de frescobol tão ali na areia');
  else if (!objDone('petisco')) ctx.toast('Fim de tarde: petisco no quiosque de toldo amarelo');
}

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (!QuestSystem.isActive(Q) || ctx.flag('ro-chegou')) return;
    ctx.setFlag('ro-chegou');
    await ctx.narrate('Rio das Ostras. Uma passagem rápida, mas com o mais importante: praia.');
    await ctx.narrate('Sol de rachar, areia quente e o mar azulzinho logo ali.');
    await ctx.say('bella', 'Weng! Olha esse mar! Eu quero ficar aqui o dia inteiro!');
    await ctx.say('weng', 'Então bora achar um lugar. De preferência na sombra.');
    await ctx.say('pai-ro', 'Sombra pra quê? Aqui tá ótimo! Estica a toalha aqui mesmo.');
    await ctx.say('bella', 'Pai... aqui é sol puro.');
    await ctx.say('pai-ro', 'Guarda-sol aqui é um assalto. Trinta reais pra ficar debaixo de um pano? Nem pensar.');
    await ctx.say('weng', '(cochichando) Seu pai é bem... econômico.');
    await ctx.say('bella', '(cochichando) Canguinha. A palavra é canguinha.');
    ctx.objective(Q, 'chegar');
    await ctx.say('pai-ro', 'Sol faz bem pra saúde! Vitamina D!');
    await ctx.say('bella', 'Pai, tá quarenta graus.');
    const sol = await ctx.sol();
    ctx.setFlag('ro-sol-estrelas', sol.stars);
    await ctx.narrate('Uma hora no sol depois...');
    await ctx.say('bella', 'Weng. Olha o meu ombro. Tá VERMELHO.');
    await ctx.say('weng', 'O meu nariz tá parecendo um tomate. Eu sinto ele pulsando.');
    await ctx.say('bella', 'A gente vai virar camarão. Camarão na brasa.');
    ctx.objective(Q, 'sol');
    ctx.toast('Alguém precisa salvar o dia: o aluguel de guarda-sol fica à esquerda');
  },

  async aluguel(ctx) {
    if (objDone('guardasol')) {
      await ctx.say('barraqueiro', 'Tá tudo certo aí, casal? Qualquer coisa é só chamar!');
      return;
    }
    await ctx.say('barraqueiro', 'Fala, meu querido! Guarda-sol e duas cadeiras? Faço um preço camarada.');
    const c = await ctx.choose('weng', '(A Bella e o pai estão torrando lá no sol)', ['Alugar o guarda-sol e as cadeiras', '"Racha comigo, meu sogro?"']);
    if (c === 1) {
      await ctx.say('pai-ro', '(de longe) Rachar? ...Tá, tá bom. Mas a cadeira é minha!');
      await ctx.say('weng', 'Metade cada. Fechado.');
    } else {
      await ctx.say('weng', 'Pode mandar o guarda-sol e as cadeiras. É por minha conta.');
    }
    ctx.sfx('pickup');
    ctx.setFlag('ro-guardasol');
    await ctx.fadeOut(400);
    await ctx.narrate('Um guarda-sol azul e branco, duas cadeiras e, finalmente, sombra.');
    await ctx.fadeIn(400);
    await ctx.say('bella', 'SOMBRA! Weng, você é o meu herói. O salvador do dia!');
    await ctx.say('weng', 'Herói da sombra. Bota no meu currículo.');
    await ctx.say('pai-ro', '...Até que a sombra é boa, né.');
    await ctx.say('bella', '(baixinho) Ele vai sentar na cadeira que você pagou. Escreve o que eu tô falando.');
    ctx.hearts('player', 8);
    await ctx.memory('mem-ro-01');
    ctx.objective(Q, 'guardasol');
    await proximo(ctx);
  },

  async isopor(ctx) {
    if (!objDone('guardasol')) {
      await ctx.say('bella', 'O isopor do meu pai. Primeiro a sombra, depois a comida!');
      return;
    }
    if (objDone('lanche')) {
      await ctx.say('bella', 'Sobrou meia maçã e uma torrada. Meu pai vai levar de volta pra casa. Certeza.');
      return;
    }
    await ctx.say('pai-ro', 'Tá com fome? Eu trouxe lanche! Fruta lavada e torrada. Coisa saudável.');
    await ctx.say('bella', 'Pai... torrada. Na praia. A gente tá no piquenique da escola?');
    await ctx.say('pai-ro', 'Pra que gastar com petisco se tem comida em casa?');
    const c = await ctx.choose('bella', '(Uma torrada na mão, o cheiro de petisco vindo do quiosque)', ['Comer a torrada (bolada)', '"Pai, você é muito canguinha."', 'Olhar pro Weng pedindo socorro']);
    if (c === 0) {
      await ctx.say('bella', '(mastigando, bolada) Tá. Tá boa. Mas é torrada.');
      await ctx.say('weng', 'A banana tá ótima, sogro.');
    } else if (c === 1) {
      await ctx.say('pai-ro', 'Canguinha não! Econômico! É diferente!');
      await ctx.say('weng', '(segurando a risada) Bem diferente.');
    } else {
      await ctx.say('weng', '(cochichando) Fim de tarde eu te levo no quiosque. Prometo.');
      await ctx.emote('bella', 'heart');
    }
    ctx.objective(Q, 'lanche');
    await proximo(ctx);
  },

  async raquetes(ctx) {
    if (!objDone('guardasol')) {
      await ctx.say('weng', 'Frescobol nesse sol? A gente derrete. Primeiro a sombra.');
      return;
    }
    if (objDone('brincar')) {
      await ctx.say('bella', 'Revanche de frescobol depois. Agora eu tô exausta.');
      return;
    }
    await ctx.say('weng', 'Frescobol! Vamos ver quem deixa cair primeiro.');
    await ctx.say('bella', 'Você. Com certeza você.');
    await ctx.fadeOut(400);
    await ctx.narrate('Toc. Toc. Toc. Toc... e a bolinha foi parar na cabeça de um senhor que tava dormindo.');
    await ctx.fadeIn(400);
    await ctx.say('weng', 'DESCULPA, SENHOR!');
    await ctx.say('bella', 'Hahahaha! Corre, Weng!');
    await ctx.narrate('Depois, os dois correram pro mar, pularam onda e fizeram um castelo de areia meio torto.');
    ctx.hearts('player', 6);
    ctx.objective(Q, 'brincar');
    await proximo(ctx);
  },

  async quiosque(ctx) {
    if (!objDone('brincar') || !objDone('lanche')) {
      await ctx.say('bella', 'O quiosque. Tá saindo um cheiro de batata frita que eu não aguento.');
      await proximo(ctx);
      return;
    }
    if (objDone('petisco')) {
      await ctx.say('bella', 'Melhor petisco da vida. E a gente nem ligou pra chuva.');
      return;
    }
    await ctx.say('weng', 'Prometi, tá prometido. Bora pro quiosque!');
    await ctx.fadeOut(500);
    await ctx.narrate('Fim de tarde. Uma mesinha de plástico, os pés na areia e a mesa cheia.');
    await ctx.fadeIn(400);
    const c = await ctx.choose('bella', 'O que pede primeiro?', ['Batata frita', 'Isca de peixe', 'Camarão', 'Tudo. Pede tudo.']);
    await ctx.say('weng', c === 3 ? 'Tudo. Moço, manda tudo!' : 'E mais um pouco de tudo, que hoje a gente merece.');
    await ctx.say('pai-ro', '...Eu vou provar só um pouquinho. Só um.');
    await ctx.say('bella', '(cochichando) Ele já comeu cinco.');
    await ctx.narrate('E então o céu fechou. De repente. Vento, nuvem escura e um trovão lá longe.');
    await ctx.say('bella', 'Weng... aquilo é uma tempestade?');
    await ctx.say('weng', 'Pega as coisas! Guarda-sol, toalha, cadeira! CORRE!');
    await ctx.fadeOut(400);
    await ctx.fadeIn(300);
    const tp = await ctx.tempestade();
    ctx.setFlag('ro-tempestade-estrelas', tp.stars);
    await ctx.fadeOut(300);
    await ctx.narrate('Chegaram no toldo do quiosque ensopados, vermelhos de sol... e ainda com a batata frita na mão.');
    await ctx.fadeIn(400);
    await ctx.say('pai-ro', '(chegando ensopado, com o isopor) Viu? Se tivesse alugado dois guarda-sóis, ia ter perdido os dois!');
    await ctx.say('bella', 'Pai. Para.');
    await ctx.say('bella', 'A gente tá queimado, molhado e cheio de areia.');
    await ctx.say('weng', 'Melhor dia de praia da vida?');
    await ctx.say('bella', 'Melhor dia de praia da vida.');
    ctx.hearts('player', 12);
    await ctx.memory('mem-ro-02');
    ctx.objective(Q, 'petisco');
    ctx.objective(Q, 'tempestade');
    await ctx.fadeOut(600);
    await ctx.chapterCard('Fim do Capítulo 5', 'Rio das Ostras', 'Um dia de praia.', 'Continuar', {
      title: 'Um dia de praia',
      photos: ['memory-ro-01', 'memory-ro-02'],
      lines: [
        'Uma passagem rápida por Rio das Ostras, e o melhor de tudo foi a praia.',
        'O pai dela não quis pagar o guarda-sol, e os dois viraram camarão.',
        'O Weng salvou o dia: sombra, cadeira e um herói de chinelo.',
        'Frescobol, onda, torrada do pai... e petisco no quiosque até a tempestade chegar.',
      ],
    });
    ctx.toast('O Capítulo 6 chega em breve');
    await ctx.fadeIn(600);
  },

  async pai(ctx) {
    if (!objDone('guardasol')) {
      await ctx.say('pai-ro', 'Tá vendo? Sol de graça! Guarda-sol é coisa de turista.');
      return;
    }
    if (!objDone('lanche')) {
      await ctx.say('pai-ro', 'Quem tá com fome? Tem fruta e torrada no isopor! Coisa boa.');
      return;
    }
    const f = ['A sombra até que é boa. Mas eu aguentava o sol, viu?', 'Weng, você é um rapaz direito. Gastador, mas direito.', 'Esse petisco do quiosque tá muito caro. Mas tá cheiroso, né?'];
    const n = Number(ctx.flag('ro-pai-n') || 0);
    ctx.setFlag('ro-pai-n', (n + 1) % f.length);
    await ctx.say('pai-ro', f[n % f.length]);
  },
  async castelo(ctx) {
    await ctx.say('bella', 'Um castelo de areia! Alguém caprichou. O nosso vai ficar torto, já aviso.');
  },
  async placa(ctx) {
    await ctx.say('weng', 'Aluguel de guarda-sol e cadeira. O lugar mais importante da praia hoje.');
  },
  async mar(ctx) {
    await ctx.say('bella', comSombra() ? 'O mar tá quentinho! Depois a gente pula onda, combinado?' : 'O mar tá lindo... mas meu ombro tá ardendo demais pra pensar nisso.');
  },
  async escada(ctx) {
    if (QuestSystem.isActive(Q)) {
      await ctx.say('weng', 'Já? A gente nem aproveitou a praia ainda!');
      const t = ctx.playerTile();
      await ctx.move('player', t.x, t.y + 1.2, 60);
    }
  },
};

/** Capítulo 5 — Rio das Ostras: um dia de praia. */
export const roPraiaMap: MapDef = {
  id: 'ro-praia',
  region: 'rio-das-ostras',
  name: 'Praia',
  music: 'parque',
  background: '#2a7ab8',
  art: 'native',
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    ...bordas,
    R(60, 410, 275, 535), // barraquinha do aluguel
    R(0, 380, 60, 500), // arbustos (esq.)
    // objetos soltos: só a base
    R(655, 640, 745, 668), // isopor
    R(1100, 430, 1225, 470), // mesa do quiosque
    R(400, 720, 470, 750), // castelo
  ],

  objects: [
    { key: 'ro-toalha', x: 760, y: 640, w: 200, flat: true, shadow: false },
    { key: 'ro-isopor', x: 700, y: 668, w: 95, shadow: 0.6 },
    { key: 'ro-guardasol', x: 790, y: 640, w: 200, shadow: 0.9, when: () => GameState.is('ro-guardasol') },
    { key: 'ro-cadeira', x: 860, y: 655, w: 72, shadow: 0.5, when: () => GameState.is('ro-guardasol') },
    { key: 'ro-fechado', x: 250, y: 530, w: 34, shadow: false },
    { key: 'ro-placa', x: 330, y: 535, w: 78, shadow: 0.5 },
    { key: 'ro-raquetes', x: 960, y: 610, w: 72, flat: true, shadow: false },
    { key: 'ro-castelo', x: 435, y: 752, w: 90, shadow: false },
    { key: 'ro-mesa', x: 1160, y: 472, w: 110, shadow: 0.6 },
    { key: 'ro-protetor', x: 640, y: 652, w: 24, shadow: false },
  ],

  npcs: [
    { id: 'barraqueiro', sprite: 'barraqueiro', tx: 6.0, ty: 11.3, facing: 'down', interact: 'aluguel' },
    // o Anderson, pai da Bella, do lado do isopor
    { id: 'pai-ro', sprite: 'pai-ro', tx: 12.6, ty: 13.6, facing: 'right', interact: 'pai' },
  ],

  hotspots: [
    { rect: R(60, 420, 300, 560), interact: 'aluguel', label: 'Aluguel', markerIf: () => objDone('sol') && objActive('guardasol') },
    { rect: R(640, 600, 760, 680), interact: 'isopor', label: 'Isopor', markerIf: () => objDone('guardasol') && objActive('lanche') },
    { rect: R(910, 570, 1010, 640), interact: 'raquetes', label: 'Frescobol', markerIf: () => objDone('guardasol') && objActive('brincar') },
    { rect: R(1060, 300, 1420, 480), interact: 'quiosque', label: 'Quiosque', markerIf: () => objDone('lanche') && objDone('brincar') && objActive('petisco') },
    { rect: R(390, 690, 480, 760), interact: 'castelo', label: 'Castelo de areia' },
    { rect: R(300, 480, 360, 540), interact: 'placa', label: 'Placa' },
    { rect: R(500, 760, 1400, 820), interact: 'mar', label: 'Mar' },
  ],

  spawns: {
    chegada: { tx: 15.0, ty: 8.6, facing: 'down' },
  },
  triggers: [{ id: 'escada', rect: R(660, 330, 820, 352), script: 'escada' }],
  scripts,
  onEnter: 'chegada',
};
