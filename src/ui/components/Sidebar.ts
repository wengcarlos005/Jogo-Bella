import { h } from '@/utils/dom';
import { EventBus } from '@/core/EventBus';
import { InventorySystem } from '@/systems/InventorySystem';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';
import { MEMORY_GOAL } from '@/data/memories';
import { REGIONS } from '@/data/regions';
import { getMap } from '@/regions';
import { textureURL } from '../textures';

const BUTTONS: [tab: string, label: string, icon: string][] = [
  ['missoes', 'Missões', 'lua'],
  ['inventario', 'Mochila', 'mochila'],
  ['album', 'Álbum', 'album'],
  ['mapa', 'Mapa', 'mapa'],
  ['salvar', 'Salvar', 'salvar'],
  ['config', 'Opções', 'opcoes'],
  ['cenas', 'Cenas', 'cenas'],
  ['sair', 'Sair', 'sair'],
];

/**
 * Menu FORA da tela do jogo, nas bordas:
 *  - em cima: lugar atual, missão e lembranças;
 *  - à esquerda: a mochila com os itens pegos;
 *  - à direita: os botões do menu.
 */
export class Sidebar {
  private top = h('header', { id: 'topbar', class: 'idle' });
  private left = h('footer', { id: 'hotbar', class: 'idle' });
  private tip = h('div', { class: 'sb-float-tip' });
  private pickTip = h('div', { class: 'sb-pick-tip' });
  private pickResolve: ((id: string) => void) | null = null;

  /** Espera o jogador clicar num item da barra de itens (ex.: escolher um presente). */
  pick(prompt: string): Promise<string> {
    const done = new Promise<string>((r) => (this.pickResolve = r));
    // durante a escolha, os itens de missão (presentes, etc.) também aparecem na barra
    this.refresh(true);
    this.left.classList.add('picking');
    this.pickTip.textContent = prompt;
    document.body.append(this.pickTip);
    return done;
  }
  private right = h('aside', { id: 'rightbar', class: 'idle' });
  private bag = h('div', { class: 'sb-bag' });
  private active = false;

  constructor(private openMenu: (tab: string) => void) {
    this.left.append(this.bag);
    document.body.append(this.top, this.left, this.right, this.tip);
    EventBus.on('state:changed', () => this.refresh());
    EventBus.on('item:added', (id: string) => this.flash(id));
  }

  /** Cria os botões depois que as texturas carregaram. */
  build(): void {
    // peças do kit de interface (assets/ui/hud-*.png) como variáveis de CSS
    const ui = (f: string) => `url("${new URL(`assets/ui/${f}`, document.baseURI).href}")`;
    const de = document.documentElement.style;
    for (const k of ['topbar', 'plaque', 'scroll', 'frame', 'hotbar', 'heart-full', 'heart-empty', 'heart-half']) de.setProperty(`--hud-${k}`, ui(`hud-${k}.png`));
    document.documentElement.classList.add('hud-kit');
    this.right.replaceChildren(
      ...BUTTONS.map(([tab, label, icon]) =>
        h(
          'button',
          { class: 'sb-btn sb-kit', title: label, 'aria-label': label, onclick: () => this.active && this.openMenu(tab) },
          h('img', { src: new URL(`assets/ui/hud-btn-${icon}.png`, document.baseURI).href, alt: '' }),
          h('span', { class: 'sb-label' }, label),
        ),
      ),
    );
    this.refresh();
  }

  setActive(on: boolean): void {
    this.active = on;
    for (const el of [this.top, this.left, this.right]) el.classList.toggle('idle', !on);
    this.refresh();
  }

  refresh(force = false): void {
    if (!this.active && !force) return;
    // mochila
    const items = InventorySystem.list().filter((e) => this.pickResolve || e.def.category !== 'missao');
    this.bag.replaceChildren(
      ...items.map(({ def, qty }) => {
        const url = textureURL(def.icon);
        const btn = h(
          'button',
          {
            class: 'sb-item',
            'data-id': def.id,
            'aria-label': def.name,
            onclick: () => {
              if (this.pickResolve) {
                const r = this.pickResolve;
                this.pickResolve = null;
                this.left.classList.remove('picking');
                this.pickTip.remove();
                this.tip.classList.remove('show');
                r(def.id);
                this.refresh(true);
                return;
              }
              this.openMenu('inventario');
            },
          },
          url ? h('img', { src: url, alt: def.name }) : def.name[0],
          qty > 1 ? h('span', { class: 'sb-qty' }, String(qty)) : null,
        );
        // nome do item numa etiqueta flutuante (a barra corta o que passa da borda)
        btn.addEventListener('pointerenter', () => {
          const r = btn.getBoundingClientRect();
          this.tip.replaceChildren(h('b', {}, def.name), h('span', {}, def.description));
          this.tip.style.left = `${r.left + r.width / 2}px`;
          this.tip.style.top = `${r.top - 8}px`;
          this.tip.classList.add('show');
        });
        btn.addEventListener('pointerleave', () => this.tip.classList.remove('show'));
        return btn;
      }),
      ...Array.from({ length: Math.max(0, 12 - items.length) }, () => h('div', { class: 'sb-item empty' })),
    );
    // barra de cima
    let place = '';
    try {
      const map = getMap(GameState.data.mapId);
      const region = REGIONS.find((r) => r.id === map.region);
      place = region && region.name !== map.name ? `${region.name} · ${map.name}` : map.name;
    } catch {
      place = '';
    }
    const tracked = GameState.data.trackedQuest;
    const obj = tracked ? QuestSystem.currentObjective(tracked) : null;
    const n = GameState.data.memories.length;
    const nerves = Number(GameState.getFlag<number>('nervosismo') ?? 0);
    const filled = Math.ceil(nerves / 20);
    const heart =
      nerves > 0
        ? h(
            'div',
            { class: 'tb-nerves' },
            h('span', { class: `nerves-hearts ${nerves >= 60 ? 'fast' : nerves >= 30 ? 'mid' : ''}` }, ...Array.from({ length: 5 }, (_, i) => h('span', { class: i < filled ? 'on' : '' }))),
            h('span', { class: 'tb-nerves-txt' }, nerves >= 80 ? 'Muito nervosa' : nerves >= 50 ? 'Nervosa' : nerves >= 20 ? 'Quase calma' : 'Tranquila'),
          )
        : '';
    // encantômetro da Meli (só no apê, enquanto ela está sendo conquistada)
    const enc = Number(GameState.getFlag<number>('meli-encanto') ?? 0);
    const showEnc = GameState.data.mapId === 'duque-apto' && QuestSystem.isActive('dq-m1');
    const encEl = showEnc
      ? h(
          'div',
          { class: `tb-encanto ${enc >= 100 ? 'full' : ''}`, title: 'Encantômetro da Meli' },
          h('span', { class: 'tb-enc-cat', style: `background-image:url(${textureURL('meli-poses') ?? ''});background-position:${(enc >= 100 ? 3 : enc >= 30 ? 0 : 2) * (100 / 3)}% 0` }),
          // corações do kit (igual ao medidor de nervosismo): 5 corações, meio coração a cada 10%
          h('span', { class: 'tb-enc-hearts' }, ...Array.from({ length: 5 }, (_, i) => h('span', { class: enc >= (i + 1) * 20 ? 'on' : enc >= i * 20 + 10 ? 'half' : '' }))),
          h('span', { class: 'tb-enc-txt' }, enc >= 100 ? 'Apaixonada ♥' : enc >= 55 ? 'Brincalhona' : enc >= 30 ? 'Curiosa' : enc > 0 ? 'Desconfiada' : 'Escondida'),
        )
      : '';
    this.top.replaceChildren(
      h('div', { class: 'tb-place' }, h('span', { class: 'tb-moon' }, '☾'), place),
      heart,
      encEl,
      h('div', { class: 'tb-spacer' }),
      obj ? h('div', { class: 'tb-quest', title: `${QuestSystem.def(tracked!).title}: ${obj.text}` }, h('span', { class: 'tb-qheart' }, '♥ '), h('span', { class: 'tb-qtext' }, obj.text)) : '',
      h('div', { class: 'tb-spacer' }),
      h('div', { class: 'tb-mem' }, h('span', { class: 'tb-album' }), 'Lembranças ', h('b', {}, `${n}/${MEMORY_GOAL}`)),
    );
  }

  private flash(id: string): void {
    requestAnimationFrame(() => {
      const el = this.bag.querySelector(`[data-id="${id}"]`);
      el?.classList.add('new');
      setTimeout(() => el?.classList.remove('new'), 1400);
    });
  }
}
