import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Cortina de entrada dos minigames: dois painéis fecham com o nome do jogo no meio,
 * o que vem a seguir (o "Como jogar" ou o próprio jogo) é montado por trás e a cortina abre.
 * `close()` fecha e devolve `open()`; nada do mundo anda enquanto ela está na tela.
 */
export async function curtainClose(root: HTMLElement, title: string, sub = 'Prepare-se...', fast = false): Promise<() => Promise<void>> {
  const fb = textureURL('portrait-bella');
  const fw = textureURL('portrait-weng');
  const stars = h('div', { class: 'mgc-stars' }, ...Array.from({ length: 26 }, (_, i) => h('i', { style: `left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;animation-delay:${-(i % 7) * 0.3}s` })));
  const el = h(
    'div',
    { class: 'mg-curtain v2' + (fast ? ' fast' : '') },
    h('div', { class: 'mgc-iris' }, stars, h('div', { class: 'mgc-glow' })),
    h(
      'div',
      { class: 'mgc-card' },
      h('div', { class: 'mgc-faces' }, fb ? h('img', { src: fb, alt: '' }) : h('span'), h('b', {}, '♥'), fw ? h('img', { src: fw, alt: '' }) : h('span')),
      h('div', { class: 'mgc-ribbon' }, h('span', { class: 'mgc-title' }, title)),
      h('div', { class: 'mgc-sub' }, sub),
    ),
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
