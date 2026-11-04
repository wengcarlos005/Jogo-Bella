import Phaser from 'phaser';
import type { Direction } from '@/core/types';
import { PLAYER } from '@/config/gameConfig';

const ROW: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 };

/** Cria as animações de uma spritesheet de personagem (layout 4x4). */
export function ensureCharacterAnims(scene: Phaser.Scene, key: string): void {
  for (const dir of Object.keys(ROW) as Direction[]) {
    const walk = `${key}-walk-${dir}`;
    if (scene.anims.exists(walk)) continue;
    const r = ROW[dir] * 4;
    scene.anims.create({
      key: walk,
      frames: scene.anims.generateFrameNumbers(key, { frames: [r, r + 1, r + 2, r + 3] }),
      frameRate: 8,
      repeat: -1,
    });
  }
}

/**
 * Base de todos os personagens (jogador e NPCs): animação em 4 direções,
 * corpo de colisão nos pés e ordenação por profundidade (y).
 */
export class Character extends Phaser.Physics.Arcade.Sprite {
  facing: Direction = 'down';
  readonly charKey: string;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string) {
    super(scene, x, y, key, 0);
    this.charKey = key;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    ensureCharacterAnims(scene, key);
    this.setOrigin(0.5, 1);
    const b = PLAYER.body;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(b.width, b.height);
    body.setOffset(b.offsetX, b.offsetY);
  }

  /** Posição dos pés (centro do corpo). */
  get feet(): Phaser.Math.Vector2 {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return new Phaser.Math.Vector2(body.center.x, body.center.y);
  }

  face(dir: Direction): void {
    this.facing = dir;
    this.anims.stop();
    this.setFrame(ROW[dir] * 4);
  }

  faceTowards(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    this.face(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down');
  }

  /** Atualiza animação conforme a velocidade atual. */
  animateFromVelocity(speedScale = 1): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const { x, y } = body.velocity;
    if (Math.abs(x) < 1 && Math.abs(y) < 1) {
      if (this.anims.isPlaying) this.face(this.facing);
      return;
    }
    this.facing = Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : y < 0 ? 'up' : 'down';
    this.anims.play(`${this.charKey}-walk-${this.facing}`, true);
    this.anims.timeScale = speedScale;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.setDepth(this.y);
  }
}
