import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'ar-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/ar-varanda.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (!objActive('virada') || ctx.flag('ar-varanda-chegou')) return;
    ctx.setFlag('ar-varanda-chegou');
    await ctx.narrate('23:55. A família inteira espremida na varanda, com taça na mão e a lagoa toda iluminada lá embaixo.');
    await ctx.say('tia-tim', 'Faltam cinco minutos! Ninguém some, hein! Todo mundo junto na hora da virada!');
    await ctx.say('bella', 'Weng... daqui dá pra ver a orla inteira.');
    await ctx.say('weng', 'Eu falei que era camarote. Vem, vamos lá na frente, no vidro.');
    ctx.toast('Vá até o guarda-corpo, de frente pra lagoa');
  },

  async guarda(ctx) {
    if (!objActive('virada')) {
      await ctx.say('bella', 'A lagoa de noite, com as luzinhas da orla refletindo. Eu podia ficar aqui pra sempre.');
      return;
    }
    ctx.follow('weng', false);
    const t = ctx.playerTile();
    ctx.place('weng', t.x + 1.8, t.y, 'up');
    ctx.face('player', 'up');
    await ctx.say('bella', 'Weng, eu tava com tanto medo hoje cedo.');
    await ctx.say('weng', 'E agora?');
    await ctx.say('bella', 'Agora eu tô na varanda da sua família, cheia de pato, esperando os fogos com você. Tô ótima.');
    await ctx.say('familia', 'DEZ! NOVE! OITO...');
    const r = await ctx.fogos();
    ctx.setFlag('ar-fogos-estrelas', r.stars);
    ctx.setFlag('ar-fogos-fotos', r.photos);
    ctx.vignette('fg-casal');
    await ctx.narrate('Os fogos sobre a Lagoa de Araruama. A família inteira gritando, se abraçando, brindando.');
    const c = await ctx.choose('bella', '(Um pedido de ano-novo)', ['Pedir mais um ano inteiro assim, com ele', 'Pedir pra nunca mais ter medo de ser eu mesma', 'Não contar o pedido pra ninguém']);
    if (c === 0) await ctx.say('bella', 'Pedi mais um ano inteiro assim. Com você. E o outro. E o outro.');
    else if (c === 1) await ctx.say('bella', 'Pedi pra nunca mais ter medo de ser eu mesma. Hoje deu certo.');
    else await ctx.say('bella', '...Segredo. Mas tem você nele.');
    await ctx.say('weng', 'Feliz 2024, Bella.');
    await ctx.emote('bella', 'heart');
    ctx.hearts('player', 14);
    ctx.vignette(null);
    await ctx.say('tia-tim', 'Feliz ano-novo! Bella, vem cá, me dá um abraço. Agora você é da família, viu? Volta sempre!');
    await ctx.say('anne', 'Feliz ano-novo, cunhada!');
    await ctx.say('bella', '(sussurrando pro Weng) Ela me chamou de cunhada.');
    await ctx.say('weng', 'Eu ouvi. Pode se acostumar.');
    await ctx.memory('mem-ar-03');
    ctx.objective(Q, 'virada');
    ctx.follow('weng', true);
    ctx.toast('Continua em breve: a praia da lagoa, o Cosechas e o parque de diversões');
  },

  async churrasqueira(ctx) {
    await ctx.say('weng', 'A churrasqueira da varanda. Amanhã tem churrasco de ano-novo, pode apostar.');
  },
  async rede(ctx) {
    await ctx.say('bella', 'Uma rede! Depois da meia-noite eu vou dormir aqui e ninguém me tira.');
  },
  async mesaFrutas(ctx) {
    await ctx.say('bella', 'Uva, melancia, abacaxi... e romã? Tem que comer sete caroços de romã pra dar sorte.');
    await ctx.say('weng', 'Na minha família é tangerina. Em ano-novo, quanto mais tangerina, mais sorte.');
  },
  async cooler(ctx) {
    await ctx.say('weng', 'O espumante tá no gelo. A tia Tim contou as taças três vezes.');
  },
  async tiaTim(ctx) {
    await ctx.say('tia-tim', objDone('virada') ? 'Feliz ano-novo, minha filha! Agora come uma uva, que dá sorte.' : 'Já pegou a taça? Daqui a pouco é meia-noite!');
  },
  async lilian(ctx) {
    await ctx.say('lilian', objDone('virada') ? 'Feliz 2024, Bella! Tirou foto do coração? Me manda depois!' : 'Daqui é a melhor vista dos fogos de Araruama. Todo ano a gente briga pelo lugar no vidro.');
  },
  async mingau(ctx) {
    await ctx.say('mingau', objDone('virada') ? 'Eu vi o coração! Eu vi primeiro! Ninguém acredita em mim.' : 'Eu vou ficar acordado até meia-noite. Eu SEMPRE fico. (bocejo)');
  },
  async vivian(ctx) {
    await ctx.say('vivian', objDone('virada') ? 'Feliz ano-novo, Bella! Ano que vem você vem de novo, combinado?' : 'Bora tirar uma foto todo mundo junto antes da virada? Weng, sai do canto!');
  },
  async diego(ctx) {
    await ctx.say('diego', objDone('virada') ? 'Ano novo, churrasco novo. Amanhã eu ligo essa churrasqueira.' : 'Tô de olho na churrasqueira. Amanhã ela trabalha.');
  },
  async anne(ctx) {
    await ctx.say('anne', objDone('virada') ? 'Feliz ano-novo, cunhada! Cuida bem do meu irmão, tá?' : 'Se a Laylinha dormir antes da meia-noite, ninguém acorda ela. Combinado geral.');
  },
  async julinha(ctx) {
    await ctx.say('julinha', objDone('virada') ? 'Eu pulei sete vezes! Ou oito. O Mingau atrapalhou a conta.' : 'Eu vou pular sete vezes na hora da virada. Dá sorte!');
  },
  async laylinha(ctx) {
    await ctx.say('laylinha', objDone('virada') ? 'Os fogos fizeram BUM! E um coração! Eu vi, tia Bella!' : 'Já é meia-noite? E agora? E agora?');
  },
  async portas(ctx) {
    await ctx.teleport('ar-cobertura', 'varanda');
  },
};

/** Capítulo 4 — Araruama: a varanda da cobertura, de frente pra lagoa (virada de 2024). */
export const varandaMap: MapDef = {
  id: 'ar-varanda',
  region: 'araruama',
  name: 'Varanda da cobertura',
  music: 'casa',
  background: '#0e1430',
  art: 'native',
  ambient: 'fireflies',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 1536, 252), // portas de vidro e parede do fundo
    R(0, 0, 62, 1024), // parede da esquerda
    R(62, 40, 305, 335), // churrasqueira e pia
    R(62, 335, 205, 430), // bancada (canto inclinado)
    R(20, 560, 135, 625), // planta (esq.)
    R(1345, 250, 1445, 335), // planta (dir., em cima)
    R(1400, 560, 1515, 625), // planta (dir., embaixo)
    R(1440, 0, 1536, 470), // parede da direita (em cima)
    R(1478, 470, 1536, 1024), // parede da direita (embaixo)
    R(0, 628, 1536, 1024), // guarda-corpo de vidro e a vista
    // móveis soltos: só a base
    R(560, 368, 960, 432), // mesa de frutas
    R(1085, 470, 1355, 522), // rede
    R(318, 500, 442, 560), // espreguiçadeira
    R(1250, 300, 1350, 334), // isopor
  ],

  objects: [
    { key: 'vr-mesa', x: 760, y: 434, w: 420, shadow: false },
    { key: 'vr-cadeira', x: 520, y: 424, w: 80, shadow: false },
    { key: 'vr-cadeira', x: 1000, y: 424, w: 80, shadow: false, flip: true },
    { key: 'vr-rede', x: 1220, y: 524, w: 300, shadow: false },
    { key: 'vr-espreguicadeira', x: 380, y: 562, w: 135, shadow: false },
    { key: 'vr-cooler', x: 1300, y: 336, w: 105, shadow: false },
  ],

  hotspots: [
    { rect: R(380, 560, 1150, 628), interact: 'guarda', label: 'Guarda-corpo', markerIf: () => objActive('virada') },
    { rect: R(62, 40, 305, 430), interact: 'churrasqueira', label: 'Churrasqueira' },
    { rect: R(1080, 460, 1360, 530), interact: 'rede', label: 'Rede' },
    { rect: R(550, 330, 970, 440), interact: 'mesaFrutas', label: 'Mesa de frutas' },
    { rect: R(1240, 290, 1360, 340), interact: 'cooler', label: 'Isopor' },
  ],

  npcs: [
    { id: 'tia-tim', sprite: 'tia-tim', tx: 13.2, ty: 10.2, facing: 'down', interact: 'tiaTim' },
    { id: 'lilian', sprite: 'lilian', tx: 20.6, ty: 10.4, facing: 'down', interact: 'lilian' },
    { id: 'mingau', sprite: 'mingau', tx: 10.6, ty: 12.4, facing: 'down', interact: 'mingau' },
    { id: 'vivian', sprite: 'vivian', tx: 29.0, ty: 8.4, facing: 'left', interact: 'vivian' },
    { id: 'diego', sprite: 'diego', tx: 6.8, ty: 8.6, facing: 'left', interact: 'diego' },
    { id: 'anne', sprite: 'anne', tx: 9.6, ty: 7.0, facing: 'down', interact: 'anne' },
    { id: 'julinha', sprite: 'julinha', tx: 12.4, ty: 12.4, facing: 'down', interact: 'julinha' },
    { id: 'laylinha', sprite: 'laylinha', tx: 15.2, ty: 11.2, facing: 'down', interact: 'laylinha' },
  ],

  spawns: {
    // ao lado da mesa de frutas (na frente das portas da direita)
    porta: { tx: 23.5, ty: 6.6, facing: 'down' },
  },
  triggers: [{ id: 'portas', rect: R(390, 252, 1240, 268), script: 'portas' }],
  scripts,
  onEnter: 'chegada',
};
