import Phaser from 'phaser';
import { Character } from './Character';
import type { Player } from './Player';

export class NPC extends Character {
  readonly npcId: string;
  interactScript?: string;
  behavior: 'idle' | 'wander' | 'follow' | 'scripted' = 'idle';
  private target: Phaser.Math.Vector2 | null = null;
  private onArrive: (() => void) | null = null;
  private speed = 55;
  private wanderTimer = 0;
  private home: Phaser.Math.Vector2;
  private followTarget: Player | null = null;
  wanderRadius = 24;
  private followMoving = false;
  wanderAxis: 'x' | 'y' | 'both' = 'both';

  constructor(scene: Phaser.Scene, x: number, y: number, key: string, id: string) {
    super(scene, x, y, key);
    this.npcId = id;
    this.home = new Phaser.Math.Vector2(x, y);
    // Não é "immovable" (senão atravessa paredes estáticas), mas o jogador
    // também não consegue empurrá-lo.
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.pushable = false;
  }

  /** Anda até (x,y) em px, primeiro no eixo X e depois no Y. */
  walkTo(x: number, y: number, speed = 55): Promise<void> {
    this.behavior = 'scripted';
    this.speed = speed;
    return new Promise((resolve) => {
      const midX = new Phaser.Math.Vector2(x, this.y);
      this.target = midX;
      this.onArrive = () => {
        this.target = new Phaser.Math.Vector2(x, y);
        this.onArrive = () => {
          this.target = null;
          resolve();
        };
      };
    });
  }

  follow(player: Player): void {
    this.behavior = 'follow';
    this.followTarget = player;
    (this.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;
  }

  stopFollowing(): void {
    this.followTarget = null;
    this.behavior = 'idle';
    (this.body as Phaser.Physics.Arcade.Body).checkCollision.none = false;
  }

  update(_time: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1.5) {
        this.setPosition(this.target.x, this.target.y);
        body.setVelocity(0, 0);
        const cb = this.onArrive;
        this.onArrive = null;
        cb?.();
      } else {
        body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
      }
      this.animateFromVelocity();
      return;
    }

    if (this.behavior === 'follow' && this.followTarget) {
      const p = this.followTarget;
      const trail = p.trail;
      const goal = trail.length > 8 ? trail[trail.length - 8] : null;
      const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
      // Histerese: começa a andar longe (>34), para perto (<24) — evita o "pisca-pisca".
      if (!this.followMoving && d > 34) this.followMoving = true;
      if (this.followMoving && d < 24) this.followMoving = false;
      const toGoal = goal ? Math.hypot(goal.x - this.x, goal.y - this.y) : 0;
      if (goal && this.followMoving && toGoal > 3) {
        const dx = goal.x - this.x;
        const dy = goal.y - this.y;
        const sp = d > 70 ? 140 : d > 40 ? 95 : 70;
        body.setVelocity((dx / toGoal) * sp, (dy / toGoal) * sp);
        if (d > 160) this.setPosition(goal.x, goal.y);
      } else {
        body.setVelocity(0, 0);
        this.followMoving = false;
      }
      this.animateFromVelocity();
      return;
    }

    if (this.behavior === 'wander') {
      const dx = this.home.x - this.x;
      const dy = this.home.y - this.y;
      const away = Math.hypot(dx, dy);
      if (away > this.wanderRadius) {
        // passou do limite: volta para perto de casa
        body.setVelocity((dx / away) * 25, (dy / away) * 25);
        this.wanderTimer = 600;
      } else {
        this.wanderTimer -= delta;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = Phaser.Math.Between(1500, 3500);
          if (Math.random() < 0.45) {
            body.setVelocity(0, 0);
          } else {
            const dirs =
              this.wanderAxis === 'x' ? [[1, 0], [-1, 0]] : this.wanderAxis === 'y' ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
            const [vx, vy] = dirs[Phaser.Math.Between(0, dirs.length - 1)];
            body.setVelocity(vx * 25, vy * 25);
          }
        }
      }
      this.animateFromVelocity();
      return;
    }

    body.setVelocity(0, 0);
    this.animateFromVelocity();
  }

  /** Para a caminhada aleatória (ex.: ao conversar). */
  pause(): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.wanderTimer = 2500;
    this.animateFromVelocity();
  }
}
