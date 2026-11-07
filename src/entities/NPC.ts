import Phaser from 'phaser';
import { Character } from './Character';
import type { Player } from './Player';
import type { Direction } from '@/core/types';
import { InputSystem } from '@/systems/InputSystem';

export class NPC extends Character {
  readonly npcId: string;
  interactScript?: string;
  behavior: 'idle' | 'wander' | 'follow' | 'scripted' | 'chore' | 'flee' = 'idle';
  /** Gatinho arisco: de quem ele foge. */
  fleeFrom: Phaser.GameObjects.Components.Transform | null = null;
  private fleeRest = 0;
  private fleeTimer = 0;
  /** Rotina de trabalho (ex.: garçonete limpando o balcão): pontos x onde para e limpa, numa linha y. */
  chore: { xs: number[]; y: number; wy: number; i: number; dir: number; wipe: number } | null = null;
  /** Está limpando agora (a cena desenha o paninho). */
  wiping = false;
  private choreHold = 0;
  private target: Phaser.Math.Vector2 | null = null;
  private onArrive: (() => void) | null = null;
  private speed = 55;
  private wanderTimer = 0;
  home: Phaser.Math.Vector2;
  private followTarget: Player | null = null;
  wanderRadius = 24;
  private followMoving = false;
  private stuckMs = 0;
  private lookTimer = Phaser.Math.Between(2000, 5000);
  /** Seguidor: não bloqueia a Bella (mas colide com paredes). */
  passThroughPlayer = false;
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
    this.passThroughPlayer = true;
  }

  stopFollowing(): void {
    this.followTarget = null;
    this.behavior = 'idle';
    this.passThroughPlayer = false;
  }

  update(_time: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.posed && !this.target) {
      body.setVelocity(0, 0);
      return;
    }

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
      this.animateFromVelocity(Math.max(0.45, this.speed / 70));
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
      if (d < 15 && !p.isMoving()) {
        // parados: o Weng dá um passinho pra trás (nunca ficam um dentro do outro)
        const ax = this.x - p.x || 1;
        const ay = this.y - p.y;
        const len = Math.hypot(ax, ay) || 1;
        body.setVelocity((ax / len) * 40, (ay / len) * 40);
        this.animateFromVelocity();
        this.face(Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'left' : 'right') : ay > 0 ? 'up' : 'down');
        return;
      }
      if (d < 16 && p.isMoving()) {
        // a Bella vem na direção dele: ele dá um passo pro lado, andando (sem ser "empurrado")
        const pv = (p.body as Phaser.Physics.Arcade.Body).velocity;
        const len = Math.hypot(pv.x, pv.y) || 1;
        let sx = -pv.y / len;
        let sy = pv.x / len;
        if ((this.x - p.x) * sx + (this.y - p.y) * sy < 0) {
          sx = -sx;
          sy = -sy;
        }
        body.setVelocity(sx * 55, sy * 55);
        this.followMoving = false;
        this.animateFromVelocity();
        return;
      }
      if (!goal && d > 40) {
        // sem rastro (Bella foi reposicionada): vai direto até ela
        const dx = p.x - this.x;
        const dy = p.y - this.y;
        body.setVelocity((dx / d) * 120, (dy / d) * 120);
        if (d > 160) this.setPosition(p.x - 14, p.y);
        this.animateFromVelocity();
        return;
      }
      if (goal && this.followMoving && toGoal > 3) {
        const dx = goal.x - this.x;
        const dy = goal.y - this.y;
        const sp = d > 70 ? 140 : d > 40 ? 95 : 70;
        body.setVelocity((dx / toGoal) * sp, (dy / toGoal) * sp);
        // preso num móvel/parede: reaparece no rastro dela
        this.stuckMs = body.blocked.none && body.touching.none ? 0 : this.stuckMs + delta;
        if (d > 120 || this.stuckMs > 350) {
          this.setPosition(goal.x, goal.y);
          body.reset(goal.x, goal.y);
          this.stuckMs = 0;
        }
      } else {
        body.setVelocity(0, 0);
        this.followMoving = false;
      }
      this.animateFromVelocity();
      return;
    }

    if (this.behavior === 'chore' && this.chore) {
      const c = this.chore;
      if (this.choreHold > 0) {
        // alguém veio conversar: para e espera
        this.choreHold -= delta;
        this.wiping = false;
        this.endWipeTexture();
        body.setVelocity(0, 0);
        this.animateFromVelocity();
        return;
      }
      if (c.wipe > 0) {
        // entra no vão entre os banquinhos e limpa o balcão
        if (Math.abs(c.wy - this.y) > 1.2) {
          body.setVelocity(0, Math.sign(c.wy - this.y) * 22);
          this.wiping = false;
          this.animateFromVelocity();
          return;
        }
        c.wipe -= delta;
        body.setVelocity(0, 0);
        if (this.facing !== 'up') this.face('up');
        this.wiping = true;
        // folha dela limpando (de costas, passando o pano no balcão)
        const wipeKey = `${this.charKey}-limpando`;
        if (this.scene.textures.exists(wipeKey)) {
          this.wipeAnimMs += delta;
          this.anims.stop();
          const seq = [0, 1, 2, 3, 2, 1];
          this.setTexture(wipeKey, seq[Math.floor(this.wipeAnimMs / 170) % seq.length]);
          this.wipeTex = true;
          if (c.wipe <= 0) this.endWipeTexture();
          if (c.wipe <= 0) {
            c.i += c.dir;
            if (c.i >= c.xs.length || c.i < 0) {
              c.dir *= -1;
              c.i += 2 * c.dir;
            }
          }
          return;
        }
        if (c.wipe <= 0) {
          c.i += c.dir;
          if (c.i >= c.xs.length || c.i < 0) {
            c.dir *= -1;
            c.i += 2 * c.dir;
          }
        }
        this.animateFromVelocity();
        return;
      }
      this.wiping = false;
      this.endWipeTexture();
      // antes de andar pro lado, sai do vão (volta pro corredor)
      if (Math.abs(c.y - this.y) > 1.2) {
        body.setVelocity(0, Math.sign(c.y - this.y) * 22);
        this.animateFromVelocity();
        return;
      }
      const dx = c.xs[c.i] - this.x;
      if (Math.abs(dx) < 1.5) {
        c.wipe = Phaser.Math.Between(2400, 4400);
        body.setVelocity(0, 0);
      } else body.setVelocity(Math.sign(dx) * 22, (c.y - this.y) * 3);
      this.animateFromVelocity();
      return;
    }

    if (this.behavior === 'flee' && this.fleeFrom) {
      // foge quando a Bella chega perto; de vez em quando para pra se lamber (é a chance de chegar)
      const p = this.fleeFrom as unknown as { x: number; y: number };
      const dx = this.x - p.x;
      const dy = this.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      this.fleeTimer -= delta;
      if (this.fleeRest > 0) {
        this.fleeRest -= delta;
        body.setVelocity(0, 0);
      } else if (d < 46) {
        if (this.fleeTimer <= 0) {
          this.fleeTimer = 700;
          // às vezes cansa e senta mesmo com ela perto
          if (Math.random() < 0.22) this.fleeRest = 1500;
        }
        const sp = 52;
        // foge pra longe, com um desvio pro lado (não fica preso na parede)
        const side = Math.sin(this.fleeTimer / 120) * 0.5;
        body.setVelocity(((dx / d) - (dy / d) * side) * sp, ((dy / d) + (dx / d) * side) * sp);
      } else if (this.fleeTimer <= 0) {
        this.fleeTimer = Phaser.Math.Between(1200, 2600);
        if (Math.random() < 0.5) body.setVelocity(0, 0);
        else body.setVelocity(Phaser.Math.Between(-18, 18), Phaser.Math.Between(-12, 12));
      }
      this.animateFromVelocity();
      return;
    }

    if (this.behavior === 'wander') {
      // durante cenas e conversas ninguém fica passeando (e quem fala olha pra Bella)
      if (!InputSystem.gameplayEnabled) {
        body.setVelocity(0, 0);
        this.animateFromVelocity();
        return;
      }
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
    // parado: de vez em quando olha pra outro lado (só fora de cenas)
    if (this.behavior === 'idle' && InputSystem.gameplayEnabled) {
      this.lookTimer -= delta;
      if (this.lookTimer <= 0) {
        this.lookTimer = Phaser.Math.Between(2500, 6000);
        const options: Direction[] = ['down', 'left', 'right', 'down'];
        this.face(options[Phaser.Math.Between(0, options.length - 1)]);
      }
    }
  }

  /** Para a caminhada aleatória (ex.: ao conversar). */
  private wipeTex = false;
  private wipeAnimMs = 0;
  /** Volta da folha de limpar pra folha de andar. */
  private endWipeTexture(): void {
    if (!this.wipeTex) return;
    this.wipeTex = false;
    this.setTexture(this.charKey, 12);
    this.face(this.facing);
  }

  /** Segura a rotina por um tempo (cena acontecendo). */
  holdChore(ms: number): void {
    this.choreHold = Math.max(this.choreHold, ms);
    this.wiping = false;
    this.endWipeTexture();
  }

  pause(): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.choreHold = 4000;
    this.wiping = false;
    this.endWipeTexture();
    this.wanderTimer = 2500;
    this.animateFromVelocity();
  }
}
