import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL } from '@/data/personal';
import type { IngredientId } from '@/ui/screens/BurgerGame';

const Q = 'pia-m2';
const ROTA = PERSONAL.places.hamburgueria;
const W = PERSONAL.weng.name;
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-rota66.png, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

/** Pedido "de sempre" do Weng (de baixo para cima). Troque pelo pedido real dele! */
const WENG_ORDER: IngredientId[] = ['pao-baixo', 'carne', 'queijo', 'bacon', 'alface', 'molho', 'pao-cima'];

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    if (ctx.flag('rota66-saudacao')) return;
    ctx.setFlag('rota66-saudacao');
    await ctx.wait(300);
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Tem jukebox! Bomba de gasolina! Piso xadrez! Parece filme.');
    await ctx.say('weng', 'Eu falei que era o melhor lugar. Vem, o balcão é ali no fundo.');
    ctx.face('atendente', 'down');
    await ctx.say('atendente', `Boa noite, casal! Bem-vindos à ${ROTA}. Hoje é noite do "monte o seu lanche"!`);
    await ctx.say('weng', 'Casal? Ah... é. Quer dizer... boa noite!');
    await ctx.emote('weng', 'sweat');
  },

  async atendente(ctx) {
    if (!ctx.objectiveDone(Q, 'pedido')) {
      await ctx.say('atendente', 'É só ir no balcão e montar do seu jeito. A chapa tá quentinha!');
    } else if (!ctx.objectiveDone(Q, 'pedido-weng')) {
      await ctx.say('atendente', 'E o lanche do moço? Ele tá com uma cara de fome...');
    } else {
      await ctx.say('atendente', 'Fiquem à vontade! A mesinha da janela é a mais bonita da casa.');
    }
  },

  async balcao(ctx) {
    if (!ctx.objectiveDone(Q, 'pedido')) {
      await ctx.say('atendente', 'Primeiro as damas! Monte o seu lanche.');
      const r = await ctx.burger({ mode: 'livre', title: 'O lanche da Bella' });
      ctx.setFlag('burger-bella', r.layers.join(','));
      await ctx.say('weng', 'Lindo. Agora eu tô com medo de pedir o meu e passar vergonha.');
      ctx.objective(Q, 'pedido');
      await ctx.say('bella', 'Então deixa que eu monto o seu! Fala o pedido.');
      await ctx.say('weng', 'Sério? Tá bom... mas eu só vou falar uma vez, hein!');
      return scripts.pedidoWeng(ctx);
    }
    if (!ctx.objectiveDone(Q, 'pedido-weng')) return scripts.pedidoWeng(ctx);
    await ctx.say('atendente', 'Os lanches já estão na mesa de vocês! Aquela da janela.');
  },

  async pedidoWeng(ctx) {
    await ctx.say('weng', `Pão, hambúrguer, queijo, bacon, alface, molho e pão. O de sempre.`);
    const r = await ctx.burger({ mode: 'memoria', title: `O lanche do ${W}`, order: WENG_ORDER, helper: W, showMs: 5000 });
    ctx.setFlag('burger-weng-estrelas', r.stars);
    if (r.stars === 3) {
      await ctx.say('weng', 'Perfeito! Você decorou meu pedido em cinco segundos. Tô impressionado.');
      await ctx.emote('weng', 'heart');
    } else {
      await ctx.say('weng', 'Ficou ótimo! E se errou alguma coisa, eu nem percebi. (Percebi. Mas tá ótimo.)');
    }
    ctx.objective(Q, 'pedido-weng');
    await ctx.say('atendente', 'Podem sentar que eu levo na mesa! A da janela tá livre.');
  },

  async mesa(ctx) {
    if (!ctx.objectiveDone(Q, 'pedido-weng')) {
      await ctx.say('bella', 'A mesinha da janela... primeiro vamos fazer o pedido no balcão.');
      return;
    }
    if (ctx.objectiveDone(Q, 'mesa')) {
      await ctx.say('bella', 'Nossa mesinha. Ainda tem migalha de batata aqui.');
      return;
    }
    await ctx.fadeOut(400);
    ctx.follow('weng', false);
    ctx.place('player', 1.9, 11.7, 'right');
    ctx.place('weng', 5.0, 11.7, 'left');
    await ctx.fadeIn(400);
    ctx.letterbox(true);
    await ctx.focus(3.5, 10.9, 1.35, 800);
    await ctx.narrate('Os lanches chegam. O cheiro é incrível. O nervosismo também.');
    await ctx.say('weng', 'E aí? Aprovado?');
    const c1 = await ctx.choose('bella', '(Primeira mordida...)', ['"Melhor hambúrguer da minha vida."', '"Hmm... preciso de mais uma mordida pra decidir."', 'Fazer um joinha de boca cheia']);
    if (c1 === 0) await ctx.say('weng', 'Eu sabia! Missão cumprida. Posso ir embora feliz.');
    else if (c1 === 1) await ctx.say('weng', 'Justo. Uma pesquisa séria exige várias mordidas.');
    else {
      await ctx.emote('weng', 'note');
      await ctx.say('weng', 'Vou considerar isso um cinco estrelas.');
    }
    await ctx.say('weng', 'Sabe... eu tava muito nervoso hoje. Rodei o quarteirão, ensaiei o que ia falar...');
    const c2 = await ctx.choose('bella', 'E eu...', ['"Eu também tava nervosa. Troquei de roupa umas três vezes."', '"Não deu pra perceber. Quer dizer... deu um pouquinho."', 'Pegar na mão dele por cima da mesa']);
    if (c2 === 0) {
      await ctx.say('weng', 'Sério? Então a gente tava nervoso junto. Isso deixa tudo melhor.');
    } else if (c2 === 1) {
      await ctx.say('weng', 'Um pouquinho, tipo... um tremor na voz quando falei com a sua mãe?');
      await ctx.say('bella', 'Tipo isso. Foi fofo.');
    } else {
      await ctx.emote('weng', 'exclaim');
      await ctx.hearts('weng', 8);
      await ctx.say('weng', '...Ok. Agora o nervoso passou. Quer dizer, mudou de tipo.');
    }
    await ctx.emote('bella', 'heart');
    await ctx.say('weng', 'Ei... tem um parque aqui do lado. Quer dar uma volta depois?');
    await ctx.say('bella', 'Quero.');
    ctx.give('burger-rota66');
    await ctx.unfocus(700);
    ctx.letterbox(false);
    await ctx.fadeOut(400);
    ctx.place('player', 3.7, 13.4, 'down');
    ctx.place('weng', 5.8, 13.4, 'down');
    ctx.follow('weng', true);
    await ctx.fadeIn(400);
    ctx.objective(Q, 'mesa');
  },

  async jukebox(ctx) {
    const c = await ctx.choose('bella', 'Uma jukebox de verdade! Colocar uma música?', ['Uma música animada', 'Uma música romântica', 'Deixar quieta']);
    if (c === 2) return;
    ctx.sfx('menu');
    await ctx.say('weng', c === 0 ? 'Boa! Se tocar a música certa eu danço. Talvez.' : 'Romântica, é? Anotado.');
  },
  async refri(ctx) {
    await ctx.say('bella', 'Máquina de refrigerante com refil. Isso é perigoso.');
  },
  async quadro(ctx) {
    await ctx.say('bella', `O escudo da ${ROTA} em neon. Dá vontade de pegar a estrada.`);
  },
  async bomba(ctx) {
    await ctx.say('weng', 'Uma bomba de gasolina antiga dentro da lanchonete. Isso é estilo.');
  },
  async weng(ctx) {
    if (!ctx.objectiveDone(Q, 'pedido')) await ctx.say('weng', 'Pode pedir o que quiser. Hoje é por minha conta!');
    else if (!ctx.objectiveDone(Q, 'mesa')) await ctx.say('weng', 'A mesinha da janela parece perfeita, né?');
    else await ctx.say('weng', 'Vamos pro parque? A saída é ali na porta.');
  },
};

/** Prólogo — interior da Rota 66 (cenário pintado). */
export const rota66Map: MapDef = {
  id: 'piabeta-rota66',
  region: 'piabeta',
  name: ROTA,
  indoor: true,
  music: 'rota66',
  background: '#2b1d1f',
  art: 'native',
  legend: { '.': T.KITCHEN },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    // paredes (janela à esquerda, parede da direita, fundo)
    R(0, 0, 90, 1024),
    R(1460, 0, 1536, 1024),
    R(0, 0, 1536, 300),
    R(90, 300, 410, 345),
    // bomba de gasolina decorativa
    R(408, 300, 502, 392),
    // balcão + banquetas
    R(515, 300, 1252, 420),
    R(592, 420, 1162, 447),
    // planta + jukebox
    R(1248, 300, 1305, 385),
    R(1298, 300, 1442, 428),
    // mesinhas da janela (a de baixo é a "mesa para dois")
    R(112, 380, 300, 470),
    R(88, 540, 292, 650),
    // plantas
    R(352, 598, 428, 662),
    R(1156, 598, 1230, 664),
    R(0, 700, 100, 760),
    R(1440, 640, 1536, 760),
    // cabines do meio
    R(430, 540, 722, 665),
    R(880, 540, 1160, 665),
    // cabines de baixo + divisórias de vidro
    R(85, 740, 410, 905),
    R(85, 840, 535, 905),
    R(1140, 740, 1460, 905),
    R(1005, 840, 1455, 905),
    // floreiras e plantas da frente
    R(0, 905, 645, 1100),
    R(890, 905, 1536, 1100),
    R(540, 880, 625, 975),
    R(905, 880, 995, 975),
  ],

  hotspots: [
    { rect: R(520, 250, 1250, 450), interact: 'balcao', label: 'Balcão', markerIf: () => objActive('pedido') || (objDone('pedido') && objActive('pedido-weng')) },
    { rect: R(88, 470, 300, 655), interact: 'mesa', label: 'Mesinha', markerIf: () => objActive('mesa') && objDone('pedido-weng') },
    { rect: R(1298, 230, 1442, 432), interact: 'jukebox', label: 'Jukebox' },
    { rect: R(408, 160, 502, 396), interact: 'bomba', label: 'Bomba antiga' },
    { rect: R(150, 60, 330, 330), interact: 'quadro', label: 'Neon' },
  ],

  npcs: [{ id: 'atendente', sprite: 'atendente', tx: 15.3, ty: 9.0, facing: 'down', interact: 'atendente' }],
  spawns: {
    'from-fora': { tx: 15.5, ty: 18.6, facing: 'up' },
  },
  exits: [
    {
      rect: R(645, 985, 890, 1024),
      toMap: 'piabeta-rota66-fora',
      toSpawn: 'from-rota66',
      sfx: 'door',
      blockedIf: () => (QuestSystem.isDone(Q) || !QuestSystem.isActive(Q) ? false : 'Ainda tem lanche pra comer!'),
    },
  ],
  scripts,
  onEnter: 'chegada',
};
