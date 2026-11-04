import Phaser from 'phaser';
import { UI } from '@/ui/UIManager';
import { AudioSystem } from '@/systems/AudioSystem';
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from '@/config/gameConfig';
import { ensureCharacterAnims } from '@/entities/Character';

/**
 * Tela de título. Fundo: capa ilustrada (ui/title-art.png) se existir;
 * senão, a rua de Piabetá pintada com a Bella e o Weng em destaque.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#1b1838').setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    if (this.textures.exists('ui-title-art')) {
      // Capa definitiva: cobre a tela inteira
      const img = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'ui-title-art');
      const s = Math.max(GAME_WIDTH / img.width, GAME_HEIGHT / img.height);
      img.setScale(s);
    } else {
      this.buildFallbackCover();
    }

    // Brilhos subindo
    for (let i = 0; i < 18; i++) {
      const key = i % 3 === 0 ? 'fx-heart' : 'fx-spark';
      const p = this.add.image(Phaser.Math.Between(0, GAME_WIDTH), GAME_HEIGHT + 10, key).setAlpha(0).setDepth(50);
      this.tweens.add({
        targets: p,
        y: Phaser.Math.Between(20, 140),
        alpha: { from: 0.9, to: 0 },
        duration: Phaser.Math.Between(5000, 9000),
        delay: Phaser.Math.Between(0, 8000),
        repeat: -1,
        onRepeat: () => p.setX(Phaser.Math.Between(0, GAME_WIDTH)),
      });
    }

    UI.applyArt();
    UI.showGameplayUI(false);
    void UI.fade(0, 300);
    AudioSystem.playMusic('tema-principal');
    void UI.title.open();
  }

  private buildFallbackCover(): void {
    if (this.textures.exists('map-piabeta-rua-bg')) {
      const bg = this.add.image(0, -40, 'map-piabeta-rua-bg').setOrigin(0).setScale(1 / RENDER_SCALE);
      // panorâmica lenta
      this.tweens.add({ targets: bg, x: GAME_WIDTH - bg.displayWidth, duration: 24000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    // O casal em destaque (escala 1 = dobro do tamanho em jogo)
    const pair: [string, number, number][] = [
      ['bella-casual', 318, 2], // linha 3 = virada para a direita
      ['weng-casual', 386, 1], // linha 2 = virado para a esquerda
    ];
    const y = 236;
    this.add.ellipse(352, y - 2, 150, 16, 0x000000, 0.25);
    for (const [key, x, row] of pair) {
      if (!this.textures.exists(key)) continue;
      ensureCharacterAnims(this, key);
      const hd = this.textures.get(key).get(0).height >= 64;
      const spr = this.add.sprite(x, y, key, row * 4).setOrigin(0.5, 1).setScale(hd ? 1 : 2);
      // respiração suave
      this.tweens.add({ targets: spr, scaleY: spr.scaleY * 1.015, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    // coraçãozinho entre os dois
    const heart = this.add.image(352, y - 92, 'fx-heart').setScale(2);
    this.tweens.add({ targets: heart, y: heart.y - 6, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
}
