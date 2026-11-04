import { h } from '@/utils/dom';
import { textureURL } from '../textures';

export class Toasts {
  private el = h('div', { class: 'toasts' });

  constructor(parent: HTMLElement) {
    parent.append(this.el);
  }

  show(text: string, icon?: string): void {
    // Não aparece por cima de telas cheias (minigame, memória, item): espera fechar.
    if (document.querySelector('#ui .screen')) {
      setTimeout(() => this.show(text, icon), 600);
      return;
    }
    const url = textureURL(icon);
    const t = h('div', { class: 'toast panel' }, url ? h('img', { src: url, alt: '' }) : null, text);
    this.el.append(t);
    setTimeout(() => t.remove(), 2800);
  }
}
