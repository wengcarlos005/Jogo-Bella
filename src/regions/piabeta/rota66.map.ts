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
const WENG_ORDER: IngredientId[] = ['pao-baixo', 'carne', 'queijo', 'picles', 'alface', 'molho', 'pao-cima'];

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
    await ctx.say('weng', `Pão, hambúrguer, queijo, picles, alface, molho e pão. Sem bacon. O de sempre.`);
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
    // Cena da mesa: câmera na mesinha; a ilustração só aparece na hora do presente.
    ctx.follow('weng', false);
    await ctx.fadeOut(300);
    // sentados frente a frente: mesa e cadeiras (recorte de profundidade) escondem as pernas
    ctx.place('player', 1.7, 11.81, 'right');
    ctx.place('weng', 5.13, 11.81, 'left');
    ctx.prop('lanche-bella', 'burger-full', 3.44, 11.35, 0, 0.08, 200_000);
    ctx.prop('lanche-weng', 'burger-full', 4.48, 11.35, 0, 0.08, 200_000);
    ctx.letterbox(true);
    await ctx.focus(3.56, 10.6, 1.6, 10);
    // arte dedicada da mesa: entra ainda com a tela escura, sem mostrar os bonecos em pé por cima das cadeiras
    const mesaArt = ctx.hasArt('cena-rota66-mesa');
    if (mesaArt) await ctx.backdrop('cena-rota66-mesa');
    await ctx.fadeIn(500);
    await ctx.narrate('Os lanches chegam. O cheiro é incrível. O nervosismo também.');
    await ctx.say('weng', 'E aí? Aprovado?');
    const c1 = await ctx.choose('bella', '(Primeira mordida...)', ['"Melhor hambúrguer da minha vida."', '"Hmm... preciso de mais uma mordida pra decidir."', 'Fazer um joinha de boca cheia']);
    if (c1 === 0) await ctx.say('weng', 'Eu sabia! Missão cumprida. Posso ir embora feliz.');
    else if (c1 === 1) await ctx.say('weng', 'Justo. Uma pesquisa séria exige várias mordidas.');
    else {
      await ctx.emote('weng', 'note');
      await ctx.say('weng', 'Vou considerar isso um cinco estrelas.');
    }
    // Presente da Bella: Vale Beijo, Vale Abraço e chocolates
    await ctx.say('bella', 'Ah! Eu também trouxe uma coisa pra você.');
    await ctx.emote('weng', 'question');
    await ctx.say('weng', 'Pra mim? Sério?');
    await ctx.say('bella', 'Sério. Agora fecha os olhos. E sem espiar!');
    await ctx.say('weng', 'Fechados. Juro.');
    await ctx.say('bella', 'Pode abrir!');
    // a Bella escolhe os presentes na barra de itens
    const ZOEIRA: Record<string, string> = {
      'colar-pingente': 'Seu colar da sorte? Não, esse é seu. Já me dá sorte só de olhar pra ele.',
      'oculos-rosa': 'Seus óculos? Mas aí você não vai conseguir ver meu rosto lindo.',
      celular: 'Seu celular? Eu ia amar ler suas conversas sobre mim... brincadeira. (Não é brincadeira.)',
      'rosa-rosa': 'A rosa que EU te dei? Devolvendo já no primeiro encontro? Meu coração não aguenta.',
      guardanapo: 'Um guardanapo... usado? Bella, eu sei que eu como feito criança, mas assim é demais.',
      'flor-do-quintal': 'Uma florzinha da pracinha! Linda... mas acho que essa é da Dona Cida.',
      'burger-rota66': 'Metade do seu hambúrguer? Isso sim é prova de amor. Mas não era isso, né?',
    };
    // se ela não pegou o presente no guarda-roupa, ele já estava na bolsa (a mãe colocou)
    if (!ctx.has('vale-beijo')) await ctx.give('vale-beijo', 1, true);
    if (!ctx.has('chocolates')) await ctx.give('chocolates', 1, true);
    const dados = new Set<string>();
    let erros = 0;
    while (dados.size < 2) {
      const id = await ctx.pickItem(dados.size === 0 ? 'Escolha o presente do Weng na barra de itens' : 'Tem mais! Escolha o outro presente');
      if ((id === 'vale-beijo' || id === 'chocolates') && !dados.has(id)) {
        dados.add(id);
        ctx.take(id);
        ctx.sfx('pickup');
        ctx.hearts('weng', 5);
        if (dados.size === 1) await ctx.say('weng', id === 'vale-beijo' ? 'Isso é... um Vale Beijo? E um Vale Abraço?! Tem mais coisa aí?' : 'CHOCOLATE! E ainda tem mais? Você tá me mimando.');
        continue;
      }
      erros++;
      await ctx.emote('weng', 'question');
      await ctx.say('weng', ZOEIRA[id] ?? (erros > 2 ? 'Bella, eu te amo, mas acho que você se perdeu na bolsa.' : 'Hmm... é isso mesmo o presente?'));
    }
    await ctx.fadeOut(400);
    await ctx.backdrop('memory-pia-02');
    void mesaArt;
    await ctx.fadeIn(600);
    await ctx.say('weng', '...Chocolates! Um monte de chocolates! E isso aqui é... um Vale Beijo? E um Vale Abraço?!');
    await ctx.emote('weng', 'heart');
    const cg = await ctx.choose('bella', '(Ele tá olhando os vales sem piscar...)', ['"Válidos por tempo indeterminado."', '"Os chocolates são pra dividir, tá?"', '"Gostou? Fui eu que fiz."']);
    if (cg === 0) await ctx.say('weng', 'Tempo indeterminado... Vou guardar isso com a minha vida.');
    else if (cg === 1) await ctx.say('weng', 'Dividir... Tá. Mas o de morango é meu.');
    else await ctx.say('weng', 'Você que fez?! Agora é que eu não perco isso nunca mais.');
    await ctx.hearts('weng', 10);
    ctx.setFlag('vale-beijo-entregue');
    ctx.nerves(70);
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
    await ctx.say('weng', 'Ei... quer dar uma volta depois? A gente pode ir andando por Fragoso até o parque.');
    await ctx.say('bella', 'Quero. Acho que uma caminhada vai me fazer bem.');
    await ctx.give('burger-rota66', 1, false, 'Você guardou de lembrança');
    // sai da ilustração com a tela escura: ninguém aparece "sentado" em cima das cadeiras
    await ctx.fadeOut(500);
    await ctx.backdrop(null);
    ctx.removeProp('lanche-bella');
    ctx.removeProp('lanche-weng');
    await ctx.unfocus(10);
    ctx.letterbox(false);
    ctx.place('player', 3.7, 13.4, 'down');
    ctx.place('weng', 5.8, 13.4, 'down');
    ctx.visible('player', true);
    ctx.visible('weng', true);
    ctx.follow('weng', true);
    await ctx.fadeIn(500);
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

  // v2: cenário vazio (art-source/maps/piabeta-rota66-base.png) + objetos da folha (objects/r66-*).
  // Versão anterior (cenário pintado inteiro com recortes) em backups/rota66-v1/.
  blocks: [
    // paredes: fundo, janela à esquerda (inclinada), parede da direita, muretinha de baixo
    R(0, 0, 1536, 365),
    R(0, 0, 118, 500),
    R(0, 500, 90, 620),
    R(0, 620, 60, 720),
    R(0, 720, 40, 830),
    R(0, 830, 85, 1100),
    R(1472, 0, 1536, 520),
    R(1495, 520, 1536, 680),
    R(1515, 680, 1536, 830),
    R(1455, 830, 1536, 1100),
    R(0, 918, 645, 1100),
    R(885, 918, 1536, 1100),
    R(640, 790, 895, 1100), // porta de vidro (ninguém fica em cima dela)
    // balcão + banquetas, bomba de gasolina, planta e jukebox
    R(500, 300, 1250, 425),
    R(595, 425, 1160, 452),
    R(410, 330, 500, 398),
    R(1245, 330, 1310, 412),
    R(1300, 330, 1442, 432),
    // mesinhas da janela (a de baixo é a "mesa para dois")
    R(115, 380, 305, 475),
    R(80, 520, 285, 648),
    // cabines do meio e de baixo (com a divisória de vidro na frente)
    R(430, 490, 724, 668),
    R(873, 490, 1167, 668),
    R(108, 725, 408, 925),
    R(1138, 725, 1438, 925),
    // plantas
    R(355, 625, 412, 664),
    R(1157, 625, 1214, 666),
    R(25, 745, 95, 782),
    R(1445, 725, 1515, 762),
    R(540, 885, 600, 922),
    R(920, 885, 980, 922),
  ],

  steam: [{ x: 880, y: 192 }, { x: 918, y: 190 }, { x: 958, y: 192 }],
  rainWindows: { glass: false, when: () => true, rects: [R(15, 170, 95, 560)] },

  // Objetos: x = centro, y = base (px da arte original), w = largura. Cada um com a sua profundidade.
  objects: [
    { key: 'r66-bomba', x: 455, y: 396, w: 92 },
    ...[629, 753, 876, 1000, 1127].map((x) => ({ key: 'r66-banqueta', x, y: 450, w: 62 })),
    { key: 'r66-planta', x: 1278, y: 412, w: 74, fade: true },
    { key: 'r66-jukebox', x: 1370, y: 432, w: 140 },
    { key: 'r66-mesinha', x: 210, y: 474, w: 190 },
    { key: 'r66-mesinha', x: 182, y: 648, w: 205 },
    { key: 'r66-cabine', x: 577, y: 668, w: 295 },
    { key: 'r66-cabine', x: 1020, y: 668, w: 295 },
    { key: 'r66-cabine', x: 258, y: 905, w: 300 },
    { key: 'r66-cabine', x: 1288, y: 905, w: 300 },
    { key: 'r66-divisoria', x: 258, y: 926, w: 330 },
    { key: 'r66-divisoria', x: 1288, y: 926, w: 330 },
    { key: 'r66-planta', x: 383, y: 664, w: 80, fade: true },
    { key: 'r66-planta', x: 1185, y: 666, w: 80, fade: true },
    { key: 'r66-planta', x: 60, y: 782, w: 80, fade: true },
    { key: 'r66-planta', x: 1480, y: 762, w: 80, fade: true, flip: true },
    { key: 'r66-planta', x: 570, y: 922, w: 85, fade: true },
    { key: 'r66-planta', x: 950, y: 922, w: 85, fade: true, flip: true },
    ...[220, 450, 1090, 1320].map((x) => ({ key: 'r66-floreira', x, y: 1022, w: 130 })),
    // porta de vidro: sempre por cima de quem encosta nela, transparente
    { key: 'r66-porta', x: 765, y: 1000, w: 245, front: true },
  ],

  hotspots: [
    { rect: R(520, 250, 1250, 450), interact: 'balcao', label: 'Balcão', markerIf: () => objActive('pedido') || (objDone('pedido') && objActive('pedido-weng')) },
    { rect: R(80, 470, 300, 655), interact: 'mesa', label: 'Mesinha', markerIf: () => objActive('mesa') && objDone('pedido-weng') },
    { rect: R(1298, 230, 1442, 432), interact: 'jukebox', label: 'Jukebox' },
    { rect: R(410, 160, 500, 398), interact: 'bomba', label: 'Bomba antiga' },
    { rect: R(240, 20, 420, 210), interact: 'quadro', label: 'Neon' },
  ],

  // a atendente não fica parada: vai limpando o balcão, parando entre os banquinhos
  npcs: [{ id: 'atendente', sprite: 'atendente', tx: 14.4, ty: 9.8, facing: 'up', interact: 'atendente', behavior: 'chore', chore: { xs: [14.4, 17.0, 19.6, 22.2], y: 9.8, wy: 8.7 } }],
  spawns: {
    'from-fora': { tx: 15.5, ty: 14.6, facing: 'up' },
  },
  exits: [
    {
      rect: R(645, 772, 890, 790), // encostar na porta de vidro = sair
      toMap: 'piabeta-rota66-fora',
      toSpawn: 'from-rota66',
      sfx: 'door',
      blockedIf: () => (QuestSystem.isDone(Q) || !QuestSystem.isActive(Q) ? false : 'Ainda tem lanche pra comer!'),
    },
  ],
  scripts,
  onEnter: 'chegada',
};
