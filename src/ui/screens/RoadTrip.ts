import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';

export interface TripLine {
  /** Nome que aparece no balão. */
  name: string;
  /** Retrato (data URL) ou null. */
  face: string | null;
  text: string;
  /** Lado do balão: Bella na esquerda, Weng na direita. */
  side?: 'left' | 'right';
}

export interface TripOptions {
  from: string;
  to: string;
  lines: TripLine[];
  /** Imagens (data URL) da paisagem: começo (ex.: araucária) e fim (ex.: palmeira). */
  treeA?: string | null;
  treeB?: string | null;
  car?: string | null;
  faceBella?: string | null;
  faceWeng?: string | null;
  /** Já começa no litoral (lagoa/mar desde o início). */
  coast?: boolean;
  /** Pôr do sol no fim da viagem (padrão: sim). */
  sunset?: boolean;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Viagem de carro animada entre duas cidades: o céu vai da manhã ao pôr do sol,
 * a serra com araucárias vira lagoa com palmeiras, a rota no topo anda com o coração
 * e a conversa do casal aparece em balões (Espaço / E / Enter passa; também anda sozinha).
 */
export function playRoadTrip(root: HTMLElement, o: TripOptions): Promise<void> {
  return new Promise((resolve) => {
    const n = Math.max(1, o.lines.length);
    const pin = h('div', { class: 'rt-pin' }, '♥');
    const fill = h('div', { class: 'rt-fill' });
    const route = h(
      'div',
      { class: 'rt-route' },
      h('span', { class: 'rt-city' }, o.from),
      h('div', { class: 'rt-track' }, fill, pin),
      h('span', { class: 'rt-city' }, o.to),
    );
    const trees = (img: string | null | undefined, cls: string, count: number) =>
      h('div', { class: `rt-trees ${cls}` }, ...Array.from({ length: count }, (_, i) =>
        img ? h('img', { src: img, alt: '', class: 'rt-tree', style: `animation-delay:${(-i * 7) / count}s` }) : null));
    const bubble = h('div', { class: 'rt-bubble hidden' });
    const car = h('div', { class: 'rt-car', style: o.car ? `background-image:url(${o.car})` : '' }, h('div', { class: 'rt-heads' }));
    const scene = h(
      'div',
      { class: 'rt-scene' },
      h('div', { class: 'rt-sky' }),
      h('div', { class: 'rt-sun' }),
      h('div', { class: 'rt-clouds' }),
      h('div', { class: 'rt-far rt-serra' }),
      h('div', { class: 'rt-far rt-serra2' }),
      h('div', { class: 'rt-lagoa' }, h('div', { class: 'rt-glint' })),
      trees(o.treeA, 'a', 4),
      trees(o.treeB, 'b', 4),
      h('div', { class: 'rt-guard' }),
      h('div', { class: 'rt-road' }, h('div', { class: 'rt-lines' })),
      car,
    );
    const hint = h('div', { class: 'rt-hint' }, h('kbd', {}, 'Espaço'), ' continua');
    const card = h('div', { class: 'travel-card rt' }, scene, route, bubble, hint);
    root.append(card);
    InputSystem.push('minigame');
    InputSystem.releaseAll();
    requestAnimationFrame(() => card.classList.add('show'));

    let i = -1;
    let timer = 0;
    let done = false;
    const setProgress = (p: number) => {
      card.style.setProperty('--p', String(p));
      fill.style.width = `${p * 100}%`;
      pin.style.left = `${p * 100}%`;
      card.classList.toggle('coast', o.coast === true || p >= 0.5);
      card.classList.toggle('sunset', o.sunset !== false && p >= 0.72);
    };
    const next = () => {
      if (done) return;
      clearTimeout(timer);
      i++;
      if (i >= o.lines.length) {
        finish();
        return;
      }
      const l = o.lines[i];
      setProgress((i + 1) / (n + 1));
      bubble.className = `rt-bubble ${l.side === 'right' ? 'right' : 'left'}`;
      const kids: Node[] = [];
      if (l.face) kids.push(h('img', { src: l.face, alt: '' }));
      kids.push(h('div', {}, h('b', {}, l.name), h('span', {}, l.text)));
      bubble.replaceChildren(...kids);
      void bubble.offsetWidth;
      bubble.classList.add('pop');
      AudioSystem.play('blip');
      timer = window.setTimeout(next, 2600 + l.text.length * 45);
    };
    const finish = async () => {
      done = true;
      window.removeEventListener('keydown', onKey, true);
      bubble.classList.add('hidden');
      setProgress(1);
      card.classList.add('arrive');
      await wait(1400);
      card.classList.remove('show');
      await wait(500);
      card.remove();
      InputSystem.pop('minigame');
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat && i >= 0) next();
    };
    window.addEventListener('keydown', onKey, true);
    setProgress(0.02);
    setTimeout(next, 1300);
  });
}
