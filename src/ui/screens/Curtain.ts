import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Cortina de entrada dos minigames: dois painéis fecham com o nome do jogo no meio,
 * o que vem a seguir (o "Como jogar" ou o próprio jogo) é montado por trás e a cortina abre.
 * `close()` fecha e devolve `open()`; nada do mundo anda enquanto ela está na tela.
 */
export async function curtainClose(root: HTMLElement, title: string, sub = 'Prepare-se...', fast = false): Promise<() => Promise<void>> {
  const el = h(
    'div',
    { class: 'mg-curtain' + (fast ? ' fast' : '') },
    h('div', { class: 'mgc-panel mgc-l' }),
    h('div', { class: 'mgc-panel mgc-r' }),
    h('div', { class: 'mgc-card' }, h('div', { class: 'mgc-heart' }, '♥'), h('div', { class: 'mgc-title' }, title), h('div', { class: 'mgc-sub' }, sub)),
  );
  InputSystem.push('minigame');
  InputSystem.releaseAll();
  root.append(el);
  AudioSystem.play('confirm');
  await wait(20);
  el.classList.add('closed');
  await wait(fast ? 420 : 1100);
  return async () => {
    // fica sempre por cima do que acabou de ser montado
    root.append(el);
    await wait(30);
    el.classList.remove('closed');
    el.classList.add('opening');
    await wait(520);
    el.remove();
    InputSystem.pop('minigame');
  };
}
