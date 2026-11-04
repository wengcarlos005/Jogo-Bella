import { T } from '@/world/tiles';
import type { MapDef, PropPlacement } from '@/world/MapTypes';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL } from '@/data/personal';
import type { Script } from '@/core/script';

const FLOWERS: [number, number][] = [
  [4, 17],
  [12, 21],
  [27, 17],
  [34, 21],
  [8, 20],
];

const flowerProps: PropPlacement[] = FLOWERS.map(([tx, ty], i) => ({
  id: `flor-${i}`,
  key: 'prop-flower-pick',
  tx,
  ty,
  block: false,
  interact: `flor-${i}`,
  label: 'Colher',
  visibleIf: () => !GameState.is(`flor-${i}`),
}));

const flowerScripts: Record<string, Script> = Object.fromEntries(
  FLOWERS.map((_, i) => [
    `flor-${i}`,
    async (ctx) => {
      ctx.setFlag(`flor-${i}`);
      ctx.give('flor-do-quintal');
      ctx.refresh();
      if (ctx.questActive('pia-s1') && ctx.count('flor-do-quintal') >= 3) ctx.objective('pia-s1', 'colher');
    },
  ]),
);

const scripts: Record<string, Script> = {
  ...flowerScripts,

  async entrar(ctx) {
    if (ctx.questActive('pia-m1') && ctx.objectiveDone('pia-m1', 'pai') && !ctx.objectiveDone('pia-m1', 'sair')) {
      ctx.objective('pia-m1', 'sair');
      await ctx.wait(400);
      await ctx.say('weng', 'Ufa. Acho que seu pai gostou de mim. Acho.');
      await ctx.say('bella', 'Ele disse "bom rapaz". Isso, vindo dele, é praticamente um abraço.');
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', 'Então bora! A hamburgueria fica descendo a rua, à direita.');
    }
  },

  async 'chegou-hamburgueria'(ctx) {
    ctx.objective('pia-m2', 'caminho');
    await ctx.say('weng', 'Chegamos! Dizem que o hambúrguer daqui é o melhor de Piabetá.');
    await ctx.say('bella', 'Dizem quem?');
    await ctx.say('weng', 'Eu. Eu digo. Agora há pouco.');
    await ctx.narrate('A hamburgueria (com o minigame de montar pedidos) chega na Fase 3 do desenvolvimento.');
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
    if (ctx.questActive('pia-m2') && !ctx.objectiveDone('pia-m2', 'caminho')) {
      await ctx.say('weng', 'É logo ali, descendo a rua. A do letreiro vermelho!');
      return;
    }
    const lines = [
      'Sua rua é bem tranquila. Gostei daqui.',
      'Aquela vizinha tá olhando pra gente desde que a gente saiu...',
      'Tô com fome. Nervoso dá fome, sabia?',
    ];
    await ctx.say('weng', lines[Math.floor(Math.random() * lines.length)]);
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

/** Prólogo — rua da Bella em Piabetá (exterior). */
export const ruaMap: MapDef = {
  id: 'piabeta-rua',
  region: 'piabeta',
  name: 'Piabetá',
  music: 'piabeta',
  background: '#4f8a3a',
  legend: {
    g: T.GRASS,
    f: T.GRASS_FLOWERS,
    G: T.GRASS_DARK,
    d: T.DIRT,
    s: T.SIDEWALK,
    c: T.CURB,
    a: T.ASPHALT,
    l: T.ASPHALT_LINE,
    h: T.HEDGE,
    F: T.FENCE,
    R: T.ROOF,
    E: T.ROOF_EDGE,
    B: T.ROOF_BLUE,
    b: T.ROOF_BLUE_EDGE,
    H: T.HOUSE_WALL,
    J: T.HOUSE_WALL_2,
    W: T.WINDOW,
    D: T.DOOR,
    S: T.SHOP_WALL,
  },
  ground: [
    'GGGGGGGGGGGGGGGGGGGGGGGddGGGGGGGGGGGGGGG',
    'ggRRRRRRRRgggBBBBBBBgggddgggRRRRRRRRRRgg',
    'ggRRRRRRRRgggBBBBBBBgggddgggRRRRRRRRRRgg',
    'ggRRRRRRRRgggBBBBBBBgggddgggRRRRRRRRRRgg',
    'ggEEEEEEEEgggbbbbbbbgggddgggEEEEEEEEEEgg',
    'ggHWHHHHWHgggJWJJJWJgggddgggSWWSSSSWWSgg',
    'ggHHHDHHHHgggJJJDJJJgggddgggSWWSDDSWWSgg',
    'gggffdgffgggggggdggggggddggssssssssssssg',
    'gFFFFdFFFFFgFFFFdFFFFggddggssssssssssssg',
    'ssssssssssssssssssssssssssssssssssssssss',
    'cccccccccccccccccccccccccccccccccccccccc',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'laalaalaalaalaalaalaalaalaalaalaalaalaal',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'ssssssssssssssssssssssssssssssssssssssss',
    'ssssssssssssssssssssssssssssssssssssssss',
    'hgggfgggggggfgGggggddggggggggggggggggggh',
    'hggGGggggGggfggggggddggggfgfgfgggffggggh',
    'hggGgggggggggggggggddggggggfgggggggfgGgh',
    'hddddddddddddddddddddddddddddddddddddddh',
    'hggfgggggggggggfgfgddggffgfggggggggfgggh',
    'hgggggggggggggggGgfddggfggggfgggfggggggh',
    'hggggggggggggggggggddfgggggggggggggggggh',
    'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
  ],
  props: [
    // árvores do fundo
    { key: 'prop-tree', tx: 0, ty: 1 },
    { key: 'prop-tree', tx: 10, ty: 2 },
    { key: 'prop-tree', tx: 20, ty: 2 },
    { key: 'prop-tree', tx: 25, ty: 1 },
    { key: 'prop-tree', tx: 38, ty: 2 },
    // quintais
    { key: 'prop-mailbox', tx: 7, ty: 7, interact: 'caixa', label: 'Caixa de correio', block: [5, 14, 6, 8] },
    { key: 'prop-flowerpot', tx: 2, ty: 7 },
    { key: 'prop-bush', tx: 13, ty: 7 },
    { key: 'prop-flowerpot', tx: 19, ty: 7 },
    { key: 'prop-sign', tx: 22, ty: 8, interact: 'placa-parque', label: 'Ler', block: [5, 14, 6, 8] },
    // loja
    { key: 'prop-burger-sign', tx: 31, ty: 4, block: false },
    { key: 'prop-flowerpot', tx: 31, ty: 7 },
    { key: 'prop-flowerpot', tx: 34, ty: 7 },
    // calçada
    { key: 'prop-lamp-post', tx: 11, ty: 9, block: [5, 40, 6, 6] },
    { key: 'prop-lamp-post', tx: 26, ty: 9, block: [5, 40, 6, 6] },
    { key: 'prop-lamp-post', tx: 38, ty: 9, block: [5, 40, 6, 6] },
    { key: 'prop-car', tx: 15, ty: 13, interact: 'carro', label: 'Carro', block: [2, 14, 44, 14] },
    { key: 'prop-lamp-post', tx: 6, ty: 15, block: [5, 40, 6, 6] },
    { key: 'prop-lamp-post', tx: 30, ty: 15, block: [5, 40, 6, 6] },
    // pracinha
    { key: 'prop-tree', tx: 2, ty: 18 },
    { key: 'prop-tree', tx: 15, ty: 17 },
    { key: 'prop-tree', tx: 23, ty: 22 },
    { key: 'prop-tree', tx: 36, ty: 18 },
    { key: 'prop-bench', tx: 9, ty: 18, interact: 'banco', label: 'Sentar' },
    { key: 'prop-bench', tx: 28, ty: 18, interact: 'banco', label: 'Sentar' },
    { key: 'prop-bush', tx: 17, ty: 21 },
    { key: 'prop-bush', tx: 31, ty: 22 },
    ...flowerProps,
  ],
  npcs: [
    { id: 'vizinha', sprite: 'vizinha', tx: 14.5, ty: 7, facing: 'down', interact: 'vizinha', behavior: 'wander' },
  ],
  spawns: {
    'from-casa': { tx: 5, ty: 7, facing: 'down' },
  },
  exits: [
    { rect: { x: 5, y: 6, w: 1, h: 1 }, toMap: 'piabeta-casa-bella', toSpawn: 'from-rua', sfx: 'door' },
    {
      rect: { x: 32, y: 6, w: 2, h: 1 },
      toMap: 'piabeta-rua',
      toSpawn: 'from-casa',
      blockedIf: () => 'A hamburgueria abre na Fase 3! (Em construção)',
    },
    {
      rect: { x: 16, y: 6, w: 1, h: 1 },
      toMap: 'piabeta-rua',
      toSpawn: 'from-casa',
      blockedIf: () => 'A casa da Dona Cida. Melhor não entrar sem ser convidada.',
    },
    {
      rect: { x: 23, y: 0, w: 2, h: 1 },
      toMap: 'piabeta-rua',
      toSpawn: 'from-casa',
      blockedIf: () => (QuestSystem.isDone('pia-m2') ? false : `${PERSONAL.weng.name}: "O parque fica pra depois do lanche!"`),
    },
  ],
  triggers: [
    {
      id: 'hamburgueria',
      rect: { x: 29, y: 7, w: 8, h: 2 },
      script: 'chegou-hamburgueria',
      once: true,
      enabledIf: () => QuestSystem.isActive('pia-m2'),
    },
  ],
  scripts,
  onEnter: 'entrar',
};
