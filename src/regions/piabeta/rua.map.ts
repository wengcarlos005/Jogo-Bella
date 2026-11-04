import { T } from '@/world/tiles';
import type { MapDef, HotspotDef, TileRect } from '@/world/MapTypes';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL } from '@/data/personal';
import type { Script } from '@/core/script';

/**
 * Retângulo medido no cenário ORIGINAL (art-source/maps/piabeta-rua.png,
 * 1619x971). 48 px da imagem = 1 tile (16 px lógicos).
 */
const ROTA = PERSONAL.places.hamburgueria;

/** A Bella saiu de guarda-chuva e o Weng ainda espera na esquina. */
const esperandoNaEsquina = () =>
  QuestSystem.isActive('pia-m1') && QuestSystem.isObjectiveDone('pia-m1', 'guarda-chuva') && !QuestSystem.isObjectiveDone('pia-m1', 'esquina');
/** Chove do começo do encontro até o Uber chegar. */
const chovendo = () =>
  (QuestSystem.isActive('pia-m1') && QuestSystem.isObjectiveDone('pia-m1', 'guarda-chuva')) ||
  (QuestSystem.isActive('pia-m2') && !QuestSystem.isObjectiveDone('pia-m2', 'uber'));

const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({
  x: x0 / 48,
  y: y0 / 48,
  w: (x1 - x0) / 48,
  h: (y1 - y0) / 48,
});

/** Canteiros pintados da pracinha onde dá para colher uma flor (missão da Dona Cida). */
const FLOWER_BEDS: TileRect[] = [
  R(80, 770, 200, 915), // amarelas e lilases (esquerda)
  R(595, 862, 745, 950), // vermelhas (centro-esquerda)
  R(880, 885, 1010, 950), // lilases (centro)
  R(1410, 775, 1540, 880), // vermelhas (direita)
  R(1425, 860, 1545, 935), // lilases (direita, embaixo)
];

const flowerHotspots: HotspotDef[] = FLOWER_BEDS.map((rect, i) => ({
  rect,
  interact: `flor-${i}`,
  label: 'Colher flor',
  enabledIf: () => !GameState.is(`flor-${i}`),
  markerIf: () => QuestSystem.isActive('pia-s1') && !QuestSystem.isObjectiveDone('pia-s1', 'colher') && !GameState.is(`flor-${i}`),
}));

const flowerScripts: Record<string, Script> = Object.fromEntries(
  FLOWER_BEDS.map((_, i) => [
    `flor-${i}`,
    async (ctx) => {
      ctx.setFlag(`flor-${i}`);
      await ctx.give('flor-do-quintal');
      if (ctx.questActive('pia-s1') && ctx.count('flor-do-quintal') >= 3) ctx.objective('pia-s1', 'colher');
    },
  ]),
);

const scripts: Record<string, Script> = {
  ...flowerScripts,

  async entrar(ctx) {
    // Chuva do começo do encontro (até o Uber chegar), com guarda-chuvas
    if (chovendo()) {
      ctx.weather('rain');
      ctx.umbrella('bella', 'up');
      if (esperandoNaEsquina() || ctx.flag('weng-segue')) ctx.umbrella('weng', 'up');
    }
    if (esperandoNaEsquina() && !ctx.flag('saiu-na-chuva')) {
      ctx.setFlag('saiu-na-chuva');
      await ctx.wait(400);
      await ctx.say('bella', 'Que chuva! Ele disse que tava na esquina...');
      ctx.nerves(60, 'A Bella está nervosa!');
      await ctx.say('bella', '(Calma, Bella. É só ir até a esquina. Só isso. Normal. Super normal.)');
      ctx.toast('Siga pela calçada para a direita, até a esquina');
      return;
    }
    if (ctx.questActive('pia-m1') && ctx.objectiveDone('pia-m1', 'pai') && !ctx.objectiveDone('pia-m1', 'sair')) {
      ctx.objective('pia-m1', 'sair');
      await ctx.wait(400);
      await ctx.say('weng', `Ufa. Acho que o ${PERSONAL.bellaStepdad.name} gostou de mim. Acho.`);
      await ctx.say('bella', 'Ele disse "bom rapaz". Isso, vindo dele, é praticamente um abraço.');
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', `Então bora! Já pedi um Uber pra ${ROTA}. Vamos esperar ali na calçada.`);
    }
  },

  async encontro(ctx) {
    // Ela vê o Weng lá na esquina e vai chegando, passo a passo, cada vez mais nervosa.
    const sx = ctx.playerTile().x;
    const stop = 29.4;
    const step = (stop - sx) / 3;
    ctx.face('player', 'right');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', '(É ele. Ali na esquina. Com um guarda-chuva azul.)');
    await ctx.move('player', sx + step, 8.0, 32);
    ctx.nerves(75);
    await ctx.emote('bella', 'sweat');
    await ctx.say('bella', '(Ai. Ele é mais bonito pessoalmente.)');
    await ctx.move('player', sx + step * 2, 8.0, 28);
    ctx.nerves(90);
    await ctx.emote('bella', 'sweat');
    await ctx.say('bella', '(O que eu falo? "Oi"? "Olá"? Desde quando eu falo "olá"?!)');
    await ctx.move('player', stop, 8.0, 24);
    ctx.face('weng', 'bella');
    await ctx.emote('weng', 'exclaim');
    ctx.nerves(100, 'O coração da Bella disparou!');
    await ctx.say('weng', 'Ah! Oi! Ééé... oi. Boa tarde.');
    await ctx.emote('weng', 'sweat');
    const c = await ctx.choose('bella', '(Ele tá tão nervoso quanto eu...)', ['"Oi! Você chegou rápido!"', '"Achou fácil a rua?"', '"Oi... (sorrir sem graça)"']);
    if (c === 0) {
      await ctx.say('weng', 'Eu meio que saí antes... pra não atrasar. Fiquei uns minutos rodando o quarteirão.');
      await ctx.say('bella', 'Na chuva?');
      await ctx.say('weng', 'Talvez. Não conta pra ninguém.');
    } else if (c === 1) {
      await ctx.say('weng', 'Achei! Quer dizer, o GPS achou. Eu só obedeci. E a chuva ajudou a dar emoção.');
    } else {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', 'Eu vi um guarda-chuva rosa vindo bem devagarinho e pensei: "é ela".');
    }
    await ctx.say('weng', 'Ah! Quase esqueci. Isso aqui é pra você.');
    await ctx.give('rosa-rosa', 1, false, 'O Weng te deu');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'Uma rosa... rosa! Ela é linda.');
    await ctx.say('weng', 'Escolhi rosa porque combina com os seus óculos. E com você.');
    await ctx.say('weng', 'E... você tá muito bonita.');
    await ctx.say('bella', `Obrigada. (Respira, Bella. Respira.) Vem, vamos lá em casa. Minha mãe e o ${PERSONAL.bellaStepdad.name} querem te conhecer.`);
    await ctx.say('weng', 'Ah. Os pais. Claro. Tudo bem. Tranquilo. Super tranquilo.');
    ctx.objective('pia-m1', 'esquina');
    ctx.setFlag('weng-entrou');
    ctx.setFlag('weng-segue');
    ctx.follow('weng', true);
    ctx.toast(`Leve o ${PERSONAL.weng.name} até a sua casa`);
  },

  async uber(ctx) {
    ctx.face('weng', 'bella');
    await ctx.say('weng', 'O app diz que o Uber chega em três minutos.');
    await ctx.say('bella', 'Três minutos de Uber é tipo dez na vida real.');
    const c = await ctx.choose('weng', 'Então... a gente tem uns dez minutos.', ['"Você já foi na Rota 66?"', '"Tô com uma fome..."', 'Ficar em silêncio, sorrindo']);
    if (c === 0) {
      await ctx.say('weng', 'Já! O hambúrguer de lá é o melhor que eu conheço. Por isso escolhi. Quis acertar logo de primeira.');
      await ctx.emote('bella', 'heart');
    } else if (c === 1) {
      await ctx.say('weng', 'Que bom! Porque eu pretendo pedir batata extra e fingir que é pra dividir.');
    } else {
      await ctx.emote('weng', 'sweat');
      await ctx.say('weng', '...Você tá rindo de mim ou comigo?');
      await ctx.say('bella', 'Com você. Talvez um pouquinho de você.');
    }
    await ctx.wait(300);
    ctx.prop('uber', 'uber-car', 36, 11.4, 0);
    await ctx.moveProp('uber', 15.5, 11.4, 2400);
    ctx.sfx('horn');
    await ctx.emote('weng', 'exclaim');
    await ctx.say('weng', 'É o nosso! Placa confere. Primeiro as damas.');
    ctx.objective('pia-m2', 'uber');
    ctx.sfx('door');
    await ctx.fadeOut(600);
    await ctx.travel(`A caminho da ${ROTA}...`, '🚗', 2800);
    await ctx.teleport('piabeta-rota66-fora', 'from-uber');
  },

  async vizinha(ctx) {
    if (ctx.objectiveDone('pia-s1', 'entregar')) {
      await ctx.say('vizinha', 'Minhas florzinhas estão lindas no vaso! Obrigada, meu bem.');
      return;
    }
    if (ctx.questActive('pia-s1')) {
      if (ctx.count('flor-do-quintal') >= 3) {
        ctx.take('flor-do-quintal', 3);
        await ctx.say('vizinha', 'Ai, que coisa mais linda! Pra mim? Vou pôr no vaso agora mesmo.');
        if (ctx.flag('weng-segue')) await ctx.say('vizinha', 'E esse moço aí, hein? Tem cara de gente boa.');
        ctx.objective('pia-s1', 'entregar');
        ctx.toast('Missão secundária concluída!');
      } else {
        await ctx.say('vizinha', `Achou as flores? Faltam ${3 - ctx.count('flor-do-quintal')}. Tem um monte lá na pracinha.`);
      }
      return;
    }
    await ctx.say('vizinha', 'Boa tarde, Bella! Toda arrumada... vai sair, é?');
    if (ctx.flag('weng-segue')) {
      await ctx.emote('vizinha', 'heart');
      await ctx.say('vizinha', 'Ahhh, entendi tudo. Olha só!');
    }
    const c = await ctx.choose('vizinha', 'Ô, meu bem, se passar pela pracinha, me traz umas florzinhas? Eu não ando mais tão bem das pernas.', ['"Claro, Dona Cida!"', '"Agora não dá, desculpa!"']);
    if (c === 0) {
      ctx.startQuest('pia-s1');
      await ctx.say('vizinha', 'Deus te abençoe! Três tá bom.');
    } else {
      await ctx.say('vizinha', 'Tudo bem, filha. Vai lá, aproveita!');
    }
  },

  async weng(ctx) {
    if (ctx.questActive('pia-m1') && !ctx.objectiveDone('pia-m1', 'mae')) {
      await ctx.say('weng', 'Vamos? Tô doido pra conhecer sua mãe. Quer dizer... nervoso. Doido de nervoso.');
      return;
    }
    if (ctx.questActive('pia-m2') && !ctx.objectiveDone('pia-m2', 'uber')) {
      await ctx.say('weng', 'Vamos esperar o Uber ali na calçada, em frente da sua casa.');
      return;
    }
    if (ctx.questActive('pia-m2')) {
      await ctx.say('weng', `Daqui a pouco tem ${ROTA}!`);
      return;
    }
    const lines = [
      'Sua rua é bem tranquila. Gostei daqui.',
      'Aquela vizinha tá olhando pra gente desde que a gente saiu...',
      'Tô com fome. Nervoso dá fome, sabia?',
    ];
    await ctx.say('weng', lines[Math.floor(Math.random() * lines.length)]);
  },

  async 'portao-vizinha'(ctx) {
    await ctx.say('bella', 'A casa da Dona Cida. Sempre cheirando a bolo. Melhor não entrar sem ser convidada.');
  },
  async letreiro(ctx) {
    await ctx.say('bella', `A lanchonete do bairro. Boa, mas hoje o encontro é na ${ROTA}!`);
  },

  async 'placa-parque'(ctx) {
    await ctx.narrate('"Parque — siga a trilha." O parque (e a chuva) chegam na Fase 3.');
  },
  async caixa(ctx) {
    await ctx.say('bella', 'Só conta. Um dia vai ter carta boa aqui, eu sinto.');
  },
  async carro(ctx) {
    await ctx.say('bella', 'O carro do vizinho. Sempre estacionado exatamente aqui.');
  },
  async banco(ctx) {
    await ctx.say('bella', 'Um banquinho na sombra. Bom pra ficar conversando até tarde.');
  },
};

/** Prólogo — rua da Bella em Piabetá (exterior, cenário pintado). */
export const ruaMap: MapDef = {
  id: 'piabeta-rua',
  region: 'piabeta',
  name: 'Piabetá',
  music: 'piabeta',
  background: '#3f6a2e',
  art: 'native',
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 21 }, () => '.'.repeat(34)),

  blocks: [
    // Bordas do cenário (árvores do fundo, laterais, fim da imagem)
    R(0, 0, 930, 40),
    R(1010, 0, 1619, 40),
    R(1612, 0, 1700, 1100),
    R(0, 925, 1700, 1100),
    // Casa da Bella + cerca (portão em x 285–360)
    R(0, 0, 285, 372),
    R(360, 0, 525, 372),
    R(285, 0, 360, 292),
    // Casa da Dona Cida + cerca + arbustos até a trilha
    R(520, 0, 930, 372),
    // Trilha do parque: arbustos e placa à direita
    R(1010, 0, 1105, 372),
    // Hamburgueria e vasos
    R(1100, 0, 1619, 338),
    R(1112, 270, 1190, 362),
    R(1538, 270, 1612, 362),
    // Rua: carro e postes
    R(262, 432, 498, 532),
    R(118, 595, 166, 640),
    R(1462, 595, 1515, 640),
    // Pracinha: cerca viva (abertura do caminho em x 770–850)
    R(0, 625, 770, 705),
    R(850, 625, 1619, 705),
    R(0, 625, 70, 971),
    R(1548, 625, 1619, 971),
    // Bancos (inclusive atrás deles), lixeira, árvores (copa sólida)
    R(482, 690, 628, 775),
    R(992, 690, 1135, 775),
    R(268, 800, 335, 892), // tronco esquerdo
    R(1310, 800, 1385, 892), // tronco direito
    R(925, 728, 972, 762),
    R(268, 838, 322, 892),
    R(1318, 838, 1382, 892),
    // Canteiros floridos
    ...FLOWER_BEDS,
  ],

  // Profundidade: o que fica NA FRENTE de quem passa atrás
  overlays: [
    { x0: 252, y0: 400, x1: 505, y1: 542, base: 532, cut: 'furniture' }, // carro
    { x0: 140, y0: 535, x1: 470, y1: 800, base: 880, cut: 'foliage', fade: true }, // copa esquerda
    { x0: 1185, y0: 540, x1: 1465, y1: 800, base: 885, cut: 'foliage', fade: true }, // copa direita
  ],

  hotspots: [
    ...flowerHotspots,
    { rect: R(368, 280, 415, 385), interact: 'caixa', label: 'Caixa de correio' },
    { rect: R(698, 290, 752, 372), interact: 'portao-vizinha', label: 'Casa da Dona Cida' },
    { rect: R(1005, 210, 1078, 300), interact: 'placa-parque', label: 'Ler' },
    { rect: R(262, 410, 498, 532), interact: 'carro', label: 'Carro' },
    { rect: R(482, 685, 628, 775), interact: 'banco', label: 'Sentar' },
    { rect: R(992, 685, 1135, 775), interact: 'banco', label: 'Sentar' },
    { rect: R(1240, 40, 1480, 150), interact: 'letreiro', label: 'Ver' },
  ],

  npcs: [
    {
      id: 'weng',
      sprite: 'weng',
      tx: 32.3,
      ty: 8.0,
      facing: 'left',
      interact: 'weng',
      visibleIf: () => GameState.is('weng-segue') || esperandoNaEsquina(),
    },
    { id: 'vizinha', sprite: 'vizinha', tx: 14.7, ty: 7.8, facing: 'down', interact: 'vizinha', behavior: 'wander', wanderRadius: 3, wanderAxis: 'x' },
  ],
  spawns: {
    'from-casa': { tx: 6.2, ty: 7.3, facing: 'down' },
  },
  exits: [
    { rect: R(290, 292, 355, 322), toMap: 'piabeta-casa-bella', toSpawn: 'from-rua', sfx: 'door' },
    {
      rect: R(1300, 330, 1432, 350),
      toMap: 'piabeta-rua',
      toSpawn: 'from-casa',
      blockedIf: () => `A lanchonete do bairro. Hoje o lanche é na ${ROTA}!`,
    },
    {
      rect: R(930, 0, 1010, 30),
      toMap: 'piabeta-rua',
      toSpawn: 'from-casa',
      blockedIf: () => 'Uma trilha para o mato. Hoje o plano é outro!',
    },
  ],
  triggers: [
    {
      id: 'encontro',
      rect: R(1250, 372, 1612, 460),
      script: 'encontro',
      once: true,
      enabledIf: () => esperandoNaEsquina(),
    },
    {
      id: 'uber',
      rect: R(150, 392, 620, 458), // beira da calçada (meio-fio), inclusive na frente do carro
      script: 'uber',
      once: true,
      enabledIf: () => QuestSystem.isActive('pia-m2') && !QuestSystem.isObjectiveDone('pia-m2', 'uber'),
    },
  ],
  scripts,
  onEnter: 'entrar',
};
