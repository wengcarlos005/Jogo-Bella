import Phaser from 'phaser';

export type InputAction = 'interact' | 'cancel' | 'menu' | 'up' | 'down' | 'left' | 'right';

const KEYMAP: Record<string, InputAction> = {
  KeyE: 'interact',
  Space: 'interact',
  Enter: 'interact',
  Escape: 'menu',
  KeyM: 'menu',
  KeyQ: 'cancel',
  Backspace: 'cancel',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

/**
 * Entrada unificada: teclado + controles de toque.
 * Não depende de cena — UI em DOM e jogo leem a mesma fonte.
 *
 * "Contexto": quando um modal (diálogo, menu) abre, ele empilha um
 * contexto; ações discretas só vão para o topo da pilha. O jogo só
 * anda quando a pilha está vazia.
 */
class InputSystemImpl extends Phaser.Events.EventEmitter {
  private held = new Set<string>();
  private touchVec = { x: 0, y: 0 };
  touchRun = false;
  private stack: string[] = [];

  init(): void {
    window.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.code];
      if (action) e.preventDefault();
      if (e.repeat) return;
      this.held.add(e.code);
      if (action) this.fire(action);
    });
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    window.addEventListener('blur', () => this.held.clear());
  }

  /** Dispara uma ação discreta (teclado ou botão de toque). */
  fire(action: InputAction): void {
    const ctx = this.stack[this.stack.length - 1] ?? 'game';
    this.emit(`${ctx}:${action}`);
  }

  push(ctx: string): void {
    this.stack.push(ctx);
  }

  pop(ctx: string): void {
    const i = this.stack.lastIndexOf(ctx);
    if (i >= 0) this.stack.splice(i, 1);
  }

  get context(): string {
    return this.stack[this.stack.length - 1] ?? 'game';
  }

  get gameplayEnabled(): boolean {
    return this.stack.length === 0;
  }

  setTouchVector(x: number, y: number): void {
    this.touchVec.x = x;
    this.touchVec.y = y;
  }

  private down(...codes: string[]): boolean {
    return codes.some((c) => this.held.has(c));
  }

  /** Vetor de movimento normalizado (-1..1). */
  vector(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.down('ArrowLeft', 'KeyA')) x -= 1;
    if (this.down('ArrowRight', 'KeyD')) x += 1;
    if (this.down('ArrowUp', 'KeyW')) y -= 1;
    if (this.down('ArrowDown', 'KeyS')) y += 1;
    if (x === 0 && y === 0) {
      x = this.touchVec.x;
      y = this.touchVec.y;
    }
    const len = Math.hypot(x, y);
    return len > 1 ? { x: x / len, y: y / len } : { x, y };
  }

  running(): boolean {
    return this.down('ShiftLeft', 'ShiftRight') || this.touchRun;
  }

  releaseAll(): void {
    this.held.clear();
    this.touchVec.x = 0;
    this.touchVec.y = 0;
  }
}

export const InputSystem = new InputSystemImpl();
