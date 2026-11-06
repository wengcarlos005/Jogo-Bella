import type { Script } from '@/core/script';
import { PERSONAL } from '@/data/personal';
import { GameState } from '@/core/GameState';

/**
 * Roteiro da Missão 1 — "O encontro marcado".
 * Textos provisórios: revise à vontade, mantendo a estrutura.
 */
const Q = 'pia-m1';
const W = PERSONAL.weng.name;
/** Como a Bella chama o padrasto (personal.ts). */
const CHAMADO = PERSONAL.bellaStepdad.chamado;

/** 2º encontro: o filme no sofá (quando os dois sentam). */
async function filmeNoSofa(ctx: Parameters<Script>[0]): Promise<void> {
  await ctx.say('bella', 'Senta aqui. Esse sofá é o melhor lugar da casa.');
  await ctx.sit(730, 714, [
    ['narrador', 'Um filme qualquer passando na TV. Ninguém prestou muita atenção.'],
    ['bella', 'Weng... você tá vendo o filme ou olhando pra mim?'],
    ['weng', 'Tem filme passando?'],
    ['mae-bella', '(da cozinha) Querem pipoca?!'],
    ['bella', 'NÃO, MÃE, OBRIGADA!'],
    ['pai-bella', '(da cozinha) Eu quero.'],
    ['weng', 'Bora passear depois? Quero ir na nossa praça.'],
    ['bella', 'A do coreto? São uns 25 minutos a pé, passando por Fragoso.'],
    ['weng', 'Com você, 25 minutos passam em 5.'],
  ]);
  ctx.objective('dq-e2', 'filme');
  // depois do filme a casa fica livre: dá pra conversar com todo mundo antes de sair
  ctx.toast('Quando quiserem passear, saiam pela porta da sala');
}

export const casaScripts: Record<string, Script> = {
  async entrar(ctx) {
    // 2º encontro: depois do churrasco, antes do filme: apresentar a Lala
    if (ctx.questActive('dq-e2') && ctx.objectiveDone('dq-e2', 'mesa') && !ctx.objectiveDone('dq-e2', 'lala')) {
      // na cozinha, cada um num canto (sem cadeira e sem ficar um em cima do outro)
      ctx.place('pai-bella', 19.6, 7.2, 'down');
      ctx.place('mae-bella', 28.0, 9.4, 'left');
      ctx.follow('weng', true);
      ctx.place('weng', 16.2, 15.6, 'up');
      await ctx.wait(300);
      await ctx.say('bella', 'Antes do filme... você PRECISA conhecer a Lala direito. Ela tá dormindo no meu quarto.');
      await ctx.say('weng', 'A que ignorou o Alexandre por dois anos? Tô com medo.');
      ctx.toast('Leve o Weng até a Lala, no quarto');
      return;
    }
    if (ctx.questActive('dq-e2')) return;
    if (ctx.flag('intro-vista')) return casaScripts.voltou(ctx);
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
      await ctx.give('celular', 1, true);
      if (!ctx.objectiveDone(Q, 'oculos')) {
        await ctx.say('bella', 'Tá tudo embaçado... aperta o olho... pronto, deu pra ler:');
      }
      await ctx.say('celular', `${W}: "${PERSONAL.openingText}"`);
      await ctx.emote('bella', 'heart');
      const c = await ctx.choose('bella', 'Ele já tá chegando! Na chuva! E eu ainda de pijama...', ['Responder com um emoji fofo', 'Responder "tô quase pronta!" (mentira)']);
      if (c === 0) await ctx.say('bella', 'Pronto, mandei um coraçãozinho. Discreto. Muito discreto.');
      else await ctx.say('bella', '"Tô quase pronta!" ... Agora eu preciso MESMO ficar pronta.');
      ctx.objective(Q, 'celular');
      ctx.toast('Se arrume: óculos, roupa, presente e colar!');
      return;
    }
    await ctx.say('bella', 'Se eu deitar agora, eu não levanto mais. Foco!');
  },

  async 'guarda-roupa'(ctx) {
    if (!ctx.objectiveDone(Q, 'celular')) {
      await ctx.say('bella', 'Primeiro deixa eu ver o que vibrou no celular...');
      return;
    }
    if (!ctx.objectiveDone(Q, 'oculos')) {
      await ctx.say('bella', 'Sem os óculos eu vou acabar vestindo a camiseta do avesso. Primeiro os óculos!');
      return;
    }
    if (ctx.objectiveDone(Q, 'roupa')) {
      if (!ctx.objectiveDone(Q, 'presente')) return casaScripts.presente(ctx);
      await ctx.say('bella', 'Já escolhi. Se eu abrir de novo vou mudar de ideia pela quinta vez.');
      return;
    }
    await ctx.say('bella', 'O que vestir num primeiro encontro? ...Na verdade eu já sei.');
    const id = await ctx.wardrobe(['casual']);
    ctx.sfx('pickup');
    const looks: Record<string, string> = {
      casual: 'Camiseta preta, calça larga e tênis. Bonita, confortável e a minha cara. Perfeito.',
      floral: 'O vestido amarelo! Florido, alegre... é a cara de um primeiro encontro.',
      linho: 'Linho branco. Elegante sem parecer que eu me esforcei demais. (Eu me esforcei.)',
      festa: 'O vestido laranja! Se for pra ficar nervosa, que seja bem-vestida.',
      inverno: 'Jaqueta preta. Tá chovendo, então é praticamente uma decisão inteligente.',
    };
    await ctx.say('bella', looks[id] ?? 'Pronto. Vestida e decidida. Quase decidida.');
    ctx.setFlag('look-escolhido', id);
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
    await ctx.give('oculos-rosa');
    if (!ctx.objectiveDone(Q, 'roupa')) ctx.outfit('pijama-oculos');
    await ctx.say('bella', 'Óculos! Agora sim dá pra enxergar o mundo. E o Weng chegando.');
    ctx.objective(Q, 'oculos');
  },

  async colar(ctx) {
    if (ctx.objectiveDone(Q, 'colar')) {
      await ctx.say('bella', 'Perfume, maquiagem... tudo pronto por aqui.');
      return;
    }
    await ctx.give('colar-pingente');
    await ctx.say('bella', 'O colar com o pingente. Ele dá sorte. Hoje eu preciso de sorte.');
    ctx.objective(Q, 'colar');
  },

  async presente(ctx) {
    await ctx.say('bella', 'E agora... o presente. Escondido atrás das roupas, pra ninguém ver.');
    await ctx.give('vale-beijo');
    await ctx.give('chocolates');
    await ctx.say('bella', 'Um Vale Beijo, um Vale Abraço e um montão de chocolate. Será que é demais pra um primeiro encontro?');
    const c = await ctx.choose('bella', '(...)', ['"Não. É perfeito."', '"Talvez seja. Vou levar mesmo assim."']);
    await ctx.say('bella', c === 0 ? 'É perfeito. E se ele não gostar, os chocolates ficam comigo.' : 'Se for demais, a culpa é do coração. Vai na bolsa!');
    ctx.objective(Q, 'presente');
  },

  async espelho(ctx) {
    const ready =
      ctx.objectiveDone(Q, 'roupa') && ctx.objectiveDone(Q, 'oculos') && ctx.objectiveDone(Q, 'colar') && ctx.objectiveDone(Q, 'presente');
    if (ctx.objectiveDone(Q, 'espelho')) {
      await ctx.say('bella', 'Tá ótimo. Para de se olhar e desce!');
      return;
    }
    if (!ready) {
      await ctx.say('bella', 'Ainda falta coisa... roupa, óculos, o colar da sorte e o presente dele!');
      return;
    }
    await ctx.say('bella', 'Ok. Respira.');
    const c = await ctx.choose('bella', 'Última olhada no espelho...', ['"Tá perfeita."', '"E se ele achar estranho meu cabelo?"']);
    if (c === 0) await ctx.say('bella', 'Tá perfeita. Os cachos colaboraram hoje. É um sinal.');
    else await ctx.say('bella', 'Não. O cabelo tá lindo. Os cachos colaboraram hoje, e isso é raro.');
    await ctx.emote('bella', 'heart');
    ctx.objective(Q, 'espelho');
    ctx.toast('Desça até a sala e pegue o guarda-chuva');
  },

  async 'sair-quarto-cedo'(ctx) {
    await ctx.say('bella', 'Espera, ainda não tô pronta! Volta, volta.');
    await ctx.move('player', 4, 8.4);
  },

  async 'chegou-sala'(ctx) {
    await ctx.wait(200);
    ctx.face('mae-bella', 'up');
    await ctx.say('mae-bella', 'Que linda! Vai sair assim? Tá caindo um pé d\'água lá fora, hein!');
    await ctx.say('bella', 'Ele tá me esperando na esquina, mãe!');
    await ctx.say('mae-bella', 'Então leva o guarda-chuva! Tá ali no canto da sala, do lado da estante.');
  },

  async 'guarda-chuva'(ctx) {
    if (!ctx.objectiveDone(Q, 'espelho')) {
      await ctx.say('bella', 'O guarda-chuva. Primeiro deixa eu terminar de me arrumar.');
      return;
    }
    if (ctx.objectiveDone(Q, 'guarda-chuva')) {
      await ctx.say('bella', 'Só tem o guarda-chuva da minha mãe aqui. O meu já tá comigo.');
      return;
    }
    ctx.sfx('pickup');
    await ctx.say('bella', 'Guarda-chuva na mão. Coração na boca. Vamos.');
    ctx.objective(Q, 'guarda-chuva');
    ctx.toast('Busque o Weng na esquina (siga a calçada para a direita)');
  },

  async voltou(ctx) {
    if (!ctx.flag('weng-entrou') || ctx.objectiveDone(Q, 'mae') || ctx.flag('voltou-visto')) return;
    ctx.setFlag('voltou-visto');
    await ctx.wait(200);
    await ctx.say('bella', `Mãe! ${PERSONAL.bellaStepdad.chamado || ''}${PERSONAL.bellaStepdad.chamado ? '! ' : ''}Ele chegou!`);
    await ctx.say('weng', '(sussurrando) Tô com cara de nervoso? Fala a verdade.');
    await ctx.say('bella', '(sussurrando) Um pouquinho. Eu também.');
  },

  async weng(ctx) {
    if (ctx.objectiveDone(Q, 'mae') && ctx.objectiveDone(Q, 'pai')) {
      await ctx.say('weng', 'Sobrevivi! Bora? A hamburgueria tá esperando a gente.');
      return;
    }
    const lines = [
      'Sua casa é bem aconchegante. Tô tentando não esbarrar em nada.',
      `O ${PERSONAL.bellaStepdad.name} me olhou de um jeito... sério. Ele é sempre assim?`,
      'Respira, Weng. Respira. (Isso era pra eu mesmo, desculpa.)',
    ];
    await ctx.say('weng', lines[Math.floor(Math.random() * lines.length)]);
  },

  async pombo(ctx) {
    ctx.pose('pombo', 'pombo-poses', 0);
    await ctx.emote('pombo', 'question');
    await ctx.say('pombo', 'Mrrr.');
    await ctx.say('bella', ctx.flag('weng-entrou') ? 'Esse é o Pombo. Ele julga todo mundo. Não leva pro pessoal.' : 'Pombo, para de me olhar com essa cara de julgamento.');
    if (ctx.flag('weng-entrou') && !ctx.flag('pombo-weng')) {
      ctx.setFlag('pombo-weng');
      await ctx.say('weng', 'Ele tá me encarando. Ele tá me encarando muito.');
      await ctx.say('bella', 'Ele tá decidindo se gosta de você.');
    }
    // carinho: ele finge que não gosta, mas ronrona
    ctx.pose('pombo', 'pombo-poses', 3);
    ctx.hearts('pombo', 4);
    await ctx.say('pombo', 'Prrr... (só um pouquinho)');
    ctx.pose('pombo', 'pombo-poses', 2);
    await ctx.wait(700);
    ctx.pose('pombo', null);
  },

  async lala(ctx) {
    if (ctx.questActive('dq-e2') && ctx.objectiveDone('dq-e2', 'mesa') && !ctx.objectiveDone('dq-e2', 'lala')) {
      ctx.follow('weng', false);
      ctx.face('player', 'lala');
      ctx.face('weng', 'lala');
      await ctx.say('bella', 'Lala... acorda, princesa. Olha quem veio te ver de novo.');
      ctx.pose('lala', 'lala-poses', 2);
      await ctx.emote('lala', 'question');
      ctx.pose('lala', 'lala-poses', 0);
      await ctx.say('weng', 'Oi, Lala. Sou eu. O do churrasco. O que virou a picanha.');
      ctx.face('lala', 'left');
      await ctx.say('lala', '...');
      await ctx.say('weng', 'Ela virou a cara. Ela literalmente virou a cara pra mim.');
      const c = await ctx.choose('bella', '(Como conquistar a Lala?)', ['"Abaixa devagar e estende a mão. Deixa ela cheirar."', '"Fala fininho. Ela ama voz fininha."', '"Finge que não liga. Gato ama quem não liga."']);
      if (c === 0) await ctx.say('weng', '(abaixando bem devagar) Pode cheirar... sem pressa...');
      else if (c === 1) await ctx.say('weng', '(voz fininha) Quem é a gatinha mais linda dessa casa? Quem é?');
      else {
        await ctx.say('weng', '(assobiando, olhando pro teto) Nossa, que teto bonito esse...');
        await ctx.wait(500);
      }
      ctx.face('lala', 'weng');
      await ctx.emote('lala', 'exclaim');
      ctx.pose('lala', 'lala-poses', 3);
      ctx.hearts('lala', 10);
      await ctx.say('lala', 'Prrrrr... prrrrrr...');
      await ctx.emote('weng', 'heart');
      await ctx.say('weng', 'ELA DEIXOU! Bella, ela tá ronronando pra mim!');
      await ctx.say('bella', 'O Alexandre levou dois anos. Você levou dois minutos.');
      await ctx.say('weng', 'Não conta pra ele. Ele já me deu o pegador hoje, não quero perder o cargo.');
      ctx.pose('lala', 'lala-poses', 1);
      ctx.follow('weng', true);
      ctx.objective('dq-e2', 'lala');
      ctx.toast('Agora sim: sentem no sofá da sala pro filme');
      return;
    }
    const n = Number(GameState.getFlag<number>('lala-carinhos') ?? 0);
    ctx.pose('lala', 'lala-poses', 3);
    ctx.hearts('lala', 6);
    await ctx.say('lala', 'Prrrr...');
    const falas = [
      'Bom dia, Lala. Dormiu bem? Claro que dormiu, você só dorme.',
      'Lala, deseja sorte pra mim hoje. Muita sorte.',
      'Depois eu te conto tudo, tá? Tudinho.',
    ];
    await ctx.say('bella', ctx.flag('weng-entrou') ? 'Weng, essa é a Lala. A princesa da casa.' : falas[n % falas.length]);
    if (ctx.flag('weng-entrou') && !ctx.flag('lala-weng')) {
      ctx.setFlag('lala-weng');
      await ctx.say('weng', 'Oi, Lala! ...Ela me ignorou completamente.');
      await ctx.say('bella', 'Ela é assim. Você tem que merecer.');
    }
    GameState.setFlag('lala-carinhos', n + 1);
    ctx.pose('lala', 'lala-poses', 1);
  },

  async mae(ctx) {
    if (ctx.questActive('dq-e2')) {
      const f = ['Vão passear? Leva um casaquinho, que de noite esfria!', 'O Weng comeu bem? Embrulhei um pedaço de pudim pra ele levar.', 'Gostei dele, viu. Educado, ajudou a tirar a mesa...'];
      const n = (Number(ctx.flag('mae-dom-n') || 0) + 1) % f.length;
      ctx.setFlag('mae-dom-n', n);
      await ctx.say('mae-bella', f[n]);
      return;
    }
    if (!ctx.flag('weng-entrou')) {
      if (ctx.objectiveDone(Q, 'guarda-chuva')) {
        await ctx.say('mae-bella', 'Vai logo, menina! Não deixa o rapaz esperando na chuva!');
      } else if (ctx.objectiveDone(Q, 'espelho')) {
        await ctx.say('mae-bella', 'Leva o guarda-chuva! Tá ali no canto da sala, do lado da estante.');
      } else {
        await ctx.say('mae-bella', 'Ainda não se arrumou? O moço vai chegar e você aí!');
      }
      return;
    }
    if (!ctx.objectiveDone(Q, 'mae')) {
      // os três em triângulo (mesma distância entre eles), longe do porta-guarda-chuvas;
      // o Weng para de seguir durante a conversa para não andar por cima da mãe
      await ctx.fadeOut(200);
      ctx.follow('weng', false);
      // a Bella ao lado da mãe, apresentando o Weng (virada pra ele); o Weng de frente pras duas
      ctx.place('mae-bella', 10.0, 15.6, 'down');
      ctx.place('player', 8.5, 16.2, 'right');
      ctx.place('weng', 10.9, 17.8, 'up');
      ctx.face('player', 'weng');
      await ctx.frame(9.7, 16.0, 0);
      await ctx.fadeIn(250);
      await ctx.say('bella', 'Mãe, esse é o Weng.');
      await ctx.say('mae-bella', 'Ah, então você que é o Weng! Prazer, querido. A Bella fala de você.');
      await ctx.emote('weng', 'exclaim');
      await ctx.say('weng', 'Fala? Quer dizer... o prazer é meu! Ah, e eu trouxe uma coisinha pra senhora.');
      await ctx.showItem('chocolates', 'O Weng deu para a sua mãe', 'Uma caixa de chocolates', 'Comprada especialmente pra ela. Primeira impressão: excelente.');
      await ctx.emote('mae-bella', 'heart');
      await ctx.say('mae-bella', 'Chocolate?! Ah, que rapaz educado! Bella, esse aí pode voltar sempre.');
      await ctx.emote('bella', 'heart');
      const c = await ctx.choose('bella', '(Hora de salvar o Weng)', ['"Mãe, a gente já tá de saída!"', '"Ela fala que você é educado."', 'Deixar a conversa rolar']);
      if (c === 0) {
        await ctx.say('mae-bella', 'Calma, deixa eu ver o rapaz direito! Hmm... aprovado. Por enquanto.');
      } else if (c === 1) {
        await ctx.say('mae-bella', 'E é mesmo! Chamou de "senhora" e ainda trouxe chocolate. Já gostei.');
        await ctx.emote('weng', 'heart');
      } else {
        await ctx.say('mae-bella', 'Você come de tudo? Da próxima vez vem almoçar aqui.');
        await ctx.say('weng', 'Como de tudo! Quer dizer, quase tudo. Vou adorar!');
      }
      await ctx.say('mae-bella', 'Juízo, hein, vocês dois. E cuida bem dela.');
      await ctx.say('weng', 'Pode deixar.');
      await ctx.unfocus(500);
      ctx.follow('weng', true);
      ctx.objective(Q, 'mae');
      if (ctx.objectiveDone(Q, 'pai')) ctx.toast('Saia pela porta da frente');
      return;
    }
    await ctx.say('mae-bella', 'Vão, vão! Divirtam-se. E me manda mensagem quando chegar!');
  },

  async pai(ctx) {
    if (ctx.questActive('dq-e2')) {
      const f = ['...A picanha tava boa. Ele que virou.', 'Juízo na rua, hein. E traz ela cedo.', 'Hm. Pode voltar domingo que vem. Se quiser.'];
      const n = (Number(ctx.flag('pai-dom-n') || 0) + 1) % f.length;
      ctx.setFlag('pai-dom-n', n);
      await ctx.say('pai-bella', f[n]);
      return;
    }
    if (!ctx.flag('weng-entrou')) {
      await ctx.say('pai-bella', 'Hm. Então hoje é o tal encontro.');
      await ctx.say('pai-bella', '...Que horas você volta?');
      return;
    }
    if (!ctx.objectiveDone(Q, 'pai')) {
      await ctx.fadeOut(200);
      ctx.follow('weng', false);
      // triângulo ao lado da mesa (ninguém em cima de cadeira): o Alexandre na quina da mesa,
      // a Bella e o Weng na frente dele, à mesma distância
      ctx.place('pai-bella', 19.9, 7.0, 'down');
      ctx.place('player', 18.8, 8.7, 'up');
      ctx.place('weng', 21.0, 8.7, 'up');
      ctx.face('player', 'pai-bella');
      ctx.face('weng', 'pai-bella');
      await ctx.fadeIn(250);
      await ctx.say('bella', `${CHAMADO ? `${CHAMADO}, esse` : 'Esse'} é o Weng.`);
      ctx.face('weng', 'up');
      await ctx.say('pai-bella', '...');
      await ctx.say('pai-bella', '......');
      await ctx.emote('weng', 'sweat');
      await ctx.say('weng', 'B-boa tarde! Prazer em conhecer o senhor.');
      await ctx.say('pai-bella', 'Weng. Hm. Torce pra qual time?');
      const c = await ctx.choose('weng', '(O Weng olha pra você pedindo socorro)', ['Responder pelo Weng: "Ele torce pro mesmo time que você!"', 'Deixar o Weng responder sozinho']);
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
      ctx.follow('weng', true);
      ctx.objective(Q, 'pai');
      if (ctx.objectiveDone(Q, 'mae')) ctx.toast('Saia pela porta da frente');
      return;
    }
    await ctx.say('pai-bella', 'No horário, hein.');
  },

  async pia(ctx) {
    await ctx.say('bella', 'Uma louça pra lavar. Ela pode esperar até amanhã. Hoje não.');
  },
  async sofa(ctx) {
    if (ctx.questActive('dq-e2') && ctx.objectiveDone('dq-e2', 'mesa')) {
      if (!ctx.objectiveDone('dq-e2', 'lala')) {
        await ctx.say('bella', 'Calma! Primeiro a Lala. Ela tá no meu quarto.');
        return;
      }
      if (!ctx.objectiveDone('dq-e2', 'filme')) return filmeNoSofa(ctx);
    }
    if (ctx.flag('weng-segue') && !ctx.objectiveDone(Q, 'pai')) {
      await ctx.say('bella', 'Ainda não dá pra sentar. Falta apresentar o Weng pro Alexandre!');
      return;
    }
    await ctx.sit(730, 714, ctx.flag('weng-segue') ? [['weng', 'Esse sofá é confortável demais. Perigoso.'], ['bella', 'É o sofá do cochilo de domingo.']] : [['bella', 'O sofá do cochilo de domingo. Hoje não tem cochilo, tem encontro!']]);
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
