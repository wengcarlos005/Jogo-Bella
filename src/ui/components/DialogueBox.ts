import { h } from '@/utils/dom';
import { SPEAKERS } from '@/data/characters';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { SettingsStore } from '@/systems/SaveSystem';
import { textureURL } from '../textures';

const SPEED = { lenta: 45, normal: 25, rapida: 10 };

/**
 * Caixa de diálogo: retrato, nome, texto progressivo e escolhas.
 * Avança com E/Espaço/Enter, clique ou botão A no celular.
 */
export class DialogueBox {
  readonly el: HTMLDivElement;
  private portrait = h('img', { class: 'portrait', alt: '' });
  private name = h('div', { class: 'name' });
  private text = h('div', { class: 'text' });
  private more = h('div', { class: 'more' }, '▼');
  private choicesEl = h('div', { class: 'choices panel hidden' });
  private typing: number | null = null;
  private full = '';
  private advance: (() => void) | null = null;
  private open = false;

  constructor(parent: HTMLElement) {
    this.el = h('div', { class: 'dialogue panel hidden' }, this.portrait, h('div', { class: 'body' }, this.name, this.text), this.more);
    this.el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.onInteract();
    });
    parent.append(this.el, this.choicesEl);
    InputSystem.on('dialogue:interact', () => this.onInteract());
  }

  private setSpeaker(speaker: string | null): void {
    const def = speaker ? SPEAKERS[speaker] ?? { name: speaker } : null;
    // Sem retrato (narrador, celular): usa a lua da interface, se existir.
    const url = textureURL(def?.portrait) ?? textureURL('ui-icon-lua');
    this.portrait.classList.toggle('hidden', !url);
    if (url) this.portrait.src = url;
    const isNarrator = !def || !def.name;
    this.name.classList.toggle('hidden', isNarrator);
    this.name.classList.toggle('narrator', isNarrator);
    this.name.textContent = def?.name ?? '';
    this.text.style.fontStyle = speaker === 'narrador' ? 'italic' : '';
  }

  private ensureOpen(): void {
    if (this.open) return;
    this.open = true;
    InputSystem.push('dialogue');
    this.el.classList.remove('hidden');
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    InputSystem.pop('dialogue');
    this.el.classList.add('hidden');
    this.choicesEl.classList.add('hidden');
  }

  get isOpen(): boolean {
    return this.open;
  }

  private type(text: string): Promise<void> {
    this.full = text;
    this.text.textContent = '';
    this.more.classList.add('hidden');
    const speed = SPEED[SettingsStore.data.textSpeed];
    let i = 0;
    return new Promise((resolve) => {
      const finish = () => {
        if (this.typing !== null) clearInterval(this.typing);
        this.typing = null;
        this.text.textContent = this.full;
        resolve();
      };
      this.typing = window.setInterval(() => {
        i += 1;
        this.text.textContent = this.full.slice(0, i);
        if (i % 3 === 0 && this.full[i] !== ' ') AudioSystem.play('blip');
        if (i >= this.full.length) finish();
      }, speed);
      this.advance = finish;
    });
  }

  private onInteract(): void {
    const fn = this.advance;
    this.advance = null;
    fn?.();
  }

  async say(speaker: string | null, text: string): Promise<void> {
    this.ensureOpen();
    this.setSpeaker(speaker);
    await this.type(text);
    this.more.classList.remove('hidden');
    await new Promise<void>((resolve) => {
      this.advance = () => {
        AudioSystem.play('confirm');
        resolve();
      };
    });
  }

  async choose(speaker: string | null, text: string, options: string[]): Promise<number> {
    this.ensureOpen();
    this.setSpeaker(speaker);
    await this.type(text);
    let sel = 0;
    this.choicesEl.replaceChildren();
    const buttons = options.map((opt, i) => {
      const b = h('button', { class: 'choice' }, opt);
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        sel = i;
        render();
        this.onInteract();
      });
      this.choicesEl.append(b);
      return b;
    });
    const render = () => buttons.forEach((b, i) => b.classList.toggle('sel', i === sel));
    render();
    this.choicesEl.classList.remove('hidden');
    const up = () => {
      sel = (sel + options.length - 1) % options.length;
      AudioSystem.play('blip');
      render();
    };
    const down = () => {
      sel = (sel + 1) % options.length;
      AudioSystem.play('blip');
      render();
    };
    InputSystem.on('dialogue:up', up);
    InputSystem.on('dialogue:down', down);
    await new Promise<void>((resolve) => {
      this.advance = resolve;
    });
    InputSystem.off('dialogue:up', up);
    InputSystem.off('dialogue:down', down);
    this.choicesEl.classList.add('hidden');
    AudioSystem.play('confirm');
    return sel;
  }
}
