import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Churrasqueira do Alexandre (2º encontro, quintal da Bella).
 * A grelha é desenhada em pixel art num canvas (brasa, fumaça, faíscas, labareda, carne mudando de cor).
 * Duas carnes ao mesmo tempo, dois lados cada: clique na carne quando a barrinha estiver no verde.
 * De vez em quando sobe uma labareda: "Abanar!" antes que queime tudo.
 * Ponto = 2, quase = 1, crua/queimada = 0 (por lado). Máximo: 16.
 */
export interface GrillResult {
  points: number;
  stars: number;
}

type Kind = 'picanha' | 'linguica' | 'frango' | 'pao';
interface MeatDef {
  id: Kind;
  name: string;
  rate: number;
  raw: string;
  ok: string;
  burnt: string;
}

const MEATS: MeatDef[] = [
  { id: 'picanha', name: 'Picanha', rate: 0.1, raw: '#e4596c', ok: '#94492a', burnt: '#2a1712' },
  { id: 'linguica', name: 'Linguiça', rate: 0.12, raw: '#e98a86', ok: '#a5452a', burnt: '#2a1712' },
  { id: 'frango', name: 'Frango', rate: 0.085, raw: '#f3d0b3', ok: '#cf8c3c', burnt: '#33200f' },
  { id: 'pao', name: 'Pão de alho', rate: 0.15, raw: '#f7e7bb', ok: '#e7a845', burnt: '#33200f' },
];
const OK_LO = 0.62;
const OK_HI = 0.86;
const Q_LO = 0.48;
const Q_HI = 0.97;
const BURN = 1.15;
const SCALE = 1.1;

// resolução do canvas (pixel art ampliada pelo CSS)
const W = 200;
const H = 112;
const SLOT_X = [58, 142];
const SLOT_Y = 48;

interface Slot {
  meat: MeatDef | null;
  side: 0 | 1;
  cook: number;
  marked: boolean;
  flare: number;
  busy: boolean;
  flipT: number; // 0..1 animação de virar
  dropT: number; // 0..1 animação de cair na grelha
  serveT: number; // 0..1 indo pro prato
  label: HTMLElement;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  kind: 'smoke' | 'spark' | 'grease' | 'ember';
  size: number;
  dark?: boolean;
}

// ------------------------------------------------------------------ cores
const hex = (c: string) => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgb = (r: number, g: number, b: number) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
const mixC = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return rgb(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k);
};
const shade = (c: string, f: number) => {
  const m = c.match(/\d+/g)!.map(Number);
  const g = (v: number) => (f >= 0 ? v + (255 - v) * f : v * (1 + f));
  return rgb(g(m[0]), g(m[1]), g(m[2]));
};
const meatColor = (m: MeatDef, d: number) => (d <= 0.74 ? mixC(m.raw, m.ok, d / 0.74) : mixC(m.ok, m.burnt, (d - 0.74) / 0.5));

/** Desenha uma carne em pixel art centrada em (cx, cy). `sq` achata na vertical (virando). */
function drawMeat(c: CanvasRenderingContext2D, m: MeatDef, cook: number, cx: number, cy: number, marked: boolean, sq = 1, sc = 1): void {
  const base = meatColor(m, cook);
  const top = shade(base, 0.22);
  const low = shade(base, -0.28);
  const line = shade(base, -0.62);
  const px = (x: number, y: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(Math.round(cx + x * sc), Math.round(cy + y * sc * sq), Math.ceil(sc), Math.ceil(sc * Math.max(sq, 0.2)));
  };
  // forma: devolve true se (x,y) está dentro, e se é borda
  let inside: (x: number, y: number) => boolean;
  let hw = 22;
  let hh = 11;
  if (m.id === 'picanha') {
    hw = 22;
    hh = 12;
    inside = (x, y) => (x * x) / (hw * hw) + (y * y) / (hh * hh) <= 1;
  } else if (m.id === 'linguica') {
    hw = 26;
    hh = 7;
    inside = (x, y) => {
      const ax = Math.max(0, Math.abs(x) - (hw - hh));
      return ax * ax + y * y <= hh * hh;
    };
  } else if (m.id === 'frango') {
    hw = 16;
    hh = 12;
    inside = (x, y) => ((x + 4) * (x + 4)) / (hw * hw) + (y * y) / (hh * hh) <= 1;
  } else {
    hw = 24;
    hh = 9;
    inside = (x, y) => {
      const ax = Math.max(0, Math.abs(x) - (hw - 6));
      const ay = Math.max(0, Math.abs(y) - (hh - 6));
      return ax * ax + ay * ay <= 36;
    };
  }
  // osso do frango (por trás)
  if (m.id === 'frango') {
    for (let x = 10; x <= 22; x++) for (let y = -2; y <= 2; y++) px(x, y, Math.abs(y) === 2 ? '#8a7a66' : y < 0 ? '#fffaf0' : '#ecdcc4');
    for (const [kx, ky] of [[22, -4], [22, 3]])
      for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) if (x * x + y * y <= 5) px(kx + x, ky + y, x * x + y * y >= 4 ? '#8a7a66' : '#fffaf0');
  }
  for (let y = -hh - 1; y <= hh + 1; y++)
    for (let x = -hw - 1; x <= hw + 1; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      let col = y < -hh * 0.35 ? top : y > hh * 0.45 ? low : base;
      // capa de gordura da picanha
      if (m.id === 'picanha' && y < -hh * 0.45) col = mixC('#fbf1e2', '#e9b45a', Math.min(1, cook * 1.1));
      if (m.id === 'picanha' && y < -hh * 0.45 && cook > 0.95) col = mixC('#e9b45a', '#3a2412', (cook - 0.95) * 3);
      // brilho da linguiça
      if (m.id === 'linguica' && y === -hh + 2 && Math.abs(x) < hw - 9 && x % 5 !== 0) col = shade(base, 0.45);
      // pão de alho: cortes e salsinha
      if (m.id === 'pao' && (x + 40) % 12 === 0 && Math.abs(y) < hh - 2) col = shade(base, -0.35);
      if (m.id === 'pao' && y < 0 && (x * 7 + y * 13 + 91) % 17 === 0) col = '#4f8a2e';
      // marcas da grelha depois de virar
      if (marked && (x - y * 1.6 + 200) % 9 < 1.6 && !edge) col = shade(base, -0.55);
      px(x, y, edge ? line : col);
    }
  // brilho
  if (cook < 0.9) px(-hw * 0.45, -hh * 0.5, 'rgba(255,255,255,0.75)');
}

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
    let combo = 0;
    let shake = 0;
    let fanT = 0;
    let time = 0;
    const parts: Particle[] = [];

    // ---------------------------------------------------------------- DOM
    const canvas = h('canvas', { class: 'gp-canvas', width: String(W), height: String(H) }) as HTMLCanvasElement;
    const ctx2 = canvas.getContext('2d')!;
    const fx = h('div', { class: 'gp-fx' });
    const labels = SLOT_X.map((x) => h('div', { class: 'gp-label', style: `left:${(x / W) * 100}%` }));
    const comboEl = h('div', { class: 'gp-combo' });
    const bg = textureURL('map-piabeta-quintal-bg');
    const stage = h(
      'div',
      { class: 'gp-stage' },
      bg ? h('div', { class: 'gp-bg', style: `background-image:url(${bg})` }) : null,
      h('div', { class: 'gp-glow' }),
      canvas,
      ...labels,
      fx,
      comboEl,
    );
    const helperPic = textureURL(`portrait-${!opts.helper || opts.helper === 'Alexandre' ? 'pai-bella' : opts.helper}`);
    const msg = h('div', { class: 'gp-bubble' }, `Duas carnes de cada vez. Clica na carne pra virar quando a barrinha tiver no verde. Subiu fogo? Abana!`);
    const face = helperPic ? h('img', { class: 'gp-face', src: helperPic, alt: '' }) : h('div');
    const talk = (text: string, force = false) => {
      if (!force && performance.now() < talkLock) return;
      msg.textContent = text;
      msg.classList.remove('pop');
      face.classList.remove('nod');
      void msg.offsetWidth;
      msg.classList.add('pop');
      face.classList.add('nod');
      talkLock = performance.now() + 1700;
    };
    const plate = h('div', { class: 'gp-plate' });
    const scoreN = h('b', {}, '0');
    const servedN = h('span', {}, `0/${MEATS.length}`);
    const score = h('div', { class: 'gp-score' }, h('div', { class: 'gp-chip' }, '♥ ', scoreN), h('div', { class: 'gp-chip alt' }, '🍖 ', servedN));
    const fanBtn = h('button', { class: 'gp-fan', 'aria-label': 'Abanar' }, h('span', { class: 'gp-fan-ico' }, '🪭'), 'Abanar!');
    const startBtn = h('button', { class: 'btn primary gp-start' }, '🔥 Acender a brasa!');
    const actions = h('div', { class: 'bg-actions' }, startBtn);
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel' },
      h('div', { class: 'gp-title' }, h('span', {}, '🔥'), opts.title ?? 'Na churrasqueira', h('span', {}, '🔥')),
      h(
        'div',
        { class: 'gp-main' },
        stage,
        h(
          'div',
          { class: 'gp-side' },
          score,
          h('div', { class: 'gp-plate-wrap' }, plate, h('div', { class: 'gp-plate-label' }, 'prato da mesa')),
          h('div', { class: 'gp-talk' }, face, h('div', { class: 'gp-who' }, who), msg),
        ),
      ),
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen gr-screen gp-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const slots: Slot[] = labels.map((label) => ({ meat: null, side: 0, cook: 0, marked: false, flare: 0, busy: false, flipT: 1, dropT: 1, serveT: 0, label }));

    // ---------------------------------------------------------------- efeitos
    const burst = (sx: number, glyphs: string[], n: number, colors: string[]) => {
      for (let i = 0; i < n; i++) {
        const g = h('i', { class: 'gp-burst' }, glyphs[i % glyphs.length]);
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
        const d = 30 + Math.random() * 50;
        g.style.left = `${(sx / W) * 100}%`;
        g.style.top = `${(SLOT_Y / H) * 100}%`;
        g.style.setProperty('--dx', `${Math.cos(a) * d}px`);
        g.style.setProperty('--dy', `${Math.sin(a) * d - 20}px`);
        g.style.color = colors[i % colors.length];
        fx.append(g);
        setTimeout(() => g.remove(), 900);
      }
    };
    const pop = (sx: number, text: string, cls: string) => {
      const p = h('div', { class: `gp-pop ${cls}` }, text);
      p.style.left = `${(sx / W) * 100}%`;
      fx.append(p);
      setTimeout(() => p.remove(), 1200);
    };
    const bumpScore = () => {
      scoreN.textContent = String(points);
      servedN.textContent = `${served}/${MEATS.length}`;
      scoreN.parentElement!.classList.remove('bump');
      void scoreN.offsetWidth;
      scoreN.parentElement!.classList.add('bump');
    };
    const addPlate = (m: MeatDef) => {
      const cv = h('canvas', { class: 'gp-piece', width: '60', height: '34' }) as HTMLCanvasElement;
      drawMeat(cv.getContext('2d')!, m, OK_LO + 0.08, 30, 17, true, 1, 1);
      plate.append(cv);
    };

    // ---------------------------------------------------------------- lógica
    const place = (s: Slot) => {
      if (next >= MEATS.length) return;
      const m = MEATS[next++];
      Object.assign(s, { meat: m, side: 0, cook: 0, marked: false, flare: 0, busy: false, flipT: 1, dropT: 0, serveT: 0 });
      s.label.textContent = `${m.name} · 1º lado`;
      s.label.classList.add('on');
      AudioSystem.play('blip');
    };

    const LINES = {
      ok: ['No ponto. Aprovado.', 'Hm. Sabe fazer churrasco.', 'Isso. Isso aí.', 'Olha a cor dessa carne...'],
      quase: ['Passou um pouquinho. Mas come.', 'Quase. Quase.'],
      crua: ['Tá mugindo ainda, rapaz.', 'Calma! Deixa dourar.'],
      queimada: ['...Isso aí é carvão.', 'Crocante. Bem crocante.'],
      fogo: ['Fogo! Abana, abana!', 'Gordura pingou. Abana!', 'Labareda! Rápido!'],
      abanou: ['Boa. Fogo baixo, carne feliz.', 'Isso, controla a brasa.'],
      vento: ['Tá abanando o nada?', 'Calor, Weng?'],
      combo: ['Tá pegando o jeito, hein!', 'Sequência boa. Tô de olho.', 'Esse aí eu deixo voltar.'],
    };
    const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

    const flip = (i: number, burnt = false) => {
      const s = slots[i];
      if (!running || done || !s.meat || s.busy || s.flipT < 1 || s.dropT < 1) return;
      const d = s.cook;
      const g = !burnt && d >= OK_LO && d <= OK_HI ? 2 : !burnt && d >= Q_LO && d <= Q_HI ? 1 : 0;
      points += g;
      combo = g === 2 ? combo + 1 : 0;
      const x = SLOT_X[i];
      if (g === 2) {
        AudioSystem.play('pickup');
        pop(x, combo >= 2 ? `PERFEITO! x${combo}` : 'PERFEITO!', 'g2');
        burst(x, ['♥', '★', '✦', '♥'], 14, ['#ff7eb6', '#ffd75e', '#fff', '#8dff86']);
        talk(combo >= 3 ? pick(LINES.combo) : pick(LINES.ok), true);
      } else if (g === 1) {
        AudioSystem.play('blip');
        pop(x, d < OK_LO ? 'Quase!' : 'Passou um pouco', 'g1');
        burst(x, ['✦'], 6, ['#ffd75e']);
        talk(pick(LINES.quase), true);
      } else {
        AudioSystem.play('cancel');
        pop(x, d < Q_LO ? 'Crua!' : 'Queimou!', 'g0');
        if (d >= Q_LO) for (let k = 0; k < 12; k++) parts.push({ x: x + (Math.random() - 0.5) * 30, y: SLOT_Y, vx: (Math.random() - 0.5) * 8, vy: -14 - Math.random() * 10, life: 0, max: 1.6, kind: 'smoke', size: 4 + Math.random() * 4, dark: true });
        talk(d < Q_LO ? pick(LINES.crua) : pick(LINES.queimada), true);
      }
      comboEl.textContent = combo >= 2 ? `🔥 Combo x${combo}` : '';
      comboEl.classList.toggle('on', combo >= 2);
      // chiado: gotinhas de gordura pulando
      for (let k = 0; k < 10; k++) parts.push({ x: x + (Math.random() - 0.5) * 36, y: SLOT_Y + 6, vx: (Math.random() - 0.5) * 50, vy: -40 - Math.random() * 40, life: 0, max: 0.5, kind: 'grease', size: 1 });
      if (s.side === 0) {
        s.side = 1;
        s.cook = 0;
        s.flipT = 0;
        s.label.textContent = `${s.meat.name} · 2º lado`;
      } else {
        const m = s.meat;
        s.busy = true;
        s.flare = 0;
        s.serveT = 0.0001;
        setTimeout(() => {
          served++;
          addPlate(m);
          bumpScore();
          s.meat = null;
          s.label.classList.remove('on');
          if (next < MEATS.length) setTimeout(() => running && place(s), 800);
          else if (slots.every((x2) => !x2.meat)) end();
        }, 520);
      }
      bumpScore();
    };

    const fan = () => {
      if (!running || done) return;
      fanT = 0.45;
      const any = slots.some((s) => s.flare > 0);
      slots.forEach((s) => (s.flare = 0));
      fanBtn.classList.remove('hot', 'swing');
      void fanBtn.offsetWidth;
      fanBtn.classList.add('swing');
      AudioSystem.play(any ? 'confirm' : 'blip');
      if (any) pop(100, 'Ufa!', 'g1');
      talk(any ? pick(LINES.abanou) : pick(LINES.vento), any);
    };

    // ---------------------------------------------------------------- desenho
    const draw = () => {
      const c = ctx2;
      c.clearRect(0, 0, W, H);
      const ox = shake > 0 ? Math.round((Math.random() - 0.5) * 3) : 0;
      c.save();
      c.translate(ox, 0);
      // tijolos da churrasqueira
      for (let y = 0; y < H; y += 6)
        for (let x = -(y % 12 === 0 ? 0 : 6); x < W; x += 12) {
          c.fillStyle = (x * 3 + y * 7) % 5 === 0 ? '#b5502f' : '#a3452a';
          c.fillRect(x, y, 11, 5);
          c.fillStyle = '#c86640';
          c.fillRect(x, y, 11, 1);
        }
      c.fillStyle = '#5e2a1a';
      for (let y = 5; y < H; y += 6) c.fillRect(0, y, W, 1);
      // boca da churrasqueira
      const bx = 10;
      const by = 16;
      const bw = W - 20;
      const bh = 80;
      c.fillStyle = '#1b0f0b';
      c.fillRect(bx, by, bw, bh);
      // brasas
      // carvões: pedrinhas escuras com o miolo pulsando em brasa
      for (let y = by + 48; y < by + bh; y += 2)
        for (let x = bx + 2; x < bx + bw - 2; x += 2) {
          const lump = Math.sin(x * 0.55) * Math.sin(y * 0.9 + x * 0.21);
          const n = Math.sin(x * 0.7 + time * 2.1) + Math.sin(y * 1.3 - time * 1.6) + Math.sin((x + y) * 0.3 + time * 1.1);
          const heat = Math.max(0, Math.min(1, (n + 1.5) / 3.4 + (y - by - 48) / 70 + lump * 0.25));
          c.fillStyle = heat > 0.92 ? '#ffd36a' : heat > 0.78 ? '#ff8d2e' : heat > 0.6 ? '#d8441f' : heat > 0.42 ? '#6e2414' : '#24120d';
          c.fillRect(x, y, 2, 2);
        }
      // brilho subindo das brasas
      const grd = c.createLinearGradient(0, by + 20, 0, by + bh);
      grd.addColorStop(0, 'rgba(255,120,40,0)');
      grd.addColorStop(1, `rgba(255,140,50,${0.25 + Math.sin(time * 4) * 0.05})`);
      c.fillStyle = grd;
      c.fillRect(bx, by, bw, bh);
      // grelha
      for (let y = by + 8; y < by + bh - 10; y += 7) {
        c.fillStyle = '#2a2424';
        c.fillRect(bx + 2, y, bw - 4, 2);
        c.fillStyle = '#8b8080';
        c.fillRect(bx + 2, y, bw - 4, 1);
      }
      for (const x of [bx + 3, bx + bw - 5]) {
        c.fillStyle = '#4a4040';
        c.fillRect(x, by + 6, 2, bh - 14);
      }
      // moldura
      c.fillStyle = '#6e2a16';
      c.fillRect(bx - 2, by - 2, bw + 4, 2);
      c.fillRect(bx - 2, by + bh, bw + 4, 3);

      // carnes, labaredas e barrinhas
      slots.forEach((s, i) => {
        const x = SLOT_X[i];
        if (s.meat) {
          // labareda por trás
          if (s.flare > 0) drawFlames(c, x, SLOT_Y + 14, 34, 1);
          let y = SLOT_Y;
          let sq = 1;
          let sc = 1.35;
          let alpha = 1;
          if (s.dropT < 1) {
            const t = s.dropT;
            y = SLOT_Y - (1 - t) * (1 - t) * 60 + Math.sin(t * Math.PI) * -4;
            sq = t < 0.85 ? 1 : 1 - Math.sin(((t - 0.85) / 0.15) * Math.PI) * 0.25;
          }
          if (s.flipT < 1) {
            const t = s.flipT;
            y -= Math.sin(t * Math.PI) * 18;
            sq = Math.max(0.12, Math.abs(Math.cos(t * Math.PI)));
          }
          if (s.serveT > 0) {
            const t = s.serveT;
            y -= t * 50;
            sc = 1.35 * (1 - t * 0.6);
            alpha = 1 - t;
          }
          c.globalAlpha = alpha;
          // sombra na grelha
          c.fillStyle = 'rgba(0,0,0,0.35)';
          c.fillRect(x - 28, SLOT_Y + 14, 56, 3);
          drawMeat(c, s.meat, s.cook, x + (s.serveT > 0 ? s.serveT * 60 : 0), y, s.marked && (s.flipT >= 0.5 || s.side === 1), sq, sc);
          c.globalAlpha = 1;
          if (s.flare > 0) drawFlames(c, x, SLOT_Y + 16, 26, 0.75);
          // barrinha do ponto
          if (!s.busy) drawGauge(c, x, 87, s.cook);
        }
      });
      // partículas
      for (const p of parts) {
        const k = 1 - p.life / p.max;
        if (p.kind === 'smoke') {
          c.fillStyle = p.dark ? `rgba(50,40,40,${0.5 * k})` : `rgba(235,230,225,${0.35 * k})`;
          const r = p.size * (1 + (1 - k) * 1.5);
          c.beginPath();
          c.arc(p.x, p.y, r, 0, Math.PI * 2);
          c.fill();
        } else if (p.kind === 'spark' || p.kind === 'ember') {
          c.fillStyle = k > 0.6 ? '#fff2a8' : k > 0.3 ? '#ffb13b' : '#ff5a24';
          c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
        } else {
          c.fillStyle = `rgba(255,250,235,${k})`;
          c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
        }
      }
      // vento do abanador
      if (fanT > 0) {
        c.fillStyle = `rgba(255,255,255,${fanT})`;
        for (let k = 0; k < 6; k++) {
          const yy = 24 + k * 12;
          const xx = ((1 - fanT / 0.45) * 260 + k * 23) % 220 - 10;
          c.fillRect(xx, yy, 18, 1);
          c.fillRect(xx + 6, yy + 3, 10, 1);
        }
      }
      c.restore();
    };

    function drawFlames(c: CanvasRenderingContext2D, cx: number, by: number, w: number, a: number): void {
      c.globalAlpha = a;
      for (let k = 0; k < 7; k++) {
        const fx2 = cx - w / 2 + (k + 0.5) * (w / 7);
        const hgt = 14 + Math.sin(time * 14 + k * 1.7) * 5 + (k % 2) * 6;
        for (let y = 0; y < hgt; y++) {
          const t = y / hgt;
          const half = Math.max(0, (1 - t) * 3.2 + Math.sin(time * 20 + y + k) * 0.6);
          c.fillStyle = t < 0.3 ? '#fff4b0' : t < 0.55 ? '#ffc23d' : t < 0.8 ? '#ff7a1e' : '#d8341f';
          c.fillRect(Math.round(fx2 - half), Math.round(by - y), Math.max(1, Math.round(half * 2)), 1);
        }
      }
      c.globalAlpha = 1;
    }

    function drawGauge(c: CanvasRenderingContext2D, cx: number, y: number, v: number): void {
      const w = 64;
      const x0 = Math.round(cx - w / 2);
      const z = (a: number) => x0 + Math.round((a / SCALE) * w);
      c.fillStyle = '#1b0f0b';
      c.fillRect(x0 - 1, y - 1, w + 2, 7);
      c.fillStyle = '#f2b8b8';
      c.fillRect(x0, y, w, 5);
      c.fillStyle = '#f2cf62';
      c.fillRect(z(Q_LO), y, z(OK_LO) - z(Q_LO), 5);
      c.fillRect(z(OK_HI), y, z(Q_HI) - z(OK_HI), 5);
      const inOk = v >= OK_LO && v <= OK_HI;
      c.fillStyle = inOk ? (Math.sin(time * 18) > 0 ? '#a6ff9a' : '#6fd468') : '#6fc46a';
      c.fillRect(z(OK_LO), y, z(OK_HI) - z(OK_LO), 5);
      c.fillStyle = '#4a2a20';
      c.fillRect(z(Q_HI), y, x0 + w - z(Q_HI), 5);
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(x0, y, w, 1);
      // marcador
      const mx = z(Math.min(SCALE, v));
      c.fillStyle = '#fff';
      c.fillRect(mx, y - 2, 1, 9);
      c.fillRect(mx - 2, y - 4, 5, 1);
      c.fillRect(mx - 1, y - 3, 3, 1);
      if (inOk) {
        c.strokeStyle = `rgba(166,255,154,${0.5 + Math.sin(time * 18) * 0.4})`;
        c.strokeRect(x0 - 2.5, y - 2.5, w + 5, 10);
      }
    }

    // ---------------------------------------------------------------- loop
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      time += dt;
      if (shake > 0) shake -= dt;
      if (fanT > 0) fanT = Math.max(0, fanT - dt);
      // brasas soltando faíscas o tempo todo
      if (Math.random() < 0.35) parts.push({ x: 14 + Math.random() * 172, y: 90, vx: (Math.random() - 0.5) * 10, vy: -20 - Math.random() * 25, life: 0, max: 1 + Math.random(), kind: 'ember', size: 1 });
      for (const s of slots) {
        if (s.dropT < 1) s.dropT = Math.min(1, s.dropT + dt * 2.6);
        if (s.flipT < 1) {
          s.flipT = Math.min(1, s.flipT + dt * 2.4);
          if (s.flipT >= 0.5) s.marked = true;
        }
        if (s.serveT > 0) s.serveT = Math.min(1, s.serveT + dt * 2);
        if (!running || !s.meat || s.busy) continue;
        if (s.flare > 0) s.flare = Math.max(0, s.flare - dt);
        s.cook += s.meat.rate * (s.flare > 0 ? 2.4 : 1) * dt;
        const i = slots.indexOf(s);
        const x = SLOT_X[i];
        // fumaça proporcional ao ponto (preta quando passa)
        if (Math.random() < 0.12 + s.cook * 0.25)
          parts.push({ x: x + (Math.random() - 0.5) * 30, y: SLOT_Y - 6, vx: (Math.random() - 0.5) * 6, vy: -12 - Math.random() * 8, life: 0, max: 1.4, kind: 'smoke', size: 2 + Math.random() * 2.5, dark: s.cook > Q_HI });
        if (Math.random() < 0.18) parts.push({ x: x + (Math.random() - 0.5) * 40, y: SLOT_Y + 8, vx: (Math.random() - 0.5) * 30, vy: -30 - Math.random() * 20, life: 0, max: 0.35, kind: 'grease', size: 1 });
        if (s.flare > 0 && Math.random() < 0.6) parts.push({ x: x + (Math.random() - 0.5) * 30, y: SLOT_Y, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 30, life: 0, max: 0.8, kind: 'spark', size: 1 });
        if (s.cook >= BURN) flip(i, true);
      }
      for (let k = parts.length - 1; k >= 0; k--) {
        const p = parts[k];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 'grease') p.vy += 160 * dt;
        if (p.life >= p.max) parts.splice(k, 1);
      }
      if (running) {
        flareIn -= dt;
        if (flareIn <= 0) {
          flareIn = 6 + Math.random() * 5;
          const cands = slots.filter((s) => s.meat && !s.busy && s.flare === 0 && s.cook < OK_HI);
          if (cands.length) {
            const s = cands[Math.floor(Math.random() * cands.length)];
            s.flare = 4.5;
            shake = 0.4;
            AudioSystem.play('horn');
            fanBtn.classList.add('hot');
            pop(SLOT_X[slots.indexOf(s)], 'FOGO!', 'g0');
            talk(pick(LINES.fogo), true);
          }
        }
        if (!slots.some((s) => s.flare > 0)) fanBtn.classList.remove('hot');
      }
      draw();
      // estado legível (testes automáticos / acessibilidade)
      canvas.dataset.zones = slots.map((s) => (!s.meat || s.busy ? '-' : s.cook >= OK_LO && s.cook <= OK_HI ? 'ok' : s.flare > 0 ? 'fire' : 'cook')).join(',');
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const start = () => {
      if (running || done) return;
      running = true;
      actions.replaceChildren(fanBtn);
      talk('Picanha primeiro. Fica de olho na cor.', true);
      place(slots[0]);
      setTimeout(() => running && place(slots[1]), 2600);
    };

    const end = () => {
      if (done) return;
      done = true;
      running = false;
      fanBtn.classList.remove('hot');
      const stars = points >= 12 ? 3 : points >= 7 ? 2 : 1;
      talk(stars === 3 ? '...Bom rapaz. Pode voltar sempre.' : stars === 2 ? 'Dá pro gasto. Com treino melhora.' : 'Deixa que eu termino. Vai lá conversar.', true);
      AudioSystem.play('quest');
      if (stars === 3) for (const x of [40, 100, 160]) burst(x, ['♥', '★', '✦'], 16, ['#ff7eb6', '#ffd75e', '#fff']);
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
    // clique na grelha: vira a carne do lado clicado
    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      flip(x < W / 2 ? 0 : 1);
    });
    const onInteract = () => {
      if (!running && !done) return start();
      const cand = slots
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.meat && !s.busy)
        .sort((a, b) => b.s.cook - a.s.cook)[0];
      if (cand) flip(cand.i);
    };
    InputSystem.on('minigame:interact', onInteract);
    InputSystem.on('minigame:up', fan);
    InputSystem.on('minigame:down', fan);
    bumpScore();

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
