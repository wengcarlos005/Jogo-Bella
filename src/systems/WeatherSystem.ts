import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config/gameConfig';
import { AudioSystem } from './AudioSystem';

export type Weather = 'clear' | 'rain' | 'sunset' | 'night';

/**
 * Clima e iluminação ambiente: chuva (partículas + escurecimento + som)
 * e pôr do sol (filtro alaranjado). Transições graduais.
 */
export class WeatherSystem {
  private overlay: Phaser.GameObjects.Rectangle;
  private rain: Phaser.GameObjects.Particles.ParticleEmitter;
  current: Weather = 'clear';

  constructor(private scene: Phaser.Scene) {
    // Posicionados no mundo e reposicionados a cada quadro sobre a área visível
    // (scrollFactor 0 + zoom de câmera desloca objetos).
    this.overlay = scene.add
      .rectangle(0, 0, GAME_WIDTH + 64, GAME_HEIGHT + 64, 0x000000, 1)
      .setOrigin(0)
      .setDepth(200_000)
      .setAlpha(0);
    this.rain = scene.add.particles(0, 0, 'fx-rain', {
      x: { min: -40, max: GAME_WIDTH + 40 },
      y: -10,
      speedY: { min: 260, max: 340 },
      speedX: { min: -50, max: -30 },
      lifespan: 1100,
      quantity: 0,
      frequency: 12,
      alpha: { min: 0.5, max: 0.9 },
      emitting: false,
    });
    this.rain.setDepth(200_001);
  }

  /** Mantém overlay e chuva cobrindo a câmera. */
  update(cam: Phaser.Cameras.Scene2D.Camera): void {
    const v = cam.worldView;
    this.overlay.setPosition(v.x - 32, v.y - 32);
    this.rain.setPosition(v.x, v.y);
  }

  set(kind: Weather, ms = 1500): void {
    this.current = kind;
    const tween = (color: number, alpha: number) => {
      this.overlay.fillColor = color;
      this.scene.tweens.add({ targets: this.overlay, alpha, duration: ms });
    };
    if (kind === 'rain') {
      tween(0x1b2a4a, 0.35);
      this.rain.setQuantity(3);
      this.rain.start();
      AudioSystem.setRain(true);
    } else {
      this.rain.stop();
      AudioSystem.setRain(false);
      if (kind === 'sunset') tween(0xff8a3d, 0.22);
      else if (kind === 'night') tween(0x141a48, 0.42);
      else tween(0x000000, 0);
    }
  }

  destroy(): void {
    AudioSystem.setRain(false);
  }
}
