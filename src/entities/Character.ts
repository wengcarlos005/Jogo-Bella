import Phaser from 'phaser';
import type { Direction } from '@/core/types';
import { CHAR_SCALE, PLAYER, RENDER_SCALE } from '@/config/gameConfig';

const ROW: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 };

const headCache = new Map<string, number>();

/**
 * Mede (uma vez por textura) a fração do quadro ocupada pelo personagem,
 * a partir da primeira linha com pixels opacos do quadro de frente.
 */
function measureHeadRatio(scene: Phaser.Scene, key: string): number {
  const cached = headCache.get(key);
  if (cached !== undefined) return cached;
  let ratio = 0.8;
  try {
    const tex = scene.textures.get(key);
    const frame = tex.get(0);
    const src = tex.getSourceImage() as CanvasImageSource;
    const c = document.createElement('canvas');
    c.width = frame.cutWidth;
    c.height = frame.cutHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(src, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.cutWidth, frame.cutHeight);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let top = 0;
    outer: for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++)
        if (data[(y * c.width + x) * 4 + 3] > 40) {
          top = y;
          break outer;
        }
    ratio = (c.height - top) / c.height;
  } catch {
    /* mantém a estimativa */
  }
  headCache.set(key, ratio);
  return ratio;
}

/** Cria as animações de uma spritesheet de personagem (layout 4x4). */
export function ensureCharacterAnims(scene: Phaser.Scene, key: string): void {
  for (const dir of Object.keys(ROW) as Direction[]) {
    const walk = `${key}-walk-${dir}`;
    if (scene.anims.exists(walk)) continue;
    const r = ROW[dir] * 4;
    scene.anims.create({
      key: walk,
      frames: scene.anims.generateFrameNumbers(key, { frames: [r, r + 1, r + 2, r + 3] }),
      frameRate: 9,
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
  charKey: string;
  headRatio = 0.86;

  /** Y (mundo) do topo da cabeça desenhada. */
  get headY(): number {
    return this.y - this.displayHeight * this.headRatio;
  }

  /** Altura real do personagem desenhado (sem o espaço vazio do quadro). */
  get bodyHeight(): number {
    return this.displayHeight * this.headRatio;
  }

  constructor(scene: Phaser.Scene, x: number, y: number, key: string) {
    super(scene, x, y, key, 0);
    this.charKey = key;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.applySheet(key);
  }

  /**
   * Troca a spritesheet (ex.: roupa nova) mantendo posição e direção.
   * O corpo de colisão é recalculado pelo tamanho do quadro (32 ou 48px).
   */
  applySheet(key: string): void {
    this.charKey = key;
    ensureCharacterAnims(this.scene, key);
    this.setTexture(key, ROW[this.facing] * 4);
    const fw = this.frame.width;
    const fh = this.frame.height;
    // Folhas HD (quadros ≥ 64px) são exibidas em meia escala: 1 pixel da arte
    // = 1 pixel do canvas (que tem o dobro da resolução lógica).
    const s = (fh >= 64 ? 1 / RENDER_SCALE : 1) * CHAR_SCALE;
    // Fração do quadro ocupada pelo personagem (o resto é espaço vazio acima da cabeça).
    this.headRatio = measureHeadRatio(this.scene, key);
    this.setScale(s);
    const b = PLAYER.body;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(b.width / s, b.height / s);
    body.setOffset((fw - b.width / s) / 2, fh - (b.height + 1) / s);
  }

  /** Posição dos pés (centro do corpo). */
  get feet(): Phaser.Math.Vector2 {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return new Phaser.Math.Vector2(body.center.x, body.center.y);
  }

  sitting = false;

  /** Senta (sem sprite próprio: esconde as pernas atrás do assento). seatY = altura do assento no mundo. */
  sit(x: number, seatY: number, dir: Direction = 'down'): void {
    this.sitting = true;
    this.anims.stop();
    this.face(dir);
    const fh = this.frame.height;
    const fw = this.frame.width;
    const legs = fh * this.headRatio * 0.3;
    this.setCrop(0, 0, fw, fh - legs);
    this.setPosition(x, seatY + legs * this.scaleY);
    (this.body as Phaser.Physics.Arcade.Body).reset(this.x, this.y);
    this.setDepth(seatY + 2);
  }

  standUp(): void {
    if (!this.sitting) return;
    this.sitting = false;
    this.setCrop();
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
  animateFromVelocity(speedScale = 1, keepFacing = false): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const { x, y } = body.velocity;
    if (Math.abs(x) < 4 && Math.abs(y) < 4) {
      if (this.anims.isPlaying) this.face(this.facing);
      return;
    }
    if (!keepFacing) {
      // Só troca de direção quando um eixo domina claramente (evita girar na diagonal).
      const ax = Math.abs(x);
      const ay = Math.abs(y);
      if (ax > ay * 1.25) this.facing = x < 0 ? 'left' : 'right';
      else if (ay > ax * 1.25) this.facing = y < 0 ? 'up' : 'down';
    }
    this.anims.play(`${this.charKey}-walk-${this.facing}`, true);
    this.anims.timeScale = speedScale;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.sitting) return;
    this.setDepth(this.y);
  }
}
