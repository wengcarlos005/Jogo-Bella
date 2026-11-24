import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';

/**
 * Pergunta sim/não do próprio jogo (no lugar do confirm() do navegador, que congela o jogo e não
 * aceita o controle). Setas / direcional escolhem, Espaço / Enter / A confirmam, Q / Esc / B cancelam.
 */
export function askConfirm(parent: HTMLElement, text: string, yes = 'Sim', no = 'Cancelar'): Promise<boolean> {
  return new Promise((resolve) => {
    let sel = 0;
    const bYes = h('button', { class: 'btn primary', onclick: () => done(true) }, yes) as HTMLButtonElement;
    const bNo = h('button', { class: 'btn', onclick: () => done(false) }, no) as HTMLButtonElement;
    const btns = [bYes, bNo];
    const paint = () => btns.forEach((b, i) => b.classList.toggle('kb-sel', i === sel));
    const screen = h('div', { class: 'screen cf-ask' }, h('div', { class: 'cf-ask-box panel' }, h('p', {}, text), h('div', { class: 'cf-ask-btns' }, bYes, bNo)));
    parent.append(screen);
    InputSystem.push('confirm');
    InputSystem.releaseAll();
    paint();
    let ready = false;
    setTimeout(() => (ready = true), 250); // o mesmo aperto que abriu não confirma
    const onKey = (e: KeyboardEvent) => {
      const c = e.code;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat || !ready) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(c)) {
        sel = 1 - sel;
        AudioSystem.play('blip');
        paint();
      } else if (c === 'Space' || c === 'Enter' || c === 'KeyE') done(sel === 0);
      else if (c === 'KeyQ' || c === 'Escape' || c === 'Backspace') done(false);
    };
    window.addEventListener('keydown', onKey, true);
    function done(ok: boolean): void {
      window.removeEventListener('keydown', onKey, true);
      InputSystem.pop('confirm');
      AudioSystem.play(ok ? 'confirm' : 'cancel');
      screen.remove();
      resolve(ok);
    }
  });
}
