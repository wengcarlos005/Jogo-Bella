import { playUberGame, type UberResult } from './screens/UberGame';
import { playGrillGame, type GrillResult } from './screens/GrillGame';
import { playCardGame, type CardResult } from './screens/CardGame';
import { playKissGame, type KissResult } from './screens/KissGame';
import { playPhoneChat, type PhoneMsg, type PhoneOptions } from './screens/PhoneChat';
import { playAcaiGame, type AcaiOptions, type AcaiResult } from './screens/AcaiGame';
import { playTacoGame, type TacoResult } from './screens/TacoGame';
import { playCookGame, type CookResult } from './screens/CookGame';
import { playCloudGame, playBoatGame, playBreakfastGame, type MiniResult } from './screens/PetroGames';
import { playMarketGame } from './screens/MarketGame';
import { playCeiaGame } from './screens/CeiaGame';
import { playFogosGame } from './screens/FogosGame';
import { playPedrinhaGame } from './screens/PedrinhaGame';
import { playArgolasGame } from './screens/ArgolasGame';
import { playCinemaGame, type CinemaResult } from './screens/CinemaGame';
import type Phaser from 'phaser';
import { h } from '@/utils/dom';
import { UI_WIDTH } from '@/config/gameConfig';
import { DialogueBox } from './components/DialogueBox';
import { HUD } from './components/HUD';
import { Toasts } from './components/Toasts';
import { TouchControls } from './components/TouchControls';
import { PauseMenu, type PauseActions, type PauseTab } from './screens/PauseMenu';
import { TitleScreen, type TitleActions } from './screens/TitleScreen';
import { showMemoryPopup } from './screens/MemoryPopup';
import { playBurgerGame, type BurgerOptions, type BurgerResult } from './screens/BurgerGame';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
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
    document.body.append(h('div', { id: 'frame' }), h('div', { id: 'sky' }));
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
      document.documentElement.style.setProperty('--panel-img', `url(${panel})`);
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
      document.documentElement.style.setProperty(cssVar, `url(${url})`);
      if (cls) this.root.classList.add(cls);
    }
    this.hud.applyIcons();
    this.sidebar.build();
    // fundo ilustrado opcional (ui/bg.png)
    const bg = textureURL('ui-bg');
    if (bg) document.documentElement.style.setProperty('--page-bg', `url(${bg})`);
  }

  /** Alinha #ui ao retângulo do canvas e calcula a unidade --u. */
  sync(): void {
    const canvas = this.game.canvas;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    Object.assign(this.root.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    this.root.style.setProperty('--u', `${r.width / UI_WIDTH}px`);
    // posição real da tela do jogo, para a moldura e a barra de itens
    const de = document.documentElement.style;
    de.setProperty('--cv-l', `${r.left}px`);
    de.setProperty('--cv-t', `${r.top}px`);
    de.setProperty('--cv-w', `${r.width}px`);
    de.setProperty('--cv-h', `${r.height}px`);
  }

  openMenu(tab: PauseTab = 'missoes'): void {
    if (this.pause.isOpen || InputSystem.gameplayEnabled) {
      this.pause.open(tab);
      return;
    }
    // no meio de uma cena (entre falas): dá pra abrir Opções e consultar missões, mochila e álbum.
    // Mapa e Salvar ficam pra depois da cena (viajar/salvar no meio dela quebraria a história).
    const ctxNow = InputSystem.context;
    if (ctxNow !== 'script' && ctxNow !== 'dialogue' && ctxNow !== 'choice') return;
    const only: PauseTab[] = ['missoes', 'inventario', 'album', 'config', 'cenas', 'sair'];
    if (!only.includes(tab)) {
      this.toasts.show('Dá pra abrir isso depois da cena!');
      return;
    }
    this.pause.open(tab, undefined, only);
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

  pickItem(prompt: string): Promise<string> {
    this.dialogue.close();
    return this.sidebar.pick(prompt);
  }

  /**
   * Roda um minigame com a opção "Jogar de novo": quando a tela final aparece (as estrelas), entra
   * um botão ao lado do de continuar; se clicar, o mesmo minigame recomeça do zero.
   */
  private async replayable<T>(run: () => Promise<T>): Promise<T> {
    for (;;) {
      let again = false;
      const obs = new MutationObserver(() => {
        const stars = this.root.querySelector('.screen .bg-stars');
        const box = stars?.parentElement;
        if (!box || box.querySelector('.mg-replay')) return;
        const go = box.querySelector('.btn.primary') as HTMLButtonElement | null;
        if (!go) return;
        const btn = document.createElement('button');
        btn.className = 'btn mg-replay';
        btn.textContent = 'Jogar de novo';
        btn.addEventListener('click', () => {
          again = true;
          go.click();
        });
        box.insertBefore(btn, go);
      });
      obs.observe(this.root, { childList: true, subtree: true });
      try {
        const r = await run();
        if (!again) return r;
      } finally {
        obs.disconnect();
      }
    }
  }

  burger(opts: BurgerOptions): Promise<BurgerResult> {
    return this.replayable(() => playBurgerGame(this.root, opts));
  }

  cinema(): Promise<CinemaResult> {
    this.dialogue.close();
    return this.replayable(() => playCinemaGame(this.root));
  }

  ceia(): Promise<MiniResult> {
    this.dialogue.close();
    return this.replayable(() => playCeiaGame(this.root));
  }

  pedrinha(): Promise<MiniResult & { skips: number }> {
    this.dialogue.close();
    return this.replayable(() => playPedrinhaGame(this.root));
  }

  argolas(): Promise<MiniResult & { prize: boolean }> {
    this.dialogue.close();
    return this.replayable(() => playArgolasGame(this.root));
  }

  fogos(): Promise<MiniResult & { photos: number }> {
    this.dialogue.close();
    return this.replayable(() => playFogosGame(this.root));
  }

  market(): Promise<MiniResult & { pacoca: boolean }> {
    this.dialogue.close();
    return this.replayable(() => playMarketGame(this.root));
  }
  clouds(): Promise<MiniResult> {
    this.dialogue.close();
    return this.replayable(() => playCloudGame(this.root));
  }
  boatRace(): Promise<MiniResult> {
    this.dialogue.close();
    return this.replayable(() => playBoatGame(this.root));
  }
  breakfast(): Promise<MiniResult> {
    this.dialogue.close();
    return this.replayable(() => playBreakfastGame(this.root));
  }

  private vignetteEl: HTMLElement | null = null;
  /** Desenho grande da cena (assets/minigames/<nome>.png) por cima do mapa, com as falas embaixo. null tira. */
  vignette(main: string | null, side?: string): void {
    const url = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;
    if (!main) {
      const el = this.vignetteEl;
      this.vignetteEl = null;
      el?.classList.remove('show');
      setTimeout(() => el?.remove(), 400);
      return;
    }
    const el = this.vignetteEl ?? h('div', { class: 'vignette' });
    el.replaceChildren(h('img', { class: 'vg-main', src: url(main), alt: '' }), side ? h('img', { class: 'vg-side', src: url(side), alt: '' }) : '');
    if (!this.vignetteEl) {
      this.vignetteEl = el;
      this.root.append(el);
      requestAnimationFrame(() => el.classList.add('show'));
    }
  }

  cook(): Promise<CookResult> {
    this.dialogue.close();
    return this.replayable(() => playCookGame(this.root));
  }

  tacos(opts: { title?: string } = {}): Promise<TacoResult> {
    this.dialogue.close();
    return this.replayable(() => playTacoGame(this.root, opts));
  }

  acai(opts: AcaiOptions): Promise<AcaiResult> {
    return this.replayable(() => playAcaiGame(this.root, opts));
  }

  uberRide(opts: { title?: string; destino?: string } = {}): Promise<UberResult> {
    return this.replayable(() => playUberGame(this.root, opts));
  }

  kissGame(): Promise<KissResult> {
    this.dialogue.close();
    return this.replayable(() => playKissGame(this.root));
  }

  phone(opts: PhoneOptions, msgs: PhoneMsg[]): Promise<void> {
    this.dialogue.close();
    return playPhoneChat(this.root, opts, msgs);
  }

  grill(opts: { title?: string; helper?: string } = {}): Promise<GrillResult> {
    return this.replayable(() => playGrillGame(this.root, opts));
  }

  cards(opts: { title?: string; rounds?: number } = {}): Promise<CardResult> {
    return this.replayable(() => playCardGame(this.root, opts));
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
  async travel(label: string, icon = '', ms = 2600): Promise<void> {
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
  async backdrop(key: string | null, rainy = false): Promise<void> {
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
    const prev = this.backdropEl;
    // troca de cena: a nova ilustração entra por cima com um brilho e um leve zoom (sem corte seco)
    const el = h('div', { class: `backdrop ${rainy ? 'rainy' : ''} ${prev ? 'swap' : ''}` }, h('img', { src: url, alt: '' }), rainy ? h('div', { class: 'bd-rain' }) : null, h('div', { class: 'bd-flash' }));
    this.backdropEl = el;
    this.root.append(el);
    this.hud.el.classList.add('hidden');
    requestAnimationFrame(() => el.classList.add('show'));
    await new Promise((r) => setTimeout(r, prev ? 1000 : 700));
    prev?.remove();
  }

  /** Ilustração em tela cheia com legendas; cada legenda avança com interagir/toque. */
  /** Tira uma "foto" da tela do jogo (flash + polaroid com legenda); clique ou espaço pra guardar. */
  photo(caption: string): Promise<void> {
    this.dialogue.close();
    return new Promise((resolve) => {
      this.game.renderer.snapshot((img) => {
        const pic = img as HTMLImageElement;
        const flash = h('div', { class: 'ph-flash' });
        const card = h('div', { class: 'polaroid' }, h('div', { class: 'pol-img' }, pic), h('div', { class: 'pol-cap' }, caption));
        const screen = h('div', { class: 'screen photo-screen' }, flash, card, h('div', { class: 'pol-hint' }, 'clique pra guardar'));
        this.root.append(screen);
        AudioSystem.play('confirm');
        InputSystem.push('minigame');
        InputSystem.releaseAll();
        let closed = false;
        const close = () => {
          if (closed) return;
          closed = true;
          InputSystem.off('minigame:interact', close);
          InputSystem.pop('minigame');
          screen.classList.add('out');
          setTimeout(() => screen.remove(), 250);
          resolve();
        };
        setTimeout(() => {
          screen.addEventListener('pointerdown', close);
          InputSystem.once('minigame:interact', close);
        }, 500);
      });
    });
  }

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

  /** Cartão de capítulo (ex.: fim do prólogo). Resolve ao confirmar. Com `recap`, mostra antes um resumo da história. */
  chapterCard(kicker: string, title: string, sub: string, button = 'Continuar', recap?: { title?: string; photos?: string[]; lines: string[] }): Promise<void> {
    return new Promise((resolve) => {
      const btn = h('button', { class: 'btn primary' }, button);
      const card = h('div', { class: 'chapter-card' }, h('div', { class: 'k' }, kicker), h('div', { class: 't' }, title), h('div', { class: 's' }, sub));
      const screen = h('div', { class: 'screen opaque cc-screen' });
      let skip: (() => void) | null = null;
      const wait = (ms: number) =>
        new Promise<void>((r) => {
          const t = setTimeout(r, ms);
          skip = () => {
            clearTimeout(t);
            r();
          };
        });
      let ready = false;
      const close = () => {
        if (!ready) return skip?.();
        InputSystem.off('chapter:interact', close);
        InputSystem.pop('chapter');
        screen.classList.add('out');
        setTimeout(() => screen.remove(), 350);
        resolve();
      };
      btn.addEventListener('click', close);
      this.root.append(screen);
      InputSystem.push('chapter');
      InputSystem.on('chapter:interact', close);
      void (async () => {
        if (recap?.lines.length) {
          const photos = h('div', { class: 'cc-photos' });
          const list = h('div', { class: 'cc-lines' });
          const box = h('div', { class: 'cc-recap' }, h('div', { class: 'cc-rt' }, recap.title ?? 'Até aqui...'), photos, list);
          screen.append(box);
          (recap.photos ?? []).forEach((key, i) => {
            const url = textureURL(key);
            if (!url) return;
            const ph = h('div', { class: 'cc-photo', style: `--r:${(i % 2 ? 1 : -1) * (3 + i)}deg;animation-delay:${0.2 + i * 0.35}s` }, h('img', { src: url, alt: '' }));
            photos.append(ph);
          });
          await wait(600 + (recap.photos?.length ?? 0) * 300);
          for (const line of recap.lines) {
            list.append(h('p', { class: 'cc-line' }, line));
            AudioSystem.play('blip');
            await wait(1500 + line.length * 22);
          }
          list.append(h('p', { class: 'cc-next' }, '▼'));
          await new Promise<void>((r) => (skip = r));
          box.classList.add('out');
          await new Promise((r) => setTimeout(r, 400));
          box.remove();
        }
        screen.append(card);
        await new Promise((r) => setTimeout(r, 700));
        card.append(btn);
        ready = true;
      })();
    });
  }

  showGameplayUI(on: boolean): void {
    this.sidebar.setActive(on);
    this.hud.show(on);
    this.touch.show(on);
  }

  private setupRotateHint(): void {
    const hint = h('div', { class: 'rotate-hint panel-dark hidden' }, 'Vire o celular de lado para jogar melhor');
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
