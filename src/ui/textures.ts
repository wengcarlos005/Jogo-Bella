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

/** Data URL de um quadro específico de uma spritesheet (ex.: prévia de roupa). */
export function frameURL(key: string, frame: number): string | null {
  if (!game || !game.textures.exists(key)) return null;
  const id = `${key}#${frame}`;
  let url = cache.get(id);
  if (!url) {
    url = game.textures.getBase64(key, frame);
    cache.set(id, url);
  }
  return url;
}
