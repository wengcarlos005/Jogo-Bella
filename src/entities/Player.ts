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
    // aceleração/frenagem suaves (sem "tranco" ao começar e ao parar)
    const dt = Math.min(2, this.scene.game.loop.delta / (1000 / 60));
    const tx = v.x * speed;
    const ty = v.y * speed;
    const moving = v.x !== 0 || v.y !== 0;
    const k = 1 - Math.pow(1 - (moving ? PLAYER.accel : PLAYER.decel), dt);
    let vx = body.velocity.x + (tx - body.velocity.x) * k;
    let vy = body.velocity.y + (ty - body.velocity.y) * k;
    if (!moving && Math.hypot(vx, vy) < 6) vx = vy = 0;
    body.setVelocity(vx, vy);
    // direção: segue o que a jogadora aperta (horizontal tem prioridade na diagonal, como no Stardew)
    if (moving) {
      if (Math.abs(v.x) >= 0.35) this.facing = v.x < 0 ? 'left' : 'right';
      else this.facing = v.y < 0 ? 'up' : 'down';
    }
    // passos no ritmo da velocidade real
    this.animateFromVelocity(Math.max(0.6, Math.hypot(vx, vy) / PLAYER.walkSpeed) * 1.15, moving);

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
