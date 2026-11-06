import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL } from '@/data/personal';
import { CASA_BLOCKS, CASA_OVERLAYS } from './casaBella.map';

const Q = 'dq-e3';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-casa-pedido.jpg, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    if (objDone('quarto')) return;
    ctx.follow('weng', false);
    ctx.visible('weng', false);
    await ctx.wait(300);
    await ctx.say('bella', 'Mãe? Cheguei! Cadê todo mundo?');
    await ctx.say('bella', '...Tá tudo apagado. Peraí, deixa eu ligar a lanterna do celular.');
    ctx.sfx('blip');
    await ctx.say('bella', 'E que luzinha é essa vindo do meu quarto?');
    ctx.toast('Vá até o seu quarto');
  },

  async quarto(ctx) {
    if (objDone('quarto')) return;
    ctx.objective(Q, 'quarto');
    await ctx.move('player', 9.6, 8.2, 40);
    ctx.face('player', 'up');
    await ctx.narrate('Luzinhas por toda parede. Origamis de tsuru. Pétalas de rosa no chão.');
    await ctx.say('bella', 'O que... é isso?');
    await ctx.say('bella', 'Nossas fotos... uma cartinha na cama... chocolates...');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Peraí. A minha irmã não tava passando mal, né?');
    // ele estava escondido no guarda-roupa: a porta range, ele sai e para atrás dela
    ctx.sfx('door');
    ctx.shake(150);
    await ctx.emote('bella', 'exclaim');
    ctx.place('weng', 15.0, 7.1, 'down');
    ctx.visible('weng', true);
    await ctx.move('weng', 11.4, 8.2, 35);
    ctx.face('weng', 'left');
    ctx.face('player', 'weng');
    await ctx.say('bella', 'AAAH! Weng?! Você tava dentro do meu GUARDA-ROUPA?!');
    await ctx.say('weng', 'Tava. Sua mãe me escondeu aí faz uma hora. Tem um cabide me cutucando até agora.');
    await ctx.say('weng', 'Bella.');
    await ctx.fadeOut(500);
    await ctx.backdrop('cena-pedido');
    await ctx.fadeIn(700);
    await ctx.emote('bella', 'heart');
    await ctx.say('weng', 'Desculpa pelo susto. Sua mãe topou me ajudar. Sua irmã e sua avó tão ótimas.');
    await ctx.say('weng', 'É que eu precisava te falar uma coisa, e queria que fosse do jeito certo.');
    await ctx.say('weng', 'Eu não consigo mais me ver sem você. Em nenhum dia, em nenhum lugar.');
    await ctx.say('weng', 'O anel ainda não chegou... mas eu não aguentei esperar.');
    await ctx.say('weng', `${PERSONAL.bella.name}... você quer namorar comigo?`);
    await ctx.choose('bella', '(O coração quase saiu pela boca)', ['"ACEITO!"', '"Aceito, aceito, aceito!"', 'Pular no pescoço dele']);
    await ctx.say('weng', '...Você nem me deixou terminar a frase.');
    await ctx.say('bella', 'Eu sei. Desculpa. Aceito. Aceito MUITO.');
    await ctx.say('weng', 'Eu te amo.');
    await ctx.say('bella', 'Eu também te amo.');
    await ctx.narrate('Foi a primeira vez que eles disseram "te amo".');
    await ctx.fadeOut(600);
    await ctx.backdrop(null);
    ctx.objective(Q, 'pedido');
    ctx.visible('weng', true);
    await ctx.memory('mem-dq-05');
    // troca de capítulo: tela preta por trás (o mapa não aparece entre os cartões)
    await ctx.fadeOut(600);
    await ctx.chapterCard('Fim do Capítulo 1', 'Piabetá', 'Namorando!', 'Continuar');
    await ctx.chapterCard('Capítulo 2', 'Duque de Caxias', 'Nosso cantinho. A primeira vez no apê do Weng.', 'Começar');
    ctx.setFlag('weng-segue');
    await ctx.teleport('duque-apto', 'porta');
  },

  async pombo(ctx) {
    await ctx.say('bella', 'O Pombo dormindo no meio da sala... ele sabia de tudo, né?');
  },

  async cartinha(ctx) {
    await ctx.say('bella', 'Uma cartinha com coração no envelope. Com a letra dele.');
  },
  async chocolates(ctx) {
    await ctx.say('bella', 'Uma caixa de chocolates em formato de coração. Ele lembrou.');
  },
};

/** 3º encontro — a casa da Bella decorada para o pedido de namoro (noite). */
export const casaPedidoMap: MapDef = {
  id: 'piabeta-casa-pedido',
  region: 'piabeta',
  name: 'Casa da Bella',
  indoor: true,
  music: 'casa',
  background: '#2b1d1f',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  // mesma planta da casa do prólogo: mesmos bloqueios e a mesma profundidade
  blocks: CASA_BLOCKS,


  overlays: CASA_OVERLAYS,

  // tudo apagado até a Bella entrar no quarto: só a lanterna do celular e uma luzinha vazando do quarto
  blackout: {
    when: () => QuestSystem.isActive(Q) && !objDone('quarto'),
    radius: 30,
    glows: [
      { x: 212, y: 535, r: 105, alpha: 0.3 },
      { x: 745, y: 905, r: 90, alpha: 0.25 },
    ],
  },


  lighting: {
    darkness: 0.25,
    lights: [
      { x: 160, y: 300, r: 260, color: 0xffc070 },
      { x: 500, y: 90, r: 220, color: 0xffc070 },
      { x: 500, y: 200, r: 120, flicker: true },
      { x: 510, y: 610, r: 160 },
    ],
  },

  hotspots: [
    { rect: R(120, 300, 230, 380), interact: 'cartinha', label: 'Cartinha' },
    { rect: R(340, 340, 480, 430), interact: 'chocolates', label: 'Chocolates' },
  ],

  npcs: [{ id: 'pombo', sprite: 'pombo', tx: 21.5, ty: 17.0, facing: 'down', interact: 'pombo', pose: { key: 'pombo-poses', frame: 1 } }],

  spawns: {
    porta: { tx: 15.0, ty: 17.6, facing: 'up' },
  },
  triggers: [{ id: 'quarto', rect: R(155, 300, 840, 482), script: 'quarto', enabledIf: () => QuestSystem.isActive(Q) && !objDone('quarto') }],
  scripts,
  onEnter: 'chegada',
};
