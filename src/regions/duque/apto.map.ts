import { T } from '@/world/tiles';
import type { MapDef, TileRect } from '@/world/MapTypes';
import type { Script, ScriptContext } from '@/core/script';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';
import { PERSONAL } from '@/data/personal';

const Q = 'dq-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);
const questDone = () => QuestSystem.isDone(Q);

const VO = PERSONAL.wengGrandparents.avoh;
const VOH = PERSONAL.wengGrandparents.avo;

/**
 * Retângulo medido no cenário ORIGINAL (art-source/maps/duque-apto.png, 1536x1024).
 * 48 px da imagem = 1 tile (16 px lógicos).
 */
const R = (x0: number, y0: number, x1: number, y1: number): TileRect => ({ x: x0 / 48, y: y0 / 48, w: (x1 - x0) / 48, h: (y1 - y0) / 48 });

const ROW = '.'.repeat(32);

/** Posições (tiles) usadas nas cenas. */
const P = {
  porta: { x: 15.5, y: 17.4 },
  torre: { x: 17.2, y: 6.2 }, // Meli saindo da casinha do arranhador
  potinho: { x: 2.3, y: 17.3 }, // Meli comendo nos potinhos da cozinha
  brinca: { x: 5.3, y: 17.0 }, // onde ela fica depois de brincar com o novelo (chão da cozinha)
  caminha: { x: 6.44, y: 7.55 }, // caminha no quarto do Weng (dormindo dentro dela)
};

/** Recoloca a Meli conforme o andamento (ao carregar o jogo). */
function restoreMeli(ctx: ScriptContext): void {
  if (questDone() || objDone('carinho')) {
    ctx.place('meli', P.caminha.x, P.caminha.y, 'down');
    ctx.pose('meli', 'meli-poses', 1);
  } else if (objDone('brincar')) {
    ctx.place('meli', P.brinca.x, P.brinca.y, 'down');
    ctx.pose('meli', 'meli-poses', 0);
  } else if (objDone('potinho')) {
    ctx.place('meli', P.potinho.x, P.potinho.y, 'down');
    ctx.pose('meli', 'meli-poses', 0);
  }
}

const scripts: Record<string, Script> = {
  async chegada(ctx) {
    ctx.follow('weng', true);
    if (ctx.flag('dq-chegou')) {
      restoreMeli(ctx);
      return;
    }
    ctx.setFlag('dq-chegou');
    ctx.place('player', P.porta.x, P.porta.y, 'up');
    ctx.place('weng', P.porta.x + 1.6, P.porta.y, 'up');
    await ctx.narrate('Duque de Caxias. Já namorando.');
    await ctx.narrate('Pela primeira vez, a Bella vem conhecer o apê do Weng.');
    ctx.face('weng', 'left');
    await ctx.say('weng', 'Pronto, chegamos! Bem-vinda ao meu apê.');
    await ctx.say('weng', `O ${VO} e a ${VOH} ainda tão na China, então hoje somos só nós dois... e a Meli.`);
    ctx.face('player', 'right');
    await ctx.emote('bella', 'heart');
    await ctx.say('bella', 'Finalmente vou conhecer a famosa Meli! Cadê ela?');
    await ctx.say('weng', 'Ih... ela é desconfiada com visita. Já deve ter se escondido em algum cantinho dela.');
    ctx.startQuest(Q);
    ctx.toast('Procure a Meli pelo apartamento');
  },

  // ---------------------------------------------------------------- Meli
  async meli(ctx) {
    if (!objDone('potinho')) {
      await ctx.emote('meli', 'exclaim');
      await ctx.say('meli', 'Mrrr...?');
      await ctx.say('bella', 'Ela me olhou de cima a baixo e deu dois passos pra trás.');
      await ctx.say('weng', 'Ela é interesseira. Tenta conquistar pelo estômago: tem sachê no armário da cozinha.');
      return;
    }
    if (objActive('brincar')) {
      if (!ctx.has('novelo')) {
        await ctx.say('meli', 'Miau.');
        await ctx.say('weng', 'Agora ela quer brincar. Pega um novelo no cesto da sala!');
        return;
      }
      // tudo acontece ali mesmo, no chão da cozinha: a Bella joga o novelo e a Meli corre atrás
      ctx.follow('weng', false);
      await ctx.move('player', 4.6, 15.4, 60);
      void ctx.move('weng', 6.7, 15.3, 60);
      ctx.face('player', 'meli');
      await ctx.frame(4.8, 16.3, 500);
      await ctx.say('bella', 'Olha o que eu tenho aqui, Meli...');
      ctx.pose('meli', 'meli-poses', 2);
      await ctx.emote('meli', 'exclaim');
      ctx.take('novelo');
      ctx.prop('novelo', 'fx-novelo', 4.6, 15.2, 0, 1);
      ctx.sfx('blip');
      await ctx.moveProp('novelo', 6.8, 16.7, 650);
      ctx.pose('meli', null);
      await ctx.move('meli', 6.4, 16.7, 120);
      ctx.hearts('meli', 3);
      ctx.sfx('blip');
      void ctx.moveProp('novelo', 2.9, 16.5, 700);
      await ctx.wait(250);
      await ctx.move('meli', 3.3, 16.5, 120);
      ctx.sfx('blip');
      void ctx.moveProp('novelo', 5.8, 17.2, 600);
      await ctx.wait(200);
      await ctx.move('meli', 5.3, 17.0, 120);
      ctx.face('meli', 'right');
      ctx.hearts('meli', 6);
      await ctx.say('meli', 'Mrrrau!');
      ctx.face('player', 'meli');
      await ctx.say('weng', 'Ela NUNCA brinca assim com visita. Tô passado.');
      await ctx.say('bella', 'É porque eu não sou visita. Né, Meli?');
      ctx.pose('meli', 'meli-poses', 0);
      await ctx.unfocus(500);
      ctx.follow('weng', true);
      ctx.objective(Q, 'brincar');
      ctx.toast('Faça carinho na Meli');
      return;
    }
    if (objActive('carinho')) {
      ctx.follow('weng', false);
      await ctx.move('player', P.brinca.x + 1.3, P.brinca.y - 0.1, 50);
      ctx.face('player', 'left');
      await ctx.frame(5.8, 16.6, 500);
      await ctx.say('bella', 'Posso? Bem devagarinho...');
      ctx.pose('meli', 'meli-poses', 3);
      ctx.hearts('meli', 10);
      await ctx.say('meli', 'Prrrrrr... prrrrrr...');
      await ctx.say('weng', 'Ela tá ronronando! Pronto. Foi aprovada oficialmente.');
      await ctx.emote('bella', 'heart');
      await ctx.say('bella', 'Eu sabia que a gente ia se dar bem!');
      ctx.removeProp('novelo');
      // cansou de tanto brincar: vai sozinha pra caminha, no quarto do Weng
      ctx.pose('meli', null);
      void (async () => {
        await ctx.move('meli', 8.9, P.brinca.y, 70);
        await ctx.move('meli', 8.9, 8.3, 70);
        await ctx.move('meli', P.caminha.x, P.caminha.y, 60);
        ctx.face('meli', 'down');
        ctx.pose('meli', 'meli-poses', 1);
      })();
      await ctx.say('weng', 'Olha ela indo pra caminha. Cansou de ser feliz.');
      await ctx.unfocus(500);
      ctx.follow('weng', true);
      ctx.objective(Q, 'carinho');
      await ctx.say('weng', 'Agora vem cá, quero te mostrar a vista do meu quarto.');
      ctx.toast('Vá até a janela do quarto do Weng');
      return;
    }
    if (questDone() || objDone('carinho')) {
      await ctx.say('meli', 'Zzz... prrr...');
      await ctx.say('bella', 'Dormindo na caminha dela. Que coisinha.');
      return;
    }
    await ctx.say('meli', 'Miau!');
  },

  // Esconderijos
  async arranhador(ctx) {
    if (objActive('achar-meli')) {
      await ctx.say('bella', 'Tem um par de olhos verdes brilhando aqui dentro da casinha...');
      ctx.setFlag('dq-meli-vista');
      ctx.refresh();
      ctx.place('meli', P.torre.x, P.torre.y, 'down');
      await ctx.emote('meli', 'exclaim');
      await ctx.say('meli', 'Miau?!');
      await ctx.emote('bella', 'heart');
      await ctx.say('bella', 'Achei! Ai, que coisa mais linda, laranjinha e gordinha!');
      await ctx.say('weng', 'Essa é a Meli. Dona do apê. Eu só pago as contas.');
      await ctx.say('bella', 'Oi, Meli... vem cá, vem?');
      await ctx.emote('meli', 'sweat');
      await ctx.say('weng', 'Ela é desconfiada, mas é interesseira. Tenta com sachê, fica no armário da cozinha.');
      ctx.objective(Q, 'achar-meli');
      ctx.toast('Pegue um sachê no armário da cozinha');
      return;
    }
    await ctx.say('bella', 'O arranhador da Meli, com casinha e bolinha pendurada. Ela tem mais coisa que eu.');
  },
  async caminha(ctx) {
    if (objActive('achar-meli')) {
      await ctx.say('bella', 'A caminha dela tá vazia... e quentinha. Ela tava aqui agorinha!');
      return;
    }
    if (questDone() || objDone('carinho')) {
      await ctx.say('bella', 'Shhh. A Meli tá dormindo.');
      return;
    }
    await ctx.say('bella', 'A caminha da Meli. Tem até patinha desenhada.');
  },
  async camaWeng(ctx) {
    if (QuestSystem.isActive('dq-m3') && QuestSystem.isObjectiveDone('dq-m3', 'filme') && !QuestSystem.isObjectiveDone('dq-m3', 'dormir')) {
      await ctx.say('bella', 'A cama de esteira de bambu... geladinha.');
      await ctx.say('weng', 'Eu disse que era a melhor invenção da China.');
      await ctx.fadeOut(700);
      await ctx.illustration('cena-primeira-noite', ['A primeira noite.', 'A TV ainda ligada, a Meli nos pés da cama, e a gente conversando baixinho até pegar no sono.']);
      ctx.objective('dq-m3', 'dormir');
      await ctx.memory('mem-dq-07');
      // dias depois: a briga boba
      await ctx.narrate('Uns dias depois. Uma tarde qualquer, cada um no seu celular.');
      ctx.startQuest('dq-m4');
      ctx.follow('weng', false);
      ctx.place('player', 15.2, 15.6, 'up');
      ctx.place('weng', 16.8, 15.6, 'up');
      await ctx.fadeIn(500);
      await ctx.say('bella', 'Olha esse casal do TikTok. Ele faz café da manhã pra ela todo dia. Todo. Dia.');
      await ctx.say('weng', 'E essa aqui? Ela nunca reclama de nada, nunca fica de cara feia.');
      await ctx.emote('bella', 'exclaim');
      await ctx.say('bella', 'Como assim? Isso foi indireta?');
      await ctx.say('weng', 'E o café da manhã foi o quê, então?');
      await ctx.choose('bella', '(O clima pesou)', ['"Esquece. Não quero mais falar disso."', '"Você tá me comparando com uma desconhecida?"']);
      await ctx.say('weng', '...Vou ficar um pouco no quarto.');
      await ctx.move('weng', 13.6, 7.9, 50);
      ctx.face('weng', 'up');
      await ctx.wait(400);
      await ctx.say('bella', '(Que briga mais boba. A gente nem é aquelas pessoas da internet. A gente é a gente.)');
      ctx.toast('Vá conversar com o Weng no quarto');
      return;
    }
    if (objActive('achar-meli')) {
      await ctx.say('bella', 'Debaixo da cama... só uma meia perdida. Nada de Meli.');
      return;
    }
    await ctx.say('bella', 'A cama com aquela capa de esteira de bambu. Geladinha, perfeita pro calor de Caxias.');
    await ctx.say('weng', 'Melhor invenção da China. Depois do macarrão.');
  },

  // Cozinha
  async armario(ctx) {
    if (objActive('sache') || (objDone('achar-meli') && objActive('potinho') && !ctx.has('sache'))) {
      await ctx.say('bella', 'Pratos, copos, panelas e... uma gaveta inteira de sachê. Prioridades.');
      await ctx.give('sache');
      ctx.objective(Q, 'sache');
      await ctx.say('weng', 'Bota no potinho dela, ali no chão da cozinha. É só ouvir o barulho que ela vem.');
      ctx.toast('Coloque o sachê no potinho da Meli');
      return;
    }
    await ctx.say('bella', 'A pia e o armário. Tudo arrumadinho... por enquanto.');
  },
  async potinhos(ctx) {
    if (objActive('potinho') && ctx.has('sache')) {
      ctx.take('sache');
      ctx.follow('weng', false);
      await ctx.move('player', 4.6, 16.2, 60);
      void ctx.move('weng', 6.6, 15.3, 60);
      ctx.face('player', 'left');
      ctx.sfx('pickup');
      await ctx.say('bella', 'Ó o sachêêê... Meli, Meli, Meli! (tchc-tchc-tchc)');
      // lá no quarto, a Meli escuta o barulho do sachê...
      if (!ctx.flag('dq-meli-vista')) {
        ctx.setFlag('dq-meli-vista');
        ctx.refresh();
        ctx.place('meli', P.torre.x, P.torre.y, 'down');
      }
      await ctx.focus(17.2, 7.2, 1.3, 700);
      ctx.pose('meli', null);
      ctx.face('meli', 'down');
      await ctx.emote('meli', 'exclaim');
      // ...e atravessa o apê correndo: sai do quarto, desce o corredor e entra na cozinha
      const corrida = (async () => {
        await ctx.move('meli', 17.2, 7.4, 120);
        await ctx.move('meli', 8.9, 7.4, 120);
        await ctx.move('meli', 8.9, 17.3, 120);
        await ctx.move('meli', P.potinho.x, P.potinho.y, 100);
        ctx.face('meli', 'down');
      })();
      // a câmera volta pra cozinha, enquadrada acima da caixa de diálogo
      await ctx.frame(4.2, 16.6, 1600);
      await corrida;
      await ctx.emote('meli', 'note');
      ctx.hearts('meli', 4);
      await ctx.say('meli', 'Nham nham nham...');
      await ctx.say('weng', 'Viu? Em dois segundos ela atravessou o apê inteiro.');
      await ctx.say('bella', 'Quem nunca, né, Meli? Por comida eu também atravesso.');
      ctx.pose('meli', 'meli-poses', 0);
      await ctx.unfocus(500);
      ctx.follow('weng', true);
      ctx.objective(Q, 'potinho');
      await ctx.say('weng', 'Agora ela já gosta de você uns 30%. Pra chegar nos 100%, só brincando.');
      ctx.toast('Pegue um novelo no cesto da sala');
      return;
    }
    await ctx.say('bella', 'Ração e água fresquinha. A Meli é bem cuidada.');
  },
  async geladeira(ctx) {
    await ctx.say('bella', 'Geladeira cheia de ímã. Tem até um de gatinho.');
  },
  async fogao(ctx) {
    if (QuestSystem.isActive('dq-m3') && !QuestSystem.isObjectiveDone('dq-m3', 'jantar')) {
      const c = await ctx.choose('bella', 'O que a gente cozinha hoje?', ['Macarrão ao molho branco', 'Strogonoff com batata palha', 'Miojo gourmet (com ovo!)']);
      const pratos = ['macarrão ao molho branco', 'strogonoff', 'miojo gourmet'];
      await ctx.say('weng', c === 2 ? 'Miojo gourmet. Respeito a ousadia.' : `Fechado: ${pratos[c]}. Eu pico a cebola e choro sozinho.`);
      await ctx.fadeOut(400);
      ctx.sfx('pickup');
      await ctx.narrate('Panela no fogo, música baixinha e a Meli rondando a cozinha esperando cair alguma coisa.');
      await ctx.fadeIn(400);
      await ctx.say('bella', 'Hmm... ficou bom demais! A gente é um ótimo time.');
      await ctx.say('weng', 'Eu te disse. Agora: filme no sofá?');
      ctx.objective('dq-m3', 'jantar');
      ctx.toast('Sente no sofá para ver o filme');
      return;
    }
    await ctx.say('weng', 'Um dia a gente cozinha junto aqui. Eu corto, você manda.');
    await ctx.say('bella', 'Fechado. E eu provo tudo antes.');
  },

  // Sala
  async cesto(ctx) {
    if (objDone('potinho') && !objDone('novelo')) {
      await ctx.say('bella', 'Um cesto cheio de novelos coloridos! Vou levar o azul.');
      await ctx.give('novelo');
      ctx.objective(Q, 'novelo');
      ctx.toast('Leve o novelo até a Meli');
      return;
    }
    if (objActive('achar-meli')) {
      await ctx.say('bella', 'Só novelos. Nenhuma gata laranja no meio.');
      return;
    }
    await ctx.say('bella', 'O cesto de brinquedos da Meli. Cheio de novelos.');
  },
  async sofa(ctx) {
    if (objActive('achar-meli')) {
      await ctx.say('bella', 'Atrás do sofá... nada. Só poeira e um controle perdido.');
      return;
    }
    if (QuestSystem.isActive('dq-m3') && QuestSystem.isObjectiveDone('dq-m3', 'jantar') && !QuestSystem.isObjectiveDone('dq-m3', 'filme')) {
      await ctx.sit(745, 640, [
        ['narrador', 'Um filme escolhido depois de vinte minutos de discussão. Pipoca, coberta e a Meli no meio dos dois.'],
        ['bella', 'Você vai dormir no meio do filme, né?'],
        ['weng', 'Jamais. ...Talvez.'],
        ['bella', 'Eu gosto daqui. Do apê, da Meli, de você.'],
        ['weng', 'Então fica. Hoje, pelo menos.'],
      ]);
      ctx.objective('dq-m3', 'filme');
      await ctx.say('weng', 'Tá tarde. Vamos dormir?');
      ctx.toast('Vá até a cama do quarto do Weng');
      return;
    }
    if (QuestSystem.isActive('dq-m2')) {
      await ctx.fadeOut(500);
      await ctx.backdrop('cena-pascoa');
      await ctx.fadeIn(600);
      await ctx.say('bella', 'Feliz Páscoa! Esse é pra você. E esse. E esse. E esse aqui também.');
      await ctx.say('weng', 'Bella... isso é ovo de Páscoa pra um ano inteiro!');
      await ctx.say('bella', 'Tem um pra sua irmã também. Não come o dela, hein.');
      await ctx.say('weng', 'Não prometo nada.');
      await ctx.say('weng', 'Mas eu também tenho uma coisa pra você.');
      await ctx.showItem('icon-chocolate', 'Você ganhou', 'Chocolates e cartinha de coelho', 'Uma caixa de bombons e uma cartinha em formato de coelho, escrita à mão pelo Weng.');
      await ctx.say('bella', 'Uma cartinha de coelhinho! Ai, que fofo. Vou guardar pra sempre.');
      await ctx.say('meli', 'Miau?');
      await ctx.say('weng', 'Não, Meli. Chocolate não é pra gato. Nem adianta me olhar assim.');
      await ctx.fadeOut(500);
      await ctx.backdrop(null);
      ctx.objective('dq-m2', 'pascoa');
      await ctx.fadeIn(500);
      await ctx.memory('mem-dq-06');
      await ctx.fadeOut(600);
      await ctx.narrate('Um tempo depois. A Bella vai dormir no apê pela primeira vez.');
      ctx.startQuest('dq-m3');
      await ctx.fadeIn(500);
      await ctx.say('weng', 'Hoje eu cozinho. Quer dizer... a gente cozinha. Eu corto, você manda.');
      ctx.toast('Vá até o fogão da cozinha');
      return;
    }
    await ctx.sit(745, 640, [['weng', 'Esse sofá já viu muita maratona de série.'], ['bella', 'Agora vai ver as nossas.']]);
  },
  async tv(ctx) {
    await ctx.say('bella', 'TV grande e três controles. Dá pra jogar até de três.');
    await ctx.say('weng', 'O terceiro é da Meli. Ela só não sabe ainda.');
  },
  async mesa(ctx) {
    await ctx.say('bella', 'Toalha xadrez e um vasinho de flor. Quem arrumou foi você ou a sua avó?');
    await ctx.say('weng', 'A minha avó. Antes de viajar. Eu só não estraguei.');
  },
  async arranhadorSala(ctx) {
    await ctx.say('bella', 'Mais um arranhador? A Meli tem um em cada cômodo?');
    await ctx.say('weng', 'Se não tiver, ela usa o sofá.');
  },
  async abajur(ctx) {
    await ctx.say('bella', 'Luz amarelinha. O apê fica tão aconchegante à noite.');
  },

  // Quarto do Weng
  async computador(ctx) {
    await ctx.say('bella', 'O PC do Weng. Luzinha roxa, headset, teclado que brilha. Muito gamer.');
    await ctx.say('weng', 'É aqui que eu passo vergonha nos jogos.');
  },
  async estante(ctx) {
    const jogos = PERSONAL.favorites.jogos;
    if (!ctx.flag('dq-cartas-1')) {
      await ctx.say('bella', `Quanto jogo! Olha, tem ${jogos[0]} e ${jogos[1]}!`);
      await ctx.say('weng', 'E tem o Bate-Gato, que eu inventei com cartas da Meli, do Pombo e da Lala. Já vou avisando: eu sou imbatível.');
      await ctx.say('bella', 'Você fala isso agora...');
    }
    if (QuestSystem.isActive(Q)) {
      await ctx.say('weng', 'Depois a gente joga. Primeiro, a Meli tem que te aprovar.');
      return;
    }
    const c = await ctx.choose('bella', 'Jogar Bate-Gato com o Weng?', ['Bora jogar!', 'Agora não']);
    if (c === 1) return;
    ctx.setFlag('dq-cartas-1');
    const r = await ctx.cards({ title: 'Bate-Gato' });
    if (r.won) {
      await ctx.emote('bella', 'heart');
      await ctx.say('bella', `${r.bella} a ${r.weng}! Quem é imbatível agora, hein?`);
      await ctx.say('weng', 'Sorte de principiante. Revanche!');
      if (!ctx.flag('dq-cartas-venceu')) {
        ctx.setFlag('dq-cartas-venceu');
        await ctx.memory('mem-dq-03');
      }
    } else {
      await ctx.say('weng', `${r.weng} a ${r.bella}. Eu avisei.`);
      await ctx.say('bella', 'Revanche. Agora. E sem roubar.');
    }
  },
  async janela(ctx) {
    if (objActive('janela') && objDone('carinho')) {
      await ctx.fadeOut(300);
      ctx.place('player', 13.1, 6.3, 'up');
      ctx.place('weng', 10.9, 6.3, 'up');
      await ctx.fadeIn(300);
      await ctx.say('weng', 'Olha lá embaixo.');
      await ctx.narrate('Da janela, lá embaixo: o Teatro Raul Cortez, todo branco e iluminado, com a rampa que parece flutuar.');
      await ctx.emote('bella', 'heart');
      await ctx.say('bella', 'Você vê o teatro daqui de cima?! Que vista linda.');
      await ctx.say('weng', 'E do outro lado da rua tem o Shopping da Multidão.');
      await ctx.say('bella', 'O QUÊ? Você mora em frente ao Multidão e nunca me disse?');
      await ctx.say('weng', 'Eu sabia que se eu falasse você vinha morar aqui.');
      await ctx.say('bella', '...Não é má ideia.');
      ctx.face('player', 'left');
      ctx.face('weng', 'right');
      await ctx.say('weng', 'Que bom que você veio. O apê parece outro com você aqui.');
      ctx.hearts('player', 8);
      if (ctx.hasArt('cena-duque-janela')) await ctx.illustration('cena-duque-janela', ['A vista da janela.', 'Duque de Caxias. O teatro lá embaixo, a Meli no parapeito.']);
      ctx.pose('meli', 'meli-poses', 1);
      ctx.place('meli', P.caminha.x, P.caminha.y, 'down');
      ctx.objective(Q, 'janela');
      await ctx.wait(600);
      await ctx.fadeOut(600);
      await ctx.narrate('Algumas semanas depois. Domingo de Páscoa.');
      ctx.startQuest('dq-m2');
      await ctx.fadeIn(500);
      await ctx.say('bella', 'Weng! Vem pro sofá. Eu trouxe uma coisinha. Ou várias.');
      ctx.toast('Sente no sofá com a Bella');
      return;
    }
    await ctx.say('bella', 'A janela do quarto dele. Lá embaixo, o teatro todo iluminado.');
  },

  // Quarto dos avós
  async guardaRoupa(ctx) {
    await ctx.say('bella', `O guarda-roupa do quarto do ${VO} e da ${VOH}. Melhor não mexer.`);
  },
  async radio(ctx) {
    await ctx.say('bella', 'Um radinho antigo e um abajur. Tudo do jeitinho que eles deixaram.');
  },
  async camaAvos(ctx) {
    await ctx.say('bella', `A cama dos seus avós, arrumadinha. Em cima, as fotos do ${VO} e da ${VOH}.`);
    await ctx.say('weng', 'Eles tão na China. Quando voltarem, você vai conhecer. A minha avó vai querer te dar comida até você explodir.');
    await ctx.say('bella', 'Já amei ela.');
  },

  // Banheiro
  async espelho(ctx) {
    await ctx.say('bella', 'Ajeitando o cabelo... Pronto. Linda como sempre.');
  },
  async chuveiro(ctx) {
    await ctx.say('bella', 'Box com chuveiro e um vasinho pendurado. Até o banheiro é fofo.');
  },
};

/** Capítulo 1 — apartamento do Weng em Duque de Caxias (interior, cenário pintado). */
export const aptoMap: MapDef = {
  id: 'duque-apto',
  region: 'duque-de-caxias',
  name: 'Apê do Weng',
  indoor: true,
  music: 'casa',
  background: '#2a1d2a',
  art: 'native',
  legend: { '.': T.WOOD },
  ground: Array.from({ length: 22 }, () => ROW),

  blocks: [
    // Paredes externas
    R(0, 0, 40, 1024),
    R(1490, 0, 1536, 1024),
    R(0, 0, 1536, 250), // paredes do fundo dos dois quartos
    R(0, 905, 715, 1024), // parede de baixo (porta em x 715–820)
    R(820, 905, 1536, 1024),
    // Divisória entre os quartos
    R(895, 0, 948, 470),
    // Quarto do Weng ↔ cozinha (passagem para a sala em x 410–495)
    R(0, 440, 410, 470),
    // Parede da sala com quadros (atrás do sofá)
    R(495, 410, 975, 555),
    // Toquinho de parede entre o quarto dos avós e a sala
    R(1075, 410, 1100, 470),
    // Cozinha: bancada, fogão, geladeira; parede da direita (passagem para a sala em y 725–840)
    R(40, 470, 410, 705),
    R(378, 470, 404, 725),
    R(378, 840, 410, 905),
    R(50, 850, 152, 897), // potinhos da Meli
    // Banheiro: parede de cima e da esquerda (entrada pela sala em y 722–840)
    R(1190, 440, 1490, 560),
    R(1190, 440, 1218, 722),
    R(1190, 840, 1218, 905),
    R(1255, 640, 1345, 735), // pia
    R(1375, 500, 1490, 722), // box
    R(1410, 740, 1490, 815), // vaso
    // Quarto do Weng
    R(85, 215, 290, 420), // cama
    R(295, 200, 362, 300), // criado-mudo + abajur
    R(380, 200, 620, 310), // mesa do computador
    R(460, 300, 535, 330), // cadeira
    R(640, 200, 810, 275), // estante
    R(805, 240, 895, 310), // arranhador com casinha
    R(292, 370, 378, 425), // caminha da Meli
    // Quarto dos avós
    R(985, 230, 1130, 310), // guarda-roupa
    R(1190, 240, 1265, 300), // criado-mudo + rádio
    R(1265, 230, 1440, 420), // cama
    // Sala
    R(548, 578, 590, 610), // planta grande (só o vaso: dá pra passar entre ela e a TV)
    R(446, 600, 505, 840), // rack da TV (fresta até a parede da cozinha para entrar nela)
    R(595, 560, 905, 690), // sofá
    R(640, 700, 790, 780), // mesa de centro
    R(895, 615, 930, 645), // abajur de pé
    R(955, 610, 1100, 780), // mesa de jantar + cadeiras
    R(1106, 576, 1144, 600), // cesto de novelos
    R(1110, 815, 1165, 850), // arranhador da sala
  ],

  // Profundidade: o que fica na frente de quem passa atrás
  overlays: [
    { x0: 950, y0: 580, x1: 1105, y1: 790, base: 780, cut: 'furniture' }, // mesa de jantar
    { x0: 512, y0: 488, x1: 606, y1: 612, base: 610, cut: 'foliage' }, // planta grande da sala
    { x0: 1102, y0: 715, x1: 1172, y1: 853, base: 850, cut: 'furniture' }, // arranhador da sala
    { x0: 515, y0: 850, x1: 607, y1: 960, base: 955, cut: 'foliage' }, // planta da porta (esq.)
    { x0: 925, y0: 850, x1: 1013, y1: 960, base: 955, cut: 'foliage' }, // planta da porta (dir.)
  ],

  lighting: {
    darkness: 0.32,
    lights: [
      { x: 415, y: 215, r: 170 }, // abajur do quarto
      { x: 635, y: 215, r: 140, color: 0x9a8cff }, // monitor
      { x: 1275, y: 230, r: 170 }, // abajur dos avós
      { x: 910, y: 525, r: 230 }, // abajur de pé da sala
      { x: 748, y: 720, r: 110, flicker: true }, // vela da mesa de centro
      { x: 470, y: 650, r: 150, color: 0x9a8cff }, // TV
      { x: 1000, y: 640, r: 160 }, // mesa de jantar
      { x: 200, y: 640, r: 210 }, // cozinha
      { x: 1350, y: 650, r: 200, color: 0xffe9f0 }, // banheiro
    ],
  },

  hotspots: [
    // Quarto do Weng
    { rect: R(85, 165, 292, 422), interact: 'camaWeng', label: 'Cama', markerIf: () => QuestSystem.isActive('dq-m3') && QuestSystem.isObjectiveDone('dq-m3', 'filme') },
    { rect: R(380, 140, 560, 332), interact: 'computador', label: 'Computador' },
    { rect: R(560, 30, 700, 332), interact: 'janela', label: 'Janela', markerIf: () => objActive('janela') && objDone('carinho') },
    { rect: R(640, 60, 805, 280), interact: 'estante', label: 'Jogar cartas' },
    { rect: R(805, 130, 895, 312), interact: 'arranhador', label: 'Arranhador', markerIf: () => objActive('achar-meli') && GameState.is('dq-pista') },
    { rect: R(290, 355, 380, 428), interact: 'caminha', label: 'Caminha' },
    // Quarto dos avós
    { rect: R(985, 85, 1130, 312), interact: 'guardaRoupa', label: 'Guarda-roupa' },
    { rect: R(1190, 200, 1265, 302), interact: 'radio', label: 'Rádio' },
    { rect: R(1265, 185, 1440, 422), interact: 'camaAvos', label: 'Cama' },
    // Cozinha
    { rect: R(50, 535, 152, 707), interact: 'geladeira', label: 'Geladeira' },
    { rect: R(160, 570, 250, 707), interact: 'fogao', label: 'Fogão', markerIf: () => QuestSystem.isActive('dq-m3') && !QuestSystem.isObjectiveDone('dq-m3', 'jantar') },
    { rect: R(250, 565, 380, 707), interact: 'armario', label: 'Armário', markerIf: () => objActive('sache') },
    { rect: R(50, 840, 152, 897), interact: 'potinhos', label: 'Potinhos', markerIf: () => objActive('potinho') && objDone('sache') },
    // Sala
    { rect: R(420, 535, 505, 842), interact: 'tv', label: 'Videogame' },
    { rect: R(595, 530, 905, 692), interact: 'sofa', label: 'Sentar', markerIf: () => QuestSystem.isActive('dq-m2') || (QuestSystem.isActive('dq-m3') && QuestSystem.isObjectiveDone('dq-m3', 'jantar') && !QuestSystem.isObjectiveDone('dq-m3', 'filme')) },
    { rect: R(955, 590, 1100, 782), interact: 'mesa', label: 'Mesa' },
    { rect: R(1090, 525, 1160, 602), interact: 'cesto', label: 'Cesto', markerIf: () => objActive('novelo') && objDone('potinho') },
    { rect: R(1105, 720, 1168, 852), interact: 'arranhadorSala', label: 'Arranhador' },
    { rect: R(885, 495, 935, 647), interact: 'abajur', label: 'Abajur' },
    // Banheiro
    { rect: R(1255, 545, 1345, 737), interact: 'espelho', label: 'Espelho' },
    { rect: R(1375, 500, 1490, 724), interact: 'chuveiro', label: 'Box' },
  ],

  npcs: [
    // o Vô e a Vó voltam da China depois da briga boba
    { id: 'vof-weng', sprite: 'vof-weng', tx: 5.2, ty: 16.0, facing: 'down', interact: 'vof', behavior: 'wander', wanderRadius: 2, wanderAxis: 'x', visibleIf: () => QuestSystem.isDone('dq-m4') },
    { id: 'vom-weng', sprite: 'vom-weng', tx: 22.6, ty: 16.9, facing: 'left', interact: 'vom', behavior: 'wander', wanderRadius: 1.6, wanderAxis: 'x', visibleIf: () => QuestSystem.isDone('dq-m4') },
    {
      id: 'meli',
      sprite: 'meli',
      tx: 17.2,
      ty: 6.2,
      facing: 'down',
      interact: 'meli',
      visibleIf: () => GameState.is('dq-meli-vista') || questDone(),
      markerIf: () => (objActive('brincar') && objDone('novelo')) || (objActive('carinho') && objDone('brincar')),
    },
  ],
  spawns: {
    porta: { tx: 15.5, ty: 17.4, facing: 'up' },
  },
  triggers: [
    // Porta de saída: durante a visita fica em casa; depois, passeios
    { id: 'porta', rect: R(715, 900, 820, 945), script: 'porta' },
    // Pista: entrando no quarto do Weng, um barulhinho de sininho
    { id: 'pista', rect: R(410, 330, 900, 440), script: 'pista', once: true, enabledIf: () => objActive('achar-meli') },
  ],
  scripts: {
    ...scripts,
    async vof(ctx) {
      const f = ['Come mais, menina! Tem bolinho na cozinha.', 'O Weng era um bebê gordinho, sabia? Tenho foto. Depois te mostro.', 'A Meli gosta mais de você do que de mim. Que traição.'];
      const n = Number(ctx.flag('vof-n') ? 1 : 0) + (ctx.flag('vof-n2') ? 1 : 0);
      ctx.setFlag(n === 0 ? 'vof-n' : 'vof-n2');
      await ctx.say('vof-weng', f[Math.min(n, 2)]);
    },
    async vom(ctx) {
      const f = ['Na China tava frio. Aqui tá esse calor de Caxias... já sinto saudade do frio.', 'Joga Bate-Gato com o Weng? Ele perde pra mim também.', 'Cuida bem do meu neto, hein.'];
      const n = Number(ctx.flag('vom-n') ? 1 : 0) + (ctx.flag('vom-n2') ? 1 : 0);
      ctx.setFlag(n === 0 ? 'vom-n' : 'vom-n2');
      await ctx.say('vom-weng', f[Math.min(n, 2)]);
    },
    async weng(ctx) {
      if (QuestSystem.isActive('dq-m4')) {
        await ctx.say('bella', 'Posso entrar?');
        await ctx.say('weng', 'Pode. Eu tava pensando em você. Na gente.');
        const c = await ctx.choose('bella', 'O que dizer?', ['"Desculpa. Eu não quero ser comparada, e também não quero te comparar."', '"A gente não é aquele casal do TikTok. E ainda bem."']);
        await ctx.say('weng', c === 0 ? 'Desculpa também. Eu nem gosto de café da manhã de propaganda. Gosto do nosso jeito.' : 'Ainda bem mesmo. Aquele casal nunca ia jogar Bate-Gato às duas da manhã.');
        await ctx.say('bella', 'Então combinado: nada de régua da internet. Só a gente.');
        await ctx.fadeOut(600);
        await ctx.illustration('cena-pazes', ['As pazes.', 'Aprendemos juntos. E pedimos desculpas um pro outro.']);
        ctx.objective('dq-m4', 'pazes');
        ctx.follow('weng', true);
        await ctx.memory('mem-dq-08');
        // o aniversário dela
        await ctx.narrate('Algumas semanas depois. O Vô e a Vó voltaram da China. E o aniversário da Bella estava chegando...');
        ctx.startQuest('dq-m5');
        ctx.refresh();
        await ctx.fadeIn(500);
        await ctx.say('vof-weng', 'Bella! Finalmente te conheci pessoalmente! Vem cá, deixa eu te olhar. Tá magrinha, vou fazer um bolinho.');
        await ctx.say('vom-weng', 'Seja bem-vinda. O Weng não para de falar de você.');
        await ctx.emote('bella', 'heart');
        await ctx.say('bella', 'Ai, que fofos! Eu é que tô feliz de conhecer vocês.');
        await ctx.say('weng', '(Hotel no alto do morro, restaurante chique, Quitandinha, piquenique... já tá tudo reservado. Agora é só contar.)');
        ctx.toast('Fale com o Weng');
        return;
      }
      if (QuestSystem.isActive('dq-m5')) {
        await ctx.say('weng', 'Bella, pega um casaco. Dos grossos.');
        await ctx.say('bella', 'Casaco? Em Duque de Caxias? Tá tudo bem com você?');
        await ctx.say('weng', 'É que no seu aniversário a gente vai pra... Petrópolis!');
        await ctx.emote('bella', 'heart');
        await ctx.say('bella', 'PETRÓPOLIS?! Sério?! Weng!!!');
        await ctx.say('weng', 'Hotel lá no alto do morro, frio de verdade. Almoço chique, Quitandinha e piquenique. Tudo nosso.');
        await ctx.say('bella', 'Você é o melhor namorado do mundo. Já disse isso hoje?');
        await ctx.say('weng', 'Hoje não. Pode repetir.');
        ctx.objective('dq-m5', 'convite');
        ctx.unlockRegion('petropolis');
        await ctx.chapterCard('Fim do Capítulo 2', 'Duque de Caxias', 'Nosso cantinho.', 'Continuar');
        await ctx.chapterCard('Capítulo 3', 'Petrópolis', 'O aniversário dela.', 'Começar');
        await ctx.teleport('pt-hotel-fora', 'portao');
        return;
      }
      await ctx.say('weng', 'Que foi? Tá me olhando com cara de quem quer açaí.');
    },
    async porta(ctx) {
      if (QuestSystem.isActive(Q)) {
        await ctx.say('weng', 'Hoje a gente fica em casa com a Meli.');
        await ctx.move('player', P.porta.x, P.porta.y - 0.6, 60);
        return;
      }
      await ctx.teleport('duque-rua', 'portaria');
    },
    async pista(ctx) {
      ctx.setFlag('dq-pista');
      await ctx.say('bella', '(Ouvi um sininho... tlim, tlim. Veio do arranhador, ali no canto do quarto.)');
    },
  },
  onEnter: 'chegada',
};
