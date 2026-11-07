import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'pt-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/pt-restaurante.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (!objActive('almoco') || ctx.flag('pt-rest-1')) return;
    ctx.setFlag('pt-rest-1');
    await ctx.narrate('O dia do aniversário. Um almoço chique pra comemorar.');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Weng... tem LUSTRE de cristal. E um piano. Eu tô de casaco de moletom!');
    await ctx.say('weng', 'Você tá linda. O lustre que se adapte.');
    await ctx.say('garcom', 'Boa tarde! Reserva em nome de...?');
    await ctx.say('weng', 'Weng. Mesa pra dois. É aniversário dela.');
    await ctx.say('garcom', 'Ah, a mesa da rosa! Por aqui, por favor. Bem no meio, debaixo do lustre.');
    ctx.toast('Sentem na mesa da rosa, no meio do salão');
  },

  async mesa(ctx) {
    if (!objActive('almoco')) {
      await ctx.say('bella', 'A nossa mesa. A rosa ainda tá aqui.');
      return;
    }
    await ctx.fadeOut(400);
    ctx.follow('weng', false);
    // na frente das cadeiras, um de cada lado da mesa (visíveis, de frente um pro outro)
    ctx.place('player', 13.7, 11.4, 'right');
    ctx.place('weng', 18.0, 11.4, 'left');
    ctx.place('garcom', 15.9, 13.4, 'up');
    await ctx.frame(16, 10.6, 0);
    await ctx.fadeIn(500);
    await ctx.narrate('Alguém começa a tocar piano. Bem baixinho.');
    await ctx.say('garcom', 'O cardápio de hoje. O chef recomenda a truta da serra.');
    const c = await ctx.choose('bella', '(Tudo com nome difícil...)', ['"A truta da serra, por favor!"', '"O risoto de cogumelos!"', '"O que for mais quentinho. Tô congelando."']);
    if (c === 0) await ctx.say('garcom', 'Excelente escolha. A truta vem da cachoeira aqui de perto.');
    else if (c === 1) await ctx.say('garcom', 'Risoto de cogumelos frescos da serra. Ótima pedida.');
    else await ctx.say('garcom', 'Então o fondue de queijo! Quentinho e borbulhando.');
    await ctx.say('weng', 'Pra mim o mesmo. E... uma sobremesa surpresa no final, tá?');
    await ctx.say('garcom', '(piscando) Já está tudo combinado, senhor.');
    await ctx.emote('bella', 'question');
    await ctx.say('bella', 'Que sobremesa surpresa é essa?');
    await ctx.say('weng', 'Surpresa é surpresa.');
    await ctx.fadeOut(600);
    await ctx.narrate('A comida chegou. Depois, a sobremesa: um petit gâteau com uma velinha acesa.');
    await ctx.fadeIn(600);
    ctx.sfx('memory');
    await ctx.say('garcom', 'Parabéns pra você... (o salão inteiro bateu palma)');
    await ctx.emote('bella', 'heart');
    const c2 = await ctx.choose('bella', '(Fazer um pedido antes de soprar a vela)', ['Pedir mais mil aniversários assim', 'Pedir pra viajar o mundo com ele', 'Fechar os olhos e não contar pra ninguém']);
    if (c2 === 0) await ctx.say('bella', 'Pedi mil aniversários assim. Com você.');
    else if (c2 === 1) await ctx.say('bella', 'Pedi pra gente viajar o mundo inteiro. Começando pela serra.');
    else await ctx.say('bella', '...Não conto. Mas você tá nele.');
    ctx.hearts('player', 10);
    await ctx.say('weng', 'Feliz aniversário, Bella. Obrigado por existir.');
    await ctx.unfocus(400);
    ctx.follow('weng', true);
    ctx.objective(Q, 'almoco');
    await ctx.narrate('O Quitandinha e o piquenique na serra... essa parte da viagem chega em breve!');
  },

  async piano(ctx) {
    await ctx.say('bella', 'Um piano de cauda de verdade. Se eu soubesse tocar, eu tocava "Yellow".');
    await ctx.say('weng', 'Eu cantaria. Mal. Mas cantaria.');
  },
  async adega(ctx) {
    await ctx.say('weng', 'Uma parede inteira de vinho. Eu não entendo nada, mas parece chique.');
  },
  async janela(ctx) {
    await ctx.say('bella', 'Hortênsias e a serra lá atrás. Petrópolis é muito bonita.');
  },
  async garcom(ctx) {
    await ctx.say('garcom', objDone('almoco') ? 'Volte sempre! E parabéns de novo, senhorita.' : 'A mesa da rosa está esperando por vocês.');
  },
  async saida(ctx) {
    if (objActive('almoco')) {
      await ctx.say('weng', 'Ei, a gente nem almoçou ainda! A mesa tá ali.');
      const t = ctx.playerTile();
      await ctx.move('player', t.x, t.y - 1.2, 60);
      return;
    }
    await ctx.teleport('pt-hotel-fora', 'portao');
  },
};

/** Capítulo 3 — Petrópolis: o restaurante chique do almoço de aniversário. */
export const restauranteMap: MapDef = {
  id: 'pt-restaurante',
  region: 'petropolis',
  name: 'Restaurante',
  indoor: true,
  music: 'casa',
  background: '#2a160e',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 1536, 445), // parede do fundo com as janelas
    R(0, 0, 40, 1024),
    R(1495, 0, 1536, 1024),
    R(0, 230, 180, 745), // adega
    R(1415, 370, 1500, 650), // porta da cozinha
    R(0, 885, 620, 1024), // parede de baixo (porta em x 620–910)
    R(910, 885, 1536, 1024),
    R(430, 800, 590, 1024), // púlpito da recepção
    R(620, 975, 910, 1024),
    // objetos: só a base
    R(680, 520, 860, 565), // mesa da rosa (com as cadeiras dos lados)
    R(310, 560, 495, 615), // mesas de quatro
    R(345, 810, 525, 870),
    R(1035, 810, 1215, 870),
    R(1110, 500, 1340, 560), // piano
    R(205, 438, 275, 470), // palmeiras
    R(1345, 850, 1415, 880),
    R(560, 430, 610, 452), // pedestais com hortênsias
    R(930, 430, 980, 452),
    R(1355, 668, 1425, 690), // carrinho
  ],

  objects: [
    { key: 'rs-mesa2', x: 770, y: 565, w: 220, shadow: 0.8 },
    { key: 'rs-mesa4', x: 402, y: 615, w: 200, shadow: 0.8 },
    { key: 'rs-mesa4', x: 435, y: 870, w: 195, shadow: 0.8 },
    { key: 'rs-mesa4', x: 1125, y: 870, w: 195, shadow: 0.8 },
    { key: 'rs-piano', x: 1225, y: 560, w: 240, shadow: 0.8 },
    { key: 'rs-palmeira', x: 240, y: 470, w: 110, shadow: 0.6 },
    { key: 'rs-palmeira', x: 1380, y: 880, w: 100, shadow: 0.6, flip: true },
    { key: 'rs-pedestal', x: 585, y: 452, w: 60, shadow: 0.6 },
    { key: 'rs-pedestal', x: 955, y: 452, w: 60, shadow: 0.6 },
    { key: 'rs-carrinho', x: 1390, y: 690, w: 85, shadow: 0.7 },
  ],

  lighting: {
    darkness: 0.12,
    lights: [
      { x: 548, y: 140, r: 260 },
      { x: 985, y: 140, r: 260 },
      { x: 208, y: 240, r: 140 },
      { x: 610, y: 235, r: 140 },
      { x: 920, y: 235, r: 140 },
      { x: 1325, y: 235, r: 140 },
      { x: 770, y: 470, r: 120, flicker: true },
    ],
  },

  hotspots: [
    { rect: R(660, 440, 880, 570), interact: 'mesa', label: 'Sentar', markerIf: () => objActive('almoco') },
    { rect: R(1105, 300, 1345, 565), interact: 'piano', label: 'Piano' },
    { rect: R(40, 230, 180, 745), interact: 'adega', label: 'Adega' },
    { rect: R(660, 300, 880, 445), interact: 'janela', label: 'Janela' },
  ],

  npcs: [{ id: 'garcom', sprite: 'garcom', tx: 12.3, ty: 15.4, facing: 'down', interact: 'garcom', behavior: 'wander', wanderRadius: 1.2, wanderAxis: 'x' }],

  spawns: {
    porta: { tx: 15.5, ty: 18.2, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(660, 950, 870, 975), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
