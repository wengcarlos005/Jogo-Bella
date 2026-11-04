import { T } from '@/world/tiles';
import type { MapDef } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';

const Q = 'pia-m3';

/**
 * Caminhada por Fragoso (fato real): entre a Rota 66 e o parque, a Bella,
 * nervosa desde o começo do encontro, finalmente se acalma.
 * Cada conversa no caminho baixa o medidor de nervosismo.
 *
 * Cenário provisório em tiles. Quando chegar maps/piabeta-fragoso-bg.png,
 * troque `art` para 'native' e meça as colisões sobre o desenho.
 */
const nerves = () => Number(GameState.getFlag<number>('nervosismo') ?? 0);
const lower = (ctx: ScriptContext, to: number) => ctx.nerves(Math.min(nerves(), to));

const scripts: Record<string, Script> = {
  async entrar(ctx) {
    ctx.weather('night');
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
  },

  async poste(ctx) {
    await ctx.say('bella', 'A luz amarelinha do poste deixa tudo com cara de filme.');
  },
  async weng(ctx) {
    await ctx.say('weng', QuestSystem.isObjectiveDone(Q, 'fragoso') ? 'Vamos pro parque?' : 'Sem pressa. A gente vai andando.');
  },
};

/** Grade 32x21 (provisória): rua de cima → descida → rua de baixo. */
const GROUND = [
  'RRRRRRRGBBBBBBBGRRRRRRRGBBBBBBBG',
  'RRRRRRRGBBBBBBBGRRRRRRRGBBBBBBBG',
  'EEEEEEEGbbbbbbbGEEEEEEEGbbbbbbbG',
  'HWHDHWHGJWJDJWJGHWHDHWHGJWJDJWJG',
  'sssssssssssssssssssssssssssssshh',
  'sssssssssssssssssssssssssssssshh',
  'cccccccccccccccccccccccccccssshh',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaassshh',
  'alaalaalaalaalaalaalaalaalassshh',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGssshh',
  'GGGfGGGGGGGGGGGfGGGGGGGGfGGssshh',
  'GGGGGGGGGfGGGGGGGGfGGGGGGGGssshh',
  'GGGGGGfGGGGGGGGGGGGGGfGGGGGssshh',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGssshh',
  'cccccccccccccccccccccccccccssshh',
  'sssssssssssssssssssssssssssssshh',
  'sssssssssssssssssssssssssssssshh',
  'cccccccccccccccccccccccccccccchh',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaahh',
  'alaalaalaalaalaalaalaalaalaalahh',
  'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
];

export const fragosoMap: MapDef = {
  id: 'piabeta-fragoso',
  region: 'piabeta',
  name: 'Fragoso',
  music: 'fragoso',
  background: '#1d1a2e',
  art: 'native',
  legend: {
    g: T.GRASS, G: T.GRASS_DARK, f: T.GRASS_FLOWERS, s: T.SIDEWALK, c: T.CURB, a: T.ASPHALT, l: T.ASPHALT_LINE, h: T.HEDGE,
    R: T.ROOF, E: T.ROOF_EDGE, B: T.ROOF_BLUE, b: T.ROOF_BLUE_EDGE, H: T.HOUSE_WALL, J: T.HOUSE_WALL_2, W: T.WINDOW, D: T.DOOR,
  },
  ground: GROUND,
  blocks: [
    { x: 0, y: 0, w: 32, h: 4 }, // casas
    { x: 0, y: 7, w: 27, h: 2 }, // rua de cima
    { x: 0, y: 9, w: 27, h: 5 }, // jardins
    { x: 0, y: 18, w: 30, h: 3 }, // rua de baixo
  ],
  props: [
    { key: 'prop-lamp-post', tx: 5, ty: 6, block: [5, 40, 6, 6], interact: 'poste', label: 'Poste' },
    { key: 'prop-lamp-post', tx: 15, ty: 6, block: [5, 40, 6, 6] },
    { key: 'prop-lamp-post', tx: 24, ty: 6, block: [5, 40, 6, 6] },
    { key: 'prop-lamp-post', tx: 22, ty: 17, block: [5, 40, 6, 6] },
    { key: 'prop-lamp-post', tx: 11, ty: 17, block: [5, 40, 6, 6] },
    { key: 'prop-tree', tx: 2, ty: 13, block: false },
    { key: 'prop-tree', tx: 12, ty: 12, block: false },
    { key: 'prop-tree', tx: 20, ty: 13, block: false },
    { key: 'prop-bush', tx: 8, ty: 10, block: false },
    { key: 'prop-bush', tx: 17, ty: 11, block: false },
  ],
  spawns: {
    'from-rota66': { tx: 1.4, ty: 4.6, facing: 'right' },
    'from-parque': { tx: 1.4, ty: 15.6, facing: 'right' },
  },
  exits: [
    { rect: { x: 0, y: 4, w: 0.6, h: 2 }, toMap: 'piabeta-rota66-fora', toSpawn: 'from-fragoso' },
    {
      rect: { x: 0, y: 15, w: 0.6, h: 2 },
      toMap: 'piabeta-parque',
      toSpawn: 'from-rota66',
      blockedIf: () => (QuestSystem.isActive(Q) && !QuestSystem.isObjectiveDone(Q, 'fragoso') ? 'Vamos com calma, sem pressa.' : false),
    },
  ],
  triggers: [
    { id: 'c1', rect: { x: 8, y: 4, w: 1, h: 3 }, script: 'conversa1', once: true, enabledIf: () => QuestSystem.isActive(Q) },
    { id: 'c2', rect: { x: 19, y: 4, w: 1, h: 3 }, script: 'conversa2', once: true, enabledIf: () => QuestSystem.isActive(Q) },
    { id: 'c3', rect: { x: 27, y: 10, w: 3, h: 1 }, script: 'conversa3', once: true, enabledIf: () => QuestSystem.isActive(Q) },
    { id: 'c4', rect: { x: 16, y: 14, w: 1, h: 3 }, script: 'conversa4', once: true, enabledIf: () => QuestSystem.isActive(Q) },
  ],
  scripts,
  onEnter: 'entrar',
};
