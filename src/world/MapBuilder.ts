import Phaser from 'phaser';
import { TILE } from '@/config/gameConfig';
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
  if (scene.textures.exists(bgKey)) {
    scene.add.image(0, 0, bgKey).setOrigin(0).setDepth(-8);
    groundLayer.setAlpha(0);
  }
  if (scene.textures.exists(fgKey)) {
    scene.add.image(0, 0, fgKey).setOrigin(0).setDepth(100_000);
  }

  const solids = scene.physics.add.staticGroup();
  const props: BuiltProp[] = (def.props ?? []).map((p) => {
    const x = p.tx * TILE;
    const bottom = (p.ty + 1) * TILE;
    const sprite = scene.add.image(x, bottom, p.key).setOrigin(0, 1);
    sprite.setDepth(p.flat ? -5 : bottom);
    let block: Phaser.GameObjects.Zone | null = null;
    if (p.block !== false && !p.flat) {
      const [ox, oy, w, h] = p.block ?? [1, Math.max(0, sprite.height - Math.min(12, sprite.height * 0.5)), sprite.width - 2, Math.min(12, sprite.height * 0.5)];
      block = scene.add.zone(x + ox + w / 2, bottom - sprite.height + oy + h / 2, w, h);
      solids.add(block);
    }
    return { def: p, sprite, block };
  });

  return { widthPx: width * TILE, heightPx: height * TILE, collision: groundLayer, solids, props };
}

/** Converte um retângulo em tiles para pixels. */
export function tileRect(r: { x: number; y: number; w: number; h: number }): Phaser.Geom.Rectangle {
  return new Phaser.Geom.Rectangle(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
}

/** Posição dos pés de um personagem colocado no tile (tx, ty). */
export function tileToFeet(tx: number, ty: number): { x: number; y: number } {
  return { x: tx * TILE + TILE / 2, y: (ty + 1) * TILE - 1 };
}
