import type { ItemCategory } from '@/core/types';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  /** Chave de textura do ícone (16x16). Placeholder gerado se não houver arte. */
  icon: string;
  /** Itens únicos não acumulam quantidade. */
  unique?: boolean;
  /** "Mostrar pro Weng" na mochila: a conversinha que acontece (quem fala, o quê). */
  talk?: [string, string][];
}

export const ITEMS: Record<string, ItemDef> = {
  'colar-pingente': {
    id: 'colar-pingente',
    name: 'Colar com pingente',
    category: 'especiais',
    description: 'O colar de sempre. Dá sorte em dias importantes.',
    icon: 'it:colar-pingente',
    unique: true,
    talk: [['weng', 'O colar de sempre. Ele dá sorte mesmo?'], ['bella', 'Deu. Olha só quem tá do meu lado.']],
  },
  'oculos-rosa': {
    id: 'oculos-rosa',
    name: 'Óculos rosados',
    category: 'especiais',
    description: 'Sem eles, nada de enxergar o Weng chegando.',
    icon: 'it:oculos-rosa',
    unique: true,
    talk: [['weng', 'Esses óculos rosados combinam demais com você.'], ['bella', 'E sem eles eu não te enxergo chegando. São essenciais.']],
  },
  'celular': {
    id: 'celular',
    name: 'Celular',
    category: 'missao',
    description: 'Uma mensagem nova do Weng.',
    icon: 'it:celular',
    unique: true,
  },
  'flor-do-quintal': {
    id: 'flor-do-quintal',
    name: 'Flor do quintal',
    category: 'flores',
    description: 'Uma florzinha colhida no caminho.',
    icon: 'it:flor-do-quintal',
    talk: [['bella', 'Uma florzinha do quintal. Pra você.'], ['weng', 'Vou guardar dentro de um livro. Igual filme.']],
  },
  'rosa-rosa': {
    id: 'rosa-rosa',
    name: 'Rosa rosa',
    category: 'flores',
    description: 'A rosa que o Weng trouxe quando veio te buscar. A primeira flor de muitas.',
    icon: 'it:rosa-rosa',
    unique: true,
    talk: [['bella', 'Lembra dessa rosa? A primeira que você me deu.'], ['weng', 'Lembro. Eu ensaiei a entrega umas cinco vezes no carro.']],
  },
  'vale-beijo': {
    id: 'vale-beijo',
    name: 'Vale Beijo & Vale Abraço',
    category: 'presentes',
    description: 'Feito à mão pra dar pro Weng. Válido por tempo indeterminado.',
    icon: 'it:vale-beijo',
    unique: true,
    talk: [['weng', 'Posso usar o vale-beijo agora?'], ['bella', 'Ele é válido por tempo indeterminado. Pode.']],
  },
  chocolates: {
    id: 'chocolates',
    name: 'Chocolates',
    category: 'presentes',
    description: 'Um montão de chocolates pro Weng. Se sobrar algum até a hamburgueria, é milagre.',
    icon: 'it:chocolates',
    unique: true,
  },
  'burger-rota66': {
    id: 'burger-rota66',
    name: 'Guardanapo da Rota 66',
    category: 'lembrancas',
    description: 'Guardado de recordação do primeiro lanche juntos. Tem uma manchinha de molho.',
    icon: 'it:burger-rota66',
    unique: true,
    talk: [['weng', 'Você guardou o guardanapo da Rota 66?!'], ['bella', 'Primeiro lanche juntos. Com mancha de molho e tudo.']],
  },
  'bilhete-misterioso': {
    id: 'bilhete-misterioso',
    name: 'Bilhete dobrado',
    category: 'lembrancas',
    description: '"Siga as lembranças." Quem deixou isso aqui?',
    icon: 'it:bilhete-misterioso',
    unique: true,
  },
  sache: {
    id: 'sache',
    name: 'Sachê de peixe',
    category: 'especiais',
    description: 'O sachê preferido da Meli. Basta abrir que ela aparece do nada.',
    icon: 'it:sache',
  },
  novelo: {
    id: 'novelo',
    name: 'Novelo de lã',
    category: 'especiais',
    description: 'Um novelo azul do cesto da sala. Brinquedo oficial da Meli.',
    icon: 'it:novelo',
    unique: true,
  },
  // ---------------------------------------------------------------- Capítulo 3 · Petrópolis
  'algodao-rosa': {
    id: 'algodao-rosa',
    name: 'Algodão-doce rosa',
    category: 'comidas',
    description: 'Do carrinho de doces do Quitandinha. Grudou no cabelo, na mão e no Weng.',
    icon: 'it:algodao-rosa',
    unique: true,
    talk: [['weng', 'Ainda tem algodão-doce? Me dá um pedaço?'], ['bella', 'Um pedacinho. Bem pequeno.'], ['weng', 'Isso é um fio, Bella. Um FIO.']],
  },
  'chave-quarto-12': {
    id: 'chave-quarto-12',
    name: 'Chave do quarto 12',
    category: 'lembrancas',
    description: 'Do hotel em Petrópolis. O quarto com lareira e chocolate quente de boas-vindas.',
    icon: 'it:chave-quarto-12',
    unique: true,
    talk: [['weng', 'Você ainda tá com a chave do quarto 12? A gente tinha que ter devolvido!'], ['bella', 'Eu devolvi a de verdade. Essa aqui é a da memória.'], ['weng', '...Essa eu deixo você ficar.']],
  },
  // ---------------------------------------------------------------- Capítulo 4 · Araruama
  'fichas-parque': {
    id: 'fichas-parque',
    name: 'Fichas do parque',
    category: 'missao',
    description: 'A tia Tim comprou pra todo mundo. Cada brinquedo gasta uma: carrossel, bate-bate, argolas e roda-gigante.',
    icon: 'it:fichas-parque',
    talk: [['weng', 'Guarda bem essas fichas. A última é da roda-gigante.'], ['bella', 'Por que a roda-gigante tem que ser por último?'], ['weng', 'Porque lá de cima é onde eu quero terminar o ano. Com você.']],
  },
  'pedra-coracao': {
    id: 'pedra-coracao',
    name: 'Pedra-coração',
    category: 'lembrancas',
    description: 'A terceira pedrinha, aquela em formato de coração. A Bella não jogou: guardou.',
    icon: 'it:pedra-coracao',
    unique: true,
    talk: [['bella', 'Lembra dessa? A pedra-coração da lagoa.'], ['weng', 'Você ia jogar ela e desistiu no último segundo.'], ['bella', 'Coração não se joga fora. Nem de pedra.']],
  },
  'urso-araruama': {
    id: 'urso-araruama',
    name: 'Ursinho Araruama',
    category: 'presentes',
    description: 'A pelúcia que o Weng ganhou nas argolas. Pela primeira vez na história da família.',
    icon: 'it:urso-araruama',
    unique: true,
    talk: [['weng', 'O Araruama! Ele tá bem?'], ['bella', 'Dorme comigo todo dia. Tá ótimo.'], ['weng', 'Eu devia ter ganhado um pra mim também, então.']],
  },
  chaveirinho: {
    id: 'chaveirinho',
    name: 'Chaveirinho de consolação',
    category: 'presentes',
    description: 'O prêmio de quem não acertou as argolas. A Bella amou mesmo assim.',
    icon: 'it:chaveirinho',
    unique: true,
    talk: [['weng', 'Você ainda usa esse chaveirinho? É o prêmio de quem perdeu!'], ['bella', 'É o prêmio de quem tentou por mim. Vale mais.']],
  },
  // ---------------------------------------------------------------- Capítulo 5 · Rio das Ostras
  'concha-castelo': {
    id: 'concha-castelo',
    name: 'Concha do castelo',
    category: 'lembrancas',
    description: 'Enfeitava a torre do castelo de areia em Rio das Ostras. A onda levou o castelo; a concha ficou.',
    icon: 'it:concha-castelo',
    unique: true,
    talk: [['bella', 'Sobrou isso do nosso castelo.'], ['weng', 'O castelo mais bonito da praia. Durou uns quatro minutos.'], ['bella', 'Os melhores quatro minutos da arquitetura.']],
  },
  // ---------------------------------------------------------------- Capítulo 6 · Niterói
  'cesta-chocolates': {
    id: 'cesta-chocolates',
    name: 'Cesta de chocolates',
    category: 'presentes',
    description: 'Presente da mãe da Lilian. Bombom de morango, de coco, trufa... "Sempre tem mais."',
    icon: 'it:cesta-chocolates',
    unique: true,
    talk: [['weng', 'Ainda tem chocolate na cesta da mãe da Lilian?'], ['bella', 'Tem. Mas são meus.'], ['weng', 'Ela falou que era pra dividir!'], ['bella', 'Ela falou "sempre tem mais". Então vai lá pedir mais.']],
  },
  // ---------------------------------------------------------------- Capítulo 7 · Cabo Frio
  'concha-ilha': {
    id: 'concha-ilha',
    name: 'Concha da ilha',
    category: 'lembrancas',
    description: 'Da ilhazinha da Praia do Japonês. A Bella atravessou morrendo de medo e voltou com ela.',
    icon: 'it:concha-ilha',
    unique: true,
    talk: [['weng', 'A concha da ilha! Você atravessou com medo de bicho e ainda pegou concha.'], ['bella', 'Eu tava segurando a sua mão. Aí dava pra tudo.']],
  },
  'baralho-gatinho': {
    id: 'baralho-gatinho',
    name: 'Baralho do Gatinho-Bomba',
    category: 'lembrancas',
    description: 'As cartas da noite de jogo em Cabo Frio. Uma delas ainda tem marca de pizza.',
    icon: 'it:baralho-gatinho',
    unique: true,
    talk: [['bella', 'Revanche de Gatinho-Bomba?'], ['weng', 'Só se você prometer não ficar com o Desarmar escondido de novo.'], ['bella', 'Não prometo nada.']],
  },
  'chinelo-misterioso': {
    id: 'chinelo-misterioso',
    name: 'Chinelo misterioso',
    category: 'especiais',
    description: 'Achado no meio dos 5 km até a Praia do Forte. Até hoje ninguém sabe de quem é.',
    icon: 'it:chinelo-misterioso',
    unique: true,
    talk: [['weng', 'Por que você ainda tem esse chinelo?'], ['bella', 'Um dia o dono aparece. Eu sinto.'], ['weng', 'É um pé só, Bella.']],
  },
};

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  fotografias: 'Fotografias',
  lembrancas: 'Lembranças',
  presentes: 'Presentes',
  flores: 'Flores',
  comidas: 'Comidas',
  especiais: 'Especiais',
  missao: 'Missão',
};
