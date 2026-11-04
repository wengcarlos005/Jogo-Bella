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
}

export const ITEMS: Record<string, ItemDef> = {
  'colar-pingente': {
    id: 'colar-pingente',
    name: 'Colar com pingente',
    category: 'especiais',
    description: 'O colar de sempre. Dá sorte em dias importantes.',
    icon: 'icon-colar',
    unique: true,
  },
  'oculos-rosa': {
    id: 'oculos-rosa',
    name: 'Óculos rosados',
    category: 'especiais',
    description: 'Sem eles, nada de enxergar o Weng chegando.',
    icon: 'icon-oculos',
    unique: true,
  },
  'celular': {
    id: 'celular',
    name: 'Celular',
    category: 'missao',
    description: 'Uma mensagem nova do Weng.',
    icon: 'icon-celular',
    unique: true,
  },
  'flor-do-quintal': {
    id: 'flor-do-quintal',
    name: 'Flor do quintal',
    category: 'flores',
    description: 'Uma florzinha colhida no caminho.',
    icon: 'icon-flor',
  },
  'rosa-rosa': {
    id: 'rosa-rosa',
    name: 'Rosa rosa',
    category: 'flores',
    description: 'A rosa que o Weng trouxe quando veio te buscar. A primeira flor de muitas.',
    icon: 'icon-rosa',
    unique: true,
  },
  'vale-beijo': {
    id: 'vale-beijo',
    name: 'Vale Beijo & Vale Abraço',
    category: 'presentes',
    description: 'Feito à mão pra dar pro Weng. Válido por tempo indeterminado.',
    icon: 'icon-vale',
    unique: true,
  },
  chocolates: {
    id: 'chocolates',
    name: 'Chocolates',
    category: 'presentes',
    description: 'Um montão de chocolates pro Weng. Se sobrar algum até a hamburgueria, é milagre.',
    icon: 'icon-chocolate',
    unique: true,
  },
  'burger-rota66': {
    id: 'burger-rota66',
    name: 'Guardanapo da Rota 66',
    category: 'lembrancas',
    description: 'Guardado de recordação do primeiro lanche juntos. Tem uma manchinha de molho.',
    icon: 'icon-guardanapo',
    unique: true,
  },
  'bilhete-misterioso': {
    id: 'bilhete-misterioso',
    name: 'Bilhete dobrado',
    category: 'lembrancas',
    description: '"Siga as lembranças." Quem deixou isso aqui?',
    icon: 'icon-bilhete',
    unique: true,
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
