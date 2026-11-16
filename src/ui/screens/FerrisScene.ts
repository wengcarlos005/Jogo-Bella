import { h } from '@/utils/dom';

/**
 * Cena animada da roda-gigante à noite (Araruama): a roda gira de verdade, as cabines ficam
 * sempre penduradas pra baixo, e no "ponto mais alto" ela desacelera até a cabine rosa do casal
 * parar lá em cima, com a câmera chegando perto. Fica por trás dos diálogos, como uma ilustração.
 */
const N = 12;
const COLORS = ['#ff6a9a', '#ffd23f', '#5a9aff', '#6fdc8a', '#ffa24a', '#b07aff'];

let el: HTMLElement | null = null;
let raf = 0;
let angle = 0; // graus; a cabine 0 começa embaixo
let speed = 14; // graus por segundo
let target: number | null = null;
let topFrom = 0;
let topT = 0;
const TOP_DUR = 2.4;

function wheelSVG(): string {
  const spokes = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    return `<line x1="200" y1="200" x2="${200 + Math.cos(a) * 150}" y2="${200 + Math.sin(a) * 150}" stroke="#e8e0f0" stroke-width="3"/>`;
  }).join('');
  const bulbs = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    return `<circle class="fw-bulb" style="animation-delay:${(-i * 0.09).toFixed(2)}s" cx="${200 + Math.cos(a) * 150}" cy="${200 + Math.sin(a) * 150}" r="4"/>`;
  }).join('');
  const inner = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return `<circle class="fw-bulb b2" style="animation-delay:${(-i * 0.12).toFixed(2)}s" cx="${200 + Math.cos(a) * 95}" cy="${200 + Math.sin(a) * 95}" r="3"/>`;
  }).join('');
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <circle cx="200" cy="200" r="150" fill="none" stroke="#c8bedc" stroke-width="7"/>
    <circle cx="200" cy="200" r="95" fill="none" stroke="#c8bedc" stroke-width="4"/>
    ${spokes}${bulbs}${inner}
    <circle cx="200" cy="200" r="16" fill="#ffd23f" stroke="#7a4a1a" stroke-width="4"/>
  </svg>`;
}

function cabin(i: number): HTMLElement {
  const ours = i === 0;
  const color = ours ? '#ff6a9a' : COLORS[i % COLORS.length];
  return h(
    'div',
    { class: 'fw-cabin' + (ours ? ' ours' : '') },
    h('i', { class: 'fw-hook' }),
    h('div', { class: 'fw-box', style: `--c:${color}` }, ours ? h('div', { class: 'fw-couple' }, h('i', { class: 'b' }), h('i', { class: 'w' })) : null, ours ? h('b', { class: 'fw-heart' }, '♥') : null),
  );
}

export function ferrisShow(root: HTMLElement): void {
  if (el) return;
  const cabins = Array.from({ length: N }, (_, i) => cabin(i));
  const rotor = h('div', { class: 'fw-rotor', html: wheelSVG() });
  const wheel = h('div', { class: 'fw-wheel' }, h('div', { class: 'fw-legs' }), rotor, ...cabins);
  const scene = h(
    'div',
    { class: 'fw-scene' },
    h('div', { class: 'fw-sky' }),
    h('div', { class: 'fw-moon' }),
    h('div', { class: 'fw-city' }),
    h('div', { class: 'fw-lagoa' }),
    h('div', { class: 'fw-bokeh' }),
    wheel,
  );
  el = h('div', { class: 'fw backdrop' }, scene);
  root.append(el);
  requestAnimationFrame(() => el?.classList.add('show'));
  angle = 0;
  speed = 14;
  target = null;
  let last = 0;
  const tick = (t: number) => {
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    if (target !== null) {
      // desacelera (ease-out) até a cabine do casal parar lá em cima
      topT = Math.min(TOP_DUR, topT + dt);
      const k = 1 - Math.pow(1 - topT / TOP_DUR, 3);
      angle = topFrom + (target - topFrom) * k;
    } else angle += speed * dt;
    rotor.style.transform = `rotate(${angle}deg)`;
    cabins.forEach((c, i) => {
      // cabine 0 começa embaixo (90°); as outras em volta
      const a = ((90 + angle + (i * 360) / N) * Math.PI) / 180;
      c.style.left = `${50 + Math.cos(a) * 37.5}%`;
      c.style.top = `${50 + Math.sin(a) * 37.5}%`;
    });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

/** A roda desacelera e para com a cabine do casal no topo; a câmera chega perto. */
export function ferrisTop(): Promise<void> {
  if (!el) return Promise.resolve();
  // cabine 0 começa em 90° (embaixo); no topo ela fica em 270° (= -90°)
  const base = 180;
  let t = base;
  while (t <= angle + 20) t += 360;
  topFrom = angle;
  topT = 0;
  target = t;
  el.classList.add('top');
  return new Promise((r) => setTimeout(r, 2600));
}

export async function ferrisHide(): Promise<void> {
  const cur = el;
  el = null;
  if (!cur) return;
  cur.classList.remove('show');
  await new Promise((r) => setTimeout(r, 600));
  cancelAnimationFrame(raf);
  cur.remove();
}
