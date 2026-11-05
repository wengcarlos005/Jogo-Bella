import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL } from '@/data/personal';

const ROTA = PERSONAL.places.hamburgueria;

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-rota66-fora.png, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async entrar(ctx) {
    if (ctx.questActive('pia-m2') && !ctx.objectiveDone('pia-m2', 'chegar')) {
      // Chegada de Uber
      ctx.visible('player', false);
      ctx.visible('weng', false);
      ctx.prop('uber', 'uber-car', -6, 18.75, 1);
      await ctx.moveProp('uber', 14.4, 18.75, 2600);
      ctx.sfx('door');
      await ctx.wait(400);
      ctx.place('player', 12.6, 15.0, 'up');
      ctx.place('weng', 15.3, 15.0, 'up');
      ctx.visible('player', true);
      ctx.visible('weng', true);
      await ctx.wait(500);
      void ctx.moveProp('uber', 40, 18.75, 2200).then(() => ctx.removeProp('uber'));
      ctx.objective('pia-m2', 'chegar');
      await ctx.say('weng', `Chegamos! Essa é a ${ROTA}.`);
      await ctx.emote('bella', 'heart');
      await ctx.say('bella', 'Olha esse neon! Parece que a gente entrou num filme americano.');
      await ctx.say('weng', 'Espera só até ver por dentro. Vem!');
      ctx.toast(`Entre na ${ROTA}`);
      return;
    }
    if (QuestSystem.isDone('pia-m2') && ctx.questActive('pia-m3') && !ctx.objectiveDone('pia-m3', 'parque')) {
      await ctx.wait(300);
      await ctx.say('weng', 'Vamos por Fragoso? É por ali, seguindo a calçada pra esquerda.');
    }
  },

  async neon(ctx) {
    await ctx.say('bella', `"${ROTA}" em neon. Com o hambúrguer piscando do lado. Amei.`);
  },
  async placa(ctx) {
    await ctx.say('weng', 'Uma placa da Rota 66 de verdade. Ou quase de verdade.');
  },
  async banco(ctx) {
    await ctx.sit(300, 678, [['bella', 'Que noite bonita.'], ['weng', 'Tá mesmo. E nem é por causa do neon.']]);
  },
  async trilha(ctx) {
    await ctx.say('bella', 'Um caminho escuro no meio das árvores. Melhor ir pela rua, com o Weng.');
  },
  async weng(ctx) {
    if (!QuestSystem.isDone('pia-m2')) await ctx.say('weng', 'Vamos entrar? Tô morrendo de fome.');
    else await ctx.say('weng', 'Vamos por Fragoso? É seguindo a calçada pra esquerda.');
  },
};

/** Prólogo — fachada da Rota 66 à noite (cenário pintado). */
export const rota66ForaMap: MapDef = {
  id: 'piabeta-rota66-fora',
  region: 'piabeta',
  name: ROTA,
  music: 'rota66',
  background: '#1d1a2e',
  ambient: 'fireflies',
  art: 'native',
  legend: { '.': T.SIDEWALK },
  ground: Array.from({ length: 22 }, () => '.'.repeat(25)), // cenário cortado em x=1200 (sem o parque)

  blocks: [
    // fachada, prédio vizinho e topo do parque
    R(0, 0, 1130, 600),
    R(1130, 0, 1345, 650),
    R(1445, 0, 1536, 690),
    R(1345, 0, 1445, 380),
    // calçada: poste, lixeira, banco, floreiras, vasos, placa
    R(75, 735, 135, 778),
    R(135, 650, 200, 706),
    R(215, 640, 385, 702),
    R(120, 600, 490, 672),
    R(505, 615, 588, 682),
    R(775, 615, 862, 682),
    R(865, 600, 1080, 672),
    R(1112, 640, 1152, 684),
    R(1425, 640, 1488, 694),
    R(1350, 690, 1536, 782),
    // rua: dá pra andar no asfalto, até a borda de baixo
    R(0, 1000, 1536, 1100),
  ],

  lighting: {
    darkness: 0.28,
    lights: [
      { x: 105, y: 508, r: 240 },
      { x: 640, y: 230, r: 300, color: 0xff6f9a },
      { x: 560, y: 450, r: 220 },
      { x: 920, y: 450, r: 220 },
    ],
  },

  hotspots: [
    { rect: R(330, 140, 920, 320), interact: 'neon', label: 'Letreiro' },
    { rect: R(1080, 440, 1185, 684), interact: 'placa', label: 'Placa' },
    { rect: R(215, 585, 385, 702), interact: 'banco', label: 'Sentar' },
  ],

  spawns: {
    'from-uber': { tx: 12.6, ty: 15.0, facing: 'up' },
    'from-rota66': { tx: 13.7, ty: 13.6, facing: 'down' },
    'from-fragoso': { tx: 1.2, ty: 15.5, facing: 'right' },
  },
  exits: [
    { rect: R(605, 600, 762, 645), toMap: 'piabeta-rota66', toSpawn: 'from-fora', sfx: 'door' },
    {
      rect: R(0, 705, 40, 805),
      toMap: 'piabeta-fragoso',
      toSpawn: 'from-rota66',
      blockedIf: () => (QuestSystem.isDone('pia-m2') || !QuestSystem.isActive('pia-m2') ? false : `${PERSONAL.weng.name}: "Primeiro o lanche!"`),
    },
  ],
  hideActorsOnEnter: () => QuestSystem.isActive('pia-m2') && !QuestSystem.isObjectiveDone('pia-m2', 'chegar'),
  scripts,
  onEnter: 'entrar',
};
