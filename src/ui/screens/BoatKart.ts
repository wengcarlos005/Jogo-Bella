import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { shell, type MiniResult } from './PetroGames';

/**
 * Corrida de Pedalinho no estilo "kart": o casal e o cisne rosa correm lado a lado no lago, 3 voltas.
 *  - ← → : pilotar (o casal pedala sozinho)
 *  - Espaço / E : usar o item da caixinha "?"
 *  - Na largada, aperte Espaço / E bem no "VAI!" pra sair com turbo.
 * Itens: Turbo (acelera), Pão pros patos (os patinhos cercam o cisne rosa se ele estiver na frente),
 * Onda (vai pra frente e derruba o cisne rosa se acertar). O cisne rosa também usa onda!
 * Setas na água dão turbo; vitória-régia e patinhos fazem rodar. Tudo só com teclado.
 */
type Kind = 'vitoria' | 'patos' | 'item' | 'seta' | 'boia';
type Thing = { kind: Kind; d: number; x: number; el: HTMLElement | null; gone: boolean };
type Item = 'turbo' | 'pao' | 'onda';
const ITEM_NAME: Record<Item, string> = { turbo: 'Turbo', pao: 'Pão pros patos', onda: 'Onda' };
const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;

const LAP = 340; // comprimento de uma volta (unidades de pista)
const LAPS = 3;
const VIEW = 90; // quantas unidades de pista cabem na tela (de cima a baixo)
const PY = 74; // altura do barco do casal na tela (%)

export function playBoatGame(parent: HTMLElement): Promise<MiniResult> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'pd', 'Corrida de Pedalinho');
    const water = h('div', { class: 'bk-water' });
    const lanes = h('div', { class: 'bk-banks' });
    const world = h('div', { class: 'bk-world' });
    const boat = h('img', { class: 'bk-boat me', src: mg('pd-barco'), alt: '' }) as HTMLImageElement;
    const rival = h('img', { class: 'bk-boat rv', src: mg('pd-rosa'), alt: '' }) as HTMLImageElement;
    const arrow = h('div', { class: 'bk-arrow' });
    const banner = h('div', { class: 'bk-banner' });
    const posEl = h('div', { class: 'bk-pos' });
    const itemBox = h('div', { class: 'bk-item' }, h('b', {}, 'Item'), h('span', {}, '—'));
    const speedLines = h('div', { class: 'bk-speed' });
    const rules = h(
      'div',
      { class: 'cs-rules pd-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('pd-barco2'), alt: '' }), h('span', {}, 'O casal pedala sozinho: você pilota com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), `. São ${LAPS} voltas contra o cisne rosa!`)),
      h('div', {}, h('span', { class: 'bk-q' }, '?'), h('span', {}, 'Passe nas caixinhas ', h('b', {}, '?'), ' pra ganhar um item e use com ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), ': turbo, pão pros patos ou onda.')),
      h('div', {}, h('img', { src: mg('pd-vitoria'), alt: '' }), h('span', {}, 'Setas amarelas na água dão turbo. Vitória-régia e patinhos fazem vocês rodarem. Dica: aperte Espaço bem no "VAI!" da largada!')),
    );
    ui.stage.append(water, lanes, world, rival, boat, arrow, speedLines, posEl, itemBox, banner, rules);

    // ---------------------------------------------------------------- pista
    const things: Thing[] = [];
    const add = (kind: Kind, d: number, x: number) => things.push({ kind, d, x, el: null, gone: false });
    for (let lap = 0; lap < LAPS; lap++) {
      const o = lap * LAP;
      for (let d = 30; d < LAP - 10; d += 22 + Math.random() * 10) {
        const r = Math.random();
        if (r < 0.32) add('vitoria', o + d, 15 + Math.random() * 70);
        else if (r < 0.5) add('patos', o + d, 15 + Math.random() * 70);
        else if (r < 0.66) add('seta', o + d, 15 + Math.random() * 70);
      }
      // fileira de caixinhas "?" em cada volta
      for (const dd of [70, 175]) for (const x of [25, 50, 75]) add('item', o + dd, x);
    }

    // ---------------------------------------------------------------- estado
    let pd = 0; // distância do casal
    let px = 40;
    let vx = 0;
    let spd = 0;
    let boost = 0;
    let spin = 0;
    let rd = 0;
    let rx = 60;
    let rspd = 0;
    let rboost = 0;
    let rspin = 0;
    let rItemIn = 7;
    let item: Item | null = null;
    let phase: 'rules' | 'count' | 'race' | 'done' = 'rules';
    let countT = 0;
    let goAt = 0;
    let last = 0;
    let raf = 0;
    let hits = 0;
    let lapShown = 1;
    let bannerT = 0;
    const waves: { el: HTMLElement; d: number; x: number; v: number; owner: 'me' | 'rv' }[] = [];
    const keys = { l: false, r: false };

    const showBanner = (text: string, cls = '') => {
      banner.textContent = text;
      banner.className = `bk-banner on ${cls}`;
      bannerT = 1.3;
    };
    const lapOf = (d: number) => Math.min(LAPS, Math.floor(d / LAP) + 1);
    const hud = () => {
      const p = Math.min(1, pd / (LAP * LAPS));
      const r = Math.min(1, rd / (LAP * LAPS));
      ui.hud.replaceChildren(
        h('span', {}, `Volta ${lapOf(pd)}/${LAPS}`),
        h('div', { class: 'pd-race' }, h('i', { style: `width:${p * 100}%` }), h('i', { class: 'rv', style: `left:${r * 100}%` })),
        h('span', { class: 'pg-err' }, hits ? `Batidas: ${hits}` : ''),
      );
      const first = pd >= rd;
      posEl.textContent = first ? '1º' : '2º';
      posEl.classList.toggle('second', !first);
    };
    const setItem = (it: Item | null) => {
      item = it;
      itemBox.replaceChildren(h('b', {}, 'Item'), h('span', {}, it ? ITEM_NAME[it] : '—'));
      itemBox.classList.toggle('has', !!it);
    };
    const screenY = (d: number) => PY - ((d - pd) / VIEW) * 100;

    const useItem = () => {
      if (phase !== 'race' || !item || spin > 0) return;
      const it = item;
      setItem(null);
      if (it === 'turbo') {
        boost = 2.2;
        AudioSystem.play('confirm');
        ui.say('weng', 'TURBO! PEDALA, BELLA!');
      } else if (it === 'pao') {
        AudioSystem.play('pickup');
        if (rd > pd && rd - pd < 120) {
          rspin = 1.8;
          ui.say('bella', 'Os patinhos cercaram o cisne rosa! Toma pão, patinhos!');
        } else ui.say('weng', 'Os patinhos vieram atrás da gente... ele tá atrás, não adiantou!');
      } else {
        AudioSystem.play('blip');
        const el = h('img', { class: 'bk-wave', src: mg('pd-onda'), alt: '' });
        world.append(el);
        waves.push({ el, d: pd + 6, x: px, v: 90, owner: 'me' });
        ui.say('bella', 'Lá vai a onda!');
      }
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
        }
      }
      if (phase === 'race') {
        // casal
        const dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
        vx += (dx * 140 - vx) * Math.min(1, dt * 8);
        if (spin > 0) {
          spin -= dt;
          vx *= 0.3;
        }
        px = Math.max(8, Math.min(92, px + vx * dt));
        const target = spin > 0 ? 6 : boost > 0 ? 58 : 38;
        spd += (target - spd) * Math.min(1, dt * (boost > 0 ? 5 : 2));
        if (boost > 0) boost -= dt;
        pd += spd * dt;
        // cisne rosa: segue a sua linha, desvia, e acelera se ficar pra trás (mas não demais)
        const gap = pd - rd;
        const rTarget = rspin > 0 ? 5 : (rboost > 0 ? 56 : 38.5) * (1 + Math.max(-0.1, Math.min(0.2, gap / 180)));
        rspd += (rTarget - rspd) * Math.min(1, dt * 2);
        if (rspin > 0) rspin -= dt;
        if (rboost > 0) rboost -= dt;
        rd += rspd * dt;
        const ahead = things.find((o) => !o.gone && (o.kind === 'vitoria' || o.kind === 'patos') && o.d > rd && o.d - rd < 25 && Math.abs(o.x - rx) < 12);
        const wantX = ahead ? (ahead.x > 50 ? ahead.x - 26 : ahead.x + 26) : 30 + 40 * (0.5 + 0.5 * Math.sin(rd / 37));
        rx += (wantX - rx) * Math.min(1, dt * 1.6);
        rItemIn -= dt;
        if (rItemIn <= 0) {
          rItemIn = 6 + Math.random() * 5;
          if (rd < pd && pd - rd < 70) {
            const el = h('img', { class: 'bk-wave rv', src: mg('pd-onda'), alt: '' });
            world.append(el);
            waves.push({ el, d: rd + 6, x: rx, v: 80, owner: 'rv' });
            ui.say('weng', 'O cisne rosa jogou uma ONDA na gente! Desvia!');
          } else {
            rboost = 1.6;
          }
        }
        // empurrão entre os barcos
        if (Math.abs(rd - pd) < 7 && Math.abs(rx - px) < 11) {
          const push = rx > px ? -1 : 1;
          px = Math.max(8, Math.min(92, px + push * 30 * dt));
          rx = Math.max(8, Math.min(92, rx - push * 30 * dt));
          if (Math.random() < dt * 1.5) ui.say('bella', 'Ei! Sai da nossa frente, cisne!');
        }
        // objetos na pista
        for (const o of things) {
          if (o.gone) continue;
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
                ? h('div', { class: 'bk-box' }, '?')
                : o.kind === 'seta'
                  ? h('div', { class: 'bk-pad' }, '▲▲')
                  : h('img', { class: `bk-obj ${o.kind}`, src: mg(o.kind === 'vitoria' ? 'pd-vitoria' : 'pd-patos'), alt: '' });
            world.append(o.el);
          }
          o.el.style.left = `${o.x}%`;
          o.el.style.top = `${sy}%`;
          // colisão com o casal
          if (Math.abs(o.d - pd) < 4 && Math.abs(o.x - px) < (o.kind === 'item' ? 9 : 10)) {
            if (o.kind === 'item') {
              o.gone = true;
              o.el.classList.add('got');
              if (!item) {
                const pool: Item[] = pd < rd ? ['turbo', 'pao', 'onda', 'turbo'] : ['onda', 'turbo', 'pao'];
                setItem(pool[Math.floor(Math.random() * pool.length)]);
                AudioSystem.play('pickup');
              }
              setTimeout(() => (o.gone = false), 4000);
            } else if (o.kind === 'seta') {
              if (boost <= 0.5) AudioSystem.play('confirm');
              boost = Math.max(boost, 1.2);
            } else if (spin <= 0) {
              spin = 1.1;
              hits++;
              o.gone = true;
              o.el.classList.add('hit');
              AudioSystem.play('cancel');
              ui.shake();
              ui.say(o.kind === 'patos' ? 'bella' : 'weng', o.kind === 'patos' ? 'DESCULPA, FAMÍLIA PATO!' : 'Enroscou na vitória-régia! Rodamos!');
            }
          }
          // o cisne rosa também roda (às vezes)
          if (rspin <= 0 && (o.kind === 'vitoria' || o.kind === 'patos') && Math.abs(o.d - rd) < 3 && Math.abs(o.x - rx) < 8 && Math.random() < 0.5) {
            rspin = 1;
            ui.say('bella', 'O cisne rosa rodou! AGORA!');
          }
        }
        // ondas
        for (let i = waves.length - 1; i >= 0; i--) {
          const w = waves[i];
          w.d += w.v * dt;
          const sy = screenY(w.d);
          w.el.style.left = `${w.x}%`;
          w.el.style.top = `${sy}%`;
          let hit = false;
          if (w.owner === 'me' && Math.abs(w.d - rd) < 5 && Math.abs(w.x - rx) < 14) {
            rspin = 1.6;
            hit = true;
            ui.say('bella', 'ACERTOU! O cisne rosa tomou um banho!');
          }
          if (w.owner === 'rv' && Math.abs(w.d - pd) < 5 && Math.abs(w.x - px) < 12 && spin <= 0) {
            spin = 1.2;
            hits++;
            hit = true;
            ui.shake();
            ui.say('bella', 'Fomos atingidos! Que cisne malvado!');
          }
          if (hit || sy < -20 || w.d - Math.max(pd, rd) > 160) {
            w.el.remove();
            waves.splice(i, 1);
          }
        }
        // voltas
        const lap = lapOf(pd);
        if (lap !== lapShown) {
          lapShown = lap;
          showBanner(lap === LAPS ? 'ÚLTIMA VOLTA!' : `Volta ${lap}`, lap === LAPS ? 'last' : '');
          AudioSystem.play('quest');
          if (lap === LAPS) ui.say('weng', pd >= rd ? 'Última volta! Segura a liderança!' : 'Última volta! Ainda dá! Usa tudo!');
        }
        if (pd >= LAP * LAPS || rd >= LAP * LAPS) return finish(pd >= rd);
        hud();
      }
      // desenho
      water.style.backgroundPositionY = `${pd * 6}px`;
      lanes.style.backgroundPositionY = `${pd * 6}px`;
      boat.style.left = `${px}%`;
      boat.style.top = `${PY}%`;
      boat.style.transform = `translate(-50%, -50%) rotate(${spin > 0 ? spin * 720 : vx * 0.08}deg)`;
      boat.src = mg(phase === 'race' && Math.floor(t / 180) % 2 ? 'pd-barco2' : 'pd-barco');
      boat.classList.toggle('boost', boost > 0);
      const rsy = screenY(rd);
      rival.style.left = `${rx}%`;
      rival.style.top = `${Math.max(-12, Math.min(112, rsy))}%`;
      rival.style.transform = `translate(-50%, -50%) rotate(${rspin > 0 ? rspin * 720 : 0}deg)`;
      rival.classList.toggle('boost', rboost > 0);
      if (rsy < 2 || rsy > 98) {
        arrow.className = `bk-arrow on ${rsy < 2 ? 'up' : 'down'}`;
        arrow.style.left = `${rx}%`;
        arrow.textContent = `${rsy < 2 ? '▲' : '▼'} ${Math.round(Math.abs(rd - pd))}m`;
      } else arrow.className = 'bk-arrow';
      speedLines.classList.toggle('on', boost > 0);
      raf = requestAnimationFrame(tick);
    };

    const finish = (won: boolean) => {
      if (phase === 'done') return;
      phase = 'done';
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      showBanner(won ? 'VITÓRIA!' : '2º lugar', won ? 'go' : '');
      const margin = Math.abs(pd - rd);
      ui.say(won ? 'bella' : 'weng', won ? (margin > 30 ? 'GANHAMOS COM FOLGA! O cisne rosa nem viu a gente passar!' : 'GANHAMOS! Por um bico de cisne! Minhas pernas...') : 'O cisne rosa chegou primeiro... mas a gente chegou juntinho. Isso vale mais.');
      const stars = won ? (hits <= 1 ? 3 : 2) : 1;
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
          // apertou antes da hora: afoga o motor
          if (countT < 0.35) {
            boost = 1.6;
            ui.say('weng', 'LARGADA PERFEITA!');
          } else spin = 0.8;
        } else if (phase === 'race') {
          if (performance.now() - goAt < 350 && boost <= 0) {
            boost = 1.6;
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
    ui.say('weng', 'Aquele cisne rosa tá encarando a gente. É corrida. Três voltas no lago!');
    raf = requestAnimationFrame(tick);
  });
}
