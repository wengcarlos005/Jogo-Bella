import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { SettingsStore } from '@/systems/SaveSystem';

const isTouchDevice = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

/** Analógico virtual + botão de ação (A) + botão de corrida (B). */
export class TouchControls {
  readonly el: HTMLDivElement;
  private knob = h('div', { class: 'knob' });
  private stick = h('div', { class: 'stick' }, this.knob);
  private active = false;

  constructor(parent: HTMLElement) {
    const a = h('button', { class: 'touch-btn a', 'aria-label': 'Interagir' }, 'A');
    const b = h('button', { class: 'touch-btn b', 'aria-label': 'Correr' }, 'Correr');
    this.el = h('div', { class: 'touch hidden' }, this.stick, a, b);
    parent.append(this.el);

    a.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      a.classList.add('on');
      InputSystem.fire('interact');
    });
    a.addEventListener('pointerup', () => a.classList.remove('on'));
    a.addEventListener('pointerleave', () => a.classList.remove('on'));
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      InputSystem.touchRun = !InputSystem.touchRun;
      b.classList.toggle('on', InputSystem.touchRun);
    });

    let pid = -1;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      const r = this.stick.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = (e.clientX - cx) / (r.width / 2);
      let dy = (e.clientY - cy) / (r.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      const dead = 0.2;
      InputSystem.setTouchVector(Math.abs(dx) > dead ? dx : 0, Math.abs(dy) > dead ? dy : 0);
      this.knob.style.left = `${50 + dx * 32}%`;
      this.knob.style.top = `${50 + dy * 32}%`;
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = -1;
      InputSystem.setTouchVector(0, 0);
      this.knob.style.left = '50%';
      this.knob.style.top = '50%';
    };
    this.stick.addEventListener('pointerdown', (e) => {
      pid = e.pointerId;
      try {
        this.stick.setPointerCapture(e.pointerId);
      } catch {
        /* ponteiro sintético */
      }
      move(e);
    });
    this.stick.addEventListener('pointermove', move);
    this.stick.addEventListener('pointerup', end);
    this.stick.addEventListener('pointercancel', end);
  }

  get usingTouch(): boolean {
    const pref = SettingsStore.data.touchControls;
    return pref === 'sempre' || (pref === 'auto' && isTouchDevice());
  }

  show(on: boolean): void {
    this.active = on;
    this.el.classList.toggle('hidden', !(on && this.usingTouch));
  }

  refresh(): void {
    this.show(this.active);
  }
}
