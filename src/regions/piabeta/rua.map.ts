import { T } from '@/world/tiles';
import type { MapDef, HotspotDef, TileRect } from '@/world/MapTypes';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL } from '@/data/personal';
import type { Script } from '@/core/script';

/**
 * Retângulo medido no cenário ORIGINAL (art-source/maps/piabeta-rua-v2.webp,
 * 1619x971; reescalado pelo R()). 48 px da imagem = 1 tile (16 px lógicos).
 */
const ROTA = PERSONAL.places.hamburgueria;

/** A Bella saiu de guarda-chuva e o Weng ainda espera na esquina. */
const esperandoNaEsquina = () =>
  QuestSystem.isActive('pia-m1') && QuestSystem.isObjectiveDone('pia-m1', 'guarda-chuva') && !QuestSystem.isObjectiveDone('pia-m1', 'esquina');
/** Chove do começo do encontro até o Uber chegar. */
const passeioAtivo = () =>
  QuestSystem.isActive('dq-e2') && QuestSystem.isObjectiveDone('dq-e2', 'filme') && !QuestSystem.isObjectiveDone('dq-e2', 'passeio');
const chovendo = () =>
  (QuestSystem.isActive('pia-m1') && QuestSystem.isObjectiveDone('pia-m1', 'guarda-chuva')) ||
  (QuestSystem.isActive('pia-m2') && !QuestSystem.isObjectiveDone('pia-m2', 'uber'));

// v2: o cenário novo (art-source/maps/piabeta-rua-base.webp, 1536x1024) é o mesmo desenho do antigo
// (1619x971) reescalado; as medidas antigas continuam valendo via SX/SY. Backup em backups/rua-bella-v1/.
const SX = 1536 / 1619;
const SY = 1024 / 971;
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({
  x: (x0 * SX) / 48,
  y: (y0 * SY) / 48,
  w: ((x1 - x0) * SX) / 48,
  h: ((y1 - y0) * SY) / 48,
});
/** Retângulo já nas medidas do cenário novo. */
const RN = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

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
    if (ctx.flag('weng-segue') && Math.abs(ctx.playerTile().x - 5.86) < 1.5 && ctx.playerTile().y < 9.02) {
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
    // 2º encontro: depois do filme, os dois saem de mãos dadas pela rua até a trilha de cima (→ Fragoso)
    if (passeioAtivo()) {
      ctx.weather('sunset');
      if (!ctx.flag('dq-rua-passeio')) {
        ctx.setFlag('dq-rua-passeio');
        await ctx.wait(300);
        await ctx.say('weng', 'Pra praça a gente vai a pé? Vinte e cinco minutos...');
        await ctx.say('bella', 'Pela trilha lá de cima. Sai direto em Fragoso. E é mais bonito.');
        await ctx.say('weng', 'Trilha, pôr do sol e você. Fechado.');
        ctx.toast('Suba pela trilha no alto da rua: ela leva a Fragoso');
      }
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
    const sx = Math.min(here.x, 23.22);
    const stop = 25.31;
    const step = (stop - sx) / 3;
    // vindo pela rua: primeiro sobe para a calçada, na frente dele
    if (Math.abs(here.y - 8.49) > 0.3) await ctx.move('player', sx, 8.49, 40);
    ctx.face('player', 'right');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', '(É ele. Ali na esquina. Com um guarda-chuva azul.)');
    await ctx.move('player', sx + step, 8.49, 32);
    ctx.nerves(75);
    await ctx.emote('bella', 'sweat');
    await ctx.say('bella', '(Ai. Ele é mais bonito pessoalmente.)');
    await ctx.move('player', sx + step * 2, 8.49, 28);
    ctx.nerves(90);
    await ctx.emote('bella', 'sweat');
    await ctx.say('bella', '(O que eu falo? "Oi"? "Olá"? Desde quando eu falo "olá"?!)');
    await ctx.move('player', stop, 8.49, 24);
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
    // os dois esperam juntos na beira da calçada, depois do carro vermelho estacionado.
    // a tia Jaque e a vizinha encostam no muro pra abrir caminho (ninguém atravessa ninguém)
    ctx.follow('weng', false);
    const abreCaminho = async (who: string, x: number) => {
      await ctx.move(who, x, 7.6, 70);
      ctx.face(who, 'down');
    };
    await Promise.all([abreCaminho('tia-jaque', 8.0), abreCaminho('vizinha', 17.0)]);
    const px = 12.5;
    await Promise.all([ctx.move('player', px, 9.12, 45), ctx.move('weng', px + 1.5, 9.12, 45)]);
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
    const carX = px + 1.33;
    const lane = 13.34;
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
    if (passeioAtivo()) {
      await ctx.say('bella', '"Fragoso e Praça — siga a trilha." É por aqui, Weng!');
      return;
    }
    await ctx.narrate('"Fragoso e Praça — siga a trilha."');
  },
  async caixa(ctx) {
    await ctx.say('bella', 'Só conta. Um dia vai ter carta boa aqui, eu sinto.');
  },
  async carro(ctx) {
    await ctx.say('bella', 'O carro do vizinho. Sempre estacionado exatamente aqui.');
  },
  async banco(ctx) {
    await ctx.sit(527, 797, ctx.flag('weng-segue') ? [['weng', 'Um banquinho na pracinha, debaixo de chuva... a gente é meio doido, né?'], ['bella', 'Um pouquinho. Mas tá bom aqui.']] : [['bella', 'Um banquinho na sombra. Bom pra ficar pensando no que falar pra ele.']], { key: 'bench-rua', x: 527, y: 823, w: 137 });
  },
  async banco2(ctx) {
    await ctx.sit(1008, 797, ctx.flag('weng-segue') ? [['bella', 'Senta aqui um pouquinho comigo.'], ['weng', 'Com você eu sento até na chuva.']] : [['bella', 'Daqui dá pra ver a rua inteira.']], { key: 'bench-rua', x: 1008, y: 823, w: 139 });
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
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

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
    // carro (corpo) — estacionado encostado no meio-fio
    R(265, 424, 497, 487),
    // pracinha: cerca viva com a passagem do meio (x 770–848)
    R(0, 628, 770, 700),
    R(848, 628, 1619, 700),
    R(0, 628, 30, 971),
    R(1552, 628, 1619, 971),
    R(0, 918, 1619, 971),
    // bancos (assento e encosto), lixeira, troncos
    // objetos soltos (medidas do cenário novo): pés dos postes, bancos, lixeira e troncos
    RN(122, 596, 150, 615), RN(1400, 596, 1428, 615),
    RN(462, 770, 592, 823), RN(943, 770, 1073, 823), RN(882, 792, 918, 815),
    RN(250, 870, 310, 935), RN(1250, 870, 1310, 935),
    // canteiros: sólidos desde as flores do topo (ninguém fica dentro das hortênsias)
    R(76, 845, 205, 920),
    R(596, 860, 754, 952),
    R(880, 882, 1008, 950),
    R(1424, 862, 1538, 930),
    // canteiros
    ...FLOWER_BEDS,
  ],

  // Objetos da folha (objects/rb-*): x = centro, y = base (px do cenário novo). Profundidade fixa na base.
  objects: [
    { key: 'rb-poste', x: 154, y: 615, w: 75, shadow: 0.4 },
    { key: 'rb-poste', x: 1396, y: 615, w: 75, shadow: 0.4, flip: true },
    { key: 'rb-carro', x: 362, y: 514, w: 228, shadow: 0.9 },
    { key: 'rb-arvore', x: 280, y: 935, w: 320, fade: true, shadow: 0.5 },
    { key: 'rb-arvore', x: 1280, y: 935, w: 320, fade: true, shadow: 0.5, flip: true },
    { key: 'rb-banco', x: 527, y: 823, w: 140, shadow: 0.9 },
    { key: 'rb-banco', x: 1008, y: 823, w: 140, shadow: 0.9 },
    { key: 'rb-lixeira', x: 900, y: 815, w: 42, shadow: 0.9 },
  ],

  hotspots: [
    ...flowerHotspots,
    { rect: R(372, 285, 414, 382), interact: 'caixa', label: 'Caixa de correio' },
    { rect: R(700, 300, 760, 372), interact: 'portao-vizinha', label: 'Casa da Dona Cida' },
    { rect: R(1005, 200, 1085, 340), interact: 'placa-parque', label: 'Ler' },
    // seta na trilha de cima durante o passeio do 2º encontro
    { rect: R(905, 40, 1005, 120), interact: 'placa-parque', label: 'Trilha → Fragoso', markerIf: () => passeioAtivo() },
    { rect: R(262, 364, 500, 489), interact: 'carro', label: 'Carro' },
    { rect: R(483, 650, 627, 776), interact: 'banco', label: 'Sentar' },
    { rect: R(990, 650, 1137, 776), interact: 'banco2', label: 'Sentar' },
    { rect: R(1325, 290, 1415, 372), interact: 'casa-vizinho', label: 'Portão' },
  ],

  npcs: [
    {
      id: 'weng',
      sprite: 'weng',
      tx: 27.11,
      ty: 8.49,
      facing: 'left',
      interact: 'weng',
      visibleIf: () => GameState.is('weng-segue') || esperandoNaEsquina(),
    },
    { id: 'tia-jaque', sprite: 'tia-jaque', tx: 10.79, ty: 8.91, facing: 'left', interact: 'tiaJaque', behavior: 'wander', wanderRadius: 1.0, wanderAxis: 'x' }, // na calçada, longe do poste e do carro
    { id: 'kelly', sprite: 'kelly', tx: 15.34, ty: 15.87, facing: 'down', interact: 'kelly', behavior: 'wander', wanderRadius: 1.2, wanderAxis: 'x' },
    { id: 'vizinha', sprite: 'vizinha', tx: 13.92, ty: 8.28, facing: 'down', interact: 'vizinha', behavior: 'wander', wanderRadius: 3, wanderAxis: 'x' },
  ],
  spawns: {
    'from-casa': { tx: 5.86, ty: 7.75, facing: 'down' },
  },
  exits: [
    { rect: R(292, 340, 356, 374), toMap: 'piabeta-casa-bella', toSpawn: 'from-rua', sfx: 'door' },
    {
      // trilha no alto da rua: no passeio do 2º encontro leva a Fragoso
      rect: R(905, 40, 1005, 70),
      toMap: 'piabeta-fragoso',
      toSpawn: 'from-rota66',
      blockedIf: () => (passeioAtivo() ? false : 'Uma trilha para o mato. Hoje o plano é outro!'),
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
