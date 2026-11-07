import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';

const Q = 'dq-s1';
const ORCAMENTO = 50;
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/dq-multidao.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

type Cat = 'cabelo' | 'casa' | 'doces' | 'celular';
interface Item {
  id: string;
  nome: string;
  preco: number;
  weng: string;
}
const LOJAS: Record<Cat, { titulo: string; itens: Item[] }> = {
  cabelo: {
    titulo: 'Lojinha de cabelo',
    itens: [
      { id: 'piranha', nome: 'Piranha de tartaruga', preco: 12, weng: 'Você tem umas quinze dessas. Mas essa é diferente, eu sei.' },
      { id: 'scrunchie', nome: 'Kit de scrunchies', preco: 8, weng: 'Seis cores. Uma pra cada dia que você vai esquecer onde deixou.' },
      { id: 'creme', nome: 'Creme de cachos', preco: 22, weng: 'Esse é sério. Cacho é coisa séria.' },
    ],
  },
  casa: {
    titulo: 'Utilidades',
    itens: [
      { id: 'vela', nome: 'Vela aromática de baunilha', preco: 18, weng: 'Cheiro de bolo. Perigoso pra quem tá de dieta.' },
      { id: 'potes', nome: 'Potinhos organizadores', preco: 15, weng: 'Pra organizar... os outros potinhos.' },
      { id: 'pano', nome: 'Pano de prato de gatinho', preco: 6, weng: 'Tem a cara da Lala. Leva.' },
    ],
  },
  doces: {
    titulo: 'Doceria',
    itens: [
      { id: 'pacoca', nome: 'Pote de paçoca', preco: 9, weng: 'Metade é minha. Já tô avisando.' },
      { id: 'balas', nome: 'Balinha de gelatina', preco: 7, weng: 'Você vai comer as vermelhas e me deixar as verdes.' },
      { id: 'choco', nome: 'Barra de chocolate', preco: 6, weng: 'Essa não chega no carro.' },
    ],
  },
  celular: {
    titulo: 'Acessórios de celular',
    itens: [
      { id: 'capinha', nome: 'Capinha de gatinho', preco: 20, weng: 'Seu celular merece. Ele aguenta cada áudio de 5 minutos.' },
      { id: 'fone', nome: 'Fone de ouvido', preco: 29, weng: 'Pra ouvir música no ônibus pensando em mim.' },
    ],
  },
};
const TODOS = Object.values(LOJAS).flatMap((l) => l.itens);

const cart = (): string[] => {
  const v = GameState.data.flags['mt-cart'];
  return typeof v === 'string' && v ? v.split(',') : [];
};
const setCart = (ctx: ScriptContext, ids: string[]) => ctx.setFlag('mt-cart', ids.join(','));
const total = (ids = cart()) => ids.reduce((s, id) => s + (TODOS.find((i) => i.id === id)?.preco ?? 0), 0);
const real = (n: number) => `R$ ${n},00`;

async function loja(ctx: ScriptContext, cat: Cat): Promise<void> {
  const l = LOJAS[cat];
  if (objDone('pagar')) {
    await ctx.say('bella', 'Já gastei tudo. Só olhando agora... só olhando.');
    return;
  }
  if (!QuestSystem.isActive(Q)) ctx.startQuest(Q);
  const noCarro = cart();
  const livres = l.itens.filter((i) => !noCarro.includes(i.id));
  if (!livres.length) {
    await ctx.say('bella', `Já peguei tudo da ${l.titulo.toLowerCase()}. Tudo!`);
    return;
  }
  const c = await ctx.choose('bella', `${l.titulo} · na cestinha: ${real(total())} de ${real(ORCAMENTO)}`, [...livres.map((i) => `${i.nome} — ${real(i.preco)}`), 'Só olhar']);
  if (c >= livres.length) {
    await ctx.say('bella', 'Só olhando. Juro.');
    return;
  }
  const it = livres[c];
  setCart(ctx, [...noCarro, it.id]);
  ctx.sfx('pickup');
  ctx.hearts('player', 2);
  await ctx.say('weng', it.weng);
  const t = total();
  if (t > ORCAMENTO) await ctx.say('weng', `Amor... a cestinha tá em ${real(t)}. O orçamento era ${real(ORCAMENTO)}.`);
  else ctx.toast(`Cestinha: ${real(t)} de ${real(ORCAMENTO)}`);
  if (cart().length >= 3 && objActive('achar')) {
    ctx.objective(Q, 'achar');
    await ctx.say('bella', 'Acho que já deu. Vamos pro caixa antes que eu mude de ideia.');
  }
}

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('mt-chegou')) return;
    ctx.setFlag('mt-chegou');
    if (!QuestSystem.isActive(Q) && !QuestSystem.isDone(Q)) ctx.startQuest(Q);
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'Weng. WENG. Olha isso. Piranha, vela, paçoca, capinha... eu tô no paraíso.');
    await ctx.say('weng', 'Combinado é combinado: orçamento PEQUENO. Cinquenta reais.');
    await ctx.say('bella', 'Cinquenta reais no Multidão é praticamente uma fortuna.');
    await ctx.say('weng', 'Escolhe com carinho. E me deixa segurar a cestinha, pelo menos.');
    ctx.toast(`Escolha achadinhos nas lojas (até ${real(ORCAMENTO)}) e pague no caixa`);
  },
  cabelo: (ctx) => loja(ctx, 'cabelo'),
  casa: (ctx) => loja(ctx, 'casa'),
  doces: (ctx) => loja(ctx, 'doces'),
  celular: (ctx) => loja(ctx, 'celular'),

  async caixa(ctx) {
    if (objDone('pagar')) {
      await ctx.say('vendedora', 'Volte sempre! Aqui é o Multidão: sempre tem coisa nova.');
      return;
    }
    if (!cart().length) {
      await ctx.say('vendedora', 'Oi, amor! Pode escolher à vontade, depois é só trazer aqui.');
      return;
    }
    if (cart().length < 3) {
      const c = await ctx.choose('bella', `Só ${cart().length} coisinha(s) na cestinha (${real(total())}).`, ['Pagar assim mesmo', 'Escolher mais um pouco']);
      if (c === 1) return;
    }
    let devolvido: string | null = null;
    while (total() > ORCAMENTO) {
      await ctx.say('vendedora', `Deu ${real(total())}.`);
      await ctx.say('weng', `Passou ${real(total() - ORCAMENTO)}. Tem que devolver alguma coisa, amor.`);
      const ids = cart();
      const c = await ctx.choose('bella', '(Devolver o quê?)', ids.map((id) => {
        const it = TODOS.find((i) => i.id === id)!;
        return `${it.nome} — ${real(it.preco)}`;
      }));
      devolvido = ids[c];
      setCart(ctx, ids.filter((_, k) => k !== c));
      await ctx.say('bella', 'Tchau... a gente se vê na próxima.');
    }
    const ids = cart();
    await ctx.say('vendedora', `Fica ${real(total())}. Quer sacolinha?`);
    await ctx.say('bella', 'Quero! A rosa, por favor.');
    ctx.sfx('confirm');
    ctx.objective(Q, 'achar');
    ctx.objective(Q, 'pagar');
    ctx.hearts('player', 6);
    await ctx.narrate(`Na sacolinha rosa: ${ids.map((id) => TODOS.find((i) => i.id === id)!.nome.toLowerCase()).join(', ')}.`);
    if (devolvido) {
      const it = TODOS.find((i) => i.id === devolvido)!;
      await ctx.say('weng', 'Vai indo na frente, amor. Esqueci uma coisa.');
      await ctx.fadeOut(300);
      await ctx.wait(600);
      await ctx.fadeIn(300);
      await ctx.say('weng', `Toma. ${it.nome}. Eu vi a sua cara quando você devolveu.`);
      await ctx.emote('bella', 'heart');
      await ctx.say('bella', 'WENG! Você é impossível. E eu te amo.');
    } else {
      await ctx.say('weng', 'Dentro do orçamento e ainda sobrou troco. Quem é você e o que fez com a minha namorada?');
      await ctx.say('bella', 'Eu aprendo rápido. E o troco é pra paçoca da próxima vez.');
    }
    ctx.hearts('player', 8);
  },

  async weng(ctx) {
    await ctx.say('weng', objDone('pagar') ? 'Sacolinha rosa, missão cumprida. Bora?' : `Na cestinha tem ${real(total())}. Ainda dá pra ${real(Math.max(0, ORCAMENTO - total()))}.`);
  },
  async saida(ctx) {
    if (QuestSystem.isActive(Q) && cart().length && !objDone('pagar')) {
      await ctx.say('weng', 'Ei! A gente ainda não pagou. Bora no caixa antes que o segurança venha.');
      const t = ctx.playerTile();
      await ctx.move('player', t.x, t.y - 1, 60);
      return;
    }
    await ctx.teleport('duque-rua', 'from-multidao');
  },
};

/** Capítulo 2 — Shopping da Multidão (por dentro): achadinhos com orçamento de R$ 50. */
export const multidaoMap: MapDef = {
  id: 'dq-multidao',
  region: 'duque-de-caxias',
  name: 'Shopping da Multidão',
  music: 'rota66',
  background: '#2a1620',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    // lojas do fundo
    R(0, 0, 1536, 400),
    // lojas das laterais (em perspectiva)
    R(0, 400, 175, 560),
    R(0, 560, 125, 830),
    R(1365, 400, 1536, 560),
    R(1415, 560, 1536, 830),
    // parede de baixo (a porta de vidro fica livre)
    R(0, 820, 525, 1024),
    R(1010, 820, 1536, 1024),
    R(525, 792, 1010, 1024), // porta de vidro: a saída é encostar nela
    // objetos: só a base
    R(360, 562, 480, 590), // arara de cabelo
    R(640, 560, 800, 600), // balcão de balas
    R(945, 532, 1075, 560), // estante de casa
    R(1100, 600, 1360, 740), // caixa
    R(470, 798, 510, 815), // cestinhas
    R(160, 600, 200, 620), // planta
    R(1310, 455, 1350, 470), // planta
    R(250, 780, 430, 800), // banco
  ],

  objects: [
    { key: 'mt-rack', x: 420, y: 590, w: 180, shadow: 0.7 },
    { key: 'mt-balas', x: 720, y: 600, w: 210, shadow: 0.7 },
    { key: 'mt-estante', x: 1010, y: 560, w: 190, shadow: 0.7 },
    { key: 'mt-caixa', x: 1230, y: 740, w: 280, shadow: 0.7 },
    { key: 'mt-cestas', x: 490, y: 815, w: 95, shadow: 0.6 },
    { key: 'mt-planta', x: 180, y: 620, w: 95, shadow: 0.6 },
    { key: 'mt-planta', x: 1330, y: 470, w: 85, shadow: 0.6, flip: true },
    { key: 'mt-banco', x: 340, y: 800, w: 210, shadow: 0.7 },
  ],

  hotspots: [
    { rect: R(195, 300, 480, 420), interact: 'cabelo', label: 'Cabelo', markerIf: () => !objDone('pagar') },
    { rect: R(510, 300, 800, 420), interact: 'casa', label: 'Casa', markerIf: () => !objDone('pagar') },
    { rect: R(840, 300, 1130, 420), interact: 'doces', label: 'Doces', markerIf: () => !objDone('pagar') },
    { rect: R(1160, 300, 1360, 420), interact: 'celular', label: 'Celular', markerIf: () => !objDone('pagar') },
    { rect: R(340, 470, 500, 600), interact: 'cabelo', label: 'Cabelo' },
    { rect: R(620, 480, 820, 610), interact: 'doces', label: 'Doces' },
    { rect: R(920, 400, 1100, 570), interact: 'casa', label: 'Casa' },
    { rect: R(1090, 560, 1370, 770), interact: 'caixa', label: 'Caixa', markerIf: () => objActive('pagar') && cart().length > 0 },
  ],

  npcs: [{ id: 'vendedora', sprite: 'caixa', tx: 25.1, ty: 11.6, facing: 'down', interact: 'caixa' }],

  spawns: {
    porta: { tx: 15.5, ty: 14.3, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(560, 770, 975, 792), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
