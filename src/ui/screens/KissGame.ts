import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Beijo escondido (filme no sofá, casa da Bella).
 * Segure (espaço / E / botão) pra beijar; cada beijo precisa de ~1,7 s sem soltar.
 * A mãe aparece na porta da cozinha de vez em quando: se ela pegar no flagra, perde um coração.
 * Antes dela aparecer vêm os passos (cada vez mais curtos). Às vezes é só a Lala passando... e
 * às vezes a mãe aparece sem aviso. 5 beijos pra passar; sem corações, recomeça.
 */
export interface KissResult {
  tries: number;
}

const NEED = 5;
const HOLD = 2.0;
const LIVES = 3;

// recorte da sala no cenário original (px): é o "palco" do minigame
const X0 = 430;
const Y0 = 430;
const CW = 700;
const CH = 460;
const at = (x: number, y: number) => `left:${((x - X0) / CW) * 100}%;top:${((y - Y0) / CH) * 100}%`;

export function playKissGame(parent: HTMLElement): Promise<KissResult> {
  return new Promise((resolve) => {
    const url = (k: string) => textureURL(k) ?? '';
    let kisses = 0;
    let lives = LIVES;
    let tries = 1;
    let progress = 0;
    let holding = false;
    let running = false;
    let done = false;
    let raf = 0;
    let last = 0;
    // mãe: 'away' → 'steps' (aviso) → 'look' (na porta) → 'away'
    let mom: 'away' | 'steps' | 'look' = 'away';
    let momT = 3;
    let fake = false;
    let caughtLock = 0;

    // ---------------------------------------------------------------- palco
    const bg = url('map-piabeta-casa-bella-bg');
    const stage = h('div', {
      class: 'kg-stage',
      style: bg ? `background-image:url(${bg});background-size:${(1536 / CW) * 100}% auto;background-position:${(X0 / (1536 - CW)) * 100}% ${(Y0 / (1024 - CH)) * 100}%` : '',
    });
    const sofa = h('img', { class: 'kg-obj', src: url('casa-sofa'), style: `${at(730, 748)};width:${(360 / CW) * 100}%` });
    const sheet = (key: string, frame: number, cols: number) => `background-image:url(${url(key)});background-size:${cols * 100}% auto;background-position:${(frame % cols) * (100 / (cols - 1))}% ${Math.floor(frame / cols) * (100 / 3)}%`;
    const bellaSit = h('div', { class: 'kg-char', style: `${at(688, 735)};${sheet('bella-sit', 0, 2)}` });
    const wengSit = h('div', { class: 'kg-char', style: `${at(772, 735)};${sheet('weng-sit', 0, 2)}` });
    const bellaKiss = h('div', { class: 'kg-char kiss', style: `${at(712, 735)};background-image:url(${url('bella-kiss')});background-size:100% 100%` });
    const wengKiss = h('div', { class: 'kg-char kiss', style: `${at(752, 735)};background-image:url(${url('weng-kiss')});background-size:100% 100%` });
    const momEl = h('div', { class: 'kg-char kg-mom', style: `${at(968, 660)};${sheet('mae-bella', 0, 4)}` });
    const lala = h('div', { class: 'kg-char kg-cat', style: `${at(900, 650)};${sheet('lala', 8, 4)}` });
    const shadow = h('div', { class: 'kg-shadow', style: `${at(970, 640)}` });
    const steps = h('div', { class: 'kg-steps', style: at(968, 560) }, '👣');
    const ring = h('div', { class: 'kg-ring', style: at(732, 548) }, h('i'));
    const tv = h('div', { class: 'kg-tv' });
    const flash = h('div', { class: 'kg-flash' });
    stage.append(tv, shadow, lala, momEl, sofa, bellaSit, wengSit, bellaKiss, wengKiss, ring, steps, flash);

    const livesEl = h('div', { class: 'kg-lives' });
    const kissesEl = h('div', { class: 'kg-kisses' });
    const msg = h('div', { class: 'gp-bubble kg-msg' }, 'Segura o botão (ou espaço) pra beijar. Mas fica de ouvido nos passos da mãe!');
    const btn = h('button', { class: 'kg-btn' }, '💋 Segura pra beijar');
    const startBtn = h('button', { class: 'btn primary gp-start' }, '🎬 Dar play no filme');
    const actions = h('div', { class: 'bg-actions' }, startBtn);
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel kg-panel' },
      h('div', { class: 'gp-title kg-title' }, h('span', {}, '💋'), 'Beijo escondido', h('span', {}, '🍿')),
      h('div', { class: 'kg-hud' }, livesEl, kissesEl),
      stage,
      msg,
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen kg-screen' }, panel);
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
      livesEl.replaceChildren(...Array.from({ length: LIVES }, (_, i) => h('span', { class: i < lives ? 'on' : '' }, '♥')));
      kissesEl.replaceChildren(...Array.from({ length: NEED }, (_, i) => h('span', { class: i < kisses ? 'on' : '' }, '💋')));
    };
    hud();
    const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
    const MOM_OK = ['Mãe: "Querem pipoca?!"', 'Mãe: "Tão gostando do filme?"', 'Mãe: "Bella, cadê o controle do ar?"', 'Mãe: "Esse filme é de terror? Que bom que tão juntinhos."', 'Mãe: "...Tá. Nada não."'];
    const MOM_CAUGHT = ['Mãe: "HMMMM. Tão vendo o filme mesmo, é?"', 'Mãe: "Eu vi, hein!"', 'Mãe: "Alexandre, vem ver o filme também!"'];
    const EXCUSES = ['Bella: "A gente tava... é... comentando a cena!"', 'Weng: "Cena muito boa essa, tia."', 'Bella: "Tinha um cílio no olho dele!"'];

    const nextMom = () => {
      mom = 'away';
      momT = Math.max(1.4, 2.2 + Math.random() * 3.2 - kisses * 0.35);
    };

    const setKiss = (on: boolean) => {
      bellaSit.classList.toggle('hide', on);
      wengSit.classList.toggle('hide', on);
      bellaKiss.classList.toggle('show', on);
      wengKiss.classList.toggle('show', on);
      stage.classList.toggle('kissing', on);
    };

    // ---------------------------------------------------------------- loop
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        // beijo
        const kissing = holding && performance.now() > caughtLock;
        setKiss(kissing);
        if (kissing) {
          progress += dt / HOLD;
          if (Math.random() < 0.15) heart();
          if (progress >= 1) {
            kisses++;
            progress = 0;
            AudioSystem.play('pickup');
            for (let i = 0; i < 6; i++) heart();
            hud();
            say(kisses >= NEED ? 'Bella: "...Shhh. O filme acabou."' : pick(['Weng: "Mais um..."', 'Bella: "Ela não viu. Ela não viu!"', '(coração disparado)', 'Weng: "A gente é muito bom nisso."']));
            holding = false;
            if (kisses >= NEED) return win();
          }
        } else progress = Math.max(0, progress - dt * 1.6);
        ring.style.setProperty('--p', String(progress));
        ring.classList.toggle('on', progress > 0.02);

        // mãe
        momT -= dt;
        if (mom === 'away' && momT <= 0) {
          fake = kisses >= 1 && Math.random() < 0.28;
          const noWarn = !fake && kisses >= 3 && Math.random() < 0.14;
          mom = 'steps';
          momT = noWarn ? 0.25 : Math.max(0.45, 1.1 - kisses * 0.14);
          if (!noWarn) {
            steps.classList.add('on');
            shadow.classList.add('on');
            AudioSystem.play('door');
          }
        } else if (mom === 'steps' && momT <= 0) {
          steps.classList.remove('on');
          shadow.classList.remove('on');
          mom = 'look';
          momT = fake ? 1.2 : 1.6;
          if (fake) {
            lala.classList.remove('walk');
            void lala.offsetWidth;
            lala.classList.add('walk');
            say(pick(['(...era só a Lala.)', 'Lala: "Miau." (passou e foi embora)']));
          } else {
            momEl.classList.add('show');
          }
        } else if (mom === 'look') {
          if (!fake && kissing) caught();
          if (momT <= 0) {
            if (!fake && performance.now() > caughtLock) say(pick(MOM_OK));
            momEl.classList.remove('show');
            nextMom();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const heart = () => {
      const e = h('i', { class: 'kg-heart' }, '♥');
      e.style.left = `${((732 - X0) / CW) * 100 + (Math.random() - 0.5) * 8}%`;
      e.style.top = `${((560 - Y0) / CH) * 100}%`;
      e.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
      stage.append(e);
      setTimeout(() => e.remove(), 1200);
    };

    const caught = () => {
      lives--;
      progress = 0;
      holding = false;
      caughtLock = performance.now() + 1500;
      setKiss(false);
      AudioSystem.play('cancel');
      flash.classList.remove('on');
      void flash.offsetWidth;
      flash.classList.add('on');
      stage.classList.remove('shake');
      void stage.offsetWidth;
      stage.classList.add('shake');
      say(`${pick(MOM_CAUGHT)}  ${pick(EXCUSES)}`);
      hud();
      if (lives <= 0) {
        running = false;
        setTimeout(() => {
          momEl.classList.remove('show');
          say('A mãe desconfiou de tudo... Ela foi pra cozinha. Bora tentar de novo, com mais cuidado!');
          actions.replaceChildren(h('button', { class: 'btn primary', onclick: retry }, 'Tentar de novo'));
        }, 1400);
      }
    };

    const retry = () => {
      tries++;
      kisses = 0;
      lives = LIVES;
      progress = 0;
      hud();
      start();
    };

    const start = () => {
      if (done) return;
      running = true;
      nextMom();
      momT = 3;
      actions.replaceChildren(btn);
      say('(O filme começou. A mãe tá na cozinha. Por enquanto.)');
    };

    const win = () => {
      running = false;
      done = true;
      setKiss(false);
      momEl.classList.remove('show');
      AudioSystem.play('quest');
      const close = () => {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve({ tries });
      };
      actions.replaceChildren(h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < Math.max(1, 4 - tries) ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))), h('button', { class: 'btn primary', onclick: close }, 'Fim do filme ♥'));
      setTimeout(() => InputSystem.once('minigame:interact', close), 500);
    };

    // controles: segurar
    const down = (e?: Event) => {
      e?.preventDefault();
      if (running) holding = true;
    };
    const up = () => (holding = false);
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
        e.preventDefault();
        if (!running && !done && actions.contains(startBtn)) start();
        else down();
      }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') up();
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    startBtn.addEventListener('click', start);
    (screen as HTMLElement & { __kiss?: unknown }).__kiss = {
      get mom() {
        return mom;
      },
      get kisses() {
        return kisses;
      },
      get lives() {
        return lives;
      },
    };

    function cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
