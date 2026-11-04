import type Phaser from 'phaser';

let game: Phaser.Game | null = null;
const cache = new Map<string, string>();

export function bindTextures(g: Phaser.Game): void {
  game = g;
}

/** Converte uma textura do Phaser (real ou placeholder) em data URL para a UI DOM. */
export function textureURL(key: string | undefined): string | null {
  if (!key || !game || !game.textures.exists(key)) return null;
  let url = cache.get(key);
  if (!url) {
    url = game.textures.getBase64(key, '__BASE');
    cache.set(key, url);
  }
  return url;
}
