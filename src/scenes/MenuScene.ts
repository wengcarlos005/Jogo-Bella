import Phaser from 'phaser';
import { UI } from '@/ui/UIManager';
import { AudioSystem } from '@/systems/AudioSystem';

/** Tela de título (UI em DOM) com um céu estrelado pixelado ao fundo. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1b1838');
    for (let i = 0; i < 60; i++) {
      const s = this.add.rectangle(Phaser.Math.Between(0, 480), Phaser.Math.Between(0, 270), 1, 1, i % 7 ? 0xd8d2f0 : 0xffd75e);
      this.tweens.add({ targets: s, alpha: 0.2, duration: Phaser.Math.Between(800, 2200), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1500) });
    }
    UI.showGameplayUI(false);
    void UI.fade(0, 300);
    AudioSystem.playMusic('tema-principal');
    void UI.title.open();
  }
}
