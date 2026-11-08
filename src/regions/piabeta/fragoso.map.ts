import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';

const Q = 'pia-m3';

/**
 * Caminhada por Fragoso (fato real): entre a Rota 66 e o parque, a Bella,
 * nervosa desde o começo do encontro, finalmente se acalma.
 * Cada conversa no caminho baixa o medidor de nervosismo.

 */
const nerves = () => Number(GameState.getFlag<number>('nervosismo') ?? 0);
const lower = (ctx: ScriptContext, to: number) => ctx.nerves(Math.min(nerves(), to));

const CAT_SPOTS: [number, number][] = [
  [5.6, 7.9], [11.8, 8.2], [17.5, 8.0], [22.4, 8.3], [26.6, 11.2], [27.2, 13.6], [6.4, 14.5], [12.2, 14.5], [18.6, 14.5], [23.6, 14.4],
];
/** Onde cada gatinho aparece nesta visita (sorteado antes do mapa aparecer: sem "pulo" na tela). */
let catPos: [number, number][] = [CAT_SPOTS[0], CAT_SPOTS[3], CAT_SPOTS[6]];
const shuffleCats = () => {
  // um deles sempre na rua de cima, à vista quando a Bella fala "tem GATINHO na rua"
  const top = [CAT_SPOTS[1], CAT_SPOTS[2], CAT_SPOTS[3]];
  const first = top[Math.floor(Math.random() * top.length)];
  const rest = CAT_SPOTS.filter((s) => s !== first && s !== CAT_SPOTS[0]).sort(() => Math.random() - 0.5);
  catPos = [first, rest[0], rest[1]].sort(() => Math.random() - 0.5);
  if (!catPos.includes(first)) catPos[0] = first;
};
const catsDone = () => ['gato1', 'gato2', 'gato3'].filter((c) => GameState.is(`frg-${c}`)).length;

/** Minigame dos gatinhos: chegar perto (eles fogem!) e fazer carinho. */
async function petCat(ctx: ScriptContext, id: string, pose: string, lines: string[]): Promise<void> {
  ctx.pose(id, pose, 0);
  if (ctx.flag(`frg-${id}`)) {
    await ctx.say('bella', 'Esse já ganhou carinho. Olha ele ronronando ainda.');
    return;
  }
  ctx.setFlag(`frg-${id}`);
  ctx.face('player', id);
  ctx.pose(id, pose, 3);
  ctx.hearts(id, 8);
  ctx.sfx('pickup');
  await ctx.say('gatinho', 'Prrrrr... prrrrr...');
  for (const l of lines) {
    const m = l.match(/^(Weng|Bella): "(.*)"$/);
    if (m) await ctx.say(m[1] === 'Weng' ? 'weng' : 'bella', m[2]);
    else await ctx.say('bella', l);
  }
  ctx.pose(id, pose, 1);
  const n = catsDone();
  if (n >= 3) {
    ctx.objective(Q, 'gatos');
    await ctx.say('weng', 'Três gatos, três carinhos. Agora o parque?');
    await ctx.say('bella', 'Agora o parque. (Melhor caminhada da vida.)');
  } else ctx.toast(`Gatinhos: ${n}/3`);
}

const scripts: Record<string, Script> = {
  async entrar(ctx) {
    if (ctx.questActive('dq-e2')) {
      ctx.weather('sunset');
      if (!ctx.flag('dq-frg-chegou')) {
        ctx.setFlag('dq-frg-chegou');
        await ctx.narrate('Pela trilha, de mãos dadas, até Fragoso. O sol se pondo atrás das casas.');
        ctx.toast('Siga pela rua até a praça (saída de baixo, à esquerda)');
      }
    }
    if (ctx.flag('fragoso-intro') || !ctx.questActive(Q)) return;
    ctx.setFlag('fragoso-intro');
    if (nerves() === 0) ctx.nerves(70);
    await ctx.wait(300);
    await ctx.narrate('Fragoso, à noite. As ruas tranquilas, as luzes dos postes, e o barulhinho dos grilos.');
    await ctx.say('weng', 'O parque é pra lá. Vamos devagar? Não tem pressa nenhuma.');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Weng... olha. Tem GATINHO na rua. Tem mais de um!');
    await ctx.say('weng', 'Ai não. Agora a gente não chega no parque nunca.');
    await ctx.say('bella', 'Só um carinho em cada um. Prometo.');
    ctx.toast('Faça carinho nos 3 gatinhos (eles fogem se você chegar correndo!)');
  },

  async conversa1(ctx) {
    ctx.face('weng', 'bella');
    await ctx.say('weng', 'Ei... você ficou quietinha desde que a gente saiu. Tá tudo bem?');
    const c = await ctx.choose('bella', '(Dá pra disfarçar?)', ['"Confesso: tô nervosa desde que você chegou."', '"Tô bem! Só... digerindo o hambúrguer."', 'Respirar fundo antes de responder']);
    if (c === 0) {
      await ctx.say('weng', 'Sério? Então somos dois. Pelo menos a gente tá nervoso no mesmo lugar.');
    } else if (c === 1) {
      await ctx.say('weng', 'Justo. Aquele hambúrguer merece um minuto de silêncio.');
      await ctx.say('bella', '...Tá, e eu também tô um pouquinho nervosa.');
    } else {
      await ctx.say('bella', '...Tô nervosa. Mas é um nervoso bom, eu acho.');
      await ctx.say('weng', 'Nervoso bom é o melhor tipo de nervoso.');
    }
    lower(ctx, 50);
  },

  async conversa2(ctx) {
    await ctx.say('weng', 'Me fala uma coisa que você ama e que ninguém imagina.');
    const c = await ctx.choose('bella', 'Hmm...', ['Contar um gosto bem aleatório', 'Contar uma mania esquisita', 'Devolver a pergunta pra ele']);
    if (c === 0) await ctx.say('weng', 'Isso é muito específico. Eu amei. Anotado pra sempre.');
    else if (c === 1) await ctx.say('weng', 'Ok, agora eu preciso ver isso ao vivo um dia.');
    else {
      await ctx.say('weng', 'Eu? Hmm... eu amo andar de noite assim, sem rumo. Ainda mais hoje.');
      await ctx.emote('bella', 'heart');
    }
    await ctx.emote('bella', 'note');
    lower(ctx, 30);
  },

  async conversa3(ctx) {
    await ctx.say('weng', 'Sabia que eu passei a semana inteira pensando no que falar hoje?');
    await ctx.say('weng', 'E agora que a gente tá aqui, eu esqueci tudo. E tá tudo bem.');
    const c = await ctx.choose('bella', '(Ele tá sorrindo pro chão...)', ['"Tá melhor do que qualquer coisa ensaiada."', '"Ensaiou? Na frente do espelho?"', 'Dar um esbarrãozinho de ombro nele']);
    if (c === 0) await ctx.say('weng', 'Também acho. Ao vivo é bem melhor.');
    else if (c === 1) {
      await ctx.say('weng', 'Talvez. Não conta pra ninguém. É o segundo segredo da noite.');
      await ctx.say('bella', 'O primeiro foi rodar o quarteirão.');
    } else {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', 'Ei! ...Faz de novo.');
    }
    lower(ctx, 10);
  },

  async conversa4(ctx) {
    await ctx.narrate('Ele estendeu a mão. Bem devagar, como quem pergunta sem falar.');
    const c = await ctx.choose('bella', '(...)', ['Segurar a mão dele', 'Segurar e entrelaçar os dedos']);
    await ctx.hearts('bella', 10);
    if (c === 1) await ctx.say('weng', '...Assim é bem melhor.');
    await ctx.narrate('E, sem perceber, o nervosismo foi embora. Em Fragoso, caminhando ao lado dele, tudo ficou leve.');
    ctx.nerves(0);
    await ctx.say('bella', 'Sabe... eu tô bem. Tô muito bem, na verdade.');
    await ctx.say('weng', 'Eu também. O parque é logo ali.');
    ctx.objective(Q, 'fragoso');
    await ctx.memory('mem-pia-04');
  },

  async gatinho1(ctx) {
    await petCat(ctx, 'gato1', 'gatofrg1-poses', ['Um cinzinha rajado! Parece um tigrinho de pelúcia.', 'Weng: "Ele parou pra você. Ninguém resiste."']);
  },
  async gatinho2(ctx) {
    await petCat(ctx, 'gato2', 'gatofrg2-poses', ['Um frajolinha! De smoking e tudo.', 'Weng: "Você para pra fazer carinho em TODO gato?"', 'Bella: "Em todo."']);
  },
  async gatinho3(ctx) {
    await petCat(ctx, 'gato3', 'gatofrg3-poses', ['Um creminho! Parece um pãozinho de leite.', 'Weng: "Esse aí tá te olhando apaixonado. Concorrência."']);
  },

  async gato(ctx) {
    // domingo do churrasco: o mesmo gatinho, agora tomando sol no muro
    if (ctx.questActive('dq-e2')) {
      if (ctx.flag('gato-fragoso-dom')) {
        await ctx.say('weng', 'Ele nem abriu o olho. Tá no modo domingo.');
        return;
      }
      ctx.setFlag('gato-fragoso-dom');
      await ctx.emote('bella', 'exclaim');
      await ctx.say('bella', 'Weng! É o gatinho daquela noite! No mesmo muro!');
      await ctx.say('weng', 'Ele tava aqui no nosso primeiro encontro... e agora tá aqui no segundo.');
      await ctx.say('bella', 'Ele é tipo o padrinho da gente.');
      await ctx.say('weng', 'Padrinho que dorme o tempo todo. Tá contratado.');
      await ctx.emote('weng', 'heart');
      return;
    }
    if (ctx.flag('gato-fragoso')) {
      await ctx.say('bella', 'Ele continua aí, dormindo. Nem ligou pra gente.');
      return;
    }
    ctx.setFlag('gato-fragoso');
    await ctx.say('bella', 'Um gatinho dormindo em cima do muro!');
    await ctx.say('weng', 'Ele parece mais tranquilo que nós dois juntos.');
    await ctx.emote('bella', 'heart');
  },
  async varal(ctx) {
    await ctx.say('weng', 'Roupa no varal com essa chuva que deu mais cedo... alguém vai ficar triste amanhã.');
  },
  async poste(ctx) {
    await ctx.say('bella', 'A luz amarelinha do poste deixa tudo com cara de filme.');
  },
  async weng(ctx) {
    await ctx.say('weng', QuestSystem.isObjectiveDone(Q, 'fragoso') ? 'Vamos pro parque?' : 'Sem pressa. A gente vai andando.');
  },
};

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-fragoso-base.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

/** Fragoso à noite (cenário pintado): calçada de cima → curva à direita → rua de baixo. */
export const fragosoMap: MapDef = {
  id: 'piabeta-fragoso',
  region: 'piabeta',
  name: 'Fragoso',
  music: 'fragoso',
  background: '#1d1a2e',
  ambient: 'fireflies',
  art: 'native',
  legend: { '.': T.SIDEWALK },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),
  // v2: cenário vazio (art-source/maps/piabeta-fragoso-base.webp) + objetos da folha (objects/frg-*).
  // Versão anterior (cenário pintado inteiro com recortes) em backups/fragoso-v1/.
  blocks: [
    R(0, 0, 1536, 326), // casas e muros de cima
    R(1490, 326, 1536, 560), // árvores da direita
    R(1440, 560, 1536, 700),
    R(1410, 700, 1536, 1024),
    R(0, 395, 128, 515), // folhagem da esquerda (a calçada de cima fica livre)
    R(0, 515, 1200, 690), // terreno do meio + muro (a calçada de baixo fica livre)
    // casas de baixo: bloqueio na linha do beiral de cada telhado
    R(0, 782, 205, 1024),
    R(205, 810, 525, 1024),
    R(525, 795, 600, 1024),
    R(600, 776, 920, 1024),
    R(920, 768, 1185, 1024),
    R(1185, 815, 1410, 1024),
    // bases dos postes
    R(108, 333, 140, 355),
    R(721, 346, 753, 368),
    R(1165, 366, 1197, 388),
    R(206, 723, 238, 745),
    R(1190, 668, 1222, 690),
  ],

  // Objetos: x = centro, y = base (px da arte original). Profundidade fixa na base.
  objects: [
    { key: 'frg-poste', x: 154, y: 355, w: 100, shadow: 0.35 },
    { key: 'frg-poste', x: 767, y: 368, w: 100, shadow: 0.35 },
    { key: 'frg-poste', x: 1211, y: 388, w: 100, shadow: 0.35 },
    { key: 'frg-poste', x: 252, y: 745, w: 100, shadow: 0.35 },
    { key: 'frg-poste', x: 1236, y: 690, w: 100, shadow: 0.35 },
    { key: 'frg-arvore', x: 385, y: 600, w: 300, fade: true, shadow: 0.6 },
    { key: 'frg-bananeira', x: 690, y: 604, w: 200, fade: true, shadow: 0.5 },
    { key: 'frg-moitas', x: 930, y: 612, w: 220, fade: true, shadow: false },
    { key: 'frg-moita', x: 560, y: 610, w: 120, shadow: false },
    { key: 'frg-moita', x: 190, y: 612, w: 130, shadow: false, flip: true },
    { key: 'frg-flores', x: 1135, y: 620, w: 100, shadow: false },
    { key: 'frg-gato', x: 1050, y: 620, w: 78, shadow: false },
  ],

  lighting: {
    darkness: 0.4,
    when: () => !QuestSystem.isActive('dq-e2'),
    lights: [
      { x: 189, y: 156, r: 230 },
      { x: 802, y: 169, r: 230 },
      { x: 1246, y: 189, r: 230 },
      { x: 287, y: 546, r: 230 },
      { x: 1271, y: 491, r: 230 },
    ],
  },

  hotspots: [
    { rect: R(1005, 560, 1100, 640), interact: 'gato', label: 'Gato' },
    { rect: R(865, 230, 1010, 330), interact: 'varal', label: 'Varal' },
    { rect: R(100, 110, 165, 360), interact: 'poste', label: 'Poste' },
  ],
  npcs: [
    ...(['gato1', 'gato2', 'gato3'] as const).map((id, i) => ({
      id,
      sprite: (['gatofrg1', 'gatofrg2', 'gatofrg3'] as const)[i],
      get tx() {
        return catPos[i][0];
      },
      get ty() {
        return catPos[i][1];
      },
      facing: 'down' as const,
      interact: `gatinho${i + 1}`,
      behavior: 'flee' as const,
      visibleIf: () => QuestSystem.isActive(Q) && (!QuestSystem.isObjectiveDone(Q, 'gatos') || GameState.is(`frg-${id}`)),
      markerIf: () => QuestSystem.isActive(Q) && !GameState.is(`frg-${id}`),
    })),
  ],
  spawns: {
    'from-rota66': { tx: 3.4, ty: 6.3, facing: 'right' },
    'from-parque': { tx: 2.2, ty: 14.4, facing: 'right' },
  },
  exits: [
    {
      rect: R(0, 326, 22, 395),
      toMap: 'piabeta-rota66-fora',
      toSpawn: 'from-fragoso',
      // a caminhada é pra frente: voltar pra Rota 66 só depois de chegar no parque
      blockedIf: () => (QuestSystem.isActive(Q) && !QuestSystem.isObjectiveDone(Q, 'parque') ? 'Weng: "A Rota 66 ficou pra trás! O parque é pro outro lado →"' : false),
    },
    {
      rect: R(0, 690, 22, 780),
      toMap: 'piabeta-parque',
      toSpawn: 'from-rota66',
      blockedIf: () => {
        if (!QuestSystem.isActive(Q)) return false;
        if (!QuestSystem.isObjectiveDone(Q, 'gatos')) return `Bella: "Ainda tem gatinho sem carinho! (${catsDone()}/3)"`;
        return !QuestSystem.isObjectiveDone(Q, 'fragoso') ? 'Vamos com calma, sem pressa.' : false;
      },
    },
  ],
  triggers: [
    { id: 'c1', rect: R(380, 326, 410, 515), script: 'conversa1', once: true, enabledIf: () => QuestSystem.isActive(Q) },
    { id: 'c2', rect: R(1000, 326, 1030, 515), script: 'conversa2', once: true, enabledIf: () => QuestSystem.isActive(Q) },
    { id: 'c3', rect: R(1200, 560, 1490, 590), script: 'conversa3', once: true, enabledIf: () => QuestSystem.isActive(Q) },
    { id: 'c4', rect: R(700, 690, 730, 830), script: 'conversa4', once: true, enabledIf: () => QuestSystem.isActive(Q) },
  ],
  scripts,
  onEnter: 'entrar',
  beforeBuild: shuffleCats,
};
