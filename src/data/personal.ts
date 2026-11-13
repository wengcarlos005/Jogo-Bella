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
  rioDasOstras: { pai: 'Pai da Bella' },
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
    '[ESCREVA AQUI A CARTA DO WENG]',
    'Cada parágrafo deste array vira um parágrafo na tela de leitura.',
  ],

  /** Mensagem de encerramento (editável). */
  closing: [
    'Três anos de histórias, milhares de momentos e tantos lugares para conhecer.',
    'Se essa aventura me ensinou alguma coisa, é que meu lugar favorito nunca foi uma cidade, uma praia ou um destino.',
    'É onde você está.',
    'Feliz 3 anos, Bella.',
    'Com amor, Weng.',
  ],
};

export function dateOrPlaceholder(value: string): string {
  return value.trim() ? value : '[data a definir]';
}
