import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { SettingsStore } from '@/systems/SaveSystem';
import { setDevice } from '@/systems/Gamepad';
import { ICON_PC, ICON_PAD } from './deviceIcons';

/**
 * Antes do jogo novo: "Vai jogar no PC ou no Controle?". O jogo adapta os textos das teclas
 * (Espaço/E ↔ ✕ ◯ □ △). Dá pra trocar depois em Opções › Jogando no.
 * Navega com ← → (teclado ou direcional) e confirma com Espaço / Enter / ✕.
 */
export function chooseDevice(root: HTMLElement): Promise<'pc' | 'controle'> {
  return new Promise((resolve) => {
    const opts: { id: 'pc' | 'controle'; icon: string; name: string; keys: string[] }[] = [
      { id: 'pc', icon: ICON_PC, name: 'PC', keys: ['Setas ou WASD: andar', 'Espaço ou E: interagir', 'Shift: correr', 'Esc: menu'] },
      { id: 'controle', icon: ICON_PAD, name: 'Controle', keys: ['Direcional / analógico: andar', '✕: interagir', '□: correr', 'OPTIONS: menu'] },
    ];
    let sel = SettingsStore.data.device === 'controle' ? 1 : 0;
    // apertou um botão do controle nesta tela? já sugere "Controle"
    if (navigator.getGamepads?.().some((p) => p?.connected)) sel = 1;
    const cards = opts.map((o, i) =>
      h(
        'button',
        { class: 'dv-card no-swap', onclick: () => pick(i) },
        h('div', { class: 'dv-icon', html: o.icon }),
        h('div', { class: 'dv-name' }, o.name),
        h('ul', {}, ...o.keys.map((k) => h('li', {}, k))),
      ),
    );
    const screen = h(
      'div',
      { class: 'screen opaque dv-screen' },
      h('div', { class: 'dv-box' }, h('div', { class: 'dv-title' }, 'Como você vai jogar?'), h('div', { class: 'dv-sub' }, 'O jogo se adapta. Dá pra trocar depois em Opções.'), h('div', { class: 'dv-cards' }, ...cards), h('div', { class: 'dv-hint' }, '← → escolher · Espaço / ✕ confirmar')),
    );
    const paint = () => cards.forEach((c, i) => c.classList.toggle('sel', i === sel));
    paint();
    root.append(screen);
    InputSystem.push('chapter');
    InputSystem.releaseAll();
    let done = false;
    const pick = (i: number) => {
      if (done) return;
      done = true;
      sel = i;
      paint();
      AudioSystem.play('confirm');
      const d = opts[i].id;
      SettingsStore.data.device = d;
      SettingsStore.save();
      setDevice(d);
      window.removeEventListener('keydown', onKey, true);
      screen.classList.add('out');
      setTimeout(() => {
        screen.remove();
        InputSystem.pop('chapter');
        resolve(d);
      }, 400);
    };
    const onKey = (e: KeyboardEvent) => {
      const c = e.code;
      if (c === 'ArrowLeft' || c === 'ArrowRight' || c === 'KeyA' || c === 'KeyD' || c === 'ArrowUp' || c === 'ArrowDown') {
        e.preventDefault();
        e.stopImmediatePropagation();
        sel = 1 - sel;
        AudioSystem.play('blip');
        paint();
      } else if (c === 'Space' || c === 'Enter' || c === 'KeyE') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) pick(sel);
      }
    };
    window.addEventListener('keydown', onKey, true);
  });
}
