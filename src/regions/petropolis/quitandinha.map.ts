import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'pt-q1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
const passeiosFeitos = () => ['foto', 'pedalinho', 'algodao'].every((o) => objDone(o));
/** Retângulo no cenário ORIGINAL (art-source/maps/pt-quitandinha.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('qd-chegou')) return;
    ctx.setFlag('qd-chegou');
    if (!ctx.questActive(Q) && !QuestSystem.isDone(Q)) ctx.startQuest(Q);
    await ctx.narrate('Petrópolis. A viagem de aniversário da Bella começa aqui.');
    await ctx.narrate('O Palácio Quitandinha. E, na frente dele, um lago em formato de Brasil.');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Weng... isso é um CASTELO. A gente tá na frente de um castelo!');
    await ctx.say('weng', 'É um palácio. Mas pode chamar de castelo. Hoje você é a princesa.');
    await ctx.say('bella', 'E o lago... ele tem o formato do Brasil!');
    await ctx.say('weng', 'Trouxe toalha, cesta e tudo. Mas antes: bora passear?');
    ctx.toast('Passeie pelo Quitandinha: foto no palácio, pedalinho e o carrinho de doces');
  },

  async palacio(ctx) {
    if (objActive('foto')) {
      await ctx.say('bella', 'Foto na escadaria! Com o palácio inteiro atrás. Weng, pega o ângulo bom!');
      await ctx.say('weng', 'Mais pra esquerda... agora pra direita... perfeito. Ficou de revista.');
      ctx.sfx('confirm');
      await ctx.fadeOut(90, '#ffffff');
      await ctx.fadeIn(260);
      await ctx.say('bella', 'Agora uma juntinhos! Vem!');
      ctx.sfx('confirm');
      await ctx.fadeOut(90, '#ffffff');
      await ctx.fadeIn(260);
      ctx.objective(Q, 'foto');
      ctx.hearts('player', 5);
      return;
    }
    await ctx.say('weng', 'Dizem que esse palácio já foi o maior cassino da América do Sul.');
    await ctx.say('bella', 'Hoje ele é só o cenário mais bonito das nossas fotos.');
  },

  async pedalinho(ctx) {
    if (!objActive('pedalinho')) {
      await ctx.say('bella', 'O nosso cisninho. Ainda tô com as pernas doendo de pedalar.');
      return;
    }
    await ctx.say('bella', 'PEDALINHO DE CISNE! Weng, por favor, por favor, por favor.');
    await ctx.say('weng', 'Eu já paguei. Sobe.');
    await ctx.fadeOut(400);
    ctx.follow('weng', false);
    ctx.visible('player', false);
    ctx.visible('weng', false);
    ctx.prop('barco', 'qd-cisne', 26.0, 12.6, 0, 0.19);
    await ctx.fadeIn(400);
    await ctx.moveProp('barco', 19.0, 13.4, 2600);
    await ctx.say('bella', 'Pedala mais rápido! Aquele outro cisne tá passando a gente!');
    await ctx.say('weng', 'Eu tô pedalando por dois aqui! Você tá só olhando a paisagem!');
    await ctx.moveProp('barco', 13.0, 14.2, 2600);
    const c = await ctx.choose('bella', '(No meio do lago, os dois pararam de pedalar)', ['"A gente tá no meio do Brasil."', '"Se esse cisne afundar, você me salva?"', 'Encostar a cabeça no ombro dele']);
    if (c === 0) await ctx.say('weng', 'Mais ou menos em Goiás, eu acho. O lugar mais bonito do país.');
    else if (c === 1) await ctx.say('weng', 'Salvo. E depois salvo o cisne. Nessa ordem.');
    else {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', '...Pode ficar aqui o tempo que quiser.');
    }
    await ctx.moveProp('barco', 26.0, 12.6, 3200);
    await ctx.fadeOut(400);
    ctx.removeProp('barco');
    ctx.place('player', 24.6, 11.6, 'down');
    ctx.place('weng', 26.2, 11.6, 'down');
    ctx.visible('player', true);
    ctx.visible('weng', true);
    ctx.follow('weng', true);
    await ctx.fadeIn(400);
    ctx.objective(Q, 'pedalinho');
    await ctx.say('weng', 'Minhas pernas... nunca mais. (Mentira. Faço de novo se você pedir.)');
  },

  async carrinho(ctx) {
    if (!objActive('algodao')) {
      await ctx.say('bella', 'Pipoca e algodão-doce. O carrinho mais feliz do mundo.');
      return;
    }
    await ctx.say('pipoqueiro', 'Algodão-doce rosa, pipoca doce ou salgada! O que vai ser?');
    const c = await ctx.choose('bella', '(Escolher)', ['Algodão-doce rosa', 'Pipoca doce', 'Os dois (é aniversário)']);
    await ctx.say('pipoqueiro', c === 2 ? 'Os dois pra aniversariante! Esse eu faço caprichado.' : 'Saindo!');
    ctx.sfx('pickup');
    await ctx.say('weng', 'Me dá um pedaço?');
    await ctx.say('bella', c === 0 ? 'Um pedacinho. Bem pequeno.' : 'Pega. Mas só porque eu te amo.');
    ctx.hearts('player', 4);
    ctx.objective(Q, 'algodao');
  },

  async piquenique(ctx) {
    if (!passeiosFeitos()) {
      await ctx.say('weng', 'O piquenique fica pro final, com fome de verdade. Ainda falta passear!');
      return;
    }
    if (!objActive('piquenique')) {
      await ctx.say('bella', 'A nossa toalha xadrez. Sobrou uma uva aqui.');
      return;
    }
    await ctx.fadeOut(400);
    ctx.follow('weng', false);
    ctx.place('player', 8.0, 18.6, 'right');
    ctx.place('weng', 9.9, 18.6, 'left');
    await ctx.fadeIn(500);
    await ctx.narrate('Toalha xadrez na grama, de frente pro palácio. Sanduíche, frutas, suco, um bolinho... e balões.');
    await ctx.say('bella', 'Você montou tudo isso? Até o bolinho? E BALÕES?');
    await ctx.say('weng', 'O bolinho é de treino. O de verdade é amanhã.');
    await ctx.emote('bella', 'heart');
    await ctx.narrate('Deitados na toalha, olhando pro céu.');
    const ceu = ctx.hasArt('cena-pt-ceu');
    if (ceu) {
      await ctx.fadeOut(400);
      await ctx.backdrop('cena-pt-ceu');
      await ctx.fadeIn(500);
    }
    await ctx.say('bella', 'Aquela nuvem parece o quê?');
    const n1 = await ctx.choose('weng', '(Uma nuvem enorme passando...)', ['"Um gato gordo. A Meli, com certeza."', '"Um hambúrguer. Da Rota 66."', '"Um coração. Meio torto, mas é."']);
    await ctx.say('bella', n1 === 0 ? 'É a Meli! Olha o rabinho!' : n1 === 1 ? 'Você só pensa em comida.' : 'Torto igual o nosso primeiro beijo na chuva.');
    await ctx.say('weng', 'E aquela?');
    const n2 = await ctx.choose('bella', '(Outra nuvem...)', ['"Um cisne. O nosso pedalinho!"', '"Um dragão gigante."', '"Um bolo de aniversário."']);
    await ctx.say('weng', n2 === 2 ? 'Tá vendo? Até o céu sabe que é seu aniversário amanhã.' : 'Faz sentido. Hoje tudo parece mágico.');
    if (ceu) {
      await ctx.fadeOut(400);
      await ctx.backdrop(null);
      await ctx.fadeIn(400);
    }
    const c = await ctx.choose('bella', '(O sol começando a baixar atrás da serra)', ['"Obrigada por esse dia."', '"Eu queria parar o tempo aqui."', 'Dar um beijo nele']);
    if (c === 2) {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', '...Melhor piquenique da vida.');
    } else await ctx.say('weng', c === 0 ? 'E ainda nem acabou. Tem hotel lá no alto do morro esperando a gente.' : 'Dá pra voltar sempre. O palácio não sai daqui.');
    ctx.hearts('player', 10);
    ctx.objective(Q, 'piquenique');
    await ctx.fadeOut(800);
    await ctx.narrate('No fim da tarde, a subida até o hotel, lá no alto do morro.');
    if (!ctx.questActive('pt-m1') && !QuestSystem.isDone('pt-m1')) ctx.startQuest('pt-m1');
    ctx.objective('pt-m1', 'quitandinha');
    ctx.follow('weng', true);
    await ctx.teleport('pt-hotel-fora', 'portao');
  },

  async weng(ctx) {
    await ctx.say('weng', passeiosFeitos() ? 'Bora pro piquenique? A toalha tá ali, debaixo da árvore.' : 'Ainda tem o palácio, o pedalinho e o carrinho de doces!');
  },
  async saida(ctx) {
    await ctx.say('weng', objDone('piquenique') ? 'O hotel tá esperando.' : 'Ainda não! O dia aqui mal começou.');
    const t = ctx.playerTile();
    await ctx.move('player', t.x, t.y - 1, 60);
  },
};

/** Capítulo 3 — Petrópolis: o Palácio Quitandinha e o lago em formato de Brasil (piquenique). */
export const quitandinhaMap: MapDef = {
  id: 'pt-quitandinha',
  region: 'petropolis',
  name: 'Palácio Quitandinha',
  music: 'parque',
  background: '#3f6a2e',
  ambient: 'petals',
  art: 'native',
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    // palácio (a escadaria fica livre até a porta)
    R(0, 0, 620, 400),
    R(915, 0, 1536, 400),
    R(620, 0, 915, 345),
    R(0, 0, 25, 1024),
    R(1511, 0, 1536, 1024),
    R(0, 1010, 1536, 1024),
    // água do lago (medida pela cor, sem buracos); o píer e a calçada de pedra ficam livres
    R(552, 432, 624, 456),
    R(408, 456, 960, 480),
    R(264, 480, 1104, 504),
    R(192, 504, 1248, 528),
    R(144, 528, 1272, 552),
    R(168, 552, 1104, 576),
    R(264, 576, 1104, 600),
    R(384, 600, 1104, 648),
    R(480, 648, 1320, 672),
    R(528, 672, 1320, 696),
    R(528, 696, 1272, 720),
    R(528, 720, 1248, 744),
    R(600, 744, 1248, 768),
    R(600, 768, 1224, 792),
    R(600, 792, 1080, 816),
    R(600, 816, 912, 840),
    R(600, 840, 888, 864),
    R(600, 864, 864, 888),
    R(648, 888, 840, 912),
    R(720, 912, 792, 960),
    R(720, 960, 744, 984),
    // objetos: só a base
    R(47, 444, 93, 470),
    R(952, 979, 998, 1005),
    R(220, 832, 280, 860),
    R(1362, 982, 1418, 1010),
    R(316, 454, 344, 470),
    R(1216, 449, 1244, 465),
    R(146, 674, 174, 690),
    R(1386, 784, 1414, 800),
    R(1386, 674, 1494, 710),
    R(41, 734, 149, 770),
    R(157, 757, 183, 775),
    R(172, 404, 228, 430),
    R(1322, 404, 1378, 430),
    R(1443, 475, 1527, 505),
    R(522, 866, 558, 880), // cesta
    R(292, 888, 312, 900), // balões
    R(1468, 540, 1532, 560), // arbusto
    R(578, 974, 622, 990), // pedra
  ],

  objects: [
    { key: 'qd-araucaria', x: 70, y: 470, w: 190, fade: true, shadow: 0.5 },
    { key: 'qd-araucaria', x: 975, y: 1005, w: 190, fade: true, shadow: 0.5, flip: true },
    { key: 'qd-arvore', x: 250, y: 860, w: 300, fade: true, shadow: 0.5 },
    { key: 'qd-arvore', x: 1390, y: 1010, w: 280, fade: true, shadow: 0.5, flip: true },
    { key: 'qd-poste', x: 330, y: 470, w: 46, shadow: 0.4 },
    { key: 'qd-poste', x: 1230, y: 465, w: 46, shadow: 0.4 },
    { key: 'qd-poste', x: 160, y: 690, w: 46, shadow: 0.4 },
    { key: 'qd-poste', x: 1400, y: 800, w: 46, shadow: 0.4 },
    { key: 'qd-banco', x: 1440, y: 710, w: 120, shadow: 0.9 },
    { key: 'qd-banco', x: 95, y: 770, w: 120, shadow: 0.9 },
    { key: 'qd-lixeira', x: 170, y: 775, w: 32, shadow: 0.8 },
    { key: 'qd-vaso', x: 200, y: 430, w: 80, shadow: 0.6 },
    { key: 'qd-vaso', x: 1350, y: 430, w: 80, shadow: 0.6, flip: true },
    { key: 'qd-carrinho', x: 1485, y: 505, w: 105, shadow: 0.7 },
    { key: 'qd-cisne', x: 520, y: 575, w: 120, shadow: false },
    { key: 'qd-cisne', x: 900, y: 770, w: 130, shadow: false, flip: true },
    { key: 'pq-toalha', x: 430, y: 940, w: 235, flat: true, shadow: false },
    { key: 'pq-prato', x: 430, y: 935, w: 78, flat: true, shadow: false },
    { key: 'pq-cesta', x: 540, y: 880, w: 66, shadow: 0.6 },
    { key: 'pq-baloes', x: 302, y: 900, w: 62, shadow: 0.5 },
    { key: 'pq-arbusto', x: 1500, y: 560, w: 110, shadow: 0.5 },
    { key: 'pq-pedra', x: 600, y: 990, w: 80, shadow: 0.5 },
  ],

  hotspots: [
    { rect: R(640, 250, 900, 430), interact: 'palacio', label: 'Foto', markerIf: () => objActive('foto') },
    { rect: R(1100, 560, 1365, 650), interact: 'pedalinho', label: 'Pedalinho', markerIf: () => objActive('pedalinho') },
    { rect: R(1425, 400, 1536, 520), interact: 'carrinho', label: 'Doces', markerIf: () => objActive('algodao') },
    { rect: R(330, 880, 520, 960), interact: 'piquenique', label: 'Piquenique', markerIf: () => objActive('piquenique') && passeiosFeitos() },
  ],

  spawns: {
    entrada: { tx: 23.5, ty: 19.4, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(1000, 1000, 1500, 1010), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
