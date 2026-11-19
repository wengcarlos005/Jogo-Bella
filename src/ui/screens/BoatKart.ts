import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';
import { shell, type MiniResult } from './PetroGames';

/**
 * Cisne Kart (pseudo-3D, câmera atrás do pedalinho, como num kart de verdade).
 * Pista de água no lago do Quitandinha, com o palácio no horizonte, 3 voltas contra
 * o cisne rosa, o cisne azul e o patinho amarelo.
 *  - ← → : pilotar (o casal pedala sozinho) · Espaço / E : usar o item
 *  - Na largada, aperte bem no "VAI!" pra sair com turbo.
 * Caixas "?" sorteiam: Pimenta (turbo), Pão (os patinhos cercam quem tá logo na frente),
 * Onda (projétil pra frente) e Coração (escudo). Faixas amarelas na água dão turbo;
 * vitória-régia e patinhos fazem rodar; as boias da margem seguram (e freiam) o barco.
 */
type Item = 'pimenta' | 'pao' | 'onda' | 'coracao';
const ITEM_NAME: Record<Item, string> = { pimenta: 'Pimenta turbo', pao: 'Pão pros patos', onda: 'Onda', coracao: 'Coração escudo' };
const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;

/** Ícones dos itens (desenhados, pixel). */
function itemSVG(it: Item | 'box'): string {
  const s = (inner: string) => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${inner}</svg>`;
  switch (it) {
    case 'pimenta':
      return s(`<path d="M20 4h3v2h2v3h-2v-1h-3z" fill="#3a8a2a"/><path d="M9 9h12v3h2v6h-2v5h-3v3h-4v2H8v-3h2v-3h2v-4h-2v-5h-1z" fill="#e0302a"/><path d="M11 10h3v2h-2v6h-1z" fill="#ff8a6a"/><path d="M5 22h3v3H5zM3 18h3v2H3z" fill="#ffd23f"/><path d="M4 26h3v2H4z" fill="#ff8a3a"/>`);
    case 'pao':
      return s(`<path d="M6 12h20v2h2v8h-2v2H6v-2H4v-8h2z" fill="#a8641e"/><path d="M7 11h18v3H7z" fill="#d89040"/><path d="M8 10h16v2H8z" fill="#f0b860"/><path d="M10 13h2v3h-2zM15 13h2v3h-2zM20 13h2v3h-2z" fill="#7a4410"/><path d="M6 22h20v2H6z" fill="#7a4410"/>`);
    case 'onda':
      return s(`<path d="M3 22h26v6H3z" fill="#2a6ac8"/><path d="M5 16h4v-4h4v-2h6v2h3v3h-3v-1h-4v2h2v3h4v2h6v3H3v-3h2z" fill="#4aa8f0"/><path d="M13 10h6v2h-6zM9 12h4v2H9z" fill="#e8f6ff"/><path d="M19 15h3v2h-3z" fill="#e8f6ff"/>`);
    case 'coracao':
      return s(`<path d="M6 7h7v2h2v2h2V9h2V7h7v2h2v8h-2v3h-2v2h-2v2h-2v2h-2v2h-2v-2h-2v-2H9v-2H7v-2H5v-3H4V9h2z" fill="#ff4a7a"/><path d="M7 9h4v2H9v3H7z" fill="#ffc0d4"/><path d="M6 7h7v2H6zM19 7h7v2h-7z" fill="#c8204a" opacity=".5"/>`);
    default:
      return s(`<path d="M4 4h24v24H4z" fill="#ffd23f"/><path d="M4 4h12v12H4z" fill="#ff6a9a"/><path d="M16 16h12v12H16z" fill="#6aa8ff"/><path d="M4 16h12v12H4z" fill="#7fe39a" opacity=".9"/><path d="M4 4h24v2H4zM4 4h2v24H4zM4 26h24v2H4zM26 4h2v24h-2z" fill="#fff"/><path d="M12 9h8v2h2v4h-2v2h-3v3h-2v-4h2v-2h2v-3h-6v2h-3v-2h2z" fill="#fff"/><path d="M15 22h2v2h-2z" fill="#fff"/>`);
  }
}

// ---------------------------------------------------------------- mundo
const W = 960;
const H = 540;
const SEG = 200;
const ROAD = 2000; // meia-largura da pista
const CAM_H = 1000;
const DEPTH = 1 / Math.tan(((100 / 2) * Math.PI) / 180);
const DRAW = 170;
const PLAYER_Z = CAM_H * DEPTH;
const MAX = 7200;
const LAPS = 3;

type Spr = { img: string; x: number; w: number; kind?: 'vitoria' | 'patos' | 'box' | 'boia'; gone?: number; filter?: string };
type Seg = { i: number; curve: number; sprites: Spr[]; pad: number | null; start: boolean };
type Racer = { id: string; name: string; me: boolean; z: number; x: number; spd: number; base: number; boost: number; spin: number; shield: number; itemIn: number; color: string; filter: string; done: number; lane: number };

function buildTrack(): Seg[] {
  const segs: Seg[] = [];
  const add = (curve: number) => segs.push({ i: segs.length, curve, sprites: [], pad: null, start: false });
  const ease = (a: number, b: number, p: number) => a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5);
  const road = (enter: number, hold: number, leave: number, curve: number) => {
    for (let n = 0; n < enter; n++) add(ease(0, curve, n / enter));
    for (let n = 0; n < hold; n++) add(curve);
    for (let n = 0; n < leave; n++) add(ease(curve, 0, n / leave));
  };
  road(0, 30, 0, 0);
  road(15, 30, 15, 2.5);
  road(0, 20, 0, 0);
  road(12, 25, 12, -4);
  road(10, 12, 10, 3);
  road(10, 12, 10, -3);
  road(0, 35, 0, 0);
  road(15, 40, 15, 5);
  road(0, 20, 0, 0);
  road(15, 45, 15, -3);
  road(10, 15, 10, 2);
  road(0, 30, 0, 0);
  return segs;
}

export function playBoatGame(parent: HTMLElement): Promise<MiniResult> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'bk', 'Cisne Kart');
    const cv = h('canvas', { class: 'ck-canvas', width: W, height: H }) as HTMLCanvasElement;
    const ctx = cv.getContext('2d')!;
    const banner = h('div', { class: 'bk-banner' });
    const slotIcon = h('div', { class: 'bk-slot-ico' });
    const slotName = h('span', {}, 'Sem item');
    const slot = h('div', { class: 'bk-slot ck' }, h('b', {}, 'Item'), slotIcon, slotName);
    const posBig = h('div', { class: 'bk-posbig ck' }, h('b', {}, '4º'), h('span', {}, '/4'));
    const lapBox = h('div', { class: 'ck-lap' }, h('span', {}, 'VOLTA'), h('b', {}, `1/${LAPS}`));
    const mini = h('canvas', { class: 'ck-mini', width: 150, height: 110 }) as HTMLCanvasElement;
    const mctx = mini.getContext('2d')!;
    const speedo = h('div', { class: 'ck-speed' }, h('i', {}), h('b', {}, '0'), h('span', {}, 'km/h'));
    const rules = h(
      'div',
      { class: 'cs-rules pd-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('pd-barco2'), alt: '' }), h('span', {}, 'O casal pedala sozinho: pilote com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), `. ${LAPS} voltas no lago do Quitandinha contra o cisne rosa, o cisne azul e o patinho!`)),
      h('div', {}, h('span', { class: 'bk-rule-ico', html: itemSVG('box') }), h('span', {}, 'Passe nas caixas ', h('b', {}, '?'), ' e use o item com ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), '. Quem tá atrás ganha item melhor!')),
      h('div', {}, h('span', { class: 'bk-rule-ico', html: itemSVG('pimenta') }), h('span', {}, 'Pimenta = turbo · Pão = patinhos cercam quem tá na frente · Onda = acerta quem tá na frente · Coração = escudo. Faixas amarelas dão turbo; vitória-régia e patos fazem rodar.')),
    );
    ui.stage.append(cv, lapBox, slot, posBig, mini, speedo, banner, rules);

    // ---------------------------------------------------------------- imagens
    const imgs: Record<string, HTMLImageElement> = {};
    const img = (key: string, src: string | null) => {
      if (!src) return;
      const im = new Image();
      im.src = src;
      imgs[key] = im;
    };
    img('palacio', mg('ck-palacio'));
    for (const k of ['pd-barco', 'pd-barco2', 'pd-rosa', 'pd-vitoria', 'pd-patos', 'pd-boia']) img(k, mg(k));
    for (const k of ['qd-araucaria', 'qd-poste', 'qd-arvore', 'qd-vaso', 'pq-araucaria', 'pq-arbusto', 'qd-banco']) img(k, textureURL(k));
    const svgImg = (key: string, svg: string) => img(key, `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace('<svg ', '<svg width="128" height="128" '))}`);
    svgImg('box', itemSVG('box'));
    svgImg('onda', itemSVG('onda'));
    svgImg('coracao', itemSVG('coracao'));

    // ---------------------------------------------------------------- pista
    const segs = buildTrack();
    const N = segs.length;
    const TRACK = N * SEG;
    const TOTAL = TRACK * LAPS;
    for (const s of segs) {
      if (s.i < 3) s.start = true;
      // margem: boias, araucárias, postes, árvores, vasos
      if (s.i % 4 === 0) s.sprites.push({ img: 'pd-boia', x: -1.12, w: 260, kind: 'boia' }, { img: 'pd-boia', x: 1.12, w: 260, kind: 'boia' });
      if (s.i % 6 === 2) s.sprites.push({ img: Math.random() < 0.6 ? 'qd-araucaria' : 'pq-araucaria', x: -(2 + Math.random() * 1.6), w: 1300 + Math.random() * 400 });
      if (s.i % 6 === 5) s.sprites.push({ img: Math.random() < 0.6 ? 'qd-araucaria' : 'qd-arvore', x: 2 + Math.random() * 1.6, w: 1300 + Math.random() * 400 });
      if (s.i % 12 === 0) s.sprites.push({ img: 'qd-poste', x: -1.45, w: 330 }, { img: 'qd-poste', x: 1.45, w: 330 });
      if (s.i % 18 === 9) s.sprites.push({ img: 'qd-vaso', x: 1.6, w: 420 });
      if (s.i % 22 === 15) s.sprites.push({ img: 'pq-arbusto', x: -1.7, w: 600 });
      if (s.i % 40 === 30) s.sprites.push({ img: 'qd-banco', x: 1.75, w: 650 });
    }
    // obstáculos e itens na água
    for (let i = 40; i < N - 6; i++) {
      const r = Math.random();
      if (i % 9 === 0 && r < 0.6) segs[i].sprites.push({ img: Math.random() < 0.65 ? 'pd-vitoria' : 'pd-patos', x: -0.7 + Math.random() * 1.4, w: 520, kind: Math.random() < 0.65 ? 'vitoria' : 'patos' });
    }
    for (const s of segs) for (const sp of s.sprites) if (sp.kind === 'vitoria' || sp.kind === 'patos') sp.img = sp.kind === 'vitoria' ? 'pd-vitoria' : 'pd-patos';
    for (const at of [Math.floor(N * 0.1), Math.floor(N * 0.3), Math.floor(N * 0.5), Math.floor(N * 0.7), Math.floor(N * 0.88)]) for (const x of [-0.6, -0.2, 0.2, 0.6]) segs[at].sprites.push({ img: 'box', x, w: 300, kind: 'box' });
    for (const at of [Math.floor(N * 0.3), Math.floor(N * 0.42), Math.floor(N * 0.66), Math.floor(N * 0.92)]) for (let k = 0; k < 6; k++) segs[at + k].pad = at % 2 ? -0.45 : 0.45;
    const segAt = (z: number) => segs[Math.floor((((z % TRACK) + TRACK) % TRACK) / SEG) % N];

    // ---------------------------------------------------------------- corredores
    const mk = (id: string, name: string, me: boolean, color: string, filter: string, x: number, z: number, base: number, lane: number): Racer => ({ id, name, me, z, x, spd: 0, base, boost: 0, spin: 0, shield: 0, itemIn: 5 + Math.random() * 4, color, filter, done: 0, lane });
    const me = mk('me', 'Vocês', true, '#ffd23f', 'none', 0.35, 0, MAX, 0);
    const rosa = mk('rosa', 'Cisne rosa', false, '#ff6a9a', 'none', -0.35, SEG * 2.5, MAX * 1.01, 0.3);
    const azul = mk('azul', 'Cisne azul', false, '#5a9aff', 'hue-rotate(-115deg) saturate(1.3)', 0.35, SEG * 5, MAX * 0.985, 1.9);
    const pato = mk('pato', 'Patinho', false, '#ffd84a', 'hue-rotate(70deg) saturate(1.6) brightness(1.15)', -0.35, SEG * 7.5, MAX * 0.97, 3.4);
    const racers = [me, rosa, azul, pato];
    const waves: { z: number; x: number; v: number; owner: Racer }[] = [];
    const keys = { l: false, r: false };

    let item: Item | null = null;
    let rolling = 0;
    let phase: 'rules' | 'count' | 'race' | 'done' = 'rules';
    let countT = 0;
    let goAt = 0;
    let last = 0;
    let raf = 0;
    let hits = 0;
    let lapShown = 1;
    let bannerT = 0;
    let lastPos = 4;
    let elapsed = 0;
    let skyOff = 0;
    let steerTilt = 0;

    const showBanner = (text: string, cls = '', dur = 1.3) => {
      banner.textContent = text;
      banner.className = `bk-banner ck on ${cls}`;
      bannerT = dur;
    };
    const lapOf = (z: number) => Math.min(LAPS, Math.floor(z / TRACK) + 1);
    const order = () => [...racers].sort((a, b) => (a.done && b.done ? a.done - b.done : a.done ? -1 : b.done ? 1 : b.z - a.z));
    const posOf = (r: Racer) => order().indexOf(r) + 1;
    const say = (who: string, t: string) => ui.say(who, t);

    // placar
    const sbPos = h('b', { class: 'bk-sb-pos' }, '4º');
    const sbLap = h('b', { class: 'bk-sb-n' }, `1/${LAPS}`);
    const sbDots = racers.map((r) => h('i', { class: `bk-dot ${r.id}`, style: `--c:${r.color}` }));
    const sbTrack = h('div', { class: 'bk-sb-track' }, h('i', { class: 'bk-sb-flag' }), ...sbDots);
    ui.hud.replaceChildren(h('div', { class: 'so-sb bk-sb' }, h('div', { class: 'so-sb-chip' }, h('span', {}, 'Posição'), sbPos), h('div', { class: 'so-sb-chip' }, h('span', {}, 'Volta'), sbLap), h('div', { class: 'so-sb-chip wide' }, sbTrack)));
    const hud = () => {
      const p = posOf(me);
      const ps = `${p}º`;
      if (sbPos.textContent !== ps) {
        sbPos.textContent = ps;
        sbPos.className = `bk-sb-pos p${p}`;
        (posBig.firstChild as HTMLElement).textContent = ps;
        posBig.className = `bk-posbig ck p${p} bump`;
        setTimeout(() => posBig.classList.remove('bump'), 500);
      }
      const lap = `${lapOf(me.z)}/${LAPS}`;
      sbLap.textContent = lap;
      (lapBox.lastChild as HTMLElement).textContent = lap;
      racers.forEach((r, i) => (sbDots[i].style.left = `${Math.min(1, r.z / TOTAL) * 100}%`));
      const kmh = Math.round((me.spd / MAX) * 42);
      (speedo.children[1] as HTMLElement).textContent = String(kmh);
      (speedo.children[0] as HTMLElement).style.width = `${Math.min(100, (me.spd / (MAX * 1.5)) * 100)}%`;
      speedo.classList.toggle('boost', me.boost > 0);
    };
    const setItem = (it: Item | null) => {
      item = it;
      slotIcon.innerHTML = it ? itemSVG(it) : '';
      slotName.textContent = it ? ITEM_NAME[it] : 'Sem item';
      slot.classList.toggle('has', !!it);
    };
    const roll = (got: Item) => {
      rolling = 1;
      slot.classList.add('rolling');
      const all: Item[] = ['pimenta', 'pao', 'onda', 'coracao'];
      let k = 0;
      const step = () => {
        if (rolling <= 0) return;
        slotIcon.innerHTML = itemSVG(all[k++ % all.length]);
        AudioSystem.play('blip');
        setTimeout(step, 80);
      };
      step();
      setTimeout(() => {
        rolling = 0;
        slot.classList.remove('rolling');
        setItem(got);
        AudioSystem.play('pickup');
      }, 900);
    };
    const pickFor = (r: Racer): Item => {
      const p = posOf(r);
      const pool: Item[] = p === 1 ? ['coracao', 'onda', 'pao', 'coracao'] : p === 2 ? ['onda', 'pao', 'pimenta', 'coracao'] : ['pimenta', 'pimenta', 'pao', 'onda'];
      return pool[Math.floor(Math.random() * pool.length)];
    };
    let flashT = 0;
    const hitRacer = (r: Racer, how: string, dur = 1.2) => {
      if (r.shield > 0) {
        r.shield = 0;
        if (r.me) {
          AudioSystem.play('confirm');
          showBanner('Escudo!', 'go', 0.6);
        }
        return false;
      }
      r.spin = dur;
      if (r.me) {
        hits++;
        flashT = 0.25;
        ui.shake();
        AudioSystem.play('cancel');
        say('bella', how);
      }
      return true;
    };
    const fire = (r: Racer, it: Item) => {
      if (it === 'pimenta') {
        r.boost = 2.4;
        if (r.me) {
          AudioSystem.play('confirm');
          say('weng', 'PIMENTA! PEDALA, BELLA!');
          showBanner('TURBO!', 'go', 0.8);
        }
      } else if (it === 'coracao') {
        r.shield = 9;
        if (r.me) say('bella', 'Escudo de coração! Ninguém encosta na gente.');
      } else if (it === 'pao') {
        const ahead = racers.filter((o) => o !== r && !o.done && o.z > r.z && o.z - r.z < TRACK * 0.4).sort((a, b) => a.z - b.z)[0];
        if (ahead && hitRacer(ahead, 'Os patinhos cercaram a gente!', 1.8)) {
          if (r.me) say('bella', `Os patinhos cercaram o ${ahead.name.toLowerCase()}! Toma pão!`);
          else if (ahead.me) say('weng', `O ${r.name.toLowerCase()} jogou pão! Os patos tão em cima da gente!`);
        } else if (r.me) say('weng', 'Não tinha ninguém na frente... os patinhos agradecem o lanche.');
        if (r.me) AudioSystem.play('pickup');
      } else {
        waves.push({ z: r.z + SEG, x: r.x, v: MAX * 1.6, owner: r });
        if (r.me) {
          AudioSystem.play('blip');
          say('bella', 'Lá vai a onda!');
        }
      }
    };
    const useItem = () => {
      if (phase !== 'race' || !item || rolling > 0 || me.spin > 0) return;
      const it = item;
      setItem(null);
      fire(me, it);
    };

    // ---------------------------------------------------------------- render
    const project = (worldX: number, relZ: number, camX: number) => {
      const scale = DEPTH / relZ;
      return { x: W / 2 + (scale * (worldX - camX) * W) / 2, y: H / 2 + (scale * CAM_H * H) / 2, w: (scale * ROAD * W) / 2, scale };
    };
    const quad = (x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1 - w1, y1);
      ctx.lineTo(x2 - w2, y2);
      ctx.lineTo(x2 + w2, y2);
      ctx.lineTo(x1 + w1, y1);
      ctx.closePath();
      ctx.fill();
    };
    const drawBackground = () => {
      const g = ctx.createLinearGradient(0, 0, 0, H / 2);
      g.addColorStop(0, '#5aa8e8');
      g.addColorStop(1, '#cfe9f7');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H / 2 + 2);
      const pal = imgs.palacio;
      if (pal?.complete && pal.naturalWidth) {
        const pw = W * 1.7;
        const ph = (pw * pal.naturalHeight) / pal.naturalWidth;
        // a paisagem gira com as curvas; as cópias dos lados são espelhadas pra não ter emenda
        const span = pw * 2;
        const off = ((((W / 2 - pw / 2 - skyOff * 0.6) % span) + span) % span) - span;
        const py = H / 2 - ph + 4;
        for (let px = off; px < W; px += span) {
          ctx.drawImage(pal, px, py, pw, ph);
          ctx.save();
          ctx.translate(px + pw * 2, py);
          ctx.scale(-1, 1);
          ctx.drawImage(pal, 0, 0, pw, ph);
          ctx.restore();
        }
      }
      // margem de grama no horizonte
      ctx.fillStyle = '#4e8a2c';
      ctx.fillRect(0, H / 2, W, H / 2);
    };
    const render = (t: number) => {
      drawBackground();
      const base = segAt(me.z - PLAYER_Z < 0 ? me.z - PLAYER_Z + TRACK : me.z - PLAYER_Z);
      const camZ = me.z - PLAYER_Z;
      const basePercent = ((((camZ % SEG) + SEG) % SEG) / SEG);
      let dx = -(base.curve * basePercent);
      let x = 0;
      let maxy = H;
      const camX = me.x * ROAD;
      const drawn: { seg: Seg; p1: ReturnType<typeof project>; clip: number; n: number }[] = [];
      const shimmer = Math.floor(t / 220) % 2;
      for (let n = 0; n < DRAW; n++) {
        const seg = segs[(base.i + n) % N];
        const rel1 = n * SEG - basePercent * SEG;
        const rel2 = rel1 + SEG;
        const x1 = x;
        const x2 = x + dx;
        x += dx;
        dx += seg.curve;
        if (rel1 <= DEPTH * 2) continue;
        const p1 = project(-x1, rel1, camX);
        const p2 = project(-x2, rel2, camX);
        if (p2.y >= maxy) continue;
        const stripe = Math.floor(seg.i / 3) % 2;
        // grama, calçada de pedra, corda de boias, água
        ctx.fillStyle = stripe ? '#5fa236' : '#58982f';
        ctx.fillRect(0, p2.y, W, p1.y - p2.y + 1);
        quad(p1.x, p1.y, p1.w * 1.38, p2.x, p2.y, p2.w * 1.38, stripe ? '#dcc196' : '#cdb084');
        quad(p1.x, p1.y, p1.w * 1.12, p2.x, p2.y, p2.w * 1.12, stripe ? '#ff7aa8' : '#fff3f7');
        quad(p1.x, p1.y, p1.w, p2.x, p2.y, p2.w, stripe ? '#2f86d6' : '#3592df');
        // reflexo de luz na água
        if ((seg.i + shimmer) % 5 === 0) quad(p1.x - p1.w * 0.35, p1.y, p1.w * 0.05, p2.x - p2.w * 0.35, p2.y, p2.w * 0.05, 'rgba(255,255,255,.35)');
        if ((seg.i + shimmer) % 7 === 3) quad(p1.x + p1.w * 0.4, p1.y, p1.w * 0.04, p2.x + p2.w * 0.4, p2.y, p2.w * 0.04, 'rgba(255,255,255,.3)');
        // faixas da pista (espuma)
        if (stripe) {
          quad(p1.x - p1.w / 3, p1.y, p1.w * 0.012, p2.x - p2.w / 3, p2.y, p2.w * 0.012, 'rgba(255,255,255,.55)');
          quad(p1.x + p1.w / 3, p1.y, p1.w * 0.012, p2.x + p2.w / 3, p2.y, p2.w * 0.012, 'rgba(255,255,255,.55)');
        }
        // largada quadriculada
        if (seg.start) {
          const cells = 12;
          for (let c = 0; c < cells; c++) {
            const a = -1 + (2 * c) / cells;
            const b = a + 2 / cells;
            ctx.fillStyle = (c + seg.i) % 2 ? '#fff' : '#1a1428';
            ctx.beginPath();
            ctx.moveTo(p1.x + p1.w * a, p1.y);
            ctx.lineTo(p2.x + p2.w * a, p2.y);
            ctx.lineTo(p2.x + p2.w * b, p2.y);
            ctx.lineTo(p1.x + p1.w * b, p1.y);
            ctx.fill();
          }
        }
        // turbo: setas amarelas piscando
        if (seg.pad !== null) {
          const c1 = p1.x + p1.w * seg.pad;
          const c2 = p2.x + p2.w * seg.pad;
          quad(c1, p1.y, p1.w * 0.17, c2, p2.y, p2.w * 0.17, (seg.i + Math.floor(t / 90)) % 2 ? '#ffd23f' : '#ff9a2e');
          if (seg.i % 2 === 0) {
            ctx.fillStyle = '#fff6c0';
            ctx.beginPath();
            ctx.moveTo(c1 - p1.w * 0.12, p1.y);
            ctx.lineTo(c2, p2.y);
            ctx.lineTo(c1 + p1.w * 0.12, p1.y);
            ctx.closePath();
            ctx.fill();
          }
        }
        drawn.push({ seg, p1, clip: maxy, n });
        maxy = p2.y;
      }
      // sprites (de trás pra frente)
      const racerAt = new Map<number, Racer[]>();
      for (const r of racers) {
        if (r.me) continue;
        const rel = r.z - camZ;
        const rr = (((rel % TRACK) + TRACK) % TRACK);
        // atrás da câmera ou colado nela: não desenha (ficaria gigante na tela)
        if (rr > DRAW * SEG || rr < PLAYER_Z * 0.97) continue;
        const k = Math.floor(rr / SEG);
        if (!racerAt.has(k)) racerAt.set(k, []);
        racerAt.get(k)!.push(r);
      }
      const waveAt = new Map<number, typeof waves>();
      for (const w of waves) {
        const rr = w.z - camZ;
        if (rr < 0 || rr > DRAW * SEG) continue;
        const k = Math.floor(rr / SEG);
        if (!waveAt.has(k)) waveAt.set(k, []);
        waveAt.get(k)!.push(w);
      }
      for (let d = drawn.length - 1; d >= 0; d--) {
        const { seg, p1, clip, n } = drawn[d];
        const drawSpr = (key: string, sx: number, w: number, filter = 'none', spin = 0, alpha = 1) => {
          const im = imgs[key];
          if (!im?.complete || !im.naturalWidth) return;
          const dw = (w * p1.scale * W) / 2;
          const dh = (dw * im.naturalHeight) / im.naturalWidth;
          const dx2 = p1.x + (p1.scale * sx * ROAD * W) / 2 - dw / 2;
          const dy2 = p1.y - dh;
          const clipH = Math.max(0, clip - dy2);
          if (clipH <= 0 || dw < 1) return;
          ctx.save();
          ctx.globalAlpha = alpha;
          if (filter !== 'none') ctx.filter = filter;
          ctx.beginPath();
          ctx.rect(dx2 - dw, dy2 - dh, dw * 3, Math.min(dh * 2, clipH + dh));
          ctx.clip();
          if (spin) {
            ctx.translate(dx2 + dw / 2, dy2 + dh / 2);
            ctx.rotate(spin);
            ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh);
          } else ctx.drawImage(im, dx2, dy2, dw, dh);
          ctx.restore();
        };
        for (const sp of seg.sprites) {
          if (sp.gone && sp.gone > 0) continue;
          drawSpr(sp.img, sp.x, sp.w);
        }
        for (const w of waveAt.get(n) ?? []) drawSpr('onda', w.x, 380, w.owner.me ? 'none' : 'hue-rotate(140deg)');
        for (const r of racerAt.get(n) ?? []) {
          drawSpr('pd-rosa', r.x, Math.min(560, 300 / Math.max(0.001, (p1.scale * W) / 2)), r.filter, r.spin > 0 ? r.spin * 12 : 0);
          if (r.shield > 0) drawSpr('coracao', r.x, 220, 'none', 0, 0.7);
          // nome em cima
          const sx = p1.x + (p1.scale * r.x * ROAD * W) / 2;
          const dw = (560 * p1.scale * W) / 2;
          if (dw > 26 && p1.y < clip + 4) {
            ctx.font = `bold ${Math.max(11, Math.min(18, dw * 0.16))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#1a1428';
            ctx.strokeText(r.name, sx, p1.y - dw * 1.85);
            ctx.fillStyle = r.color;
            ctx.fillText(r.name, sx, p1.y - dw * 1.85);
          }
        }
      }
      // o casal
      const boat = imgs[phase === 'race' && Math.floor(t / 160) % 2 ? 'pd-barco2' : 'pd-barco'];
      if (boat?.complete && boat.naturalWidth) {
        const bw = 205;
        const bh = (bw * boat.naturalHeight) / boat.naturalWidth;
        const bob = Math.sin(t / 140) * 3;
        ctx.save();
        ctx.translate(W / 2, H - bh / 2 - 14 + bob);
        ctx.rotate(me.spin > 0 ? me.spin * 12 : steerTilt);
        // rastro
        if (phase === 'race') {
          ctx.fillStyle = me.boost > 0 ? 'rgba(255,230,140,.65)' : 'rgba(255,255,255,.45)';
          ctx.beginPath();
          ctx.moveTo(-bw * 0.28, bh * 0.42);
          ctx.lineTo(-bw * 0.62, bh * 0.62);
          ctx.lineTo(bw * 0.62, bh * 0.62);
          ctx.lineTo(bw * 0.28, bh * 0.42);
          ctx.fill();
        }
        if (me.boost > 0) ctx.filter = 'drop-shadow(0 0 12px #ffd23f)';
        ctx.drawImage(boat, -bw / 2, -bh / 2, bw, bh);
        ctx.restore();
        if (me.shield > 0) {
          ctx.strokeStyle = 'rgba(255,154,192,.85)';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.ellipse(W / 2, H - bh / 2 - 14, bw * 0.62, bh * 0.58, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // linhas de velocidade
      if (me.boost > 0 || me.spd > MAX * 1.05) {
        ctx.strokeStyle = 'rgba(255,255,255,.55)';
        ctx.lineWidth = 3;
        for (let k = 0; k < 14; k++) {
          const a = (k / 14) * Math.PI * 2 + t / 300;
          const r1 = 260 + ((t / 2 + k * 37) % 120);
          ctx.beginPath();
          ctx.moveTo(W / 2 + Math.cos(a) * r1, H * 0.55 + Math.sin(a) * r1 * 0.55);
          ctx.lineTo(W / 2 + Math.cos(a) * (r1 + 70), H * 0.55 + Math.sin(a) * (r1 + 70) * 0.55);
          ctx.stroke();
        }
      }
      if (flashT > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashT * 2})`;
        ctx.fillRect(0, 0, W, H);
      }
    };
    // mapinha: o lago em oval com os 4 barcos
    const drawMini = () => {
      mctx.clearRect(0, 0, 150, 110);
      mctx.fillStyle = 'rgba(26,16,40,.75)';
      mctx.beginPath();
      mctx.roundRect(0, 0, 150, 110, 12);
      mctx.fill();
      mctx.strokeStyle = '#7fd8ee';
      mctx.lineWidth = 10;
      mctx.beginPath();
      mctx.ellipse(75, 57, 56, 36, 0, 0, Math.PI * 2);
      mctx.stroke();
      mctx.strokeStyle = '#2f86d6';
      mctx.lineWidth = 6;
      mctx.stroke();
      mctx.fillStyle = '#fff';
      mctx.fillRect(73, 15, 4, 12);
      for (const r of [...racers].reverse()) {
        const a = -Math.PI / 2 + ((r.z % TRACK) / TRACK) * Math.PI * 2;
        mctx.fillStyle = r.color;
        mctx.strokeStyle = r.me ? '#fff' : '#1a1428';
        mctx.lineWidth = 2;
        mctx.beginPath();
        mctx.arc(75 + Math.cos(a) * 56, 57 + Math.sin(a) * 36, r.me ? 7 : 5, 0, Math.PI * 2);
        mctx.fill();
        mctx.stroke();
      }
    };

    // ---------------------------------------------------------------- simulação
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (bannerT > 0) {
        bannerT -= dt;
        if (bannerT <= 0) banner.classList.remove('on');
      }
      if (flashT > 0) flashT -= dt;
      if (phase === 'count') {
        countT -= dt;
        const n = Math.ceil(countT);
        if (n >= 1 && banner.textContent !== String(n)) {
          showBanner(String(n), 'count');
          AudioSystem.play('blip');
        }
        if (countT <= 0) {
          phase = 'race';
          goAt = t;
          showBanner('VAI!', 'go');
          AudioSystem.play('quest');
          for (const r of racers) if (!r.me && Math.random() < 0.4) r.boost = 1;
        }
      }
      if (phase === 'race') {
        elapsed += dt;
        const seg = segAt(me.z);
        const pct = me.spd / MAX;
        // pilotar + força da curva
        const steer = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
        if (me.spin <= 0) me.x += steer * dt * 2.1 * Math.max(0.4, pct);
        me.x -= dt * pct * seg.curve * 0.28;
        steerTilt += ((steer * 0.12) - steerTilt) * Math.min(1, dt * 10);
        skyOff += seg.curve * pct * dt * 60;
        // corredores
        for (const r of racers) {
          if (!r.me && !r.done) {
            const rs = segAt(r.z);
            const ahead = [0, 1, 2, 3].map((k) => segAt(r.z + k * SEG)).flatMap((s) => s.sprites.filter((sp) => (sp.kind === 'vitoria' || sp.kind === 'patos') && Math.abs(sp.x - r.x) < 0.3));
            const box = [1, 2, 3, 4, 5].map((k) => segAt(r.z + k * SEG)).flatMap((s) => s.sprites.filter((sp) => sp.kind === 'box'))[0];
            let want = Math.sin(r.z / 9000 + r.lane) * 0.55;
            if (box) want = box.x;
            if (ahead.length) want = ahead[0].x > 0 ? ahead[0].x - 0.5 : ahead[0].x + 0.5;
            want -= rs.curve * 0.05;
            if (r.spin <= 0) r.x += Math.max(-1, Math.min(1, (want - r.x) * 3)) * dt;
            r.itemIn -= dt;
            if (r.itemIn <= 0) {
              r.itemIn = 6 + Math.random() * 6;
              const it = pickFor(r);
              if ((it === 'onda' || it === 'pao') && !(me.z > r.z && me.z - r.z < TRACK * 0.3) && r.id === 'rosa') r.boost = 1.4;
              else fire(r, it);
            }
          }
          if (r.spin > 0) r.spin -= dt;
          let target = r.spin > 0 ? MAX * 0.15 : r.boost > 0 ? MAX * 1.5 : r.base;
          if (!r.me && !r.done) target *= 1 + Math.max(-0.22, Math.min(0.16, (me.z - r.z) / (TRACK * 0.6)));
          // fora da água (nas boias): freia
          if (Math.abs(r.x) > 0.95) {
            r.x = Math.sign(r.x) * 0.95;
            target *= 0.55;
            if (r.me && Math.random() < dt * 2) AudioSystem.play('blip');
          }
          if (r.done) target = MAX * 0.4;
          r.spd += (target - r.spd) * Math.min(1, dt * (r.boost > 0 ? 3 : 1.2));
          if (r.boost > 0) r.boost -= dt;
          if (r.shield > 0) r.shield -= dt;
          r.z += r.spd * dt;
          if (!r.done && r.z >= TOTAL) r.done = elapsed;
        }
        // empurrões entre barcos
        for (let i = 0; i < racers.length; i++)
          for (let j = i + 1; j < racers.length; j++) {
            const a = racers[i];
            const b = racers[j];
            if (Math.abs(a.z - b.z) < SEG * 1.2 && Math.abs(a.x - b.x) < 0.28) {
              const push = b.x > a.x ? 1 : -1;
              a.x -= push * dt * 1.4;
              b.x += push * dt * 1.4;
              if ((a.me || b.me) && Math.random() < dt * 1.5) say('bella', ['Ei! Sai da frente!', 'Encostou! Isso é bate-bate agora?', 'Cuidado com a pintura!'][Math.floor(Math.random() * 3)]);
            }
          }
        // objetos na água
        for (const s of segs) for (const sp of s.sprites) if (sp.gone && sp.gone > 0) sp.gone -= dt;
        for (const r of racers) {
          const s = segAt(r.z);
          for (const sp of s.sprites) {
            if (sp.gone && sp.gone > 0) continue;
            if (sp.kind === 'box' && Math.abs(sp.x - r.x) < 0.22) {
              sp.gone = 2.5;
              if (r.me && !item && rolling <= 0) roll(pickFor(me));
            } else if ((sp.kind === 'vitoria' || sp.kind === 'patos') && Math.abs(sp.x - r.x) < 0.24 && r.spin <= 0) {
              if (!r.me && Math.random() < 0.5) continue;
              sp.gone = 99;
              hitRacer(r, sp.kind === 'patos' ? 'DESCULPA, FAMÍLIA PATO!' : 'Enroscou na vitória-régia! Rodamos!', 1.1);
              if (!r.me && Math.abs(r.z - me.z) < TRACK * 0.2) say('bella', `O ${r.name.toLowerCase()} rodou! AGORA!`);
            }
          }
          if (s.pad !== null && Math.abs(s.pad - r.x) < 0.22) {
            if (r.me && r.boost <= 0.3) {
              AudioSystem.play('confirm');
              showBanner('TURBO!', 'go', 0.5);
            }
            r.boost = Math.max(r.boost, 1.2);
          }
        }
        // ondas
        for (let i = waves.length - 1; i >= 0; i--) {
          const w = waves[i];
          w.z += w.v * dt;
          let hit = false;
          for (const r of racers) {
            if (r === w.owner || r.spin > 0 || Math.abs(w.z - r.z) > SEG || Math.abs(w.x - r.x) > 0.3) continue;
            hit = true;
            if (hitRacer(r, 'Tomamos uma onda! Que cisne malvado!', 1.5) && w.owner.me) say('bella', `ACERTOU! O ${r.name.toLowerCase()} tomou um banho!`);
            break;
          }
          if (hit || w.z - w.owner.z > TRACK * 0.35) waves.splice(i, 1);
        }
        // voltas e posições
        const lap = lapOf(me.z);
        if (lap !== lapShown && !me.done) {
          lapShown = lap;
          showBanner(lap === LAPS ? 'ÚLTIMA VOLTA!' : `VOLTA ${lap}`, lap === LAPS ? 'last' : '');
          AudioSystem.play('quest');
          if (lap === LAPS) say('weng', posOf(me) === 1 ? 'Última volta! Segura a liderança!' : 'Última volta! Ainda dá! Usa tudo!');
        }
        const p = posOf(me);
        if (elapsed > 2 && p !== lastPos) {
          if (p < lastPos) {
            showBanner(p === 1 ? 'PRIMEIRO LUGAR!' : 'ULTRAPASSOU!', 'go', 0.9);
            AudioSystem.play('pickup');
          } else showBanner('Fomos passados!', 'last', 0.8);
          lastPos = p;
        }
        if (me.done) return finish();
        hud();
      }
      render(t);
      drawMini();
      raf = requestAnimationFrame(tick);
    };

    const finish = () => {
      if (phase === 'done') return;
      phase = 'done';
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      const pos = posOf(me);
      hud();
      render(performance.now());
      showBanner(pos === 1 ? 'VITÓRIA!' : `${pos}º lugar`, pos === 1 ? 'go' : '', 99);
      const table = h(
        'div',
        { class: 'bk-podium' },
        h('b', {}, 'Resultado'),
        ...order().map((r, i) => h('div', { class: r.me ? 'me' : '' }, h('span', { class: 'n' }, `${i + 1}º`), h('i', { style: `background:${r.color}` }), h('span', {}, r.me ? 'Bella & Weng' : r.name))),
      );
      ui.stage.append(table);
      say(pos === 1 ? 'bella' : 'weng', pos === 1 ? 'GANHAMOS! O cisne rosa ficou de bico aberto! Minhas pernas...' : pos === 2 ? 'Segundo lugar! Por um bico de cisne... revanche já!' : 'Não deu dessa vez... mas a gente chegou juntinho. Isso vale mais.');
      const stars = pos === 1 ? (hits <= 1 ? 3 : 2) : pos === 2 ? 2 : 1;
      ui.end(stars, 'Descer no píer', () => resolve({ stars, mistakes: hits }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame') return;
      const c = e.code;
      if (c === 'ArrowLeft' || c === 'KeyA') (keys.l = true), e.preventDefault();
      else if (c === 'ArrowRight' || c === 'KeyD') (keys.r = true), e.preventDefault();
      else if (c === 'Space' || c === 'KeyE' || c === 'Enter') {
        e.preventDefault();
        if (e.repeat) return;
        if (phase === 'rules') start();
        else if (phase === 'count') {
          if (countT < 0.35) {
            me.boost = 1.8;
            say('weng', 'LARGADA PERFEITA!');
          } else me.spin = 0.8;
        } else if (phase === 'race') {
          if (performance.now() - goAt < 350 && me.boost <= 0) {
            me.boost = 1.8;
            say('weng', 'LARGADA PERFEITA!');
          } else useItem();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.l = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.r = false;
    };
    const pad = (label: string, k: 'l' | 'r') => {
      const b = h('button', { class: 'btn pd-steer', 'aria-label': label }, label);
      b.addEventListener('pointerdown', () => (keys[k] = true));
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => (keys[k] = false));
      return b;
    };
    const itemBtn = h('button', { class: 'btn primary ce-serve' }, 'Usar item');
    itemBtn.addEventListener('click', useItem);
    const start = () => {
      if (phase !== 'rules') return;
      rules.classList.add('off');
      phase = 'count';
      countT = 3;
      ui.actions.replaceChildren(pad('◀', 'l'), itemBtn, pad('▶', 'r'));
      say('bella', 'Três... dois... um...');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Para a largada!');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    setItem(null);
    hud();
    say('weng', 'O cisne rosa chamou os amigos: cisne azul e patinho amarelo. Três voltas no lago!');
    raf = requestAnimationFrame(tick);
  });
}
