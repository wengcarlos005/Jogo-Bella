import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL } from '@/data/personal';

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
    await ctx.say('bella', '...Tá tudo apagado. E que luzinha é essa vindo do meu quarto?');
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
    // ele aparece atrás dela
    ctx.place('weng', 4.6, 10.2, 'up');
    ctx.visible('weng', true);
    await ctx.move('weng', 7.6, 8.9, 30);
    ctx.face('weng', 'right');
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

  blocks: [
    R(0, 0, 40, 1024),
    R(1500, 0, 1536, 1024),
    R(40, 0, 840, 250), // parede do quarto
    R(55, 180, 262, 438), // cama (o pé da cama fica atrás de quem passa na frente)
    R(270, 180, 452, 335), // escrivaninha + cadeira
    R(455, 160, 545, 340), // penteadeira + banquinho
    R(545, 145, 615, 305), // espelho
    R(580, 210, 660, 330), // planta
    R(635, 100, 822, 318), // guarda-roupa
    R(840, 0, 876, 490), // divisória quarto/cozinha
    R(876, 0, 1500, 296), // cozinha: geladeira, fogão, bancada
    R(1040, 312, 1280, 475), // mesa + cadeiras
    R(1400, 240, 1500, 390), // planta
    R(40, 485, 155, 690), // parede à esquerda (passagem do quarto em x 155–270)
    R(270, 485, 908, 650), // parede da sala
    R(405, 600, 545, 720), // planta + mesinha com abajur
    R(550, 595, 915, 745), // sofá
    R(1030, 485, 1500, 680), // parede da direita (passagem da cozinha em x 908–1030)
    R(1060, 545, 1292, 755), // estante
    R(45, 640, 150, 735), // planta da sala
    R(220, 650, 320, 890), // TV
    R(1365, 665, 1490, 810), // planta da direita
    R(0, 915, 690, 1024), // parede de baixo (porta em x 690–800)
    R(800, 915, 1536, 1024),
  ],

  overlays: [
    { x0: 40, y0: 560, x1: 160, y1: 740, base: 735, cut: 'outline' },
    { x0: 1360, y0: 660, x1: 1495, y1: 815, base: 810, cut: 'outline' },
    { x0: 1040, y0: 300, x1: 1285, y1: 478, base: 475, cut: 'furniture', slice: true },
  ],

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
