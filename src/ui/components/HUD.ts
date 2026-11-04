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

  private peekTimer = 0;
  private lastNerves = -1;

  /** Mostra o cartão de missão por alguns segundos e depois esconde. */
  peek(ms = 5000): void {
    this.card.classList.remove('peek-out');
    clearTimeout(this.peekTimer);
    this.peekTimer = window.setTimeout(() => this.card.classList.add('peek-out'), ms);
  }

  show(on: boolean): void {
    this.el.classList.toggle('hidden', !on);
    if (on) {
      this.refresh();
      this.peek(6000);
    }
  }

  /** Linha compacta do nervosismo (dentro do cartão de missão). */
  private nervesRow(): HTMLElement | null {
    const v = Number(GameState.getFlag<number>('nervosismo') ?? 0);
    if (v <= 0) return null;
    const filled = Math.ceil(v / 20);
    return h(
      'div',
      { class: 'nerves-row' },
      h('span', { class: `nerves-hearts ${v >= 60 ? 'fast' : v >= 30 ? 'mid' : ''}` }, ...Array.from({ length: 5 }, (_, i) => h('span', { class: i < filled ? 'on' : '' }, '♥'))),
      h('span', { class: 'nerves-state' }, v >= 80 ? 'Muito nervosa' : v >= 50 ? 'Nervosa' : v >= 20 ? 'Quase calma' : 'Tranquila'),
    );
  }

  refresh(): void {
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
      this.nervesRow() ?? "",
    );
    this.card.classList.remove('hidden');
    if (this.lastObjective && this.lastObjective !== obj.id) {
      this.card.classList.remove('flash');
      void this.card.offsetWidth;
      this.card.classList.add('flash');
    }
    const nerves = Number(GameState.getFlag<number>('nervosismo') ?? 0);
    if (this.lastObjective !== obj.id || nerves !== this.lastNerves) this.peek();
    this.lastNerves = nerves;
    this.lastObjective = obj.id;
  }

  /** Mostra o prompt "E  Falar" sobre um ponto da tela (coordenadas em px do jogo). */
  setPrompt(label: string | null, gx = 0, gy = 0, touch = false): void {
    if (!label) {
      this.prompt.classList.add('hidden');
      return;
    }
    this.prompt.innerHTML = touch ? label : `<b>E</b> ${label}`;
    const x = Math.max(30, Math.min(450, gx));
    const y = Math.max(52, Math.min(200, gy));
    this.prompt.style.left = `calc(var(--u) * ${x})`;
    this.prompt.style.top = `calc(var(--u) * ${y})`;
    this.prompt.classList.remove('hidden');
  }

  showBanner(chapter: string, name: string, sub: string): void {
    this.banner.replaceChildren(h('div', { class: 'chapter' }, chapter), h('div', { class: 'name' }, name), h('div', { class: 'sub' }, sub));
    this.banner.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => this.banner.classList.remove('show'), 4800);
  }
}
