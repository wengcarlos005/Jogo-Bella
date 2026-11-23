import { T } from '@/world/tiles';
import type { MapDef } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';
import { Q, objDone, objActive, R } from './shared';

const noite2 = () => GameState.is('cf-noite2');

async function pizza(ctx: ScriptContext): Promise<void> {
  ctx.follow('weng', false);
  await ctx.fadeOut(400);
  await ctx.narrate('Noite do dia 30. Todo mundo de banho tomado, com fome de leão e areia ainda no pé.');
  await ctx.fadeIn(400);
  await ctx.say('felipe', 'Pizza! Quem escolhe os sabores?');
  await ctx.say('puggian', 'Eu voto em quem fez a melhor jogada na altinha.');
  await ctx.say('ruan', 'Então é a Bella.');
  await ctx.say('bella', 'Eu?! ...Tá, eu escolho. Mas sem reclamar.');
  const sabores: [string, string[]][] = [
    ['Primeira pizza (a do Nathan, que come tudo):', ['Calabresa', 'Portuguesa', 'Frango com catupiry']],
    ['Segunda (a da Vitória, que não come cebola):', ['Margherita', 'Calabresa com cebola', 'Quatro queijos']],
    ['A terceira é a doce. Pra fechar:', ['Brigadeiro', 'Banana com canela', 'Romeu e Julieta']],
  ];
  let acertos = 0;
  for (let i = 0; i < sabores.length; i++) {
    const [txt, op] = sabores[i];
    const c = await ctx.choose('bella', txt, op);
    if (i === 0) await ctx.say('nathan', 'Qualquer uma! Eu como qualquer uma! Mas valeu, Bella.');
    if (i === 1) {
      if (c === 1) await ctx.say('vitoria', 'Bella... cebola. Eu falei da cebola.');
      else {
        acertos++;
        await ctx.say('vitoria', 'Sem cebola! Você é das minhas.');
      }
    }
    if (i === 2) {
      if (c === 0) acertos++;
      await ctx.say('weng', c === 0 ? 'Brigadeiro. Ela sabe o que faz.' : 'Ousada. Gostei.');
    }
    if (i === 0) acertos++;
  }
  await ctx.narrate('Quarenta minutos depois: três caixas abertas na mesa e sete pessoas brigando pela última fatia.');
  await ctx.say('ruan', 'A última é de quem contar a melhor história da viagem.');
  await ctx.say('felipe', 'A viagem começou HOJE.');
  const c = await ctx.choose('bella', '(A última fatia, esticando o queijo)', ['Dividir a fatia com o Weng', 'Dar pro Nathan, que tá de olho', 'Pegar e sair correndo']);
  if (c === 0) {
    await ctx.say('weng', 'Metade? O queijo não quer soltar... olha isso.');
    await ctx.emote('weng', 'heart');
    await ctx.say('vitoria', 'Gente, olha os dois puxando o queijo. Que grude. Que lindo.');
  } else if (c === 1) await ctx.say('nathan', 'Bella, você é a melhor pessoa dessa casa.');
  else await ctx.say('puggian', 'PEGA ELA! ...Ela já comeu. Ela é rápida.');
  ctx.hearts('player', acertos >= 2 ? 8 : 5);
  if (ctx.hasArt('memory-cf-01')) await ctx.memory('mem-cf-01');
  ctx.objective(Q, 'pizza');
  await ctx.fadeOut(600);
  await ctx.narrate('Dia 31 de dezembro. O último dia do ano amanheceu azul.');
  ctx.setFlag('cf-dia2');
  await ctx.fadeIn(500);
  await ctx.say('nathan', 'Hoje: Praia do Japonês, churrasco, e de noite a gente vê a virada na Praia do Forte!');
  await ctx.say('ruan', 'E como a gente vai pro Forte?');
  await ctx.say('nathan', 'Uber, ué. Fácil.');
  await ctx.say('weng', '(cochichando) Anota esse "fácil".');
  ctx.follow('weng', true);
  ctx.toast('Dia 2: saia pela porta pra Praia do Japonês');
}

async function cartas(ctx: ScriptContext): Promise<void> {
  await ctx.say('ruan', 'Ainda faltam umas horas pra virada. Gatinho-Bomba?');
  await ctx.say('bella', 'Eu nunca joguei. É difícil?');
  await ctx.say('nathan', 'É fácil. Até você explodir.');
  const r = await ctx.gatinho();
  ctx.setFlag('cf-gatinho-estrelas', r.stars);
  await ctx.say('felipe', r.place === 1 ? 'A Bella ganhou na primeira partida. Que roubo.' : 'O gatinho explodiu metade da mesa. Rodada histórica.');
  if (!ctx.has('baralho-gatinho')) await ctx.give('baralho-gatinho', 1, false, 'A turma deixou com você');
  if (ctx.hasArt('memory-cf-02')) await ctx.memory('mem-cf-02');
  ctx.objective(Q, 'cartas');
  await ctx.say('vitoria', 'GENTE. São dez da noite! Faltam DUAS HORAS pra virada!');
  await ctx.say('nathan', 'Relaxa, eu chamo o Uber.');
  await ctx.phone({ contact: 'Uber', clock: '22:01', caption: 'No celular do Nathan' }, [
    { from: 'them', text: 'Procurando motorista...' },
    { from: 'them', text: 'O motorista cancelou a corrida.' },
    { from: 'them', text: 'Procurando motorista...' },
    { from: 'them', text: 'Nenhum motorista disponível no momento.' },
    { from: 'me', text: '(tentando de novo)' },
    { from: 'them', text: 'Preço dinâmico: 4,8x. Procurando motorista...' },
    { from: 'them', text: 'O motorista cancelou a corrida.' },
  ]);
  await ctx.say('nathan', '...Nenhum aceita. NENHUM.');
  await ctx.say('ruan', 'Fácil, né?');
  await ctx.say('felipe', 'Quanto dá daqui até o Forte?');
  await ctx.say('puggian', 'Uns cinco quilômetros.');
  await ctx.say('bella', 'Cinco quilômetros. De tênis branco. Às dez da noite.');
  await ctx.say('weng', 'Ou isso, ou a gente vira o ano no sofá vendo a queima de fogos pela TV.');
  const c = await ctx.choose('bella', '(A turma inteira olhando pra ela)', ['"Bora andando. A gente consegue."', '"Eu vou, mas vou reclamar o caminho todo."', '"Weng, você me carrega se eu cansar?"']);
  if (c === 0) await ctx.say('vitoria', 'ISSO! A Bella falou, tá decidido!');
  else if (c === 1) await ctx.say('felipe', 'Justo. Reclamar faz parte.');
  else await ctx.say('weng', 'Carrego. Mas só depois do quilômetro quatro.');
  const k = await ctx.cincoKm();
  ctx.setFlag('cf-km-estrelas', k.stars);
  if (!ctx.has('chinelo-misterioso')) {
    await ctx.say('bella', 'Gente... eu ainda tô segurando aquele chinelo perdido do caminho.');
    await ctx.say('ruan', 'Leva. Vira o mascote da virada.');
    await ctx.give('chinelo-misterioso', 1, false, 'Você levou');
  }
  ctx.objective(Q, 'caminhada');
  await ctx.teleport('cf-forte', 'chegada');
}

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (!ctx.flag('cf-chegou')) {
      ctx.setFlag('cf-chegou');
      if (!ctx.questActive(Q) && !QuestSystem.isDone(Q)) ctx.startQuest(Q);
      ctx.outfit('praia', true);
      await ctx.narrate('Cabo Frio. Uma casa de praia alugada em Peró, a turma inteira e dois dias até a virada.');
      await ctx.say('nathan', 'CHEGAMOS! Casa de praia! Ventilador de teto! Rede! Coqueiro!');
      await ctx.say('vitoria', 'Amor, calma. A gente nem entrou direito.');
      await ctx.say('puggian', 'Três quartos e sete pessoas. Quem fica com o quarto bom?');
      await ctx.say('ruan', 'Quem chegou primeiro. Que fui eu. Tô no do meio.');
      const c = await ctx.choose('bella', '(Três portas, sete pessoas e uma briga se formando)', ['"O casal mais fofo fica com o quarto da janela."', '"Par ou ímpar pelo quarto bom!"', '"A gente fica com qualquer um, tô feliz de estar aqui."']);
      if (c === 0) {
        await ctx.say('nathan', 'Então é o MEU quarto. Eu e a Vitória somos o casal mais fofo.');
        await ctx.say('weng', 'Aí já é debate.');
      } else if (c === 1) {
        await ctx.say('felipe', 'Par ou ímpar! ...Ímpar! Perdeu, Ruan!');
        await ctx.say('ruan', 'Isso foi armado.');
      } else await ctx.say('vitoria', 'Gente, a Bella é muito boazinha. Dá o quarto da janela pra ela!');
      await ctx.narrate('No fim, ficou o quarto do canto pra Bella e pro Weng. O ventilador fazia um barulhinho que virou trilha sonora da viagem.');
      ctx.objective(Q, 'chegar');
      ctx.toast('Bora pra Praia do Peró! Saia pela porta');
      return;
    }
    if (noite2() && !ctx.flag('cf-noite2-1')) {
      ctx.setFlag('cf-noite2-1');
      ctx.outfit('branco', true);
      await ctx.narrate('Fim de tarde do dia 31. Banho, roupa branca e aquela ansiedade boa de virada.');
      await ctx.say('vitoria', 'Todo mundo de branco! Foto da turma!');
      await ctx.say('bella', 'Weng, você tá muito bonito de branco.');
      await ctx.say('weng', 'Você também. Combinando com o ano novo.');
      ctx.toast('Gatinho-Bomba na mesinha antes de sair');
    }
  },
  async porta(ctx) {
    if (objActive('pero')) {
      await ctx.say('weng', 'Bora! A praia é logo ali, é só descer pela passarela.');
      await ctx.teleport('cf-pero', 'chegada');
      return;
    }
    if (objActive('pizza')) {
      await ctx.say('weng', 'Agora é hora da pizza! Todo mundo tá na mesa.');
      return;
    }
    if (GameState.is('cf-dia2') && objActive('japones')) {
      await ctx.say('nathan', 'Praia do Japonês! Dizem que a água parece piscina.');
      await ctx.teleport('cf-japones', 'chegada');
      return;
    }
    if (objActive('cartas')) {
      await ctx.say('weng', 'Ainda dá tempo de uma partida de Gatinho-Bomba antes de sair.');
      return;
    }
    await ctx.say('weng', 'A virada é na Praia do Forte. Bora!');
  },
  async mesa(ctx) {
    if (objDone('pero') && objActive('pizza')) return pizza(ctx);
    await ctx.say('bella', objDone('pizza') ? 'Sobrou uma borda. Ninguém assume a borda.' : 'Uma mesa enorme. Daqui a pouco tá cheia de caixa de pizza.');
  },
  async mesinha(ctx) {
    if (noite2() && objActive('cartas')) return cartas(ctx);
    await ctx.say('bella', 'Um baralho de gatinhos. Que fofo... por que um deles tá segurando uma bomba?');
  },
  async quartos(ctx) {
    await ctx.say('bella', 'Três quartos, sete pessoas e um único chuveiro com água quente. Vai ser uma aventura.');
  },
  async prancha(ctx) {
    await ctx.say('weng', 'Uma prancha de surf. Decorativa. Ninguém aqui sabe surfar.');
    await ctx.say('felipe', 'EU sei. ...Mais ou menos.');
  },
  async rede(ctx) {
    await ctx.say('bella', 'A rede da varanda! Eu vou dormir aqui depois do almoço. Ninguém tira.');
  },
  async nathan(ctx) {
    await ctx.say('nathan', noite2() ? 'Relaxa que eu chamo o Uber. Vai ser fácil.' : 'Melhor viagem! E nem começou!');
  },
  async vitoria(ctx) {
    await ctx.say('vitoria', noite2() ? 'Branco combinou com você, Bella! Foto depois!' : 'Bella, você trouxe protetor? O meu acabou na primeira hora.');
  },
  async ruan(ctx) {
    await ctx.say('ruan', objDone('cartas') ? 'Eu explodi primeiro. Lavo a louça. Justo.' : 'Gatinho-Bomba hoje à noite. Prepara o coração.');
  },
  async felipe(ctx) {
    await ctx.say('felipe', 'Cabo Frio, galera! Água gelada e areia branquinha.');
  },
  async puggian(ctx) {
    await ctx.say('puggian', 'Quem acabar com o gelo do isopor vai repor. Tô de olho.');
  },
};

/** Capítulo 7 — Cabo Frio: a casa de praia em Peró. */
export const cfCasaMap: MapDef = {
  id: 'cf-casa',
  region: 'cabo-frio',
  name: 'Casa de praia em Peró',
  indoor: true,
  music: 'casa',
  background: '#2a1e2e',
  art: 'native',
  lighting: {
    darkness: 0.08,
    color: 0x3a2040,
    lights: [
      { x: 456, y: 93, r: 120 }, { x: 629, y: 93, r: 120 }, { x: 844, y: 93, r: 120 }, { x: 69, y: 467, r: 120 },
      { x: 751, y: 380, r: 200, color: 0xffd080 }, { x: 1227, y: 125, r: 140 },
      { x: 140, y: 673, r: 75 }, { x: 235, y: 673, r: 75 }, { x: 330, y: 673, r: 75 }, { x: 425, y: 673, r: 75 }, { x: 520, y: 673, r: 75 }, { x: 615, y: 673, r: 75 }, { x: 710, y: 673, r: 75 }, { x: 805, y: 673, r: 75 }, { x: 900, y: 673, r: 75 }, { x: 995, y: 673, r: 75 }, { x: 1090, y: 673, r: 75 }, { x: 1185, y: 673, r: 75 },
    ],
  },
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 1536, 250), // parede do fundo e as portas dos quartos
    R(1040, 250, 1400, 290), // bancada da cozinha
    R(0, 250, 150, 1024), // parede da esquerda (porta só pra interagir)
    R(1447, 250, 1536, 1024), // parede da direita
    R(0, 600, 1536, 1024), // telhado da varanda, vidro e jardim
    // objetos: só a base
    R(360, 470, 760, 565), // mesa com as pizzas
    R(1035, 370, 1325, 432), // sofá
    R(1060, 510, 1300, 572), // mesinha das cartas
    R(905, 262, 1015, 302), // isopor
  ],

  objects: [
    // sempre visível: sumia no 2º dia, mas a sombra, a colisão e o "Mesa" continuavam ali (as caixas de pizza de ontem ficam)
    { key: 'cf-mesa', x: 560, y: 568, w: 430, shadow: 0.8 },
    { key: 'cf-sofa', x: 1180, y: 434, w: 300, shadow: 0.8 },
    { key: 'cf-mesinha', x: 1180, y: 574, w: 260, shadow: 0.7 },
    { key: 'cf-isopor', x: 960, y: 304, w: 110, shadow: 0.6, solid: 0.8 },
  ],

  npcs: [
    { id: 'nathan', sprite: 'nathan', tx: 990 / 48, ty: 470 / 48, facing: 'left', interact: 'nathan' },
    { id: 'vitoria', sprite: 'vitoria', tx: 1370 / 48, ty: 470 / 48, facing: 'left', interact: 'vitoria' },
    { id: 'ruan', sprite: 'ruan', tx: 1250 / 48, ty: 325 / 48, facing: 'down', interact: 'ruan' },
    { id: 'felipe', sprite: 'felipe', tx: 300 / 48, ty: 450 / 48, facing: 'right', interact: 'felipe' },
    { id: 'puggian', sprite: 'puggian', tx: 820 / 48, ty: 330 / 48, facing: 'down', interact: 'puggian' },
  ],

  hotspots: [
    { rect: R(90, 380, 210, 600), interact: 'porta', label: 'Porta', marker: { dir: 'left' }, markerIf: () => objActive('pero') || (GameState.is('cf-dia2') && objActive('japones') && !noite2()) },
    { rect: R(360, 430, 760, 580), interact: 'mesa', label: 'Mesa', markerIf: () => objDone('pero') && objActive('pizza') },
    { rect: R(1060, 470, 1300, 590), interact: 'mesinha', label: 'Mesinha', markerIf: () => noite2() && objActive('cartas') },
    { rect: R(320, 170, 1000, 262), interact: 'quartos', label: 'Quartos' },
    { rect: R(160, 150, 240, 330), interact: 'prancha', label: 'Prancha' },
    { rect: R(960, 570, 1220, 600), interact: 'rede', label: 'Rede' },
  ],

  spawns: {
    porta: { tx: 230 / 48, ty: 520 / 48, facing: 'right' },
  },
  scripts,
  onEnter: 'chegada',
};
