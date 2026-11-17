import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { GameState } from '@/core/GameState';

const Q = 'nt-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
/** Retângulo no cenário ORIGINAL (art-source/maps/nt-onfire.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('nt-of-chegou')) return;
    ctx.setFlag('nt-of-chegou');
    await ctx.narrate('On Fire American BBQ, em São Francisco. Cheiro de lenha, tijolo à vista e um defumador do tamanho de um carro.');
    await ctx.say('diego', 'Olha o tamanho desse defumador! Doze horas de brisket, Bella. DOZE.');
    await ctx.say('bella', 'Diego, você já falou isso umas cinco vezes.');
    await ctx.say('diego', 'E vou falar mais cinco.');
    await ctx.say('tio-nt', 'Mesa grande pra todo mundo! Escolham o que quiser, hoje é por minha conta.');
    await ctx.say('mingau', 'Eu vou no escorregador primeiro!');
    await ctx.say('mae-lilian', 'Primeiro come, depois escorrega! Nessa ordem!');
    ctx.toast('Vá até o balcão pedir as bandejas');
  },
  async balcao(ctx) {
    if (!objActive('almoco')) {
      await ctx.say('weng', objDone('almoco') ? 'Mais uma costela? ...Tá. Só uma.' : 'O balcão do pitmaster.');
      return;
    }
    await ctx.say('weng', 'Moço, é uma bandeja pra cada um. Nove. Eu te ajudo a montar!');
    await ctx.say('bella', 'Você vai montar a bandeja de todo mundo?');
    await ctx.say('weng', 'Eu sei o que cada um gosta. É meu superpoder de família.');
    const r = await ctx.bandeja();
    ctx.setFlag('nt-bandeja-estrelas', r.stars);
    await ctx.fadeOut(600);
    await ctx.narrate('A mesa grande lotada de bandeja. Brisket com o anel rosa da fumaça, costela brilhando de molho, batata, milho, mac and cheese.');
    await ctx.fadeIn(500);
    await ctx.say('tio-nt', r.stars >= 2 ? 'Acertou o pedido de todo mundo! Até o do Diego, que pediu metade do cardápio.' : 'Teve uma trocadinha aqui e ali, mas ninguém tá reclamando com a boca cheia.');
    await ctx.say('vinicius', 'Primeira vez aqui. Já quero voltar.');
    await ctx.say('lilian', 'Viu? Eu falei que a família é legal.');
    await ctx.say('mingau', 'A Bella tá com molho na bochecha!');
    await ctx.say('bella', 'O Weng também tá!');
    await ctx.say('weng', 'É estilo. Churrasco americano se come assim.');
    const c = await ctx.choose('bella', '(A costela desmanchando, a família inteira rindo)', ['"Melhor costela da minha vida."', 'Limpar o molho da bochecha dele', '"Tia, a senhora trouxe chocolate pra sobremesa?"']);
    if (c === 0) await ctx.say('diego', 'DOZE HORAS, Bella. Agora você entende.');
    else if (c === 1) {
      await ctx.emote('weng', 'heart');
      await ctx.say('vivian', 'Aaaaah! Para que eu vou chorar no meu milho.');
    } else await ctx.say('mae-lilian', '(abrindo a bolsa) Mas é CLARO que eu trouxe.');
    await ctx.say('tio-nt', 'Bella, volta sempre, viu? Aqui é a sua casa também.');
    await ctx.say('bella', '(baixinho) Weng... sua família é muito boa.');
    await ctx.say('weng', 'Agora é a sua também. A metade que dá chocolate e a metade que dá pato.');
    ctx.hearts('player', 12);
    if (ctx.hasArt('memory-nt-03')) await ctx.memory('mem-nt-03');
    ctx.objective(Q, 'almoco');
    await ctx.fadeOut(700);
    await ctx.chapterCard('Fim do Capítulo 6', 'Niterói', 'Do outro lado da baía.', 'Continuar', {
      title: 'Do outro lado da baía',
      photos: ['memory-nt-01', 'memory-nt-02', 'memory-nt-03'].filter((k) => ctx.hasArt(k)),
      lines: [
        'Icaraí, um apartamento com o mar na janela e a família da mãe da Lilian.',
        'Uma cesta inteira de chocolate (e um brócolis escondido no meio).',
        'O Caminho Niemeyer no fim de tarde, com o Rio do outro lado da baía.',
        'E o churrasco no On Fire: nove bandejas, molho na bochecha e o Vinicius aprovado.',
      ],
    });
    // a turma chama pro réveillon em Cabo Frio
    await ctx.narrate('Fim de dezembro.');
    await ctx.phone({ contact: 'Réveillon Cabo Frio', clock: '20:13', caption: 'Grupo no celular do Weng' }, [
      { from: 'them', text: 'Nathan: GALERA. Casa de praia em Peró pro réveillon. Tô fechando.' },
      { from: 'them', text: 'Vitória: Três quartos, rede, coqueiro e piscina natural perto!' },
      { from: 'them', text: 'Ruan: Quanto fica pra cada?' },
      { from: 'them', text: 'Puggian: Eu levo a churrasqueira portátil' },
      { from: 'them', text: 'Felipe: Eu levo a bola de altinha' },
      { from: 'me', text: 'Eu e a Bella tamo dentro!! 🧡' },
      { from: 'them', text: 'Nathan: E na virada a gente vai pra Praia do Forte. De Uber. Fácil.' },
      { from: 'them', text: 'Vitória: Todo mundo de BRANCO, hein!' },
    ]);
    await ctx.say('weng', 'Bella! Réveillon em Cabo Frio com a turma. Casa de praia em Peró!');
    await ctx.say('bella', 'Com o Nathan, a Vitória, o Ruan, o Felipe e o Puggian? Todo mundo junto?');
    await ctx.say('weng', 'Todo mundo. E o Nathan disse que a gente vai de Uber pra virada. Fácil.');
    await ctx.say('bella', 'Quando o Nathan fala "fácil" eu fico preocupada.');
    await ctx.roadTrip(
      'Niterói',
      'Cabo Frio',
      [
        { who: 'bella', text: 'Eu trouxe roupa branca, protetor, chapéu e um baralho.' },
        { who: 'weng', text: 'Baralho? Pra quê?' },
        { who: 'bella', text: 'A Vitória disse que tem um jogo de gatinho que todo mundo grita. Eu quero aprender.' },
        { who: 'weng', text: 'Olha as salinas! Cabo Frio tá chegando.' },
        { who: 'bella', text: 'Dois dias de praia com a turma e virada na areia. Melhor fim de ano.' },
        { who: 'weng', text: 'Chegamos em Peró. Lá tá a casa!' },
      ],
      ['pr-palmeira', 'rs-palmeira'],
      { coast: true, sunset: false },
    );
    ctx.unlockRegion('cabo-frio');
    await ctx.chapterCard('Capítulo 7', 'Cabo Frio', 'A virada a pé.', 'Começar');
    if (!GameState.data.regionsVisited.includes('cabo-frio')) GameState.data.regionsVisited.push('cabo-frio');
    if (!ctx.questActive('cf-m1') && !QuestSystem.isDone('cf-m1')) ctx.startQuest('cf-m1');
    await ctx.teleport('cf-casa', 'porta');
  },
  async defumador(ctx) {
    await ctx.say('diego', 'Esse é o defumador. A gente podia morar aqui dentro.');
    await ctx.say('bella', 'Tá quentinho, pelo menos.');
  },
  async escorrega(ctx) {
    await ctx.say('mingau', objDone('almoco') ? 'Agora sim! Comi e vou escorregar! Nessa ordem!' : 'A tia disse que só depois de comer...');
  },
  async neon(ctx) {
    await ctx.say('bella', 'Um boi de neon. Só pra lembrar que aqui ninguém é vegetariano.');
  },
  async tio(ctx) {
    await ctx.say('tio-nt', objDone('almoco') ? 'Comeu bem? Leva um pouco pra viagem!' : 'Pede o que quiser, hein! Hoje é por minha conta.');
  },
  async mae(ctx) {
    await ctx.say('mae-lilian', 'Guardei um chocolate na bolsa pra sobremesa. Ou dois. Ou a bolsa toda.');
  },
  async lilian(ctx) {
    await ctx.say('lilian', 'O Vinicius tá adorando. Ele já te chamou de cunhada?');
    await ctx.say('vinicius', 'Ainda não. Mas tô treinando.');
  },
  async vivian(ctx) {
    await ctx.say('vivian', 'Esse lugar é a cara do Diego. Fumaça, carne e barulho.');
  },
  async diegoTalk(ctx) {
    await ctx.say('diego', objDone('almoco') ? 'Comi três bandejas. Eu tô feliz e com sono.' : 'Doze horas, Bella. Você já sabe.');
  },
  async mingauTalk(ctx) {
    await ctx.say('mingau', 'Depois do almoço eu vou no escorregador. Você vem?');
  },
  async porta(ctx) {
    await ctx.say('weng', objDone('almoco') ? 'Bora pra casa? Ainda tem chocolate na bolsa.' : 'Sem churrasco ninguém sai daqui!');
  },
};

/** Capítulo 6 — Niterói: o churrasco americano no On Fire. */
export const ntOnFireMap: MapDef = {
  id: 'nt-onfire',
  region: 'niteroi',
  name: 'On Fire American BBQ',
  indoor: true,
  music: 'casa',
  background: '#1a0c08',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  blocks: [
    R(0, 0, 1536, 250), // parede de tijolo, neon, defumador e churrasqueira
    R(490, 250, 1335, 390), // balcão
    R(1300, 150, 1430, 310), // geladeira
    R(60, 60, 400, 415), // cantinho das crianças (elevado)
    R(0, 0, 62, 1024), // parede da esquerda
    R(1478, 0, 1536, 1024), // parede da direita
    R(0, 785, 645, 1024), // vitrine (esq.)
    R(905, 785, 1536, 1024), // vitrine (dir.)
    R(645, 800, 905, 1024), // porta de vidro (só pra interagir)
    R(30, 700, 130, 780), // planta (esq.)
    R(1405, 700, 1505, 780), // planta (dir.)
    // objetos: só a base
    R(588, 560, 1072, 668), // mesa grande
    R(600, 470, 1060, 512), // cadeiras de trás
    R(105, 610, 405, 670), // banco estofado
    R(1290, 560, 1370, 600), // planta no barril
  ],

  objects: [
    ...[640, 730, 820, 910, 1000].map((x) => ({ key: 'no-cadeira', x, y: 512, w: 78, shadow: 0.5 })),
    { key: 'no-mesa', x: 830, y: 668, w: 500, shadow: 0.9 },
    { key: 'no-balde', x: 900, y: 600, w: 58, shadow: false, base: 680 },
    { key: 'no-banco', x: 255, y: 672, w: 300, shadow: 0.8 },
    { key: 'no-planta', x: 1330, y: 602, w: 110, shadow: 0.6 },
  ],

  npcs: [
    { id: 'tio-nt', sprite: 'tio-nt', tx: 548 / 48, ty: 620 / 48, facing: 'right', interact: 'tio' },
    { id: 'mae-lilian', sprite: 'mae-lilian', tx: 1112 / 48, ty: 620 / 48, facing: 'left', interact: 'mae' },
    { id: 'lilian', sprite: 'lilian', tx: 470 / 48, ty: 500 / 48, facing: 'down', interact: 'lilian' },
    { id: 'vinicius', sprite: 'vinicius', tx: 530 / 48, ty: 500 / 48, facing: 'down', interact: 'lilian' },
    { id: 'vivian', sprite: 'vivian', tx: 1160 / 48, ty: 500 / 48, facing: 'down', interact: 'vivian' },
    { id: 'diego', sprite: 'diego', tx: 760 / 48, ty: 425 / 48, facing: 'up', interact: 'diegoTalk' },
    { id: 'mingau', sprite: 'mingau', tx: 445 / 48, ty: 440 / 48, facing: 'left', interact: 'mingauTalk' },
  ],

  hotspots: [
    { rect: R(880, 370, 1180, 440), interact: 'balcao', label: 'Balcão', markerIf: () => objActive('almoco') },
    { rect: R(520, 230, 820, 300), interact: 'defumador', label: 'Defumador' },
    { rect: R(100, 380, 400, 440), interact: 'escorrega', label: 'Escorregador' },
    { rect: R(560, 230, 700, 260), interact: 'neon', label: 'Neon' },
    { rect: R(645, 770, 905, 800), interact: 'porta', label: 'Porta' },
  ],

  spawns: {
    porta: { tx: 775 / 48, ty: 735 / 48, facing: 'up' },
  },
  scripts,
  onEnter: 'chegada',
};
