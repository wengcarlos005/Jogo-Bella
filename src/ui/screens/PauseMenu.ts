import { h, formatDate, formatPlaytime } from '@/utils/dom';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';
import { InventorySystem } from '@/systems/InventorySystem';
import { MemoryAlbumSystem } from '@/systems/MemoryAlbumSystem';
import { SaveSystem, SettingsStore } from '@/systems/SaveSystem';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { CATEGORY_LABEL } from '@/data/items';
import { MEMORY_GOAL } from '@/data/memories';
import { REGIONS } from '@/data/regions';
import { dateOrPlaceholder } from '@/data/personal';
import { SAVE_SLOTS } from '@/config/gameConfig';
import type { RegionId } from '@/core/types';
import { textureURL } from '../textures';
import { MAPS } from '@/regions';
import { SceneCheckpoints, type Cena } from '@/systems/SceneCheckpoints';

export interface PauseActions {
  travel(region: RegionId): void;
  canTravel(): boolean;
  quitToTitle(): void;
  playScene(c: Cena): void;
  settingsChanged(): void;
  toast(text: string): void;
}

const TABS = [
  ['missoes', 'Missões', 'lua'],
  ['inventario', 'Mochila', 'mochila'],
  ['album', 'Álbum', 'album'],
  ['mapa', 'Mapa', 'mapa'],
  ['salvar', 'Salvar', 'salvar'],
  ['config', 'Opções', 'opcoes'],
  ['cenas', 'Cenas', 'cenas'],
  ['sair', 'Sair', 'sair'],
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
    for (const [id, label, icon] of TABS) {
      if (only && !only.includes(id)) continue;
      const url = textureURL(`ui-icon-${icon}`);
      tabs.append(
        h('button', { class: 'tab pm-tab', 'data-tab': id, onclick: () => { AudioSystem.play('blip'); this.select(id); } }, url ? h('img', { src: url, alt: '' }) : null, h('span', {}, label)),
      );
    }
    tabs.append(h('button', { class: 'tab close', onclick: () => this.close(), 'aria-label': 'Fechar' }, '✕'));
    this.el = h('div', { class: 'screen pm-screen' }, h('div', { class: 'pause panel pm' }, tabs, this.body));
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
    this.body.classList.remove('pm-in');
    void this.body.offsetWidth;
    this.body.classList.add('pm-in');
    ({
      missoes: () => this.renderQuests(),
      inventario: () => this.renderInventory(),
      album: () => this.renderAlbum(),
      mapa: () => this.renderMap(),
      salvar: () => void this.renderSave(),
      config: () => this.renderSettings(),
      cenas: () => this.renderScenes(),
      sair: () => this.renderQuit(),
    })[tab]();
  }

  /** Cabeçalho de cada aba: título, frase e chips de resumo. */
  private header(title: string, sub: string, chips: string[] = []): HTMLElement {
    return h(
      'div',
      { class: 'pm-head' },
      h('div', {}, h('div', { class: 'pm-title' }, title), h('div', { class: 'pm-sub' }, sub)),
      h('div', { class: 'pm-chips' }, ...chips.map((c) => h('span', { class: 'pm-chip' }, c))),
    );
  }

  private renderQuests(): void {
    const active = QuestSystem.active();
    const done = QuestSystem.completed();
    this.body.append(this.header('Missões', 'O que vem por aí na nossa história', [`${active.length} em andamento`, `${done.length} concluída${done.length === 1 ? '' : 's'}`]));
    if (!active.length) this.body.append(h('div', { class: 'pm-empty' }, 'Nenhuma missão agora. Explore e converse com todo mundo!'));
    for (const q of active) {
      const p = GameState.data.quests[q.id];
      const cur = QuestSystem.currentObjective(q.id);
      const tracked = GameState.data.trackedQuest === q.id;
      const total = q.objectives.filter((o) => !o.optional).length;
      const n = q.objectives.filter((o) => !o.optional && p.done.includes(o.id)).length;
      const pct = total ? n / total : 0;
      const ring = h('div', { class: 'pm-ring', style: `--p:${pct}` }, h('span', {}, `${n}/${total}`));
      const list = h(
        'ul',
        { class: 'pm-checks' },
        ...q.objectives.map((o, i) => {
          const isDone = p.done.includes(o.id);
          const isCur = o === cur;
          return h(
            'li',
            { class: `pm-check ${isDone ? 'done' : ''} ${isCur ? 'cur' : ''}`, style: `animation-delay:${i * 40}ms` },
            h('span', { class: 'box' }, isDone ? '♥' : isCur ? '➜' : ''),
            h('span', { class: 'txt' }, o.text + (o.optional ? ' (opcional)' : '')),
          );
        }),
      );
      const wengPic = textureURL('portrait-weng');
      this.body.append(
        h(
          'div',
          { class: `pm-quest ${tracked ? 'tracked' : ''}` },
          h(
            'div',
            { class: 'pm-qtop' },
            ring,
            h(
              'div',
              { class: 'pm-qinfo' },
              h('div', { class: 'pm-kicker' }, `${q.chapter} · ${q.kind === 'principal' ? '★ Principal' : '✿ Secundária'}`),
              h('div', { class: 'pm-qtitle' }, q.title),
              h('div', { class: 'pm-qdesc' }, q.description),
            ),
            tracked
              ? h('span', { class: 'pm-badge' }, 'Seguindo')
              : h('button', { class: 'btn small', onclick: () => { GameState.data.trackedQuest = q.id; AudioSystem.play('confirm'); this.select('missoes'); } }, 'Seguir'),
          ),
          list,
          cur?.hint ? h('div', { class: 'pm-hint' }, wengPic ? h('img', { src: wengPic, alt: '' }) : null, h('div', { class: 'bubble' }, h('b', {}, 'Dica: '), cur.hint)) : null,
        ),
      );
    }
    if (done.length) {
      this.body.append(h('div', { class: 'pm-section' }, 'Concluídas'));
      this.body.append(h('div', { class: 'pm-stamps' }, ...done.map((q) => h('div', { class: 'pm-stamp' }, h('span', { class: 'seal' }, '♥'), q.title))));
    }
  }

  private invSel = '';

  private renderInventory(): void {
    const all = InventorySystem.list();
    const total = all.reduce((a, e) => a + e.qty, 0);
    this.body.append(this.header('Mochila', 'Tudo o que a gente juntou pelo caminho', [`${all.length} tipos`, `${total} itens`]));
    const SLOTS = Math.max(24, Math.ceil(all.length / 8) * 8);
    const detail = h('div', { class: 'pm-detail' });
    const showDetail = (i: number) => {
      const e = all[i];
      grid.querySelectorAll('.pm-slot').forEach((el, k) => el.classList.toggle('sel', k === i));
      if (!e) {
        detail.replaceChildren(h('div', { class: 'pm-detail-empty' }, h('div', {}, 'Escolha um item pra ver de pertinho.')));
        return;
      }
      this.invSel = e.def.id;
      const url = textureURL(e.def.icon);
      detail.replaceChildren(
        h('div', { class: 'pm-detail-art' }, h('div', { class: 'rays' }), url ? h('img', { src: url, alt: '' }) : null),
        h('div', { class: 'pm-detail-name' }, e.def.name),
        h('div', { class: 'pm-detail-cat' }, `${CATEGORY_LABEL[e.def.category]}${e.qty > 1 ? ` · ×${e.qty}` : ''}`),
        h('div', { class: 'pm-detail-desc' }, e.def.description),
      );
      detail.classList.remove('pop');
      void detail.offsetWidth;
      detail.classList.add('pop');
    };
    const grid = h('div', { class: 'pm-grid' });
    for (let i = 0; i < SLOTS; i++) {
      const e = all[i];
      const url = e ? textureURL(e.def.icon) : null;
      const slot = h(
        'button',
        { class: `pm-slot ${e ? 'full' : ''}`, title: e?.def.name ?? '', style: `animation-delay:${i * 18}ms` },
        url ? h('img', { src: url, alt: '' }) : null,
        e && e.qty > 1 ? h('span', { class: 'qty' }, String(e.qty)) : null,
      );
      if (e) {
        slot.addEventListener('mouseenter', () => showDetail(i));
        slot.addEventListener('click', () => { AudioSystem.play('blip'); showDetail(i); });
      }
      grid.append(slot);
    }
    this.body.append(h('div', { class: 'pm-inv' }, grid, detail));
    const start = Math.max(0, all.findIndex((e) => e.def.id === this.invSel));
    showDetail(all.length ? start : -1);
  }

  private renderAlbum(): void {
    const n = GameState.data.memories.length;
    const hearts = h('div', { class: 'pm-hearts' }, ...Array.from({ length: 10 }, (_, i) => h('span', { class: i < Math.round((n / MEMORY_GOAL) * 10) ? 'on' : '' }, '♥')));
    this.body.append(this.header('Álbum de memórias', 'Cada momento que a gente viveu junto', [`${n}/${MEMORY_GOAL} lembranças`]), hearts);
    for (const r of REGIONS) {
      const mems = MemoryAlbumSystem.byRegion(r.id);
      if (!mems.length) continue;
      const got = mems.filter((m) => m.unlocked).length;
      this.body.append(h('div', { class: 'pm-section' }, `${r.name} · ${r.year}`, h('span', { class: 'pm-count' }, `${got}/${mems.length}`)));
      const grid = h('div', { class: 'pm-polas' });
      mems.forEach(({ def, unlocked }, i) => {
        const url = unlocked ? textureURL(def.image) : null;
        const rot = ((i * 37) % 7) - 3;
        const card = h(
          'button',
          { class: `pm-pola ${unlocked ? '' : 'locked'}`, style: `--r:${rot}deg;animation-delay:${i * 50}ms` },
          h('span', { class: 'tape' }),
          h('div', { class: 'ph' }, url ? h('img', { src: url, alt: '' }) : h('span', {}, unlocked ? 'foto em breve' : '?')),
          h('div', { class: 'cap' }, unlocked ? def.title : '???'),
        );
        if (unlocked) card.addEventListener('click', () => this.openMemory(def.title, def.text, url, dateOrPlaceholder(def.date ?? '')));
        grid.append(card);
      });
      this.body.append(grid);
    }
  }

  private openMemory(title: string, text: string, url: string | null, date: string): void {
    AudioSystem.play('confirm');
    const box = h(
      'div',
      { class: 'pm-light' },
      h(
        'div',
        { class: 'pm-light-card' },
        url ? h('img', { src: url, alt: '' }) : null,
        h('div', { class: 'pm-light-title' }, title),
        h('div', { class: 'pm-light-text' }, text),
        h('div', { class: 'pm-light-date' }, date),
        h('button', { class: 'btn small', onclick: () => box.remove() }, 'Fechar'),
      ),
    );
    box.addEventListener('pointerdown', (e) => { if (e.target === box) box.remove(); });
    this.el?.append(box);
  }

  private renderMap(): void {
    const unlocked = REGIONS.filter((r) => GameState.data.regionsUnlocked.includes(r.id)).length;
    this.body.append(this.header('Nossa linha do tempo', 'Os lugares da nossa história, em ordem', [`${unlocked}/${REGIONS.length} lugares`]));
    const can = this.actions.canTravel();
    const trail = h('div', { class: 'pm-trail' });
    REGIONS.forEach((r, i) => {
      const isUnlocked = GameState.data.regionsUnlocked.includes(r.id);
      const visited = GameState.data.regionsVisited.includes(r.id);
      const available = isUnlocked && !!r.entryMap;
      trail.append(
        h(
          'div',
          { class: `pm-stop ${isUnlocked ? 'open' : 'lock'} ${visited ? 'visited' : ''}`, style: `animation-delay:${i * 60}ms` },
          h('div', { class: 'dot' }, isUnlocked ? String(i + 1) : '?'),
          h(
            'div',
            { class: 'info' },
            h('div', { class: 'name' }, isUnlocked ? r.name : '???'),
            h('div', { class: 'sub' }, isUnlocked ? `${r.chapter} · ${r.subtitle}` : 'Ainda não desbloqueado'),
          ),
          available
            ? h('button', { class: 'btn small', disabled: !can, onclick: () => { this.close(); this.actions.travel(r.id); } }, visited ? 'Viajar' : 'Ir')
            : h('span', { class: 'pm-soon' }, isUnlocked ? 'Em breve' : ''),
        ),
      );
    });
    this.body.append(trail);
    if (!can) this.body.append(h('div', { class: 'pm-empty' }, 'Termine a cena atual para poder viajar.'));
  }

  private async renderSave(): Promise<void> {
    const slots = Array.from({ length: SAVE_SLOTS }, (_, i) => `slot${i + 1}`);
    const sums = await SaveSystem.summaries(slots);
    if (this.tab !== 'salvar') return;
    this.body.append(this.header('Salvar', 'O jogo também salva sozinho de tempos em tempos', [`${formatPlaytime(GameState.data.playtimeMs)}`]));
    const icon = textureURL('ui-icon-salvar');
    const list = h('div', { class: 'pm-saves' });
    slots.forEach((slot, i) => {
      const s = sums[i];
      let place = '';
      try {
        place = s ? MAPS[s.mapId]?.name ?? '' : '';
      } catch {
        place = '';
      }
      const card = h(
        'div',
        { class: `pm-save ${s ? '' : 'empty'}`, style: `animation-delay:${i * 70}ms` },
        h('div', { class: 'num' }, icon ? h('img', { src: icon, alt: '' }) : null, h('span', {}, String(i + 1))),
        h(
          'div',
          { class: 'info' },
          h('div', { class: 'name' }, s ? place || `Espaço ${i + 1}` : `Espaço ${i + 1} · vazio`),
          h('div', { class: 'sub' }, s ? `${formatDate(s.savedAt)} · ${formatPlaytime(s.playtimeMs)} · ♥ ${s.memories}` : 'Um cantinho pra guardar a nossa história'),
        ),
        h('button', {
          class: 'btn small primary',
          onclick: async () => {
            await SaveSystem.save(slot);
            AudioSystem.play('confirm');
            this.actions.toast('Jogo salvo! ♥');
            card.classList.add('saved');
            setTimeout(() => this.select('salvar'), 650);
          },
        }, s ? 'Sobrescrever' : 'Salvar aqui'),
      );
      list.append(card);
    });
    this.body.append(list, h('div', { class: 'pm-foot' }, h('button', { class: 'btn small', onclick: () => { this.close(); this.actions.quitToTitle(); } }, '⟵ Voltar ao título')));
  }

  /** Cenas já liberadas: joga de novo a partir do começo de qualquer missão principal. */
  private renderScenes(): void {
    const cenas = SceneCheckpoints.list();
    this.body.append(this.header('Cenas', 'Pule direto pra qualquer parte da história', [`${cenas.length} cenas`]));
    if (!cenas.length) {
      this.body.append(h('div', { class: 'pm-empty' }, 'Nenhuma cena liberada ainda. Cada missão que começa vira uma cena aqui!'));
      return;
    }
    const list = h('div', { class: 'pm-cenas' });
    let lastChapter = '';
    for (const c of cenas) {
      if (c.chapter !== lastChapter) {
        lastChapter = c.chapter;
        list.append(h('div', { class: 'pm-cena-cap' }, c.chapter));
      }
      const btn = h('button', { class: 'btn small primary' }, 'Jogar ▶') as HTMLButtonElement;
      let armed = false;
      btn.onclick = () => {
        if (!armed) {
          armed = true;
          btn.textContent = 'Confirmar ▶';
          btn.classList.add('armed');
          setTimeout(() => {
            armed = false;
            btn.textContent = 'Jogar ▶';
            btn.classList.remove('armed');
          }, 3000);
          return;
        }
        this.close();
        this.actions.playScene(c);
      };
      list.append(h('div', { class: 'pm-cena' }, h('div', { class: 'pm-cena-t' }, c.title), btn));
    }
    this.body.append(list, h('div', { class: 'pm-sub pm-cena-aviso' }, 'Ao pular de cena, o jogo continua dali. O que não foi salvo de agora se perde (os seus saves continuam guardados).'));
  }

  private renderQuit(): void {
    this.body.append(
      this.header('Sair', 'Voltar pro menu inicial'),
      h(
        'div',
        { class: 'pm-quit' },
        h('div', { class: 'pm-sub' }, 'O progresso é salvo automaticamente antes de sair.'),
        h(
          'div',
          { class: 'bg-actions' },
          h('button', { class: 'btn primary', onclick: () => { this.close(); this.actions.quitToTitle(); } }, '⟵ Voltar ao menu'),
          h('button', { class: 'btn', onclick: () => this.close() }, 'Continuar jogando'),
        ),
      ),
    );
  }

  private renderSettings(): void {
    const s = SettingsStore.data;
    const range = (label: string, icon: string, key: 'musicVolume' | 'sfxVolume') => {
      const pct = () => `${Math.round(s[key] * 100)}%`;
      const val = h('span', { class: 'val' }, pct());
      const input = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s[key], class: 'pm-range' }) as HTMLInputElement;
      const paint = () => input.style.setProperty('--v', `${s[key] * 100}%`);
      paint();
      input.addEventListener('input', () => {
        s[key] = Number(input.value);
        SettingsStore.save();
        AudioSystem.applyVolumes();
        val.textContent = pct();
        paint();
      });
      input.addEventListener('change', () => AudioSystem.play('blip'));
      return h('div', { class: 'pm-opt' }, h('span', { class: 'lbl' }, `${icon} ${label}`), input, val);
    };
    const seg = <K extends 'textSpeed' | 'touchControls'>(label: string, icon: string, key: K, opts: [string, string][]) => {
      const wrap = h('div', { class: 'pm-seg' });
      const draw = () =>
        wrap.replaceChildren(
          ...opts.map(([v, l]) =>
            h('button', {
              class: s[key] === v ? 'on' : '',
              onclick: () => {
                (s as unknown as Record<string, string>)[key] = v;
                SettingsStore.save();
                this.actions.settingsChanged();
                AudioSystem.play('blip');
                draw();
              },
            }, l),
          ),
        );
      draw();
      return h('div', { class: 'pm-opt' }, h('span', { class: 'lbl' }, `${icon} ${label}`), wrap);
    };
    const key = (k: string, t: string) => h('div', { class: 'pm-key' }, h('kbd', {}, k), h('span', {}, t));
    this.body.append(
      this.header('Opções', 'Deixe do seu jeitinho'),
      h(
        'div',
        { class: 'pm-opts' },
        range('Música', '', 'musicVolume'),
        range('Efeitos', '', 'sfxVolume'),
        seg('Velocidade do texto', '', 'textSpeed', [['lenta', 'Lenta'], ['normal', 'Normal'], ['rapida', 'Rápida']]),
        seg('Controles de toque', '', 'touchControls', [['auto', 'Auto'], ['sempre', 'Sempre'], ['nunca', 'Nunca']]),
      ),
      h('div', { class: 'pm-section' }, 'Controles'),
      h('div', { class: 'pm-keys' }, key('WASD / setas', 'Andar'), key('Shift', 'Correr'), key('E / Espaço', 'Interagir'), key('Esc / M', 'Menu')),
    );
  }
}
