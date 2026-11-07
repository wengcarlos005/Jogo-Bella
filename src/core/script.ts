import type { Direction } from './types';
import type { Sfx } from '@/systems/AudioSystem';

export type Emote = 'heart' | 'exclaim' | 'question' | 'note' | 'sweat';

/**
 * API disponível para cenas, diálogos e eventos.
 * Scripts são funções async: o texto da história fica legível,
 * e qualquer sequência (cutscene, minigame, escolha) é expressável.
 */
export interface ScriptContext {
  say(speaker: string, text: string): Promise<void>;
  choose(speaker: string | null, text: string, options: string[]): Promise<number>;
  narrate(text: string): Promise<void>;

  flag(key: string): boolean;
  setFlag(key: string, value?: boolean | number | string): void;
  /** Abre o guarda-roupa da Bella com as roupas indicadas; veste a escolhida e devolve o id. */
  wardrobe(outfitIds: string[], region?: import('./types').RegionId): Promise<string>;
  /** Mostra um objeto em destaque no centro da tela (sem dar o item). */
  showItem(icon: string, kicker: string, name: string, description: string): Promise<void>;
  /** Dá um item. Mostra a janela de item no centro (a jogadora fecha). Use com await. */
  give(item: string, qty?: number, silent?: boolean, kicker?: string): Promise<void>;
  has(item: string, qty?: number): boolean;
  take(item: string, qty?: number): boolean;
  count(item: string): number;

  startQuest(id: string): void;
  objective(quest: string, objective: string): void;
  questActive(id: string): boolean;
  objectiveDone(quest: string, objective: string): boolean;
  memory(id: string): Promise<void>;

  wait(ms: number): Promise<void>;
  fadeOut(ms?: number, color?: string): Promise<void>;
  fadeIn(ms?: number): Promise<void>;
  shake(ms?: number): void;
  sfx(name: Sfx): void;
  toast(text: string): void;
  weather(kind: 'clear' | 'rain' | 'sunset' | 'night'): void;

  emote(who: string, emote: Emote): Promise<void>;
  face(who: string, dir: Direction | string): void;
  /** Move um NPC (ou 'player') até o tile indicado. */
  move(who: string, tx: number, ty: number, speed?: number): Promise<void>;
  /** Posiciona instantaneamente um NPC (ou 'player'). */
  place(who: string, tx: number, ty: number, facing?: Direction): void;
  /** Troca a roupa da Bella nesta região (ids em data/outfits.ts). */
  outfit(id: string): void;
  /** Minigame do hambúrguer. */
  burger(opts: import('@/ui/screens/BurgerGame').BurgerOptions): Promise<import('@/ui/screens/BurgerGame').BurgerResult>;
  /** Câmera de cinema: foca no tile (tx, ty) com zoom relativo (1 = normal). */
  uberRide(opts?: { title?: string; destino?: string }): Promise<import('@/ui/screens/UberGame').UberResult>;
  /** A Bella escolhe um item clicando na barra de itens; devolve o id. */
  pickItem(prompt: string): Promise<string>;
  grill(opts?: { title?: string; helper?: string }): Promise<import('@/ui/screens/GrillGame').GrillResult>;
  /** Minigame do beijo escondido no sofá. */
  kissGame(): Promise<import('@/ui/screens/KissGame').KissResult>;
  /** Conversa no celular (transições entre cenas). */
  phone(opts: import('@/ui/screens/PhoneChat').PhoneOptions, msgs: import('@/ui/screens/PhoneChat').PhoneMsg[]): Promise<void>;
  cards(opts?: { title?: string; rounds?: number }): Promise<import('@/ui/screens/CardGame').CardResult>;
  cinema(): Promise<import('@/ui/screens/CinemaGame').CinemaResult>;
  tacos(opts?: { title?: string }): Promise<import('@/ui/screens/TacoGame').TacoResult>;
  acai(opts: import('@/ui/screens/AcaiGame').AcaiOptions): Promise<import('@/ui/screens/AcaiGame').AcaiResult>;
  focus(tx: number, ty: number, zoom?: number, ms?: number): Promise<void>;
  /** Volta a câmera para seguir a Bella. */
  /** Escala de um personagem em relação ao normal (1 = normal). */
  scale(who: string, factor: number): void;
  /** Põe um personagem numa pose de outra folha (ex.: 'meli-poses', 1 = dormindo). null volta ao normal. */
  pose(who: string, key: string | null, frame?: number): void;
  /**
   * Enquadra um grupo de personagens (pés na altura ty) acima da caixa de diálogo,
   * mesmo na borda de baixo do mapa. Desfaz com unfocus().
   */
  frame(tx: number, ty: number, ms?: number): Promise<void>;
  unfocus(ms?: number): Promise<void>;
  letterbox(on: boolean): void;
  /** Explosão de corações sobre um personagem. */
  hearts(who: string, count?: number): void;
  travel(label: string, icon?: string, ms?: number): Promise<void>;
  /** Cartão de capítulo. `recap`: resumo do que aconteceu (fotos + frases que aparecem uma a uma). */
  chapterCard(kicker: string, title: string, sub: string, button?: string, recap?: { title?: string; photos?: string[]; lines: string[] }): Promise<void>;
  unlockRegion(id: import('./types').RegionId): void;
  /** Cria um objeto temporário de cena (ex.: o carro do Uber). Base-centro em (tx*16, ty*16). */
  prop(id: string, key: string, tx: number, ty: number, frame?: number, scale?: number, depth?: number): void;
  moveProp(id: string, tx: number, ty: number, ms: number): Promise<void>;
  removeProp(id: string): void;
  /** Ilustração de fundo em tela cheia; os diálogos continuam por cima. null remove. */
  backdrop(key: string | null, rainy?: boolean): Promise<void>;
  /** Ilustração em tela cheia com legendas (avança com interagir). */
  illustration(key: string, lines: string[]): Promise<void>;
  /**
   * Nervosismo da Bella (0 a 100), mostrado no HUD enquanto > 0.
   * Use para o medidor do primeiro encontro.
   */
  nerves(value: number, message?: string): void;
  /** Guarda-chuva: 'up' aberto, 'hide' abaixado escondendo o rosto, 'off' fechado. */
  umbrella(who: string, mode: 'up' | 'hide' | 'off'): void;
  /**
   * Sentar num banco/sofá: Bella (e o Weng, se estiver junto) sentam lado a lado.
   * Coordenadas em px do cenário ORIGINAL: centro do assento e altura do assento.
   * Resolve quando a jogadora levanta (anda ou aperta interagir).
   */
  sit(seatX: number, seatY: number, lines?: [string, string][], couple?: { key: string; x: number; y: number; /** largura do banco pintado (px da arte original) */ w?: number }): Promise<void>;
  /** Animação do beijo entre a Bella e o Weng (eles precisam estar frente a frente). */
  kiss(): Promise<void>;
  /** Existe arte carregada com essa chave? */
  hasArt(key: string): boolean;
  /** Tile atual da Bella. */
  playerTile(): { x: number; y: number };
  /** Mostra/esconde um personagem (ex.: dentro do carro). */
  visible(who: string, on: boolean): void;
  /** Weng (ou outro NPC) passa a seguir a Bella. */
  follow(who: string, on: boolean): void;
  /** Mostra/esconde NPCs conforme as condições do mapa. */
  /** Quem o jogador controla: 'bella' (normal) ou 'weng' (a Bella passa a acompanhar). */
  lead(who: 'bella' | 'weng'): void;
  refresh(): void;
  teleport(mapId: string, spawn: string): Promise<void>;
  /** id do mapa atual */
  readonly mapId: string;
}

export type Script = (ctx: ScriptContext) => Promise<void>;
