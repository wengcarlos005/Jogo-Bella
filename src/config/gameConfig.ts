/** Constantes globais do jogo. Ajuste aqui, não espalhe números mágicos. */
/** Área visível do mundo (em px lógicos). Toda a lógica usa esta escala. */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
/**
 * O canvas é desenhado em resolução dobrada (960x540) com zoom 2 na câmera.
 * Arte "HD" (personagens e cenários do ChatGPT) é carregada com o dobro de
 * pixels e exibida em escala 0,5 — mantém o detalhe original da arte.
 */
export const RENDER_SCALE = 2;
export const TILE = 16;

export const PLAYER = {
  walkSpeed: 70,
  runSpeed: 120,
  /** Corpo de colisão (nos pés). Posição calculada pelo tamanho do quadro. */
  body: { width: 10, height: 6 },
  interactRange: 18,
};

export const CHAR_FRAME = { width: 32, height: 32 };

export const CAMERA = { lerp: 0.14 };

export const AUTOSAVE_INTERVAL_MS = 60_000;

export const SAVE_SLOTS = 3;

export const VERSION = '0.2.0';

export const GAME_TITLE = 'A Lua está Bella';
