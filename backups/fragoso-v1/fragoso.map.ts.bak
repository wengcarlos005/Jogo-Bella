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

const scripts: Record<string, Script> = {
  async entrar(ctx) {
    if (ctx.questActive('dq-e2')) ctx.weather('sunset');
    if (ctx.flag('fragoso-intro') || !ctx.questActive(Q)) return;
    ctx.setFlag('fragoso-intro');
    if (nerves() === 0) ctx.nerves(70);
    await ctx.wait(300);
    await ctx.narrate('Fragoso, à noite. As ruas tranquilas, as luzes dos postes, e o barulhinho dos grilos.');
    await ctx.say('weng', 'O parque é pra lá. Vamos devagar? Não tem pressa nenhuma.');
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

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-fragoso.png, 1536x1024). 48 px = 1 tile. */
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
  blocks: [
    R(0, 0, 1500, 322), // casas e muros de cima
    R(1500, 0, 1536, 1024), // árvores da direita
    // terreno do meio: plantas/árvores (topo) + muro (frente)
    R(0, 470, 1192, 600), // terreno com plantas (dá pra encostar nas folhas)
    R(0, 600, 700, 702), // muro da esquerda (até a faixa de grama, ninguém entra na parede)
    R(700, 600, 1205, 660), // muro do gato
    R(1192, 445, 1205, 660),
    // casas de baixo (telhados)
    // casas de baixo: bloqueio na linha do beiral de cada telhado
    R(0, 808, 200, 1024), // moitas do canto (a parte de cima fica por cima dos pés)
    R(200, 806, 525, 1024),
    R(525, 792, 600, 1024),
    R(600, 776, 920, 1024),
    R(920, 768, 1185, 1024),
    R(1185, 768, 1380, 1024),
    R(1380, 700, 1536, 780), // folhagem do canto
    R(1405, 575, 1536, 700), // arbustos à direita da curva
    R(0, 392, 122, 445), // arbustos do canto de cima à esquerda (a calçada de cima fica livre)
    // bases dos postes
    R(204, 712, 240, 745),
    R(108, 332, 140, 360),
    R(724, 344, 752, 370),
    R(1166, 362, 1196, 390),
  ],
  overlays: [
    // postes: quem passa atrás (ao norte da base) fica atrás da haste
    // postes: haste estreita (sem fio nem chão) + luminária pelo contorno
    { x0: 206, y0: 540, x1: 242, y1: 745, base: 744, cut: 'column', tall: true },
    { x0: 258, y0: 598, x1: 324, y1: 660, base: 744, cut: 'outline', tall: true },
    { x0: 1188, y0: 405, x1: 1226, y1: 692, base: 690, cut: 'column', tall: true },
    { x0: 1236, y0: 420, x1: 1302, y1: 478, base: 690, cut: 'outline', tall: true },
    // plantas do terreno: as folhas ficam na frente dos pés de quem encosta nelas
    { x0: 0, y0: 770, x1: 205, y1: 900, base: 900, cut: 'foliage', fade: true }, // moitas do canto de baixo
    { x0: 1290, y0: 700, x1: 1536, y1: 900, base: 900, cut: 'foliage', fade: true },
    // copa da árvore: fica translúcida quando alguém passa atrás
    { x0: 240, y0: 330, x1: 520, y1: 600, base: 600, cut: 'foliage', fade: true, tall: true },
  ],

  lighting: {
    darkness: 0.4,
    when: () => !QuestSystem.isActive('dq-e2'),
    lights: [
      { x: 195, y: 130, r: 260 },
      { x: 1251, y: 153, r: 260 },
      { x: 1275, y: 419, r: 260 },
      { x: 299, y: 584, r: 260 },
    ],
  },

  hotspots: [
    { rect: R(1010, 560, 1095, 640), interact: 'gato', label: 'Gato' },
    { rect: R(865, 230, 1010, 330), interact: 'varal', label: 'Varal' },
    { rect: R(100, 150, 150, 362), interact: 'poste', label: 'Poste' },
  ],
  spawns: {
    'from-rota66': { tx: 2.6, ty: 6.3, facing: 'right' },
    'from-parque': { tx: 2.2, ty: 14.4, facing: 'right' },
  },
  exits: [
    {
      rect: R(0, 322, 22, 468),
      toMap: 'piabeta-rota66-fora',
      toSpawn: 'from-fragoso',
      // a caminhada é pra frente: voltar pra Rota 66 só depois de chegar no parque
      blockedIf: () => (QuestSystem.isActive(Q) && !QuestSystem.isObjectiveDone(Q, 'parque') ? 'Weng: "A Rota 66 ficou pra trás! O parque é pro outro lado →"' : false),
    },
    {
      rect: R(0, 668, 22, 800),
      toMap: 'piabeta-parque',
      toSpawn: 'from-rota66',
      blockedIf: () => (QuestSystem.isActive(Q) && !QuestSystem.isObjectiveDone(Q, 'fragoso') ? 'Vamos com calma, sem pressa.' : false),
    },
  ],
  triggers: [
    { id: 'c1', rect: R(380, 322, 410, 468), script: 'conversa1', once: true, enabledIf: () => QuestSystem.isActive(Q) },
    { id: 'c2', rect: R(1000, 322, 1030, 468), script: 'conversa2', once: true, enabledIf: () => QuestSystem.isActive(Q) },
    { id: 'c3', rect: R(1192, 560, 1500, 590), script: 'conversa3', once: true, enabledIf: () => QuestSystem.isActive(Q) },
    { id: 'c4', rect: R(700, 668, 730, 800), script: 'conversa4', once: true, enabledIf: () => QuestSystem.isActive(Q) },
  ],
  scripts,
  onEnter: 'entrar',
};
