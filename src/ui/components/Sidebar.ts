import { h } from '@/utils/dom';
import { EventBus } from '@/core/EventBus';
import { InventorySystem } from '@/systems/InventorySystem';
import { GameState } from '@/core/GameState';
import { MEMORY_GOAL } from '@/data/memories';
import { textureURL } from '../textures';

const BUTTONS: [tab: string, label: string, icon: string][] = [
  ['missoes', 'Missões', 'lua'],
  ['inventario', 'Mochila', 'mochila'],
  ['album', 'Álbum', 'album'],
  ['mapa', 'Mapa', 'mapa'],
  ['salvar', 'Salvar', 'salvar'],
  ['config', 'Opções', 'opcoes'],
];

/**
 * Menu FORA da tela do jogo (barra lateral; no celular em pé vira barra de baixo).
 * Mostra os botões do menu e a mochila com os itens já pegos.
 */
export class Sidebar {
  readonly el: HTMLElement;
  private buttons = h('div', { class: 'sb-buttons' });
  private bag = h('div', { class: 'sb-bag' });
  private album = h('div', { class: 'sb-album' });
  private active = false;

  constructor(private openMenu: (tab: string) => void) {
    this.el = h('aside', { id: 'sidebar', class: 'idle' }, h('div', { class: 'sb-logo' }, '☾'), this.buttons, this.album, h('div', { class: 'sb-bag-title' }, 'Mochila'), this.bag);
    document.body.append(this.el);
    EventBus.on('state:changed', () => this.refresh());
    EventBus.on('item:added', (id: string) => this.flash(id));
  }

  /** Cria os botões depois que as texturas carregaram. */
  build(): void {
    this.buttons.replaceChildren(
      ...BUTTONS.map(([tab, label, icon]) => {
        const url = textureURL(`ui-icon-${icon}`);
        return h(
          'button',
          { class: 'sb-btn', title: label, onclick: () => this.active && this.openMenu(tab) },
          url ? h('img', { src: url, alt: '' }) : h('span', { class: 'sb-fallback' }, label[0]),
          h('span', { class: 'sb-label' }, label),
        );
      }),
    );
    this.refresh();
  }

  setActive(on: boolean): void {
    this.active = on;
    this.el.classList.toggle('idle', !on);
    this.refresh();
  }

  refresh(): void {
    if (!this.active) return;
    const items = InventorySystem.list().filter((e) => e.def.category !== 'missao');
    this.bag.replaceChildren(
      ...items.map(({ def, qty }) => {
        const url = textureURL(def.icon);
        return h(
          'button',
          { class: 'sb-item', 'data-id': def.id, title: def.name, onclick: () => this.openMenu('inventario') },
          url ? h('img', { src: url, alt: def.name }) : def.name[0],
          qty > 1 ? h('span', { class: 'sb-qty' }, String(qty)) : null,
        );
      }),
      ...Array.from({ length: Math.max(0, 6 - items.length) }, () => h('div', { class: 'sb-item empty' })),
    );
    const n = GameState.data.memories.length;
    this.album.replaceChildren(h('span', {}, '♥ Lembranças'), h('b', {}, `${n}/${MEMORY_GOAL}`));
  }

  private flash(id: string): void {
    requestAnimationFrame(() => {
      const el = this.bag.querySelector(`[data-id="${id}"]`);
      el?.classList.add('new');
      setTimeout(() => el?.classList.remove('new'), 1400);
    });
  }
}
