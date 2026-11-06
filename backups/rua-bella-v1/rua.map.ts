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
  R(80, 765, 200, 860), // amarelas (esquerda)
  R(80, 860, 200, 915), // lilases (esquerda)
  R(600, 865, 750, 950), // vermelhas (centro-esquerda)
  R(1410, 770, 1530, 860), // vermelhas (direita)
  R(1430, 870, 1530, 935), // lilases (direita)
  R(885, 882, 1005, 950), // lilases (centro-direita, perto do meio-fio)
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
    // Saindo de casa com o Weng: ele aparece AO LADO da Bella (atrás dela fica o portão)
    if (ctx.flag('weng-segue') && Math.abs(ctx.playerTile().x - 6.2) < 1.5 && ctx.playerTile().y < 8.5) {
      const t = ctx.playerTile();
      ctx.place('weng', t.x + 1.5, t.y, 'down');
    }
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
    const here = ctx.playerTile();
    const sx = Math.min(here.x, 24.5);
    const stop = 26.7;
    const step = (stop - sx) / 3;
    // vindo pela rua: primeiro sobe para a calçada, na frente dele
    if (Math.abs(here.y - 8.0) > 0.3) await ctx.move('player', sx, 8.0, 40);
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
    // os dois esperam juntos na beira da calçada, depois do carro vermelho estacionado
    ctx.follow('weng', false);
    const px = 13.2;
    await Promise.all([ctx.move('player', px, 8.6, 45), ctx.move('weng', px + 1.6, 8.6, 45)]);
    ctx.face('player', 'right');
    ctx.face('weng', 'left');
    await ctx.say('weng', 'Pronto, pedi. O app diz que o Uber chega em três minutos.');
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
    // o carro aparece no fim da rua (faixa de baixo), vem devagar na chuva e encosta na frente deles
    ctx.face('player', 'right');
    ctx.face('weng', 'right');
    await ctx.emote('weng', 'exclaim');
    await ctx.say('weng', 'Olha ele ali! O carro com o farol piscando.');
    const carX = px + 1.4;
    const lane = 12.6;
    ctx.prop('uber', 'uber-car', 38, lane, 0);
    await ctx.moveProp('uber', carX + 7, lane, 2600);
    await ctx.moveProp('uber', carX, lane, 1500);
    ctx.sfx('horn');
    ctx.face('player', 'down');
    ctx.face('weng', 'down');
    await ctx.say('weng', 'É o nosso! Placa confere. Primeiro as damas.');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'Que cavalheiro.');
    // entram no carro com a tela escurecendo (sem atravessar o carro)
    ctx.sfx('door');
    await ctx.fadeOut(450);
    ctx.umbrella('bella', 'off');
    ctx.umbrella('weng', 'off');
    ctx.visible('player', false);
    ctx.visible('weng', false);
    ctx.objective('pia-m2', 'uber');
    await ctx.wait(250);
    ctx.sfx('door');
    await ctx.fadeIn(450);
    await ctx.moveProp('uber', -8, lane, 2600);
    ctx.removeProp('uber');
    const r = await ctx.uberRide({ destino: ROTA });
    ctx.setFlag('uber-batidas', r.hits);
    ctx.visible('player', true);
    ctx.visible('weng', true);
    ctx.follow('weng', true);
    await ctx.teleport('piabeta-rota66-fora', 'from-uber');
  },

  async tiaJaque(ctx) {
    if (ctx.flag('weng-segue')) {
      await ctx.say('tia-jaque', 'Olha só quem tá de namoradinho! Prazer, eu sou a tia Jaque. Moro aqui no condomínio.');
      await ctx.say('weng', 'Prazer, tia Jaque!');
      await ctx.say('tia-jaque', 'Tia já! Gostei dele, Bella. Cuida bem dela, hein?');
      return;
    }
    await ctx.say('tia-jaque', 'Bella! Toda arrumada assim, vai aonde? ...Vai encontrar alguém, né? Eu sei, eu sei. Sua mãe me contou.');
    await ctx.say('bella', 'Tia! A minha mãe conta tudo pra todo mundo!');
  },

  async kelly(ctx) {
    if (ctx.flag('weng-segue')) {
      await ctx.say('kelly', 'Então você é o famoso Weng? Prazer, Kelly, prima dela.');
      await ctx.say('kelly', 'A Bella trocou de roupa umas cinco vezes por sua causa. Mas não conta que eu contei.');
      await ctx.say('bella', 'KELLY!');
      return;
    }
    await ctx.say('kelly', 'Ihh, a Bella tá nervosa! Respira, prima. Ele vai amar você.');
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
  async 'casa-vizinho'(ctx) {
    await ctx.say('bella', 'A casa do seu Jorge. Ele cuida dessas plantas como se fossem filhos.');
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
    await ctx.sit(555, 756, ctx.flag('weng-segue') ? [['weng', 'Um banquinho na pracinha, debaixo de chuva... a gente é meio doido, né?'], ['bella', 'Um pouquinho. Mas tá bom aqui.']] : [['bella', 'Um banquinho na sombra. Bom pra ficar pensando no que falar pra ele.']], { key: 'bench-rua', x: 555, y: 780, w: 144 });
  },
  async banco2(ctx) {
    await ctx.sit(1063, 756, ctx.flag('weng-segue') ? [['bella', 'Senta aqui um pouquinho comigo.'], ['weng', 'Com você eu sento até na chuva.']] : [['bella', 'Daqui dá pra ver a rua inteira.']], { key: 'bench-rua', x: 1063, y: 780, w: 147 });
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

  // Medido elemento por elemento sobre art-source/maps/piabeta-rua-v2.webp (1619x971)
  blocks: [
    // fundo: árvores, casas e muros/cercas (portão da Bella aberto em x 288–360)
    R(0, 0, 1619, 290),
    R(0, 290, 288, 372),
    R(360, 290, 900, 372),
    R(1010, 290, 1619, 372),
    // trilha: aberta até a placa, depois mato
    R(900, 0, 1010, 40),
    R(1010, 205, 1080, 335), // placa
    // bordas
    R(1612, 0, 1700, 1100),
    R(0, 950, 1700, 1100),
    // postes (base e a calçada logo ao sul da luminária)
    R(122, 610, 162, 640), // pé do poste esquerdo (só a base; a haste e a luminária não bloqueiam)
    R(1468, 610, 1508, 640), // pé do poste direito
    // carro (corpo)
    R(265, 470, 497, 533),
    // pracinha: cerca viva com a passagem do meio (x 770–848)
    R(0, 628, 770, 700),
    R(848, 628, 1619, 700),
    R(0, 628, 30, 971),
    R(1552, 628, 1619, 971),
    R(0, 918, 1619, 971),
    // bancos (assento e encosto), lixeira, troncos
    R(483, 688, 627, 776),
    R(990, 688, 1137, 776),
    R(927, 697, 973, 765),
    R(266, 815, 326, 892), // tronco esquerdo, até a raiz (a copa fica por cima, dá pra passar por baixo)
    R(1296, 815, 1352, 892), // tronco direito, até a raiz
    // canteiros: sólidos desde as flores do topo (ninguém fica dentro das hortênsias)
    R(76, 845, 205, 920),
    R(596, 860, 754, 952),
    R(880, 882, 1008, 950),
    R(1424, 862, 1538, 930),
    // canteiros
    ...FLOWER_BEDS,
  ],

  // Profundidade (o que passa NA FRENTE de quem está atrás)
  props: [
    { key: 'rua-carro-vermelho', tx: 250 / 48, ty: 536 / 48 - 1, scale: 0.5, block: false },
  ],

  overlays: [
    { x0: 128, y0: 372, x1: 212, y1: 468, base: 470, cut: 'lamp' }, // poste esquerdo (luminária)
    { x0: 122, y0: 468, x1: 162, y1: 640, base: 638, cut: 'lamp' }, // poste esquerdo (haste)
    { x0: 1418, y0: 372, x1: 1502, y1: 468, base: 470, cut: 'lamp' }, // poste direito (luminária)
    { x0: 1468, y0: 468, x1: 1508, y1: 640, base: 638, cut: 'lamp' }, // poste direito (haste)
    { x0: 478, y0: 722, x1: 632, y1: 780, base: 776, cut: 'furniture' }, // banco esq. (assento da frente e pés)
    { x0: 985, y0: 722, x1: 1142, y1: 780, base: 776, cut: 'furniture' }, // banco dir. (assento da frente e pés)
    // canteiros da beira da pracinha: as flores ficam na frente dos pés de quem pisa atrás delas
    // copas das árvores: na frente de quem passa atrás, translúcidas
    { x0: 165, y0: 556, x1: 455, y1: 800, base: 892, cut: 'foliage', fade: true },
    { x0: 1180, y0: 566, x1: 1500, y1: 800, base: 892, cut: 'foliage', fade: true },
  ],

  hotspots: [
    ...flowerHotspots,
    { rect: R(372, 285, 414, 382), interact: 'caixa', label: 'Caixa de correio' },
    { rect: R(700, 300, 760, 372), interact: 'portao-vizinha', label: 'Casa da Dona Cida' },
    { rect: R(1005, 200, 1085, 340), interact: 'placa-parque', label: 'Ler' },
    { rect: R(262, 410, 500, 535), interact: 'carro', label: 'Carro' },
    { rect: R(483, 650, 627, 776), interact: 'banco', label: 'Sentar' },
    { rect: R(990, 650, 1137, 776), interact: 'banco2', label: 'Sentar' },
    { rect: R(1325, 290, 1415, 372), interact: 'casa-vizinho', label: 'Portão' },
  ],

  npcs: [
    {
      id: 'weng',
      sprite: 'weng',
      tx: 28.6,
      ty: 8.0,
      facing: 'left',
      interact: 'weng',
      visibleIf: () => GameState.is('weng-segue') || esperandoNaEsquina(),
    },
    { id: 'tia-jaque', sprite: 'tia-jaque', tx: 11.4, ty: 8.4, facing: 'left', interact: 'tiaJaque', behavior: 'wander', wanderRadius: 1.0, wanderAxis: 'x' }, // na calçada, longe do poste e do carro
    { id: 'kelly', sprite: 'kelly', tx: 16.2, ty: 15.0, facing: 'down', interact: 'kelly', behavior: 'wander', wanderRadius: 1.2, wanderAxis: 'x' },
    { id: 'vizinha', sprite: 'vizinha', tx: 14.7, ty: 7.8, facing: 'down', interact: 'vizinha', behavior: 'wander', wanderRadius: 3, wanderAxis: 'x' },
  ],
  spawns: {
    'from-casa': { tx: 6.2, ty: 7.3, facing: 'down' },
  },
  exits: [
    { rect: R(292, 340, 356, 374), toMap: 'piabeta-casa-bella', toSpawn: 'from-rua', sfx: 'door' },
    {
      rect: R(905, 40, 1005, 70),
      toMap: 'piabeta-rua',
      toSpawn: 'from-casa',
      blockedIf: () => 'Uma trilha para o mato. Hoje o plano é outro!',
    },
  ],
  triggers: [
    {
      id: 'encontro',
      // faixa inteira (calçada + rua): chegando por cima, pela rua ou subindo da pracinha, dispara igual
      rect: R(1040, 372, 1200, 628),
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
