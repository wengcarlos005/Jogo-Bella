import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';
import { shell, type MiniResult } from './PetroGames';

/**
 * Minigames de Rio das Ostras (sprites em assets/minigames/so-* e tp-*):
 *  - Sol de rachar: fuja do sol! Fique debaixo da sombra das nuvens (← →) e passe protetor (Espaço / E).
 *  - A tempestade: junte as coisas na areia (setas) desviando dos raios e corra pro quiosque.
 * Os dois só com teclado (prontos pra controle).
 */
const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;
const chr = (f: string) => new URL(`assets/characters/${f}.png`, document.baseURI).href;

/** Personagem andando (folha 4x4: baixo, esquerda, direita, cima), desenhado num div. */
function walker(sheet: string, cls: string) {
  const el = h('div', { class: `ro-walker ${cls}`, style: `background-image:url(${chr(sheet)})` });
  let row = 0;
  let frame = 0;
  let acc = 0;
  return {
    el,
    /** dx/dy: direção (−1..1); dt: segundos */
    step(dx: number, dy: number, dt: number) {
      const moving = dx !== 0 || dy !== 0;
      if (moving) row = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
      acc += moving ? dt : 0;
      frame = moving ? Math.floor(acc * 8) % 4 : 0;
      el.style.backgroundPosition = `${(frame / 3) * 100}% ${(row / 3) * 100}%`;
    },
  };
}

/** Teclas seguradas (setas / WASD). */
function heldKeys() {
  const k = { l: false, r: false, u: false, d: false };
  const map = (c: string) => (c === 'ArrowLeft' || c === 'KeyA' ? 'l' : c === 'ArrowRight' || c === 'KeyD' ? 'r' : c === 'ArrowUp' || c === 'KeyW' ? 'u' : c === 'ArrowDown' || c === 'KeyS' ? 'd' : null);
  const down = (e: KeyboardEvent) => {
    const m = map(e.code);
    if (m && InputSystem.context === 'minigame') {
      e.preventDefault();
      k[m] = true;
    }
  };
  const up = (e: KeyboardEvent) => {
    const m = map(e.code);
    if (m) k[m] = false;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return { k, off: () => (window.removeEventListener('keydown', down), window.removeEventListener('keyup', up)) };
}

// ====================================================================== Sol de rachar
export function playSolGame(parent: HTMLElement): Promise<MiniResult & { burn: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'so', 'Sol de rachar');
    const bg = textureURL('map-ro-praia-bg');
    const TIME = 30;
    const sun = h('img', { class: 'so-sun', src: mg('so-sol'), alt: '' });
    const sky = h('div', { class: 'so-sky' });
    const fill = h('i', { class: 'so-fill' });
    const meter = h('div', { class: 'so-meter' }, h('div', { class: 'so-meter-in' }, fill), h('img', { src: mg('so-medidor'), alt: '' }));
    const bella = walker('bella-praia', 'b');
    const weng = walker('weng-praia', 'w');
    const pair = h('div', { class: 'so-pair' }, bella.el, weng.el);
    const lotion = h('img', { class: 'so-lotion', src: mg('so-creme'), alt: '' });
    const rules = h(
      'div',
      { class: 'cs-rules so-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('so-nuvem'), alt: '' }), h('span', {}, 'O pai não pagou o guarda-sol! Ande com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' e fique debaixo da SOMBRA das nuvens que passam.')),
      h('div', {}, h('img', { src: mg('so-protetor'), alt: '' }), h('span', {}, 'Pegue o protetor que aparece na areia (passe por cima) e aperte ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), ' pra passar: protege por um tempo.')),
      h('div', {}, h('img', { src: mg('so-medidor'), alt: '' }), h('span', {}, `No sol a barra de queimadura sobe; na sombra, desce. Aguente ${TIME} segundos sem ela encher!`)),
    );
    ui.stage.append(h('div', { class: 'so-bg', style: bg ? `background-image:url(${bg})` : '' }), sky, sun, meter, pair, lotion, rules);

    let x = 50;
    let burn = 0;
    let maxBurn = 0;
    let time = TIME;
    let bottles = 0;
    let protect = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    let spawnCloud = 0.3;
    let spawnBottle = 5;
    let lastLine = 0;
    const clouds: { el: HTMLElement; sh: HTMLElement; x: number; v: number; w: number }[] = [];
    const items: { el: HTMLElement; x: number }[] = [];
    const keys = heldKeys();

    const hud = () =>
      ui.hud.replaceChildren(h('span', {}, `Tempo: ${Math.max(0, Math.ceil(time))}s`), h('span', {}, `Protetor: ${bottles}`), h('span', { class: 'pg-err' }, protect > 0 ? 'Protegidos!' : ''));
    const addCloud = () => {
      const w = 18 + Math.random() * 8;
      const el = h('img', { class: 'so-cloud', src: mg('so-nuvem'), alt: '', style: `width:${w}%` });
      const sh = h('i', { class: 'so-shadow', style: `width:${w * 0.95}%` });
      sky.append(el, sh);
      const fromLeft = Math.random() < 0.5;
      clouds.push({ el, sh, x: fromLeft ? -w : 100 + w, v: (fromLeft ? 1 : -1) * (6 + Math.random() * 5 + (TIME - time) * 0.15), w });
    };
    const say = (who: string, t: string) => {
      if (performance.now() - lastLine < 2500) return;
      lastLine = performance.now();
      ui.say(who, t);
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        time -= dt;
        const dx = (keys.k.r ? 1 : 0) - (keys.k.l ? 1 : 0);
        x = Math.max(8, Math.min(92, x + dx * 38 * dt));
        bella.step(dx, 0, dt);
        weng.step(dx, 0, dt);
        pair.style.left = `${x}%`;
        // nuvens
        spawnCloud -= dt;
        if (spawnCloud <= 0) {
          addCloud();
          spawnCloud = 2.6 + Math.random() * 2.2 + (TIME - time) * 0.05;
        }
        let shade = false;
        for (let i = clouds.length - 1; i >= 0; i--) {
          const c = clouds[i];
          c.x += c.v * dt;
          c.el.style.left = `${c.x}%`;
          c.sh.style.left = `${c.x}%`;
          if (Math.abs(c.x - x) < c.w * 0.42) shade = true;
          if (c.x < -40 || c.x > 140) {
            c.el.remove();
            c.sh.remove();
            clouds.splice(i, 1);
          }
        }
        // protetor na areia
        spawnBottle -= dt;
        if (spawnBottle <= 0 && items.length < 2) {
          const bx = 10 + Math.random() * 80;
          const el = h('img', { class: 'so-bottle', src: mg('so-protetor'), alt: '', style: `left:${bx}%` });
          ui.stage.append(el);
          items.push({ el, x: bx });
          spawnBottle = 6 + Math.random() * 3;
        }
        for (let i = items.length - 1; i >= 0; i--) {
          if (Math.abs(items[i].x - x) < 6) {
            items[i].el.remove();
            items.splice(i, 1);
            bottles++;
            AudioSystem.play('pickup');
            say('weng', 'Protetor! Aperta Espaço que eu passo nas suas costas.');
          }
        }
        if (protect > 0) protect -= dt;
        const rate = shade ? -11 : protect > 0 ? 1.5 : 6 + (TIME - time) * 0.12;
        burn = Math.max(0, Math.min(100, burn + rate * dt));
        maxBurn = Math.max(maxBurn, burn);
        fill.style.height = `${burn}%`;
        fill.classList.toggle('hot', burn > 70);
        pair.classList.toggle('shade', shade);
        pair.classList.toggle('red', burn > 55);
        sun.classList.toggle('angry', !shade);
        if (!shade && burn > 60) say('bella', 'TÁ ARDENDO! Weng, acha uma sombra!');
        if (shade && burn > 30) say('weng', 'Ahhh, sombrinha... valeu, nuvem.');
        if (burn >= 100 || time <= 0) finish();
        hud();
      }
      raf = requestAnimationFrame(tick);
    };
    const useLotion = () => {
      if (!running || bottles <= 0 || protect > 0) return;
      bottles--;
      protect = 5;
      burn = Math.max(0, burn - 12);
      AudioSystem.play('confirm');
      lotion.style.left = `${x}%`;
      lotion.classList.remove('pop');
      void lotion.offsetWidth;
      lotion.classList.add('pop');
      ui.say('bella', 'Fator 50! Agora sim!');
      hud();
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      keys.off();
      window.removeEventListener('keydown', onKey);
      const queimou = burn >= 100;
      const stars = queimou ? 1 : maxBurn < 60 ? 3 : maxBurn < 85 ? 2 : 1;
      ui.stage.append(h('img', { class: 'so-end', src: mg('so-casal'), alt: '' }));
      ui.say('bella', queimou ? 'Virei camarão. Oficialmente. Weng, a gente precisa de um guarda-sol AGORA.' : 'Sobrevivemos... mais ou menos. Meu ombro tá rosa. O seu nariz tá vermelho.');
      ui.end(stars, 'Procurar um guarda-sol', () => resolve({ stars, mistakes: queimou ? 1 : 0, burn: Math.round(maxBurn) }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      e.preventDefault();
      if (!running && !done) start();
      else useLotion();
    };
    const lotionBtn = h('button', { class: 'btn primary ce-serve' }, 'Passar protetor');
    lotionBtn.addEventListener('click', useLotion);
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren(lotionBtn);
      addCloud();
      ui.say('weng', 'Seu pai disse que sol faz bem. Ele não falou QUANTO sol.');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Encarar o sol');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    bella.step(0, 0, 0);
    weng.step(0, 0, 0);
    hud();
    ui.say('bella', 'Sem guarda-sol, sem sombra... Weng, a gente vai derreter.');
    raf = requestAnimationFrame(tick);
  });
}

// ====================================================================== A tempestade
const STUFF = [
  { id: 'toalha', name: 'a toalha' },
  { id: 'guardasol', name: 'o guarda-sol' },
  { id: 'cadeira', name: 'a cadeira' },
  { id: 'isopor', name: 'o isopor' },
  { id: 'chapeu', name: 'o chapéu' },
  { id: 'chinelo', name: 'os chinelos' },
];

export function playTempestadeGame(parent: HTMLElement): Promise<MiniResult & { lives: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'tp', 'A tempestade');
    const bg = textureURL('map-ro-praia-bg');
    const TIME = 45;
    const field = h('div', { class: 'tp-field' });
    const dark = h('div', { class: 'tp-dark' });
    const rain = h('div', { class: 'tp-rain' });
    const kiosk = h('div', { class: 'tp-kiosk' }, h('b', {}, 'Quiosque'));
    const bella = walker('bella-praia', 'b');
    const me = h('div', { class: 'tp-me' }, bella.el);
    const flash = h('div', { class: 'tp-flash' });
    const clouds = h('div', { class: 'tp-clouds' }, h('img', { src: mg('tp-nuvem'), alt: '', style: 'left:4%' }), h('img', { src: mg('tp-nuvem2'), alt: '', style: 'left:40%' }), h('img', { src: mg('tp-nuvem'), alt: '', style: 'left:68%' }));
    const rules = h(
      'div',
      { class: 'cs-rules tp-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('tp-isopor'), alt: '' }), h('span', {}, 'O céu fechou! Ande com as ', h('kbd', {}, 'setas'), ' e passe por cima das coisas na areia pra juntar tudo: toalha, guarda-sol, cadeira, isopor, chapéu e chinelos.')),
      h('div', {}, h('img', { src: mg('tp-raio'), alt: '' }), h('span', {}, 'Onde aparecer um ', h('u', {}, 'círculo amarelo'), ', vai cair um raio: saia de perto! Cada raio que pega tira 1 ♥ (são 3).')),
      h('div', {}, h('img', { src: mg('tp-casal'), alt: '' }), h('span', {}, `Juntou tudo? Corra pro QUIOSQUE (lá em cima, à direita). Vocês têm ${TIME} segundos.`)),
    );
    ui.stage.append(h('div', { class: 'tp-bg', style: bg ? `background-image:url(${bg})` : '' }), kiosk, field, me, dark, clouds, rain, flash, rules);

    let px = 6;
    let py = 70;
    let time = TIME;
    let lives = 3;
    let stun = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    let boltIn = 2.2;
    const got = new Set<string>();
    // espalhadas pela areia toda (uma em cada canto de uma grade 3x2), longe do quiosque
    const slots = [[14, 52], [44, 48], [64, 60], [18, 84], [48, 82], [80, 86]].sort(() => Math.random() - 0.5);
    const items = STUFF.map((s, i) => {
      const x = slots[i][0] + Math.random() * 8 - 4;
      const y = slots[i][1] + Math.random() * 6 - 3;
      const el = h('img', { class: 'tp-item', src: mg(`tp-${s.id}`), alt: s.name, style: `left:${x}%;top:${y}%` });
      field.append(el);
      return { ...s, el, x, y };
    });
    const bolts: { el: HTMLElement; x: number; y: number; t: number; hit: boolean }[] = [];
    const keys = heldKeys();
    let ratio = 1.8;

    const hud = () =>
      ui.hud.replaceChildren(
        h('span', {}, `Tempo: ${Math.max(0, Math.ceil(time))}s`),
        h('span', {}, `Juntou: ${got.size}/${STUFF.length}`),
        h('span', { class: 'nv-lives' }, ...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥'))),
      );
    const near = (x: number, y: number, r: number) => Math.hypot(x - px, (y - py) / ratio) < r;
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      const b = ui.stage.getBoundingClientRect();
      if (b.height) ratio = b.width / b.height;
      if (running) {
        time -= dt;
        const dx = (keys.k.r ? 1 : 0) - (keys.k.l ? 1 : 0);
        const dy = (keys.k.d ? 1 : 0) - (keys.k.u ? 1 : 0);
        const sp = stun > 0 ? 7 : 19;
        const len = Math.hypot(dx, dy) || 1;
        px = Math.max(4, Math.min(96, px + (dx / len) * sp * dt));
        py = Math.max(36, Math.min(94, py + (dy / len) * sp * ratio * dt));
        if (stun > 0) stun -= dt;
        bella.step(dx, dy, dt);
        me.style.left = `${px}%`;
        me.style.top = `${py}%`;
        me.classList.toggle('stun', stun > 0);
        // juntar as coisas
        for (const it of items) {
          if (got.has(it.id) || !near(it.x, it.y, 3.6)) continue;
          got.add(it.id);
          it.el.classList.add('got');
          AudioSystem.play('pickup');
          ui.say('weng', got.size === STUFF.length ? 'Pegou tudo! AGORA CORRE PRO QUIOSQUE!' : `Pegou ${it.name}! Falta ${STUFF.length - got.size}!`);
          hud();
        }
        kiosk.classList.toggle('on', got.size === STUFF.length);
        // raios: aviso (círculo) e depois o raio
        boltIn -= dt;
        if (boltIn <= 0) {
          const bx = Math.max(6, Math.min(94, px + (Math.random() * 2 - 1) * 22));
          const by = Math.max(40, Math.min(92, py + (Math.random() * 2 - 1) * 26));
          const el = h('div', { class: 'tp-warn', style: `left:${bx}%;top:${by}%` });
          field.append(el);
          bolts.push({ el, x: bx, y: by, t: 0, hit: false });
          boltIn = Math.max(0.7, 1.7 - (TIME - time) * 0.025) + Math.random() * 0.5;
        }
        for (let i = bolts.length - 1; i >= 0; i--) {
          const bo = bolts[i];
          bo.t += dt;
          if (!bo.hit && bo.t > 1.0) {
            bo.hit = true;
            bo.el.classList.add('strike');
            bo.el.append(h('img', { class: 'tp-bolt', src: mg('tp-raio'), alt: '' }), h('img', { class: 'tp-boom', src: mg('tp-flash'), alt: '' }));
            flash.classList.remove('on');
            void flash.offsetWidth;
            flash.classList.add('on');
            AudioSystem.play('cancel');
            if (near(bo.x, bo.y, 7) && stun <= 0) {
              lives--;
              stun = 1.1;
              ui.shake();
              ui.say('bella', lives > 0 ? 'AAAH! Esse foi perto! Meu cabelo tá em pé!' : 'Chega! A gente tá ensopado!');
              hud();
              if (lives <= 0) return finish(false);
            }
          }
          if (bo.t > 1.6) {
            bo.el.remove();
            bolts.splice(i, 1);
          }
        }
        if (got.size === STUFF.length && px > 70 && py < 52) return finish(true);
        if (time <= 0) return finish(false);
        hud();
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = (won: boolean) => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      keys.off();
      window.removeEventListener('keydown', onKey);
      const stars = !won ? 1 : lives === 3 ? 3 : lives === 2 ? 2 : 1;
      ui.stage.append(h('img', { class: 'tp-end', src: mg('tp-casal'), alt: '' }));
      ui.say(won ? 'bella' : 'weng', won ? 'CONSEGUIMOS! Tudo seco... quer dizer, a gente tá ensopado, mas o isopor tá salvo!' : 'Deixamos um chinelo pra trás... mas a gente chegou rindo. Isso vale mais.');
      ui.end(stars, 'Se abrigar no quiosque', () => resolve({ stars, mistakes: 3 - lives, lives }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if ((e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') && !running && !done) {
        e.preventDefault();
        start();
      }
    };
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren();
      ui.say('weng', 'Pega tudo e corre! E desvia dos raios!');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Correr!');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    bella.step(0, 0, 0);
    hud();
    ui.say('bella', 'Weng... aquilo é uma tempestade? Vindo direto pra cá?');
    raf = requestAnimationFrame(tick);
  });
}
