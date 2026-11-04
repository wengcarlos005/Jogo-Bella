import Phaser from 'phaser';
import { TILE } from '@/config/gameConfig';
import { TILE_DEFS, TILESET_COLUMNS, T } from '@/world/tiles';
import { CHARACTER_LOOKS, type CharacterLook } from './characterLooks';

/**
 * Gera texturas PROVISÓRIAS (pixel art procedural) para qualquer chave
 * que não tenha arquivo real em public/assets. As chaves e dimensões
 * são as mesmas da arte definitiva, então a troca é transparente.
 */

type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** PRNG determinístico — placeholders iguais em todo carregamento. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function speckle(ctx: Ctx, ox: number, oy: number, w: number, h: number, colors: string[], density: number, seed: number): void {
  const r = rng(seed);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (r() < density) px(ctx, colors[Math.floor(r() * colors.length)], ox + x, oy + y);
}

// ---------------------------------------------------------------- TILES

function drawTile(ctx: Ctx, id: number, ox: number, oy: number): void {
  const fill = (c: string) => px(ctx, c, ox, oy, TILE, TILE);
  const s = id * 97 + 13;
  switch (id) {
    case T.EMPTY:
      return;
    case T.GRASS:
      fill('#6dab4a');
      speckle(ctx, ox, oy, 16, 16, ['#5e9a3f', '#7dbb55', '#88c45e'], 0.22, s);
      return;
    case T.GRASS_FLOWERS:
      drawTile(ctx, T.GRASS, ox, oy);
      for (const [x, y, c] of [[3, 4, '#f4f0e6'], [11, 3, '#f27a9b'], [6, 11, '#ffd75e'], [13, 12, '#f27a9b']] as const) {
        px(ctx, c, ox + x, oy + y, 2, 2);
        px(ctx, '#fff6', ox + x, oy + y);
      }
      return;
    case T.GRASS_DARK:
      fill('#4f8a3a');
      speckle(ctx, ox, oy, 16, 16, ['#437a30', '#5c9844', '#3b6e2b'], 0.3, s);
      return;
    case T.DIRT:
      fill('#c79a63');
      speckle(ctx, ox, oy, 16, 16, ['#b98b55', '#d4a972', '#a97c4a'], 0.18, s);
      return;
    case T.SAND:
      fill('#ead7a0');
      speckle(ctx, ox, oy, 16, 16, ['#e0ca8c', '#f3e3b6'], 0.2, s);
      return;
    case T.SIDEWALK:
      fill('#c9bfae');
      px(ctx, '#ada290', ox, oy, 16, 1);
      px(ctx, '#ada290', ox, oy, 1, 16);
      px(ctx, '#ada290', ox, oy + 8, 16, 1);
      px(ctx, '#ada290', ox + 8, oy, 1, 8);
      speckle(ctx, ox, oy, 16, 16, ['#d8cfbf'], 0.08, s);
      return;
    case T.CURB:
      fill('#c9bfae');
      px(ctx, '#e3dccf', ox, oy + 11, 16, 2);
      px(ctx, '#8d8576', ox, oy + 13, 16, 3);
      return;
    case T.ASPHALT:
      fill('#55545e');
      speckle(ctx, ox, oy, 16, 16, ['#4b4a53', '#605f69'], 0.25, s);
      return;
    case T.ASPHALT_LINE:
      drawTile(ctx, T.ASPHALT, ox, oy);
      px(ctx, '#f2d36b', ox + 2, oy + 7, 10, 2);
      return;
    case T.WATER:
      fill('#4f9fc9');
      speckle(ctx, ox, oy, 16, 16, ['#5fb3dd', '#4590b8'], 0.15, s);
      px(ctx, '#a8dcf5', ox + 3, oy + 5, 4, 1);
      px(ctx, '#a8dcf5', ox + 9, oy + 11, 4, 1);
      return;
    case T.WOOD:
      fill('#b9814f');
      for (let i = 0; i < 4; i++) {
        px(ctx, '#a06d40', ox, oy + i * 4 + 3, 16, 1);
        px(ctx, '#a06d40', ox + ((i * 7 + 3) % 16), oy + i * 4, 1, 3);
      }
      speckle(ctx, ox, oy, 16, 16, ['#c58e5b'], 0.08, s);
      return;
    case T.KITCHEN:
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++) px(ctx, (x + y) % 2 ? '#e9e3d6' : '#cfc4b0', ox + x * 8, oy + y * 8, 8, 8);
      return;
    case T.WALL_TOP:
      fill('#3b2f3f');
      px(ctx, '#4a3b4e', ox, oy + 14, 16, 2);
      return;
    case T.WALL_FACE:
      fill('#efd9c0');
      for (let x = 2; x < 16; x += 6) px(ctx, '#e3c8ab', ox + x, oy, 2, 12);
      px(ctx, '#a87a55', ox, oy + 12, 16, 4);
      px(ctx, '#c49268', ox, oy + 12, 16, 1);
      return;
    case T.RUG:
      fill('#c9576a');
      px(ctx, '#e8a24f', ox + 1, oy + 1, 14, 14);
      px(ctx, '#c9576a', ox + 2, oy + 2, 12, 12);
      px(ctx, '#f0c9a0', ox + 6, oy + 6, 4, 4);
      return;
    case T.HEDGE:
      fill('#3f7a35');
      speckle(ctx, ox, oy, 16, 16, ['#4e9442', '#336629', '#5aa64c'], 0.45, s);
      px(ctx, '#2b5823', ox, oy + 14, 16, 2);
      return;
    case T.FENCE:
      drawTile(ctx, T.GRASS, ox, oy);
      px(ctx, '#8a5a33', ox, oy + 5, 16, 2);
      px(ctx, '#8a5a33', ox, oy + 10, 16, 2);
      for (const x of [2, 9]) {
        px(ctx, '#a8703f', ox + x, oy + 2, 3, 12);
        px(ctx, '#6e4526', ox + x + 2, oy + 2, 1, 12);
      }
      return;
    case T.HOUSE_WALL:
    case T.HOUSE_WALL_2:
    case T.SHOP_WALL: {
      const base = id === T.HOUSE_WALL ? '#f3e2c4' : id === T.HOUSE_WALL_2 ? '#cfe3d8' : '#f0d1a8';
      fill(base);
      speckle(ctx, ox, oy, 16, 16, ['#0000000d'], 0.3, s);
      px(ctx, '#00000022', ox, oy + 15, 16, 1);
      return;
    }
    case T.WINDOW:
      drawTile(ctx, T.HOUSE_WALL, ox, oy);
      px(ctx, '#ffffff', ox + 2, oy + 2, 12, 11);
      px(ctx, '#7fc3e0', ox + 3, oy + 3, 10, 9);
      px(ctx, '#ffffff', ox + 7, oy + 3, 2, 9);
      px(ctx, '#bfe6f5', ox + 4, oy + 4, 2, 2);
      px(ctx, '#3d8a8a', ox + 1, oy + 13, 14, 2);
      return;
    case T.DOOR:
      drawTile(ctx, T.HOUSE_WALL, ox, oy);
      px(ctx, '#3e9b97', ox + 2, oy + 1, 12, 15);
      px(ctx, '#2f7a77', ox + 4, oy + 3, 8, 5);
      px(ctx, '#2f7a77', ox + 4, oy + 9, 8, 6);
      px(ctx, '#ffd75e', ox + 11, oy + 9, 1, 2);
      return;
    case T.ROOF:
    case T.ROOF_BLUE: {
      const [a, b] = id === T.ROOF ? ['#d1593f', '#b2462f'] : ['#4e74b5', '#3c5d96'];
      fill(a);
      for (let y = 0; y < 16; y += 4) {
        px(ctx, b, ox, oy + y + 3, 16, 1);
        for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) px(ctx, b, ox + x, oy + y, 1, 3);
      }
      return;
    }
    case T.ROOF_EDGE:
    case T.ROOF_BLUE_EDGE: {
      drawTile(ctx, id === T.ROOF_EDGE ? T.ROOF : T.ROOF_BLUE, ox, oy);
      px(ctx, id === T.ROOF_EDGE ? '#8e3524' : '#2c4672', ox, oy + 12, 16, 4);
      return;
    }
    case T.AWNING:
      for (let x = 0; x < 16; x += 4) px(ctx, x % 8 ? '#f4f0e6' : '#d8433f', ox + x, oy, 4, 13);
      for (let x = 0; x < 16; x += 4) px(ctx, x % 8 ? '#d9d4c9' : '#a8302d', ox + x + 1, oy + 13, 2, 3);
      return;
    case T.STAIRS:
      fill('#b8ab98');
      for (let y = 0; y < 16; y += 4) px(ctx, '#8f8372', ox, oy + y + 3, 16, 1);
      return;
    case T.VOID:
      fill('#1b1838');
      return;
  }
}

// ---------------------------------------------------------------- PERSONAGENS

/** Desenha um frame 32x32 de personagem virado para baixo/cima/esquerda. */
function drawCharFrame(ctx: Ctx, L: CharacterLook, dir: 'down' | 'up' | 'left', frame: number): void {
  const bob = frame % 2 === 1 ? 1 : 0;
  const step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const y0 = bob;
  const outline = '#2a1f2e';

  // sombra
  px(ctx, '#00000040', 10, 29, 12, 2);

  // pernas + sapatos
  const legY = 24 + y0;
  if (dir === 'left') {
    px(ctx, L.pants, 13 + step, legY, 3, 5 - bob);
    px(ctx, L.pants, 16 - step, legY, 3, 5 - bob);
    px(ctx, L.shoes, 12 + step, 28, 4, 2);
    px(ctx, L.shoes, 15 - step, 28, 4, 2);
  } else {
    const lh = 5 - (step > 0 ? 1 : 0) - bob;
    const rh = 5 - (step < 0 ? 1 : 0) - bob;
    px(ctx, L.pants, 12, legY, 4, lh);
    px(ctx, L.pants, 16, legY, 4, rh);
    if (L.wideLegs) {
      px(ctx, L.pants, 11, legY + 2, 1, lh - 2);
      px(ctx, L.pants, 20, legY + 2, 1, rh - 2);
    }
    px(ctx, L.shoes, 12, legY + lh, 4, 2);
    px(ctx, L.shoes, 16, legY + rh, 4, 2);
  }

  // tronco
  const bodyX = dir === 'left' ? 12 : 11;
  const bodyW = dir === 'left' ? 8 : 10;
  px(ctx, L.shirt, bodyX, 17 + y0, bodyW, 8);
  if (L.jacket) {
    if (dir === 'down') {
      px(ctx, L.jacket, 11, 17 + y0, 3, 8);
      px(ctx, L.jacket, 18, 17 + y0, 3, 8);
    } else if (dir === 'up') {
      px(ctx, L.jacket, 11, 17 + y0, 10, 8);
    } else {
      px(ctx, L.jacket, 14, 17 + y0, 6, 8);
    }
  }
  if (L.dress) px(ctx, L.shirt, dir === 'left' ? 11 : 10, 22 + y0, dir === 'left' ? 10 : 12, 4);
  // braços
  const armSwing = step;
  const sleeve = L.jacket ?? L.shirt;
  if (dir === 'left') {
    px(ctx, sleeve, 15 - armSwing, 18 + y0, 3, 5);
    px(ctx, L.skin, 15 - armSwing, 23 + y0, 3, 1);
  } else {
    px(ctx, sleeve, 9, 18 + y0 + (armSwing > 0 ? 1 : 0), 2, 5);
    px(ctx, sleeve, 21, 18 + y0 + (armSwing < 0 ? 1 : 0), 2, 5);
    px(ctx, L.skin, 9, 23 + y0 + (armSwing > 0 ? 1 : 0), 2, 1);
    px(ctx, L.skin, 21, 23 + y0 + (armSwing < 0 ? 1 : 0), 2, 1);
  }
  if (L.necklace && dir === 'down') px(ctx, L.necklace, 15, 18 + y0, 2, 1);

  // cabeça
  const hy = 4 + y0;
  const curly = L.hair === 'curly';
  // cabelo de trás (volume)
  if (curly) {
    px(ctx, L.hairColor, 7, hy + 1, 18, 15);
    px(ctx, L.hairColor, 8, hy, 16, 1);
    speckle(ctx, 7, hy, 18, 16, [L.hairShade], 0.35, 7 + frame);
    for (const [x, y] of [[6, hy + 4], [25, hy + 6], [6, hy + 10], [25, hy + 12], [8, hy + 16], [22, hy + 16]])
      px(ctx, L.hairColor, x, y, 1, 2);
  } else if (L.hair === 'bun') {
    px(ctx, L.hairColor, 9, hy, 14, 9);
    px(ctx, L.hairColor, 13, hy - 3, 6, 4);
  } else {
    px(ctx, L.hairColor, 9, hy, 14, 7);
  }

  if (dir === 'up') {
    px(ctx, L.hairColor, 9, hy + 1, 14, 12);
    if (curly) speckle(ctx, 9, hy + 1, 14, 12, [L.hairShade], 0.35, 11 + frame);
    px(ctx, L.skin, 10, hy + 12, 2, 1);
    px(ctx, L.skin, 20, hy + 12, 2, 1);
    return;
  }

  if (dir === 'down') {
    px(ctx, L.skin, 10, hy + 3, 12, 10);
    px(ctx, L.skin, 11, hy + 13, 10, 1);
    // franja
    px(ctx, L.hairColor, 10, hy + 1, 12, 3);
    if (curly) {
      px(ctx, L.hairColor, 10, hy + 4, 1, 3);
      px(ctx, L.hairColor, 21, hy + 4, 1, 3);
      speckle(ctx, 10, hy + 1, 12, 3, [L.hairShade], 0.4, 3);
    } else {
      px(ctx, L.hairColor, 10, hy + 4, 1, 2);
      px(ctx, L.hairColor, 21, hy + 4, 1, 2);
    }
    // olhos
    px(ctx, outline, 13, hy + 7, 2, 2);
    px(ctx, outline, 17, hy + 7, 2, 2);
    px(ctx, '#ffffff', 13, hy + 7);
    px(ctx, '#ffffff', 17, hy + 7);
    if (L.glasses) {
      ctx.strokeStyle = L.glasses;
      ctx.lineWidth = 1;
      ctx.strokeRect(11.5, hy + 5.5, 4, 4);
      ctx.strokeRect(16.5, hy + 5.5, 4, 4);
      px(ctx, L.glasses, 15, hy + 6, 2, 1);
      px(ctx, L.glasses + '55', 12, hy + 6, 3, 3);
      px(ctx, L.glasses + '55', 17, hy + 6, 3, 3);
    }
    if (L.blush) {
      px(ctx, L.blush, 11, hy + 10, 2, 1);
      px(ctx, L.blush, 19, hy + 10, 2, 1);
    }
    if (L.beard) px(ctx, L.beard, 12, hy + 11, 8, 3);
    px(ctx, '#b0505a', 15, hy + 11, 2, 1);
    return;
  }

  // esquerda (direita = espelho)
  px(ctx, L.skin, 9, hy + 3, 10, 10);
  px(ctx, L.skin, 10, hy + 13, 8, 1);
  px(ctx, L.hairColor, 9, hy + 1, 14, 3);
  px(ctx, L.hairColor, 16, hy + 3, 7, curly ? 10 : 6);
  if (curly) speckle(ctx, 16, hy + 1, 7, 12, [L.hairShade], 0.4, 5);
  px(ctx, L.skin, 17, hy + 7, 2, 3); // orelha
  px(ctx, outline, 11, hy + 7, 2, 2);
  px(ctx, '#ffffff', 11, hy + 7);
  if (L.glasses) {
    ctx.strokeStyle = L.glasses;
    ctx.strokeRect(9.5, hy + 5.5, 4, 4);
    px(ctx, L.glasses, 13, hy + 6, 4, 1);
    px(ctx, L.glasses + '55', 10, hy + 6, 3, 3);
  }
  if (L.blush) px(ctx, L.blush, 10, hy + 10, 2, 1);
  if (L.beard) px(ctx, L.beard, 9, hy + 11, 7, 3);
}

// ---------------------------------------------------------------- PROPS

type PropDraw = (ctx: Ctx, w: number, h: number) => void;

const PROPS: Record<string, { w: number; h: number; draw: PropDraw }> = {
  'prop-tree': {
    w: 32, h: 48,
    draw: (c) => {
      px(c, '#00000033', 6, 42, 20, 5);
      px(c, '#7a4e2c', 13, 28, 6, 16);
      px(c, '#5e3a20', 17, 28, 2, 16);
      for (const [x, y, w, h, col] of [
        [4, 8, 24, 20, '#3f7a35'], [2, 12, 28, 14, '#3f7a35'], [7, 3, 18, 8, '#4e9442'],
        [6, 6, 16, 12, '#5aa64c'], [9, 4, 8, 5, '#6fbf5b'],
      ] as const) px(c, col, x, y, w, h);
      speckle(c, 2, 3, 28, 26, ['#336629', '#6fbf5b'], 0.12, 77);
    },
  },
  'prop-bush': {
    w: 16, h: 16,
    draw: (c) => {
      px(c, '#00000033', 2, 12, 12, 3);
      px(c, '#3f7a35', 1, 4, 14, 10);
      px(c, '#5aa64c', 3, 2, 10, 8);
      px(c, '#f27a9b', 5, 5, 2, 2);
      px(c, '#f27a9b', 10, 8, 2, 2);
    },
  },
  'prop-flowerpot': {
    w: 16, h: 16,
    draw: (c) => {
      px(c, '#b5643c', 4, 9, 8, 6);
      px(c, '#8e4a2a', 4, 9, 8, 1);
      px(c, '#4e9442', 5, 4, 6, 5);
      px(c, '#ffd75e', 6, 3, 2, 2);
      px(c, '#f27a9b', 9, 5, 2, 2);
    },
  },
  'prop-flower-pick': {
    w: 16, h: 16,
    draw: (c) => {
      px(c, '#3f7a35', 7, 8, 2, 6);
      px(c, '#3f7a35', 9, 10, 2, 1);
      px(c, '#f27a9b', 5, 4, 6, 4);
      px(c, '#ffd75e', 7, 5, 2, 2);
    },
  },
  'prop-bed': {
    w: 32, h: 32,
    draw: (c) => {
      px(c, '#7a4e2c', 2, 2, 28, 28);
      px(c, '#f4f0e6', 4, 4, 24, 8);
      px(c, '#e2d6c1', 4, 11, 24, 1);
      px(c, '#c9576a', 4, 12, 24, 16);
      px(c, '#e17a8b', 4, 12, 24, 2);
      px(c, '#f4f0e6', 8, 5, 7, 5);
      px(c, '#f4f0e6', 17, 5, 7, 5);
    },
  },
  'prop-wardrobe': {
    w: 32, h: 32,
    draw: (c) => {
      px(c, '#6e4526', 2, 0, 28, 31);
      px(c, '#8a5a33', 3, 1, 12, 28);
      px(c, '#8a5a33', 17, 1, 12, 28);
      px(c, '#ffd75e', 13, 14, 1, 3);
      px(c, '#ffd75e', 18, 14, 1, 3);
      px(c, '#00000040', 2, 30, 28, 2);
    },
  },
  'prop-mirror': {
    w: 16, h: 32,
    draw: (c) => {
      px(c, '#c9a14a', 2, 2, 12, 26);
      px(c, '#bfe6f5', 4, 4, 8, 22);
      px(c, '#ffffff', 5, 6, 2, 6);
      px(c, '#7a4e2c', 3, 28, 10, 3);
    },
  },
  'prop-vanity': {
    w: 24, h: 24,
    draw: (c) => {
      px(c, '#f4f0e6', 1, 8, 22, 14);
      px(c, '#e2d6c1', 1, 8, 22, 2);
      px(c, '#c9a14a', 11, 14, 2, 2);
      px(c, '#f27a9b', 4, 5, 3, 3);
      px(c, '#b8a4d8', 15, 4, 3, 4);
    },
  },
  'prop-desk': {
    w: 32, h: 24,
    draw: (c) => {
      px(c, '#8a5a33', 1, 6, 30, 6);
      px(c, '#6e4526', 2, 12, 3, 10);
      px(c, '#6e4526', 27, 12, 3, 10);
      px(c, '#f4f0e6', 5, 2, 8, 5);
      px(c, '#7fc3e0', 20, 3, 6, 3);
    },
  },
  'prop-sofa': {
    w: 48, h: 24,
    draw: (c) => {
      px(c, '#4e74b5', 2, 2, 44, 10);
      px(c, '#3c5d96', 0, 6, 4, 16);
      px(c, '#3c5d96', 44, 6, 4, 16);
      px(c, '#6a8fcc', 4, 11, 40, 9);
      px(c, '#3c5d96', 24, 11, 1, 9);
      px(c, '#00000040', 1, 21, 46, 2);
    },
  },
  'prop-tv': {
    w: 32, h: 24,
    draw: (c) => {
      px(c, '#6e4526', 1, 14, 30, 9);
      px(c, '#2a1f2e', 4, 1, 24, 14);
      px(c, '#3d5a80', 6, 3, 20, 10);
      px(c, '#7fc3e0', 7, 4, 6, 2);
    },
  },
  'prop-table': {
    w: 32, h: 24,
    draw: (c) => {
      px(c, '#a06d40', 1, 4, 30, 12);
      px(c, '#b9814f', 1, 4, 30, 2);
      px(c, '#6e4526', 3, 16, 3, 7);
      px(c, '#6e4526', 26, 16, 3, 7);
      px(c, '#f4f0e6', 12, 7, 8, 5);
      px(c, '#c9576a', 14, 8, 4, 3);
    },
  },
  'prop-fridge': {
    w: 16, h: 32,
    draw: (c) => {
      px(c, '#e9e3d6', 1, 0, 14, 31);
      px(c, '#cfc4b0', 1, 11, 14, 1);
      px(c, '#9a9183', 12, 4, 1, 5);
      px(c, '#9a9183', 12, 14, 1, 7);
      px(c, '#f27a9b', 4, 3, 3, 3);
    },
  },
  'prop-stove': {
    w: 16, h: 24,
    draw: (c) => {
      px(c, '#d8d2c6', 1, 4, 14, 19);
      px(c, '#2a1f2e', 3, 6, 4, 3);
      px(c, '#2a1f2e', 9, 6, 4, 3);
      px(c, '#55545e', 3, 12, 10, 8);
    },
  },
  'prop-plant': {
    w: 16, h: 24,
    draw: (c) => {
      px(c, '#b5643c', 4, 16, 8, 7);
      px(c, '#3f7a35', 2, 4, 12, 12);
      px(c, '#5aa64c', 4, 2, 8, 8);
      px(c, '#6fbf5b', 6, 1, 3, 3);
    },
  },
  'prop-bookshelf': {
    w: 32, h: 32,
    draw: (c) => {
      px(c, '#6e4526', 1, 0, 30, 31);
      for (let row = 0; row < 3; row++) {
        px(c, '#4a2e18', 3, 2 + row * 10, 26, 8);
        const r = rng(row + 3);
        for (let x = 4; x < 28; x += 3) px(c, ['#c9576a', '#4e74b5', '#ffd75e', '#5aa64c', '#f4f0e6'][Math.floor(r() * 5)], x, 3 + row * 10 + Math.floor(r() * 2), 2, 7);
      }
    },
  },
  'prop-lamp-post': {
    w: 16, h: 48,
    draw: (c) => {
      px(c, '#00000033', 4, 44, 8, 3);
      px(c, '#3b3a44', 7, 10, 2, 35);
      px(c, '#3b3a44', 5, 43, 6, 3);
      px(c, '#3b3a44', 4, 4, 8, 7);
      px(c, '#ffe9a3', 5, 5, 6, 5);
      px(c, '#3b3a44', 6, 2, 4, 2);
    },
  },
  'prop-bench': {
    w: 32, h: 16,
    draw: (c) => {
      px(c, '#00000033', 2, 13, 28, 3);
      px(c, '#8a5a33', 1, 1, 30, 4);
      px(c, '#a8703f', 1, 6, 30, 4);
      px(c, '#3b3a44', 3, 10, 2, 5);
      px(c, '#3b3a44', 27, 10, 2, 5);
      px(c, '#f27a9b', 15, 2, 2, 2);
    },
  },
  'prop-mailbox': {
    w: 16, h: 24,
    draw: (c) => {
      px(c, '#6e4526', 7, 10, 2, 13);
      px(c, '#d8433f', 3, 3, 10, 8);
      px(c, '#a8302d', 3, 9, 10, 2);
      px(c, '#ffd75e', 12, 1, 1, 4);
    },
  },
  'prop-sign': {
    w: 16, h: 24,
    draw: (c) => {
      px(c, '#6e4526', 7, 10, 2, 13);
      px(c, '#a8703f', 1, 3, 14, 8);
      px(c, '#6e4526', 1, 3, 14, 1);
      px(c, '#2a1f2e', 4, 6, 8, 1);
      px(c, '#2a1f2e', 9, 5, 2, 3);
    },
  },
  'prop-car': {
    w: 48, h: 32,
    draw: (c) => {
      px(c, '#00000040', 3, 27, 42, 4);
      px(c, '#c9576a', 2, 12, 44, 14);
      px(c, '#e17a8b', 10, 4, 28, 10);
      px(c, '#7fc3e0', 13, 6, 10, 7);
      px(c, '#7fc3e0', 25, 6, 10, 7);
      px(c, '#2a1f2e', 7, 24, 8, 6);
      px(c, '#2a1f2e', 33, 24, 8, 6);
      px(c, '#ffe9a3', 43, 15, 3, 3);
    },
  },
  'prop-burger-sign': {
    w: 64, h: 16,
    draw: (c) => {
      px(c, '#2a1f2e', 0, 0, 64, 16);
      px(c, '#ffd75e', 1, 1, 62, 14);
      px(c, '#d8433f', 2, 2, 60, 12);
      px(c, '#e8a24f', 5, 4, 10, 3);
      px(c, '#6e4526', 5, 7, 10, 2);
      px(c, '#e8a24f', 5, 9, 10, 3);
      for (let i = 0; i < 6; i++) px(c, '#f4f0e6', 20 + i * 7, 6, 5, 4);
    },
  },
  'prop-sparkle': {
    w: 16, h: 16,
    draw: (c) => {
      px(c, '#ffd75e', 7, 3, 2, 10);
      px(c, '#ffd75e', 3, 7, 10, 2);
      px(c, '#ffffff', 7, 7, 2, 2);
    },
  },
  'prop-door-mat': {
    w: 16, h: 16,
    draw: (c) => {
      px(c, '#8a5a33', 1, 5, 14, 8);
      px(c, '#a8703f', 2, 6, 12, 6);
    },
  },
};

// ---------------------------------------------------------------- ÍCONES

const ICONS: Record<string, PropDraw> = {
  'icon-colar': (c) => {
    c.strokeStyle = '#c9a14a';
    c.beginPath();
    c.arc(8, 6, 5, 0.2, Math.PI - 0.2);
    c.stroke();
    px(c, '#f27a9b', 7, 10, 3, 3);
  },
  'icon-oculos': (c) => {
    c.strokeStyle = '#f27a9b';
    c.strokeRect(1.5, 5.5, 5, 5);
    c.strokeRect(9.5, 5.5, 5, 5);
    px(c, '#f27a9b', 7, 7, 2, 1);
    px(c, '#f27a9b55', 2, 6, 4, 4);
    px(c, '#f27a9b55', 10, 6, 4, 4);
  },
  'icon-celular': (c) => {
    px(c, '#2a1f2e', 4, 1, 8, 14);
    px(c, '#7fc3e0', 5, 3, 6, 9);
    px(c, '#f27a9b', 6, 5, 4, 3);
  },
  'icon-flor': (c) => PROPS['prop-flower-pick'].draw(c, 16, 16),
  'icon-rosa': (c) => {
    px(c, '#3f7a35', 7, 7, 2, 8);
    px(c, '#4e9442', 4, 9, 3, 2);
    px(c, '#f27a9b', 4, 2, 8, 6);
    px(c, '#e0476b', 6, 3, 4, 3);
    px(c, '#ffc2d4', 5, 2, 2, 1);
  },
  'icon-vale': (c) => {
    px(c, '#f4f0e6', 1, 3, 14, 10);
    px(c, '#c9a14a', 1, 3, 14, 1);
    px(c, '#e0476b', 4, 6, 2, 1); px(c, '#e0476b', 7, 6, 2, 1);
    px(c, '#e0476b', 3, 7, 7, 2); px(c, '#e0476b', 5, 9, 3, 1);
    px(c, '#b0505a', 11, 6, 3, 1); px(c, '#b0505a', 11, 8, 3, 1);
  },
  'icon-chocolate': (c) => {
    px(c, '#6e4526', 2, 3, 12, 10);
    px(c, '#8a5a33', 3, 4, 4, 3); px(c, '#8a5a33', 9, 4, 4, 3);
    px(c, '#8a5a33', 3, 9, 4, 3); px(c, '#8a5a33', 9, 9, 4, 3);
    px(c, '#e0476b', 7, 2, 2, 12);
  },
  'icon-bilhete': (c) => {
    px(c, '#f4f0e6', 2, 3, 12, 10);
    px(c, '#c9a14a', 2, 3, 12, 1);
    px(c, '#d8433f', 7, 7, 2, 2);
  },
};

// ---------------------------------------------------------------- FACTORY

export class PlaceholderFactory {
  constructor(private scene: Phaser.Scene) {}

  private canvas(key: string, w: number, h: number): { tex: Phaser.Textures.CanvasTexture; ctx: Ctx } | null {
    if (this.scene.textures.exists(key)) return null;
    const tex = this.scene.textures.createCanvas(key, w, h);
    if (!tex) return null;
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    return { tex, ctx };
  }

  generateAll(): void {
    this.tileset();
    for (const key of Object.keys(CHARACTER_LOOKS)) this.character(key);
    for (const [key, p] of Object.entries(PROPS)) this.prop(key, p.w, p.h, p.draw);
    for (const [key, d] of Object.entries(ICONS)) this.prop(key, 16, 16, d);
    for (const key of Object.keys(CHARACTER_LOOKS)) this.portrait(key);
    this.fx();
  }

  tileset(): void {
    const rows = Math.ceil(TILE_DEFS.length / TILESET_COLUMNS);
    const c = this.canvas('tiles-base', TILESET_COLUMNS * TILE, rows * TILE);
    if (!c) return;
    TILE_DEFS.forEach((_, i) => drawTile(c.ctx, i, (i % TILESET_COLUMNS) * TILE, Math.floor(i / TILESET_COLUMNS) * TILE));
    c.tex.refresh();
  }

  /** Spritesheet 128x128: 4 frames por linha; linhas = baixo, esquerda, direita, cima. */
  character(key: string): void {
    const look = CHARACTER_LOOKS[key];
    const c = this.canvas(key, 128, 128);
    if (!c) return;
    const tmp = document.createElement('canvas');
    tmp.width = 32;
    tmp.height = 32;
    const t = tmp.getContext('2d')!;
    const rows: ('down' | 'left' | 'right' | 'up')[] = ['down', 'left', 'right', 'up'];
    rows.forEach((dir, row) => {
      for (let f = 0; f < 4; f++) {
        t.clearRect(0, 0, 32, 32);
        drawCharFrame(t, look, dir === 'right' ? 'left' : dir, f);
        c.ctx.save();
        if (dir === 'right') {
          c.ctx.translate(f * 32 + 32, row * 32);
          c.ctx.scale(-1, 1);
          c.ctx.drawImage(tmp, 0, 0);
        } else {
          c.ctx.drawImage(tmp, f * 32, row * 32);
        }
        c.ctx.restore();
        c.tex.add(row * 4 + f, 0, f * 32, row * 32, 32, 32);
      }
    });
    c.tex.refresh();
  }

  portrait(charKey: string): void {
    const key = `portrait-${charKey}`;
    const look = CHARACTER_LOOKS[charKey];
    const c = this.canvas(key, 96, 96);
    if (!c) return;
    const tmp = document.createElement('canvas');
    tmp.width = 32;
    tmp.height = 32;
    const t = tmp.getContext('2d')!;
    drawCharFrame(t, look, 'down', 0);
    c.ctx.fillStyle = look.portraitBg;
    c.ctx.fillRect(0, 0, 96, 96);
    c.ctx.drawImage(tmp, 4, 0, 24, 24, 0, 6, 96, 96);
    c.tex.refresh();
  }

  prop(key: string, w: number, h: number, draw: PropDraw): void {
    const c = this.canvas(key, w, h);
    if (!c) return;
    draw(c.ctx, w, h);
    c.tex.refresh();
  }

  fx(): void {
    this.prop('fx-rain', 2, 8, (c) => {
      px(c, '#bfe6f5aa', 1, 0, 1, 6);
      px(c, '#ffffffcc', 0, 6, 1, 2);
    });
    this.prop('fx-spark', 3, 3, (c) => {
      px(c, '#ffffff', 1, 0, 1, 3);
      px(c, '#ffffff', 0, 1, 3, 1);
    });
    this.prop('fx-heart', 7, 6, (c) => {
      px(c, '#f27a9b', 1, 0, 2, 1);
      px(c, '#f27a9b', 4, 0, 2, 1);
      px(c, '#f27a9b', 0, 1, 7, 2);
      px(c, '#f27a9b', 1, 3, 5, 1);
      px(c, '#f27a9b', 2, 4, 3, 1);
      px(c, '#f27a9b', 3, 5, 1, 1);
      px(c, '#ffffff', 1, 1, 1, 1);
    });
    this.prop('fx-marker', 7, 5, (c) => {
      px(c, '#f27a9b', 0, 0, 7, 1);
      px(c, '#f27a9b', 1, 1, 5, 1);
      px(c, '#f27a9b', 2, 2, 3, 1);
      px(c, '#f27a9b', 3, 3, 1, 1);
    });
    this.prop('fx-shadow', 14, 4, (c) => px(c, '#00000040', 0, 0, 14, 4));

    // Guarda-chuvas provisórios (28x18): Bella rosa, Weng azul-marinho
    const umbrella = (main: string, dark: string, light: string): PropDraw => (c) => {
      for (let y = 0; y < 11; y++) {
        const half = Math.round(Math.sqrt(Math.max(0, 1 - ((10 - y) / 10.5) ** 2)) * 13);
        px(c, y < 2 ? light : main, 14 - half, y, half * 2, 1);
      }
      for (const x of [3, 9, 14, 19, 25]) px(c, dark, x, 9, 1, 2);
      px(c, dark, 1, 10, 26, 1);
      px(c, light, 9, 2, 3, 2);
      px(c, '#2a1f2e', 14, 0, 1, 1);
    };
    // só a cobertura (o cabo é desenhado à parte, atrás do personagem)
    this.prop('umbrella-bella', 28, 11, umbrella('#f27a9b', '#b8456a', '#ffc2d4'));
    this.prop('umbrella-weng', 28, 11, umbrella('#2c3a6b', '#1b2447', '#5a6fae'));
    this.prop('umbrella-shaft', 1, 16, (c) => px(c, '#4a3a34', 0, 0, 1, 16));

    // Porta-guarda-chuvas (HD 32x64, exibido em 0,5) com guarda-chuva escuro da mãe
    this.prop('prop-umbrella-stand', 32, 64, (c) => {
      // guarda-chuva da mãe (fechado, roxo escuro)
      px(c, '#2a1f2e', 17, 2, 6, 3); px(c, '#4a3a34', 19, 0, 2, 3);
      for (let y = 5; y < 40; y++) { const w = Math.max(2, Math.round(7 - (y - 5) * 0.12)); px(c, '#2a1f2e', 20 - Math.ceil(w / 2) - 1, y, w + 2, 1); px(c, '#5b3f7a', 20 - Math.ceil(w / 2), y, w, 1); }
      px(c, '#7d5fa3', 19, 8, 1, 26);
      // balde de cerâmica
      px(c, '#3a2420', 3, 34, 26, 30);
      px(c, '#b5643c', 5, 36, 22, 26);
      px(c, '#d17f4f', 5, 36, 22, 4);
      px(c, '#8e4a2a', 5, 58, 22, 4);
      px(c, '#f2c08a', 7, 44, 18, 2);
      px(c, '#f2c08a', 7, 50, 18, 2);
      px(c, '#00000040', 2, 62, 28, 2);
    });
    // Guarda-chuva rosa da Bella, fechado e encostado (HD 20x60)
    this.prop('prop-umbrella-closed', 20, 60, (c) => {
      px(c, '#4a3a34', 9, 0, 2, 4); px(c, '#4a3a34', 6, 50, 2, 8); px(c, '#4a3a34', 4, 56, 4, 2);
      for (let y = 4; y < 50; y++) {
        const w = Math.max(2, Math.round(9 - (y - 4) * 0.15));
        const x0 = 10 - Math.ceil(w / 2) - Math.round((y - 4) * 0.06);
        px(c, '#7a2b3d', x0 - 1, y, w + 2, 1);
        px(c, y % 9 < 2 ? '#d85d84' : '#f27a9b', x0, y, w, 1);
      }
      px(c, '#ffc2d4', 9, 8, 1, 30);
      px(c, '#ffd75e', 7, 24, 6, 2);
    });

    // Balões de emoção 13x13
    const bubble = (c: Ctx) => {
      px(c, '#2a1f2e', 1, 0, 11, 11);
      px(c, '#2a1f2e', 0, 1, 13, 9);
      px(c, '#ffffff', 1, 1, 11, 9);
      px(c, '#2a1f2e', 4, 11, 3, 1);
      px(c, '#2a1f2e', 5, 12, 1, 1);
      px(c, '#ffffff', 5, 10, 1, 1);
    };
    const emotes: Record<string, PropDraw> = {
      'emote-heart': (c) => {
        bubble(c);
        px(c, '#e0476b', 3, 3, 2, 1); px(c, '#e0476b', 7, 3, 2, 1);
        px(c, '#e0476b', 2, 4, 9, 2); px(c, '#e0476b', 3, 6, 7, 1);
        px(c, '#e0476b', 4, 7, 5, 1); px(c, '#e0476b', 5, 8, 3, 1);
      },
      'emote-exclaim': (c) => {
        bubble(c);
        px(c, '#d8433f', 5, 2, 3, 5); px(c, '#d8433f', 5, 8, 3, 1);
      },
      'emote-question': (c) => {
        bubble(c);
        px(c, '#4e74b5', 4, 2, 5, 1); px(c, '#4e74b5', 8, 3, 1, 2);
        px(c, '#4e74b5', 6, 5, 2, 1); px(c, '#4e74b5', 6, 6, 1, 1); px(c, '#4e74b5', 6, 8, 1, 1);
      },
      'emote-note': (c) => {
        bubble(c);
        px(c, '#2a1f2e', 7, 2, 1, 6); px(c, '#2a1f2e', 8, 2, 2, 1); px(c, '#2a1f2e', 9, 3, 1, 1);
        px(c, '#2a1f2e', 5, 7, 3, 2);
      },
      'emote-sweat': (c) => {
        bubble(c);
        px(c, '#4f9fc9', 6, 2, 1, 1); px(c, '#4f9fc9', 5, 3, 3, 2); px(c, '#4f9fc9', 4, 5, 5, 3);
        px(c, '#bfe6f5', 5, 5, 1, 1);
      },
    };
    for (const [k, d] of Object.entries(emotes)) this.prop(k, 13, 13, d);

    // Ilustrações provisórias das memórias (160x100)
    for (const id of ['memory-pia-01', 'memory-pia-02', 'memory-pia-03']) {
      this.prop(id, 160, 100, (c) => {
        const g = c.createLinearGradient(0, 0, 160, 100);
        g.addColorStop(0, '#f6d9e0');
        g.addColorStop(1, '#b8a4d8');
        c.fillStyle = g;
        c.fillRect(0, 0, 160, 100);
        speckle(c, 0, 0, 160, 100, ['#ffffff55'], 0.02, id.length);
        const hx = 74, hy = 40;
        for (const [x, y, w, hh] of [[2, 0, 4, 2], [8, 0, 4, 2], [0, 2, 14, 4], [2, 6, 10, 2], [4, 8, 6, 2], [6, 10, 2, 2]])
          px(c, '#f27a9b', hx + x, hy + y, w, hh);
      });
    }
  }
}

export const PROP_SIZES: Record<string, { w: number; h: number }> = Object.fromEntries(
  Object.entries(PROPS).map(([k, v]) => [k, { w: v.w, h: v.h }]),
);
