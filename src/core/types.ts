export type Direction = 'down' | 'left' | 'right' | 'up';

export type RegionId =
  | 'piabeta'
  | 'duque-de-caxias'
  | 'petropolis'
  | 'araruama'
  | 'rio-das-ostras'
  | 'niteroi'
  | 'lapa'
  | 'cabo-frio'
  | 'botafogo'
  | 'seropedica'
  | 'curitiba';

export type ItemCategory =
  | 'fotografias'
  | 'lembrancas'
  | 'presentes'
  | 'flores'
  | 'comidas'
  | 'especiais'
  | 'missao';

export type FlagValue = boolean | number | string;

export interface Vec2 {
  x: number;
  y: number;
}

export type QuestStatus = 'active' | 'done';

export interface QuestProgress {
  status: QuestStatus;
  done: string[];
}

export interface Settings {
  musicVolume: number;
  sfxVolume: number;
  textSpeed: 'lenta' | 'normal' | 'rapida';
  touchControls: 'auto' | 'sempre' | 'nunca';
}

export interface SaveData {
  version: string;
  savedAt: number;
  playtimeMs: number;
  mapId: string;
  position: Vec2;
  facing: Direction;
  flags: Record<string, FlagValue>;
  quests: Record<string, QuestProgress>;
  trackedQuest: string | null;
  inventory: Record<string, number>;
  memories: string[];
  regionsUnlocked: RegionId[];
  regionsVisited: RegionId[];
  outfits: { bella: string; weng: string };
  outfitsUnlocked: string[];
  houseDecor: Record<string, string>;
}
