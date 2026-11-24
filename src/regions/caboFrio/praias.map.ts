import { GameState } from '@/core/GameState';
import { T } from '@/world/tiles';
import type { MapDef } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { Q, objDone, objActive, R, edgeBlocks } from './shared';

/** Conversa de cada amigo: cada um tem as suas falas e elas vão se alternando. */
function falas(prefix: string, linhas: Record<string, string[]>): Record<string, Script> {
  const out: Record<string, Script> = {};
  for (const [who, f] of Object.entries(linhas)) {
    out[`${who}Talk`] = async (ctx) => {
      const k = `${prefix}-${who}-n`;
      const n = Number(GameState.getFlag<number>(k) ?? 0);
      ctx.setFlag(k, (n + 1) % f.length);
      await ctx.say(who, f[n % f.length]);
    };
  }
  return out;
}

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
    await ctx.emote('weng', 'heart');
    await ctx.say('weng', 'Não saio. Nem se a água ficar mais gelada.');
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
  // cada um fala por si (antes, falar com o Nathan podia mostrar a fala do Ruan)
  ...falas('cf-pero', {
    nathan: ['Peró é a praia mais bonita de Cabo Frio. Fato.', 'A Vitória disse que eu tô vermelho. Eu tô bronzeado. É diferente.'],
    ruan: ['Eu vou ficar aqui na sombra. Bronzeado é superestimado.', 'Altinha é bonito de ver. Daqui. Sentado.'],
    vitoria: ['Me passa o protetor? E não deixa o Nathan esquecer o dele.', 'Bella, essa água verde! Parece filtro de foto, mas é de verdade.'],
    felipe: ['Eu juro que eu sei fazer embaixadinha. Juro.', 'Se a bola cair no mar, quem busca é o Weng. Regra da casa.'],
    puggian: ['Quem deixou o isopor aberto? ...Ninguém? Ninguém assume?', 'Tem gelo pra dois dias. Se ninguém sentar em cima do isopor.'],
  }),
  async mar(ctx) {
    await ctx.say('bella', objDone('pero') ? 'Eu entrei. Eu gritei. Eu entraria de novo.' : 'Essa água deve ser um gelo. Mas olha essa cor...');
  },
  async duna(ctx) {
    await ctx.say('weng', 'A duna e a restinga. Dizem que de lá de cima dá pra ver a praia inteira.');
    await ctx.say('bella', 'Depois. Agora eu quero areia no pé.');
  },
  async pedras(ctx) {
    await ctx.say('bella', 'As pedras do canto da praia. Parece que alguém empilhou com cuidado.');
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
    { key: 'cf-guardasol1', x: 470, y: 470, w: 170, shadow: 0.9, solid: 0.12 },
    { key: 'cf-guardasol2', x: 900, y: 430, w: 170, shadow: 0.9, solid: 0.12 },
    { key: 'cf-isopor', x: 560, y: 470, w: 95, shadow: 0.6, solid: 0.8 },
    { key: 'cf-chinelos', x: 380, y: 480, w: 90, flat: true, shadow: false },
    { key: 'cf-bola', x: 700, y: 540, w: 34, shadow: 0.5, solid: 0.8 },
  ],
  npcs: [
    { id: 'nathan', sprite: 'nathan', tx: 600 / 48, ty: 520 / 48, facing: 'right', interact: 'nathanTalk' },
    { id: 'vitoria', sprite: 'vitoria', tx: 560 / 48, ty: 585 / 48, facing: 'right', interact: 'vitoriaTalk' },
    { id: 'felipe', sprite: 'felipe', tx: 790 / 48, ty: 505 / 48, facing: 'down', interact: 'felipeTalk' },
    { id: 'ruan', sprite: 'ruan', tx: 900 / 48, ty: 465 / 48, facing: 'down', interact: 'ruanTalk' },
    { id: 'puggian', sprite: 'puggian', tx: 820 / 48, ty: 590 / 48, facing: 'left', interact: 'puggianTalk' },
  ],
  hotspots: [
    { rect: R(660, 500, 740, 570), interact: 'bola', label: 'Altinha', markerIf: () => objActive('pero') },
    { rect: R(280, 270, 470, 330), interact: 'passarela', label: 'Passarela', markerIf: () => objDone('pero') && objActive('pizza') },
    { rect: R(200, 625, 700, 690), interact: 'mar', label: 'Mar' },
    { rect: R(560, 240, 1100, 300), interact: 'duna', label: 'Duna' },
    { rect: R(1100, 300, 1170, 460), interact: 'pedras', label: 'Pedras' },
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
    // os dois lá em cima da ilhota (onde a faixa de areia chega), olhando a enseada
    ctx.follow('weng', false);
    ctx.place('player', 24.7, 16.4, 'left');
    ctx.place('weng', 26.5, 16.3, 'left');
    ctx.letterbox(true);
    ctx.weather('sunset');
    await ctx.narrate('Na ilha: pedra quente, uma moitinha de sombra e a enseada inteira lá embaixo, verde-água. O sol começando a baixar.');
    await ctx.fadeIn(500);
    await ctx.focus(25.6, 15.8, 1.35, 900);
    await ctx.emote('bella', 'exclaim');
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
      ctx.face('weng', 'left');
      ctx.face('player', 'right');
      await ctx.say('weng', 'Último dia do ano. E eu tô exatamente onde queria estar.');
      await ctx.emote('bella', 'heart');
      await ctx.say('bella', 'Eu também. Com siri e tudo.');
    } else if (c === 1) {
      await ctx.say('felipe', 'TÔ INDO! ...Ai, concha! Tô indo mais devagar!');
    } else await ctx.photo('A enseada do Japonês, vista da ilha');
    ctx.hearts('player', 10);
    ctx.objective(Q, 'ilha');
    await ctx.say('nathan', '(lá da areia) Gente, bora? Ainda tem banho, roupa branca e a virada!');
    await ctx.fadeOut(600);
    ctx.letterbox(false);
    await ctx.unfocus(10);
    await ctx.narrate('A volta pela faixa de areia foi bem mais rápida. A Bella ia na frente.');
    ctx.setFlag('cf-noite2');
    await ctx.teleport('cf-casa', 'porta');
  },
  ...falas('cf-jap', {
    nathan: ['Água parada desse jeito, nem parece mar.', 'Ano que vem a gente aluga um barquinho e dá a volta na ilha.'],
    vitoria: ['Bella, olha os peixinhos! Ali, perto da pedra!', 'Essa enseada é a coisa mais linda que eu já vi. Depois da minha foto de branco, claro.'],
    ruan: ['Eu vou boiar aqui até o ano que vem.', 'Sabia que o nome é Japonês por causa de um pescador que morava aqui? Pelo menos é o que dizem.'],
    felipe: ['Eu vi um siri. Pequeno. Mas vi.', 'Se for andando até a ilha, vai devagar. As pedrinhas escorregam.'],
  }),
  async enseada(ctx) {
    await ctx.say('bella', 'Dá pra ver cada pedrinha do fundo. Parece uma piscina que alguém esqueceu na natureza.');
  },
  async ilha(ctx) {
    await ctx.say('weng', objDone('ilha') ? 'Daqui ela parece pequenininha. De lá parecia o mundo inteiro.' : 'A ilha. A faixa de areia vai até ela, por dentro da água.');
  },
};
/** Até onde vai a areia (à direita é água), por altura. */
const japSand = (y: number) => (y < 330 ? 0 : y < 400 ? 420 : y < 520 ? 330 : y < 640 ? 300 : y < 740 ? 390 : y < 820 ? 500 : 0);
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
    R(0, 770, 330, 1024), // pedras de baixo
    R(0, 720, 270, 770), // (a trilhinha de areia entre as pedras e a água fica livre até a faixa)
    R(330, 840, 1536, 1024),
    ...Array.from({ length: 11 }, (_, i) => {
      const y = 310 + i * 48;
      return R(Math.max(330, japSand(y + 24) || 330), y, 1536, y + 48);
    }),
  ],
  objects: [
    { key: 'cf-guardasol3', x: 300, y: 470, w: 170, shadow: 0.9, solid: 0.12 },
    { key: 'cf-churrasqueira', x: 200, y: 560, w: 100, shadow: 0.6, solid: 0.6 },
    { key: 'cf-mesaplastico', x: 175, y: 680, w: 110, shadow: 0.6, solid: 0.75 },
    { key: 'cf-isopor', x: 270, y: 620, w: 90, shadow: 0.6, solid: 0.8 },
  ],
  npcs: [
    { id: 'puggian', sprite: 'puggian', tx: 130 / 48, ty: 560 / 48, facing: 'right', interact: 'churrasco' },
    { id: 'nathan', sprite: 'nathan', tx: 290 / 48, ty: 400 / 48, facing: 'down', interact: 'nathanTalk' },
    { id: 'vitoria', sprite: 'vitoria', tx: 245 / 48, ty: 410 / 48, facing: 'down', interact: 'vitoriaTalk' },
    { id: 'ruan', sprite: 'ruan', tx: 375 / 48, ty: 480 / 48, facing: 'left', interact: 'ruanTalk' },
    { id: 'felipe', sprite: 'felipe', tx: 335 / 48, ty: 600 / 48, facing: 'left', interact: 'felipeTalk' },
  ],
  hotspots: [
    { rect: R(140, 500, 260, 580), interact: 'churrasco', label: 'Churrasco', markerIf: () => objActive('japones') },
    { rect: R(380, 760, 500, 830), interact: 'faixa', label: 'Faixa de areia', markerIf: () => objDone('japones') && objActive('ilha') },
    { rect: R(300, 420, 360, 630), interact: 'enseada', label: 'Enseada' },
    { rect: R(380, 660, 440, 740), interact: 'ilha', label: 'Ilha' },
  ],
  spawns: { chegada: { tx: 200 / 48, ty: 380 / 48, facing: 'down' } },
  scripts: japScripts,
  onEnter: 'chegada',
};

// ====================================================================== Praia do Forte (virada)
const TURMA = ['nathan', 'vitoria', 'ruan', 'felipe', 'puggian'] as const;
/** Onde cada um fica na areia, olhando pro mar. */
const LUGAR: Record<(typeof TURMA)[number], [number, number]> = {
  nathan: [10.4, 8.75],
  vitoria: [11.5, 8.95],
  ruan: [13.3, 8.55],
  felipe: [15.0, 8.75],
  puggian: [16.5, 8.35],
};

/** Depois dos fogos: a turma vai pular as sete ondas e os dois ficam sozinhos na beira do mar. */
async function soNosDois(ctx: ScriptContext): Promise<void> {
  await ctx.say('vitoria', 'Sete ondas! Quem não pular sete ondas não tem sorte o ano inteiro!');
  await ctx.say('nathan', 'Bora, galera! Bella, Weng, vocês vêm?');
  await ctx.say('weng', 'Já vamos. Vão indo na frente.');
  // a turma corre pra água, lá pra esquerda
  TURMA.forEach((who, i) => void ctx.move(who, 3.2 + i * 1.5, 11.2 - (i % 2) * 0.5, 80).then(() => ctx.face(who, 'down')));
  ctx.follow('weng', false);
  ctx.letterbox(true);
  await Promise.all([ctx.move('player', 17.0, 8.75, 42), ctx.move('weng', 18.3, 8.7, 42)]);
  ctx.face('player', 'down');
  ctx.face('weng', 'down');
  await ctx.frame(17.6, 8.75, 1100);
  await ctx.narrate('Longe da gritaria, só o barulho do mar e os últimos fogos estourando em cima do forte.');
  await ctx.say('bella', 'Weng... ano passado, nessa hora, eu tava na varanda da tia Tim morrendo de medo da sua família não gostar de mim.');
  await ctx.say('weng', 'E hoje a tia Tim te manda pato pra casa e a mãe da Lilian te dá chocolate por quilo.');
  await ctx.say('bella', 'E o meu pai te chama de "rapaz direito".');
  await ctx.say('weng', '"Gastador, mas direito." Eu ouvi.');
  ctx.face('player', 'right');
  await ctx.say('bella', '(rindo) Lembra do primeiro encontro? Eu tava tão nervosa que quase saí sem o guarda-chuva.');
  ctx.face('weng', 'left');
  await ctx.say('weng', 'Eu lembro de tudo. Do hambúrguer, dos gatinhos de Fragoso, da chuva... do coreto.');
  await ctx.say('bella', 'Do miojo da primeira noite no seu apê. E da Meli me ignorando.');
  await ctx.say('weng', 'A Meli ignora todo mundo. Você foi a primeira que ela deixou fazer carinho.');
  await ctx.say('bella', 'E hoje a gente andou quilômetros de branco pra ver isso aqui.');
  await ctx.say('weng', 'Valeu cada passo.');
  const c = await ctx.choose('bella', '(O mar escuro, as luzes do forte e ele do lado)', [
    '"Eu não trocaria nenhum pedacinho desse caminho."',
    '"Promete que ano que vem a gente faz tudo de novo?"',
    '"Obrigada por me escolher todo dia."',
  ]);
  if (c === 0) await ctx.say('weng', 'Nem eu. Nem o sol de rachar em Rio das Ostras.');
  else if (c === 1) await ctx.say('weng', 'Prometo. E com guarda-sol alugado desde o começo.');
  else await ctx.say('weng', 'É a escolha mais fácil que eu faço. Todo dia.');
  await ctx.say('weng', 'Bella.');
  await ctx.say('bella', 'Hm?');
  await ctx.say('weng', 'Feliz ano novo. É o nosso segundo. E eu quero todos os outros.');
  await ctx.focus(17.65, 8.4, 2.0, 1800);
  await ctx.kiss(); // de branco: olhos fechados com a roupa da virada
  await ctx.fadeOut(1600, '#fff3f6');
  await ctx.unfocus(10);
  ctx.letterbox(false);
  await ctx.frame(17.6, 8.75, 0);
  await ctx.fadeIn(1400);
  await ctx.narrate('Lá atrás, a turma gritava a sétima onda. Ali na frente, o ano começava do jeito certo.');
  await ctx.say('bella', '...Feliz ano novo, Weng.');
  await ctx.emote('weng', 'heart');
  await ctx.unfocus(600);
  ctx.follow('weng', true);
}

const forteScripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (objDone('virada') || ctx.flag('cf-forte-chegou')) return;
    ctx.setFlag('cf-forte-chegou');
    ctx.music('paraiso'); // Paradise: a virada na Praia do Forte
    // a turma chega junto, correndo pela areia até um lugar de frente pro mar
    TURMA.forEach((who, i) => ctx.place(who, 2.2 + (i % 3) * 0.9, 8.2 + i * 0.35, 'right'));
    const chegando = Promise.all(TURMA.map((who) => ctx.move(who, LUGAR[who][0], LUGAR[who][1], 85).then(() => ctx.face(who, 'down'))));
    await ctx.narrate('Praia do Forte, 23h54. A orla lotada, todo mundo de branco, o forte iluminado nas pedras.');
    await chegando;
    await ctx.say('bella', 'A gente CONSEGUIU. Andando. E de carona com um desconhecido muito gente boa.');
    await ctx.say('weng', 'Ele até desejou feliz ano-novo pra gente.');
    await ctx.say('vitoria', 'Gente, meu tênis branco tá cinza.');
    await ctx.emote('nathan', 'exclaim');
    await ctx.say('nathan', 'Seis minutos! Todo mundo junto!');
    await ctx.say('felipe', 'DEZ! NOVE! OITO...');
    const r = await ctx.fogos({ year: '2025', bg: 'map-cf-forte-bg', water: 'no mar' });
    ctx.setFlag('cf-fogos-estrelas', r.stars);
    // a turma pulando de verdade na areia, olhando os fogos
    const fimFesta = ctx.party(['player', 'weng', ...TURMA], '2025');
    await ctx.narrate('Os fogos explodiram sobre o mar de Cabo Frio. A turma inteira pulando, gritando e se abraçando na areia.');
    const c = await ctx.choose('bella', '(Meia-noite, suada, descalça e de branco)', ['"Melhor virada. A gente andou quilômetros por ela."', '"Feliz ano novo, amor."', 'Abraçar ele bem apertado']);
    if (c === 0) await ctx.say('weng', 'Três. A carona fez o resto. Mas eu conto como cinco.');
    else if (c === 1) await ctx.say('weng', 'Feliz ano novo, Bella.');
    else {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', '...Esse abraço já valeu a caminhada.');
    }
    await ctx.say('felipe', 'FELIZ 2025, GALERA!');
    await ctx.say('ruan', 'E agora, como a gente volta?');
    await ctx.say('nathan', '...Uber?');
    await ctx.say('bella', 'NÃO.');
    ctx.hearts('player', 14);
    fimFesta();
    await soNosDois(ctx);
    ctx.objective(Q, 'virada');
    if (ctx.hasArt('memory-cf-03')) await ctx.memory('mem-cf-03');
    await ctx.fadeOut(900);
    await ctx.chapterCard('Último capítulo', 'Cabo Frio', 'A virada a pé.', 'Continuar', {
      title: 'A virada a pé',
      photos: ['memory-cf-01', 'memory-cf-02', 'memory-cf-03'].filter((k) => ctx.hasArt(k)),
      lines: [
        'Uma casa de praia em Peró com a turma: Nathan, Vitória, Ruan, Felipe e Puggian.',
        'Altinha na areia, pizza com queijo esticando e a última fatia dividida.',
        'Churrasco no Japonês e a travessia até a ilha (com um siri muito encarador).',
        'Nenhum Uber aceitou. Três quilômetros a pé, uma carona e a virada na Praia do Forte.',
        'E, depois dos fogos, um beijo na beira do mar. Só os dois.',
      ],
    });
    ctx.setFlag('jogo-zerado');
    await ctx.ending();
    await ctx.fadeIn(600);
  },
  async nathan(ctx) {
    await ctx.say('nathan', objDone('virada') ? 'Ano que vem eu reservo o Uber em julho. Juro.' : 'Seis minutos! Ninguém some, hein!');
  },
  async vitoria(ctx) {
    await ctx.say('vitoria', objDone('virada') ? 'Feliz 2025! Meu pé dói e eu tô muito feliz.' : 'Rápido, rápido, tá quase!');
  },
  async ruan(ctx) {
    await ctx.say('ruan', objDone('virada') ? 'Pulei as sete ondas. Na quarta eu engoli o mar.' : 'Daqui dá pra ver os fogos de três praias.');
  },
  async felipe(ctx) {
    await ctx.say('felipe', objDone('virada') ? 'Melhor virada da minha vida. E eu nem sei quantas eu já tive.' : 'Eu vou fazer a contagem. Ninguém me atrapalha.');
  },
  async puggian(ctx) {
    await ctx.say('puggian', objDone('virada') ? 'Alguém viu meu chinelo? ...Ah, tá com a Bella.' : 'Guardei um espumante na mochila desde Peró.');
  },
  async forte(ctx) {
    await ctx.say('weng', 'O Forte São Mateus. Tá aí desde mil seiscentos e pouco, vendo virada de ano.');
    await ctx.say('bella', 'Então ele já viu muita gente se beijar à meia-noite.');
  },
  async mar(ctx) {
    await ctx.say('bella', objDone('virada') ? 'Sete ondas. A gente pulou? ...A gente pula ano que vem.' : 'O mar tá cheio de luzinha refletindo. Parece que tá esperando os fogos também.');
  },
  async orla(ctx) {
    await ctx.say('weng', 'A orla inteira de branco. Parece que a cidade toda veio a pé também.');
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
    ...TURMA.map((id) => ({ id, sprite: id, tx: LUGAR[id][0], ty: LUGAR[id][1], facing: 'down' as const, interact: id })),
  ],
  hotspots: [
    { rect: R(1080, 300, 1300, 480), interact: 'forte', label: 'Forte' },
    { rect: R(250, 520, 700, 600), interact: 'mar', label: 'Mar' },
    { rect: R(0, 300, 1100, 345), interact: 'orla', label: 'Orla' },
  ],
  spawns: { chegada: { tx: 330 / 48, ty: 430 / 48, facing: 'down' } },
  scripts: forteScripts,
  onEnter: 'chegada',
};
