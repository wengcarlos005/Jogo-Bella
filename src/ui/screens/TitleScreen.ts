import { decorateTitle, hideLoader } from './TitleFx';
import { h, formatDate, formatPlaytime } from '@/utils/dom';
import { SaveSystem, AUTOSAVE_SLOT } from '@/systems/SaveSystem';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { GAME_TITLE, SAVE_SLOTS, VERSION } from '@/config/gameConfig';
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
    const full = textureURL('ui-title-full');
    if (full) {
      this.openFull(full, latest);
      return;
    }
    hideLoader();
    const logo = textureURL('ui-logo');
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
      { class: 'screen title-screen' },
      h(
        'div',
        { class: 'title-panel' },
        hearts,
        logo
          ? h('img', { class: 'title-logo-img', src: logo, alt: GAME_TITLE })
          : h('div', { class: 'title-logo' }, h('span', { class: 'title-small' }, 'A Lua está'), h('br'), 'Bella', h('span', { class: 'amp' }, ' ☾')),
        h('div', { class: 'title-sub' }, 'Bella ♥ Weng · 3 anos'),
        list,
      ),
      h('div', { class: 'version' }, `v${VERSION}`),
    );
    this.parent.append(this.el);
  }

  private keyHandlers: [string, () => void][] = [];

  /** Tela de título ilustrada: a arte já traz logo e botões; aqui só as áreas clicáveis. */
  private openFull(art: string, latest: SaveData | null): void {
    const choose = (fn: () => void) => () => {
      AudioSystem.unlock();
      AudioSystem.play('confirm');
      fn();
    };
    // posições medidas na arte (1672x941), em %. A arte é espelhada: logo e botões à direita
    const spots: { label: string; top: number; left: number; w: number; fn: (() => void) | null }[] = [
      { label: 'Continuar', top: 46.8, left: 63.6, w: 25.4, fn: latest ? () => this.actions.load(latest) : null },
      {
        label: 'Novo jogo',
        top: 56.9,
        left: 63.9,
        w: 24.5,
        fn: () => {
          if (latest && !confirm('Começar um novo jogo? Seu progresso salvo continua nos espaços de save.')) return;
          this.actions.newGame();
        },
      },
      { label: 'Carregar', top: 65.9, left: 63.9, w: 24.5, fn: () => void this.openLoad() },
      { label: 'Opções', top: 75.5, left: 63.9, w: 24.5, fn: () => this.actions.openSettings() },
    ];
    const buttons = spots.map((s) =>
      h('button', {
        class: `tf-spot ${s.fn ? '' : 'off'}`,
        'aria-label': s.label,
        title: s.label,
        style: `top:${s.top}%;left:${s.left}%;width:${s.w}%;height:8.4%`,
        disabled: !s.fn,
        onclick: s.fn ? choose(s.fn) : undefined,
      }),
    );
    let sel = latest ? 0 : 1;
    const render = () => buttons.forEach((b, i) => b.classList.toggle('sel', i === sel));
    buttons.forEach((b, i) => b.addEventListener('mouseenter', () => { if (spots[i].fn) { sel = i; render(); } }));
    const move = (d: number) => {
      do sel = (sel + d + spots.length) % spots.length;
      while (!spots[sel].fn);
      AudioSystem.play('blip');
      render();
    };
    this.keyHandlers = [
      ['title:up', () => move(-1)],
      ['title:down', () => move(1)],
      ['title:interact', () => buttons[sel].click()],
    ];
    for (const [ev, fn] of this.keyHandlers) InputSystem.on(ev, fn);
    render();
    this.el = h(
      'div',
      { class: 'screen title-full' },
      h('img', { class: 'tf-art', src: art, alt: GAME_TITLE }),
      h('div', { class: 'tf-glow' }),
      ...buttons,
      h('div', { class: 'version' }, `v${VERSION}`),
    );
    this.parent.append(this.el);
    const ready = hideLoader();
    this.undoFx = decorateTitle(this.el, art, buttons, ready);
  }

  private undoFx: (() => void) | null = null;

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
    this.undoFx?.();
    this.undoFx = null;
    for (const [ev, fn] of this.keyHandlers) InputSystem.off(ev, fn);
    this.keyHandlers = [];
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    InputSystem.pop('title');
  }
}
