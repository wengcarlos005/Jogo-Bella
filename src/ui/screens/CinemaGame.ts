import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';

/**
 * Minigame — No escurinho do cinema (Five Nights at Freddy's, que a gente mal viu).
 *
 * Segure (espaço / E / botão) pra se pegar no escurinho: o "Filme perdido" vai enchendo.
 * O lanterninha passa com a lanterna pelas fileiras: se a luz pegar os dois no flagra, "Shhh!"
 * e perde um pedaço. E de vez em quando o filme dá um susto: a tela clareia a sala inteira
 * (a tela fica vermelha antes, como aviso). Encha a barra antes do filme acabar.
 */
export interface CinemaResult {
  stars: number;
  shh: number;
}

const DURATION = 50; // s de filme
const RATE = 0.075; // por segundo beijando

export function playCinemaGame(parent: HTMLElement): Promise<CinemaResult> {
  return new Promise((resolve) => {
    const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;
    for (const k of ['inocente', 'beijo', 'susto']) new Image().src = mg(`casal-${k}`);
    let fill = 0;
    let shh = 0;
    let time = 0;
    let holding = false;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    let lockUntil = 0;
    // lanterna: posição 0..100 (a fileira deles fica no meio), indo e voltando
    let beam = -30;
    let beamDir = 1;
    let beamSpeed = 22;
    let beamPause = 0;
    // susto do filme
    let scareIn = 9;
    let scareState: 'none' | 'warn' | 'flash' = 'none';
    let scareT = 0;

    const couple = h('img', { class: 'cg-couple', src: mg('casal-inocente'), alt: '' }) as HTMLImageElement;
    let coupleNow = '';
    const setCouple = (k: 'inocente' | 'beijo' | 'susto') => {
      if (coupleNow === k) return;
      coupleNow = k;
      couple.src = mg(`casal-${k}`);
    };
    const screenEl = h('div', { class: 'cg-screen' }, h('span', {}, "FIVE NIGHTS AT FREDDY'S"));
    const rows = h('div', { class: 'cg-rows' }, ...[0, 1, 2].map((r) => h('div', { class: `cg-row r${r}` }, ...Array.from({ length: 9 }, () => h('i')))));
    const beamEl = h('div', { class: 'cg-beam' });
    const usher = h('div', { class: 'cg-usher' }, '🔦');
    const flash = h('div', { class: 'cg-flash' });
    const hearts = h('div', { class: 'cg-hearts' });
    const stage = h('div', { class: 'cg-stage' }, screenEl, rows, couple, hearts, beamEl, usher, flash);
    const bar = h('i');
    const meter = h('div', { class: 'cg-meter' }, h('span', {}, 'Filme perdido 💋'), h('div', { class: 'cg-bar' }, bar));
    const timeBar = h('i');
    const clock = h('div', { class: 'cg-meter cg-time' }, h('span', {}, 'Filme 🎬'), h('div', { class: 'cg-bar' }, timeBar));
    const shhEl = h('div', { class: 'cg-shh' });
    const msg = h('div', { class: 'gp-bubble cg-msg' });
    const btn = h('button', { class: 'kg-btn' }, '💋 Segura pra se pegar');
    const startBtn = h('button', { class: 'btn primary gp-start' }, '🍿 Apagar as luzes');
    const actions = h('div', { class: 'bg-actions' }, startBtn);
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel cg-panel' },
      h('div', { class: 'bg-title cg-title' }, '🍿 Sala 3 · No escurinho 🍿'),
      h('div', { class: 'cg-top' }, meter, clock, shhEl),
      stage,
      msg,
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen cg-screen-wrap' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const say = (t: string) => {
      msg.textContent = t;
      msg.classList.remove('pop');
      void msg.offsetWidth;
      msg.classList.add('pop');
    };
    const hud = () => {
      bar.style.width = `${fill * 100}%`;
      timeBar.style.width = `${Math.min(1, time / DURATION) * 100}%`;
      shhEl.textContent = shh ? `Shhh! ×${shh}` : '';
    };
    const heart = () => {
      const e = h('i', {}, '♥');
      e.style.left = `${46 + Math.random() * 8}%`;
      e.style.setProperty('--dx', `${(Math.random() - 0.5) * 50}px`);
      hearts.append(e);
      setTimeout(() => e.remove(), 1100);
    };
    const caught = (why: 'luz' | 'susto') => {
      shh++;
      fill = Math.max(0, fill - 0.12);
      lockUntil = performance.now() + 1300;
      holding = false;
      AudioSystem.play('cancel');
      stage.classList.remove('bg-shake');
      void stage.offsetWidth;
      stage.classList.add('bg-shake');
      say(why === 'luz' ? pick(['Lanterninha: "SHHHH! Isso aqui é cinema, não motel!"', 'Lanterninha: "Ei, vocês dois! O filme é ali na frente!"', 'Lanterninha: "Shhh... (de novo vocês?)"']) : pick(['(O susto clareou a sala inteira... a fileira de trás viu TUDO)', 'Moça de trás: "Gente, que isso..."']));
      hud();
    };
    const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        time += dt;
        const locked = performance.now() < lockUntil;
        const kissing = holding && !locked;
        setCouple(locked ? 'susto' : kissing ? 'beijo' : 'inocente');
        if (kissing) {
          fill = Math.min(1, fill + dt * RATE * (1 + fill * 0.3));
          if (Math.random() < 0.12) heart();
        }
        // lanterna do lanterninha
        if (beamPause > 0) beamPause -= dt;
        else {
          beam += beamDir * beamSpeed * dt;
          if (beam > 130 || beam < -30) {
            beamDir *= -1;
            beamPause = 1.2 + Math.random() * 2.4;
            beamSpeed = 18 + Math.random() * 14 + time * 0.25;
          }
        }
        beamEl.style.left = `${beam}%`;
        usher.style.left = `${beam}%`;
        const lit = Math.abs(beam - 50) < 11;
        stage.classList.toggle('lit', lit);
        if (lit && kissing) caught('luz');
        // susto do filme: tela vermelha (aviso) → clarão
        scareIn -= dt;
        if (scareState === 'none' && scareIn <= 0) {
          scareState = 'warn';
          scareT = 1.1 - Math.min(0.5, time / 100);
          screenEl.classList.add('warn');
          AudioSystem.play('door');
        } else if (scareState === 'warn') {
          scareT -= dt;
          if (scareT <= 0) {
            scareState = 'flash';
            scareT = 0.7;
            screenEl.classList.remove('warn');
            flash.classList.add('on');
            AudioSystem.play('cancel');
          }
        } else if (scareState === 'flash') {
          scareT -= dt;
          if (kissing) caught('susto');
          if (scareT <= 0) {
            scareState = 'none';
            flash.classList.remove('on');
            scareIn = 5 + Math.random() * 6;
          }
        }
        hud();
        if (fill >= 1) return end(true);
        if (time >= DURATION) return end(false);
      }
      raf = requestAnimationFrame(tick);
    };

    const end = (won: boolean) => {
      running = false;
      done = true;
      holding = false;
      cancelAnimationFrame(raf);
      setCouple(won ? 'beijo' : 'inocente');
      const stars = won ? (shh <= 1 ? 3 : shh <= 3 ? 2 : 1) : 1;
      AudioSystem.play(won ? 'quest' : 'confirm');
      say(won ? 'As luzes acenderam. "...Alguém sabe como o filme acaba?" "Não faço ideia."' : 'Os créditos subiram. A gente viu... uns dez minutos de filme. No máximo.');
      actions.replaceChildren(
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('button', { class: 'btn primary', onclick: close }, 'Sair da sala ♥'),
      );
      const result = { stars, shh };
      function close() {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve(result);
      }
      InputSystem.once('minigame:interact', close);
    };

    const start = () => {
      if (running || done) return;
      startBtn.remove();
      actions.append(btn);
      running = true;
      last = 0;
      say('Segura pra se pegar no escurinho. Cuidado com a lanterna do lanterninha... e com os sustos do filme!');
    };
    startBtn.addEventListener('click', start);
    btn.addEventListener('pointerdown', () => (holding = true));
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, () => (holding = false));
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame') return;
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      if (e.type === 'keydown') {
        if (!running && !done) start();
        else holding = true;
      } else holding = false;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    say('Sala 3, última fileira. A pipoca tá no colo... e o filme é o que menos importa.');
    hud();
    raf = requestAnimationFrame(tick);

    function cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
