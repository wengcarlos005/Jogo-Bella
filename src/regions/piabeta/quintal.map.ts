import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script } from '@/core/script';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL } from '@/data/personal';

const Q = 'dq-e2';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
const ALE = PERSONAL.bellaStepdad.name;

/** Retângulo no cenário ORIGINAL (art-source/maps/piabeta-quintal.webp, 1536x1024). 48 px = 1 tile. */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (objDone('filme') && objActive('passeio')) ctx.toast('Saia pelo portão para passear');
    if (ctx.flag('dq-e2-intro')) return;
    ctx.setFlag('dq-e2-intro');
    ctx.setFlag('weng-segue');
    if (!ctx.questActive(Q) && !QuestSystem.isDone(Q)) ctx.startQuest(Q);
    ctx.refresh();
    await ctx.narrate('Algumas semanas depois do primeiro beijo.');
    await ctx.narrate('Segundo encontro: churrasco no quintal da Bella.');
    await ctx.say('mae-bella', 'Chegou o Weng! Entra, querido, fica à vontade. O Alexandre já acendeu a churrasqueira.');
    await ctx.say('pai-bella', '...Sabe virar carne?');
    await ctx.emote('weng', 'sweat');
    await ctx.say('weng', 'Sei! Quer dizer... sei aprender rápido.');
    await ctx.say('bella', '(Isso é um teste. O Alexandre tá testando ele.)');
    ctx.toast(`Leve o Weng até a churrasqueira do ${ALE}`);
  },

  async churrasqueira(ctx) {
    if (objActive('churrasco')) {
      await ctx.say('pai-bella', 'Weng. Vem cá. Toma o pegador.');
      await ctx.emote('weng', 'exclaim');
      await ctx.say('weng', 'Eu? Agora? Tá. Tá bom. Eu consigo.');
      // o Weng vai pra churrasqueira; a Bella fica olhando, torcendo
      ctx.follow('weng', false);
      await ctx.move('pai-bella', 9.3, 11.6, 45);
      await ctx.move('weng', 7.2, 11.5, 50);
      ctx.face('weng', 'left');
      ctx.face('pai-bella', 'left');
      ctx.face('player', 'weng');
      await ctx.say('bella', '(Vai, Weng! Você consegue! ...Eu acho.)');
      const r = await ctx.grill({ title: 'O Weng na churrasqueira', helper: 'Alexandre' });
      ctx.setFlag('dq-churrasco-estrelas', r.stars);
      if (r.stars === 3) {
        await ctx.emote('pai-bella', 'heart');
        await ctx.say('pai-bella', '...Bom rapaz.');
        await ctx.say('bella', 'Ele disse "bom rapaz" DE NOVO. Weng, você tá muito bem.');
      } else {
        await ctx.say('pai-bella', 'Hm. Com treino melhora.');
        await ctx.say('weng', '(Pelo menos ele não me expulsou.)');
      }
      ctx.follow('weng', true);
      ctx.objective(Q, 'churrasco');
      await ctx.say('mae-bella', 'Tá pronto? Então vem todo mundo pra mesa!');
      ctx.toast('Sente-se à mesa com a família');
      return;
    }
    await ctx.say('bella', 'A churrasqueira de tijolinho do Alexandre. Ninguém mexe nela sem autorização.');
  },

  async mesa(ctx) {
    if (objActive('mesa') && objDone('churrasco')) {
      await ctx.fadeOut(250);
      ctx.follow('weng', false);
      ctx.place('player', 12.6, 16.0, 'up');
      ctx.place('weng', 15.0, 16.0, 'up');
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
        await ctx.say('pai-bella', '...Gosta de churrasco. Hm. Ponto pra ele.');
      } else {
        await ctx.emote('bella', 'heart');
        await ctx.say('mae-bella', 'AAAH. Alexandre, você ouviu isso?');
        await ctx.say('pai-bella', 'Ouvi. Passa a farofa.');
      }
      await ctx.say('pai-bella', 'E a Lala? Já deixou você fazer carinho nela?');
      await ctx.say('weng', 'Ainda não. Ela me ignora.');
      await ctx.say('pai-bella', 'Comigo ela fez isso por dois anos. Boa sorte.');
      ctx.hearts('player', 6);
      if (mesaArt) {
        await ctx.fadeOut(400);
        await ctx.backdrop(null);
      }
      await ctx.unfocus(400);
      ctx.place('mae-bella', 9.8, 12.6, 'right');
      ctx.place('pai-bella', 7.4, 12.6, 'right');
      ctx.follow('weng', true);
      if (mesaArt) await ctx.fadeIn(400);
      ctx.objective(Q, 'mesa');
      await ctx.say('bella', 'Weng, vem! Vamos ver um filme lá dentro.');
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
      await ctx.fadeOut(500);
      await ctx.narrate('Vinte e cinco minutos de caminhada. Passando por Fragoso, de mãos dadas.');
      await ctx.teleport('piabeta-fragoso', 'from-rota66');
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
  async mae(ctx) {
    await ctx.say('mae-bella', 'Come mais, Weng! Tá magrinho.');
  },
  async pai(ctx) {
    if (objActive('churrasco')) {
      await ctx.say('pai-bella', 'A churrasqueira tá esperando.');
      return;
    }
    await ctx.say('pai-bella', '...Hm. A carne tá boa.');
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

  blocks: [
    R(0, 0, 1536, 425), // muro, casa e telhado
    R(0, 0, 40, 1024),
    R(1500, 0, 1536, 1024),
    R(40, 80, 335, 600), // churrasqueira
    R(330, 300, 562, 575), // bancada com pia
    R(562, 300, 672, 500),
    R(110, 600, 292, 742), // isopor
    R(0, 470, 105, 845), // arbusto da esquerda
    R(0, 700, 185, 845),
    R(440, 365, 870, 800), // mesa com cadeiras
    R(1150, 425, 1400, 592), // varal: entre o muro e o varal não se anda (as roupas ficam sempre atrás de quem passa na frente)
    R(1390, 0, 1536, 565), // tronco da árvore
    R(1290, 590, 1536, 830), // floreira
    R(0, 845, 604, 1024), // muro de baixo (portão em x 604–905)
    R(905, 845, 1536, 1024),
    R(604, 885, 905, 1024),
  ],

  overlays: [{ x0: 1390, y0: 0, x1: 1536, y1: 340, base: 565, cut: 'foliage', fade: true }],

  hotspots: [
    { rect: R(150, 330, 335, 600), interact: 'churrasqueira', label: 'Churrasqueira', markerIf: () => objActive('churrasco') },
    { rect: R(440, 365, 870, 800), interact: 'mesa', label: 'Mesa', markerIf: () => objActive('mesa') && objDone('churrasco') },
    { rect: R(870, 100, 1000, 430), interact: 'porta', label: 'Porta', markerIf: () => objActive('filme') && objDone('mesa') },
    { rect: R(604, 845, 905, 890), interact: 'portao', label: 'Portão', markerIf: () => objActive('passeio') && objDone('filme') },
    { rect: R(110, 560, 292, 742), interact: 'cooler', label: 'Isopor' },
    { rect: R(1190, 230, 1400, 520), interact: 'varal', label: 'Varal' },
    { rect: R(1390, 300, 1536, 600), interact: 'arvore', label: 'Abacateiro' },
  ],

  npcs: [
    { id: 'pai-bella', sprite: 'pai-bella', tx: 7.4, ty: 11.6, facing: 'up', interact: 'pai' },
    { id: 'mae-bella', sprite: 'mae-bella', tx: 18.7, ty: 11.6, facing: 'left', interact: 'mae' },
  ],
  spawns: {
    porta: { tx: 19.6, ty: 9.6, facing: 'down' },
  },
  scripts,
  onEnter: 'chegada',
};
