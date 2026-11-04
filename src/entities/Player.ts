import Phaser from 'phaser';
import { Character } from './Character';
import { InputSystem } from '@/systems/InputSystem';
import { PLAYER } from '@/config/gameConfig';

export class Player extends Character {
  /** Histórico de posições usado pelo seguidor (Weng). */
  readonly trail: Phaser.Math.Vector2[] = [];
  frozen = false;
  /** Enquanto true, um script controla posição e animação. */
  scripted = false;

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.scripted) return; // movida por script (anima sozinha)
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

  isMoving(): boolean {
    const v = (this.body as Phaser.Physics.Arcade.Body).velocity;
    return Math.abs(v.x) + Math.abs(v.y) > 5;
  }

  /** Ponto à frente do jogador, usado para detectar interações. */
  probe(): Phaser.Math.Vector2 {
    const f = this.feet;
    const d = PLAYER.interactRange * 0.85;
    const off = { down: [0, d], up: [0, -d - 6], left: [-d, -8], right: [d, -8] }[this.facing];
    return new Phaser.Math.Vector2(f.x + off[0], f.y + off[1]);
  }
}
