import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';
import { PERSONAL } from '@/data/personal';

const Q = 'ar-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/ar-cobertura.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

/** Os cantinhos da cobertura que a Bella explora logo que chega. */
const CANTOS = ['ar-cozinha', 'ar-mesa', 'ar-varanda'];
const cantoFeito = (f: string) => GameState.is(f);
async function canto(ctx: ScriptContext, flag: string): Promise<void> {
  if (!QuestSystem.isActive(Q) || !objDone('chegar') || objDone('casa') || ctx.flag(flag)) return;
  ctx.setFlag(flag);
  const falta = CANTOS.filter((c) => !cantoFeito(c)).length;
  if (falta) {
    ctx.toast(falta === 1 ? 'Falta 1 cantinho da cobertura' : `Faltam ${falta} cantinhos da cobertura`);
    return;
  }
  await ctx.wait(400);
  await ctx.say('weng', 'Pronto, tour completo. Viu? Ninguém mordeu.');
  await ctx.say('bella', 'A tia Tim já me deu três coisas pra comer e perguntou duas vezes se eu tô com fome.');
  await ctx.say('bella', 'E ninguém ficou me olhando torto. Eu acho.');
  await ctx.say('weng', 'Isso na língua da família quer dizer "a gente gosta de você".');
  ctx.nerves(20);
  ctx.objective(Q, 'casa');
  ctx.toast('À noite, a ceia: a mesa giratória da tia Tim');
}

/** A ceia de ano-novo: a mesa giratória da tia Tim (pato, macarrão de arroz, frango xadrez...). */
async function ceia(ctx: ScriptContext): Promise<void> {
  await ctx.say('weng', 'Tá na hora. Senta do meu lado?');
  await ctx.fadeOut(600);
  await ctx.narrate('31 de dezembro, noite. A mesa redonda lotada e a família inteira em volta.');
  await ctx.narrate('Pato, macarrão de arroz, frango xadrez e mais um monte de coisa que a tia Tim passou o dia fazendo.');
  ctx.follow('weng', false);
  ctx.place('player', 20.6, 17.2, 'up');
  ctx.place('weng', 22.6, 17.2, 'up');
  await ctx.fadeIn(500);
  await ctx.say('tia-tim', 'Todo mundo sentando! Bella, senta aí do lado do Weng. Come, come!');
  await ctx.say('bella', '(cochichando) Weng, como funciona essa mesa? Eu vou derrubar alguma coisa.');
  await ctx.say('weng', '(cochichando) Gira devagar. E sempre olha quem pediu. Você vai arrasar.');
  const r = await ctx.ceia();
  ctx.setFlag('ar-ceia-estrelas', r.stars);
  await ctx.say('tia-tim', 'E aí, Bella? Gostou do pato?');
  const c = await ctx.choose('bella', '(A família inteira olhando pra ela)', ['"Tia, é o melhor pato da minha vida."', '"Posso levar a receita?"', 'Pedir mais um pedaço (o terceiro)']);
  if (c === 0) await ctx.say('tia-tim', 'Ah, essa menina! Pode vir todo ano, viu?');
  else if (c === 1) await ctx.say('tia-tim', 'Receita é segredo de família. Mas se for da família... a gente conversa.');
  else {
    await ctx.say('tia-tim', 'ISSO! Gosto de quem come! Weng, essa aí pode ficar.');
    await ctx.emote('weng', 'heart');
  }
  await ctx.say('anne', r.stars >= 2 ? 'Ela gira essa mesa melhor que você, Weng.' : 'Relaxa, Bella. Até o Weng já derrubou o frango xadrez nessa mesa.');
  await ctx.say('weng', 'Ninguém precisava saber disso, Anne.');
  ctx.nerves(0);
  await ctx.say('bella', '(baixinho) Weng... ninguém me julgou. Eles são muito legais.');
  await ctx.say('weng', 'Eu falei. Agora você é da família, querendo ou não.');
  ctx.hearts('player', 10);
  await ctx.memory('mem-ar-01');
  ctx.objective(Q, 'ceia');
  await ctx.say('weng', 'Faltam quinze minutos pra meia-noite. Bora pra varanda?');
  ctx.follow('weng', true);
  await ctx.fadeOut(500);
  await ctx.teleport('ar-varanda', 'porta');
}

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('ar-chegou')) return;
    ctx.setFlag('ar-chegou');
    ctx.follow('weng', false);
    // os dois entre a porta e o sofá, lado a lado (o sofá começa em x=300 da arte)
    ctx.place('player', 3.6, 12.8, 'right');
    ctx.place('weng', 5.3, 12.8, 'left');
    await ctx.narrate('Véspera do ano-novo de 2024. Araruama.');
    await ctx.narrate('A cobertura dos tios do Weng, de frente pra lagoa.');
    ctx.nerves(80, 'A Bella está nervosa');
    await ctx.say('bella', 'Weng... quantas pessoas tem aí dentro, exatamente?');
    const p = PERSONAL.wengFamily.primos;
    await ctx.say('weng', `Hm... os quatro tios, a tia ${PERSONAL.wengFamily.tia}, a ${PERSONAL.wengFamily.irma}, a ${p[0]}, a ${p[1]}, o ${p[2]}, a ${p[3]}, o ${p[4]}, a ${p[5]}...`);
    await ctx.say('bella', 'Você contou nos dedos. Você precisou CONTAR NOS DEDOS.');
    await ctx.say('weng', 'Você já viu todo mundo antes.');
    await ctx.say('bella', 'Vi, tipo, duas vezes. Eu mal conheço eles direito.');
    await ctx.say('bella', 'E se acharem que eu sou esquisita? E se ficarem me julgando a noite inteira?');
    await ctx.say('weng', 'Ninguém vai te julgar. No máximo vão te dar comida demais.');
    await ctx.say('bella', '...Isso eu aguento.');
    await ctx.narrate('A porta mal fechou e o barulho veio junto: panela no fogo, criança correndo, TV ligada e todo mundo falando ao mesmo tempo.');
    await ctx.say('tia-tim', 'Chegaram! Entra, entra! Bella, tá com fome? Já comeu?');
    await ctx.say('bella', 'Oi, tia Tim! Tô bem, obrigada!');
    await ctx.say('tia-tim', 'Tá magrinha. Hoje à noite tem MUITA comida. Muita. Vai comer até não aguentar.');
    await ctx.emote('bella', 'sweat');
    await ctx.say('weng', '(cochichando) Viu? Ela já te adotou.');
    ctx.nerves(60);
    ctx.follow('weng', true);
    ctx.objective(Q, 'chegar');
    ctx.toast('Conheça a cobertura: a cozinha, a mesa giratória e a varanda');
  },

  async tiaTim(ctx) {
    if (objDone('ceia')) {
      await ctx.say('tia-tim', 'Sobrou pato! Amanhã você leva um pouco pra casa, tá? Não aceito não como resposta.');
      return;
    }
    await ctx.say('tia-tim', 'Tá com fome? Já experimentou o bolinho? Pega mais um, pega!');
    await ctx.say('bella', 'Tia, eu já comi três...');
    await ctx.say('tia-tim', 'Três é pouco! Hoje é ano-novo!');
  },
  async lilian(ctx) {
    if (objDone('ceia')) {
      await ctx.say('lilian', 'Amanhã a gente vai pro parque de diversões. Vocês vêm, né? Vai ser muito bom!');
      return;
    }
    await ctx.say('lilian', 'Bella! Que bom que você veio. Relaxa, a tia Tim fala alto, mas é um amor.');
    await ctx.say('bella', 'Tá tão na cara assim que eu tô nervosa?');
    await ctx.say('lilian', 'Um pouquinho. Mas todo mundo aqui já gosta de você, sério.');
    if (!ctx.flag('ar-lilian')) {
      ctx.setFlag('ar-lilian');
      const n = Number(GameState.getFlag<number>('nervosismo') ?? 0);
      if (n > 0) ctx.nerves(Math.max(0, n - 15));
    }
  },
  async mingau(ctx) {
    if (objDone('ceia')) {
      await ctx.say('mingau', 'Eu comi três pedaços de pato. A Julinha comeu dois. Eu ganhei.');
      return;
    }
    await ctx.say('mingau', 'Oi, Bella. Eu tenho dez anos, tá? Não sou criança que nem a Laylinha.');
    await ctx.say('bella', 'Claro que não. Dez anos é praticamente adulto.');
    await ctx.say('mingau', 'Exatamente. (cochichando) Mas se tiver brigadeiro depois, me avisa.');
  },
  async vivian(ctx) {
    if (objDone('ceia')) {
      await ctx.say('vivian', 'Você girou a mesa melhor que todo mundo aqui! Até a tia Tim ficou impressionada.');
      return;
    }
    await ctx.say('vivian', 'BELLA! Finalmente! O Weng não para de falar de você, sabia?');
    await ctx.say('weng', 'Vivian...');
    await ctx.say('vivian', 'É verdade! "A Bella isso, a Bella aquilo." Desde o ano passado.');
    await ctx.emote('bella', 'heart');
    if (!ctx.flag('ar-vivian')) {
      ctx.setFlag('ar-vivian');
      const n = Number(GameState.getFlag<number>('nervosismo') ?? 0);
      if (n > 0) ctx.nerves(Math.max(0, n - 15));
    }
  },
  async diego(ctx) {
    if (objDone('ceia')) {
      await ctx.say('diego', 'Comi demais. Vou ficar deitado aqui até 2025.');
      return;
    }
    await ctx.say('diego', 'E aí, Bella. Tranquila? Senta aí, fica à vontade. Aqui ninguém repara em nada.');
    await ctx.say('bella', 'Valeu, Diego. Tô tentando.');
    await ctx.say('diego', 'Se a tia Tim oferecer comida, só aceita. É mais fácil.');
  },
  async porta(ctx) {
    await ctx.say('weng', 'Depois a gente desce pra lagoa. Primeiro dá oi pra todo mundo.');
  },
  async quadro(ctx) {
    await ctx.say('bella', 'Lanternas vermelhas e flor de cerejeira. Esse quadro é lindo.');
    await ctx.say('weng', 'A tia Tim diz que dá sorte. E que dá trabalho pra limpar.');
  },
  async gato(ctx) {
    await ctx.say('bella', 'O gatinho da sorte dando tchauzinho! Eu quero um desses lá em casa.');
    await ctx.say('weng', 'A Meli ia derrubar ele da estante em dez minutos.');
  },
  async no(ctx) {
    await ctx.say('bella', 'Esse nó vermelho pendurado na parede também é de sorte?');
    await ctx.say('weng', 'Tudo que é vermelho aqui é de sorte. Se duvidar, até a panela.');
  },
  async relogio(ctx) {
    await ctx.say('bella', 'Ainda faltam umas boas horas pra meia-noite.');
  },
  async fogao(ctx) {
    await ctx.say('bella', 'Tem tanta panela no fogo que parece cozinha de restaurante.');
    await ctx.say('tia-tim', 'Hoje é dia de comida chinesa! Pato, macarrão de arroz, frango xadrez... e mais um monte. Ninguém sai com fome daqui.');
    await ctx.say('bella', 'Tá cheirando muito bem, tia!');
    await ctx.say('tia-tim', 'Então prova esse aqui. Prova! Tá quente, sopra.');
    await ctx.emote('bella', 'heart');
    await canto(ctx, 'ar-cozinha');
  },
  async cooler(ctx) {
    await ctx.say('weng', 'O isopor de gelo. Em ano-novo de família, ele é o objeto mais importante da casa.');
  },
  async mesa(ctx) {
    if (objDone('casa') && objActive('ceia')) return ceia(ctx);
    if (objDone('ceia')) {
      await ctx.say('bella', 'Sobrou pato. Sempre sobra pato. A tia Tim cozinha pro bairro inteiro.');
      return;
    }
    await ctx.say('bella', 'Uma mesa redonda GIGANTE. E o meio dela gira!');
    await ctx.say('weng', 'É pra passar os pratos sem ninguém precisar levantar. Na ceia ela vai estar lotada.');
    await ctx.say('bella', 'E se eu quiser um prato que tá do outro lado?');
    await ctx.say('weng', 'Você gira. Devagar. Se girar rápido demais, alguém perde o bolinho.');
    await canto(ctx, 'ar-mesa');
  },
  async tv(ctx) {
    await ctx.say('bella', 'A TV ligada no especial de fim de ano e ninguém assistindo.');
    await ctx.say('weng', 'Tradição. Ninguém assiste, mas ninguém desliga.');
  },
  async brinquedos(ctx) {
    await ctx.say('bella', 'Brinquedo espalhado pelo chão inteiro. A Laylinha passou por aqui.');
    await ctx.say('weng', 'Cinco anos e a energia de vinte. O Mingau e a Julinha, com dez, já fingem que são grandes demais pra brincar.');
    await ctx.say('weng', 'Cuidado onde pisa. Peça de brinquedo no pé descalço não perdoa.');
  },
  async sofa(ctx) {
    await ctx.say('bella', 'Esse sofá cabe a família inteira. Quase.');
  },
  async varanda(ctx) {
    if (objDone('ceia')) {
      await ctx.teleport('ar-varanda', 'porta');
      return;
    }
    await ctx.say('bella', 'Weng, a varanda dá de frente pra lagoa INTEIRA.');
    await ctx.say('weng', 'À meia-noite os fogos estouram ali na orla. Daqui a gente vê tudo, de camarote.');
    await ctx.say('bella', 'Então já tá reservado: meia-noite, nessa varanda, com você.');
    await canto(ctx, 'ar-varanda');
  },
};

/** Capítulo 4 — Araruama: a cobertura dos tios do Weng, de frente pra lagoa (ano-novo de 2024). */
export const coberturaMap: MapDef = {
  id: 'ar-cobertura',
  region: 'araruama',
  name: 'Cobertura dos tios',
  indoor: true,
  music: 'casa',
  background: '#2a1e2e',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 1536, 200), // paredes do fundo e portas dos quartos
    R(245, 160, 1020, 478), // parede do meio: estante, aparador, quadro e plantas
    R(960, 0, 1020, 478), // ponta da parede da cozinha
    R(1015, 0, 1400, 292), // bancada, fogão, pia e geladeira
    R(1390, 0, 1536, 500), // parede da direita da cozinha
    R(1295, 420, 1390, 488), // plantas da direita
    R(1325, 490, 1536, 800), // rack da TV
    R(1410, 770, 1536, 850), // planta (dir., embaixo)
    R(0, 200, 100, 345), // parede do corredor
    R(0, 345, 160, 410), // parede em cima da porta
    R(0, 410, 125, 1024), // porta de entrada (só pra interagir)
    R(40, 740, 150, 830), // planta (esq., embaixo)
    R(0, 842, 1536, 1024), // portas de vidro da varanda
    // móveis soltos: só a base
    R(860, 650, 1200, 790), // mesa redonda
    R(300, 610, 740, 700), // sofá
    R(420, 745, 590, 800), // mesinha de centro
    R(1205, 390, 1295, 422), // isopor
    R(1252, 588, 1290, 602), // ventilador
    R(160, 785, 305, 822), // brinquedos
  ],

  objects: [
    { key: 'cb-mesa', x: 1030, y: 790, w: 420, shadow: false },
    { key: 'cb-sofa', x: 520, y: 702, w: 470, shadow: false },
    { key: 'cb-mesinha', x: 505, y: 802, w: 200, shadow: false },
    { key: 'cb-cooler', x: 1250, y: 424, w: 105, shadow: false },
    { key: 'cb-ventilador', x: 1271, y: 604, w: 78, shadow: false },
    { key: 'cb-brinquedos', x: 232, y: 824, w: 165, shadow: false },
  ],

  hotspots: [
    { rect: R(60, 400, 200, 690), interact: 'porta', label: 'Porta' },
    { rect: R(590, 380, 845, 500), interact: 'quadro', label: 'Quadro' },
    { rect: R(395, 380, 470, 500), interact: 'gato', label: 'Gatinho da sorte' },
    { rect: R(495, 380, 560, 500), interact: 'no', label: 'Nó vermelho' },
    { rect: R(860, 380, 960, 500), interact: 'relogio', label: 'Relógio' },
    { rect: R(1100, 250, 1220, 340), interact: 'fogao', label: 'Cozinha', markerIf: () => objDone('chegar') && objActive('casa') && !GameState.is('ar-cozinha') },
    { rect: R(1190, 370, 1310, 445), interact: 'cooler', label: 'Isopor' },
    { rect: R(850, 560, 1210, 800), interact: 'mesa', label: 'Mesa', markerIf: () => (objDone('chegar') && objActive('casa') && !GameState.is('ar-mesa')) || (objDone('casa') && objActive('ceia')) },
    { rect: R(1300, 490, 1330, 800), interact: 'tv', label: 'TV' },
    { rect: R(150, 760, 320, 835), interact: 'brinquedos', label: 'Brinquedos' },
    { rect: R(300, 590, 740, 700), interact: 'sofa', label: 'Sofá' },
    { rect: R(560, 815, 1000, 845), interact: 'varanda', label: 'Varanda', markerIf: () => (objDone('chegar') && objActive('casa') && !GameState.is('ar-varanda')) || (objDone('ceia') && objActive('virada')) },
  ],

  npcs: [
    { id: 'tia-tim', sprite: 'tia-tim', tx: 24.0, ty: 7.6, facing: 'up', interact: 'tiaTim', behavior: 'wander', wanderRadius: 1.4, wanderAxis: 'x' },
    { id: 'lilian', sprite: 'lilian', tx: 16.6, ty: 11.6, facing: 'down', interact: 'lilian', behavior: 'wander', wanderRadius: 1.0, wanderAxis: 'x' },
    { id: 'mingau', sprite: 'mingau', tx: 14.6, ty: 16.3, facing: 'left', interact: 'mingau', behavior: 'wander', wanderRadius: 0.8, wanderAxis: 'x' },
    { id: 'vivian', sprite: 'vivian', tx: 26.2, ty: 14.2, facing: 'left', interact: 'vivian' },
    { id: 'diego', sprite: 'diego', tx: 9.6, ty: 11.0, facing: 'down', interact: 'diego' },
  ],

  spawns: {
    porta: { tx: 3.6, ty: 12.8, facing: 'right' },
    // voltando da varanda
    varanda: { tx: 16.5, ty: 16.8, facing: 'up' },
  },
  scripts,
  onEnter: 'chegada',
};
