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
      await ctx.say('weng', 'Olha, dá pra ver o coreto do parque daqui. É só seguir aquele caminho à direita.');
    }
  },

  async neon(ctx) {
    await ctx.say('bella', `"${ROTA}" em neon. Com o hambúrguer piscando do lado. Amei.`);
  },
  async placa(ctx) {
    await ctx.say('weng', 'Uma placa da Rota 66 de verdade. Ou quase de verdade.');
  },
  async banco(ctx) {
    await ctx.say('bella', 'Um banquinho na frente da lanchonete. Bom pra esperar o Uber de volta.');
  },
  async trilha(ctx) {
    if (!QuestSystem.isDone('pia-m2')) {
      await ctx.say('weng', 'O parque é ali do lado. Mas primeiro o lanche!');
      return;
    }
    await ctx.say('weng', 'É por aqui. Bora?');
  },
  async weng(ctx) {
    if (!QuestSystem.isDone('pia-m2')) await ctx.say('weng', 'Vamos entrar? Tô morrendo de fome.');
    else await ctx.say('weng', 'O parque é pelo caminho de terra, ali à direita.');
  },
};

/** Prólogo — fachada da Rota 66 à noite (cenário pintado). */
export const rota66ForaMap: MapDef = {
  id: 'piabeta-rota66-fora',
  region: 'piabeta',
  name: ROTA,
  music: 'rota66',
  background: '#1d1a2e',
  art: 'native',
  legend: { '.': T.SIDEWALK },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

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
    // rua (não dá pra andar no asfalto)
    R(0, 805, 1536, 1100),
  ],

  hotspots: [
    { rect: R(330, 140, 920, 320), interact: 'neon', label: 'Letreiro' },
    { rect: R(1080, 440, 1185, 684), interact: 'placa', label: 'Placa' },
    { rect: R(215, 585, 385, 702), interact: 'banco', label: 'Banco' },
    {
      rect: R(1340, 380, 1450, 520),
      interact: 'trilha',
      label: 'Parque',
      markerIf: () => QuestSystem.isDone('pia-m2') && QuestSystem.isActive('pia-m3') && !QuestSystem.isObjectiveDone('pia-m3', 'parque'),
    },
  ],

  spawns: {
    'from-uber': { tx: 12.6, ty: 15.0, facing: 'up' },
    'from-rota66': { tx: 13.7, ty: 13.6, facing: 'down' },
    'from-parque': { tx: 28.5, ty: 12.4, facing: 'down' },
  },
  exits: [
    { rect: R(605, 600, 762, 645), toMap: 'piabeta-rota66', toSpawn: 'from-fora', sfx: 'door' },
    {
      rect: R(1345, 520, 1445, 562),
      toMap: 'piabeta-parque',
      toSpawn: 'from-rota66',
      blockedIf: () => (QuestSystem.isDone('pia-m2') || !QuestSystem.isActive('pia-m2') ? false : `${PERSONAL.weng.name}: "Primeiro o lanche!"`),
    },
  ],
  scripts,
  onEnter: 'entrar',
};
