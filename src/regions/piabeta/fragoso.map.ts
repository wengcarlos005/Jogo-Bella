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
    R(0, 468, 1192, 668), // terreno do meio (árvores, bananeiras, muro do gato)
    R(0, 800, 1300, 1024), // casas de baixo
    R(1300, 760, 1500, 1024), // flores e muro de baixo
    // postes
    R(108, 332, 140, 360),
    R(724, 344, 752, 370),
    R(1166, 362, 1196, 390),
    R(210, 722, 242, 750),
  ],
  // Profundidade: copas, bananeiras e postes ficam NA FRENTE de quem passa atrás
  overlays: [
    { x0: 236, y0: 362, x1: 534, y1: 575, base: 655, ellipse: true },
    { x0: -40, y0: 330, x1: 160, y1: 580, base: 650, ellipse: true },
    { x0: 588, y0: 440, x1: 792, y1: 640, base: 640 },
    { x0: 922, y0: 420, x1: 1088, y1: 565, base: 600 },
    { x0: 1176, y0: 420, x1: 1296, y1: 492, base: 668 },
    { x0: 1194, y0: 492, x1: 1220, y1: 670, base: 668 },
    { x0: 196, y0: 545, x1: 318, y1: 640, base: 745 },
    { x0: 210, y0: 640, x1: 236, y1: 745, base: 745 },
    { x0: 1168, y0: 250, x1: 1192, y1: 388, base: 388 },
    { x0: 728, y0: 250, x1: 752, y1: 370, base: 370 },
  ],

  hotspots: [
    { rect: R(1010, 560, 1095, 640), interact: 'gato', label: 'Gato' },
    { rect: R(865, 230, 1010, 330), interact: 'varal', label: 'Varal' },
    { rect: R(100, 150, 150, 362), interact: 'poste', label: 'Poste' },
  ],
  spawns: {
    'from-rota66': { tx: 1.2, ty: 6.3, facing: 'right' },
    'from-parque': { tx: 1.2, ty: 14.4, facing: 'right' },
  },
  exits: [
    { rect: R(0, 322, 22, 468), toMap: 'piabeta-rota66-fora', toSpawn: 'from-fragoso' },
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
