import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';

/**
 * Retângulo medido no cenário ORIGINAL (art-source/maps/duque-acai-base.webp, 1536x1024).
 * 48 px da imagem = 1 tile (16 px lógicos).
 */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const ROW = '.'.repeat(32);


const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('acai-1')) return;
    await ctx.say('bella', 'Açaíííí! Olha esse balcão de complemento, Weng. Eu tô no paraíso.');
    await ctx.say('weng', 'Pede o que você quiser. Hoje é por minha conta.');
    await ctx.say('bella', 'Você vai se arrepender de ter falado isso.');
    ctx.toast('Faça o pedido no balcão');
  },

  async balcao(ctx) {
    if (ctx.flag('acai-hoje')) {
      await ctx.say('bella', 'Mais um? ...Melhor não. Meu açaí ainda tá pela metade.');
      return;
    }
    await ctx.say('atendente-acai', 'Boa noite! Qual o tamanho do açaí?');
    const tam = await ctx.choose('bella', 'Tamanho do copo', ['300 ml', '500 ml', '700 ml']);
    if (tam === 2) await ctx.say('weng', 'Setecentos?! Tá bom, tá bom. Eu ajudo a comer.');
    await ctx.say('atendente-acai', 'Pode montar do seu jeito, os complementos tão todos aqui!');
    const r = await ctx.acai({ title: 'O açaí da Bella', helper: 'weng' });
    const escolhidos = [...new Set(r.toppings)].map((t) => t.replace('-', ' '));
    if (r.toppings.length >= 7) {
      await ctx.say('atendente-acai', 'Nossa, vai querer TUDO isso?');
      await ctx.say('bella', 'Açaí sem complemento é só uma tigela roxa triste.');
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', 'Não discute com ela, moça. Eu já perdi essa.');
    } else if (r.toppings.length >= 4) {
      await ctx.say('weng', 'Bonito. Mas eu te conheço: amanhã você vai dizer que faltou complemento.');
    } else {
      await ctx.say('weng', 'Só isso? Tá doente?');
      await ctx.say('bella', 'Eu tô me controlando! ...Coloca mais paçoca, moça.');
    }
    ctx.sfx('pickup');
    await ctx.showItem('icon-acai', 'Você pegou', 'Açaí da Bella', `Copo de ${['300', '500', '700'][tam]} ml com ${escolhidos.join(', ')}. Transbordando.`);
    ctx.setFlag('acai-hoje');

    await ctx.fadeOut(300);
    ctx.place('player', 15.0, 15.3, 'up');
    ctx.place('weng', 16.6, 15.3, 'up');
    await ctx.frame(15.8, 15.3, 0);
    await ctx.fadeIn(300);
    ctx.face('player', 'right');
    ctx.face('weng', 'left');
    await ctx.say('bella', 'Hmmmm. Perfeito. Prova!');
    await ctx.say('weng', 'Você só me deu a parte que não tem complemento.');
    await ctx.say('bella', 'É assim que funciona dividir açaí. Todo mundo sabe.');
    ctx.hearts('player', 6);
    await ctx.unfocus(400);
    if (!ctx.flag('acai-1')) {
      ctx.setFlag('acai-1');
      await ctx.memory('mem-dq-02');
    }
  },

  async cardapio(ctx) {
    await ctx.say('bella', 'Copo de 700 ml por R$ 20,90. É praticamente de graça, né, Weng?');
  },
  async geladeira(ctx) {
    await ctx.say('bella', 'Sucos de tudo que é cor. Mas eu vim pelo açaí.');
  },
  async mesa(ctx) {
    await ctx.say('bella', 'Uma mesinha com vasinho. Bom lugar pra comer açaí olhando pra você.');
  },

  async saida(ctx) {
    if (ctx.flag('acai-hoje')) ctx.setFlag('acai-hoje', false);
    await ctx.teleport('duque-rua', 'from-acai');
  },
};

/** Capítulo 1 — açaiteria perto do apê do Weng (interior, cenário pintado). */
export const acaiMap: MapDef = {
  id: 'duque-acai',
  region: 'duque-de-caxias',
  name: 'Açaiteria',
  indoor: true,
  music: 'rota66',
  background: '#2a1630',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => ROW),

  // v2: cenário vazio (art-source/maps/duque-acai-base.webp) + objetos da folha (objects/ac-*). Backup em backups/acai-v1/.
  blocks: [
    R(0, 0, 60, 1024), // vidraça da esquerda
    R(1505, 0, 1536, 1024), // parede da direita
    R(0, 0, 1536, 455), // fundo
    R(400, 0, 1330, 625), // balcão
    R(330, 380, 410, 560), // canto atrás da máquina
    R(40, 400, 345, 590), // bancada da janela
    R(1330, 260, 1475, 610), // geladeira de sucos
    R(0, 1000, 560, 1024),
    R(950, 1000, 1536, 1024),
    R(398, 730, 546, 770),
    R(1172, 730, 1318, 770),
    R(351, 830, 399, 850),
    R(546, 830, 594, 850),
    R(1124, 830, 1172, 850),
    R(1319, 830, 1367, 850),
    R(97, 760, 143, 780),
    R(177, 695, 223, 715),
    R(257, 630, 303, 650),
    R(30, 970, 130, 1000),
    R(1405, 970, 1505, 1000),
    R(152, 932, 468, 1012),
    R(1052, 932, 1388, 1012),
    R(529, 946, 561, 968),
    R(949, 946, 981, 968),
    R(1469, 618, 1507, 640),
  ],

  objects: [
    { key: 'ac-mesa', x: 472, y: 770, w: 175, shadow: 0.8 },
    { key: 'ac-mesa', x: 1245, y: 770, w: 175, shadow: 0.8, flip: true },
    { key: 'ac-banqueta', x: 375, y: 850, w: 60, shadow: 0.8 },
    { key: 'ac-banqueta', x: 570, y: 850, w: 60, shadow: 0.8 },
    { key: 'ac-banqueta', x: 1148, y: 850, w: 60, shadow: 0.8 },
    { key: 'ac-banqueta', x: 1343, y: 850, w: 60, shadow: 0.8 },
    { key: 'ac-banqueta', x: 120, y: 780, w: 58, shadow: 0.8 },
    { key: 'ac-banqueta', x: 200, y: 715, w: 58, shadow: 0.8 },
    { key: 'ac-banqueta', x: 280, y: 650, w: 58, shadow: 0.8 },
    { key: 'ac-planta', x: 80, y: 1000, w: 125, shadow: 0.6 },
    { key: 'ac-planta', x: 1455, y: 1000, w: 125, shadow: 0.6, flip: true },
    { key: 'ac-floreira', x: 310, y: 1012, w: 330, shadow: false },
    { key: 'ac-floreira', x: 1220, y: 1012, w: 350, shadow: false },
    { key: 'ac-antifurto', x: 545, y: 968, w: 40, shadow: 0.6 },
    { key: 'ac-antifurto', x: 965, y: 968, w: 40, shadow: 0.6, flip: true },
    { key: 'ac-lixeira', x: 1488, y: 640, w: 48, shadow: 0.7 },
  ],

  lighting: {
    darkness: 0.22,
    lights: [
      { x: 190, y: 330, r: 240, color: 0xd070ff },
      { x: 1410, y: 180, r: 200, color: 0xd070ff },
      { x: 860, y: 560, r: 260, color: 0xc060ff },
      { x: 450, y: 300, r: 180 },
      { x: 560, y: 300, r: 180 },
      { x: 840, y: 280, r: 200 },
      { x: 1125, y: 300, r: 200 },
    ],
  },

  hotspots: [
    { rect: R(630, 455, 1070, 627), interact: 'balcao', label: 'Balcão' },
    { rect: R(1150, 620, 1340, 780), interact: 'mesa', label: 'Mesa' },
  ],

  spawns: {
    porta: { tx: 15.3, ty: 18.6, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(565, 985, 945, 1024), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
