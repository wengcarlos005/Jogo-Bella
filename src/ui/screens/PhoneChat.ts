import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Conversa no celular — usada nas transições entre cenas (os dias que passam entre um encontro e outro).
 * As mensagens chegam uma a uma, com "digitando..." antes; toque/Enter adianta.
 */
export interface PhoneMsg {
  /** 'me' = dono do celular (balão à direita); 'them' = contato; 'info' = aviso no meio (ex.: "Sábado"). */
  from: 'me' | 'them' | 'info';
  text: string;
}
export interface PhoneOptions {
  /** Nome do contato no topo. */
  contact: string;
  /** Retrato do contato (chave de textura). */
  avatar?: string;
  /** Hora no topo do celular. */
  clock?: string;
  /** Legenda acima do celular (ex.: "No celular do Weng"). */
  caption?: string;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function playPhoneChat(parent: HTMLElement, opts: PhoneOptions, msgs: PhoneMsg[]): Promise<void> {
  return new Promise((resolve) => {
    const avatarUrl = opts.avatar ? textureURL(opts.avatar) : null;
    const list = h('div', { class: 'ph-list' });
    const hint = h('div', { class: 'ph-hint' }, 'toque para continuar');
    const phone = h(
      'div',
      { class: 'ph-phone' },
      h('div', { class: 'ph-notch' }),
      h('div', { class: 'ph-status' }, h('span', {}, opts.clock ?? '19:42'), h('span', {}, '▂▄▆ ♥ 87%')),
      h(
        'div',
        { class: 'ph-head' },
        h('span', { class: 'ph-back' }, '‹'),
        avatarUrl ? h('img', { class: 'ph-ava', src: avatarUrl, alt: '' }) : h('div', { class: 'ph-ava none' }, opts.contact.slice(0, 1)),
        h('div', { class: 'ph-who' }, h('b', {}, opts.contact), h('small', {}, 'online')),
      ),
      list,
      h('div', { class: 'ph-input' }, h('span', {}, 'Mensagem'), h('i', {}, '➤')),
    );
    const screen = h('div', { class: 'screen ph-screen' }, opts.caption ? h('div', { class: 'ph-caption' }, opts.caption) : null, phone, hint);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();
    requestAnimationFrame(() => screen.classList.add('show'));

    let skip: (() => void) | null = null;
    let finished = false;
    const advance = () => skip?.();
    const sleep = (ms: number) =>
      new Promise<void>((r) => {
        const t = setTimeout(() => {
          skip = null;
          r();
        }, ms);
        skip = () => {
          clearTimeout(t);
          skip = null;
          r();
        };
      });
    screen.addEventListener('pointerdown', advance);
    InputSystem.on('minigame:interact', advance);

    const scroll = () => list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });

    void (async () => {
      await wait(450);
      for (const m of msgs) {
        if (m.from === 'info') {
          list.append(h('div', { class: 'ph-info' }, m.text));
          scroll();
          await sleep(900);
          continue;
        }
        // "digitando..." de quem vai mandar
        const typing = h('div', { class: `ph-msg ${m.from} typing` }, h('i'), h('i'), h('i'));
        list.append(typing);
        scroll();
        await sleep(Math.min(1500, 450 + m.text.length * 18));
        typing.remove();
        const bubble = h('div', { class: `ph-msg ${m.from}` }, m.text, h('span', { class: 'ph-tick' }, m.from === 'me' ? '✓✓' : ''));
        list.append(bubble);
        AudioSystem.play(m.from === 'me' ? 'blip' : 'msg');
        scroll();
        await sleep(Math.min(2600, 900 + m.text.length * 28));
      }
      hint.textContent = 'toque para fechar';
      hint.classList.add('end');
      await new Promise<void>((r) => (skip = r));
      if (finished) return;
      finished = true;
      screen.classList.remove('show');
      await wait(350);
      screen.removeEventListener('pointerdown', advance);
      InputSystem.off('minigame:interact', advance);
      InputSystem.pop('minigame');
      screen.remove();
      resolve();
    })();
  });
}
