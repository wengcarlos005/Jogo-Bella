import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';

const Q = 'ar-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/ar-praia.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

/**
 * A orla sobe em diagonal (da esquerda pra direita): o calçadão começa logo abaixo da avenida e a
 * areia termina na espuma da água. Faixas de 48 px seguindo as duas linhas.
 */
const roadEdge = (x: number) => 578 - 0.107 * x; // fim do asfalto (início do calçadão)
const waterEdge = (x: number) => 800 - 0.13 * x; // espuma da água
const diagonal: TileRect[] = [];
for (let x = 0; x < 1536; x += 48) {
  const c = x + 24;
  diagonal.push(R(x, 0, x + 48, Math.round(roadEdge(c))));
  diagonal.push(R(x, Math.round(waterEdge(c)), x + 48, 1024));
}

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (!objActive('praia') || ctx.flag('ar-praia-chegou')) return;
    ctx.setFlag('ar-praia-chegou');
    await ctx.narrate('31 de dezembro, fim de tarde. A orla da Lagoa de Araruama, bem em frente ao prédio.');
    await ctx.say('bella', 'Ufa. Ar.');
    await ctx.say('weng', 'Tava tão ruim assim lá em cima?');
    await ctx.say('bella', 'Não! Todo mundo é muito legal. Eu que fico achando que tão me analisando.');
    await ctx.say('weng', 'Ninguém tá te analisando. A Laylinha talvez. Mas ela tem cinco anos.');
    ctx.toast('Passeie pela orla. A beira da água tem ♥');
  },

  async agua(ctx) {
    if (!objActive('praia')) {
      await ctx.say('bella', 'A lagoa nem tem onda. Parece um espelho gigante.');
      return;
    }
    await ctx.say('weng', 'Sabia que eu sou o campeão da família em pedrinha na água?');
    await ctx.say('bella', 'Campeão segundo quem?');
    await ctx.say('weng', 'Segundo eu. Bora ver?');
    const r = await ctx.pedrinha();
    ctx.setFlag('ar-pedrinha-estrelas', r.stars);
    await ctx.narrate('Os dois sentaram na areia, com o pé na água morna, vendo o sol descer atrás da lagoa.');
    await ctx.say('bella', 'Weng... e se a sua família achar que eu não sou boa o suficiente pra você?');
    await ctx.say('weng', 'Bella. A tia Tim já te deu comida quatro vezes. A Vivian contou pra todo mundo que eu só falo de você.');
    await ctx.say('weng', 'E mesmo se alguém achasse alguma coisa... eu escolhi você. Isso não muda.');
    const c = await ctx.choose('bella', '(O sol encostando na água)', ['Encostar a cabeça no ombro dele', '"Obrigada por me trazer."', '"Tá, mas a revanche da pedrinha é amanhã."']);
    if (c === 0) {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', '...Fica assim mais um pouquinho.');
    } else if (c === 1) await ctx.say('weng', 'Obrigado por ter vindo. De verdade.');
    else await ctx.say('weng', r.stars >= 2 ? 'Revanche aceita. Vou treinar a noite toda.' : 'Pode vir. O campeão aceita qualquer desafio.');
    ctx.nerves(20);
    ctx.hearts('player', 8);
    ctx.objective(Q, 'praia');
    await ctx.say('weng', 'Bora subir? A tia Tim já deve estar com a ceia quase pronta. E ela fica brava se a gente atrasa.');
    await ctx.fadeOut(600);
    await ctx.narrate('Quando eles voltaram, o apartamento inteiro cheirava a pato assado.');
    await ctx.teleport('ar-cobertura', 'porta');
  },

  async coco(ctx) {
    if (ctx.flag('ar-coco')) {
      await ctx.say('bella', 'A melhor água de coco de Araruama. Talvez do mundo.');
      return;
    }
    ctx.setFlag('ar-coco');
    await ctx.say('weng', 'Duas águas de coco, por favor!');
    ctx.sfx('pickup');
    await ctx.say('bella', 'Geladinha... Weng, por que água de coco na praia é sempre mais gostosa?');
    await ctx.say('weng', 'Porque é tomada de chinelo. Comprovado cientificamente.');
  },
  async castelo(ctx) {
    await ctx.say('bella', 'Alguém fez um castelo de areia! Com bandeirinha e tudo.');
    await ctx.say('weng', 'Aposto que foi o Mingau. Ele diz que é grande demais pra isso, mas é o melhor construtor da família.');
  },
  async guardasol(ctx) {
    await ctx.say('bella', 'Guarda-sol, cadeirinha e lagoa. Isso aqui é férias de verdade.');
  },
  async barco(ctx) {
    await ctx.say('weng', 'Um barquinho de pescador. Amanhã de manhã eles saem cedinho.');
  },
  async quiosque(ctx) {
    await ctx.say('bella', 'O quiosque tá fechado. Todo mundo foi se arrumar pra virada.');
  },
  async predio(ctx) {
    if (objActive('praia')) {
      await ctx.say('weng', 'Já quer subir? A gente nem foi até a água ainda.');
      return;
    }
    await ctx.teleport('ar-cobertura', 'porta');
  },
};

/** Capítulo 4 — Araruama: a orla da lagoa em frente ao prédio dos tios (tarde do dia 31). */
export const praiaMap: MapDef = {
  id: 'ar-praia',
  region: 'araruama',
  name: 'Orla da Lagoa',
  music: 'parque',
  background: '#2a6a9a',
  art: 'native',
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    ...diagonal,
    R(0, 520, 210, 700), // quiosque e arbustos
    // bases das palmeiras e postes do calçadão
    R(270, 640, 312, 668),
    R(560, 600, 602, 628),
    R(915, 556, 957, 584),
    R(1230, 516, 1272, 544),
    R(1490, 480, 1536, 510),
    R(432, 640, 456, 660),
    R(755, 598, 779, 618),
    R(1092, 556, 1116, 576),
    R(1390, 516, 1414, 536),
    // objetos soltos: só a base
    R(585, 575, 715, 605), // carrinho de coco
    R(985, 640, 1015, 662), // guarda-sol
    R(445, 715, 520, 745), // castelo
    R(1310, 600, 1450, 628), // barco
  ],

  objects: [
    { key: 'pr-coco', x: 650, y: 606, w: 150, shadow: 0.6 },
    { key: 'pr-guardasol', x: 1000, y: 664, w: 140, shadow: false },
    { key: 'pr-cadeira', x: 935, y: 676, w: 52, shadow: 0.5 },
    { key: 'pr-cadeira', x: 1065, y: 660, w: 52, shadow: 0.5, flip: true },
    { key: 'pr-castelo', x: 482, y: 746, w: 90, shadow: false },
    { key: 'pr-barco', x: 1380, y: 630, w: 180, shadow: false },
  ],

  overlays: [
    // copas das palmeiras do calçadão passam na frente de quem anda atrás delas
    { x0: 195, y0: 455, x1: 375, y1: 600, base: 668, cut: 'foliage', fade: true },
    { x0: 485, y0: 440, x1: 665, y1: 570, base: 628, cut: 'foliage', fade: true },
    { x0: 845, y0: 395, x1: 1010, y1: 520, base: 584, cut: 'foliage', fade: true },
    { x0: 1165, y0: 360, x1: 1330, y1: 480, base: 544, cut: 'foliage', fade: true },
  ],

  hotspots: [
    { rect: R(700, 650, 900, 720), interact: 'agua', label: 'Beira da água', markerIf: () => objActive('praia') },
    { rect: R(585, 540, 715, 610), interact: 'coco', label: 'Água de coco', markerIf: () => objActive('praia') && !GameState.is('ar-coco') },
    { rect: R(440, 690, 525, 750), interact: 'castelo', label: 'Castelo de areia' },
    { rect: R(930, 610, 1080, 680), interact: 'guardasol', label: 'Guarda-sol' },
    { rect: R(1300, 580, 1460, 632), interact: 'barco', label: 'Barco' },
    { rect: R(150, 560, 220, 700), interact: 'quiosque', label: 'Quiosque' },
    { rect: R(215, 540, 280, 600), interact: 'predio', label: 'Prédio', markerIf: () => objDone('praia'), marker: { dir: 'left' } },
  ],

  spawns: {
    chegada: { tx: 7.9, ty: 13.1, facing: 'right' },
  },
  scripts,
  onEnter: 'chegada',
};
