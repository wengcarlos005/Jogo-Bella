import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';

const Q = 'ro-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/ro-costao.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

type Pt = [number, number];
type Shape = { poly: Pt[] } | { ellipse: [number, number, number, number] } | { rect: [number, number, number, number] };

/** Onde dá pra pisar (px da arte original, posição dos pés). */
const PISAVEL: Shape[] = [
  // passarela: do começo (esquerda, em cima) fazendo a curva e descendo até a escada do mirante
  { poly: [[205, 150], [240, 150], [285, 190], [355, 220], [425, 245], [513, 258], [605, 256], [708, 268], [775, 292], [830, 318], [880, 352], [905, 395], [935, 450], [965, 505], [1000, 555], [1035, 600], [1050, 640], [1000, 660], [940, 640], [890, 610], [865, 560], [845, 480], [830, 420], [805, 380], [760, 350], [700, 335], [600, 328], [500, 328], [400, 322], [320, 312], [240, 290], [205, 262]] },
  // deque do mirante (o lado do lampião fica de fora)
  { poly: [[1000, 640], [1060, 640], [1150, 690], [1325, 690], [1325, 645], [1340, 645], [1340, 772], [1050, 775], [985, 712], [960, 670]] },
  // a laje de pedra com as piscinas naturais
  { poly: [[190, 262], [330, 312], [560, 345], [700, 345], [780, 370], [805, 410], [822, 500], [845, 590], [870, 650], [880, 700], [885, 770], [860, 795], [760, 800], [660, 805], [470, 800], [240, 790], [235, 700], [150, 690], [130, 600], [115, 500], [115, 420], [160, 330]] },
];

/** O que tira área pisável (água das piscinas, guarda-corpo, banco, lampião). */
const BLOQUEIO: Shape[] = [
  { ellipse: [112, 372, 356, 482] }, // piscina de cima (conchinhas)
  { ellipse: [290, 498, 570, 612] }, // piscina grande, parte de cima
  { ellipse: [132, 548, 508, 698] }, // piscina grande, parte de baixo (siri)
  { ellipse: [468, 706, 662, 830] }, // piscina pequena (reflexo)
  // a passarela é alta (tem pilares) e tem guarda-corpo na descida: só se desce pras pedras no comecinho
  { poly: [[330, 316], [500, 330], [600, 330], [700, 337], [760, 352], [803, 383], [827, 423], [842, 482], [862, 562], [886, 613], [935, 646], [985, 712], [1030, 790], [1000, 800], [950, 760], [900, 705], [860, 625], [838, 570], [820, 490], [806, 432], [785, 398], [745, 372], [695, 357], [600, 350], [500, 350], [330, 340]] },
  { rect: [1160, 640, 1318, 694] }, // banco do mirante
];

function inside(s: Shape, x: number, y: number): boolean {
  if ('rect' in s) return x >= s.rect[0] && x <= s.rect[2] && y >= s.rect[1] && y <= s.rect[3];
  if ('ellipse' in s) {
    const [x0, y0, x1, y1] = s.ellipse;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const rx = (x1 - x0) / 2;
    const ry = (y1 - y0) / 2;
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  }
  let hit = false;
  const p = s.poly;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/**
 * Colisão: tudo que não é pisável, em COLUNAS de 16 px (resolução vertical de 6 px). Colunas altas e
 * estreitas como na praia: faixas largas e baixas deixam o personagem escorregar por cima delas.
 */
function blocos(): TileRect[] {
  const CW = 16;
  const CH = 6;
  const out: TileRect[] = [];
  for (let x0 = 0; x0 < 1536; x0 += CW) {
    const cx = x0 + CW / 2;
    let start = -1;
    for (let y0 = 0; y0 < 1024; y0 += CH) {
      const cy = y0 + CH / 2;
      const free = PISAVEL.some((s) => inside(s, cx, cy)) && !BLOQUEIO.some((s) => inside(s, cx, cy));
      if (!free && start < 0) start = y0;
      if (free && start >= 0) {
        out.push(R(x0, start, x0 + CW, y0));
        start = -1;
      }
    }
    if (start >= 0) out.push(R(x0, start, x0 + CW, 1024));
  }
  return out;
}

const PISCINAS = ['ro-pisc-conchas', 'ro-pisc-siri', 'ro-pisc-reflexo'];
const piscinasVistas = () => PISCINAS.filter((f) => GameState.is(f)).length;

async function proximo(ctx: ScriptContext): Promise<void> {
  const n = piscinasVistas();
  if (n < PISCINAS.length) {
    ctx.toast(`Piscinas naturais: ${n} de ${PISCINAS.length}`);
    return;
  }
  if (!objDone('piscinas')) {
    ctx.objective(Q, 'piscinas');
    await ctx.say('weng', 'Pronto, vimos as três. O sol tá quase encostando no mar. Bora pro mirante?');
    await ctx.say('bella', 'Bora! Quero o banco da frente. O único banco. Mas é o da frente.');
    ctx.toast('O banco do mirante fica no fim da passarela, à direita');
  }
}

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (!QuestSystem.isActive(Q) || ctx.flag('ro-costao-chegou')) return;
    ctx.setFlag('ro-costao-chegou');
    // o Weng chega um passo na frente, já de olho nas piscininhas
    ctx.follow('weng', false);
    ctx.place('weng', 6.6, 5.1, 'left');
    await ctx.narrate('A chuva foi embora tão rápido quanto veio. O costão ficou todo molhado, brilhando, e o céu abriu laranja.');
    await ctx.say('bella', 'Weng, olha isso! As pedras tão parecendo espelho.');
    await ctx.say('weng', 'E a chuva encheu as piscininhas. Aposto que tem bicho lá dentro.');
    await ctx.say('bella', 'Então primeiro a gente caça bicho. Depois vê o sol se pôr lá do mirante.');
    await ctx.say('weng', 'Combinado. Cuidado que a pedra tá escorregando.');
    await ctx.say('bella', 'Se eu escorregar, eu te levo junto.');
    ctx.follow('weng', true);
    ctx.toast('Desça da passarela pras pedras: são três piscinas naturais');
  },

  async conchas(ctx) {
    if (GameState.is('ro-pisc-conchas')) {
      await ctx.say('bella', 'Um monte de conchinha. Se meu pai vê, ele leva todas pra casa pra enfeitar o banheiro.');
      return;
    }
    await ctx.say('bella', 'Conchinhas! Olha essa rosa aqui, inteirinha.');
    await ctx.say('weng', 'Do tamanho da sua unha. E da mesma cor.');
    const c = await ctx.choose('bella', '(Uma conchinha rosa, molhada de chuva)', ['Guardar de lembrança', 'Dar pro Weng guardar', 'Deixar ela lá, no lugar dela']);
    if (c === 0) await ctx.say('bella', ctx.has('concha-castelo') ? 'Vai fazer companhia pra conchinha do castelo.' : 'Lembrancinha de Rio das Ostras.');
    else if (c === 1) await ctx.say('weng', 'Guardada. No bolso do lado do coração. (É o único bolso que eu tenho.)');
    else {
      await ctx.say('bella', 'Fica aí, conchinha. A gente volta pra te visitar.');
      await ctx.say('weng', 'Você é a pessoa mais fofa desse costão inteiro.');
    }
    ctx.setFlag('ro-pisc-conchas');
    ctx.hearts('player', 4);
    await proximo(ctx);
  },

  async siri(ctx) {
    if (GameState.is('ro-pisc-siri')) {
      await ctx.say('weng', 'O Torrada continua ali, de guarda. Siri sério.');
      return;
    }
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'WENG! Tem um siri ali! Ele tá olhando pra mim!');
    await ctx.say('weng', 'Ele tá andando de lado na sua direção. É flerte. Siri flerta assim.');
    const c = await ctx.choose('bella', '(O siri levantou as duas garrinhas)', ['Dar oi pro siri', 'Se esconder atrás do Weng', 'Dar um nome pra ele']);
    if (c === 0) {
      await ctx.say('bella', 'Oi, siri! Tudo bem com você?');
      await ctx.narrate('O siri acenou de volta. Ou estava só ameaçando. Com siri nunca dá pra saber.');
    } else if (c === 1) {
      await ctx.say('weng', 'Pode deixar que eu te protejo. Mas se ele vier, eu corro junto.');
      await ctx.say('bella', 'Meu herói. Até de siri.');
    } else {
      await ctx.say('bella', 'Seu nome agora é Torrada. Em homenagem ao meu pai.');
      await ctx.say('weng', 'Seu pai vai ficar honrado. Ou vai perguntar onde ele tava escondido esse tempo todo.');
    }
    await ctx.emote('weng', 'heart');
    ctx.setFlag('ro-pisc-siri');
    ctx.hearts('player', 4);
    await proximo(ctx);
  },

  async reflexo(ctx) {
    if (GameState.is('ro-pisc-reflexo')) {
      await ctx.say('weng', 'Continuam lindos, aqueles dois da água.');
      return;
    }
    await ctx.say('bella', 'Essa aqui tá tão paradinha que dá pra ver a gente refletido.');
    await ctx.say('weng', '(olhando a água) Que casal bonito. Quem são?');
    await ctx.say('bella', 'Dois queimados de sol, ensopados e cheios de areia.');
    await ctx.say('weng', 'Os mais bonitos do costão.');
    await ctx.say('bella', 'Foto! Antes que o vento mexa a água.');
    await ctx.photo('Bella & Weng refletidos na piscina natural');
    ctx.setFlag('ro-pisc-reflexo');
    ctx.hearts('player', 4);
    await proximo(ctx);
  },

  async flores(ctx) {
    if (ctx.flag('ro-hibisco')) {
      await ctx.say('bella', 'Ainda tô com a flor no cabelo. Não vou tirar nunca mais.');
      return;
    }
    await ctx.say('bella', 'Hibisco! Tá todo pingando de chuva.');
    await ctx.say('weng', '(pegando uma flor caída e colocando atrás da orelha dela) Pronto. Combinou com o pôr do sol.');
    await ctx.emote('bella', 'heart');
    ctx.setFlag('ro-hibisco');
    ctx.hearts('player', 3);
  },

  async lampiao(ctx) {
    await ctx.say('weng', 'O lampião acendeu sozinho. Até ele sabe que agora é a melhor hora.');
  },

  async mar(ctx) {
    await ctx.say('bella', 'As ondas tão batendo forte nas pedras. O mar ainda tá bravo com a tempestade.');
    await ctx.say('weng', 'E o céu já fez as pazes. Olha essa cor.');
  },

  async mirante(ctx) {
    if (objDone('mirante')) return;
    if (!objDone('piscinas')) {
      await ctx.say('bella', 'O banco do mirante! Mas antes eu quero ver as piscininhas. O sol ainda tá alto, dá tempo.');
      await proximo(ctx);
      return;
    }
    await ctx.say('weng', 'Chegamos bem na hora. Senta aqui comigo.');
    await ctx.fadeOut(400);
    ctx.follow('weng', false);
    // sentados de costas: a borda da frente do assento e os pés do banco ficam na frente deles
    ctx.setFlag('ro-no-banco');
    ctx.seat('player', 1207, 648, 'up');
    ctx.seat('weng', 1271, 648, 'up');
    ctx.letterbox(true);
    await ctx.frame(26.2, 11.2, 0);
    await ctx.fadeIn(800);
    await ctx.narrate('O sol foi descendo devagar e pintou o mar inteiro de laranja. Só dava pra ouvir a onda batendo nas pedras.');
    // a cena de pertinho: os dois abraçados no banco
    await ctx.backdrop('cena-ro-mirante');
    await ctx.say('bella', 'Weng... eu sei que vocês não tavam falando do preço do mate.');
    await ctx.say('weng', '(rindo baixinho) Você percebeu?');
    await ctx.say('bella', 'Eu conheço meu pai. Ele só fala baixinho daquele jeito quando é coisa séria.');
    await ctx.say('weng', '...Ele disse que você é o tesouro dele.');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'E você respondeu o quê?');
    await ctx.say('weng', 'Que você é o meu também.');
    const fim = await ctx.choose('bella', '(Os dois no banco do mirante, o sol encostando no mar)', ['Deitar a cabeça no ombro dele', '"Então cuida bem, tá?"', 'Dar um beijo com gosto de sal']);
    if (fim === 0) {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', 'Molhada, cheia de areia e com cheiro de batata frita. O melhor ombro ocupado do mundo.');
    } else if (fim === 1) {
      await ctx.say('weng', 'Todo dia. Com guarda-sol e tudo.');
    } else {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', 'Sal, protetor e batata frita. Aprovado.');
    }
    await ctx.narrate('Ficaram ali até o sol sumir de vez. Ninguém queria ser o primeiro a levantar.');
    await ctx.say('pai-ro', '(lá de baixo, gritando) Ô casal! Já deu meia hora! E alguém viu a minha torrada?');
    await ctx.say('bella', '(rindo) Ele vai procurar aquela torrada até o Natal.');
    await ctx.fadeOut(500);
    await ctx.backdrop(null);
    ctx.stand('player');
    ctx.stand('weng');
    ctx.setFlag('ro-no-banco', false);
    ctx.letterbox(false);
    await ctx.unfocus(0);
    ctx.follow('weng', true);
    await ctx.fadeIn(400);
    ctx.hearts('player', 12);
    await ctx.memory('mem-ro-03');
    ctx.objective(Q, 'mirante');
    await ctx.fadeOut(600);
    await ctx.chapterCard('Fim do Capítulo 5', 'Rio das Ostras', 'Um dia de praia.', 'Continuar', {
      title: 'Um dia de praia',
      photos: ['memory-ro-01', 'memory-ro-02', 'memory-ro-03'],
      lines: [
        'Uma passagem rápida por Rio das Ostras, e o melhor de tudo foi a praia.',
        'O pai dela não quis pagar o guarda-sol, e os dois viraram camarão.',
        'O Weng salvou o dia: sombra, cadeira e um herói de chinelo.',
        'Frescobol, castelo de areia meio torto, onda gigante e um chapéu resgatado do mar.',
        'Uma conversa de sogro sobre "o preço do mate".',
        'Petisco no quiosque até a tempestade chegar.',
        'E depois da chuva, o costão: um siri chamado Torrada e o pôr do sol no banco do mirante.',
      ],
    });
    // a família do Weng chama os dois pra Niterói
    await ctx.narrate('Algumas semanas depois.');
    await ctx.phone({ contact: 'Lilian', avatar: 'portrait-lilian', clock: '10:24', caption: 'No celular do Weng' }, [
      { from: 'them', text: 'Weng!! Minha mãe mandou avisar: domingo almoço aqui em Icaraí' },
      { from: 'them', text: 'E é pra trazer a Bella. Ela já comprou chocolate.' },
      { from: 'me', text: 'Já comprou?? Faltam 5 dias kkkk' },
      { from: 'them', text: 'Uma cesta. Uma CESTA, Weng.' },
      { from: 'them', text: 'Depois a gente dá uma volta no Caminho Niemeyer e meu pai quer levar todo mundo no On Fire' },
      { from: 'them', text: 'Ah, e o Vinicius vai. Pela primeira vez. Sejam legais com ele' },
      { from: 'me', text: 'A gente é sempre legal 😇' },
      { from: 'them', text: 'Você não. A Bella sim.' },
    ]);
    await ctx.say('weng', 'Bella, domingo tem almoço em Niterói. Com a família da Lilian.');
    await ctx.say('bella', 'A família INTEIRA de novo?');
    await ctx.say('weng', 'Metade. A metade que dá chocolate.');
    await ctx.say('bella', '...Então eu vou. E vou de vestido laranja.');
    await ctx.roadTrip(
      'Rio das Ostras',
      'Niterói',
      [
        { who: 'bella', text: 'Quem vai estar lá, mesmo?' },
        { who: 'weng', text: 'A mãe da Lilian, meu tio, a Lilian, a Vivian, o Diego e o Mingau. E o Vinicius, que é novo.' },
        { who: 'bella', text: 'Ótimo. Pela primeira vez eu não vou ser a pessoa nova da família.' },
        { who: 'weng', text: 'Olha a ponte! Lá embaixo é a baía de Guanabara.' },
        { who: 'bella', text: 'Dá pra ver o Pão de Açúcar daqui de cima!' },
        { who: 'weng', text: 'Chegamos em Icaraí. Respira: lá vem a cesta.' },
      ],
      ['pr-palmeira', 'nn-palmeira'],
      { coast: true },
    );
    ctx.unlockRegion('niteroi');
    await ctx.chapterCard('Capítulo 6', 'Niterói', 'Do outro lado da baía.', 'Começar');
    if (!GameState.data.regionsVisited.includes('niteroi')) GameState.data.regionsVisited.push('niteroi');
    if (!ctx.questActive('nt-m1') && !QuestSystem.isDone('nt-m1')) ctx.startQuest('nt-m1');
    await ctx.teleport('nt-apto', 'porta');
  },
};

/** Capítulo 5 — Rio das Ostras: o costão depois da tempestade. */
export const roCostaoMap: MapDef = {
  id: 'ro-costao',
  region: 'rio-das-ostras',
  name: 'Costão',
  music: 'parque',
  background: '#2a6f86',
  art: 'native',
  glints: [R(1000, 190, 1536, 330), R(1180, 330, 1536, 560), R(1440, 600, 1536, 900)],
  birds: { y0: 40, y1: 200 },
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: blocos(),

  overlays: [
    // banco do mirante (só com os dois sentados): a parte de perto do assento cobre o quadril deles
    {
      x0: 1156,
      y0: 640,
      x1: 1320,
      y1: 700,
      base: 700,
      front: true,
      frontAlpha: 1,
      when: () => GameState.is('ro-no-banco'),
      poly: [[1158, 641], [1318, 641], [1318, 669], [1306, 669], [1306, 697], [1282, 697], [1282, 669], [1192, 669], [1192, 697], [1166, 697], [1166, 669], [1158, 669]],
    },
    // lampião do mirante: na frente de quem passa atrás dele
    { x0: 1352, y0: 636, x1: 1412, y1: 782, base: 770, tall: true, poly: [[1362, 644], [1398, 644], [1400, 706], [1390, 708], [1390, 738], [1402, 744], [1402, 772], [1358, 772], [1358, 744], [1370, 738], [1370, 708], [1360, 706]] },
  ],

  hotspots: [
    { rect: R(112, 372, 356, 482), interact: 'conchas', label: 'Piscina natural', markerIf: () => objActive('piscinas') && !GameState.is('ro-pisc-conchas') },
    { rect: R(132, 498, 570, 698), interact: 'siri', label: 'Piscina natural', marker: { x: 0.45, y: 0.55 }, markerIf: () => objActive('piscinas') && !GameState.is('ro-pisc-siri') },
    { rect: R(474, 712, 650, 818), interact: 'reflexo', label: 'Piscina natural', markerIf: () => objActive('piscinas') && !GameState.is('ro-pisc-reflexo') },
    { rect: R(1160, 615, 1318, 700), interact: 'mirante', label: 'Banco do mirante', markerIf: () => objDone('piscinas') && objActive('mirante') },
    { rect: R(110, 160, 205, 300), interact: 'flores', label: 'Hibisco' },
    { rect: R(1340, 640, 1415, 780), interact: 'lampiao', label: 'Lampião' },
    { rect: R(1340, 560, 1536, 640), interact: 'mar', label: 'Mar' },
  ],

  spawns: {
    passarela: { tx: 5.3, ty: 4.7, facing: 'right' },
  },
  scripts,
  onEnter: 'chegada',
};
