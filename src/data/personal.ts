/**
 * ============================================================
 *  DADOS PESSOAIS — EDITE AQUI
 * ============================================================
 * Tudo que é real (nomes, datas, a carta) fica neste arquivo.
 * O jogo nunca inventa datas: enquanto um campo estiver vazio,
 * aparece um marcador "[a definir]" no lugar.
 */
export const PERSONAL = {
  bella: { name: 'Bella' },
  weng: { name: 'Weng' },

  /** Família da Bella como aparecerá nos diálogos. */
  bellaMom: { name: 'Mãe da Bella' },
  /**
   * Padrasto da Bella.
   *  - name: nome exibido na caixa de diálogo (ex.: 'Carlos').
   *  - chamado: como a Bella chama ele nas falas (ex.: 'Carlos', 'Tio'). Vazio = sem vocativo.
   */
  bellaStepdad: { name: 'Alexandre', chamado: 'Alexandre' },

  /** Avós do Weng: às vezes ficam no apartamento dele em Duque de Caxias; quando o casal se conheceu, estavam na China. */
  wengGrandparents: { avo: 'Vó', avoh: 'Vô' },
  /**
   * Família do Weng em Araruama (ano-novo de 2024, na cobertura dos tios em frente à lagoa):
   * 4 tios (a principal é a tia Tim, que fez a ceia), os primos e a Anne, irmã do Weng.
   * Idades: Mingau (o Miguel) 10, Julinha 10, Laylinha 5. Lilian, Vivian e Diego são os primos mais velhos.
   * Ceia: pato, macarrão de arroz e frango xadrez. Suco no Cosechas. Parque de diversões: vários brinquedos.
   * A Bella estava nervosa porque conhecia pouco a família e tinha medo de ser julgada.
   */
  wengFamily: { tia: 'Tim', irma: 'Anne', primos: ['Lilian', 'Vivian', 'Diego', 'Julinha', 'Mingau', 'Laylinha'] },
  /**
   * Rio das Ostras (passagem rápida, o ponto alto foi a praia): o pai da Bella não quis pagar o
   * guarda-sol, os dois se queimaram, o Weng ajudou a pagar (o salvador). O pai trouxe frutas e
   * torradas (a Bella achou ele canguinha). No fim, petisco na barraca até a tempestade.
   */
  /** pai biológico da Bella (o padrasto é o Alexandre) */
  rioDasOstras: { pai: 'Anderson' },
  /** Gatos: Meli (do Weng, laranja); Pombo (preto) e Lala (branca com manchas marrons) da Bella. */
  pets: { weng: ['Meli'], bella: ['Pombo', 'Lala'] },
  /**
   * Família da Bella (Piabetá, mesmo condomínio de casas): a avó mora em cima da casa da mãe,
   * a tia Jaque numa casa do condomínio, e a Kelly é prima dela (filha adotiva da avó).
   */
  bellaFamily: { tia: 'Jaque', prima: 'Kelly', avo: 'Vó' },
  /** Coisas de vocês usadas nas falas e escolhas. */
  favorites: {
    jogos: ['Taco Gato', 'Exploding Kittens'],
    filme: 'Five Nights at Freddy\'s',
    musicaPedido: 'Yellow (Coldplay)',
  },

  /** Datas reais (formato livre, ex.: "12/03/2023"). Deixe '' se não souber. */
  dates: {
    firstDate: '',
    firstKiss: '',
    anniversary: '',
  },

  /** Lugares reais da história. */
  places: {
    /** Hamburgueria do primeiro encontro (foram de Uber). */
    hamburgueria: 'Rota 66',
  },

  /** Mensagem que Weng manda no celular no início do jogo. */
  openingText: 'Tô chegando! Te espero na esquina da sua rua, tá? Tá chovendo, leva guarda-chuva',

  /**
   * A CARTA FINAL. Substitua pelo texto real do Weng.
   * Cada item do array é um parágrafo.
   */
  letter: [
    'Meu amor,',
    'Três anos. Às vezes parece que foi ontem que tudo começou, mas, ao mesmo tempo, quando olho para trás, parece que vivemos uma vida inteira de histórias, momentos e lembranças juntos.',
    'É difícil colocar em palavras tudo o que você significa para mim. São tantos momentos, tantas risadas, passeios, descobertas, desafios e pequenas coisas do dia a dia que, quando juntas, formam uma das partes mais especiais da minha vida: a nossa história.',
    'Sou muito feliz por ter você ao meu lado. Por poder compartilhar minhas conquistas, meus sonhos, minhas preocupações e até as coisas mais bobas do cotidiano. Você tornou tantos momentos mais especiais simplesmente por estar presente.',
    'Sei que nem todos os dias são perfeitos, mas acho que uma das coisas mais bonitas do nosso relacionamento é justamente isso: continuarmos escolhendo um ao outro, aprendendo juntos, crescendo e construindo algo que é só nosso.',
    'Espero que esses três anos sejam apenas o começo de uma história muito maior. Ainda quero conhecer tantos lugares com você, conhecer a Disney, viajar para a China, Coreia, Japão, ter um passeio romântico na Itália... colecionar novas memórias e descobrir milhares de motivos para me apaixonar ainda mais.',
    'Obrigado por ser minha companheira, minha parceira e por fazer parte da minha vida de uma maneira tão especial.',
    'Feliz 3 anos de namoro, meu amor!',
    'Eu te amo, Bella. Hoje, amanhã e em todos os capítulos que ainda vamos escrever juntos. ❤️',
    'Prometo te dar dois universos :)',
  ],

  /** Bilhete depois da carta, antes do prólogo: pra ela aproveitar o jogo. */
  welcome: [
    'Esse jogo é a nossa história, contada do jeito que eu lembro (com um pouquinho de exagero, juro que só um pouquinho).',
    'São sete capítulos: de Piabetá até a virada a pé em Cabo Frio. Cada lugar tem conversas, minijogos e lembranças escondidas pra você achar.',
    'Não tem pressa e não tem como perder. Se algum minijogo ficar difícil, tenta de novo ou segue em frente: a nossa história continua do mesmo jeito.',
    'Fala com todo mundo, mexe em tudo que brilhar e me mostra os itens da mochila. Eu sempre tenho alguma coisa pra dizer.',
    'Aproveita cada pedacinho. Fiz pensando em você o tempo todo.',
  ],

  /**
   * A CARTA FINAL (no fim do jogo, depois da retrospectiva). Cada item é um parágrafo;
   * prefixos: "#" título, "~" frase solta em destaque, "@" assinatura, "+" P.S.
   */
  finalLetter: [
    '#Parabéns, meu amor! Você chegou ao final! ❤️',
    '~Mas será que chegou mesmo?',
    'Se você chegou até aqui, significa que percorreu novamente um pedacinho da nossa história. Visitou lugares que guardam lembranças, relembrou momentos que vivemos e, espero, sentiu um pouquinho de tudo aquilo que sinto quando penso em nós dois.',
    'Eu poderia ter criado qualquer jogo, com qualquer história, qualquer personagem ou qualquer aventura. Mas escolhi contar a nossa. Porque, para mim, não existe aventura mais bonita do que aquela que estamos vivendo juntos.',
    'Cada cenário, cada detalhe e cada lembrança foram colocados aqui com muito carinho. Talvez algumas coisas pareçam pequenas, mas todas elas têm um significado enorme para mim. Afinal, são justamente esses pequenos momentos que fizeram a nossa história ser tão especial.',
    'Três anos se passaram desde que começamos essa aventura. Nesse tempo, conhecemos lugares, enfrentamos desafios, demos muitas risadas, aprendemos um com o outro e construímos memórias que vou guardar para sempre.',
    'E sabe o que é mais engraçado? Mesmo depois de tudo isso, ainda sinto que temos tanto para viver.',
    'Ainda existem cidades para conhecer, viagens para fazer, sonhos para realizar, histórias para contar e muitos momentos que sequer imaginamos que estão por vir.',
    'Talvez esse jogo tenha uma tela de conclusão, mas a nossa história não tem uma última fase, um último chefe ou créditos finais. Quero continuar desbloqueando novas aventuras com você, descobrindo novos lugares e criando lembranças que um dia também merecerão estar em um jogo.',
    'Obrigado por esses três anos, por ser minha companheira e por fazer parte da minha vida.',
    'Se eu pudesse escolher novamente, entre todas as histórias possíveis, escolheria viver essa com você. Mil vezes.',
    '@Feliz 3 anos de namoro, com amor',
    '@Weng',
    '+Eu te amo. E mal posso esperar para descobrir o que vem na próxima fase. ❤️',
  ],

  /** O "status da missão" que fecha o jogo, depois da carta final. */
  closing: [
    'Status da missão: 3 anos concluídos.',
    'Próxima missão: uma vida inteira juntos.',
  ],
};

export function dateOrPlaceholder(value: string): string {
  return value.trim();
}
