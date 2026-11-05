import { h } from '@/utils/dom';

/**
 * Efeitos da abertura: tela de carregamento animada, o "boom" ao aparecer o título
 * e as animações de ambiente sobre a arte da tela inicial (posições em % da arte 1672x941).
 */

const TIPS = [
  'Penteando os cachos da Bella...',
  'Acordando a Meli...',
  'Acendendo os postes de Piabetá...',
  'Esfriando o açaí...',
  'Abrindo o guarda-chuva...',
  'Separando os chocolates...',
  'Polindo a Lua...',
  'Embaralhando as cartas do Bate-Gato...',
];

let loader: HTMLElement | null = null;
let fill: HTMLElement | null = null;
let pct: HTMLElement | null = null;
let tipTimer = 0;
let bella: HTMLElement | null = null;
let trail: HTMLElement | null = null;
let lastHeart = 0;

/** Mostra a tela de carregamento (chamado logo no início). */
export function showLoader(): void {
  if (loader) return;
  const stars = h('div', { class: 'ld-stars' });
  for (let i = 0; i < 40; i++) {
    const s = h('i');
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 100}%`;
    s.style.animationDelay = `${Math.random() * 3}s`;
    s.style.setProperty('--s', `${1 + Math.random() * 2}px`);
    stars.append(s);
  }
  const asset = (f: string) => new URL(`assets/${f}`, document.baseURI).href;
  fill = h('div', { class: 'ld-fill' });
  pct = h('div', { class: 'ld-pct' }, '0%');
  const tip = h('div', { class: 'ld-tip in' }, TIPS[0]);
  let t = 0;
  tipTimer = window.setInterval(() => {
    t = (t + 1) % TIPS.length;
    tip.classList.remove('in');
    void tip.offsetWidth;
    tip.textContent = TIPS[t];
    tip.classList.add('in');
  }, 1500);
  // a Bella anda pela barra até o Weng, deixando coraçõezinhos pelo caminho
  bella = h('div', { class: 'ld-bella', style: `background-image:url("${asset('characters/bella-casual.png')}")` });
  const weng = h('div', { class: 'ld-weng', style: `background-image:url("${asset('characters/weng-casual.png')}")` });
  trail = h('div', { class: 'ld-trail' });
  loader = h(
    'div',
    { id: 'loader' },
    h('div', { class: 'ld-back', style: `background-image:url("${asset('ui/title-full.png')}")` }),
    stars,
    h('div', { class: 'ld-moon' }, h('div', { class: 'ld-moon-glow' }), h('div', { class: 'ld-moon-clip' }, h('div', { class: 'ld-moon-disc' }), h('div', { class: 'ld-moon-shadow' }))),
    h('img', { class: 'ld-logo', src: asset('ui/logo.png'), alt: 'A Lua está Bella' }),
    h('div', { class: 'ld-track' }, h('div', { class: 'ld-road' }, fill), trail, bella, weng, h('div', { class: 'ld-love' }, '♥')),
    h('div', { class: 'ld-info' }, pct, tip),
  );
  document.body.append(loader);
}

let target = 0;
let shown = 0;
let started = 0;
let wantHide = false;
let raf = 0;
const MIN_MS = 2300;
let onGone: (() => void)[] = [];

function render(p: number): void {
  if (!fill || !pct) return;
  const v = Math.round(p * 100);
  fill.style.width = `${v}%`;
  pct.textContent = `${v}%`;
  loader?.style.setProperty('--p', String(p));
  if (bella) bella.style.left = `${p * 84}%`;
  if (trail && v - lastHeart >= 7) {
    lastHeart = v;
    const hrt = h('i', {}, '♥');
    hrt.style.left = `${p * 84}%`;
    trail.append(hrt);
    setTimeout(() => hrt.remove(), 1600);
  }
}

function loop(): void {
  if (!loader) return;
  if (!started) started = performance.now();
  // a barra anda suave: nunca na frente do carregamento real, e leva pelo menos MIN_MS
  const cap = Math.min(1, (performance.now() - started) / MIN_MS);
  shown += (Math.min(target, cap) - shown) * 0.18;
  if (Math.min(target, cap) - shown < 0.004) shown = Math.min(target, cap);
  render(shown);
  if (wantHide && shown >= 0.999) {
    finish();
    return;
  }
  raf = requestAnimationFrame(loop);
}

export function loaderProgress(p: number): void {
  target = Math.max(target, p);
  if (!raf) raf = requestAnimationFrame(loop);
}

function finish(): void {
  if (!loader) return;
  cancelAnimationFrame(raf);
  clearInterval(tipTimer);
  render(1);
  const el = loader;
  loader = null;
  el.classList.add('done');
  setTimeout(() => {
    el.classList.add('out');
    onGone.forEach((f) => f());
    onGone = [];
  }, 700);
  setTimeout(() => el.remove(), 1500);
}

/** Termina o carregamento: a Bella chega no Weng, coração, e a tela some num clarão. */
export function hideLoader(): Promise<void> {
  if (!loader) return Promise.resolve();
  const p = new Promise<void>((r) => onGone.push(r));
  target = 1;
  wantHide = true;
  if (!raf) raf = requestAnimationFrame(loop);
  return p;
}

/** Explosão de corações e estrelas a partir de um ponto (% da tela de título). */
function burst(layer: HTMLElement, x: number, y: number, n = 34): void {
  const glyphs = ['♥', '★', '✦', '♥', '✧', '♥'];
  for (let i = 0; i < n; i++) {
    const g = h('span', { class: 'tx-burst' }, glyphs[i % glyphs.length]);
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const d = 18 + Math.random() * 26;
    g.style.left = `${x}%`;
    g.style.top = `${y}%`;
    g.style.setProperty('--dx', `${Math.cos(a) * d}vmin`);
    g.style.setProperty('--dy', `${Math.sin(a) * d}vmin`);
    g.style.setProperty('--r', `${Math.random() * 360}deg`);
    g.style.color = ['#ff7eb6', '#ffd75e', '#ffffff', '#c7a6ff'][i % 4];
    g.style.fontSize = `${1.4 + Math.random() * 2}vmin`;
    g.style.animationDelay = `${Math.random() * 0.15}s`;
    layer.append(g);
    setTimeout(() => g.remove(), 1900);
  }
}

/**
 * Anima a tela de título ilustrada. Devolve uma função de limpeza.
 * `buttons` são as áreas clicáveis (para o brilho em cascata).
 */
export function decorateTitle(root: HTMLElement, art: string, buttons: HTMLElement[], ready: Promise<void> = Promise.resolve()): () => void {
  const timers: number[] = [];
  const every = (ms: number, fn: () => void) => timers.push(window.setInterval(fn, ms));
  const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
  const fx = h('div', { class: 'tx-layer' });

  // estrelas piscando no céu
  for (let i = 0; i < 26; i++) {
    const s = h('i', { class: 'tx-star' });
    s.style.left = `${14 + Math.random() * 46}%`;
    s.style.top = `${2 + Math.random() * 38}%`;
    s.style.animationDelay = `${Math.random() * 4}s`;
    s.style.animationDuration = `${1.6 + Math.random() * 2.4}s`;
    fx.append(s);
  }
  // brilhos fixos: lua, lampiões, poste
  fx.append(
    h('div', { class: 'tx-glow moon', style: 'left:25.5%;top:17%' }),
    h('div', { class: 'tx-glow lamp', style: 'left:14%;top:15.5%' }),
    h('div', { class: 'tx-glow lamp b', style: 'left:8.5%;top:30%' }),
    h('div', { class: 'tx-glow lamp c', style: 'left:51.6%;top:61.5%' }),
    (() => {
      // brilho só dentro das letras/lua do logo (máscara no formato do logo)
      const mask = new URL('assets/ui/title-logo-mask.png', document.baseURI).href;
      return h('div', { class: 'tx-shine-logo', style: `-webkit-mask-image:url("${mask}");mask-image:url("${mask}")` });
    })(),
    h('div', { class: 'tx-bubble', style: 'left:56%;top:71%' }),
  );
  // vaga-lumes
  for (let i = 0; i < 16; i++) {
    const f = h('i', { class: 'tx-fly' });
    f.style.left = `${5 + Math.random() * 55}%`;
    f.style.top = `${48 + Math.random() * 40}%`;
    f.style.animationDelay = `${-Math.random() * 8}s`;
    f.style.animationDuration = `${6 + Math.random() * 6}s`;
    fx.append(f);
  }
  root.append(fx);

  // estrela cadente de vez em quando
  every(3800, () => {
    const s = h('i', { class: 'tx-shoot' });
    s.style.left = `${22 + Math.random() * 35}%`;
    s.style.top = `${3 + Math.random() * 15}%`;
    fx.append(s);
    setTimeout(() => s.remove(), 1400);
  });
  // pétalas caindo da árvore
  every(520, () => {
    const p = h('i', { class: 'tx-petal' });
    p.style.left = `${6 + Math.random() * 40}%`;
    p.style.top = `${Math.random() * 14}%`;
    p.style.setProperty('--dx', `${6 + Math.random() * 14}vw`);
    p.style.animationDuration = `${5 + Math.random() * 4}s`;
    fx.append(p);
    setTimeout(() => p.remove(), 9500);
  });
  // corações subindo do casal
  every(1600, () => {
    const c = h('i', { class: 'tx-heart' }, '♥');
    c.style.left = `${28 + Math.random() * 6}%`;
    c.style.top = '42%';
    c.style.setProperty('--dx', `${(Math.random() - 0.5) * 6}vw`);
    fx.append(c);
    setTimeout(() => c.remove(), 3200);
  });
  // coraçõezinhos saindo do balão da gatinha
  every(2300, () => {
    const c = h('i', { class: 'tx-heart small' }, '♥');
    c.style.left = '56%';
    c.style.top = '68.5%';
    c.style.setProperty('--dx', `${(Math.random() - 0.5) * 3}vw`);
    fx.append(c);
    setTimeout(() => c.remove(), 3200);
  });

  // --- o boom de entrada (quando o carregamento terminar de sumir) ---
  root.classList.add('tx-wait');
  void ready.then(() => {
    root.classList.remove('tx-wait');
    root.classList.add('tx-intro');
    const flash = h('div', { class: 'tx-flash' });
    root.append(flash);
    later(260, () => burst(fx, 76.5, 26, 40));
    later(520, () => burst(fx, 30, 40, 26));
    later(900, () => root.classList.remove('tx-intro'));
    later(1500, () => flash.remove());
    // brilho em cascata nos botões
    buttons.forEach((b, i) =>
      later(900 + i * 160, () => {
        b.classList.add('tx-sweep');
        later(900, () => b.classList.remove('tx-sweep'));
      }),
    );
  });

  // botão: brilho de vez em quando no selecionado
  every(4200, () => {
    const b = buttons.find((x) => x.classList.contains('sel'));
    if (!b) return;
    b.classList.add('tx-sweep');
    later(900, () => b.classList.remove('tx-sweep'));
  });
  // mini-explosão ao clicar
  buttons.forEach((b) =>
    b.addEventListener('pointerdown', () => {
      const r = b.getBoundingClientRect();
      const R = root.getBoundingClientRect();
      burst(fx, ((r.left + r.width / 2 - R.left) / R.width) * 100, ((r.top + r.height / 2 - R.top) / R.height) * 100, 14);
    }),
  );

  // fundo da página: a própria arte, desfocada, preenchendo as laterais
  const back = h('div', { id: 'title-back', style: `background-image:url(${art})` });
  document.body.prepend(back);
  document.documentElement.classList.add('title-mode');
  window.dispatchEvent(new Event('resize'));

  return () => {
    timers.forEach((t) => {
      clearInterval(t);
      clearTimeout(t);
    });
    back.remove();
    document.documentElement.classList.remove('title-mode');
    window.dispatchEvent(new Event('resize'));
  };
}
