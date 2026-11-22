import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';
import { InventorySystem } from '@/systems/InventorySystem';

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

/** Cada brinquedo gasta uma ficha da mochila; sem ficha, a Bella lembra da bilheteria. */
async function pagar(ctx: ScriptContext, brinquedo: string): Promise<boolean> {
  if (!ctx.flag('ar-fichas')) {
    await ctx.say('weng', `Pro ${brinquedo} precisa de ficha. A tia Tim deixou as nossas na bilheteria, do lado do portão.`);
    return false;
  }
  if (!ctx.has('fichas-parque')) {
    await ctx.say('bella', 'Ih, acabaram as fichas. Vou na bilheteria comprar mais uma.');
    return false;
  }
  // a Bella entrega a ficha: escolher na barra de itens (outro item = o moço estranha)
  const ESTRANHO: Record<string, string> = {
    'pedra-coracao': 'Moça, isso é uma pedra. Bonita, mas é uma pedra.',
    'urso-araruama': 'O ursinho não paga brinquedo não, moça.',
    chaveirinho: 'Chaveirinho não vale como ficha, desculpa!',
  };
  for (let tries = 0; tries < 3; tries++) {
    const id = await ctx.pickItem(`Entregue 1 ficha pro moço do ${brinquedo}`);
    if (id === 'fichas-parque') {
      ctx.take('fichas-parque');
      ctx.sfx('blip');
      ctx.toast(`Usou 1 ficha · sobraram ${ctx.count('fichas-parque')}`);
      return true;
    }
    await ctx.say('bella', ESTRANHO[id] ?? 'Ops, isso não é ficha. Cadê a ficha amarela?');
  }
  await ctx.say('weng', '(rindo) Deixa que eu entrego. É a amarela, amor.');
  ctx.take('fichas-parque');
  ctx.sfx('blip');
  return true;
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
    if (!(await pagar(ctx, 'carrossel'))) return;
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
    if (!(await pagar(ctx, 'bate-bate'))) return;
    await ctx.say('mingau', 'Bate-bate! Weng, Bella, vocês vão perder. Eu sou o melhor da família.');
    await ctx.say('diego', 'Ele diz isso todo ano. E todo ano fica preso na parede.');
    await ctx.say('mingau', 'Quem fica preso na parede é VOCÊ, Diego.');
    await ctx.say('bella', 'Weng, você pisa e eu dirijo. Combinado?');
    await ctx.say('weng', 'Você vai dirigir? ...Combinado. Que Deus nos proteja.');
    const r = await ctx.bateBate();
    ctx.setFlag('ar-bate-estrelas', r.stars);
    if (r.stars >= 2) {
      await ctx.say('mingau', 'Não valeu! A Bella tava pilotando! Revanche!');
      await ctx.say('bella', 'Revanche aceita. Perde de novo amanhã.');
    } else {
      await ctx.say('mingau', 'EU FALEI! Eu sou o rei do bate-bate!');
      await ctx.say('weng', 'Ano que vem a gente treina antes. Escondido.');
    }
    await ctx.say('diego', '(saindo do carrinho) Fiquei preso na parede. De novo.');
    ctx.hearts('player', 5);
    ctx.objective(Q, 'bate');
    await falta(ctx);
  },

  async argolas(ctx) {
    if (!objActive('argolas')) {
      await ctx.say('bella', GameState.is('ar-pelucia') ? 'O ursinho laranja tá aqui comigo. Ele vai morar na minha cama.' : 'O chaveirinho de consolação. Eu amei mesmo assim.');
      return;
    }
    if (!(await pagar(ctx, 'jogo das argolas'))) return;
    await ctx.say('vivian', 'Weng, você vai tentar as argolas? Você nunca ganhou NADA nesse parque.');
    await ctx.say('weng', 'Hoje é diferente. Hoje eu tenho motivação.');
    const r = await ctx.argolas();
    ctx.setFlag('ar-argolas-estrelas', r.stars);
    if (r.prize) {
      ctx.setFlag('ar-pelucia');
      await ctx.say('vivian', 'Não acredito! Ele ganhou! Bella, você é amuleto da sorte!');
      await ctx.say('bella', '(abraçando o ursinho) Ele vai se chamar Araruama.');
      await ctx.give('urso-araruama', 1, false, 'O Weng ganhou pra você');
    } else {
      await ctx.say('vivian', 'Tradição mantida: o Weng nunca ganha nada nas argolas.');
      await ctx.say('bella', 'Mas o chaveirinho é muito fofo. Vou colocar na minha bolsa.');
      await ctx.give('chaveirinho', 1, false, 'Prêmio de consolação');
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
    if (!(await pagar(ctx, 'roda-gigante'))) return;
    await ctx.say('weng', 'Agora sim. Só eu e você.');
    await ctx.fadeOut(600);
    await ctx.ferris('spin');
    await ctx.narrate('A cabine subiu devagar. Lá embaixo, as luzes do parque e a lagoa escura.');
    await ctx.say('bella', 'Tá subindo... tá subindo... Weng, segura minha mão.');
    await ctx.say('weng', 'Já tô segurando faz tempo.');
    await ctx.ferris('top');
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
    await ctx.say('bella', 'Espera! Selfie! Aqui em cima, com a lagoa atrás. Encosta, encosta.');
    await ctx.say('weng', 'Segura o ursinho que ele tem que sair também.');
    await ctx.selfie('memory-ar-02', 'Lá no alto da roda-gigante · Araruama, 1º de janeiro');
    await ctx.say('bella', 'Ficou perfeita. Essa vai pro fundo de tela.');
    await ctx.ferris(null);
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
    // o pai da Bella chama os dois pra praia em Rio das Ostras
    await ctx.narrate('Algum tempo depois.');
    await ctx.phone({ contact: 'Pai', avatar: 'portrait-pai-ro', clock: '09:12', caption: 'No celular da Bella' }, [
      { from: 'them', text: 'Filha, bom dia' },
      { from: 'them', text: 'Sábado eu vou pra Rio das Ostras passar o dia na praia. Bora?' },
      { from: 'them', text: 'Chama o Weng também' },
      { from: 'me', text: 'Bora!!! Vai ter guarda-sol né pai?' },
      { from: 'them', text: 'Guarda-sol a gente vê lá' },
      { from: 'me', text: 'Pai...' },
      { from: 'them', text: 'Eu levo fruta e torrada. Não precisa gastar com nada' },
      { from: 'me', text: 'Já sei que vai ser sol na cabeça o dia inteiro 😂' },
      { from: 'them', text: 'Sol faz bem! Vitamina D. Saio às 7, não atrasa' },
      { from: 'me', text: 'Tá bom pai. A gente vai 🐥' },
    ]);
    await ctx.say('bella', 'Weng, meu pai chamou a gente pra praia em Rio das Ostras no sábado.');
    await ctx.say('weng', 'Praia com o seu pai? Bora! Ele vai alugar guarda-sol?');
    await ctx.say('bella', 'Ele disse "a gente vê lá". O que significa: não.');
    await ctx.say('weng', 'Eu levo protetor. O fator mais alto que existir.');
    await ctx.roadTrip(
      'Araruama',
      'Rio das Ostras',
      [
        { who: 'bella', text: 'Sete da manhã de sábado. Só meu pai pra achar isso normal.' },
        { who: 'weng', text: 'Ele já mandou três áudios perguntando se a gente saiu.' },
        { who: 'bella', text: 'E a torrada? Ele vai mesmo levar torrada pra praia?' },
        { who: 'weng', text: 'Torrada e fruta. Numa bolsa térmica. Ele me mostrou a foto.' },
        { who: 'bella', text: 'Olha o mar! Abre a janela, abre a janela!' },
        { who: 'weng', text: 'Rio das Ostras. Hoje o dia é de praia.' },
      ],
      ['pr-palmeira', 'rs-palmeira'],
      { coast: true, sunset: false },
    );
    await ctx.chapterCard('Capítulo 5', 'Rio das Ostras', 'Um dia de praia.', 'Começar');
    ctx.unlockRegion('rio-das-ostras');
    if (!GameState.data.regionsVisited.includes('rio-das-ostras')) GameState.data.regionsVisited.push('rio-das-ostras');
    if (!ctx.questActive('ro-m1') && !QuestSystem.isDone('ro-m1')) ctx.startQuest('ro-m1');
    await ctx.teleport('ro-praia', 'chegada');
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
    if (ctx.flag('ar-algodao')) {
      await ctx.say('bella', 'Ainda tô com a boca rosa do algodão-doce.');
      return;
    }
    ctx.setFlag('ar-algodao');
    await ctx.say('bella', 'Algodão-doce rosa! Igual o do Quitandinha, lembra?');
    await ctx.say('weng', 'Lembro. Você comeu o seu e metade do meu.');
    const c = await ctx.choose('bella', '(Um algodão-doce gigante, um palito só)', ['Dividir com ele', 'Comer tudo sozinha', 'Dar um pedaço pra Laylinha']);
    if (c === 0) await ctx.say('weng', 'Dividir algodão-doce é praticamente casar. Só pra você saber.');
    else if (c === 1) await ctx.say('weng', 'Eu sabia. Eu SEMPRE sei.');
    else {
      await ctx.say('laylinha', 'OBRIGADA TIA BELLA! (com a cara inteira rosa)');
      ctx.hearts('player', 3);
    }
    ctx.sfx('pickup');
  },
  async churros(ctx) {
    if (!ctx.flag('ar-churros') && objDone('roda')) {
      ctx.setFlag('ar-churros');
      await ctx.say('weng', 'Agora sim: churros de doce de leite. Prometi, tá prometido.');
      ctx.sfx('pickup');
      await ctx.say('bella', '(com doce de leite no nariz) Melhor ano-novo. Já falei isso?');
      await ctx.say('weng', 'Umas seis vezes. Pode falar de novo.');
      return;
    }
    await ctx.say('weng', 'Churros de doce de leite. Depois da roda-gigante, pra não passar mal.');
  },
  async bilheteria(ctx) {
    if (!ctx.flag('ar-fichas')) {
      ctx.setFlag('ar-fichas');
      await ctx.say('bella', 'A bilheteria. A tia Tim comprou ficha pra todo mundo antes de a gente chegar.');
      await ctx.say('vivian', 'As de vocês tão aqui! Quatro: carrossel, bate-bate, argolas... e a roda-gigante.');
      await ctx.give('fichas-parque', 4, false, 'A Vivian te deu');
      await ctx.say('weng', 'A última é da roda-gigante. Não gasta ela à toa, hein?');
      ctx.toast('Cada brinquedo gasta 1 ficha · veja na Mochila');
      return;
    }
    if (!ctx.has('fichas-parque') && !objDone('roda')) {
      await ctx.say('bella', 'Acabaram as fichas... Moço, mais uma, por favor!');
      await ctx.give('fichas-parque', 1, false, 'Você comprou');
      return;
    }
    await ctx.say('bella', ctx.count('fichas-parque') ? `Ainda tenho ${ctx.count('fichas-parque')} ficha${ctx.count('fichas-parque') > 1 ? 's' : ''}. Bora gastar!` : 'Bilheteria fechando. A noite foi perfeita.');
  },
  async baloes(ctx) {
    if (ctx.flag('ar-balao')) {
      await ctx.say('bella', 'A Laylinha não larga o balão rosa por nada.');
      return;
    }
    ctx.setFlag('ar-balao');
    await ctx.say('bella', 'Um balão pra Laylinha? Ela ia amar o rosa.');
    await ctx.say('weng', 'Moço, um rosa, por favor!');
    ctx.sfx('pickup');
    await ctx.say('laylinha', 'É PRA MIM?! Tia Bella, você é a minha tia preferida!');
    await ctx.say('weng', '(cochichando) Pronto. Agora você ganhou de todas as tias de verdade.');
    ctx.hearts('player', 4);
  },
  async mingauTalk(ctx) {
    await ctx.say('mingau', objDone('bate') ? 'Revanche no bate-bate! Ano que vem! Tá marcado!' : 'Vão no bate-bate? Eu tô esperando. Com fome de vitória.');
  },
  async diegoTalk(ctx) {
    await ctx.say('diego', objDone('bate') ? 'Minha meta pro ano: não ficar preso na parede do bate-bate.' : 'Eu vou no bate-bate só pra ver o Mingau perder.');
  },
  async vivianTalk(ctx) {
    await ctx.say('vivian', objDone('argolas') ? 'Bella, o Weng nunca ganhou nada aqui antes de você. Sério.' : 'Desafio o Weng a ganhar uma pelúcia nas argolas. Duvido!');
  },
  async julinhaTalk(ctx) {
    await ctx.say('julinha', 'Eu tô cuidando da pipoca. Ninguém mexe. Só a Laylinha. E a Bella. E... tá, pode pegar.');
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
  lighting: {
    darkness: 0.14,
    color: 0x1a1040,
    lights: [
      { x: 470, y: 470, r: 280 }, { x: 770, y: 760, r: 220 }, { x: 1150, y: 150, r: 300, color: 0xff7ad0 }, { x: 280, y: 130, r: 260, color: 0xffa0e0 },
      { x: 1306, y: 560, r: 240 }, { x: 614, y: 81, r: 100 }, { x: 760, y: 542, r: 100 }, { x: 1175, y: 665, r: 100 }, { x: 18, y: 404, r: 90 }, { x: 1083, y: 396, r: 100 },
    ],
  },
  ambient: 'fireflies',
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 450, 292), // roda-gigante (base) e cerca
    R(450, 0, 575, 175), // cerca da roda (lado direito, que faz curva pra cima)
    R(575, 0, 770, 60), // fundo
    R(770, 0, 1536, 385), // pista do bate-bate e cerca
    R(245, 505, 690, 700), // base do carrossel
    R(262, 350, 675, 505), // atrás do carrossel (fica um corredor livre entre o carrossel e a roda-gigante)
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
    R(795, 385, 1085, 455), // atrás da barraca (ninguém some atrás dela)
    R(150, 755, 250, 790), // pipoca
    R(1010, 800, 1110, 832), // algodão-doce (na grama, perto das barracas)
    R(425, 820, 520, 852), // bilheteria (ao lado do portal)
    R(355, 832, 390, 850), // balões
    R(585, 222, 675, 252), // churros (no caminho de cima, perto da roda)
  ],

  objects: [
    { key: 'pq-argolas', x: 940, y: 506, w: 300, shadow: 0.5 },
    { key: 'pq-pipoca', x: 200, y: 792, w: 120, shadow: 0.6 },
    { key: 'pq-algodao', x: 1060, y: 834, w: 115, shadow: 0.6 },
    { key: 'pq-churros', x: 630, y: 254, w: 115, shadow: 0.6 },
    { key: 'pq-bilheteria', x: 472, y: 854, w: 105, shadow: 0.6 },
    { key: 'pq-baloes', x: 372, y: 852, w: 62, shadow: 0.4 },
  ],

  overlays: [
    // a cobertura do carrossel passa na frente de quem anda atrás dele
    // (contorno exato do carrossel: telhado, colunas e plataforma, sem o chão em volta)
    {
      x0: 240, y0: 248, x1: 700, y1: 706, base: 700,
      poly: [
        [467, 250], [482, 250], [496, 294], [500, 309], [550, 316], [625, 333], [667, 344], [693, 368], [697, 392], [683, 446], [652, 478],
        [649, 520], [680, 540], [688, 565], [687, 632], [676, 661], [600, 694], [475, 704], [350, 699], [250, 662], [241, 630], [244, 565],
        [255, 530], [286, 500], [281, 470], [249, 432], [245, 395], [258, 363], [300, 343], [350, 326], [397, 315], [437, 294],
      ],
    },
    // o arco do portal: quem passa por baixo fica atrás da parte de cima
    // (contorno exato do arco e dos pilares; o vão do meio fica livre, senão o chão tapa quem passa)
    {
      x0: 536, y0: 690, x1: 998, y1: 968, base: 990,
      poly: [
        [540, 964], [540, 816], [556, 789], [580, 789], [578, 757], [590, 738], [605, 723], [626, 728], [631, 752], [655, 718],
        [705, 700], [765, 695], [830, 705], [880, 728], [904, 748], [914, 725], [941, 725], [957, 756], [957, 786], [981, 790],
        [994, 814], [994, 962], [896, 967], [884, 914], [884, 826], [890, 810], [855, 779], [765, 765], [680, 775], [650, 804],
        [651, 826], [651, 914], [651, 962],
      ],
    },
  ],

  npcs: [
    // a Laylinha perto do algodão-doce (antes ficava em cima do arco)
    { id: 'laylinha', sprite: 'laylinha', tx: 1040 / 48, ty: 768 / 48, facing: 'down', interact: 'carrossel' },
    // Mingau e Diego na grade do bate-bate (fora do caminho principal)
    { id: 'mingau', sprite: 'mingau', tx: 860 / 48, ty: 575 / 48, facing: 'right', interact: 'mingauTalk' },
    { id: 'vivian', sprite: 'vivian', tx: 15.6, ty: 11.2, facing: 'down', interact: 'argolas' },
    { id: 'julinha', sprite: 'julinha', tx: 270 / 48, ty: 800 / 48, facing: 'left', interact: 'pipoca' },
    { id: 'diego', sprite: 'diego', tx: 720 / 48, ty: 560 / 48, facing: 'up', interact: 'diegoTalk' },
  ],

  hotspots: [
    { rect: R(245, 470, 690, 715), interact: 'carrossel', label: 'Carrossel', markerIf: () => objActive('carrossel') },
    // a entrada da pista é na quina da grade, à esquerda da barraca das argolas (antes a seta ficava em cima da barraca)
    { rect: R(690, 330, 795, 425), interact: 'bate', label: 'Bate-bate', markerIf: () => objActive('bate') },
    { rect: R(800, 400, 1080, 515), interact: 'argolas', label: 'Argolas', markerIf: () => objActive('argolas') },
    { rect: R(120, 250, 520, 330), interact: 'roda', label: 'Roda-gigante', markerIf: () => objActive('roda') && brinquedosFeitos() },
    { rect: R(150, 700, 250, 800), interact: 'pipoca', label: 'Pipoca' },
    { rect: R(1005, 740, 1115, 840), interact: 'algodao', label: 'Algodão-doce' },
    { rect: R(580, 170, 680, 260), interact: 'churros', label: 'Churros' },
    {
      rect: R(425, 760, 520, 860),
      interact: 'bilheteria',
      label: 'Bilheteria',
      // a primeira parada: pegar as fichas (e de novo se acabarem antes da roda-gigante)
      markerIf: () => (objActive('carrossel') || objActive('bate') || objActive('argolas') || objActive('roda')) && (!GameState.is('ar-fichas') || !InventorySystem.has('fichas-parque')),
    },
    { rect: R(345, 770, 395, 855), interact: 'baloes', label: 'Balões' },
  ],

  spawns: {
    entrada: { tx: 16.0, ty: 18.6, facing: 'up' },
  },
  triggers: [{ id: 'saida', rect: R(650, 975, 885, 990), script: 'saida' }],
  scripts,
  onEnter: 'chegada',
};
