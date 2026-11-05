import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Churrasqueira do Alexandre (2º encontro, quintal da Bella).
 * Duas carnes na grelha ao mesmo tempo. Cada uma tem dois lados: a carne vai mudando de cor
 * e a barrinha enche; clique na carne para virar quando estiver no verde. Depois do 2º lado ela
 * vai pro prato. De vez em quando sobe uma labareda: aperte "Abanar!" antes que queime tudo.
 * Ponto = 2, quase = 1, crua/queimada = 0 (por lado). Máximo: 16.
 */
export interface GrillResult {
  points: number;
  stars: number;
}

interface MeatDef {
  id: string;
  name: string;
  /** quanto cozinha por segundo (1 = passou do ponto) */
  rate: number;
  raw: string;
  ok: string;
  burnt: string;
}

const MEATS: MeatDef[] = [
  { id: 'picanha', name: 'Picanha', rate: 0.1, raw: '#e0566b', ok: '#8a4526', burnt: '#24140f' },
  { id: 'linguica', name: 'Linguiça', rate: 0.12, raw: '#e27c7c', ok: '#9b3f22', burnt: '#24140f' },
  { id: 'frango', name: 'Frango', rate: 0.085, raw: '#f2cdb0', ok: '#c98a3c', burnt: '#2e1d12' },
  { id: 'pao', name: 'Pão de alho', rate: 0.15, raw: '#f6e6b8', ok: '#e3a443', burnt: '#2e1d12' },
];
const OK_LO = 0.62;
const OK_HI = 0.86;
const Q_LO = 0.48;
const Q_HI = 0.97;
const BURN = 1.15;
const SCALE = 1.1; // a barra vai de 0 a 1,1

interface Slot {
  root: HTMLElement;
  meatEl: HTMLElement;
  fill: HTMLElement;
  tag: HTMLElement;
  flame: HTMLElement;
  meat: MeatDef | null;
  side: 0 | 1;
  cook: number;
  flare: number; // segundos restantes de labareda (0 = sem fogo)
  busy: boolean;
}

const mix = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const k = Math.max(0, Math.min(1, t));
  const c = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};
const colorAt = (m: MeatDef, d: number) => (d <= 0.74 ? mix(m.raw, m.ok, d / 0.74) : mix(m.ok, m.burnt, (d - 0.74) / 0.5));
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

export function playGrillGame(parent: HTMLElement, opts: { title?: string; helper?: string } = {}): Promise<GrillResult> {
  return new Promise((resolve) => {
    const who = opts.helper ?? 'Alexandre';
    let points = 0;
    let served = 0;
    let next = 0;
    let running = false;
    let done = false;
    let raf = 0;
    let last = 0;
    let flareIn = 7;
    let talkLock = 0;

    const helperPic = textureURL(`portrait-${!opts.helper || opts.helper === 'Alexandre' ? 'pai-bella' : opts.helper}`);
    const msg = h('div', { class: 'bg-msg' }, `${who}: "Duas carnes de cada vez. Clica na carne pra virar quando a barrinha tiver no verde. Subiu fogo? Abana!"`);
    const talk = (text: string, force = false) => {
      if (!force && performance.now() < talkLock) return;
      msg.textContent = text;
      talkLock = performance.now() + 1600;
    };

    const zones = () =>
      h(
        'div',
        { class: 'gq-zones' },
        h('i', { class: 'q', style: `left:${(Q_LO / SCALE) * 100}%;width:${((OK_LO - Q_LO) / SCALE) * 100}%` }),
        h('i', { class: 'ok', style: `left:${(OK_LO / SCALE) * 100}%;width:${((OK_HI - OK_LO) / SCALE) * 100}%` }),
        h('i', { class: 'q', style: `left:${(OK_HI / SCALE) * 100}%;width:${((Q_HI - OK_HI) / SCALE) * 100}%` }),
        h('i', { class: 'burn', style: `left:${(Q_HI / SCALE) * 100}%;right:0` }),
      );

    const makeSlot = (): Slot => {
      const meatEl = h('div', { class: 'gq-meat' });
      const fill = h('div', { class: 'gq-fill' });
      const tag = h('div', { class: 'gq-tag' });
      const flame = h('div', { class: 'gq-flame' }, h('i'), h('i'), h('i'));
      const root = h(
        'button',
        { class: 'gq-slot empty', 'aria-label': 'Virar a carne' },
        h('div', { class: 'gq-sizzle' }, h('i'), h('i'), h('i'), h('i')),
        flame,
        meatEl,
        h('div', { class: 'gq-gauge' }, zones(), fill),
        tag,
      );
      const s: Slot = { root, meatEl, fill, tag, flame, meat: null, side: 0, cook: 0, flare: 0, busy: false };
      root.addEventListener('click', () => flip(s));
      return s;
    };
    const slots = [makeSlot(), makeSlot()];

    const bg = textureURL('map-piabeta-quintal-bg');
    const plate = h('div', { class: 'gq-plate' });
    const score = h('div', { class: 'gq-score' });
    const fanBtn = h('button', { class: 'btn gq-fan', 'aria-label': 'Abanar' }, '🪭 Abanar!');
    const startBtn = h('button', { class: 'btn primary' }, 'Bora!');
    const actions = h('div', { class: 'bg-actions' }, startBtn);
    const grill = h(
      'div',
      { class: 'gq-stage' },
      bg ? h('div', { class: 'gq-bg', style: `background-image:url(${bg})` }) : null,
      h('div', { class: 'gq-box' }, h('div', { class: 'gq-coals' }), h('div', { class: 'gq-grate' }, ...slots.map((s) => s.root))),
      h('div', { class: 'gq-fanfx' }),
    );
    const panel = h(
      'div',
      { class: 'bg-panel panel gr-panel gq-panel' },
      h('div', { class: 'bg-title gr-title' }, opts.title ?? 'Na churrasqueira'),
      h(
        'div',
        { class: 'gq-main' },
        grill,
        h(
          'div',
          { class: 'gq-side' },
          h('div', { class: 'gq-plate-wrap' }, h('div', { class: 'gq-plate-label' }, 'Prato da mesa'), plate),
          score,
          h('div', { class: 'ac-talk' }, helperPic ? h('img', { class: 'ac-helper', src: helperPic, alt: '' }) : null, msg),
        ),
      ),
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen gr-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const setScore = () => (score.textContent = `Servidas ${served} de ${MEATS.length}  ·  ${points} ♥`);
    setScore();

    const render = (s: Slot) => {
      if (!s.meat) return;
      s.meatEl.style.setProperty('--meat', colorAt(s.meat, s.cook));
      s.fill.style.width = `${Math.min(1, s.cook / SCALE) * 100}%`;
      const zone = s.cook >= Q_HI ? 'burn' : s.cook >= OK_LO && s.cook <= OK_HI ? 'ok' : s.cook >= Q_LO ? 'q' : 'raw';
      s.root.dataset.zone = zone;
      s.root.classList.toggle('flaring', s.flare > 0);
    };

    const place = (s: Slot) => {
      if (next >= MEATS.length) return;
      const m = MEATS[next++];
      Object.assign(s, { meat: m, side: 0, cook: 0, flare: 0, busy: false });
      s.root.classList.remove('empty', 'served', 'marked');
      s.meatEl.className = `gq-meat ${m.id} drop`;
      s.tag.textContent = `${m.name} · 1º lado`;
      AudioSystem.play('blip');
      render(s);
    };

    const pop = (s: Slot, text: string, grade: number) => {
      const p = h('div', { class: `gq-pop g${grade}` }, text);
      s.root.append(p);
      setTimeout(() => p.remove(), 1100);
    };

    const LINES = {
      ok: [`${who}: "No ponto. Aprovado."`, `${who}: "Hm. Sabe fazer churrasco."`, 'Mãe: "Ficou lindo, querido!"', `${who}: "Isso. Isso aí."`],
      quase: [`${who}: "Passou um pouquinho. Mas come."`, `${who}: "Quase. Quase."`],
      crua: [`${who}: "Tá mugindo ainda, rapaz."`, `${who}: "Calma! Deixa dourar."`],
      queimada: [`${who}: "...Isso aí é carvão."`, 'Bella: "Tá crocante! ...Bem crocante."'],
      fogo: [`${who}: "Fogo! Abana, abana!"`, 'Bella: "WENG! TÁ PEGANDO FOGO!"', `${who}: "Gordura pingou. Abana!"`],
      abanou: [`${who}: "Boa. Fogo baixo, carne feliz."`, 'Bella: "Meu herói do abanador."'],
      vento: [`${who}: "Tá abanando o nada?"`, 'Bella: "Tá com calor, Weng?"'],
    };

    const flip = (s: Slot, burnt = false) => {
      if (!running || done || !s.meat || s.busy) return;
      const d = s.cook;
      const g = !burnt && d >= OK_LO && d <= OK_HI ? 2 : !burnt && d >= Q_LO && d <= Q_HI ? 1 : 0;
      points += g;
      AudioSystem.play(g === 2 ? 'pickup' : g === 1 ? 'blip' : 'cancel');
      pop(s, g === 2 ? 'No ponto!' : g === 1 ? (d < OK_LO ? 'Quase...' : 'Passou um pouco') : d < Q_LO ? 'Crua!' : 'Queimou!', g);
      talk(g === 2 ? pick(LINES.ok) : g === 1 ? pick(LINES.quase) : d < Q_LO ? pick(LINES.crua) : pick(LINES.queimada), true);
      s.meatEl.classList.remove('flip', 'drop');
      void s.meatEl.offsetWidth;
      if (s.side === 0) {
        s.side = 1;
        s.cook = 0;
        s.meatEl.classList.add('flip');
        s.root.classList.add('marked');
        s.tag.textContent = `${s.meat.name} · 2º lado`;
        render(s);
      } else {
        const m = s.meat;
        s.busy = true;
        s.flare = 0;
        s.meatEl.classList.add('serve');
        setTimeout(() => {
          served++;
          plate.append(h('div', { class: `gq-piece ${m.id}`, title: m.name, style: `--meat:${m.ok}` }));
          setScore();
          s.meat = null;
          s.root.classList.add('empty');
          s.root.classList.remove('flaring', 'marked');
          s.tag.textContent = '';
          s.fill.style.width = '0';
          if (next < MEATS.length) setTimeout(() => running && place(s), 900);
          else if (slots.every((x) => !x.meat)) end();
        }, 520);
      }
      setScore();
    };

    const fan = () => {
      if (!running || done) return;
      grill.classList.remove('fanning');
      void grill.offsetWidth;
      grill.classList.add('fanning');
      const any = slots.some((s) => s.flare > 0);
      slots.forEach((s) => {
        s.flare = 0;
        render(s);
      });
      AudioSystem.play(any ? 'confirm' : 'blip');
      talk(any ? pick(LINES.abanou) : pick(LINES.vento), any);
    };

    const tick = (t: number) => {
      if (!running) return;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      for (const s of slots) {
        if (!s.meat || s.busy) continue;
        if (s.flare > 0) s.flare = Math.max(0, s.flare - dt);
        s.cook += s.meat.rate * (s.flare > 0 ? 2.4 : 1) * dt;
        render(s);
        if (s.cook >= BURN) flip(s, true);
      }
      flareIn -= dt;
      if (flareIn <= 0) {
        flareIn = 6 + Math.random() * 5;
        const cands = slots.filter((s) => s.meat && !s.busy && s.flare === 0 && s.cook < OK_HI);
        if (cands.length) {
          const s = cands[Math.floor(Math.random() * cands.length)];
          s.flare = 4.5;
          AudioSystem.play('horn');
          talk(pick(LINES.fogo), true);
          render(s);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || done) return;
      running = true;
      actions.replaceChildren(fanBtn);
      talk(`${who}: "Picanha primeiro. Fica de olho na cor."`, true);
      place(slots[0]);
      setTimeout(() => running && place(slots[1]), 2600);
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const end = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      const stars = points >= 12 ? 3 : points >= 7 ? 2 : 1;
      talk(
        stars === 3 ? `${who}: "...Bom rapaz. Pode voltar sempre."` : stars === 2 ? `${who}: "Dá pro gasto. Com treino melhora."` : `${who}: "Deixa que eu termino. Vai lá conversar."`,
        true,
      );
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

    startBtn.addEventListener('click', start);
    fanBtn.addEventListener('click', fan);
    // teclado/controle: confirmar vira a carne mais passada; cima/baixo abana
    const onInteract = () => {
      if (!running && !done) return start();
      const s = slots.filter((x) => x.meat && !x.busy).sort((a, b) => b.cook - a.cook)[0];
      if (s) flip(s);
    };
    InputSystem.on('minigame:interact', onInteract);
    InputSystem.on('minigame:up', fan);
    InputSystem.on('minigame:down', fan);

    function cleanup() {
      cancelAnimationFrame(raf);
      InputSystem.off('minigame:interact', onInteract);
      InputSystem.off('minigame:up', fan);
      InputSystem.off('minigame:down', fan);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
