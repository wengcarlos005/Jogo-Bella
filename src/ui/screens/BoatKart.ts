import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { shell, type MiniResult } from './PetroGames';

/**
 * Cisne Kart — corrida de pedalinho no lago do Quitandinha, 4 barcos, 3 voltas.
 *  - ← → : pilotar (o casal pedala sozinho) · Espaço / E : usar o item
 *  - Na largada, aperte Espaço / E bem no "VAI!" pra sair com turbo.
 * Caixas "?" sorteiam um item (roleta): Pimenta (turbo), Pão pros patos (os patinhos cercam quem
 * está na frente), Onda (projétil pra frente) e Coração (escudo contra a próxima batida).
 * Quem está mais atrás ganha itens melhores. Os rivais também usam itens.
 * Faixas amarelas na água dão turbo; vitória-régia e patinhos fazem rodar.
 */
type Kind = 'vitoria' | 'patos' | 'item' | 'pad';
type Thing = { kind: Kind; d: number; x: number; el: HTMLElement | null; gone: number };
type Item = 'pimenta' | 'pao' | 'onda' | 'coracao';
type Racer = {
  id: string;
  name: string;
  me: boolean;
  el: HTMLElement;
  img: HTMLImageElement;
  d: number;
  x: number;
  vx: number;
  spd: number;
  base: number;
  boost: number;
  spin: number;
  shield: number;
  itemIn: number;
  lane: number;
  color: string;
  done: number; // tempo de chegada (0 = correndo)
};
const ITEM_NAME: Record<Item, string> = { pimenta: 'Pimenta turbo', pao: 'Pão pros patos', onda: 'Onda', coracao: 'Coração escudo' };
const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;

const LAP = 340;
const LAPS = 3;
const TOTAL = LAP * LAPS;
const VIEW = 90;
const PY = 72;

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

export function playBoatGame(parent: HTMLElement): Promise<MiniResult> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'bk', 'Cisne Kart');
    const water = h('div', { class: 'bk-water' });
    const bankL = h('div', { class: 'bk-bank l' });
    const bankR = h('div', { class: 'bk-bank r' });
    const world = h('div', { class: 'bk-world' });
    const fx = h('div', { class: 'bk-fx' });
    const banner = h('div', { class: 'bk-banner' });
    const speedLines = h('div', { class: 'bk-speed' });
    const arrows = h('div', { class: 'bk-arrows' });
    // slot do item, em cima à esquerda, com a roleta
    const slotIcon = h('div', { class: 'bk-slot-ico' });
    const slotName = h('span', {}, 'Sem item');
    const slot = h('div', { class: 'bk-slot' }, h('b', {}, 'Item'), slotIcon, slotName);
    // posição grande em cima à direita
    const posBig = h('div', { class: 'bk-posbig' }, h('b', {}, '1º'), h('span', {}, '/4'));
    const rules = h(
      'div',
      { class: 'cs-rules pd-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('pd-barco2'), alt: '' }), h('span', {}, 'O casal pedala sozinho: você pilota com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), `. ${LAPS} voltas contra o cisne rosa, o cisne azul e o patinho amarelo!`)),
      h('div', {}, h('span', { class: 'bk-rule-ico', html: itemSVG('box') }), h('span', {}, 'Passe nas caixas ', h('b', {}, '?'), ' pra sortear um item e use com ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), '. Quem tá atrás ganha item melhor!')),
      h('div', {}, h('span', { class: 'bk-rule-ico', html: itemSVG('pimenta') }), h('span', {}, 'Pimenta = turbo · Pão = patinhos cercam quem tá na frente · Onda = acerta quem tá na frente · Coração = escudo. Faixas amarelas na água dão turbo!')),
    );
    ui.stage.append(water, bankL, bankR, world, fx, speedLines, arrows, slot, posBig, banner, rules);

    // ---------------------------------------------------------------- pista
    const things: Thing[] = [];
    const add = (kind: Kind, d: number, x: number) => things.push({ kind, d, x, el: null, gone: 0 });
    for (let lap = 0; lap < LAPS; lap++) {
      const o = lap * LAP;
      for (let d = 34; d < LAP - 14; d += 20 + Math.random() * 10) {
        const r = Math.random();
        if (r < 0.3) add('vitoria', o + d, 18 + Math.random() * 64);
        else if (r < 0.46) add('patos', o + d, 18 + Math.random() * 64);
        else if (r < 0.64) add('pad', o + d, 18 + Math.random() * 64);
      }
      for (const dd of [62, 168, 262]) for (const x of [26, 50, 74]) add('item', o + dd, x);
    }
    // linhas de chegada / volta
    const lines: { d: number; el: HTMLElement; label: string }[] = [];
    for (let lap = 1; lap <= LAPS; lap++) lines.push({ d: lap * LAP, el: h('div', { class: 'bk-line' + (lap === LAPS ? ' finish' : '') }, h('span', {}, lap === LAPS ? 'CHEGADA' : `VOLTA ${lap + 1}`)), label: '' });
    lines.forEach((l) => world.append(l.el));
    // boias nas margens
    const buoys: { d: number; side: number; el: HTMLElement }[] = [];
    for (let d = 0; d < TOTAL + VIEW; d += 26) for (const side of [0, 1]) buoys.push({ d, side, el: h('i', { class: 'bk-buoy' }) });
    buoys.forEach((b) => world.append(b.el));

    // ---------------------------------------------------------------- barcos
    const mkRacer = (id: string, name: string, me: boolean, src: string, color: string, x: number, base: number, lane: number): Racer => {
      const img = h('img', { src, alt: '' }) as HTMLImageElement;
      const el = h('div', { class: `bk-boat ${id}${me ? ' me' : ''}` }, h('i', { class: 'bk-wake' }), h('i', { class: 'bk-shield' }), img, h('b', { class: 'bk-tag' }, me ? 'VOCÊS' : name));
      world.append(el);
      return { id, name, me, el, img, d: 0, x, vx: 0, spd: 0, base, boost: 0, spin: 0, shield: 0, itemIn: 5 + Math.random() * 4, lane, color, done: 0 };
    };
    const me = mkRacer('me', 'Vocês', true, mg('pd-barco'), '#ffd23f', 40, 38, 0);
    const rosa = mkRacer('rosa', 'Cisne rosa', false, mg('pd-rosa'), '#ff6a9a', 60, 38.6, 0.2);
    const azul = mkRacer('azul', 'Cisne azul', false, mg('pd-rosa'), '#5a9aff', 22, 37.4, 1.7);
    const pato = mkRacer('pato', 'Patinho', false, mg('pd-rosa'), '#ffd84a', 78, 36.8, 3.1);
    // largada em fila: dois na frente, dois atrás
    rosa.d = 4;
    azul.d = 0;
    pato.d = 4;
    me.d = 0;
    const racers = [me, rosa, azul, pato];

    // ---------------------------------------------------------------- estado
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
    const waves: { el: HTMLElement; d: number; x: number; v: number; owner: Racer }[] = [];
    const keys = { l: false, r: false };

    const showBanner = (text: string, cls = '', dur = 1.3) => {
      banner.textContent = text;
      banner.className = `bk-banner on ${cls}`;
      bannerT = dur;
    };
    const lapOf = (d: number) => Math.min(LAPS, Math.floor(d / LAP) + 1);
    const order = () => [...racers].sort((a, b) => (a.done && b.done ? a.done - b.done : a.done ? -1 : b.done ? 1 : b.d - a.d));
    const posOf = (r: Racer) => order().indexOf(r) + 1;
    const screenY = (d: number) => PY - ((d - me.d) / VIEW) * 100;
    const puff = (x: number, y: number, cls: string, text = '') => {
      const el = h('i', { class: `bk-puff ${cls}`, style: `left:${x}%;top:${y}%` }, text);
      fx.append(el);
      setTimeout(() => el.remove(), 900);
    };

    // placar: posição, volta, mapa da corrida com os 4 barcos
    const sbPos = h('b', { class: 'bk-sb-pos' }, '1º');
    const sbLap = h('b', { class: 'bk-sb-n' }, `1/${LAPS}`);
    const sbDots = racers.map((r) => h('i', { class: `bk-dot ${r.id}`, style: `--c:${r.color}` }));
    const sbTrack = h('div', { class: 'bk-sb-track' }, h('i', { class: 'bk-sb-flag' }), ...sbDots);
    ui.hud.replaceChildren(
      h(
        'div',
        { class: 'so-sb bk-sb' },
        h('div', { class: 'so-sb-chip' }, h('span', {}, 'Posição'), sbPos),
        h('div', { class: 'so-sb-chip' }, h('span', {}, 'Volta'), sbLap),
        h('div', { class: 'so-sb-chip wide' }, sbTrack),
      ),
    );
    const hud = () => {
      const p = posOf(me);
      const ps = `${p}º`;
      if (sbPos.textContent !== ps) {
        sbPos.textContent = ps;
        sbPos.className = `bk-sb-pos p${p} bump`;
        (posBig.firstChild as HTMLElement).textContent = ps;
        posBig.className = `bk-posbig p${p} bump`;
        setTimeout(() => posBig.classList.remove('bump'), 500);
      }
      sbLap.textContent = `${lapOf(me.d)}/${LAPS}`;
      racers.forEach((r, i) => (sbDots[i].style.left = `${Math.min(1, r.d / TOTAL) * 100}%`));
    };
    const setItem = (it: Item | null) => {
      item = it;
      slotIcon.innerHTML = it ? itemSVG(it) : '';
      slotName.textContent = it ? ITEM_NAME[it] : 'Sem item';
      slot.classList.toggle('has', !!it);
    };
    // roleta: gira os ícones e para no item sorteado
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
    const hitRacer = (r: Racer, how: string, dur = 1.2) => {
      if (r.shield > 0) {
        r.shield = 0;
        r.el.classList.remove('shielded');
        puff(r.x, screenY(r.d), 'pop', 'Escudo!');
        AudioSystem.play('confirm');
        return false;
      }
      r.spin = dur;
      puff(r.x, screenY(r.d), 'splash');
      if (r.me) {
        hits++;
        ui.shake();
        AudioSystem.play('cancel');
        ui.say('bella', how);
      }
      return true;
    };
    const fire = (r: Racer, it: Item) => {
      if (it === 'pimenta') {
        r.boost = 2.2;
        if (r.me) {
          AudioSystem.play('confirm');
          ui.say('weng', 'PIMENTA! PEDALA, BELLA!');
          showBanner('TURBO!', 'go', 0.8);
        }
      } else if (it === 'coracao') {
        r.shield = 8;
        r.el.classList.add('shielded');
        if (r.me) ui.say('bella', 'Escudo de coração! Agora ninguém encosta na gente.');
      } else if (it === 'pao') {
        // os patinhos cercam o barco logo à frente
        const ahead = racers.filter((o) => o !== r && !o.done && o.d > r.d && o.d - r.d < 160).sort((a, b) => a.d - b.d)[0];
        if (ahead && hitRacer(ahead, 'Os patinhos cercaram a gente!', 1.8)) {
          for (let i = 0; i < 3; i++) puff(ahead.x + (i - 1) * 5, screenY(ahead.d) + 4, 'duck');
          if (r.me) ui.say('bella', `Os patinhos cercaram o ${ahead.name.toLowerCase()}! Toma pão, patinhos!`);
          else if (ahead.me) ui.say('weng', `O ${r.name.toLowerCase()} jogou pão! Os patos tão em cima da gente!`);
        } else if (r.me) ui.say('weng', 'Não tinha ninguém na frente... os patinhos agradecem o lanche.');
        if (r.me) AudioSystem.play('pickup');
      } else {
        const el = h('div', { class: 'bk-wave' + (r.me ? '' : ' rv'), html: itemSVG('onda') });
        world.append(el);
        waves.push({ el, d: r.d + 6, x: r.x, v: 95, owner: r });
        if (r.me) {
          AudioSystem.play('blip');
          ui.say('bella', 'Lá vai a onda!');
        }
      }
    };
    const useItem = () => {
      if (phase !== 'race' || !item || rolling > 0 || me.spin > 0) return;
      const it = item;
      setItem(null);
      fire(me, it);
    };

    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (bannerT > 0) {
        bannerT -= dt;
        if (bannerT <= 0) banner.classList.remove('on');
      }
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
        // ---- vocês
        const dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
        me.vx += (dx * 150 - me.vx) * Math.min(1, dt * 8);
        // ---- os rivais: seguem a raia, desviam, usam item, e não deixam a corrida ficar sem graça
        for (const r of racers) {
          if (r.me) continue;
          const ahead = things.find((o) => !o.gone && (o.kind === 'vitoria' || o.kind === 'patos') && o.d > r.d && o.d - r.d < 24 && Math.abs(o.x - r.x) < 12);
          const box = things.find((o) => !o.gone && (o.kind === 'item' || o.kind === 'pad') && o.d > r.d && o.d - r.d < 30);
          const wantX = ahead ? (ahead.x > 50 ? ahead.x - 24 : ahead.x + 24) : box && Math.random() < 0.6 ? box.x : 30 + 40 * (0.5 + 0.5 * Math.sin(r.d / 37 + r.lane));
          r.vx += ((wantX - r.x) * 2.2 - r.vx) * Math.min(1, dt * 3);
          r.itemIn -= dt;
          if (r.itemIn <= 0 && !r.done) {
            r.itemIn = 6 + Math.random() * 6;
            const it = pickFor(r);
            // o cisne rosa adora mirar em vocês
            if ((it === 'onda' || it === 'pao') && !(me.d > r.d && me.d - r.d < 100) && r.id === 'rosa') r.boost = 1.4;
            else fire(r, it);
          }
        }
        for (const r of racers) {
          if (r.spin > 0) {
            r.spin -= dt;
            r.vx *= 0.3;
          }
          r.x = Math.max(9, Math.min(91, r.x + r.vx * dt));
          let target = r.spin > 0 ? 6 : r.boost > 0 ? 60 : r.base;
          if (!r.me && !r.done) target *= 1 + Math.max(-0.24, Math.min(0.16, (me.d - r.d) / 150)); // elástico: pelotão junto (a corrida fica disputada)
          if (r.done) target = 22;
          r.spd += (target - r.spd) * Math.min(1, dt * (r.boost > 0 ? 5 : 2));
          if (r.boost > 0) r.boost -= dt;
          if (r.shield > 0) {
            r.shield -= dt;
            if (r.shield <= 0) r.el.classList.remove('shielded');
          }
          r.d += r.spd * dt;
          if (!r.done && r.d >= TOTAL) r.done = elapsed;
        }
        // empurrões entre os barcos
        for (let i = 0; i < racers.length; i++)
          for (let j = i + 1; j < racers.length; j++) {
            const a = racers[i];
            const b = racers[j];
            if (Math.abs(a.d - b.d) < 7 && Math.abs(a.x - b.x) < 10) {
              const push = b.x > a.x ? 1 : -1;
              a.x = Math.max(9, Math.min(91, a.x - push * 34 * dt));
              b.x = Math.max(9, Math.min(91, b.x + push * 34 * dt));
              if ((a.me || b.me) && Math.random() < dt * 1.2) ui.say('bella', ['Ei! Sai da frente!', 'Encostou! Isso é bate-bate agora?', 'Cuidado com a pintura!'][Math.floor(Math.random() * 3)]);
            }
          }
        // ---- objetos na pista
        for (const o of things) {
          if (o.gone > 0) {
            o.gone -= dt;
            if (o.gone <= 0 && o.el) o.el.classList.remove('got');
          }
          const sy = screenY(o.d);
          if (sy < -15 || sy > 115) {
            if (o.el) {
              o.el.remove();
              o.el = null;
            }
            continue;
          }
          if (!o.el) {
            o.el =
              o.kind === 'item'
                ? h('div', { class: 'bk-box', html: itemSVG('box') })
                : o.kind === 'pad'
                  ? h('div', { class: 'bk-pad' }, h('i'), h('i'), h('i'))
                  : h('img', { class: `bk-obj ${o.kind}`, src: mg(o.kind === 'vitoria' ? 'pd-vitoria' : 'pd-patos'), alt: '' });
            if (o.gone > 0) o.el.classList.add('got');
            world.append(o.el);
          }
          o.el.style.left = `${o.x}%`;
          o.el.style.top = `${sy}%`;
          if (o.gone > 0) continue;
          for (const r of racers) {
            if (Math.abs(o.d - r.d) >= 4 || Math.abs(o.x - r.x) >= (o.kind === 'item' ? 9 : 9.5)) continue;
            if (o.kind === 'item') {
              if (o.kind === 'item') {
                o.gone = 3;
                o.el.classList.add('got');
                if (r.me) {
                  puff(o.x, sy, 'pop', '?');
                  if (!item && rolling <= 0) roll(pickFor(me));
                }
              }
            } else if (o.kind === 'pad') {
              if (r.me && r.boost <= 0.3) {
                AudioSystem.play('confirm');
                puff(r.x, screenY(r.d), 'zoom');
              }
              r.boost = Math.max(r.boost, 1.2);
            } else if (r.spin <= 0) {
              if (!r.me && Math.random() < 0.5) continue; // os rivais às vezes escapam por pouco
              o.gone = 99;
              o.el.classList.add('hit');
              hitRacer(r, o.kind === 'patos' ? 'DESCULPA, FAMÍLIA PATO!' : 'Enroscou na vitória-régia! Rodamos!', 1.1);
              if (!r.me && Math.abs(r.d - me.d) < 60) ui.say('bella', `O ${r.name.toLowerCase()} rodou! AGORA!`);
            }
          }
        }
        // ---- ondas
        for (let i = waves.length - 1; i >= 0; i--) {
          const w = waves[i];
          w.d += w.v * dt;
          const sy = screenY(w.d);
          w.el.style.left = `${w.x}%`;
          w.el.style.top = `${sy}%`;
          let hit = false;
          for (const r of racers) {
            if (r === w.owner || r.spin > 0 || Math.abs(w.d - r.d) >= 5 || Math.abs(w.x - r.x) >= 13) continue;
            hit = true;
            if (hitRacer(r, 'Tomamos uma onda! Que cisne malvado!', 1.5) && w.owner.me) ui.say('bella', `ACERTOU! O ${r.name.toLowerCase()} tomou um banho!`);
            break;
          }
          if (hit || sy < -20 || w.d - w.owner.d > 170) {
            w.el.remove();
            waves.splice(i, 1);
          }
        }
        // ---- voltas e posições
        const lap = lapOf(me.d);
        if (lap !== lapShown && !me.done) {
          lapShown = lap;
          showBanner(lap === LAPS ? 'ÚLTIMA VOLTA!' : `VOLTA ${lap}`, lap === LAPS ? 'last' : '');
          AudioSystem.play('quest');
          if (lap === LAPS) ui.say('weng', posOf(me) === 1 ? 'Última volta! Segura a liderança!' : 'Última volta! Ainda dá! Usa tudo!');
        }
        const p = posOf(me);
        if (elapsed > 2 && p !== lastPos) {
          if (p < lastPos) {
            showBanner(p === 1 ? 'PRIMEIRO LUGAR!' : 'ULTRAPASSOU!', 'go', 0.9);
            AudioSystem.play('pickup');
          } else {
            showBanner('Fomos passados!', 'last', 0.8);
          }
          lastPos = p;
        }
        if (me.done) return finish();
        hud();
      }
      // ---- desenho
      const scroll = me.d * 6;
      water.style.backgroundPositionY = `${scroll}px`;
      bankL.style.backgroundPositionY = `${scroll}px`;
      bankR.style.backgroundPositionY = `${scroll}px`;
      for (const l of lines) {
        const sy = screenY(l.d);
        l.el.style.top = `${sy}%`;
        l.el.style.display = sy < -10 || sy > 110 ? 'none' : '';
      }
      for (const b of buoys) {
        const sy = screenY(b.d);
        const on = sy > -8 && sy < 108;
        b.el.style.display = on ? '' : 'none';
        if (on) {
          b.el.style.top = `${sy}%`;
          b.el.style.left = b.side ? '95.5%' : '4.5%';
        }
      }
      arrows.replaceChildren();
      let nUp = 0;
      let nDown = 0;
      for (const r of racers) {
        const sy = r.me ? PY : screenY(r.d);
        r.el.style.left = `${r.x}%`;
        r.el.style.top = `${Math.max(-14, Math.min(114, sy))}%`;
        r.el.style.zIndex = String(10 + Math.round(sy));
        r.el.style.setProperty('--rot', `${r.spin > 0 ? r.spin * 720 : r.vx * 0.08}deg`);
        r.el.classList.toggle('boost', r.boost > 0);
        r.el.classList.toggle('moving', phase === 'race');
        if (r.me) r.img.src = mg(phase === 'race' && Math.floor(t / 180) % 2 ? 'pd-barco2' : 'pd-barco');
        if (!r.me && (sy < 2 || sy > 98)) {
          const up = sy < 2;
          const k = up ? nUp++ : nDown++;
          arrows.append(h('b', { class: `bk-arrow ${up ? 'up' : 'down'}`, style: `left:${Math.max(16, Math.min(84, r.x))}%;--c:${r.color};${up ? 'top' : 'bottom'}:${2 + k * 8}%` }, `${up ? '▲' : '▼'} ${r.name} ${Math.round(Math.abs(r.d - me.d))}m`));
        }
      }
      speedLines.classList.toggle('on', me.boost > 0);
      ui.stage.classList.toggle('bk-fast', me.boost > 0);
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
      showBanner(pos === 1 ? 'VITÓRIA!' : `${pos}º lugar`, pos === 1 ? 'go' : '', 99);
      // pódio
      const table = h(
        'div',
        { class: 'bk-podium' },
        h('b', {}, 'Resultado'),
        ...order().map((r, i) => h('div', { class: r.me ? 'me' : '' }, h('span', { class: 'n' }, `${i + 1}º`), h('i', { style: `background:${r.color}` }), h('span', {}, r.me ? 'Bella & Weng' : r.name))),
      );
      ui.stage.append(table);
      ui.say(pos === 1 ? 'bella' : 'weng', pos === 1 ? 'GANHAMOS! O cisne rosa ficou de bico aberto! Minhas pernas...' : pos === 2 ? 'Segundo lugar! Por um bico de cisne... revanche já!' : 'Não deu dessa vez... mas a gente chegou juntinho. Isso vale mais.');
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
            ui.say('weng', 'LARGADA PERFEITA!');
          } else me.spin = 0.8;
        } else if (phase === 'race') {
          if (performance.now() - goAt < 350 && me.boost <= 0) {
            me.boost = 1.8;
            ui.say('weng', 'LARGADA PERFEITA!');
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
      ui.say('bella', 'Três... dois... um...');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Para a largada!');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    setItem(null);
    hud();
    ui.say('weng', 'O cisne rosa chamou os amigos: cisne azul e patinho amarelo. Três voltas no lago!');
    raf = requestAnimationFrame(tick);
  });
}
