import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { passeioDuque } from './apto.map';

/**
 * Retângulo medido no cenário ORIGINAL (art-source/maps/duque-rua-base.webp, 1536x1024).
 * 48 px da imagem = 1 tile (16 px lógicos).
 * Em cima: portaria do prédio do Weng (esq.) e a praça com o Teatro Raul Cortez (dir.);
 * meio: a avenida; embaixo: o Shopping da Multidão.
 */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const ROW = '.'.repeat(32);

const scripts: Record<string, Script> = {
  async weng(ctx) {
    if (QuestSystem.isActive('dq-m5')) {
      await ctx.say('weng', 'Hoje é dia de passeio: açaí, Multidão e o mercado da Vó. (E depois eu tenho uma coisa pra te contar.)');
      await ctx.say('bella', 'Que coisa? ...Não vai falar? Tá bom. Mas eu vou ficar curiosa.');
      return;
    }
    await ctx.say('weng', 'Tô aqui. Do seu lado. Pra onde a gente vai?');
  },
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('dq-rua-1')) return;
    ctx.setFlag('dq-rua-1');
    await ctx.say('weng', 'Essa é a minha rua. Ali na frente, o Multidão. E ali do lado, o teatro.');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'Você mora no melhor lugar do mundo e nunca me contou.');
    ctx.toast('Explore: o Shopping da Multidão (porta da frente) e a açaiteria, à direita');
  },
  async portaria(ctx) {
    await ctx.teleport('duque-apto', 'porta');
  },
  async teatro(ctx) {
    await ctx.say('bella', 'O Teatro Raul Cortez. Daqui de baixo a rampa parece que flutua mesmo.');
    await ctx.say('weng', 'Um dia a gente vem ver uma peça aqui. Combinado?');
    await ctx.say('bella', 'Combinado. E depois açaí.');
  },
  async multidao(ctx) {
    if (!ctx.flag('mt-chegou')) {
      await ctx.say('bella', 'O Shopping da Multidão... Weng, segura minha mão. Se eu entrar, eu saio sem dinheiro.');
      await ctx.say('weng', 'Entra. Mas com orçamento. Um orçamento PEQUENO.');
    }
    await ctx.teleport('dq-multidao', 'porta');
  },
  async placa(ctx) {
    await ctx.say('bella', 'A placa: "→ Açaiteria" e "← Mercado". Weng, a seta do açaí tá brilhando pra mim.');
    await ctx.say('weng', 'Ela brilha pra você toda vez que a gente passa aqui.');
  },
  async mercado(ctx) {
    if (!QuestSystem.isActive('dq-m5') || QuestSystem.isObjectiveDone('dq-m5', 'mercado')) {
      await ctx.say('weng', 'O mercado fica pra lá. Fica pra outro dia.');
      await ctx.move('player', 1.4, 16.3, 60);
      return;
    }
    const entra = await ctx.choose('bella', 'O mercadinho da esquina. Fazer as compras da Vó agora?', ['Entrar no mercado', 'Depois']);
    if (entra === 1) {
      await ctx.move('player', 1.6, 16.3, 60);
      return;
    }
    // o mercadinho da esquina: a lista da Vó (e umas coisinhas a mais)
    await ctx.fadeOut(400);
    await ctx.narrate('O mercadinho da esquina. Ar-condicionado gelado, carrinho de roda torta e a lista da Vó no celular do Weng.');
    await ctx.say('weng', 'A lista da Vó: ovos, leite condensado, creme de leite, queijo, banana e chocolate. Ela vai fazer bolinho pra você.');
    await ctx.say('bella', 'Pra MIM? Eu amo a sua Vó.');
    const mk = await ctx.market();
    ctx.setFlag('dq-mercado-estrelas', mk.stars);
    if (mk.pacoca) await ctx.say('weng', 'E a paçoca "invisível" passou no caixa. Eu vi.');
    await ctx.say('bella', 'A moça do caixa perguntou se a gente é casado.');
    await ctx.say('weng', 'E você falou o quê?');
    await ctx.say('bella', '"Ainda não." (sorriso)');
    await ctx.emote('weng', 'heart');
    ctx.sfx('pickup');
    // saindo do mercado: um do lado do outro, sem se sobrepor
    ctx.follow('weng', false);
    ctx.place('player', 2.2, 16.3, 'right');
    ctx.place('weng', 4.1, 16.3, 'left');
    await ctx.fadeIn(400);
    ctx.follow('weng', true);
    await passeioDuque(ctx, 'mercado');
  },
  async acai(ctx) {
    await ctx.teleport('duque-acai', 'porta');
  },
  async banco1(ctx) {
    await ctx.sit(860, 352, [['weng', 'Daqui dá pra ver o teatro inteirinho.'], ['bella', 'E as luzes acendendo. Que lindo.']]);
  },
  async banco2(ctx) {
    await ctx.sit(1215, 352, [['bella', 'Esse banco tem a melhor vista da rampa.'], ['weng', 'E eu tenho a melhor vista do banco.']]);
  },
  async onibus(ctx) {
    await ctx.say('bella', 'Ponto de ônibus. Daqui eu volto pra Piabetá... mas hoje não.');
  },
  async vitrine(ctx) {
    await ctx.say('bella', 'Bala de goma, pirulito, pote de doce... a vitrine tá me chamando.');
  },
};

/** Capítulo 1 — rua do prédio do Weng (Duque de Caxias), cenário pintado. */
export const duqueRuaMap: MapDef = {
  id: 'duque-rua',
  region: 'duque-de-caxias',
  name: 'Rua do Weng',
  music: 'fragoso',
  background: '#2a1d2a',
  art: 'native',
  legend: { '.': T.SIDEWALK },
  ground: Array.from({ length: 22 }, () => ROW),

  // v2: cenário vazio (art-source/maps/duque-rua-base.webp) + objetos da folha (objects/dr-*). Backup em backups/duque-rua-v1/.
  blocks: [
    // Em cima, à esquerda: prédio, muro, portaria e guarita (o portão é a entrada)
    R(0, 0, 330, 385),
    R(430, 0, 650, 385),
    R(330, 0, 430, 365),
    // Praça: fundo, teatro e rampa; canteiros baixos
    R(610, 0, 880, 200),
    R(880, 0, 1470, 235), // teatro
    R(1180, 135, 1450, 305), // rampa
    R(1450, 0, 1536, 330), // árvores da direita
    R(668, 285, 812, 330), // canteiro do ipê
    R(905, 345, 1105, 385), // canteiros
    R(1210, 315, 1291, 373),
    R(1325, 345, 1505, 385),
    // objetos soltos: só a base
    R(1119, 368, 1143, 385), // lixeira da praça
    R(778, 410, 802, 428), R(1088, 410, 1112, 428), R(1420, 410, 1444, 428), // postes na beira da praça
    R(1462, 330, 1512, 368), // tronco da árvore grande da direita
    R(33, 688, 57, 706), R(1480, 690, 1504, 708), // postes duplos das esquinas do Multidão
    // Embaixo: Shopping da Multidão (a porta fica em x 610–900)
    R(115, 560, 1420, 868),
    R(555, 850, 605, 882), // vasos da porta
    R(898, 850, 955, 882),
    R(240, 905, 378, 955), // floreiras
    R(997, 905, 1103, 955),
    R(1112, 928, 1148, 950), // lixeira
    R(1155, 905, 1405, 965), // ponto de ônibus
    R(1458, 958, 1482, 975), // placa
    R(0, 985, 1536, 1024), // meio-fio de baixo
  ],

  objects: [
    // praça do teatro: uma árvore em cada canteiro, bancos na calçada entre eles e postes na beira da rua
    { key: 'dr-ipe-solta', x: 740, y: 312, w: 220, fade: true, shadow: false }, // sem o canteiro do desenho: usa o do cenário
    { key: 'dr-arvore-solta', x: 1005, y: 366, w: 200, fade: true, shadow: false },
    { key: 'dr-arvore-solta', x: 1415, y: 366, w: 190, fade: true, shadow: false, flip: true },
    { key: 'dr-postebola', x: 790, y: 428, w: 32, shadow: 0.4 },
    { key: 'dr-postebola', x: 1100, y: 428, w: 32, shadow: 0.4 },
    { key: 'dr-postebola', x: 1432, y: 428, w: 32, shadow: 0.4 },
    // como no original: árvores grandes atrás do condomínio e ao lado do teatro
    { key: 'dr-arvoregrande', x: 100, y: 376, w: 250, fade: true, shadow: 0.5 },
    { key: 'dr-arvoregrande', x: 1487, y: 366, w: 230, fade: true, shadow: 0.5, flip: true },
    // cerca viva florida no pé do muro do condomínio e arbusto ao lado da guarita
    { key: 'dr-cercaviva', x: 70, y: 386, w: 135, shadow: false },
    { key: 'dr-cercaviva', x: 222, y: 386, w: 130, shadow: false, flip: true },
    { key: 'dr-arbustoflor', x: 588, y: 386, w: 80, shadow: false },
    // postes duplos nas esquinas da calçada do Multidão
    { key: 'dr-postedupla', x: 45, y: 706, w: 140, shadow: 0.4 },
    { key: 'dr-postedupla', x: 1492, y: 708, w: 140, shadow: 0.4, flip: true },
    { key: 'dr-lixeira', x: 1131, y: 385, w: 28, shadow: 0.8 },
    { key: 'dr-lixeira', x: 1130, y: 950, w: 38, shadow: 0.8 },
    { key: 'dr-vaso', x: 580, y: 882, w: 55, shadow: 0.7 },
    { key: 'dr-vaso', x: 926, y: 882, w: 60, shadow: 0.7, flip: true },
    { key: 'dr-floreira', x: 309, y: 955, w: 140, shadow: false },
    { key: 'dr-floreira', x: 1050, y: 955, w: 110, shadow: false },
    { key: 'hf-placa', x: 1470, y: 975, w: 56, shadow: 0.5 }, // placa: → açaiteria, ← mercado
    { key: 'dr-ponto', x: 1280, y: 965, w: 262, shadow: 0.6 },
  ],

  lighting: {
    darkness: 0.16,
    lights: [
      { x: 798, y: 245, r: 150 },
      { x: 862, y: 130, r: 150 },
      { x: 1082, y: 240, r: 150 },
      { x: 1432, y: 225, r: 150 },
      { x: 220, y: 600, r: 170 },
      { x: 1360, y: 610, r: 170 },
      { x: 750, y: 800, r: 220 },
      { x: 382, y: 290, r: 140 },
    ],
  },

  hotspots: [
    { rect: R(0, 760, 46, 960), interact: 'mercado', label: '← Mercado', marker: { x: 0.5, y: 0.5, dir: 'left' }, markerIf: () => QuestSystem.isActive('dq-m5') && !QuestSystem.isObjectiveDone('dq-m5', 'mercado') },
    // portaria do prédio do Weng: seta quando o próximo passo é voltar pro apê
    { rect: R(332, 300, 428, 392), interact: 'portaria', label: 'Apê do Weng', markerIf: () => false },
    { rect: R(1440, 880, 1500, 978), interact: 'placa', label: 'Placa' },
    // saída pra açaiteria: seta enquanto ela ainda não foi
    { rect: R(1490, 770, 1536, 960), interact: 'placa', label: 'Açaiteria →', marker: { x: 0.5, y: 0.5, dir: 'right' }, markerIf: () => QuestSystem.isActive('dq-m5') && !QuestSystem.isObjectiveDone('dq-m5', 'acai') },
    // porta do Multidão: marcador até a Bella entrar pela primeira vez
    { rect: R(615, 820, 895, 880), interact: 'multidao', label: 'Entrar no Multidão', markerIf: () => QuestSystem.isActive('dq-m5') && !QuestSystem.isObjectiveDone('dq-m5', 'compras') },
    { rect: R(1040, 180, 1300, 300), interact: 'teatro', label: 'Teatro' },
    { rect: R(1150, 790, 1410, 965), interact: 'onibus', label: 'Ponto' },
    { rect: R(955, 700, 1150, 882), interact: 'vitrine', label: 'Vitrine' },
  ],

  spawns: {
    portaria: { tx: 7.4, ty: 7.8, facing: 'down' },
    'from-acai': { tx: 30.3, ty: 16.3, facing: 'left' },
    'from-multidao': { tx: 15.2, ty: 18.1, facing: 'down' }, // na calçada, abaixo da porta (fora do gatilho de entrar)
  },
  triggers: [
    { id: 'portaria', rect: R(332, 368, 428, 392), script: 'portaria' },
    { id: 'multidao', rect: R(615, 862, 895, 880), script: 'multidao' },
    { id: 'mercado', rect: R(0, 760, 24, 960), script: 'mercado' },
    { id: 'acai', rect: R(1512, 760, 1536, 960), script: 'acai' },
  ],
  scripts,
  onEnter: 'chegada',
};
