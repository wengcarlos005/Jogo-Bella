import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Churrasqueira do Alexandre (2º encontro, quintal da Bella). 10 FASES DE TIMING.
 * Em cada fase uma carne vai pra grelha; o marcador corre pela barra de ponto (e a carne muda de cor
 * junto). Aperte "Virar!" quando o marcador estiver no verde. As fases vão ficando mais rápidas, o verde
 * mais estreito e, das últimas, o verde muda de lugar ou o fogo dá uns "trancos".
 * (Descrição antiga abaixo, das versões anteriores.)
 * A grelha é desenhada num canvas (brasa, fumaça, faíscas, labareda); as carnes são sprites com 4 pontos.
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

/** Sprites das carnes (art-source/minigames/churrasco-carnes.webp): 4 pontos cada — cru, dourando, no ponto, carvão. */
const MEAT_IMG: Record<string, HTMLImageElement[]> = {};
function meatImgs(id: string): HTMLImageElement[] {
  if (!MEAT_IMG[id])
    MEAT_IMG[id] = [0, 1, 2, 3].map((k) => {
      const im = new Image();
      im.src = new URL(`assets/minigames/churr-${id}-${k}.png`, document.baseURI).href;
      return im;
    });
  return MEAT_IMG[id];
}
/** Desenha a carne com sprite, misturando os 4 pontos conforme o cozimento; a base fica sempre no mesmo lugar. */
function drawMeatSprite(c: CanvasRenderingContext2D, id: string, cook: number, cx: number, cy: number, sq: number, w: number): boolean {
  const imgs = meatImgs(id);
  if (!imgs.every((im) => im.complete && im.naturalWidth > 0)) return false;
  const st = cook <= 0.37 ? cook / 0.37 : cook <= 0.74 ? 1 + (cook - 0.37) / 0.37 : Math.min(3, 2 + (cook - 0.74) / 0.36);
  const k = Math.floor(st);
  const f = st - k;
  const sc = w / imgs[0].naturalWidth;
  const base = cy + (imgs[0].naturalHeight * sc) / 2;
  c.save();
  c.imageSmoothingEnabled = true;
  const put = (im: HTMLImageElement, a: number) => {
    if (a <= 0) return;
    const iw = im.naturalWidth * sc;
    const ih = im.naturalHeight * sc * sq;
    c.globalAlpha = a;
    c.drawImage(im, Math.round(cx - iw / 2), Math.round(base - (base - cy) * (1 - sq) - ih), iw, ih);
  };
  put(imgs[k], 1);
  if (k < 3) put(imgs[k + 1], f);
  c.restore();
  return true;
}

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


interface Phase { meat: Kind; speed: number; okW: number; okC: number; twist?: 'fogo' | 'anda' | 'dupla'; line: string }
const PHASES: Phase[] = [
  { meat: 'pao', speed: 0.3, okW: 0.26, okC: 0.6, line: 'Começa pelo pão de alho. Esse é tranquilo.' },
  { meat: 'linguica', speed: 0.34, okW: 0.24, okC: 0.6, line: 'Linguiça. Nem crua, nem carvão.' },
  { meat: 'frango', speed: 0.38, okW: 0.22, okC: 0.62, line: 'Frango tem que ficar bem feitinho.' },
  { meat: 'picanha', speed: 0.42, okW: 0.2, okC: 0.58, line: 'Agora a picanha. Respeita a picanha.' },
  { meat: 'linguica', speed: 0.48, okW: 0.18, okC: 0.62, twist: 'fogo', line: 'Cuidado que a gordura pinga e o fogo dá tranco!' },
  { meat: 'pao', speed: 0.52, okW: 0.17, okC: 0.55, line: 'Mais pão de alho. A vó pediu.' },
  { meat: 'frango', speed: 0.56, okW: 0.16, okC: 0.6, twist: 'anda', line: 'Esse frango tem vontade própria... o ponto muda.' },
  { meat: 'picanha', speed: 0.6, okW: 0.15, okC: 0.66, twist: 'fogo', line: 'A picanha do Alexandre. Sem pressão.' },
  { meat: 'linguica', speed: 0.66, okW: 0.14, okC: 0.6, twist: 'dupla', line: 'Duas viradas seguidas! Uma de cada lado.' },
  { meat: 'picanha', speed: 0.72, okW: 0.13, okC: 0.62, twist: 'anda', line: 'Última. A melhor parte do boi. Capricha.' },
];
const W = 200;
const H = 112;
/** O canvas desenha em 4x (as sprites ficam nítidas); a lógica continua em 200x112. */
const SC = 4;
const fxImg = (f: string) => {
  const im = new Image();
  im.src = new URL(`assets/minigames/churr-${f}.png`, document.baseURI).href;
  return im;
};
/** Sprites da churrasqueira (art-source/minigames/churrasco-grelha.webp). */
const FX = {
  get grelha() {
    return (FX_CACHE.grelha ??= fxImg('grelha'));
  },
  get fogo() {
    return (FX_CACHE.fogo ??= [fxImg('fogo1'), fxImg('fogo2'), fxImg('fogo3')]);
  },
  get fumaca() {
    return (FX_CACHE.fumaca ??= [fxImg('fumaca1'), fxImg('fumaca2')]);
  },
  get estrela() {
    return (FX_CACHE.estrela ??= fxImg('estrela'));
  },
};
const FX_CACHE: { grelha?: HTMLImageElement; fogo?: HTMLImageElement[]; fumaca?: HTMLImageElement[]; estrela?: HTMLImageElement } = {};

export function playGrillGame(parent: HTMLElement, opts: { title?: string; helper?: string } = {}): Promise<GrillResult> {
  return new Promise((resolve) => {
    const who = opts.helper ?? 'Alexandre';
    let phase = 0;
    let points = 0;
    let pos = 0;
    let dir = 1;
    let okC = 0.6;
    let okW = 0.2;
    let speedMul = 1;
    let running = false;
    let done = false;
    let raf = 0;
    let last = 0;
    let time = 0;
    let flipT = 1;
    let marked = false;
    let side = 0;
    let shake = 0;
    let dropT = 1;
    const grades: number[] = [];

    const canvas = h('canvas', { class: 'gp-canvas', width: String(W * SC), height: String(H * SC) }) as HTMLCanvasElement;
    const c = canvas.getContext('2d')!;
    const fx = h('div', { class: 'gp-fx' });
    const bg = textureURL('map-piabeta-quintal-bg');
    const stage = h('div', { class: 'gp-stage gt-stage' }, bg ? h('div', { class: 'gp-bg', style: `background-image:url(${bg})` }) : null, h('div', { class: 'gp-glow' }), canvas, fx);
    const cursor = h('div', { class: 'gt-cursor' });
    const zone = h('div', { class: 'gt-ok' });
    const bar = h('div', { class: 'gt-bar' }, h('div', { class: 'gt-raw' }), zone, h('div', { class: 'gt-burn' }), cursor);
    const labels = h('div', { class: 'gt-labels' }, h('span', {}, 'crua'), h('span', {}, 'no ponto'), h('span', {}, 'carvão'));
    const phaseEl = h('div', { class: 'gt-phase' });
    const dots = h('div', { class: 'gt-dots' }, ...PHASES.map(() => h('i')));
    const meatName = h('div', { class: 'gt-meat' });
    const helperPic = textureURL('portrait-pai-bella');
    const msg = h('div', { class: 'gp-bubble' }, '10 rodadas. Aperta "Virar!" (ou espaço) quando o marcador estiver no verde.');
    const flipBtn = h('button', { class: 'gt-flip' }, '↻ Virar!');
    const startBtn = h('button', { class: 'btn primary gp-start' }, '🔥 Acender a brasa!');
    const actions = h('div', { class: 'bg-actions' }, startBtn);
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel gt-panel' },
      h('div', { class: 'gp-title' }, h('span', {}, '🔥'), opts.title ?? 'Na churrasqueira', h('span', {}, '🔥')),
      h('div', { class: 'gt-top' }, phaseEl, dots),
      stage,
      h('div', { class: 'gt-under' }, meatName, bar, labels),
      h('div', { class: 'gp-talk' }, helperPic ? h('img', { class: 'gp-face', src: helperPic, alt: '' }) : h('div'), h('div', { class: 'gp-who' }, who), msg),
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen gr-screen gp-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const talk = (t: string) => {
      msg.textContent = t;
      msg.classList.remove('pop');
      void msg.offsetWidth;
      msg.classList.add('pop');
    };
    const pop = (text: string, cls: string) => {
      const p = h('div', { class: `gp-pop ${cls}` }, text);
      p.style.left = '50%';
      fx.append(p);
      setTimeout(() => p.remove(), 1200);
    };
    const burst = (n: number) => {
      for (let i = 0; i < n; i++) {
        const g = h('i', { class: 'gp-burst' }, ['♥', '★', '✦'][i % 3]);
        const a = (i / n) * Math.PI * 2;
        g.style.left = '50%';
        g.style.top = '45%';
        g.style.setProperty('--dx', `${Math.cos(a) * 70}px`);
        g.style.setProperty('--dy', `${Math.sin(a) * 50 - 20}px`);
        g.style.color = ['#ff7eb6', '#ffd75e', '#8dff86'][i % 3];
        fx.append(g);
        setTimeout(() => g.remove(), 900);
      }
    };
    const P = () => PHASES[Math.min(phase, PHASES.length - 1)];
    const meatDef = () => MEATS.find((m) => m.id === P().meat)!;
    for (const mm of MEATS) meatImgs(mm.id);
    void [FX.grelha, FX.fogo, FX.fumaca, FX.estrela];
    const layoutZone = () => {
      zone.style.left = `${(okC - okW / 2) * 100}%`;
      zone.style.width = `${okW * 100}%`;
    };
    const setPhase = () => {
      const p = P();
      okC = p.okC;
      okW = p.okW;
      pos = 0;
      dir = 1;
      side = 0;
      marked = false;
      dropT = 0;
      layoutZone();
      phaseEl.textContent = `Fase ${phase + 1} de ${PHASES.length}`;
      meatName.textContent = meatDef().name + (p.twist === 'dupla' ? ' · 2 viradas' : '');
      [...dots.children].forEach((d, i) => d.className = i < grades.length ? `g${grades[i]}` : i === phase ? 'now' : '');
      talk(`${who}: "${p.line}"`);
    };

    const flip = () => {
      if (!running || done || flipT < 1 || dropT < 1) return;
      const p = P();
      const d = Math.abs(pos - okC);
      const g = d <= okW / 2 ? 2 : d <= okW / 2 + 0.09 ? 1 : 0;
      flipT = 0;
      AudioSystem.play(g === 2 ? 'pickup' : g === 1 ? 'blip' : 'cancel');
      if (p.twist === 'dupla' && side === 0) {
        // primeira virada da fase dupla: conta metade e vira pro outro lado
        side = 1;
        marked = true;
        pop(g === 2 ? 'Boa! Agora o outro lado' : g ? 'Quase...' : 'Ih...', g === 2 ? 'g2' : g ? 'g1' : 'g0');
        points += g / 2;
        pos = 0;
        dir = 1;
        return;
      }
      const got = p.twist === 'dupla' ? g / 2 : g;
      points += got;
      grades.push(g);
      marked = true;
      if (g === 2) {
        pop('PERFEITO!', 'g2');
        burst(14);
        talk(`${who}: "${['No ponto. Aprovado.', 'Hm. Sabe fazer churrasco.', 'Isso. Isso aí.', 'Olha a cor dessa carne...'][phase % 4]}"`);
      } else if (g === 1) {
        pop(pos < okC ? 'Quase... tava cruinha' : 'Passou um pouco', 'g1');
        talk(`${who}: "Quase. Dá pra comer."`);
      } else {
        pop(pos < okC ? 'Crua!' : 'Queimou!', 'g0');
        shake = 0.35;
        talk(`${who}: "${pos < okC ? 'Tá mugindo ainda, rapaz.' : '...Isso aí é carvão.'}"`);
      }
      running = false;
      setTimeout(() => {
        phase++;
        if (phase >= PHASES.length) return end();
        setPhase();
        running = true;
      }, 1500);
    };

    const draw = () => {
      c.setTransform(SC, 0, 0, SC, 0, 0);
      c.clearRect(0, 0, W, H);
      c.save();
      if (shake > 0) c.translate(Math.round((Math.random() - 0.5) * 4), 0);
      const art = FX.grelha.complete && FX.grelha.naturalWidth > 0;
      // a churrasqueira de tijolinho (sprite); a grelha fica entre y≈43 e y≈85 do canvas
      const gw = 196;
      const gh = art ? (gw * FX.grelha.naturalHeight) / FX.grelha.naturalWidth : 0;
      const gy = H - gh - 1;
      if (art) {
        c.fillStyle = '#2a140e';
        c.fillRect(0, 0, W, H);
        c.imageSmoothingEnabled = true;
        c.drawImage(FX.grelha, (W - gw) / 2, gy, gw, gh);
        // brasa respirando por cima do carvão
        const glow = c.createRadialGradient(W / 2, gy + gh * 0.62, 6, W / 2, gy + gh * 0.62, 80);
        glow.addColorStop(0, `rgba(255,150,40,${0.22 + Math.sin(time * 5) * 0.08 + Math.sin(time * 13) * 0.04})`);
        glow.addColorStop(1, 'rgba(255,90,20,0)');
        c.fillStyle = glow;
        c.fillRect(0, gy, W, gh);
      } else {
        drawOldGrill();
      }
      // a carne no meio, grande; cor = ponto atual
      const m = meatDef();
      const rest = art ? gy + gh * 0.5 : 58;
      let y = rest;
      let sq = 1;
      if (dropT < 1) {
        y = rest - (1 - dropT) * (1 - dropT) * 70;
      }
      if (flipT < 1) {
        y -= Math.sin(flipT * Math.PI) * 22;
        sq = Math.max(0.12, Math.abs(Math.cos(flipT * Math.PI)));
      }
      const fire = P().twist === 'fogo' && Math.sin(time * 3) > 0.55;
      if (fire) {
        if (art && FX.fogo.every((f) => f.complete && f.naturalWidth > 0)) {
          for (let k = 0; k < 4; k++) {
            const f = FX.fogo[(Math.floor(time * 12) + k) % 3];
            const fh = 34 + (k % 2) * 8;
            const fw = (fh * f.naturalWidth) / f.naturalHeight;
            c.drawImage(f, W / 2 - 54 + k * 36 - fw / 2, rest + 18 - fh, fw, fh);
          }
        } else drawFlames(W / 2, 80, 70);
      }
      if (!drawMeatSprite(c, m.id, Math.min(1.25, pos * 1.25), W / 2, y, sq, 96)) drawMeat(c, m, Math.min(1.25, pos * 1.25), W / 2, y, marked, sq, 2.2);
      // fumaça subindo (sprite), mais forte conforme a carne passa do ponto
      const smokeOk = FX.fumaca.every((f) => f.complete && f.naturalWidth > 0);
      for (let k = 0; k < 4; k++) {
        const t = (time * 0.5 + k / 4) % 1;
        const sx = W / 2 - 34 + k * 22 + Math.sin(time + k) * 4;
        const sy = rest - 6 - t * 50;
        c.globalAlpha = (0.25 + pos * 0.5) * (1 - t);
        if (smokeOk) {
          const f = FX.fumaca[k % 2];
          const sh = 14 + t * 18;
          c.drawImage(f, sx - (sh * f.naturalWidth) / f.naturalHeight / 2, sy - sh, (sh * f.naturalWidth) / f.naturalHeight, sh);
        } else {
          c.fillStyle = 'rgb(235,230,225)';
          c.beginPath();
          c.arc(sx, sy, 3 + t * 6, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.globalAlpha = 1;
      c.restore();
    };
    function drawOldGrill(): void {
      for (let y = 0; y < H; y += 6)
        for (let x = -(y % 12 === 0 ? 0 : 6); x < W; x += 12) {
          c.fillStyle = (x * 3 + y * 7) % 5 === 0 ? '#b5502f' : '#a3452a';
          c.fillRect(x, y, 11, 5);
          c.fillStyle = '#c86640';
          c.fillRect(x, y, 11, 1);
        }
      const bx = 10, by = 10, bw = W - 20, bh = 92;
      c.fillStyle = '#1b0f0b';
      c.fillRect(bx, by, bw, bh);
      for (let y = by + 8; y < by + bh - 8; y += 7) {
        c.fillStyle = '#2a2424';
        c.fillRect(bx + 2, y, bw - 4, 2);
        c.fillStyle = '#8b8080';
        c.fillRect(bx + 2, y, bw - 4, 1);
      }
    }
    function drawFlames(cx: number, by2: number, w: number): void {
      for (let k = 0; k < 9; k++) {
        const fx2 = cx - w / 2 + (k + 0.5) * (w / 9);
        const hgt = 14 + Math.sin(time * 14 + k * 1.7) * 5 + (k % 2) * 7;
        for (let yy = 0; yy < hgt; yy++) {
          const t = yy / hgt;
          const half = Math.max(0, (1 - t) * 3.4);
          c.fillStyle = t < 0.3 ? '#fff4b0' : t < 0.55 ? '#ffc23d' : t < 0.8 ? '#ff7a1e' : '#d8341f';
          c.fillRect(Math.round(fx2 - half), Math.round(by2 - yy), Math.max(1, Math.round(half * 2)), 1);
        }
      }
    }

    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      time += dt;
      if (shake > 0) shake -= dt;
      if (flipT < 1) flipT = Math.min(1, flipT + dt * 2.4);
      if (dropT < 1) dropT = Math.min(1, dropT + dt * 2.2);
      if (running && dropT >= 1) {
        const p = P();
        // fogo: o marcador dá trancos; anda: o verde passeia
        speedMul = p.twist === 'fogo' && Math.sin(time * 3) > 0.55 ? 1.9 : 1;
        if (p.twist === 'anda') {
          okC = p.okC + Math.sin(time * 1.3) * 0.16;
          layoutZone();
        }
        pos += dir * p.speed * speedMul * dt;
        if (pos >= 1) {
          pos = 1;
          dir = -1;
        } else if (pos <= 0) {
          pos = 0;
          dir = 1;
        }
        cursor.style.left = `${pos * 100}%`;
        bar.classList.toggle('hot', Math.abs(pos - okC) <= okW / 2);
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const start = () => {
      if (running || done) return;
      actions.replaceChildren(flipBtn);
      setPhase();
      running = true;
    };
    const end = () => {
      done = true;
      running = false;
      const score = Math.round(points);
      const stars = score >= 16 ? 3 : score >= 10 ? 2 : 1;
      [...dots.children].forEach((d, i) => (d.className = `g${grades[i] ?? 0}`));
      talk(stars === 3 ? `${who}: "...Bom rapaz. Pode voltar sempre."` : stars === 2 ? `${who}: "Dá pro gasto. Com treino melhora."` : `${who}: "Deixa que eu termino. Vai lá conversar."`);
      AudioSystem.play('quest');
      if (stars === 3) burst(24);
      const close = () => {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve({ points: score, stars });
      };
      actions.replaceChildren(
        h('div', { class: 'gh-final' }, `${grades.filter((g) => g === 2).length} perfeitas de ${PHASES.length}`),
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('button', { class: 'btn primary', onclick: close }, 'Servir a mesa ♥'),
      );
      setTimeout(() => InputSystem.once('minigame:interact', close), 500);
    };

    startBtn.addEventListener('click', start);
    flipBtn.addEventListener('click', flip);
    const onInteract = () => (!running && !done && actions.contains(startBtn) ? start() : flip());
    InputSystem.on('minigame:interact', onInteract);
    (screen as HTMLElement & { __grill?: unknown }).__grill = { get pos() { return pos; }, get okC() { return okC; }, get okW() { return okW; }, get phase() { return phase; }, get running() { return running; } };

    function cleanup() {
      cancelAnimationFrame(raf);
      InputSystem.off('minigame:interact', onInteract);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
