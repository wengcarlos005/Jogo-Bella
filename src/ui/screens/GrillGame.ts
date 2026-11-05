import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Churrasqueira (2º encontro, quintal da Bella).
 * Um marcador corre pela barra de cozimento; aperte "Virar!" quando estiver no ponto (verde).
 * 4 carnes, cada vez mais rápido. Ponto = 2, quase = 1, crua/queimada = 0.
 */
export interface GrillResult {
  points: number;
  stars: number;
}

const MEATS = ['Picanha', 'Linguiça', 'Frango', 'Pão de alho'];

export function playGrillGame(parent: HTMLElement, opts: { title?: string; helper?: string } = {}): Promise<GrillResult> {
  return new Promise((resolve) => {
    let idx = 0;
    let points = 0;
    let pos = 0;
    let dir = 1;
    let running = false;
    let raf = 0;
    let last = 0;
    let done = false;

    const bg = textureURL('map-piabeta-quintal-bg');
    const grill = h('div', { class: 'gr-grill', style: bg ? `background-image:url(${bg})` : '' }, h('div', { class: 'gr-smoke' }, h('span'), h('span'), h('span')));
    const meat = h('div', { class: 'gr-meat' }, MEATS[0]);
    const cursor = h('div', { class: 'gr-cursor' });
    const bar = h('div', { class: 'gr-bar' }, h('div', { class: 'gr-zone q1' }), h('div', { class: 'gr-zone ok' }), h('div', { class: 'gr-zone q2' }), cursor);
    const labels = h('div', { class: 'gr-labels' }, h('span', {}, 'crua'), h('span', {}, 'no ponto'), h('span', {}, 'queimada'));
    const msg = h('div', { class: 'cg-msg' }, `${opts.helper ?? 'Alexandre'}: "Vira quando tiver no ponto, hein. Nem crua, nem carvão."`);
    const score = h('div', { class: 'gr-score' });
    const flip = h('button', { class: 'btn primary', 'aria-label': 'Virar' }, 'Virar!');
    const actions = h('div', { class: 'bg-actions' }, flip);
    const helperPic = textureURL(`portrait-${opts.helper === 'Alexandre' || !opts.helper ? 'pai-bella' : opts.helper}`);
    const panel = h(
      'div',
      { class: 'bg-panel panel gr-panel' },
      h('div', { class: 'bg-title gr-title' }, opts.title ?? 'Na churrasqueira'),
      h('div', { class: 'gr-main' }, grill, h('div', { class: 'gr-side' }, meat, bar, labels, score, h('div', { class: 'ac-talk' }, helperPic ? h('img', { class: 'ac-helper', src: helperPic, alt: '' }) : null, msg))),
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen gr-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const setScore = () => (score.textContent = `Carne ${Math.min(idx + 1, MEATS.length)} de ${MEATS.length}  ·  ${'♥'.repeat(points)}`);
    const speed = () => 0.55 + idx * 0.22; // barras por segundo

    const tick = (t: number) => {
      if (!running) return;
      const dt = last ? (t - last) / 1000 : 0;
      last = t;
      pos += dir * speed() * dt;
      if (pos >= 1) {
        pos = 1;
        dir = -1;
      } else if (pos <= 0) {
        pos = 0;
        dir = 1;
      }
      cursor.style.left = `${pos * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      running = true;
      last = 0;
      pos = 0;
      dir = 1;
      raf = requestAnimationFrame(tick);
    };

    const LINES = {
      ok: ['Alexandre: "No ponto. Aprovado."', 'Alexandre: "Hm. Sabe fazer churrasco."', 'Mãe: "Ficou lindo, querido!"'],
      quase: ['Alexandre: "Passou um pouquinho. Mas come."', 'Alexandre: "Quase. Quase."'],
      ruim: ['Alexandre: "...Isso aí é carvão."', 'Alexandre: "Tá mugindo ainda, rapaz."'],
    };
    const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

    const doFlip = () => {
      if (done || !running) return;
      running = false;
      cancelAnimationFrame(raf);
      const d = Math.abs(pos - 0.5);
      let got = 0;
      if (d < 0.09) got = 2;
      else if (d < 0.2) got = 1;
      points += got;
      AudioSystem.play(got === 2 ? 'pickup' : got === 1 ? 'blip' : 'cancel');
      grill.classList.remove('gr-flip');
      void grill.offsetWidth;
      grill.classList.add('gr-flip');
      msg.textContent = got === 2 ? pick(LINES.ok) : got === 1 ? pick(LINES.quase) : pick(LINES.ruim);
      idx++;
      setScore();
      if (idx >= MEATS.length) return end();
      meat.textContent = MEATS[idx];
      setTimeout(start, 900);
    };

    const end = () => {
      done = true;
      const stars = points >= 7 ? 3 : points >= 4 ? 2 : 1;
      msg.textContent =
        stars === 3 ? 'Alexandre: "...Bom rapaz. Pode voltar sempre."' : stars === 2 ? 'Alexandre: "Dá pro gasto. Com treino melhora."' : 'Alexandre: "Deixa que eu termino. Vai lá conversar."';
      AudioSystem.play('quest');
      const close = () => {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve({ points, stars });
      };
      actions.replaceChildren(
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('button', { class: 'btn primary', onclick: close }, 'Servir a mesa ♥'),
      );
      setTimeout(() => InputSystem.once('minigame:interact', close), 400);
    };

    flip.addEventListener('click', doFlip);
    const onInteract = () => doFlip();
    InputSystem.on('minigame:interact', onInteract);
    setScore();
    setTimeout(start, 700);

    function cleanup() {
      cancelAnimationFrame(raf);
      InputSystem.off('minigame:interact', onInteract);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
