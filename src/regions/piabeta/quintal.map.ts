import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL } from '@/data/personal';

const Q = 'dq-e2';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
const ALE = PERSONAL.bellaStepdad.name;

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-quintal-base.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (objDone('filme') && objActive('passeio')) ctx.toast('Saia pelo portão para passear');
    if (ctx.flag('dq-e2-intro')) return;
    ctx.setFlag('dq-e2-intro');
    // Domingo: a Bella já está no quintal; a campainha toca e ela corre abrir o portão pro Weng
    ctx.follow('weng', false);
    ctx.place('player', 20.4, 10.6, 'down');
    ctx.place('weng', 15.6, 18.6, 'up');
    ctx.setFlag('weng-segue');
    if (!ctx.questActive(Q) && !QuestSystem.isDone(Q)) ctx.startQuest(Q);
    ctx.refresh();
    ctx.visible('weng', false);
    ctx.face('mae-bella', 'down');
    ctx.face('avo-bella', 'down');
    await ctx.narrate('Domingo, uma da tarde. Cheiro de carvão no ar.');
    await ctx.say('pai-bella', '(assobiando, abanando a churrasqueira)');
    await ctx.wait(300);
    ctx.sfx('doorbell');
    await ctx.emote('bella', 'exclaim');
    await ctx.say('bella', 'É ele! MÃE! O WENG CHEGOU!');
    await ctx.say('mae-bella', 'Então vai abrir, menina! Tá esperando o quê?');
    await ctx.move('player', 19.6, 17.3, 70);
    await ctx.move('player', 17.9, 17.3, 70);
    ctx.face('player', 'down');
    ctx.sfx('door');
    ctx.visible('weng', true);
    // personagens maiores no quintal: espaço de sobra entre os dois
    await ctx.move('weng', 15.3, 17.4, 40);
    ctx.face('weng', 'bella');
    ctx.face('player', 'weng');
    await ctx.say('weng', 'Oi! Trouxe um refri. E uma banoffee de banana. Fui eu que fiz.');
    await ctx.say('bella', 'Você FEZ uma banoffee? Pra minha família? Weng...');
    await ctx.emote('weng', 'sweat');
    await ctx.say('weng', 'Fiz duas. A primeira desmontou toda. Essa é a que deu certo.');
    ctx.hearts('player', 4);
    await ctx.say('bella', 'Vem, entra! Todo mundo tá te esperando.');
    ctx.follow('weng', true);
    // todo mundo vira pra ver quem chegou
    ctx.face('mae-bella', 'weng');
    ctx.face('pai-bella', 'weng');
    ctx.face('avo-bella', 'weng');
    await ctx.say('mae-bella', 'Chegou o Weng! Entra, querido, fica à vontade. O Alexandre já acendeu a churrasqueira.');
    await ctx.say('mae-bella', 'Ai, trouxe sobremesa! Alexandre, ele mesmo FEZ uma banoffee!');
    await ctx.say('pai-bella', '(sem tirar o olho da carne) Banoffee. Hm. Eu faço uma melhor. Mas tudo bem.');
    await ctx.say('bella', '(E começou.)');
    await ctx.say('pai-bella', 'Weng, né? Já mexeu com churrasco de verdade? Não tô falando de grill elétrico de apartamento, não.');
    await ctx.emote('weng', 'sweat');
    await ctx.say('weng', 'Já ajudei umas vezes...');
    await ctx.say('pai-bella', '"Ajudou". Sei. Vem cá, então. Vamos ver se você aprende alguma coisa hoje.');
    await ctx.say('bella', '(baixinho) Desculpa. Ele é assim. Se acha o dono do fogo.');
    await ctx.say('weng', '(baixinho) Relaxa. Sorrir, concordar e não encostar no pegador. Decorei.');
    await ctx.say('bella', '(baixinho) Ele vai te MANDAR encostar no pegador. É uma armadilha.');
    await ctx.say('weng', '(baixinho) Então hoje eu ganho esse homem. Fica olhando.');
    // daqui em diante quem age é o Weng; a Bella acompanha, torcendo
    ctx.lead('weng');
    ctx.follow('bella', true);
    ctx.toast(`Agora é com o Weng! Vá até a churrasqueira do ${ALE}`);
  },

  async churrasqueira(ctx) {
    if (objActive('churrasco')) {
      await ctx.say('pai-bella', 'Chegou. Toma o pegador. Cuidado, que esse pegador tem mais tempo de casa que você.');
      await ctx.say('weng', 'Pode deixar, seu Alexandre.');
      await ctx.say('pai-bella', '"Seu" não. Alexandre. Não sou velho. Sou experiente.');
      await ctx.say('bella', '(revirando os olhos) E chato.');
      await ctx.say('pai-bella', 'Ouvi isso, mocinha.');
      // o Weng assume a churrasqueira (na frente, ao lado do Alexandre); a Bella fica atrás, torcendo
      ctx.follow('bella', false);
      await ctx.fadeOut(250);
      // o Weng na frente da grelha; o Alexandre logo atrás, de braços cruzados, fiscalizando;
      // a Bella mais atrás, perto da mesa (ninguém em cima de ninguém)
      ctx.place('weng', 6.7, 12.8, 'left');
      ctx.place('pai-bella', 7.9, 14.7, 'up');
      ctx.place('bella', 8.8, 16.4, 'up');
      await ctx.frame(7.6, 13.8, 0);
      await ctx.fadeIn(300);
      ctx.face('pai-bella', 'weng');
      ctx.face('bella', 'weng');
      await ctx.say('pai-bella', 'Regra número um: carne se vira UMA vez. Regra número dois: quem manda na churrasqueira sou eu. Regra três: ver regra dois.');
      await ctx.say('weng', 'Entendido. Uma vez. O senhor manda.');
      await ctx.say('pai-bella', 'E não me chama de senhor.');
      await ctx.say('bella', '(Vai, Weng! Mostra pra ele!)');
      const r = await ctx.grill({ title: 'O Weng na churrasqueira', helper: 'Alexandre' });
      ctx.setFlag('dq-churrasco-estrelas', r.stars);
      if (r.stars === 3) {
        await ctx.say('pai-bella', '...');
        await ctx.say('pai-bella', 'Hm. Até que não queimou. Sorte de principiante.');
        await ctx.say('weng', '(Sorte de principiante. Vou aceitar como elogio.)');
        await ctx.emote('bella', 'heart');
        await ctx.say('bella', 'Ele QUASE sorriu. Eu vi. Isso nunca aconteceu nessa casa.');
      } else if (r.stars === 2) {
        await ctx.say('pai-bella', 'Passou um pouquinho do ponto. Mas pra primeira vez com um mestre do lado, aceitável.');
        await ctx.say('bella', '(baixinho) "Mestre". Ele mesmo se chamou de mestre.');
      } else {
        await ctx.say('pai-bella', 'Tá vendo? Por isso que quem manda aqui sou eu. Me dá esse pegador.');
        await ctx.say('bella', '(baixinho) Ignora. Tava ótimo. Ele queima a linguiça TODO domingo.');
      }
      await ctx.unfocus(300);
      ctx.follow('bella', true);
      ctx.objective(Q, 'churrasco');
      await ctx.say('mae-bella', 'Tá pronto? Então vem todo mundo pra mesa!');
      ctx.toast('Leve a Bella até a mesa');
      return;
    }
    await ctx.say('weng', 'A churrasqueira do Alexandre. Território sagrado. Melhor não encostar.');
  },

  async mesa(ctx) {
    if (objActive('mesa') && objDone('churrasco')) {
      await ctx.fadeOut(250);
      ctx.follow('weng', false);
      // na frente da mesa (abaixo da cadeira da ponta), nunca dentro dela
      ctx.place('bella', 12.4, 16.9, 'up');
      ctx.place('weng', 14.6, 16.9, 'up');
      ctx.place('mae-bella', 10.6, 9.4, 'right');
      ctx.place('pai-bella', 17.6, 9.6, 'left');
      await ctx.frame(14, 13.6, 0);
      const mesaArt = ctx.hasArt('cena-churrasco-mesa');
      if (mesaArt) await ctx.backdrop('cena-churrasco-mesa');
      await ctx.fadeIn(300);
      await ctx.say('mae-bella', 'Então, Weng, me conta: você trabalha com o quê? Estuda o quê? Gosta de quê?');
      await ctx.say('bella', 'Mãe! Uma pergunta de cada vez.');
      const c = await ctx.choose('weng', '(O que responder primeiro?)', ['"Eu estudo e trabalho, mas o que eu gosto mesmo é de estar aqui."', '"Gosto de jogar, de cozinhar e de churrasco. Muito de churrasco."', '"Eu gosto da Bella."']);
      if (c === 0) {
        await ctx.say('mae-bella', 'Ai, que fofo. Bella, segura esse.');
      } else if (c === 1) {
        await ctx.say('pai-bella', 'Todo mundo gosta de churrasco. O difícil é saber FAZER.');
        await ctx.say('bella', 'Ele fez, Alexandre. Você viu.');
      } else {
        await ctx.emote('bella', 'heart');
        await ctx.say('mae-bella', 'AAAH. Alexandre, você ouviu isso?');
        await ctx.say('pai-bella', 'Ouvi. Gostar é fácil. Quero ver aguentar ela de manhã.');
        await ctx.say('bella', 'ALEXANDRE!');
      }
      await ctx.say('pai-bella', 'E a Lala? Já deixou você fazer carinho nela?');
      await ctx.say('weng', 'Ainda não. Ela me ignora.');
      await ctx.say('pai-bella', 'Normal. Gato tem bom gosto. Comigo ela demorou... bom, comigo ela ainda não deixa.');
      await ctx.say('bella', '(Porque nem a Lala aguenta ele.)');
      await ctx.say('mae-bella', 'Agora a sobremesa! A banoffee que o Weng fez!');
      await ctx.say('avo-bella', 'Deixa eu provar essa banoffee... Hm. Doce de leite no ponto. Banana fresquinha.');
      await ctx.say('pai-bella', '...');
      await ctx.say('pai-bella', 'Tá boa. O doce de leite eu compraria de outra marca. Mas tá boa.');
      await ctx.say('bella', '(Pronto. Ele não consegue elogiar sem colocar um defeito.)');
      await ctx.emote('weng', 'heart');
      await ctx.say('bella', '(Mas "tá boa", vindo do Alexandre, é praticamente um abraço.)');
      const c2 = await ctx.choose('weng', '(A mãe da Bella está olhando, esperando...)', ['"Foi a minha avó que me ensinou a receita."', '"Fiz duas. A primeira desmontou."', '"Doce é o caminho pro coração de qualquer família."']);
      if (c2 === 0) await ctx.say('mae-bella', 'Então manda um beijo pra ela! Ela criou você muito bem.');
      else if (c2 === 1) await ctx.say('mae-bella', 'Fez DUAS? Bella, esse é pra casar.');
      else await ctx.say('avo-bella', 'Esse menino é esperto. Gostei.');
      await ctx.say('bella', 'MÃE!');
      ctx.hearts('player', 6);
      if (mesaArt) {
        await ctx.fadeOut(400);
        await ctx.backdrop(null);
      }
      await ctx.unfocus(400);
      // cada um no seu canto, fora da mesa e das cadeiras: o Alexandre volta pra churrasqueira,
      // a mãe fica no caminho de pedra, do outro lado da mesa
      ctx.place('mae-bella', 21.4, 14.4, 'left');
      ctx.place('pai-bella', 7.7, 13.0, 'right');
      ctx.place('bella', 12.4, 16.9, 'up');
      ctx.place('weng', 14.6, 16.9, 'up');
      // a Bella pega na mão dele e volta a puxar o caminho
      ctx.lead('bella');
      ctx.follow('weng', true);
      if (mesaArt) await ctx.fadeIn(400);
      ctx.objective(Q, 'mesa');
      await ctx.say('bella', 'Weng, vem! Vamos entrar antes que o Alexandre invente outra prova. Quero te apresentar a Lala direito. E depois: filme!');
      ctx.toast('Entre pela porta da cozinha');
      return;
    }
    await ctx.say('bella', 'Toalha xadrez, cadeira de plástico e um vasinho de flor. Churrasco de família raiz.');
  },

  async porta(ctx) {
    if (objActive('filme') && objDone('mesa')) {
      await ctx.teleport('piabeta-casa-bella', 'from-quintal');
      return;
    }
    if (objActive('passeio') && objDone('filme') && !ctx.flag('dq-filme-fala')) {
      ctx.setFlag('dq-filme-fala');
    }
    if (objActive('mesa')) {
      await ctx.say('bella', 'Depois a gente entra. Primeiro, comida!');
      return;
    }
    await ctx.say('bella', 'A porta da cozinha. O cheiro de churrasco tá entrando na casa inteira.');
  },

  async portao(ctx) {
    if (objActive('passeio') && objDone('filme')) {
      await ctx.say('mae-bella', 'Juízo, hein! E me manda mensagem!');
      await ctx.teleport('piabeta-rua', 'from-casa');
      return;
    }
    if (QuestSystem.isActive(Q)) {
      await ctx.say('bella', 'Ainda não! A gente nem comeu ainda.');
      return;
    }
    await ctx.teleport('piabeta-rua', 'from-casa');
  },

  async cooler(ctx) {
    await ctx.say('bella', 'Isopor cheio de refrigerante gelado. O Alexandre pensa em tudo.');
  },
  async varal(ctx) {
    await ctx.say('bella', 'O varal da minha mãe. Se encostar na roupa limpa, ela sente de dentro de casa.');
  },
  async arvore(ctx) {
    await ctx.say('bella', 'O pé de abacate. Quando dá, dá pra vizinhança inteira.');
  },
  async avoBella(ctx) {
    if (!ctx.flag('avo-bella-1')) {
      ctx.setFlag('avo-bella-1');
      await ctx.say('avo-bella', 'Então esse é o rapaz! Desci lá de cima só pra te conhecer, viu?');
      await ctx.say('weng', 'Muito prazer, senhora! A Bella fala muito da senhora.');
      await ctx.say('avo-bella', 'Senhora não, meu filho. Pode me chamar de vó. Agora come, que você tá magrinho.');
      await ctx.emote('bella', 'heart');
      return;
    }
    await ctx.say('avo-bella', 'Pega mais farofa, querido. A farofa fui eu que fiz.');
  },

  async mae(ctx) {
    await ctx.say('mae-bella', 'Come mais, Weng! Tá magrinho.');
  },
  async pai(ctx) {
    if (objActive('churrasco')) {
      await ctx.say('pai-bella', 'A churrasqueira tá esperando. A carne não vira sozinha. Quer dizer, vira, mas aí é carvão.');
      return;
    }
    await ctx.say('pai-bella', 'A carne tá boa. Mas foi o tempero, né. O tempero é meu.');
  },
  async weng(ctx) {
    // quando o Weng lidera, o acompanhante (NPC 'weng') é a Bella
    await ctx.say('bella', objActive('churrasco') ? 'Vai lá. Lembra: sorrir e concordar.' : 'Tô morrendo de fome. Bora pra mesa?');
  },
};

/** Capítulo 1 — quintal da casa da Bella (2º encontro: churrasco). */
export const quintalMap: MapDef = {
  id: 'piabeta-quintal',
  region: 'piabeta',
  name: 'Quintal da Bella',
  music: 'casa',
  charScale: 1.3,
  background: '#3a2a1e',
  art: 'native',
  legend: { '.': T.GRASS },
  ground: Array.from({ length: 22 }, () => '.'.repeat(32)),

  // v2: cenário vazio (art-source/maps/piabeta-quintal-base.webp) + objetos da folha (objects/qt-*).
  // Versão anterior em backups/quintal-v1/.
  blocks: [
    R(0, 0, 1536, 372), // muro, casa e telhado
    R(0, 0, 40, 1024),
    R(1500, 0, 1536, 1024),
    R(40, 80, 290, 690), // churrasqueira
    R(290, 300, 560, 585), // bancada com pia
    R(0, 845, 604, 1024), // muro de baixo (portão em x 604–905)
    R(905, 845, 1536, 1024),
    R(604, 885, 905, 1024),
    // objetos: só a base
    R(445, 520, 865, 815), // mesa com as cadeiras
    R(120, 700, 285, 762), // isopor
    R(1160, 445, 1185, 480), // postes do varal
    R(1405, 445, 1430, 480),
    R(1185, 372, 1405, 470), // entre o muro e o varal não se anda
    R(1385, 515, 1475, 565), // tronco do abacateiro
    R(735, 340, 805, 382), // vaso ao lado da porta
    R(1060, 345, 1140, 392), // vaso da direita
    R(1300, 760, 1536, 842), // floreira
    R(0, 590, 110, 642), // moita da esquerda
    R(0, 780, 175, 842), // moita do canto
  ],

  objects: [
    { key: 'qt-mesa', x: 655, y: 815, w: 420, shadow: 0.8 },
    { key: 'qt-isopor', x: 200, y: 762, w: 175, shadow: 0.8 },
    { key: 'qt-varal', x: 1295, y: 482, w: 290, shadow: false },
    { key: 'qt-abacateiro', x: 1425, y: 565, w: 400, fade: true, shadow: 0.5 },
    { key: 'qt-vaso', x: 770, y: 384, w: 80, shadow: 0.7 },
    { key: 'qt-vaso', x: 1100, y: 394, w: 92, shadow: 0.7, flip: true },
    { key: 'qt-floreira', x: 1415, y: 842, w: 220, shadow: false },
    { key: 'qt-moita', x: 52, y: 645, w: 130, shadow: false, fade: true },
    { key: 'qt-moita', x: 85, y: 845, w: 175, shadow: false, fade: true, flip: true },
  ],

  hotspots: [
    { rect: R(150, 330, 335, 600), interact: 'churrasqueira', label: 'Churrasqueira', markerIf: () => objActive('churrasco') },
    { rect: R(440, 365, 870, 800), interact: 'mesa', label: 'Mesa', markerIf: () => objActive('mesa') && objDone('churrasco') },
    { rect: R(870, 100, 1000, 430), interact: 'porta', label: 'Porta', markerIf: () => objDone('mesa') && (objActive('lala') || objActive('filme')) },
    { rect: R(604, 845, 905, 890), interact: 'portao', label: 'Portão', markerIf: () => objActive('passeio') && objDone('filme') },
    { rect: R(110, 560, 292, 742), interact: 'cooler', label: 'Isopor' },
    { rect: R(1190, 230, 1400, 520), interact: 'varal', label: 'Varal' },
    { rect: R(1390, 300, 1536, 600), interact: 'arvore', label: 'Abacateiro' },
  ],

  npcs: [
    { id: 'avo-bella', sprite: 'avo-bella', tx: 24.8, ty: 12.4, facing: 'left', interact: 'avoBella', behavior: 'wander', wanderRadius: 1.2, wanderAxis: 'both' },
    { id: 'pai-bella', sprite: 'pai-bella', tx: 7.7, ty: 13.0, facing: 'up', interact: 'pai' },
    { id: 'mae-bella', sprite: 'mae-bella', tx: 21.4, ty: 14.6, facing: 'left', interact: 'mae', behavior: 'wander', wanderRadius: 1.2, wanderAxis: 'y' },
  ],
  spawns: {
    porta: { tx: 19.6, ty: 9.6, facing: 'down' },
  },
  scripts,
  onEnter: 'chegada',
};
