import { h } from '@/utils/dom';
import { EventBus } from '@/core/EventBus';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';
import { ICON } from '../icons';
import { textureURL } from '../textures';

export interface HUDActions {
  openMenu(tab?: string): void;
}

/** HUD: cartão da missão rastreada, botões rápidos, prompt de interação e banner de região. */
export class HUD {
  readonly el: HTMLDivElement;
  private card = h('div', { class: 'quest-card panel hidden' });
  private prompt = h('div', { class: 'prompt hidden' });
  private nerves = h('div', { class: 'nerves panel hidden' });
  private banner = h('div', { class: 'region-banner' });
  private bannerTimer = 0;
  private lastObjective = '';

  constructor(parent: HTMLElement, actions: HUDActions) {
    const btn = (icon: string, title: string, tab: string, art: string) =>
      h('button', { class: 'icon-btn', title, 'aria-label': title, 'data-art': art, html: icon, onclick: () => actions.openMenu(tab) });
    this.card.addEventListener('click', () => actions.openMenu('missoes'));
    this.el = h(
      'div',
      { class: 'hud hidden' },
      this.card,
      h(
        'div',
        { class: 'hud-buttons' },
        btn(ICON.album, 'Álbum', 'album', 'album'),
        btn(ICON.bag, 'Inventário', 'inventario', 'mochila'),
        btn(ICON.map, 'Mapa', 'mapa', 'mapa'),
        btn(ICON.menu, 'Menu', 'missoes', 'lua'),
      ),
      this.nerves,
      this.prompt,
      this.banner,
    );
    parent.append(this.el);
    EventBus.on('state:changed', () => this.refresh());
    EventBus.on('quest:objective', () => this.card.classList.remove('flash'));
  }

  /** Troca os ícones SVG pelos ícones ilustrados (ui/icon-*.png), se existirem. */
  applyIcons(): void {
    this.el.querySelectorAll<HTMLButtonElement>('.icon-btn[data-art]').forEach((b) => {
      const url = textureURL(`ui-icon-${b.dataset.art}`);
      if (!url) return;
      b.classList.add('art');
      b.replaceChildren(h('img', { src: url, alt: '' }));
    });
  }

  show(on: boolean): void {
    this.el.classList.toggle('hidden', !on);
    if (on) this.refresh();
  }

  private refreshNerves(): void {
    const v = Number(GameState.getFlag<number>('nervosismo') ?? 0);
    this.nerves.classList.toggle('hidden', v <= 0);
    if (v <= 0) return;
    const filled = Math.ceil(v / 20);
    this.nerves.replaceChildren(
      h('div', { class: 'nerves-label' }, 'Coração da Bella'),
      h('div', { class: `nerves-hearts ${v >= 60 ? 'fast' : v >= 30 ? 'mid' : ''}` }, ...Array.from({ length: 5 }, (_, i) => h('span', { class: i < filled ? 'on' : '' }, '♥'))),
      h('div', { class: 'nerves-state' }, v >= 80 ? 'Muito nervosa' : v >= 50 ? 'Nervosa' : v >= 20 ? 'Quase calma' : 'Tranquila'),
    );
  }

  refresh(): void {
    this.refreshNerves();
    const id = GameState.data.trackedQuest;
    const obj = id ? QuestSystem.currentObjective(id) : null;
    if (!id || !obj) {
      this.card.classList.add('hidden');
      return;
    }
    const q = QuestSystem.def(id);
    const p = GameState.data.quests[id];
    const dots = q.objectives.map((o) => h('span', { class: `dot ${p.done.includes(o.id) ? 'on' : ''}` }));
    const { done, total } = QuestSystem.progress(id);
    this.card.replaceChildren(
      h('span', { class: 'tag' }, q.chapter),
      h('div', { class: 'title' }, q.title),
      h('div', { class: 'obj' }, obj.text),
      h('div', { class: 'dots' }, ...dots, ` ${done}/${total}`),
    );
    this.card.classList.remove('hidden');
    if (this.lastObjective && this.lastObjective !== obj.id) {
      this.card.classList.remove('flash');
      void this.card.offsetWidth;
      this.card.classList.add('flash');
    }
    this.lastObjective = obj.id;
  }

  /** Mostra o prompt "E  Falar" sobre um ponto da tela (coordenadas em px do jogo). */
  setPrompt(label: string | null, gx = 0, gy = 0, touch = false): void {
    if (!label) {
      this.prompt.classList.add('hidden');
      return;
    }
    this.prompt.innerHTML = touch ? label : `<b>E</b> ${label}`;
    this.prompt.style.left = `calc(var(--u) * ${gx})`;
    this.prompt.style.top = `calc(var(--u) * ${gy})`;
    this.prompt.classList.remove('hidden');
  }

  showBanner(chapter: string, name: string, sub: string): void {
    this.banner.replaceChildren(h('div', { class: 'chapter' }, chapter), h('div', { class: 'name' }, name), h('div', { class: 'sub' }, sub));
    this.banner.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => this.banner.classList.remove('show'), 2800);
  }
}
