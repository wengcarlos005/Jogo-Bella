import Phaser from 'phaser';
import available from 'virtual:available-assets';
import { ASSETS } from '@/config/assetManifest';
import { PlaceholderFactory } from '@/graphics/PlaceholderFactory';
import { AudioSystem } from '@/systems/AudioSystem';
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from '@/config/gameConfig';

/**
 * Carrega SOMENTE os arquivos de arte/áudio que existem de verdade em
 * public/assets. Tudo que faltar vira placeholder procedural.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const files = new Set(available);
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 80, GAME_HEIGHT / 2, 0, 6, 0xf27a9b).setOrigin(0, 0.5);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 164, 10).setStrokeStyle(1, 0xfbf3e2);
    this.load.on('progress', (p: number) => (bar.width = 160 * p));

    for (const a of ASSETS) {
      if (!files.has(a.file)) continue;
      if (a.kind === 'spritesheet') this.load.spritesheet(a.key, a.file, { frameWidth: a.frameWidth!, frameHeight: a.frameHeight! });
      else if (a.kind === 'image') this.load.image(a.key, a.file);
      else AudioSystem.registerFile(a.key, a.file);
    }
    const loaded = ASSETS.filter((a) => files.has(a.file)).map((a) => a.id);
    console.info(`[assets] ${loaded.length}/${ASSETS.length} arquivos reais. Demais: placeholders.`, loaded);
  }

  create(): void {
    new PlaceholderFactory(this).generateAll();
    this.scene.start('Menu');
  }
}
