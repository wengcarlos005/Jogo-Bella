import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';

const Q = 'pt-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/pt-quarto.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('pq-chegou')) return;
    ctx.setFlag('pq-chegou');
    ctx.follow('weng', false);
    ctx.place('player', 15.2, 16.4, 'up');
    ctx.place('weng', 16.4, 16.6, 'up');
    await Promise.all([ctx.move('player', 15.2, 14.6, 50), ctx.move('weng', 17.0, 14.8, 50)]);
    await ctx.narrate('Quarto 12. Cheiro de madeira, lenha estalando e a serra inteira na janela.');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Weng... tem uma LAREIRA de verdade. Acesa. Esperando a gente.');
    await ctx.say('weng', 'E chocolate quente na mesinha. A moça da recepção trouxe enquanto a gente subia.');
    await ctx.say('bella', 'Eu vou morar aqui. Pode avisar minha mãe.');
    ctx.follow('weng', true);
    ctx.toast('Explore o quarto: as malas, a janela e a lareira');
  },

  async malas(ctx) {
    if (ctx.flag('pq-malas')) {
      await ctx.say('bella', 'As malas. A minha explodiu. A dele tá dobradinha. Somos opostos.');
      return;
    }
    ctx.setFlag('pq-malas');
    await ctx.say('bella', 'Bora desfazer as malas? Eu trouxe... quatro casacos, três pijamas e... nenhuma meia.');
    await ctx.say('weng', 'Eu sabia. Trouxe seis pares. Pode escolher.');
    await ctx.say('bella', 'Meia de lã? Você trouxe MEIA DE LÃ? Pra mim?');
    await ctx.say('weng', 'Eu conheço os seus pés gelados. Já sofri com eles.');
    const c = await ctx.choose('bella', '(Ele pensou até nas meias...)', ['"Você é o namorado mais preparado do mundo."', '"Agora meus pés vão gelar você com meia e tudo."', 'Calçar as meias na hora']);
    if (c === 0) await ctx.say('weng', 'Preparado não. Apaixonado. É diferente.');
    else if (c === 1) await ctx.say('weng', 'Eu aguento. Já me acostumei.');
    else {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', 'Ficou grande. Ficou perfeito.');
    }
  },

  async janela(ctx) {
    if (ctx.flag('pq-janela')) {
      await ctx.say('bella', 'A neblina descendo a serra devagarinho. Dá vontade de ficar olhando pra sempre.');
      return;
    }
    ctx.setFlag('pq-janela');
    await ctx.say('bella', 'Olha essa vista... a serra inteira, os pinheiros, a neblina subindo...');
    await ctx.say('weng', 'De manhã dizem que dá pra ver o sol nascendo atrás daquele morro.');
    await ctx.say('bella', 'Então amanhã a gente acorda cedo.');
    await ctx.say('weng', 'A gente vai acordar às dez e você sabe disso.');
    await ctx.say('bella', '...Às dez é cedo pra quem tá de férias.');
  },

  async lareira(ctx) {
    if (ctx.flag('pq-lareira')) {
      await ctx.say('bella', 'O fogo estalando. Melhor trilha sonora do mundo.');
      return;
    }
    ctx.setFlag('pq-lareira');
    await ctx.fadeOut(500);
    ctx.follow('weng', false);
    // sentadinhos no chão em frente à lareira (longe da poltrona e da mesinha)
    ctx.place('bella', 26.4, 14.0, 'right');
    ctx.place('weng', 28.0, 14.2, 'left');
    await ctx.frame(26.6, 13.4, 0);
    await ctx.fadeIn(500);
    await ctx.narrate('Chocolate quente, uma manta xadrez e o fogo estalando.');
    await ctx.say('bella', 'Minhas mãos tão congelando. Esquenta aqui.');
    await ctx.say('weng', '(segurando as mãos dela) Gelo. Você é feita de gelo.');
    await ctx.say('bella', 'E você é feito de lareira. Por isso a gente combina.');
    const c = await ctx.choose('weng', '(Olhando o fogo)', ['"Lembra da Rota 66? Você mal falava."', '"Um ano atrás eu nem imaginava isso aqui."', '"Obrigado por existir."']);
    if (c === 0) {
      await ctx.say('bella', 'Eu tava NERVOSA. Você trouxe uma rosa rosa. Quem faz isso?');
      await ctx.say('weng', 'Quem tá completamente apaixonado, ué.');
    } else if (c === 1) {
      await ctx.say('bella', 'Nem eu. Mas agora não consigo imaginar de outro jeito.');
    } else {
      await ctx.emote('bella', 'heart');
      await ctx.say('bella', '...Assim não vale. Agora eu vou chorar no chocolate.');
    }
    ctx.hearts('player', 6);
    await ctx.unfocus(500);
    ctx.follow('weng', true);
    ctx.toast('Quando quiser, é só deitar na cama');
  },

  async poltrona(ctx) {
    await ctx.say('weng', 'A poltrona perto da lareira. Território oficial de quem tá com frio. Ou seja: seu.');
  },
  async banheiro(ctx) {
    await ctx.say('bella', 'O banheiro tem aquecedor de toalha. AQUECEDOR. DE TOALHA.');
  },
  async guardaroupa(ctx) {
    await ctx.say('bella', 'Pendurei meu vestido aqui pra amanhã. Não pode amassar.');
  },

  async cama(ctx) {
    if (!objActive('noite')) {
      await ctx.say('bella', 'A cama de manta xadrez. A gente dormiu feito pedra.');
      return;
    }
    if (!ctx.flag('pq-lareira')) {
      await ctx.say('bella', 'Já? Antes eu quero ficar um pouquinho na lareira com você.');
      return;
    }
    await ctx.say('bella', 'Tô morrendo de sono. Uma série boba e dormir?');
    await ctx.say('weng', 'Uma série boba e dormir.');
    await ctx.fadeOut(800);
    await ctx.narrate('Uma série boba na TV, os pés gelados dela nas pernas dele, e conversa até tarde.');
    await ctx.narrate('Ela dormiu primeiro. Ele ficou acordado. De propósito.');
    await ctx.narrate('23:59.');
    ctx.follow('weng', false);
    ctx.place('player', 9.3, 15.6, 'right');
    ctx.place('weng', 10.9, 15.6, 'left');
    await ctx.frame(10.1, 14.6, 0);
    ctx.letterbox(true);
    await ctx.fadeIn(900);
    await ctx.say('weng', '(cochichando) Bella... Bella. Acorda. Só um minutinho.');
    await ctx.say('bella', 'Hm...? Que horas são...?');
    await ctx.say('weng', 'Meia-noite. Em ponto.');
    ctx.sfx('confirm');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('weng', 'Feliz aniversário, meu amor.');
    await ctx.say('bella', 'Você ficou acordado só pra isso?');
    await ctx.say('weng', 'Eu queria ser o primeiro. Antes da sua mãe, antes de todo mundo.');
    ctx.hearts('player', 12);
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', '...Melhor primeiro parabéns da minha vida. Agora dorme comigo.');
    ctx.letterbox(false);
    await ctx.fadeOut(1000);
    await ctx.narrate('Ele foi o primeiro. Antes de todo mundo.');
    ctx.objective(Q, 'noite');
    ctx.setFlag('pt-manha');
    ctx.follow('weng', true);
    await ctx.teleport('pt-hotel-fora', 'manha');
  },

  async saida(ctx) {
    await ctx.say('weng', objActive('noite') ? 'Sair agora? Tá um frio de doer lá fora. Fica aqui comigo.' : 'Bora!');
    const t = ctx.playerTile();
    await ctx.move('player', t.x, t.y - 1, 60);
  },
};

/** Capítulo 3 — o quarto 12 do hotel no alto do morro: lareira, as meias de lã e a meia-noite. */
export const quartoMap: MapDef = {
  id: 'pt-quarto',
  region: 'petropolis',
  name: 'Hotel · Quarto 12',
  indoor: true,
  music: 'casa',
  background: '#2a1610',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),
  charScale: 1.3,

  blocks: [
    R(0, 0, 1536, 478), // parede do fundo (janela, quadros e arandelas)
    R(0, 478, 150, 880), // parede da esquerda (porta do banheiro)
    R(1236, 478, 1536, 664), // lareira
    R(1470, 664, 1536, 880), // parede da direita
    R(0, 872, 692, 1024), // parede de baixo (a porta fica no meio)
    R(848, 872, 1536, 1024),
    R(692, 912, 848, 1024),
    // móveis: só a base
    R(232, 478, 548, 768), // cama (inclusive atrás da cabeceira)
    R(160, 478, 232, 565), // criados
    R(548, 478, 615, 565),
    R(1082, 482, 1218, 520), // guarda-roupa
    R(1028, 660, 1132, 712), // poltrona
    R(1160, 728, 1240, 762), // mesinha
    R(565, 818, 640, 850), // malas
    R(1385, 818, 1455, 855), // planta
  ],

  objects: [
    { key: 'hq-cama', x: 390, y: 770, w: 320, shadow: 0.7 },
    { key: 'hq-criado', x: 198, y: 568, w: 72, shadow: 0.6 },
    { key: 'hq-criado', x: 582, y: 568, w: 72, shadow: 0.6, flip: true },
    { key: 'hq-guardaroupa', x: 1150, y: 522, w: 125, shadow: 0.6 },
    { key: 'hq-poltrona', x: 1080, y: 714, w: 125, shadow: 0.7 },
    { key: 'hq-mesinha', x: 1200, y: 764, w: 92, shadow: 0.7 },
    { key: 'hq-malas', x: 602, y: 852, w: 92, shadow: 0.7 },
    { key: 'hq-planta', x: 1420, y: 858, w: 95, shadow: 0.6 },
  ],

  lighting: {
    darkness: 0.28,
    color: 0x2a1840,
    lights: [
      { x: 1370, y: 560, r: 320, flicker: true },
      { x: 445, y: 195, r: 170 },
      { x: 1090, y: 195, r: 170 },
      { x: 770, y: 300, r: 220 },
    ],
  },

  hotspots: [
    { rect: R(225, 470, 555, 780), interact: 'cama', label: 'Deitar', markerIf: () => objActive('noite') && GameState.is('pq-lareira') },
    { rect: R(1240, 300, 1480, 664), interact: 'lareira', label: 'Lareira', markerIf: () => objActive('noite') && !GameState.is('pq-lareira') },
    { rect: R(560, 260, 1000, 478), interact: 'janela', label: 'Janela' },
    { rect: R(550, 740, 650, 860), interact: 'malas', label: 'Malas' },
    { rect: R(1020, 600, 1140, 715), interact: 'poltrona', label: 'Poltrona' },
    { rect: R(150, 480, 200, 660), interact: 'banheiro', label: 'Banheiro' },
    { rect: R(1080, 330, 1220, 522), interact: 'guardaroupa', label: 'Guarda-roupa' },
  ],

  spawns: {
    porta: { tx: 15.5, ty: 15.8, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(700, 842, 840, 872), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
