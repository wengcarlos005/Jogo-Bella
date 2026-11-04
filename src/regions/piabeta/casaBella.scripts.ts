import type { Script } from '@/core/script';
import { PERSONAL } from '@/data/personal';

/**
 * Roteiro da Missão 1 — "O encontro marcado".
 * Textos provisórios: revise à vontade, mantendo a estrutura.
 */
const Q = 'pia-m1';
const W = PERSONAL.weng.name;

export const casaScripts: Record<string, Script> = {
  async entrar(ctx) {
    if (ctx.flag('intro-vista')) return;
    ctx.setFlag('intro-vista');
    ctx.startQuest(Q);
    await ctx.narrate('Piabetá. Uma tarde que parecia comum...');
    await ctx.say('bella', 'Hoje é o dia. Ai, meu Deus, hoje é o dia!');
    await ctx.emote('bella', 'note');
    await ctx.say('bella', 'Acho que meu celular vibrou. Cadê ele? Deixei na cama...');
  },

  async cama(ctx) {
    if (!ctx.objectiveDone(Q, 'celular')) {
      ctx.sfx('pickup');
      ctx.give('celular', 1, true);
      await ctx.say('celular', `${W}: "${PERSONAL.openingText}"`);
      await ctx.emote('bella', 'heart');
      const c = await ctx.choose('bella', 'Ele já tá vindo! E eu ainda de pijama...', ['Responder com um emoji fofo', 'Responder "tô quase pronta!" (mentira)']);
      if (c === 0) await ctx.say('bella', 'Pronto, mandei um coraçãozinho. Discreto. Muito discreto.');
      else await ctx.say('bella', '"Tô quase pronta!" ... Agora eu preciso MESMO ficar pronta.');
      ctx.objective(Q, 'celular');
      ctx.toast('Se arrume: roupa, óculos e colar!');
      return;
    }
    await ctx.say('bella', 'Se eu deitar agora, eu não levanto mais. Foco!');
  },

  async 'guarda-roupa'(ctx) {
    if (!ctx.objectiveDone(Q, 'celular')) {
      await ctx.say('bella', 'Primeiro deixa eu ver o que vibrou no celular...');
      return;
    }
    if (ctx.objectiveDone(Q, 'roupa')) {
      await ctx.say('bella', 'Já escolhi. Se eu abrir de novo vou mudar de ideia pela quinta vez.');
      return;
    }
    await ctx.say('bella', 'O eterno dilema: o que vestir num primeiro encontro?');
    const c = await ctx.choose('bella', 'Hmm...', ['Camiseta preta e calça larga (o clássico)', 'Vestido amarelo florido', 'Moletom gigante (conforto acima de tudo)']);
    await ctx.fadeOut(250);
    ctx.outfit(c === 1 ? 'floral' : 'casual');
    ctx.sfx('pickup');
    await ctx.fadeIn(250);
    const looks = [
      'Camiseta preta, calça larga e tênis. Bonita e confortável. Perfeito.',
      'O vestido amarelo! Florido, alegre... é a cara de um primeiro encontro.',
      'O moletom é tentador, mas não. Camiseta preta e calça larga: confortável E bonita.',
    ];
    await ctx.say('bella', looks[c]);
    ctx.setFlag('look-escolhido', c);
    ctx.objective(Q, 'roupa');
  },

  async oculos(ctx) {
    if (ctx.objectiveDone(Q, 'oculos')) {
      await ctx.say('bella', 'Cadernos, canetas e uma pilha de coisas que eu juro que vou organizar.');
      return;
    }
    if (!ctx.objectiveDone(Q, 'celular')) {
      await ctx.say('bella', 'Tá tudo meio embaçado... ah, é. Os óculos.');
    }
    ctx.give('oculos-rosa');
    await ctx.say('bella', 'Óculos! Agora sim dá pra enxergar o mundo. E o Weng chegando.');
    ctx.objective(Q, 'oculos');
  },

  async colar(ctx) {
    if (ctx.objectiveDone(Q, 'colar')) {
      await ctx.say('bella', 'Perfume, maquiagem... tudo pronto por aqui.');
      return;
    }
    ctx.give('colar-pingente');
    await ctx.say('bella', 'O colar com o pingente. Ele dá sorte. Hoje eu preciso de sorte.');
    ctx.objective(Q, 'colar');
  },

  async espelho(ctx) {
    const ready = ctx.objectiveDone(Q, 'roupa') && ctx.objectiveDone(Q, 'oculos') && ctx.objectiveDone(Q, 'colar');
    if (ctx.objectiveDone(Q, 'espelho')) {
      await ctx.say('bella', 'Tá ótimo. Para de se olhar e desce!');
      return;
    }
    if (!ready) {
      await ctx.say('bella', 'Ainda falta coisa... roupa, óculos e o colar da sorte.');
      return;
    }
    await ctx.say('bella', 'Ok. Respira.');
    const c = await ctx.choose('bella', 'Última olhada no espelho...', ['"Tá perfeita."', '"E se ele achar estranho meu cabelo?"']);
    if (c === 0) await ctx.say('bella', 'Tá perfeita. Os cachos colaboraram hoje. É um sinal.');
    else await ctx.say('bella', 'Não. O cabelo tá lindo. Os cachos colaboraram hoje, e isso é raro.');
    await ctx.emote('bella', 'heart');
    ctx.objective(Q, 'espelho');
    ctx.toast('Desça até a sala');
  },

  async 'sair-quarto-cedo'(ctx) {
    await ctx.say('bella', 'Espera, ainda não tô pronta! Volta, volta.');
    await ctx.move('player', 3.5, 6);
  },

  async 'chegou-sala'(ctx) {
    ctx.objective(Q, 'sala');
    await ctx.wait(300);
    ctx.sfx('doorbell');
    ctx.shake(200);
    await ctx.emote('bella', 'exclaim');
    ctx.face('mae-bella', 'up');
    await ctx.say('mae-bella', 'Bella! Tocaram a campainha! Deve ser o tal do rapaz!');
    await ctx.say('bella', 'Já vou! JÁ VOU!');
    ctx.setFlag('campainha');
  },

  async 'atender-porta'(ctx) {
    await ctx.fadeOut(300);
    ctx.setFlag('weng-entrou');
    ctx.refresh();
    ctx.place('weng', 10.5, 13, 'up');
    ctx.place('player', 10.5, 10, 'down');
    ctx.sfx('door');
    await ctx.fadeIn(400);
    await ctx.move('weng', 10.5, 11.5, 40);
    await ctx.say('weng', 'Oi! Ééé... oi. Boa tarde.');
    await ctx.emote('weng', 'sweat');
    const c = await ctx.choose('bella', '(Ele tá tão nervoso quanto eu...)', ['"Oi! Você chegou rápido!"', '"Achou fácil a casa?"', 'Dar um abraço']);
    if (c === 0) {
      await ctx.say('weng', 'Eu meio que saí antes... pra não atrasar. Fiquei uns minutos rodando o quarteirão.');
      await ctx.say('bella', 'Você ficou rodando o quarteirão?');
      await ctx.say('weng', 'Talvez. Não conta pra ninguém.');
    } else if (c === 1) {
      await ctx.say('weng', 'Achei! Quer dizer, o GPS achou. Eu só obedeci.');
    } else {
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', '...Oi. Agora sim, boa tarde.');
    }
    await ctx.say('weng', 'Você tá... muito bonita.');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'Obrigada. Agora vem. Meus pais querem te conhecer.');
    await ctx.say('weng', 'Ah. Os pais. Claro. Os pais. Tudo bem. Tranquilo. Super tranquilo.');
    ctx.objective(Q, 'porta');
    ctx.follow('weng', true);
    ctx.setFlag('weng-segue');
    ctx.toast(`Apresente o ${W} para seus pais`);
  },

  async weng(ctx) {
    if (ctx.objectiveDone(Q, 'mae') && ctx.objectiveDone(Q, 'pai')) {
      await ctx.say('weng', 'Sobrevivi! Bora? A hamburgueria tá esperando a gente.');
      return;
    }
    const lines = [
      'Sua casa é bem aconchegante. Tô tentando não esbarrar em nada.',
      'Seu pai me olhou de um jeito... sério. Ele é sempre assim?',
      'Respira, Weng. Respira. (Isso era pra eu mesmo, desculpa.)',
    ];
    await ctx.say('weng', lines[Math.floor(Math.random() * lines.length)]);
  },

  async mae(ctx) {
    if (!ctx.flag('weng-entrou')) {
      if (ctx.flag('campainha')) {
        await ctx.say('mae-bella', 'Vai lá abrir, menina! Não deixa o rapaz esperando!');
      } else if (ctx.objectiveDone(Q, 'espelho')) {
        await ctx.say('mae-bella', 'Que linda! Vai sair assim? Tá linda.');
      } else {
        await ctx.say('mae-bella', 'Ainda não se arrumou? O moço vai chegar e você aí!');
      }
      return;
    }
    if (!ctx.objectiveDone(Q, 'mae')) {
      ctx.face('weng', 'up');
      await ctx.say('bella', 'Mãe, esse é o Weng.');
      await ctx.say('mae-bella', 'Ah, então você que é o Weng! Prazer, querido. A Bella fala de você.');
      await ctx.emote('weng', 'exclaim');
      await ctx.say('weng', 'Fala? Quer dizer... o prazer é meu, senhora!');
      const c = await ctx.choose('bella', '(Hora de salvar o Weng)', ['"Mãe, a gente já tá de saída!"', '"Ela fala que você é educado."', 'Deixar a conversa rolar']);
      if (c === 0) {
        await ctx.say('mae-bella', 'Calma, deixa eu ver o rapaz direito! Hmm... aprovado. Por enquanto.');
      } else if (c === 1) {
        await ctx.say('mae-bella', 'E é mesmo! Chamou de "senhora". Já gostei.');
        await ctx.emote('weng', 'heart');
      } else {
        await ctx.say('mae-bella', 'Você come de tudo? Da próxima vez vem almoçar aqui.');
        await ctx.say('weng', 'Como de tudo! Quer dizer, quase tudo. Vou adorar!');
      }
      await ctx.say('mae-bella', 'Juízo, hein, vocês dois. E cuida bem dela.');
      await ctx.say('weng', 'Pode deixar.');
      ctx.objective(Q, 'mae');
      if (ctx.objectiveDone(Q, 'pai')) ctx.toast('Saia pela porta da frente');
      return;
    }
    await ctx.say('mae-bella', 'Vão, vão! Divirtam-se. E me manda mensagem quando chegar!');
  },

  async pai(ctx) {
    if (!ctx.flag('weng-entrou')) {
      await ctx.say('pai-bella', 'Hm. Então hoje é o tal encontro.');
      await ctx.say('pai-bella', '...Que horas você volta?');
      return;
    }
    if (!ctx.objectiveDone(Q, 'pai')) {
      await ctx.say('bella', 'Pai, esse é o Weng.');
      ctx.face('weng', 'up');
      await ctx.say('pai-bella', '...');
      await ctx.say('pai-bella', '......');
      await ctx.emote('weng', 'sweat');
      await ctx.say('weng', 'B-boa tarde! Prazer em conhecer o senhor.');
      await ctx.say('pai-bella', 'Weng. Hm. Torce pra qual time?');
      const c = await ctx.choose('weng', '(O Weng olha pra você pedindo socorro)', ['Responder pelo Weng: "Ele torce pro mesmo que você, pai!"', 'Deixar o Weng responder sozinho']);
      if (c === 0) {
        await ctx.say('pai-bella', 'Hm. Sei. Vou fingir que acredito.');
      } else {
        await ctx.say('weng', 'Eu... gosto de futebol. De todos. Sou muito democrático.');
        await ctx.say('pai-bella', 'Hm. Resposta diplomática.');
      }
      await ctx.say('pai-bella', 'Traz ela de volta no horário.');
      await ctx.say('weng', 'Sim, senhor!');
      await ctx.emote('pai-bella', 'note');
      await ctx.say('pai-bella', '...Bom rapaz.');
      ctx.objective(Q, 'pai');
      if (ctx.objectiveDone(Q, 'mae')) ctx.toast('Saia pela porta da frente');
      return;
    }
    await ctx.say('pai-bella', 'No horário, hein.');
  },

  async geladeira(ctx) {
    await ctx.say('bella', 'Água gelada pra acalmar. Ok, não acalmou.');
  },
  async fogao(ctx) {
    await ctx.say('bella', 'Cheirinho de café da tarde. Não dá tempo, infelizmente.');
  },
  async tv(ctx) {
    await ctx.say('bella', 'Passando novela. Minha mãe vai me contar tudo depois.');
  },
  async estante(ctx) {
    await ctx.say('bella', 'Livros, porta-retratos e um enfeite que ninguém lembra de onde veio.');
  },
};
