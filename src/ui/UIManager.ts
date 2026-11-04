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
import { bindTextures } from './textures';
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
  private fadeEl = h('div', { class: 'fade' });
  private game!: Phaser.Game;

  init(game: Phaser.Game, pauseActions: PauseActions, titleActions: TitleActions): void {
    this.game = game;
    bindTextures(game);
    this.root = document.getElementById('ui')!;
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
    this.pause.open(tab);
  }

  memory(id: string): Promise<void> {
    return showMemoryPopup(this.root, id);
  }

  fade(to: 0 | 1, ms = 400): Promise<void> {
    this.fadeEl.style.transition = `opacity ${ms}ms`;
    this.fadeEl.style.opacity = String(to);
    return new Promise((r) => setTimeout(r, ms));
  }

  showGameplayUI(on: boolean): void {
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
