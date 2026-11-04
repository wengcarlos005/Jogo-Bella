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

  /** Nomes dos pais da Bella como aparecerão nos diálogos. */
  bellaMom: { name: 'Mãe da Bella' },
  bellaDad: { name: 'Pai da Bella' },

  /** Datas reais (formato livre, ex.: "12/03/2023"). Deixe '' se não souber. */
  dates: {
    firstDate: '',
    firstKiss: '',
    anniversary: '',
  },

  /** Mensagem que Weng manda no celular no início do jogo. */
  openingText: 'Tô saindo de casa! Daqui a pouco chego aí 😊',

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
