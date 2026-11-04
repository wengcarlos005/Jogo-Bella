/** Constantes globais do jogo. Ajuste aqui, não espalhe números mágicos. */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE = 16;

export const PLAYER = {
  walkSpeed: 70,
  runSpeed: 120,
  /** Corpo de colisão (nos pés), relativo ao frame 32x32. */
  body: { width: 10, height: 6, offsetX: 11, offsetY: 25 },
  interactRange: 18,
};

export const CHAR_FRAME = { width: 32, height: 32 };

export const CAMERA = { lerp: 0.14 };

export const AUTOSAVE_INTERVAL_MS = 60_000;

export const SAVE_SLOTS = 3;

export const VERSION = '0.2.0';
