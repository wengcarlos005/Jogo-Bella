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
    // entrando pela porta de vidro: os dois aparecem atrás dela e caminham pra dentro
    // (o ponto de entrada já é atrás da porta: nada de teleporte, eles só andam pra dentro)
    const t = ctx.playerTile();
    if (t.y > 15.8 && t.x > 13 && t.x < 18.5) {
      ctx.follow('weng', false);
      ctx.sfx('door');
      // os dois andam juntos; só depois o Weng volta a seguir (senão o fim da caminhada dele desliga o seguir)
      await Promise.all([ctx.move('weng', 16.9, 14.6, 55), ctx.move('player', 15.2, 14.6, 55)]);
      ctx.follow('weng', true);
    }
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
    R(0, 0, 1536, 370),
    // parede da janela (inclinada): degrauzinhos seguindo o rodapé, até encostar no vidro
    R(0, 0, 135, 360),
    R(0, 360, 134, 380), R(0, 380, 130, 400), R(0, 400, 126, 420), R(0, 420, 122, 440),
    R(0, 440, 118, 460), R(0, 460, 114, 480), R(0, 480, 110, 500), R(0, 500, 106, 520),
    R(0, 520, 102, 540), R(0, 540, 98, 560), R(0, 560, 94, 580), R(0, 580, 90, 600),
    R(0, 600, 86, 620), R(0, 620, 82, 640), R(0, 640, 78, 660), R(0, 660, 74, 680),
    R(0, 680, 70, 700), R(0, 700, 66, 720), R(0, 720, 62, 740), R(0, 740, 58, 760),
    R(0, 760, 54, 780), R(0, 780, 50, 800), R(0, 800, 48, 820), R(0, 820, 48, 840),
    R(0, 840, 48, 860), R(0, 860, 48, 880), R(0, 880, 48, 900), R(0, 900, 48, 920),
    R(0, 920, 48, 1100),
    R(1475, 0, 1536, 520),
    R(1498, 520, 1536, 700),
    R(1512, 700, 1536, 900),
    R(1455, 900, 1536, 1100),
    R(0, 918, 630, 1100),
    R(905, 918, 1536, 1100),
    R(630, 950, 905, 1100), // soleira da porta: dá pra entrar no vão da porta, sair só lá no fundo
    // balcão + banquetas, bomba de gasolina, planta e jukebox
    R(515, 300, 1250, 425),
    R(595, 425, 1160, 452),
    R(412, 330, 498, 398),
    R(1252, 330, 1312, 414),
    R(1300, 330, 1442, 432),
    // mesinhas da janela (a de baixo é a "mesa para dois")
    // mesinhas da janela: só o chão debaixo dos pés (dá pra passar atrás delas e entre as duas)
    R(132, 438, 298, 474),
    R(100, 606, 282, 650),
    // cabines do meio e de baixo (com a divisória de vidro na frente)
    R(434, 490, 723, 668),
    R(876, 490, 1164, 668),
    R(108, 725, 408, 930),
    R(1140, 725, 1435, 930),
    R(45, 860, 540, 930),
    R(1000, 860, 1458, 930),
    // plantas
    R(350, 630, 406, 668),
    R(1190, 630, 1246, 670),
    R(25, 745, 95, 782),
    R(1455, 705, 1525, 745),
    R(1440, 755, 1505, 792),
    R(545, 940, 625, 990),
    R(910, 940, 990, 990),
  ],

  steam: [{ x: 880, y: 192 }, { x: 918, y: 190 }, { x: 958, y: 192 }],
  rainWindows: { glass: false, when: () => true, rects: [R(15, 170, 95, 560)] },

  // Objetos: x = centro, y = base (px da arte original), w = largura. Cada um com a sua profundidade.
  objects: [
    { key: 'r66-bomba', x: 455, y: 396, w: 94 },
    ...[629, 753, 876, 1000, 1127].map((x) => ({ key: 'r66-banqueta', x, y: 448, w: 66, shadow: 0.8 })),
    { key: 'r66-planta', x: 1283, y: 414, w: 76, shadow: 0.7 },
    { key: 'r66-jukebox', x: 1370, y: 432, w: 144 },
    { key: 'r66-mesinha', x: 212, y: 474, w: 182 },
    { key: 'r66-mesinha', x: 188, y: 650, w: 200 },
    { key: 'r66-cabine', x: 578, y: 668, w: 290 },
    { key: 'r66-cabine', x: 1020, y: 668, w: 290 },
    { key: 'r66-cabine', x: 258, y: 905, w: 295 },
    { key: 'r66-cabine', x: 1288, y: 905, w: 290 },
    { key: 'r66-planta', x: 378, y: 668, w: 88, base: 676, shadow: 0.7 },
    { key: 'r66-planta', x: 1218, y: 670, w: 88, base: 676, shadow: 0.7 }, // um pouco pro lado da cabine, folhas na frente
    { key: 'r66-planta', x: 60, y: 782, w: 88, shadow: 0.7 },
    { key: 'r66-planta', x: 1490, y: 745, w: 82, flip: true, shadow: 0.7 },
    { key: 'r66-planta', x: 1470, y: 792, w: 88, shadow: 0.7 },
    // vidro em cima da muretinha, na frente das cabines de baixo (a parte vermelha já é a parede do cenário)
    ...[155, 380, 1120, 1345].map((x) => ({ key: 'r66-vidro', x, y: 928, w: 228, shadow: false as const })),
    // floreiras em cima da muretinha e plantas dos lados da porta
    ...[213, 427, 1100, 1280].map((x) => ({ key: 'r66-floreira', x, y: 972, w: 134, shadow: false as const })),
    { key: 'r66-planta', x: 585, y: 988, w: 100, shadow: 0.7 },
    { key: 'r66-planta', x: 950, y: 988, w: 100, flip: true, shadow: 0.7 },
    // porta de vidro: sempre por cima de quem encosta nela, transparente
    { key: 'r66-porta', x: 768, y: 1002, w: 268, front: true, shadow: false },
  ],

  hotspots: [
    { rect: R(520, 250, 1250, 450), interact: 'balcao', label: 'Balcão', markerIf: () => objActive('pedido') || (objDone('pedido') && objActive('pedido-weng')) },
    { rect: R(80, 470, 300, 655), interact: 'mesa', label: 'Mesinha', markerIf: () => objActive('mesa') && objDone('pedido-weng') },
    { rect: R(1298, 230, 1442, 432), interact: 'jukebox', label: 'Jukebox' },
    { rect: R(410, 160, 500, 398), interact: 'bomba', label: 'Bomba antiga' },
    { rect: R(240, 20, 420, 210), interact: 'quadro', label: 'Neon' },
  ],

  // a atendente anda pelo salão (com as mesmas colisões dos outros personagens)
  npcs: [{ id: 'atendente', sprite: 'atendente', tx: 16.2, ty: 10.7, facing: 'down', interact: 'atendente', behavior: 'wander', wanderRadius: 4, wanderAxis: 'both' }],
  spawns: {
    'from-fora': { tx: 15.2, ty: 16.7, facing: 'up' }, // atrás da porta de vidro; a cena de entrada traz pra dentro
  },
  exits: [
    {
      rect: R(650, 915, 885, 950), // atravessar a porta até o fundo = sair (encostar não sai)
      toMap: 'piabeta-rota66-fora',
      toSpawn: 'from-rota66',
      sfx: 'door',
      blockedIf: () => (QuestSystem.isDone(Q) || !QuestSystem.isActive(Q) ? false : 'Ainda tem lanche pra comer!'),
    },
  ],
  scripts,
  onEnter: 'chegada',
};
