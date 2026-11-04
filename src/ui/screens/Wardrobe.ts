import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { frameURL } from '../textures';

export interface WardrobeOption {
  id: string;
  name: string;
  description: string;
  /** Chave da spritesheet (4x4: frente, esquerda, direita, costas). */
  texture: string;
}

/**
 * Guarda-roupa: mostra a personagem andando com cada roupa.
 * ←/→ (ou toque nas setas) troca; E/Enter/"Vestir" escolhe. Resolve com o id.
 */
export function openWardrobe(parent: HTMLElement, title: string, options: WardrobeOption[], startId?: string): Promise<string> {
  return new Promise((resolve) => {
    let i = Math.max(0, options.findIndex((o) => o.id === startId));
    let frame = 0;
    let row = 0;
    const img = h('img', { class: 'wd-sprite', alt: '' });
    const name = h('div', { class: 'wd-name' });
    const desc = h('div', { class: 'wd-desc' });
    const count = h('div', { class: 'wd-count' });
    const dots = h('div', { class: 'wd-dots' });
    const prev = h('button', { class: 'wd-arrow', 'aria-label': 'Anterior' }, '◀');
    const next = h('button', { class: 'wd-arrow', 'aria-label': 'Próxima' }, '▶');
    const wear = h('button', { class: 'btn primary' }, 'Vestir ♥');

    const render = () => {
      const o = options[i];
      name.textContent = o.name;
      desc.textContent = o.description;
      count.textContent = `${i + 1} / ${options.length}`;
      dots.replaceChildren(...options.map((_, k) => h('span', { class: k === i ? 'on' : '' })));
      draw();
    };
    const draw = () => {
      const url = frameURL(options[i].texture, row * 4 + frame);
      if (url) img.src = url;
    };
    const move = (d: number) => {
      i = (i + d + options.length) % options.length;
      AudioSystem.play('blip');
      render();
    };
    // anda no lugar e gira de vez em quando (frente → lado → costas → lado)
    let tick = 0;
    const timer = window.setInterval(() => {
      tick++;
      frame = (frame + 1) % 4;
      if (tick % 16 === 0) row = [0, 2, 3, 1][(tick / 16) % 4];
      draw();
    }, 180);

    const choose = () => {
      cleanup();
      AudioSystem.play('confirm');
      resolve(options[i].id);
    };
    const left = () => move(-1);
    const right = () => move(1);
    prev.addEventListener('click', left);
    next.addEventListener('click', right);
    wear.addEventListener('click', choose);

    const screen = h(
      'div',
      { class: 'screen wd-screen' },
      h(
        'div',
        { class: 'wd-panel panel' },
        h('div', { class: 'wd-title' }, title),
        h('div', { class: 'wd-stage' }, prev, h('div', { class: 'wd-mirror' }, img), next),
        name,
        desc,
        dots,
        h('div', { class: 'wd-actions' }, count, wear),
      ),
    );
    parent.append(screen);
    InputSystem.push('wardrobe');
    InputSystem.on('wardrobe:left', left);
    InputSystem.on('wardrobe:right', right);
    setTimeout(() => InputSystem.on('wardrobe:interact', choose), 300);

    function cleanup() {
      clearInterval(timer);
      InputSystem.off('wardrobe:left', left);
      InputSystem.off('wardrobe:right', right);
      InputSystem.off('wardrobe:interact', choose);
      InputSystem.pop('wardrobe');
      screen.remove();
    }
    render();
  });
}
