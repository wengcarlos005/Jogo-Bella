import Phaser from 'phaser';
import { Character } from './Character';
import { InputSystem } from '@/systems/InputSystem';
import { PLAYER } from '@/config/gameConfig';

export class Player extends Character {
  /** Histórico de posições usado pelo seguidor (Weng). */
  readonly trail: Phaser.Math.Vector2[] = [];
  frozen = false;

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.frozen || !InputSystem.gameplayEnabled) {
      body.setVelocity(0, 0);
      this.animateFromVelocity();
      return;
    }
    const v = InputSystem.vector();
    const run = InputSystem.running();
    const speed = run ? PLAYER.runSpeed : PLAYER.walkSpeed;
    body.setVelocity(v.x * speed, v.y * speed);
    this.animateFromVelocity(run ? 1.6 : 1);

    const last = this.trail[this.trail.length - 1];
    if (!last || Phaser.Math.Distance.Between(last.x, last.y, this.x, this.y) > 3) {
      this.trail.push(new Phaser.Math.Vector2(this.x, this.y));
      if (this.trail.length > 60) this.trail.shift();
    }
  }

  /** Ponto à frente do jogador, usado para detectar interações. */
  probe(): Phaser.Math.Vector2 {
    const f = this.feet;
    const d = PLAYER.interactRange * 0.6;
    const off = { down: [0, d], up: [0, -d - 4], left: [-d, -2], right: [d, -2] }[this.facing];
    return new Phaser.Math.Vector2(f.x + off[0], f.y + off[1]);
  }
}
