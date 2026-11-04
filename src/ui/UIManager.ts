import type Phaser from 'phaser';
import { h } from '@/utils/dom';
import { GAME_WIDTH } from '@/config/gameConfig';
import { DialogueBox } from './components/DialogueBox';
import { HUD } from './components/HUD';
import { Toasts } from './components/Toasts';
import { TouchControls } from './components/TouchControls';
import { PauseMenu, type PauseActions, type PauseTab } from './screens/PauseMenu';
import { TitleScreen, type TitleActions } from './screens/TitleScreen';
import { showMemoryPopup } from './screens/MemoryPopup';
import { playBurgerGame, type BurgerOptions, type BurgerResult } from './screens/BurgerGame';
import { InputSystem } from '@/systems/InputSystem';
import { bindTextures, textureURL, textureWidth } from './textures';
import { openWardrobe, type WardrobeOption } from './screens/Wardrobe';
import { Sidebar } from './components/Sidebar';
import './styles.css';

/**
 * Camada de interface em DOM, alinhada ao canvas do Phaser.
 * Texto em DOM fica nítido em qualquer tela (o mundo continua em 480x270).
 */
class UIManagerImpl {
  root!: HTMLElement;
  dialogue!: DialogueBox;
  hud!: HUD;
  toasts!: Toasts;
  touch!: TouchControls;
  pause!: PauseMenu;
  title!: TitleScreen;
  sidebar!: Sidebar;
  private fadeEl = h('div', { class: 'fade' });
  private game!: Phaser.Game;

  init(game: Phaser.Game, pauseActions: PauseActions, titleActions: TitleActions): void {
    this.game = game;
    bindTextures(game);
    this.root = document.getElementById('ui')!;
    this.sidebar = new Sidebar((tab) => this.openMenu(tab as PauseTab));
    this.hud = new HUD(this.root, { openMenu: (tab) => this.openMenu((tab as PauseTab) ?? 'missoes') });
    this.touch = new TouchControls(this.root);
    this.toasts = new Toasts(this.root);
    this.dialogue = new DialogueBox(this.root);
    this.root.append(this.fadeEl);
    this.pause = new PauseMenu(this.root, pauseActions);
    this.title = new TitleScreen(this.root, titleActions);

    game.scale.on('resize', () => this.sync());
    window.addEventListener('resize', () => requestAnimationFrame(() => this.sync()));
    this.sync();
    this.setupRotateHint();
  }

  private artApplied = false;

  /**
   * Aplica a arte de interface (molduras, botões, caixa de diálogo, ícones).
   * Chamado depois do carregamento das texturas (MenuScene).
   */
  applyArt(): void {
    if (this.artApplied) return;
    this.artApplied = true;
    // Moldura ilustrada (ui/panel.png) aplicada a painéis e diálogo, se existir.
    const panel = textureURL('ui-panel');
    if (panel) {
      this.root.style.setProperty('--panel-img', `url(${panel})`);
      this.root.classList.add('has-panel-art');
    }
    const art: [string, string, string][] = [
      ['ui-dialogue-box', '--dialogue-img', 'has-dialogue-art'],
      ['ui-btn-normal', '--btn-img', 'has-btn-art'],
      ['ui-btn-hover', '--btn-hover-img', ''],
      ['ui-btn-primary', '--btn-primary-img', ''],
    ];
    for (const [key, cssVar, cls] of art) {
      const url = textureURL(key);
      if (!url) continue;
      this.root.style.setProperty(cssVar, `url(${url})`);
      if (cls) this.root.classList.add(cls);
    }
    this.hud.applyIcons();
    this.sidebar.build();
  }

  /** Alinha #ui ao retângulo do canvas e calcula a unidade --u. */
  sync(): void {
    const canvas = this.game.canvas;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    Object.assign(this.root.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    this.root.style.setProperty('--u', `${r.width / GAME_WIDTH}px`);
  }

  openMenu(tab: PauseTab = 'missoes'): void {
    if (this.dialogue.isOpen) return;
    // não abre no meio de cenas/minigames (só no jogo livre ou trocando de aba)
    if (!this.pause.isOpen && !InputSystem.gameplayEnabled) return;
    this.pause.open(tab);
  }

  memory(id: string): Promise<void> {
    return showMemoryPopup(this.root, id);
  }

  fade(to: 0 | 1, ms = 400, color?: string): Promise<void> {
    if (color) this.fadeEl.style.background = color;
    else if (to === 1) this.fadeEl.style.background = '#000';
    this.fadeEl.style.transition = `opacity ${ms}ms`;
    this.fadeEl.style.opacity = String(to);
    return new Promise((r) => setTimeout(r, ms));
  }

  burger(opts: BurgerOptions): Promise<BurgerResult> {
    return playBurgerGame(this.root, opts);
  }

  private bars: HTMLElement[] = [];

  /** Barras de cinema (letterbox) para cenas especiais. */
  letterbox(on: boolean): void {
    if (!this.bars.length) {
      this.bars = [h('div', { class: 'letterbox top' }), h('div', { class: 'letterbox bottom' })];
      this.root.append(...this.bars);
    }
    this.bars.forEach((b) => b.classList.toggle('on', on));
    this.hud.el.classList.toggle('hidden', on);
  }

  /** Cartão de viagem (ex.: trajeto de Uber, avião). */
  async travel(label: string, icon = '🚗', ms = 2600): Promise<void> {
    this.dialogue.close();
    const car = textureURL('uber-car');
    const bg = textureURL('map-piabeta-fragoso-bg') ?? textureURL('map-piabeta-rua-bg');
    const lamps = h('div', { class: 'tv-lamps' }, ...Array.from({ length: 4 }, (_, i) => h('div', { class: 'tv-lamp', style: `animation-delay:${-i * 0.55}s` })));
    const rain = h('div', { class: 'tv-rain' });
    const card = h(
      'div',
      { class: 'travel-card tv' },
      h('div', { class: 'tv-sky' }),
      bg ? h('div', { class: 'tv-city', style: `background-image:url(${bg})` }) : null,
      lamps,
      h('div', { class: 'tv-road' }, h('div', { class: 'tv-lines' })),
      car
        ? h('div', { class: 'tv-car', style: `background-image:url(${car})` })
        : h('div', { class: 'car' }, icon),
      rain,
      h('div', { class: 'tv-label panel' }, label),
    );
    this.root.append(card);
    requestAnimationFrame(() => card.classList.add('show'));
    await new Promise((r) => setTimeout(r, ms));
    card.classList.remove('show');
    await new Promise((r) => setTimeout(r, 500));
    card.remove();
  }

  private backdropEl: HTMLElement | null = null;

  /** Ilustração de fundo em tela cheia, com os diálogos por cima. null remove. */
  async backdrop(key: string | null): Promise<void> {
    if (!key) {
      const el = this.backdropEl;
      this.backdropEl = null;
      if (!el) return;
      el.classList.remove('show');
      await new Promise((r) => setTimeout(r, 600));
      el.remove();
      this.hud.el.classList.remove('hidden');
      return;
    }
    const url = textureURL(key);
    if (!url) return;
    const el = h('div', { class: 'backdrop' }, h('img', { src: url, alt: '' }));
    this.backdropEl?.remove();
    this.backdropEl = el;
    this.root.append(el);
    this.hud.el.classList.add('hidden');
    requestAnimationFrame(() => el.classList.add('show'));
    await new Promise((r) => setTimeout(r, 700));
  }

  /** Ilustração em tela cheia com legendas; cada legenda avança com interagir/toque. */
  illustration(key: string, lines: string[]): Promise<void> {
    const url = textureURL(key);
    const caption = h('div', { class: 'ill-caption' });
    const screen = h('div', { class: 'screen ill-screen' }, url ? h('img', { class: 'ill-img', src: url, alt: '' }) : null, caption);
    this.root.append(screen);
    requestAnimationFrame(() => screen.classList.add('show'));
    InputSystem.push('illustration');
    return new Promise((resolve) => {
      let i = -1;
      const next = () => {
        i++;
        if (i >= lines.length) {
          InputSystem.off('illustration:interact', next);
          screen.removeEventListener('pointerdown', next);
          InputSystem.pop('illustration');
          screen.classList.remove('show');
          setTimeout(() => screen.remove(), 700);
          resolve();
          return;
        }
        caption.textContent = lines[i];
        caption.classList.remove('in');
        void caption.offsetWidth;
        caption.classList.add('in');
      };
      setTimeout(() => {
        next();
        InputSystem.on('illustration:interact', next);
        screen.addEventListener('pointerdown', next);
      }, 1200);
    });
  }

  wardrobe(title: string, options: WardrobeOption[], startId?: string): Promise<string> {
    return openWardrobe(this.root, title, options, startId);
  }

  /** Carimbo comemorativo com confete (não bloqueia o jogo). */
  celebrate(title: string, sub: string): void {
    const show = () => {
      if (this.root.querySelector('.screen')) {
        setTimeout(show, 500);
        return;
      }
      const confetti = h(
        'div',
        { class: 'cel-confetti' },
        ...Array.from({ length: 26 }, (_, i) =>
          h('span', { style: `left:${(i * 37) % 100}%;animation-delay:${(i % 7) * 0.08}s;background:${['#f27a9b', '#ffd75e', '#5aa64c', '#7fc3e0', '#fbf3e2'][i % 5]}` }),
        ),
      );
      const el = h('div', { class: 'celebrate' }, confetti, h('div', { class: 'cel-card panel' }, h('div', { class: 'cel-title' }, title), h('div', { class: 'cel-sub' }, sub)));
      this.root.append(el);
      setTimeout(() => el.classList.add('out'), 2600);
      setTimeout(() => el.remove(), 3200);
    };
    show();
  }

  /** Janela de item obtido: centralizada, grande; fecha com interagir/clique. */
  itemPopup(name: string, description: string, icon?: string, kicker = 'Você pegou'): Promise<void> {
    const url = textureURL(icon);
    return new Promise((resolve) => {
      const close = () => {
        InputSystem.off('item:interact', close);
        InputSystem.pop('item');
        screen.remove();
        resolve();
      };
      const screen = h(
        'div',
        { class: 'screen item-screen' },
        h(
          'div',
          { class: 'item-pop panel' },
          h('div', { class: 'item-kicker' }, kicker),
          url
            ? h('div', { class: 'item-glow' }, h('img', { class: `item-icon ${textureWidth(icon) < 64 ? 'pixel' : ''}`, src: url, alt: '' }))
            : null,
          h('div', { class: 'item-name' }, name),
          h('div', { class: 'item-desc' }, description),
          h('button', { class: 'btn primary', onclick: close }, 'OK'),
        ),
      );
      this.root.append(screen);
      InputSystem.push('item');
      setTimeout(() => InputSystem.on('item:interact', close), 350);
    });
  }

  /** Cartão de capítulo (ex.: fim do prólogo). Resolve ao confirmar. */
  chapterCard(kicker: string, title: string, sub: string, button = 'Continuar'): Promise<void> {
    return new Promise((resolve) => {
      const close = () => {
        InputSystem.off('chapter:interact', close);
        InputSystem.pop('chapter');
        screen.remove();
        resolve();
      };
      const screen = h(
        'div',
        { class: 'screen opaque' },
        h('div', { class: 'chapter-card' }, h('div', { class: 'k' }, kicker), h('div', { class: 't' }, title), h('div', { class: 's' }, sub), h('button', { class: 'btn primary', onclick: close }, button)),
      );
      this.root.append(screen);
      InputSystem.push('chapter');
      setTimeout(() => InputSystem.on('chapter:interact', close), 600);
    });
  }

  showGameplayUI(on: boolean): void {
    this.sidebar.setActive(on);
    this.hud.show(on);
    this.touch.show(on);
  }

  private setupRotateHint(): void {
    const hint = h('div', { class: 'rotate-hint panel-dark hidden' }, '📱 Vire o celular de lado para jogar melhor');
    hint.addEventListener('click', () => hint.remove());
    document.body.append(hint);
    const check = () => {
      const portrait = window.innerHeight > window.innerWidth && matchMedia('(pointer: coarse)').matches;
      hint.classList.toggle('hidden', !portrait);
    };
    window.addEventListener('resize', check);
    check();
  }
}

export const UI = new UIManagerImpl();
