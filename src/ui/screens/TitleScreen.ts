import { h, formatDate, formatPlaytime } from '@/utils/dom';
import { SaveSystem, AUTOSAVE_SLOT } from '@/systems/SaveSystem';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { SAVE_SLOTS, VERSION } from '@/config/gameConfig';
import type { SaveData } from '@/core/types';
import { textureURL } from '../textures';

export interface TitleActions {
  newGame(): void;
  load(data: SaveData): void;
  openSettings(): void;
}

const ALL_SLOTS = [AUTOSAVE_SLOT, ...Array.from({ length: SAVE_SLOTS }, (_, i) => `slot${i + 1}`)];

export class TitleScreen {
  private el: HTMLDivElement | null = null;

  constructor(private parent: HTMLElement, private actions: TitleActions) {}

  async open(): Promise<void> {
    this.close();
    InputSystem.push('title');
    const latest = await SaveSystem.latest(ALL_SLOTS);
    const art = textureURL('ui-title-art');
    const hearts = h('div', { class: 'title-hearts' }, ...Array.from({ length: 9 }, (_, i) => h('span', { class: i < 3 ? '' : 'off' }, '♥')));
    const list = h('div', { class: 'menu-list' });
    const btn = (label: string, fn: () => void, primary = false) =>
      h('button', { class: `btn ${primary ? 'primary' : ''}`, onclick: () => { AudioSystem.unlock(); AudioSystem.play('confirm'); fn(); } }, label);

    if (latest) list.append(btn('Continuar', () => this.actions.load(latest), true));
    list.append(
      btn('Novo jogo', () => {
        if (latest && !confirm('Começar um novo jogo? Seu progresso salvo continua nos espaços de save.')) return;
        this.actions.newGame();
      }, !latest),
    );
    list.append(btn('Carregar', () => void this.openLoad()));
    list.append(btn('Opções', () => this.actions.openSettings()));

    this.el = h(
      'div',
      { class: 'screen opaque' },
      hearts,
      art ? h('img', { class: 'title-art', src: art, alt: '' }) : null,
      h('div', { class: 'title-logo' }, 'Bella ', h('span', { class: 'amp' }, '&'), ' Weng'),
      h('div', { class: 'title-sub' }, 'Nossa História'),
      list,
      h('div', { class: 'version' }, `v${VERSION}`),
    );
    this.parent.append(this.el);
  }

  private async openLoad(): Promise<void> {
    const sums = await SaveSystem.summaries(ALL_SLOTS);
    const list = h('div', { class: 'slots', style: 'min-width:min(90%,520px)' });
    sums.forEach((s, i) => {
      const slot = ALL_SLOTS[i];
      const label = slot === AUTOSAVE_SLOT ? 'Automático' : `Espaço ${i}`;
      list.append(
        h(
          'div',
          { class: 'slot', style: 'color:var(--ink)' },
          h('div', {}, h('strong', {}, label), h('div', { class: 'muted' }, s ? `${formatDate(s.savedAt)} · ${formatPlaytime(s.playtimeMs)}` : 'Vazio')),
          h('button', {
            class: 'btn small',
            disabled: !s,
            onclick: async () => {
              const d = await SaveSystem.read(slot);
              if (d) this.actions.load(d);
            },
          }, 'Carregar'),
        ),
      );
    });
    const panel = h('div', { class: 'screen' }, h('div', { class: 'title-sub' }, 'Carregar jogo'), list, h('p', {}, h('button', { class: 'btn small', onclick: () => panel.remove() }, 'Voltar')));
    this.el?.append(panel);
  }

  close(): void {
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    InputSystem.pop('title');
  }
}
