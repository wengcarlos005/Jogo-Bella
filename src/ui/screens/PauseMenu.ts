import { h, formatDate, formatPlaytime } from '@/utils/dom';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';
import { InventorySystem } from '@/systems/InventorySystem';
import { MemoryAlbumSystem } from '@/systems/MemoryAlbumSystem';
import { SaveSystem, SettingsStore } from '@/systems/SaveSystem';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { CATEGORY_LABEL } from '@/data/items';
import { MEMORIES, MEMORY_GOAL } from '@/data/memories';
import { REGIONS } from '@/data/regions';
import { dateOrPlaceholder } from '@/data/personal';
import { SAVE_SLOTS } from '@/config/gameConfig';
import type { ItemCategory, RegionId } from '@/core/types';
import { textureURL } from '../textures';

export interface PauseActions {
  travel(region: RegionId): void;
  canTravel(): boolean;
  quitToTitle(): void;
  settingsChanged(): void;
  toast(text: string): void;
}

const TABS = [
  ['missoes', 'Missões'],
  ['inventario', 'Inventário'],
  ['album', 'Álbum'],
  ['mapa', 'Mapa'],
  ['salvar', 'Salvar'],
  ['config', 'Opções'],
] as const;

export type PauseTab = (typeof TABS)[number][0];

export class PauseMenu {
  private el: HTMLDivElement | null = null;
  private body = h('div', { class: 'tab-body' });
  private tab: PauseTab = 'missoes';
  private onClose: (() => void) | null = null;

  constructor(private parent: HTMLElement, private actions: PauseActions) {
    InputSystem.on('pause:menu', () => this.close());
    InputSystem.on('pause:cancel', () => this.close());
  }

  get isOpen(): boolean {
    return !!this.el;
  }

  /** `only` limita as abas (ex.: tela de título mostra só Opções). */
  open(tab: PauseTab = 'missoes', onClose?: () => void, only?: PauseTab[]): void {
    if (this.el) {
      this.select(tab);
      return;
    }
    this.onClose = onClose ?? null;
    AudioSystem.play('menu');
    InputSystem.push('pause');
    InputSystem.releaseAll();
    const tabs = h('div', { class: 'tabs' });
    for (const [id, label] of TABS) {
      if (only && !only.includes(id)) continue;
      tabs.append(h('button', { class: 'tab', 'data-tab': id, onclick: () => this.select(id) }, label));
    }
    tabs.append(h('button', { class: 'tab close', onclick: () => this.close(), 'aria-label': 'Fechar' }, '✕'));
    this.el = h('div', { class: 'screen' }, h('div', { class: 'pause panel' }, tabs, this.body));
    this.el.addEventListener('pointerdown', (e) => {
      if (e.target === this.el) this.close();
    });
    this.parent.append(this.el);
    this.select(tab);
  }

  close(): void {
    if (!this.el) return;
    AudioSystem.play('cancel');
    this.el.remove();
    this.el = null;
    InputSystem.pop('pause');
    this.onClose?.();
  }

  private select(tab: PauseTab): void {
    this.tab = tab;
    this.el?.querySelectorAll('.tab[data-tab]').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.tab === tab));
    this.body.replaceChildren();
    this.body.scrollTop = 0;
    ({
      missoes: () => this.renderQuests(),
      inventario: () => this.renderInventory(),
      album: () => this.renderAlbum(),
      mapa: () => this.renderMap(),
      salvar: () => void this.renderSave(),
      config: () => this.renderSettings(),
    })[tab]();
  }

  private renderQuests(): void {
    const active = QuestSystem.active();
    const done = QuestSystem.completed();
    this.body.append(h('h3', {}, 'Em andamento'));
    if (!active.length) this.body.append(h('p', { class: 'muted' }, 'Nenhuma missão ativa.'));
    for (const q of active) {
      const p = GameState.data.quests[q.id];
      const cur = QuestSystem.currentObjective(q.id);
      const tracked = GameState.data.trackedQuest === q.id;
      this.body.append(
        h(
          'div',
          { class: 'quest-entry' },
          h('div', { class: 'kind' }, `${q.chapter} · ${q.kind}${tracked ? ' · rastreando' : ''}`),
          h('strong', {}, q.title),
          h('div', { class: 'muted' }, q.description),
          h('ul', {}, ...q.objectives.map((o) => h('li', { class: p.done.includes(o.id) ? 'done' : o === cur ? 'current' : '' }, o.text + (o.optional ? ' (opcional)' : '')))),
          cur?.hint ? h('div', { class: 'muted' }, `💡 ${cur.hint}`) : null,
          !tracked
            ? h('button', { class: 'btn small', onclick: () => { GameState.data.trackedQuest = q.id; this.select('missoes'); } }, 'Rastrear')
            : null,
        ),
      );
    }
    if (done.length) {
      this.body.append(h('h3', {}, 'Concluídas'));
      for (const q of done) this.body.append(h('div', { class: 'quest-entry' }, `✔ ${q.title}`));
    }
  }

  private renderInventory(): void {
    const all = InventorySystem.list();
    if (!all.length) {
      this.body.append(h('p', { class: 'muted' }, 'A mochila está vazia por enquanto.'));
      return;
    }
    const cats = [...new Set(all.map((e) => e.def.category))] as ItemCategory[];
    for (const cat of cats) {
      this.body.append(h('h3', {}, CATEGORY_LABEL[cat]));
      const grid = h('div', { class: 'grid' });
      for (const { def, qty } of InventorySystem.list(cat)) {
        const url = textureURL(def.icon);
        grid.append(
          h('div', { class: 'item-card' }, url ? h('img', { src: url, alt: '' }) : null, `${def.name}${qty > 1 ? ` ×${qty}` : ''}`, h('div', { class: 'desc' }, def.description)),
        );
      }
      this.body.append(grid);
    }
  }

  private renderAlbum(): void {
    const n = GameState.data.memories.length;
    this.body.append(
      h('h3', {}, `Álbum de memórias — ${n}/${MEMORY_GOAL}`),
      h('div', { class: 'progress-bar' }, h('div', { style: `width:${(n / MEMORY_GOAL) * 100}%` })),
    );
    for (const r of REGIONS) {
      const mems = MemoryAlbumSystem.byRegion(r.id);
      if (!mems.length) continue;
      this.body.append(h('h3', {}, `${r.name} · ${r.year}`));
      const grid = h('div', { class: 'grid' });
      for (const { def, unlocked } of mems) {
        const url = unlocked ? textureURL(def.image) : null;
        grid.append(
          h(
            'div',
            { class: `memory-card ${unlocked ? '' : 'locked'}` },
            h('div', { class: 'img' }, url ? h('img', { src: url, alt: '' }) : unlocked ? '📷' : '?'),
            h('div', { class: 't' }, unlocked ? def.title : '???'),
            unlocked ? h('div', {}, def.text) : null,
            unlocked ? h('div', { class: 'meta' }, dateOrPlaceholder(def.date ?? '')) : null,
          ),
        );
      }
      this.body.append(grid);
    }
    this.body.append(h('p', { class: 'muted' }, `${MEMORIES.length} lembranças já planejadas — o resto chega com as próximas regiões.`));
  }

  private renderMap(): void {
    this.body.append(h('h3', {}, 'Nossa linha do tempo'));
    const can = this.actions.canTravel();
    REGIONS.forEach((r, i) => {
      const unlocked = GameState.data.regionsUnlocked.includes(r.id);
      const visited = GameState.data.regionsVisited.includes(r.id);
      const available = unlocked && !!r.entryMap;
      this.body.append(
        h(
          'div',
          { class: 'slot' },
          h(
            'div',
            {},
            h('strong', {}, `${i + 1}. ${unlocked ? r.name : '???'}`),
            h('div', { class: 'muted' }, unlocked ? `${r.chapter} · ${r.year} — ${r.subtitle}` : 'Ainda não desbloqueado'),
          ),
          available
            ? h('button', { class: 'btn small', disabled: !can, onclick: () => { this.close(); this.actions.travel(r.id); } }, visited ? 'Viajar' : 'Ir')
            : h('span', { class: 'muted' }, unlocked ? 'Em construção' : '🔒'),
        ),
      );
    });
    if (!can) this.body.append(h('p', { class: 'muted' }, 'Termine a cena atual para poder viajar.'));
  }

  private async renderSave(): Promise<void> {
    const slots = Array.from({ length: SAVE_SLOTS }, (_, i) => `slot${i + 1}`);
    const sums = await SaveSystem.summaries(slots);
    if (this.tab !== 'salvar') return;
    this.body.append(h('h3', {}, 'Salvar jogo'), h('p', { class: 'muted' }, `Tempo de jogo: ${formatPlaytime(GameState.data.playtimeMs)} · O jogo também salva sozinho.`));
    const list = h('div', { class: 'slots' });
    slots.forEach((slot, i) => {
      const s = sums[i];
      list.append(
        h(
          'div',
          { class: 'slot' },
          h('div', {}, h('strong', {}, `Espaço ${i + 1}`), h('div', { class: 'muted' }, s ? `${formatDate(s.savedAt)} · ${formatPlaytime(s.playtimeMs)} · ${s.memories} lembranças` : 'Vazio')),
          h('button', {
            class: 'btn small',
            onclick: async () => {
              await SaveSystem.save(slot);
              AudioSystem.play('confirm');
              this.actions.toast('Jogo salvo!');
              this.select('salvar');
            },
          }, 'Salvar'),
        ),
      );
    });
    this.body.append(list, h('p', {}, h('button', { class: 'btn small', onclick: () => { this.close(); this.actions.quitToTitle(); } }, 'Voltar ao título')));
  }

  private renderSettings(): void {
    const s = SettingsStore.data;
    const range = (label: string, key: 'musicVolume' | 'sfxVolume') => {
      const input = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s[key] }) as HTMLInputElement;
      input.addEventListener('input', () => {
        s[key] = Number(input.value);
        SettingsStore.save();
        AudioSystem.applyVolumes();
      });
      input.addEventListener('change', () => AudioSystem.play('blip'));
      return h('div', { class: 'setting-row' }, h('span', {}, label), input);
    };
    const select = <K extends 'textSpeed' | 'touchControls'>(label: string, key: K, opts: [string, string][]) => {
      const sel = h('select', {}, ...opts.map(([v, l]) => h('option', { value: v, selected: s[key] === v }, l))) as HTMLSelectElement;
      sel.addEventListener('change', () => {
        (s as unknown as Record<string, string>)[key] = sel.value;
        SettingsStore.save();
        this.actions.settingsChanged();
      });
      return h('div', { class: 'setting-row' }, h('span', {}, label), sel);
    };
    this.body.append(
      h('h3', {}, 'Opções'),
      range('Música', 'musicVolume'),
      range('Efeitos', 'sfxVolume'),
      select('Velocidade do texto', 'textSpeed', [['lenta', 'Lenta'], ['normal', 'Normal'], ['rapida', 'Rápida']]),
      select('Controles de toque', 'touchControls', [['auto', 'Automático'], ['sempre', 'Sempre'], ['nunca', 'Nunca']]),
      h('h3', {}, 'Controles'),
      h('p', { class: 'muted' }, 'Mover: WASD / setas · Correr: Shift · Interagir: E, Espaço ou Enter · Menu: Esc ou M'),
    );
  }
}
