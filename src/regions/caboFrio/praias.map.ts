import { T } from '@/world/tiles';
import type { MapDef } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { Q, objDone, objActive, R, edgeBlocks } from './shared';

// ====================================================================== Praia do Peró
const peroScripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('cf-pero-chegou')) return;
    ctx.setFlag('cf-pero-chegou');
    await ctx.narrate('Praia do Peró: areia branquinha, duna, restinga e um mar de cartão-postal.');
    await ctx.say('bella', 'Weng... a água é verde-azulada. Tipo aquarela.');
    await ctx.say('weng', 'E gelada. Cabo Frio é famosa pela água gelada.');
    await ctx.say('felipe', 'Roda de altinha! Todo mundo em círculo! Bella, vem!');
    await ctx.say('bella', 'Eu não sei jogar altinha!');
    await ctx.say('puggian', 'Ninguém sabe. Por isso é divertido.');
    ctx.toast('Entre na roda de altinha (a bola na areia)');
  },
  async bola(ctx) {
    if (!objActive('pero')) {
      await ctx.say('bella', 'Mais uma rodada? ...Não, meu pé tá pedindo arrego.');
      return;
    }
    const r = await ctx.altinha();
    ctx.setFlag('cf-altinha-estrelas', r.stars);
    await ctx.narrate('Depois da altinha, todo mundo correu pro mar. A água gelada arrancou um grito coletivo.');
    await ctx.say('vitoria', 'GELADA! GELADA! POR QUE NINGUÉM AVISOU?!');
    await ctx.say('weng', 'Eu avisei.');
    await ctx.say('bella', '(abraçando o Weng na água) Você é quentinho. Fica aqui.');
    ctx.hearts('player', 6);
    ctx.objective(Q, 'pero');
    await ctx.say('nathan', 'Bora pra casa? Hoje é noite da pizza!');
    ctx.toast('Volte pra casa pela passarela');
  },
  async passarela(ctx) {
    if (objActive('pero')) {
      await ctx.say('weng', 'Já? A gente nem jogou altinha ainda.');
      return;
    }
    await ctx.teleport('cf-casa', 'porta');
  },
  async talk(ctx) {
    const f: [string, string][] = [
      ['nathan', 'Peró é a praia mais bonita de Cabo Frio. Fato.'],
      ['ruan', 'Eu vou ficar aqui na sombra. Bronzeado é superestimado.'],
      ['vitoria', 'Me passa o protetor? E não deixa o Nathan esquecer o dele.'],
      ['felipe', 'Eu juro que eu sei fazer embaixadinha. Juro.'],
      ['puggian', 'Quem trouxe o isopor? ...Ninguém trouxe o isopor?'],
    ];
    const n = Number(ctx.flag('cf-pero-n') || 0);
    ctx.setFlag('cf-pero-n', (n + 1) % f.length);
    await ctx.say(...f[n % f.length]);
  },
};
const peroWater = (x: number) => 745 - x * 0.2;
export const cfPeroMap: MapDef = {
  id: 'cf-pero',
  region: 'cabo-frio',
  name: 'Praia do Peró',
  music: 'parque',
  background: '#2a8ac8',
  art: 'native',
  glints: [R(0, 860, 1536, 1024), R(500, 690, 1536, 860), R(1120, 560, 1536, 690)],
  birds: { y0: 50, y1: 260 },
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),
  blocks: [
    ...edgeBlocks(() => 290, (x) => (x < 1150 ? peroWater(x) : null)),
    R(1150, 250, 1536, 1024), // pedras e morro da direita
  ],
  objects: [
    { key: 'cf-guardasol1', x: 470, y: 470, w: 170, shadow: 0.9 },
    { key: 'cf-guardasol2', x: 900, y: 430, w: 170, shadow: 0.9 },
    { key: 'cf-isopor', x: 560, y: 470, w: 95, shadow: 0.6 },
    { key: 'cf-chinelos', x: 380, y: 480, w: 90, flat: true, shadow: false },
    { key: 'cf-bola', x: 700, y: 540, w: 34, shadow: 0.5 },
  ],
  npcs: [
    { id: 'nathan', sprite: 'nathan', tx: 600 / 48, ty: 520 / 48, facing: 'right', interact: 'talk' },
    { id: 'vitoria', sprite: 'vitoria', tx: 560 / 48, ty: 585 / 48, facing: 'right', interact: 'talk' },
    { id: 'felipe', sprite: 'felipe', tx: 790 / 48, ty: 505 / 48, facing: 'down', interact: 'talk' },
    { id: 'ruan', sprite: 'ruan', tx: 900 / 48, ty: 465 / 48, facing: 'down', interact: 'talk' },
    { id: 'puggian', sprite: 'puggian', tx: 820 / 48, ty: 590 / 48, facing: 'left', interact: 'talk' },
  ],
  hotspots: [
    { rect: R(660, 500, 740, 570), interact: 'bola', label: 'Altinha', markerIf: () => objActive('pero') },
    { rect: R(280, 270, 470, 330), interact: 'passarela', label: 'Passarela', markerIf: () => objDone('pero') && objActive('pizza') },
  ],
  spawns: { chegada: { tx: 380 / 48, ty: 350 / 48, facing: 'down' } },
  scripts: peroScripts,
  onEnter: 'chegada',
};

// ====================================================================== Praia do Japonês
const japScripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('cf-jap-chegou')) return;
    ctx.setFlag('cf-jap-chegou');
    await ctx.narrate('Praia do Japonês: uma enseada pequena, água parada e transparente feito piscina natural.');
    await ctx.say('bella', 'Dá pra ver o fundo! Dá pra ver as pedrinhas!');
    await ctx.say('nathan', 'E aquela ilha ali? Dizem que dá pra ir andando pela faixa de areia.');
    await ctx.say('bella', 'Andando... dentro da água?');
    await ctx.say('weng', 'É rasinho. Mas primeiro: churrasco!');
    ctx.toast('Ajude no churrasco (a churrasqueira na areia)');
  },
  async churrasco(ctx) {
    if (!objActive('japones')) {
      await ctx.say('puggian', 'Sobrou farofa. Sempre sobra farofa.');
      return;
    }
    await ctx.say('puggian', 'Eu sou o churrasqueiro oficial. Alguém me ajuda no espeto?');
    const c = await ctx.choose('weng', '(A churrasqueira portátil soltando fumaça)', ['Ajudar no espeto', 'Ficar responsável pela farofa', 'Segurar o guarda-sol pro churrasqueiro']);
    if (c === 0) await ctx.say('puggian', 'Isso! Vira devagar, sem pressa. Opa, essa queimou. Essa é sua.');
    else if (c === 1) await ctx.say('bella', 'Farofa é a parte mais importante. Ninguém discute.');
    else await ctx.say('puggian', 'Que serviço de luxo! Churrasqueiro na sombra!');
    await ctx.narrate('Espetinho, pão de alho, farofa e o isopor de gelo. Comendo na areia, com o pé na água.');
    await ctx.say('felipe', 'Esse é o melhor churrasco da história do Brasil.');
    await ctx.say('ruan', 'É o primeiro churrasco na areia da sua vida.');
    await ctx.say('felipe', 'Por isso mesmo.');
    ctx.hearts('player', 6);
    ctx.objective(Q, 'japones');
    await ctx.say('nathan', 'Agora: a ilha! Quem vai comigo?');
    ctx.toast('A travessia começa na faixa de areia dentro da água');
  },
  async faixa(ctx) {
    if (!objDone('japones')) {
      await ctx.say('weng', 'Primeiro o churrasco, depois a aventura.');
      return;
    }
    if (objDone('ilha')) {
      await ctx.say('bella', 'Eu atravessei aquilo. EU. Alguém me dá uma medalha.');
      return;
    }
    await ctx.say('bella', 'Weng. Isso é água. Tem coisa embaixo. Tem bicho.');
    await ctx.say('weng', 'É areia. Rasinho. Eu seguro sua mão o caminho todo.');
    await ctx.say('bella', 'E se ficar fundo? E se tiver concha? E se tiver SIRI?');
    await ctx.say('vitoria', 'Bella, eu vou junto! Se tiver siri eu grito primeiro.');
    const r = await ctx.travessia();
    ctx.setFlag('cf-travessia-estrelas', r.stars);
    await ctx.fadeOut(500);
    await ctx.narrate('Na ilha: pedra quente, uma moitinha de sombra e a enseada inteira lá embaixo, verde-água.');
    await ctx.fadeIn(500);
    await ctx.say('bella', 'Valeu a pena. Valeu MUITO a pena.');
    await ctx.say('weng', 'Eu falei que era rasinho.');
    await ctx.say('bella', 'Tinha um siri. Ele olhou pra mim.');
    if (!ctx.has('concha-ilha')) {
      await ctx.say('weng', 'Olha o que eu achei na pedra. Pra você, corajosa.');
      await ctx.give('concha-ilha', 1, false, 'O Weng te deu');
    }
    const c = await ctx.choose('bella', '(Sentados na pedra da ilha, a turma boiando lá embaixo)', ['Ficar mais um pouco, só os dois', 'Gritar pra turma vir também', 'Tirar uma foto da enseada']);
    if (c === 0) {
      await ctx.narrate('Ficaram um tempão ali, sem falar nada, vendo a água mudar de cor com o sol.');
      await ctx.say('weng', 'Último dia do ano. E eu tô exatamente onde queria estar.');
      await ctx.emote('bella', 'heart');
    } else if (c === 1) {
      await ctx.say('felipe', 'TÔ INDO! ...Ai, concha! Tô indo mais devagar!');
    } else await ctx.photo('A enseada do Japonês, vista da ilha');
    ctx.hearts('player', 10);
    ctx.objective(Q, 'ilha');
    await ctx.say('nathan', 'Gente, bora? Ainda tem banho, roupa branca, e a virada!');
    await ctx.fadeOut(600);
    await ctx.narrate('A volta pela faixa de areia foi bem mais rápida. A Bella ia na frente.');
    ctx.setFlag('cf-noite2');
    await ctx.teleport('cf-casa', 'porta');
  },
  async talk(ctx) {
    const f: [string, string][] = [
      ['nathan', 'Água parada desse jeito, nem parece mar.'],
      ['vitoria', 'Bella, olha os peixinhos! Ali, perto da pedra!'],
      ['ruan', 'Eu vou boiar aqui até o ano que vem.'],
      ['felipe', 'Eu vi um siri. Pequeno. Mas vi.'],
      ['puggian', 'Espetinho tá saindo! Quem quer?'],
    ];
    const n = Number(ctx.flag('cf-jap-n') || 0);
    ctx.setFlag('cf-jap-n', (n + 1) % f.length);
    await ctx.say(...f[n % f.length]);
  },
};
/** Até onde vai a areia (à direita é água), por altura. */
const japSand = (y: number) => (y < 330 ? 0 : y < 400 ? 420 : y < 520 ? 330 : y < 640 ? 300 : y < 740 ? 360 : y < 820 ? 470 : 0);
export const cfJaponesMap: MapDef = {
  id: 'cf-japones',
  region: 'cabo-frio',
  name: 'Praia do Japonês',
  music: 'parque',
  background: '#2fb3c8',
  art: 'native',
  glints: [R(580, 380, 1250, 700), R(1260, 260, 1536, 700), R(740, 880, 1536, 1024)],
  birds: { y0: 40, y1: 220 },
  smoke: [{ x: 200, y: 505 }],
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),
  blocks: [
    R(0, 0, 1536, 310), // morro e pedras de cima
    R(0, 310, 85, 720), // pedras e mato da esquerda
    R(0, 720, 330, 1024), // pedras de baixo
    R(330, 840, 1536, 1024),
    ...Array.from({ length: 11 }, (_, i) => {
      const y = 310 + i * 48;
      return R(Math.max(330, japSand(y + 24) || 330), y, 1536, y + 48);
    }),
  ],
  objects: [
    { key: 'cf-guardasol3', x: 300, y: 470, w: 170, shadow: 0.9 },
    { key: 'cf-churrasqueira', x: 200, y: 560, w: 100, shadow: 0.6 },
    { key: 'cf-mesaplastico', x: 175, y: 680, w: 110, shadow: 0.6 },
    { key: 'cf-isopor', x: 270, y: 620, w: 90, shadow: 0.6 },
  ],
  npcs: [
    { id: 'puggian', sprite: 'puggian', tx: 130 / 48, ty: 560 / 48, facing: 'right', interact: 'churrasco' },
    { id: 'nathan', sprite: 'nathan', tx: 290 / 48, ty: 400 / 48, facing: 'down', interact: 'talk' },
    { id: 'vitoria', sprite: 'vitoria', tx: 245 / 48, ty: 410 / 48, facing: 'down', interact: 'talk' },
    { id: 'ruan', sprite: 'ruan', tx: 300 / 48, ty: 720 / 48, facing: 'up', interact: 'talk' },
    { id: 'felipe', sprite: 'felipe', tx: 350 / 48, ty: 770 / 48, facing: 'right', interact: 'talk' },
  ],
  hotspots: [
    { rect: R(140, 500, 260, 580), interact: 'churrasco', label: 'Churrasco', markerIf: () => objActive('japones') },
    { rect: R(380, 760, 500, 830), interact: 'faixa', label: 'Faixa de areia', markerIf: () => objDone('japones') && objActive('ilha') },
  ],
  spawns: { chegada: { tx: 200 / 48, ty: 380 / 48, facing: 'down' } },
  scripts: japScripts,
  onEnter: 'chegada',
};

// ====================================================================== Praia do Forte (virada)
const forteScripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (objDone('virada') || ctx.flag('cf-forte-chegou')) return;
    ctx.setFlag('cf-forte-chegou');
    await ctx.narrate('Praia do Forte, 23h54. A orla lotada, todo mundo de branco, o forte iluminado nas pedras.');
    await ctx.say('bella', 'A gente CONSEGUIU. Andando. E de carona com um desconhecido muito gente boa.');
    await ctx.say('weng', 'Ele até desejou feliz ano-novo pra gente.');
    await ctx.say('vitoria', 'Gente, meu tênis branco tá cinza.');
    await ctx.say('nathan', 'Seis minutos! Todo mundo junto!');
    await ctx.say('familia', 'DEZ! NOVE! OITO...');
    const r = await ctx.fogos({ year: '2025', bg: 'map-cf-forte-bg', water: 'no mar' });
    ctx.setFlag('cf-fogos-estrelas', r.stars);
    await ctx.narrate('Os fogos explodiram sobre o mar de Cabo Frio. A turma inteira pulando, gritando e se abraçando na areia.');
    const c = await ctx.choose('bella', '(Meia-noite, suada, descalça e de branco)', ['"Melhor virada. A gente andou cinco quilômetros por ela."', '"Feliz ano novo, amor."', 'Beijar ele antes de qualquer palavra']);
    if (c === 0) await ctx.say('weng', 'Três. A carona fez o resto. Mas eu conto como cinco.');
    else if (c === 1) await ctx.say('weng', 'Feliz ano novo, Bella. O segundo juntos.');
    else {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', '...Esse foi o melhor jeito de começar o ano.');
    }
    await ctx.say('felipe', 'FELIZ 2025, GALERA!');
    await ctx.say('ruan', 'E agora, como a gente volta?');
    await ctx.say('nathan', '...Uber?');
    await ctx.say('bella', 'NÃO.');
    ctx.hearts('player', 14);
    if (ctx.hasArt('memory-cf-03')) await ctx.memory('mem-cf-03');
    ctx.objective(Q, 'virada');
    await ctx.fadeOut(800);
    await ctx.chapterCard('Fim do Capítulo 7', 'Cabo Frio', 'A virada a pé.', 'Continuar', {
      title: 'A virada a pé',
      photos: ['memory-cf-01', 'memory-cf-02', 'memory-cf-03'].filter((k) => ctx.hasArt(k)),
      lines: [
        'Uma casa de praia em Peró com a turma: Nathan, Vitória, Ruan, Felipe e Puggian.',
        'Altinha na areia, pizza com queijo esticando e a última fatia dividida.',
        'Churrasco no Japonês e a travessia até a ilha (com um siri muito encarador).',
        'Nenhum Uber aceitou. Três quilômetros a pé, uma carona e a virada na Praia do Forte.',
      ],
    });
    ctx.toast('O Capítulo 8 chega em breve');
    await ctx.fadeIn(600);
  },
  async talk(ctx) {
    await ctx.say('vitoria', objDone('virada') ? 'Feliz 2025! Meu pé dói e eu tô muito feliz.' : 'Rápido, rápido, tá quase!');
  },
};
const forteWater = (x: number) => 640 - x * 0.17;
export const cfForteMap: MapDef = {
  id: 'cf-forte',
  region: 'cabo-frio',
  name: 'Praia do Forte',
  music: 'parque',
  background: '#0e1838',
  art: 'native',
  lighting: {
    darkness: 0.12,
    color: 0x101848,
    lights: [
      { x: 280, y: 173, r: 140 }, { x: 757, y: 153, r: 140 }, { x: 971, y: 167, r: 130 }, { x: 1273, y: 173, r: 120 }, { x: 1380, y: 180, r: 110 },
      { x: 60, y: 240, r: 90 }, { x: 200, y: 245, r: 90 }, { x: 340, y: 238, r: 90 }, { x: 480, y: 230, r: 90 }, { x: 620, y: 222, r: 90 },
      { x: 1240, y: 467, r: 110 }, { x: 1383, y: 517, r: 110 }, { x: 1507, y: 509, r: 100 },
      { x: 1367, y: 40, r: 180, color: 0xbfd8ff },
    ],
  },
  glints: [R(300, 640, 1500, 1024), R(700, 520, 1180, 640)],
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),
  blocks: [...edgeBlocks(() => 335, (x) => (x < 1100 ? forteWater(x) : null)), R(1100, 250, 1536, 1024)],
  npcs: [
    { id: 'nathan', sprite: 'nathan', tx: 500 / 48, ty: 420 / 48, facing: 'down', interact: 'talk' },
    { id: 'vitoria', sprite: 'vitoria', tx: 550 / 48, ty: 430 / 48, facing: 'down', interact: 'talk' },
    { id: 'ruan', sprite: 'ruan', tx: 640 / 48, ty: 410 / 48, facing: 'down', interact: 'talk' },
    { id: 'felipe', sprite: 'felipe', tx: 720 / 48, ty: 420 / 48, facing: 'down', interact: 'talk' },
    { id: 'puggian', sprite: 'puggian', tx: 790 / 48, ty: 400 / 48, facing: 'down', interact: 'talk' },
  ],
  spawns: { chegada: { tx: 330 / 48, ty: 430 / 48, facing: 'down' } },
  scripts: forteScripts,
  onEnter: 'chegada',
};
