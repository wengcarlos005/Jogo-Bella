import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';

/**
 * Retângulo medido no cenário ORIGINAL (art-source/maps/duque-acai.webp, 1536x1024).
 * 48 px da imagem = 1 tile (16 px lógicos).
 */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const ROW = '.'.repeat(32);

const COMPLEMENTOS = ['Granola', 'Banana', 'Morango', 'Leite em pó', 'Confete', 'Kiwi', 'Paçoca', 'Creme de avelã', 'Leite condensado'];

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
    const escolhidos: string[] = [];
    // A Bella gosta de açaí CHEIO de complemento: vai escolhendo até dizer chega
    for (let i = 0; i < 5; i++) {
      const restantes = COMPLEMENTOS.filter((c) => !escolhidos.includes(c));
      const opcoes = [...restantes.slice(0, 3), escolhidos.length >= 2 ? 'Pronto, só isso!' : 'Mais um...'];
      const c = await ctx.choose('bella', escolhidos.length ? `Já tem: ${escolhidos.join(', ')}. E mais?` : 'Complementos', opcoes);
      if (c === opcoes.length - 1) {
        if (escolhidos.length >= 2) break;
        COMPLEMENTOS.push(COMPLEMENTOS.shift()!);
        continue;
      }
      escolhidos.push(opcoes[c]);
    }
    if (escolhidos.length >= 4) {
      await ctx.say('atendente-acai', 'Nossa, vai querer TUDO isso?');
      await ctx.say('bella', 'Açaí sem complemento é só uma tigela roxa triste.');
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', 'Não discute com ela, moça. Eu já perdi essa.');
    } else {
      await ctx.say('weng', 'Só isso? Tá doente?');
      await ctx.say('bella', 'Eu tô me controlando! ...Coloca mais paçoca, moça.');
    }
    ctx.sfx('pickup');
    await ctx.showItem('icon-acai', 'Você pegou', 'Açaí da Bella', `Copo de ${['300', '500', '700'][tam]} ml com ${escolhidos.join(', ').toLowerCase()}. Transbordando.`);
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
    await ctx.teleport('duque-apto', 'porta');
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

  blocks: [
    R(0, 0, 60, 1024), // vidraça da esquerda
    R(1505, 0, 1536, 1024), // parede da direita
    R(0, 0, 1536, 455), // fundo
    R(400, 0, 1330, 625), // balcão
    R(330, 380, 410, 560), // canto atrás da máquina
    R(40, 400, 345, 800), // bancada da janela + banquetas
    R(315, 600, 630, 855), // mesa da esquerda + banquetas
    R(1070, 600, 1420, 855), // mesa da direita + banquetas
    R(1330, 260, 1455, 610), // geladeira de sucos
    R(1455, 560, 1530, 660), // lixeira
    R(145, 920, 475, 1010), // floreira da esquerda
    R(1045, 920, 1395, 1010), // floreira da direita
    R(30, 880, 125, 1000), // vaso da esquerda
    R(1405, 870, 1500, 1000), // vaso da direita
    R(527, 930, 562, 968), // antena antifurto (esq.)
    R(946, 930, 985, 968), // antena antifurto (dir.)
    R(0, 1000, 560, 1024),
    R(950, 1000, 1536, 1024),
  ],

  overlays: [
    { x0: 140, y0: 860, x1: 478, y1: 1010, base: 1005, cut: 'foliage' },
    { x0: 1040, y0: 860, x1: 1400, y1: 1010, base: 1005, cut: 'foliage' },
    { x0: 0, y0: 725, x1: 170, y1: 1000, base: 995, cut: 'foliage' },
    { x0: 1370, y0: 735, x1: 1510, y1: 1000, base: 995, cut: 'foliage' },
    { x0: 524, y0: 742, x1: 565, y1: 968, base: 966 },
    { x0: 943, y0: 740, x1: 988, y1: 968, base: 966 },
    { x0: 315, y0: 600, x1: 632, y1: 858, base: 855, cut: 'furniture' },
    { x0: 1068, y0: 600, x1: 1422, y1: 858, base: 855, cut: 'furniture' },
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
    { rect: R(1070, 600, 1420, 858), interact: 'mesa', label: 'Mesa' },
  ],

  spawns: {
    porta: { tx: 15.3, ty: 18.6, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(565, 985, 945, 1024), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
