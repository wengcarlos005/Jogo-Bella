import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';

const Q = 'ar-m2';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
const brinquedosFeitos = () => ['carrossel', 'bate', 'argolas'].every((o) => objDone(o));
/** Retângulo no cenário ORIGINAL (art-source/maps/ar-parque.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

async function falta(ctx: ScriptContext): Promise<void> {
  const nomes: Record<string, string> = { carrossel: 'o carrossel', bate: 'o bate-bate', argolas: 'as argolas' };
  const f = Object.keys(nomes).filter((o) => !objDone(o));
  if (f.length) ctx.toast(`Ainda falta: ${f.map((o) => nomes[o]).join(', ')}`);
  else {
    await ctx.wait(300);
    await ctx.say('weng', 'Só falta uma coisa. A roda-gigante. Deixei por último de propósito.');
    ctx.toast('A roda-gigante fica no alto, à esquerda');
  }
}

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (!QuestSystem.isActive(Q) || ctx.flag('ar-parque-chegou')) return;
    ctx.setFlag('ar-parque-chegou');
    await ctx.narrate('Um parquinho de diversões em Araruama, todo aceso, cheio de luzinha colorida.');
    await ctx.say('laylinha', 'CARROSSEL! TIA BELLA, VEM NO CARROSSEL!');
    await ctx.say('mingau', 'Eu vou no bate-bate. Carrossel é coisa de criança.');
    await ctx.say('bella', 'Weng... eu quero ir em TODOS.');
    await ctx.say('weng', 'Então bora em todos. A roda-gigante fica por último.');
    ctx.toast('Brinque no carrossel, no bate-bate e nas argolas');
  },

  async carrossel(ctx) {
    if (!objActive('carrossel')) {
      await ctx.say('bella', 'Os cavalinhos ainda tão girando. A Laylinha foi umas cinco vezes.');
      return;
    }
    await ctx.fadeOut(400);
    await ctx.narrate('Música de caixinha, luzinhas piscando e os cavalinhos subindo e descendo.');
    await ctx.fadeIn(400);
    await ctx.say('laylinha', 'Tia Bella, o meu cavalo é o mais rápido!');
    await ctx.say('bella', 'O meu tá logo atrás! Ele vai te alcançar!');
    await ctx.say('weng', '(no cavalinho do lado, com os joelhos quase no queixo) Eu tô muito grande pra isso.');
    await ctx.say('bella', 'Você tá lindo. Sorri pra foto!');
    ctx.hearts('player', 4);
    ctx.objective(Q, 'carrossel');
    await falta(ctx);
  },

  async bate(ctx) {
    if (!objActive('bate')) {
      await ctx.say('weng', 'Meu pescoço ainda tá doendo da batida do Mingau.');
      return;
    }
    await ctx.fadeOut(400);
    await ctx.narrate('Faísca no teto, cheiro de borracha e todo mundo gritando.');
    await ctx.fadeIn(400);
    await ctx.say('mingau', 'SAI DA FRENTE, WENG!');
    await ctx.say('weng', 'Mingau, eu sou seu primo mais velho, você tem que me respeitar— AI!');
    await ctx.say('bella', 'Hahaha! Bate nele de novo, Mingau!');
    await ctx.say('diego', '(do outro lado da pista) Eu tô preso na parede há três minutos. Alguém me ajuda.');
    ctx.hearts('player', 4);
    ctx.objective(Q, 'bate');
    await falta(ctx);
  },

  async argolas(ctx) {
    if (!objActive('argolas')) {
      await ctx.say('bella', GameState.is('ar-pelucia') ? 'O ursinho laranja tá aqui comigo. Ele vai morar na minha cama.' : 'O chaveirinho de consolação. Eu amei mesmo assim.');
      return;
    }
    await ctx.say('vivian', 'Weng, você vai tentar as argolas? Você nunca ganhou NADA nesse parque.');
    await ctx.say('weng', 'Hoje é diferente. Hoje eu tenho motivação.');
    const r = await ctx.argolas();
    ctx.setFlag('ar-argolas-estrelas', r.stars);
    if (r.prize) {
      ctx.setFlag('ar-pelucia');
      await ctx.say('vivian', 'Não acredito! Ele ganhou! Bella, você é amuleto da sorte!');
      await ctx.say('bella', '(abraçando o ursinho) Ele vai se chamar Araruama.');
    } else {
      await ctx.say('vivian', 'Tradição mantida: o Weng nunca ganha nada nas argolas.');
      await ctx.say('bella', 'Mas o chaveirinho é muito fofo. Vou colocar na minha bolsa.');
    }
    ctx.hearts('player', 6);
    ctx.objective(Q, 'argolas');
    await falta(ctx);
  },

  async roda(ctx) {
    if (!objActive('roda')) {
      await ctx.say('bella', 'A roda-gigante. Lá de cima dava pra ver a lagoa inteira.');
      return;
    }
    if (!brinquedosFeitos()) {
      await ctx.say('weng', 'A roda-gigante é por último. Promete?');
      await falta(ctx);
      return;
    }
    await ctx.say('weng', 'Agora sim. Só eu e você.');
    await ctx.fadeOut(600);
    await ctx.narrate('A cabine subiu devagar. Lá embaixo, as luzes do parque e a lagoa escura.');
    await ctx.narrate('No ponto mais alto, a roda parou por um minuto inteiro.');
    await ctx.say('bella', GameState.is('ar-pelucia') ? '(abraçando o ursinho) Weng, olha a vista!' : 'Weng, olha a vista! Dá pra ver o prédio da tia Tim!');
    await ctx.say('weng', 'Eu tô olhando.');
    await ctx.say('bella', 'Você tá olhando pra mim, não pra vista.');
    await ctx.say('weng', 'É a melhor vista daqui.');
    await ctx.emote('bella', 'heart');
    const c = await ctx.choose('bella', '(Lá no alto, a cidade inteira acesa)', ['"Obrigada por me trazer pra sua família."', '"Esse foi o melhor ano-novo da minha vida."', 'Beijar ele lá no alto']);
    if (c === 0) await ctx.say('weng', 'Ela também é sua agora. Pode ter certeza.');
    else if (c === 1) await ctx.say('weng', 'O primeiro de muitos. Ano que vem tem mais.');
    else {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', '...Pode parar a roda aqui pra sempre.');
    }
    ctx.hearts('player', 12);
    await ctx.memory('mem-ar-02');
    ctx.objective(Q, 'roda');
    await ctx.fadeOut(600);
    await ctx.chapterCard('Fim do Capítulo 4', 'Araruama', 'Ano-novo em família.', 'Continuar', {
      title: 'Ano-novo em família',
      photos: ['memory-ar-01', 'memory-ar-03', 'memory-ar-02'],
      lines: [
        'Ela chegou com medo de ser julgada pela família inteira do Weng.',
        'Teve tour pela cobertura, pedrinha na lagoa e a ceia da tia Tim na mesa giratória.',
        'À meia-noite, os fogos sobre a Lagoa de Araruama, vistos da varanda.',
        'No primeiro dia de 2024: suco no Cosechas, parque de diversões e um beijo no alto da roda-gigante.',
        'Ninguém julgou. A Laylinha chamou ela de tia, e a Anne, de cunhada.',
      ],
    });
    ctx.toast('O Capítulo 5 chega em breve');
    await ctx.fadeIn(600);
  },

  async pipoca(ctx) {
    if (ctx.flag('ar-pipoca')) {
      await ctx.say('bella', 'A pipoca acabou em dez minutos. A Julinha ajudou.');
      return;
    }
    ctx.setFlag('ar-pipoca');
    await ctx.say('weng', 'Uma pipoca doce, por favor. Grande.');
    ctx.sfx('pickup');
    await ctx.say('julinha', 'Posso pegar um pouquinho? Só um pouquinho. Um punhado.');
  },
  async algodao(ctx) {
    await ctx.say('bella', 'Algodão-doce rosa! Igual o do Quitandinha, lembra?');
    await ctx.say('weng', 'Lembro. Você comeu o seu e metade do meu.');
  },
  async churros(ctx) {
    await ctx.say('weng', 'Churros de doce de leite. Depois da roda-gigante, pra não passar mal.');
  },
  async bilheteria(ctx) {
    await ctx.say('bella', 'A bilheteria. A tia Tim comprou ficha pra todo mundo antes de a gente chegar.');
  },
  async baloes(ctx) {
    await ctx.say('bella', 'Um balão pra Laylinha? Ela ia amar o rosa.');
  },
  async saida(ctx) {
    if (QuestSystem.isActive(Q)) {
      await ctx.say('weng', 'Já? Ainda tem brinquedo pra ir!');
      const t = ctx.playerTile();
      await ctx.move('player', t.x, t.y - 1, 60);
      return;
    }
    await ctx.teleport('ar-cobertura', 'porta');
  },
};

/** Capítulo 4 — Araruama: o parque de diversões no primeiro dia de 2024. */
export const parqueMap: MapDef = {
  id: 'ar-parque',
  region: 'araruama',
  name: 'Parque de diversões',
  music: 'parque',
  background: '#1a1430',
  art: 'native',
  ambient: 'fireflies',
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 575, 300), // roda-gigante e cerca
    R(575, 0, 770, 60), // fundo
    R(770, 0, 1536, 385), // pista do bate-bate e cerca
    R(245, 505, 690, 700), // base do carrossel
    R(1085, 385, 1536, 830), // barracas da direita
    R(1380, 300, 1536, 620), // árvores (dir.)
    R(1380, 800, 1536, 1024),
    R(0, 460, 135, 1024), // árvores (esq.)
    R(0, 860, 545, 1024), // cerca de baixo
    R(540, 790, 650, 1024), // pilar do portal (esq.)
    R(885, 790, 995, 1024), // pilar do portal (dir.)
    R(990, 850, 1400, 1024),
    R(650, 990, 885, 1024),
    // postes das luzinhas
    R(8, 610, 38, 640),
    R(603, 180, 630, 200),
    R(748, 675, 778, 700),
    R(1162, 845, 1192, 870),
    R(1070, 505, 1098, 525),
    // objetos soltos: só a base
    R(800, 455, 1080, 505), // barraca das argolas
    R(150, 755, 250, 790), // pipoca
    R(955, 680, 1045, 712), // algodão-doce
    R(400, 800, 485, 830), // bilheteria
    R(330, 760, 365, 780), // balões
    R(815, 640, 905, 670), // churros
  ],

  objects: [
    { key: 'pq-argolas', x: 940, y: 506, w: 300, shadow: 0.5 },
    { key: 'pq-pipoca', x: 200, y: 792, w: 120, shadow: 0.6 },
    { key: 'pq-algodao', x: 1000, y: 714, w: 115, shadow: 0.6 },
    { key: 'pq-churros', x: 860, y: 672, w: 115, shadow: 0.6 },
    { key: 'pq-bilheteria', x: 442, y: 832, w: 105, shadow: 0.6 },
    { key: 'pq-baloes', x: 348, y: 782, w: 62, shadow: 0.4 },
  ],

  overlays: [
    // a cobertura do carrossel passa na frente de quem anda atrás dele
    { x0: 240, y0: 250, x1: 700, y1: 520, base: 700 },
  ],

  npcs: [
    { id: 'laylinha', sprite: 'laylinha', tx: 15.0, ty: 15.4, facing: 'left', interact: 'carrossel' },
    { id: 'mingau', sprite: 'mingau', tx: 19.2, ty: 8.8, facing: 'down', interact: 'bate' },
    { id: 'vivian', sprite: 'vivian', tx: 15.6, ty: 11.2, facing: 'down', interact: 'argolas' },
    { id: 'julinha', sprite: 'julinha', tx: 5.9, ty: 17.0, facing: 'right', interact: 'pipoca' },
    { id: 'diego', sprite: 'diego', tx: 22.8, ty: 9.0, facing: 'down', interact: 'bate' },
  ],

  hotspots: [
    { rect: R(245, 470, 690, 715), interact: 'carrossel', label: 'Carrossel', markerIf: () => objActive('carrossel') },
    { rect: R(770, 280, 1300, 400), interact: 'bate', label: 'Bate-bate', markerIf: () => objActive('bate') },
    { rect: R(800, 400, 1080, 515), interact: 'argolas', label: 'Argolas', markerIf: () => objActive('argolas') },
    { rect: R(100, 200, 460, 315), interact: 'roda', label: 'Roda-gigante', markerIf: () => objActive('roda') && brinquedosFeitos() },
    { rect: R(150, 700, 250, 800), interact: 'pipoca', label: 'Pipoca' },
    { rect: R(955, 620, 1045, 720), interact: 'algodao', label: 'Algodão-doce' },
    { rect: R(815, 590, 905, 680), interact: 'churros', label: 'Churros' },
    { rect: R(400, 740, 485, 840), interact: 'bilheteria', label: 'Bilheteria' },
    { rect: R(320, 700, 370, 790), interact: 'baloes', label: 'Balões' },
  ],

  spawns: {
    entrada: { tx: 16.0, ty: 18.6, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(650, 975, 885, 990), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
