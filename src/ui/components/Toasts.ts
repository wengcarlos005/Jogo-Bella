import { h } from '@/utils/dom';
import { textureURL } from '../textures';

export class Toasts {
  private el = h('div', { class: 'toasts' });

  constructor(parent: HTMLElement) {
    parent.append(this.el);
  }

  show(text: string, icon?: string): void {
    const url = textureURL(icon);
    const t = h('div', { class: 'toast panel' }, url ? h('img', { src: url, alt: '' }) : null, text);
    this.el.append(t);
    setTimeout(() => t.remove(), 2800);
  }
}
