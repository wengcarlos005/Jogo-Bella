import Phaser from 'phaser';
import { RENDER_SCALE, TILE } from '@/config/gameConfig';
import { mapLayerKey } from '@/config/assetManifest';
import { TILE_DEFS } from './tiles';
import type { MapDef, PropPlacement } from './MapTypes';

export interface BuiltProp {
  def: PropPlacement;
  sprite: Phaser.GameObjects.Image;
  block: Phaser.GameObjects.Zone | null;
}

export interface BuiltMap {
  widthPx: number;
  heightPx: number;
  collision: Phaser.Tilemaps.TilemapLayer;
  solids: Phaser.Physics.Arcade.StaticGroup;
  props: BuiltProp[];
  hasArt: boolean;
  overlays: BuiltOverlay[];
}

export interface BuiltOverlay {
  img: Phaser.GameObjects.Image;
  rect: Phaser.Geom.Rectangle;
  base: number;
  /** Fica translúcido quando alguém passa atrás (copas grandes). */
  fade: boolean;
  when?: () => boolean;
}

function parseLayer(def: MapDef, rows: string[], label: string): number[][] {
  const width = def.ground[0].length;
  return rows.map((row, y) => {
    if (row.length !== width) throw new Error(`[${def.id}] camada ${label}, linha ${y}: largura ${row.length} ≠ ${width}`);
    return [...row].map((ch, x) => {
      if (ch === ' ') return -1;
      const idx = def.legend[ch];
      if (idx === undefined) throw new Error(`[${def.id}] caractere desconhecido '${ch}' em (${x},${y})`);
      return idx;
    });
  });
}

/**
 * Constrói um mapa a partir de MapDef:
 *  - camadas de tiles (visuais + colisão);
 *  - se existir cenário pintado (maps/<id>-bg.png), ele substitui os tiles
 *    visualmente e a grade de tiles vira só colisão;
 *  - objetos (props) com profundidade por Y e colisão na base.
 */
export function buildMap(scene: Phaser.Scene, def: MapDef): BuiltMap {
  const ground = parseLayer(def, def.ground, 'ground');
  const height = ground.length;
  const width = ground[0].length;

  const map = scene.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width, height });
  const tileset = map.addTilesetImage('tiles-base', 'tiles-base', TILE, TILE, 0, 0)!;
  const groundLayer = map.createBlankLayer('ground', tileset)!;
  groundLayer.putTilesAt(ground, 0, 0);
  groundLayer.setDepth(-10);

  if (def.detail) {
    const detail = parseLayer(def, def.detail, 'detail');
    const detailLayer = map.createBlankLayer('detail', tileset)!;
    detailLayer.putTilesAt(detail, 0, 0);
    detailLayer.setDepth(-9);
  }

  const solidIdx = TILE_DEFS.map((t, i) => (t.solid ? i : -1)).filter((i) => i >= 0);
  groundLayer.setCollision(solidIdx);

  const bgKey = mapLayerKey(def.id, 'bg');
  const fgKey = mapLayerKey(def.id, 'fg');
  const placeArt = (img: Phaser.GameObjects.Image) => {
    if (def.art === 'native') img.setScale(1 / RENDER_SCALE);
    else img.setDisplaySize(width * TILE, height * TILE);
  };
  const hasArt = scene.textures.exists(bgKey);
  let artW = width * TILE;
  let artH = height * TILE;
  if (hasArt) {
    const bg = scene.add.image(0, 0, bgKey).setOrigin(0).setDepth(-8);
    placeArt(bg);
    groundLayer.setAlpha(0);
    // A área jogável/visível termina onde o desenho termina (sem faixas vazias).
    artW = Math.min(artW, Math.floor(bg.displayWidth));
    artH = Math.min(artH, Math.floor(bg.displayHeight));
  }
  if (scene.textures.exists(fgKey)) {
    placeArt(scene.add.image(0, 0, fgKey).setOrigin(0).setDepth(100_000));
  }

  const solids = scene.physics.add.staticGroup();
  const props: BuiltProp[] = (def.props ?? []).map((p) => {
    const x = p.tx * TILE;
    const bottom = (p.ty + 1) * TILE;
    const sprite = scene.add.image(x, bottom, p.key).setOrigin(0, 1).setScale(p.scale ?? 1);
    sprite.setDepth(p.flat ? -5 : bottom);
    let block: Phaser.GameObjects.Zone | null = null;
    if (p.block !== false && !p.flat) {
      const [ox, oy, w, h] = p.block ?? [1, Math.max(0, sprite.displayHeight - Math.min(12, sprite.displayHeight * 0.5)), sprite.displayWidth - 2, Math.min(12, sprite.displayHeight * 0.5)];
      block = scene.add.zone(x + ox + w / 2, bottom - sprite.displayHeight + oy + h / 2, w, h);
      solids.add(block);
    }
    return { def: p, sprite, block };
  });

  const overlays: BuiltOverlay[] = [];
  // Profundidade: recortes do cenário na frente de quem está "atrás" deles.
  if (hasArt && def.art === 'native') {
    // O cenário em public/ tem 2/3 da resolução do original (art-source).
    const toTex = (v: number) => (v * 2) / 3;
    const src = scene.textures.get(bgKey).getSourceImage() as HTMLImageElement;
    (def.overlays ?? []).forEach((o, idx) => {
      const cx = Math.max(0, Math.round(toTex(o.x0)));
      const cy = Math.max(0, Math.round(toTex(o.y0)));
      const cw = Math.min(src.width - cx, Math.round(toTex(o.x1 - o.x0)));
      const ch = Math.min(src.height - cy, Math.round(toTex(o.y1 - o.y0)));
      if (cw <= 0 || ch <= 0) return;
      const key = `ov-${def.id}-${idx}`;
      if (!scene.textures.exists(key)) {
        const tex = scene.textures.createCanvas(key, cw, ch)!;
        const ctx = tex.getContext();
        ctx.drawImage(src, cx, cy, cw, ch, 0, 0, cw, ch);
        const data = ctx.getImageData(0, 0, cw, ch);
        const d = data.data;
        // 'column' (postes): em cada linha, mantém só o trecho entre o contorno escuro da esquerda e o da direita
        let colL: Int16Array | null = null;
        let colR: Int16Array | null = null;
        if (o.cut === 'column') {
          colL = new Int16Array(ch).fill(-1);
          colR = new Int16Array(ch).fill(-1);
          const dark = (x: number, y: number) => {
            const q = (y * cw + x) * 4;
            return Math.max(d[q], d[q + 1], d[q + 2]) < 80;
          };
          for (let y = 0; y < ch; y++) {
            let l = -1;
            let r = -1;
            for (let x = 0; x < cw; x++) if (dark(x, y)) { l = x; break; }
            for (let x = cw - 1; x >= 0; x--) if (dark(x, y)) { r = x; break; }
            if (l >= 0 && r - l >= 2) { colL[y] = l; colR[y] = r; }
          }
        }
        for (let p = 0; p < d.length; p += 4) {
          const x = (p / 4) % cw;
          const y = Math.floor(p / 4 / cw);
          let keep = true;
          if (o.ellipse) {
            const ex = (x + 0.5) / cw - 0.5;
            const ey = (y + 0.5) / ch - 0.5;
            keep = ex * ex + ey * ey <= 0.25;
          }
          if (keep && o.cut === 'foliage') keep = isFoliage(d[p], d[p + 1], d[p + 2]);
          if (keep && o.cut === 'furniture') keep = isFurniture(d[p], d[p + 1], d[p + 2]);
          if (keep && o.cut === 'lamp') keep = isLamp(d[p], d[p + 1], d[p + 2]);
          if (keep && o.cut === 'dark') keep = Math.max(d[p], d[p + 1], d[p + 2]) < 95;
          if (keep && o.cut === 'booth') keep = isBooth(d[p], d[p + 1], d[p + 2]);
          if (keep && colL && colR) keep = colL[y] >= 0 && x >= colL[y] && x <= colR[y];
          if (!keep) d[p + 3] = 0;
        }
        ctx.putImageData(data, 0, 0);
        tex.refresh();
      }
      if (o.slice) {
        // faixas de 8 px lógicos (24 px de arte): cada uma ordena pela própria linha de baixo
        const step = 16; // px de textura (= 8 lógicos)
        for (let sy = 0; sy < ch; sy += step) {
          const hgt = Math.min(step, ch - sy);
          const img = scene.add.image(cx / RENDER_SCALE, (cy + sy) / RENDER_SCALE, key).setOrigin(0).setScale(1 / RENDER_SCALE);
          img.setCrop(0, sy, cw, hgt);
          img.setPosition(cx / RENDER_SCALE, cy / RENDER_SCALE);
          const top = (cy + sy) / RENDER_SCALE;
          const bottom = Math.min((cy + sy + hgt) / RENDER_SCALE, o.base / 3);
          img.setDepth(bottom);
          overlays.push({ img, rect: new Phaser.Geom.Rectangle(o.x0 / 3, top, (o.x1 - o.x0) / 3, bottom - top), base: bottom, fade: false });
        }
        return;
      }
      const img = scene.add.image(cx / RENDER_SCALE, cy / RENDER_SCALE, key).setOrigin(0).setScale(1 / RENDER_SCALE);
      img.setDepth(o.base / 3);
      overlays.push({
        img,
        rect: new Phaser.Geom.Rectangle(o.x0 / 3, o.y0 / 3, (o.x1 - o.x0) / 3, (o.y1 - o.y0) / 3),
        base: o.base / 3,
        fade: o.fade ?? false,
        when: o.when,
      });
    });
  }

  for (const b of def.blocks ?? []) {
    const r = tileRect(b);
    solids.add(scene.add.zone(r.centerX, r.centerY, r.width, r.height));
  }

  return { widthPx: artW, heightPx: artH, collision: groundLayer, solids, props, hasArt, overlays };
}

/** Folhas, flores e contornos escuros (o que deve ficar na frente); chão, asfalto e pedra não. */
function isFoliage(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max / 255;
  const sat = max === 0 ? 0 : (max - min) / max;
  if (v < 0.07) return false;
  let h = 0;
  if (max !== min) {
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  if (h >= 55 && h <= 170 && sat > 0.22) return true; // verdes
  if (sat > 0.42 && (h >= 290 || h < 12 || (h >= 45 && h < 55) || (h >= 170 && h < 290))) return true; // rosa, vermelho, roxo, amarelo, azul
  return false;
}

/** Sofás vermelhos de lanchonete: couro vermelho, cromado e contorno; tira o piso xadrez (marrom e bege). */
function isBooth(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  if (max < 48) return true; // contorno
  if (r > 125 && r > g * 1.7 && r > b * 1.5) return true; // couro vermelho
  if (r > 200 && g < 170 && b < 170 && r > g * 1.25) return true; // brilho rosado do couro
  if (sat < 0.14 && max > 140) return true; // cromado
  return false;
}

/** Móveis coloridos (estofado, madeira, plantas): tira o piso xadrez/neutro. */
function isFurniture(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  return max / 255 < 0.16 || sat > 0.3;
}

/** Poste: ferro escuro e luz amarela; tira calçada, asfalto e grama. */
function isLamp(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max / 255;
  const sat = max === 0 ? 0 : (max - min) / max;
  const greenish = g > r && g > b;
  return (v < 0.22 && !greenish) || (sat > 0.35 && v > 0.62 && r >= g && b < g && !greenish);
}

/** Converte um retângulo em tiles para pixels. */
export function tileRect(r: { x: number; y: number; w: number; h: number }): Phaser.Geom.Rectangle {
  return new Phaser.Geom.Rectangle(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
}

/** Posição dos pés de um personagem colocado no tile (tx, ty). */
export function tileToFeet(tx: number, ty: number): { x: number; y: number } {
  return { x: tx * TILE + TILE / 2, y: (ty + 1) * TILE - 1 };
}
