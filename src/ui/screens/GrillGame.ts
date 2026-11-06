import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — "Hora do churrasco" (2º encontro, quintal da Bella). O Weng assume a churrasqueira do Alexandre.
 *
 * A família vai pedindo (mãe, Alexandre, avó, Bella), cada um com a carne e o ponto que gosta.
 *  1. Pegue a carne crua na bandeja e coloque numa das 6 vagas da grelha.
 *  2. Quando aparecer a setinha, VIRE (o lado de baixo já dourou; se esquecer, queima).
 *  3. Quando estiver no ponto do pedido, tire da grelha e entregue pra quem pediu.
 *  - "Sal grosso!": o Alexandre pede sal; salgue uma carne crua pra ganhar bônus.
 *  - Labareda: gordura pinga e sobe fogo; abane rápido.
 * Dura ~2 minutos (o sol vai se pondo). Estrelas pela pontuação.
 *
 * Arte: usa os sprites de minigames/churrasco-*.png quando existirem; senão, desenha em pixel art no canvas.
 */
export interface GrillResult {
  points: number;
  stars: number;
}

type Kind = 'picanha' | 'linguica' | 'frango' | 'pao';
type Ponto = 'mal' | 'ponto' | 'bem';
interface MeatDef {
  id: Kind;
  name: string;
  rate: number; // quanto cozinha por segundo (cada lado)
  raw: string;
  ok: string;
  burnt: string;
  pontos: Ponto[];
}
const MEATS: MeatDef[] = [
  { id: 'picanha', name: 'Picanha', rate: 0.075, raw: '#e4596c', ok: '#94492a', burnt: '#2a1712', pontos: ['mal', 'ponto', 'bem'] },
  { id: 'linguica', name: 'Linguiça', rate: 0.09, raw: '#e98a86', ok: '#a5452a', burnt: '#2a1712', pontos: ['ponto', 'bem'] },
  { id: 'frango', name: 'Frango', rate: 0.065, raw: '#f3d0b3', ok: '#cf8c3c', burnt: '#33200f', pontos: ['ponto', 'bem'] },
  { id: 'pao', name: 'Pão de alho', rate: 0.12, raw: '#f7e7bb', ok: '#e7a845', burnt: '#33200f', pontos: ['ponto'] },
];
const PONTO_TXT: Record<Ponto, string> = { mal: 'mal passada', ponto: 'ao ponto', bem: 'bem passada' };
// faixas do "cozimento total" (0..2: 1 por lado)
const RANGE: Record<Ponto, [number, number]> = { mal: [1.1, 1.38], ponto: [1.38, 1.66], bem: [1.66, 1.9] };
const BURN = 2.0;
const SIDE_BURN = 1.15; // um lado sozinho passou disso = queimou embaixo

interface Guest {
  id: string;
  name: string;
  portrait: string;
  likes: Kind[];
  el: HTMLElement;
  bubble: HTMLElement;
  bar: HTMLElement;
  patience: number;
  max: number;
  wait: number;
  served: number;
}
interface Slot {
  el: HTMLElement;
  img: HTMLElement;
  gauge: HTMLElement;
  fill: HTMLElement;
  tip: HTMLElement;
  flame: HTMLElement;
  meat: MeatDef | null;
  down: number; // lado de baixo
  up: number; // lado de cima (já cozido antes de virar)
  flipped: boolean;
  salted: boolean;
  flare: number;
}

const DURATION = 120;
type Order = { kind: Kind; ponto: Ponto };

// ------------------------------------------------------------------ desenho (fallback sem sprite)
const hex = (c: string) => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mixC = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
};
const STATE_T = [0, 0.55, 0.85, 1.25]; // cru, ao ponto, bem passado, queimado
const meatColor = (m: MeatDef, t: number) => (t <= 0.74 ? mixC(m.raw, m.ok, t / 0.74) : mixC(m.ok, m.burnt, (t - 0.74) / 0.6));
const artCache = new Map<string, string>();
/** Imagem da carne num estado (0..3). Sprite real (minigames/churrasco-carnes.png, 4x4) ou pixel art desenhada. */
function meatArt(m: MeatDef, state: number, marked: boolean): string {
  const key = `${m.id}-${state}-${marked}`;
  const hit = artCache.get(key);
  if (hit) return hit;
  const W = 48;
  const H = 30;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d')!;
  const base = meatColor(m, STATE_T[state]);
  const px = (x: number, y: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x, y, 1, 1);
  };
  const shape: Record<Kind, (x: number, y: number) => boolean> = {
    picanha: (x, y) => ((x - 24) ** 2) / 400 + ((y - 16) ** 2) / 120 <= 1,
    linguica: (x, y) => Math.max(0, Math.abs(x - 24) - 15) ** 2 + (y - 16) ** 2 <= 42,
    frango: (x, y) => ((x - 21) ** 2) / 230 + ((y - 15) ** 2) / 110 <= 1 || (x > 33 && x < 44 && Math.abs(y - 15) < 3),
    pao: (x, y) => Math.max(0, Math.abs(x - 24) - 15) ** 2 + Math.max(0, Math.abs(y - 15) - 4) ** 2 <= 30,
  };
  const inside = shape[m.id];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      let col = base;
      if (m.id === 'picanha' && y < 10) col = mixC('#fbf1e2', '#5a3010', STATE_T[state]);
      if (m.id === 'frango' && x > 33) col = '#fff6e6';
      if (m.id === 'pao' && y < 13 && (x * 7 + y * 13) % 11 === 0) col = '#4f8a2e';
      if (marked && (x - y * 1.6 + 200) % 8 < 1.5) col = mixC(base, '#140805', 0.6);
      px(x, y, edge ? '#3a1a10' : col);
    }
  const url = cv.toDataURL();
  artCache.set(key, url);
  return url;
}

export function playGrillGame(parent: HTMLElement, opts: { title?: string; helper?: string } = {}): Promise<GrillResult> {
  return new Promise((resolve) => {
    const who = opts.helper ?? 'Alexandre';
    let score = 0;
    let served = 0;
    let missed = 0;
    let time = 0;
    let running = false;
    let done = false;
    let raf = 0;
    let last = 0;
    let picked: Kind | null = null;
    const orders = new Map<string, Order>();
    const orderOf = (g: Guest): Order | null => orders.get(g.id) ?? null;
    let holding: { meat: MeatDef; total: number; salted: boolean; from: Slot } | null = null;
    let saltOn = false;
    let saltCall = 18;
    let flareIn = 14;
    let talkLock = 0;
    const sprite = (name: string) => textureURL(`churrasco-${name}`);

    // ---------------------------------------------------------------- tela
    const talk = (text: string, force = false) => {
      if (!force && performance.now() < talkLock) return;
      msg.textContent = text;
      msg.classList.remove('pop');
      void msg.offsetWidth;
      msg.classList.add('pop');
      talkLock = performance.now() + 2200;
    };
    const msg = h('div', { class: 'gp-bubble' }, 'Os pedidos vão aparecer ali. Pega na bandeja, bota na grelha, vira e entrega no ponto que cada um gosta!');
    const helperPic = textureURL('portrait-pai-bella');
    const sun = h('div', { class: 'gh-sunfill' });
    const scoreEl = h('b', {}, '0');
    const hud = h('div', { class: 'gh-hud' }, h('div', { class: 'gh-sun' }, h('span', {}, '☀️'), h('div', { class: 'gh-sunbar' }, sun), h('span', {}, '🌙')), h('div', { class: 'gp-chip' }, '♥ ', scoreEl));

    // bandeja de carnes cruas
    const tray = h('div', { class: 'gh-tray' });
    const trayBtns = new Map<Kind, HTMLElement>();
    for (const m of MEATS) {
      const b = h('button', { class: 'gh-raw', title: m.name }, h('img', { src: sprite(`${m.id}-0`) ?? meatArt(m, 0, false), alt: '' }), h('small', {}, m.name));
      b.addEventListener('click', () => pick(m.id));
      trayBtns.set(m.id, b);
      tray.append(b);
    }
    const saltBtn = h('button', { class: 'gh-salt', title: 'Sal grosso' }, '🧂', h('small', {}, 'Sal'));
    const fanBtn = h('button', { class: 'gh-fan', title: 'Abanar' }, '🪭', h('small', {}, 'Abanar'));
    saltBtn.addEventListener('click', () => {
      if (!running) return;
      saltOn = !saltOn;
      picked = null;
      refreshPick();
    });
    fanBtn.addEventListener('click', () => fan());

    // grelha com 6 vagas
    const grate = h('div', { class: 'gh-grate' });
    const slots: Slot[] = [];
    for (let i = 0; i < 6; i++) {
      const img = h('div', { class: 'gh-meat' });
      const fill = h('i');
      const gauge = h('div', { class: 'gh-gauge' }, h('span', { class: 'z mal' }), h('span', { class: 'z ponto' }), h('span', { class: 'z bem' }), fill);
      const tip = h('div', { class: 'gh-tip' });
      const flame = h('div', { class: 'gh-flame' }, h('i'), h('i'), h('i'));
      const el = h('button', { class: 'gh-slot empty' }, flame, img, gauge, tip);
      const s: Slot = { el, img, gauge, fill, tip, flame, meat: null, down: 0, up: 0, flipped: false, salted: false, flare: 0 };
      el.addEventListener('click', () => clickSlot(s));
      slots.push(s);
      grate.append(el);
    }
    const grill = h(
      'div',
      { class: 'gh-grill', style: sprite('grelha') ? `background-image:url(${sprite('grelha')})` : '' },
      h('div', { class: 'gh-coals' }),
      grate,
      h('div', { class: 'gh-smoke' }, h('i'), h('i'), h('i'), h('i')),
    );
    const hand = h('div', { class: 'gh-hand' });

    // família pedindo
    const guestsEl = h('div', { class: 'gh-guests' });
    const guests: Guest[] = (
    [
      { id: 'mae', name: 'Mãe', portrait: 'portrait-mae-bella', likes: ['frango', 'pao', 'linguica'] },
      { id: 'ale', name: 'Alexandre', portrait: 'portrait-pai-bella', likes: ['picanha', 'linguica'] },
      { id: 'avo', name: 'Vó', portrait: 'portrait-avo-bella', likes: ['pao', 'frango', 'picanha'] },
      { id: 'bella', name: 'Bella', portrait: 'portrait-bella', likes: ['picanha', 'linguica', 'pao'] },
    ] as { id: string; name: string; portrait: string; likes: Kind[] }[]).map((g, i) => {
      const bubble = h('div', { class: 'gh-order' });
      const bar = h('i');
      const url = textureURL(g.portrait);
      const el = h('button', { class: 'gh-guest' }, url ? h('img', { src: url, alt: '' }) : h('span', {}, g.name[0]), h('b', {}, g.name), bubble, h('div', { class: 'gh-pat' }, bar));
      const gg: Guest = { ...g, el, bubble, bar, patience: 0, max: 1, wait: 2 + i * 3.5, served: 0 };
      el.addEventListener('click', () => serve(gg));
      guestsEl.append(el);
      return gg;
    });

    const startBtn = h('button', { class: 'btn primary gp-start' }, '🔥 Acender a churrasqueira!');
    const actions = h('div', { class: 'bg-actions' }, startBtn);
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel gh-panel' },
      h('div', { class: 'gp-title' }, h('span', {}, '🔥'), opts.title ?? 'Na churrasqueira', h('span', {}, '🔥')),
      hud,
      h('div', { class: 'gh-main' }, h('div', { class: 'gh-left' }, tray, h('div', { class: 'gh-tools' }, saltBtn, fanBtn)), h('div', { class: 'gh-center' }, grill, hand), guestsEl),
      h('div', { class: 'gp-talk' }, helperPic ? h('img', { class: 'gp-face', src: helperPic, alt: '' }) : h('div'), h('div', { class: 'gp-who' }, who), msg),
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen gr-screen gp-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    // ---------------------------------------------------------------- regras
    const pop = (anchor: HTMLElement, text: string, cls: string) => {
      const r = anchor.getBoundingClientRect();
      const R = panel.getBoundingClientRect();
      const p = h('div', { class: `gp-pop ${cls}` }, text);
      p.style.left = `${r.left - R.left + r.width / 2}px`;
      p.style.top = `${r.top - R.top}px`;
      panel.append(p);
      setTimeout(() => p.remove(), 1200);
    };
    const bump = () => {
      scoreEl.textContent = String(score);
      scoreEl.parentElement!.classList.remove('bump');
      void scoreEl.offsetWidth;
      scoreEl.parentElement!.classList.add('bump');
    };
    const refreshPick = () => {
      trayBtns.forEach((b, k) => b.classList.toggle('on', picked === k));
      saltBtn.classList.toggle('on', saltOn);
      hand.classList.toggle('on', !!holding);
      hand.replaceChildren(...(holding ? [h('img', { src: sprite(`${holding.meat.id}-${stateOf(holding.total)}`) ?? meatArt(holding.meat, stateOf(holding.total), true), alt: '' }), h('small', {}, 'entregue pra quem pediu →')] : []));
      screen.classList.toggle('gh-placing', !!picked || saltOn);
      screen.classList.toggle('gh-holding', !!holding);
    };
    const stateOf = (total: number) => (total < RANGE.mal[0] * 0.75 ? 0 : total < RANGE.ponto[1] ? 1 : total < BURN ? 2 : 3);
    const pontoOf = (total: number): Ponto | 'crua' | 'queimada' => {
      if (total >= BURN) return 'queimada';
      for (const p of ['mal', 'ponto', 'bem'] as Ponto[]) if (total >= RANGE[p][0] && total < RANGE[p][1]) return p;
      return total >= RANGE.bem[1] ? 'bem' : 'crua';
    };

    const pick = (k: Kind) => {
      if (!running || holding) return;
      picked = picked === k ? null : k;
      saltOn = false;
      AudioSystem.play('blip');
      refreshPick();
    };

    const renderSlot = (s: Slot) => {
      if (!s.meat) {
        s.el.classList.add('empty');
        s.el.classList.remove('flip', 'flaring', 'ready', 'burn');
        s.img.style.backgroundImage = '';
        s.tip.textContent = '';
        return;
      }
      const total = s.down + s.up;
      // o que se vê é o lado de cima: antes de virar, cru; depois, o lado que dourou embaixo
      const seen = s.flipped ? s.up / 1.0 : 0;
      const st = s.flipped ? (seen < 0.5 ? 0 : seen < 0.95 ? 1 : seen < SIDE_BURN ? 2 : 3) : 0;
      s.img.style.backgroundImage = `url(${sprite(`${s.meat.id}-${st}`) ?? meatArt(s.meat, st, s.flipped)})`;
      s.fill.style.width = `${Math.min(1, total / BURN) * 100}%`;
      const needFlip = !s.flipped && s.down > 0.6;
      s.el.classList.toggle('flip', needFlip);
      s.el.classList.toggle('ready', s.flipped && total >= RANGE.mal[0] && total < BURN);
      s.el.classList.toggle('burn', s.down > SIDE_BURN || total >= BURN);
      s.el.classList.toggle('flaring', s.flare > 0);
      s.el.classList.toggle('salted', s.salted);
      s.tip.textContent = needFlip ? '↻ virar!' : s.flipped ? (pontoOf(total) === 'crua' ? '' : pontoOf(total) === 'queimada' ? 'queimou!' : PONTO_TXT[pontoOf(total) as Ponto]) : '';
    };

    const clickSlot = (s: Slot) => {
      if (!running || done) return;
      if (saltOn) {
        if (s.meat && !s.salted && !s.flipped) {
          s.salted = true;
          AudioSystem.play('pickup');
          pop(s.el, 'Sal grosso! +1', 'g1');
          score += 1;
          bump();
        }
        saltOn = false;
        refreshPick();
        renderSlot(s);
        return;
      }
      if (!s.meat && holding) {
        // ninguém pediu essa? volta pra grelha (continua cozinhando de onde parou)
        s.meat = holding.meat; s.down = 0; s.up = holding.total; s.flipped = true; s.salted = holding.salted; s.flare = 0;
        s.el.classList.remove('empty');
        holding = null;
        AudioSystem.play('blip');
        refreshPick();
        renderSlot(s);
        return;
      }
      if (!s.meat) {
        if (!picked) return;
        const m = MEATS.find((x) => x.id === picked)!;
        s.meat = m; s.down = 0; s.up = 0; s.flipped = false; s.salted = false; s.flare = 0;
        s.el.classList.remove('empty');
        s.el.classList.remove('drop');
        void s.el.offsetWidth;
        s.el.classList.add('drop');
        AudioSystem.play('blip');
        picked = null;
        refreshPick();
        renderSlot(s);
        return;
      }
      if (holding) return;
      if (!s.flipped) {
        // virar
        if (s.down < 0.35) {
          talk(`${who}: "Calma! Deixa dourar embaixo primeiro."`);
          return;
        }
        [s.down, s.up] = [0, s.down];
        s.flipped = true;
        s.el.classList.remove('flipping');
        void s.el.offsetWidth;
        s.el.classList.add('flipping');
        AudioSystem.play('confirm');
        renderSlot(s);
        return;
      }
      // tirar da grelha (com o pegador)
      const total = s.down + s.up;
      holding = { meat: s.meat, total, salted: s.salted, from: s };
      s.meat = null;
      AudioSystem.play('pickup');
      renderSlot(s);
      refreshPick();
      talk(`${who}: "Agora entrega. Quem pediu ${holding.meat.name.toLowerCase()}?"`);
    };

    const LINES = {
      perfeito: ['"No ponto! Do jeitinho que eu gosto!"', '"Hmm, que delícia, querido!"', '"Esse menino sabe das coisas."'],
      quase: ['"Tá bom... só passou um tiquinho."', '"Dá pra comer sim!"'],
      ruim: ['"Isso aí tá cru, meu filho!"', '"...É carvão?"', '"Não era bem isso que eu pedi..."'],
      errado: ['"Não pedi isso não!"', '"Hm? Eu pedi outra coisa."'],
    };
    const pick1 = (a: string[]) => a[Math.floor(Math.random() * a.length)];

    const serve = (g: Guest): void => {
      const hand2 = holding;
      const order0 = orderOf(g);
      if (!running || hand2 === null) return;
      const matches = order0 !== null && order0.kind === hand2.meat.id;
      if (!matches) {
        AudioSystem.play('cancel');
        pop(g.el, 'Não é isso!', 'g0');
        talk(`${g.name}: ${pick1(LINES.errado)}`, true);
        return;
      }
      const got = pontoOf(hand2.total);
      const want = order0.ponto;
      const order = ['crua', 'mal', 'ponto', 'bem', 'queimada'];
      const dist = Math.abs(order.indexOf(got) - order.indexOf(want));
      const pts = got === 'crua' || got === 'queimada' ? 0 : dist === 0 ? 3 : dist === 1 ? 1 : 0;
      const bonus = pts > 0 && hand2.salted ? 1 : 0;
      const fast = pts > 0 && g.patience > g.max * 0.5 ? 1 : 0;
      score += pts + bonus + fast;
      served++;
      g.served++;
      bump();
      AudioSystem.play(pts === 3 ? 'pickup' : pts ? 'blip' : 'cancel');
      pop(g.el, pts === 3 ? `PERFEITO! +${pts + bonus + fast}` : pts ? `+${pts + bonus + fast}` : 'Eita...', pts === 3 ? 'g2' : pts ? 'g1' : 'g0');
      talk(`${g.name}: ${pts === 3 ? pick1(LINES.perfeito) : pts ? pick1(LINES.quase) : pick1(LINES.ruim)}`, true);
      g.el.classList.remove('happy');
      void g.el.offsetWidth;
      if (pts) g.el.classList.add('happy');
      orders.delete(g.id);
      g.wait = 3 + Math.random() * 4;
      renderGuest(g);
      holding = null;
      refreshPick();
    };

    const renderGuest = (g: Guest) => {
      const o = orderOf(g);
      g.el.classList.toggle('waiting', !!o);
      if (!o) {
        g.bubble.replaceChildren();
        g.bar.style.width = '0';
        return;
      }
      const m = MEATS.find((x) => x.id === o.kind)!;
      g.bubble.replaceChildren(h('img', { src: sprite(`${m.id}-${o.ponto === 'bem' ? 2 : 1}`) ?? meatArt(m, o.ponto === 'bem' ? 2 : 1, true), alt: '' }), h('span', {}, `${m.name}`), h('small', {}, PONTO_TXT[o.ponto]));
      const k = g.patience / g.max;
      g.bar.style.width = `${k * 100}%`;
      g.bar.style.background = k > 0.5 ? '#6fc46a' : k > 0.25 ? '#f2cf62' : '#ff6b5a';
    };

    const fan = () => {
      if (!running) return;
      const any = slots.some((s) => s.flare > 0);
      slots.forEach((s) => (s.flare = 0));
      grill.classList.remove('fanning');
      void grill.offsetWidth;
      grill.classList.add('fanning');
      AudioSystem.play(any ? 'confirm' : 'blip');
      if (any) talk(`${who}: "Boa. Fogo baixo, carne feliz."`, true);
      fanBtn.classList.remove('hot');
    };

    // ---------------------------------------------------------------- loop
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        time += dt;
        sun.style.width = `${Math.min(1, time / DURATION) * 100}%`;
        grill.style.setProperty('--dusk', String(Math.min(1, time / DURATION)));
        for (const s of slots) {
          if (!s.meat) continue;
          if (s.flare > 0) s.flare = Math.max(0, s.flare - dt);
          s.down += s.meat.rate * (s.flare > 0 ? 2.6 : 1) * dt;
          if (!s.flipped && s.down > SIDE_BURN + 0.25) {
            // esqueceu de virar: queimou de um lado
            pop(s.el, 'Queimou embaixo!', 'g0');
            AudioSystem.play('cancel');
            talk(`${who}: "Tem que virar, rapaz! Virou carvão de um lado."`, true);
            missed++;
            s.meat = null;
          } else if (s.flipped && s.down + s.up > BURN + 0.2) {
            pop(s.el, 'Carvão!', 'g0');
            AudioSystem.play('cancel');
            talk(`${who}: "...Essa aí já era."`, true);
            missed++;
            s.meat = null;
          }
          renderSlot(s);
        }
        // pedidos
        for (const g of guests) {
          if (orderOf(g)) {
            g.patience -= dt;
            if (g.patience <= 0) {
              talk(`${g.name}: "Ah, deixa... vou pegar farofa."`, true);
              pop(g.el, 'Cansou de esperar', 'g0');
              orders.delete(g.id);
              g.wait = 4;
              missed++;
            }
            renderGuest(g);
          } else if (time < DURATION - 12) {
            g.wait -= dt;
            if (g.wait <= 0) {
              const kind = g.likes[Math.floor(Math.random() * g.likes.length)];
              const m = MEATS.find((x) => x.id === kind)!;
              const ponto = g.id === 'ale' && kind === 'picanha' ? 'mal' : m.pontos[Math.floor(Math.random() * m.pontos.length)];
              orders.set(g.id, { kind, ponto });
              g.max = 48 - Math.min(14, time / 8);
              g.patience = g.max;
              AudioSystem.play('msg');
              renderGuest(g);
            }
          }
        }
        // sal grosso: o Alexandre pede de vez em quando
        saltCall -= dt;
        if (saltCall <= 0) {
          saltCall = 22 + Math.random() * 10;
          saltBtn.classList.add('call');
          setTimeout(() => saltBtn.classList.remove('call'), 4000);
          talk(`${who}: "Não esquece o sal grosso na carne crua! Faz toda a diferença."`, true);
        }
        // labareda
        flareIn -= dt;
        if (flareIn <= 0) {
          flareIn = 11 + Math.random() * 8;
          const cands = slots.filter((s) => s.meat);
          if (cands.length) {
            const s = cands[Math.floor(Math.random() * cands.length)];
            s.flare = 5;
            fanBtn.classList.add('hot');
            AudioSystem.play('horn');
            talk(`${who}: "Labareda! Abana, abana!"`, true);
          }
        }
        if (!slots.some((s) => s.flare > 0)) fanBtn.classList.remove('hot');
        if (time >= DURATION && orders.size === 0 && !holding) end();
        else if (time >= DURATION + 15) end();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const start = () => {
      if (running || done) return;
      running = true;
      actions.replaceChildren();
      talk(`${who}: "A família tá com fome. Bora, churrasqueiro!"`, true);
      guests.forEach(renderGuest);
    };

    const end = () => {
      if (done) return;
      done = true;
      running = false;
      const stars = score >= 30 ? 3 : score >= 16 ? 2 : 1;
      talk(stars === 3 ? `${who}: "...Bom rapaz. Pode voltar sempre."` : stars === 2 ? `${who}: "Dá pro gasto. Com treino melhora."` : `${who}: "Deixa que eu termino. Vai lá conversar."`, true);
      AudioSystem.play('quest');
      const close = () => {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve({ points: score, stars });
      };
      actions.replaceChildren(
        h('div', { class: 'gh-final' }, `${served} pedidos entregues · ${score} ♥${missed ? ` · ${missed} perdidos` : ''}`),
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('button', { class: 'btn primary', onclick: close }, 'Servir a mesa ♥'),
      );
      setTimeout(() => InputSystem.once('minigame:interact', close), 400);
    };

    startBtn.addEventListener('click', start);
    const onInteract = () => {
      if (!running && !done) start();
    };
    const keys = (e: KeyboardEvent) => {
      if (!running) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) pick(MEATS[n - 1].id);
      if (e.key.toLowerCase() === 'f') fan();
    };
    window.addEventListener('keydown', keys);
    InputSystem.on('minigame:interact', onInteract);
    // estado legível (testes automáticos)
    (screen as HTMLElement & { __grill?: unknown }).__grill = { slots, guests, orders, get holding() { return holding; }, get time() { return time; }, set time(v: number) { time = v; } };

    function cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keys);
      InputSystem.off('minigame:interact', onInteract);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
