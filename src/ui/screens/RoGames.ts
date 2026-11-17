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
export function heldKeys() {
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
/**
 * Sol de rachar (v2). O casal anda pela areia com ← → (o Weng carrega a toalha).
 *  - Sombra de nuvem: a queimadura desce e o "Fresquinho" acumula pontos (mais tempo seguido = mais pontos).
 *  - O sol é bravo: de tempos em tempos ele mira uma faixa da areia (aviso piscando) e solta um RAIO DE SOL.
 *    Pegou? Queimadura sobe muito. Fique fora da faixa ou numa sombra.
 *  - Protetor: passe por cima do frasco pra pegar; Espaço / E pra passar (escudo por 6 s).
 *  - Picolé: de vez em quando passa um; pegar esfria na hora (+pontos).
 * Placar: tempo, barra de queimadura, protetores e pontos. 35 s.
 */
export function playSolGame(parent: HTMLElement): Promise<MiniResult & { burn: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'so', 'Sol de rachar');
    const bg = textureURL('map-ro-praia-bg');
    const TIME = 40;
    const sun = h('img', { class: 'so-sun', src: mg('so-sol'), alt: '' });
    const sky = h('div', { class: 'so-sky' });
    const ground = h('div', { class: 'so-ground' });
    const heat = h('div', { class: 'so-heat' });
    const bella = walker('bella-praia', 'b');
    const weng = walker('weng-praia', 'w');
    const shield = h('i', { class: 'so-shield' });
    const sweat = h('i', { class: 'so-sweat' });
    const pair = h('div', { class: 'so-pair' }, h('i', { class: 'so-towel' }), bella.el, weng.el, shield, sweat);
    const lotion = h('img', { class: 'so-lotion', src: mg('so-creme'), alt: '' });
    const rules = h(
      'div',
      { class: 'cs-rules so-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('so-nuvem'), alt: '' }), h('span', {}, 'O pai não pagou o guarda-sol! Ande com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' e fique na ', h('u', { class: 'g' }, 'sombra das nuvens'), ': a queimadura desce e vocês ganham pontos.')),
      h('div', {}, h('img', { src: mg('so-sol'), alt: '' }), h('span', {}, 'O sol tá bravo: quando uma faixa da areia ', h('u', {}, 'piscar'), ', ele vai soltar um raio de sol ali. Saia da faixa!')),
      h('div', {}, h('img', { src: mg('so-protetor'), alt: '' }), h('span', {}, 'Passe por cima do protetor pra pegar e aperte ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), ' pra passar (escudo). Picolé esfria na hora!')),
    );
    ui.stage.append(h('div', { class: 'so-bg', style: bg ? `background-image:url(${bg})` : '' }), ground, sky, sun, pair, lotion, heat, rules);

    // placar
    const sbTime = h('b', { class: 'so-sb-time' }, String(TIME));
    const sbBurn = h('i', {});
    const sbBurnTxt = h('span', {}, '0%');
    const sbBottles = h('b', { class: 'so-sb-n' }, '0');
    const sbPts = h('b', { class: 'so-sb-n' }, '0');
    ui.hud.replaceChildren(
      h(
        'div',
        { class: 'so-sb' },
        h('div', { class: 'so-sb-chip time' }, h('span', {}, 'Tempo'), sbTime),
        h('div', { class: 'so-sb-burn' }, h('span', { class: 'lbl' }, 'Queimadura'), h('div', { class: 'so-sb-bar' }, sbBurn), sbBurnTxt),
        h('div', { class: 'so-sb-chip' }, h('img', { src: mg('so-protetor'), alt: '' }), sbBottles),
        h('div', { class: 'so-sb-chip pts' }, h('span', {}, 'Pontos'), sbPts),
      ),
    );

    let x = 50;
    let burn = 0;
    let maxBurn = 0;
    let time = TIME;
    let bottles = 0;
    let protect = 0;
    let points = 0;
    let shadeRun = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    let spawnCloud = 0.3;
    let spawnBottle = 4;
    let spawnPop = 9;
    let beamIn = 5;
    let lastLine = 0;
    let wasShade = false;
    const clouds: { el: HTMLElement; sh: HTMLElement; x: number; v: number; w: number }[] = [];
    const items: { el: HTMLElement; x: number; kind: 'bottle' | 'pop'; v: number }[] = [];
    const beams: { el: HTMLElement; x: number; w: number; t: number; fired: boolean }[] = [];
    const keys = heldKeys();

    const bump = (el: HTMLElement) => {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    };
    const hud = () => {
      const t = Math.max(0, Math.ceil(time));
      if (sbTime.textContent !== String(t)) sbTime.textContent = String(t);
      sbTime.classList.toggle('hurry', running && t <= 8);
      sbBurn.style.width = `${burn}%`;
      sbBurn.className = burn > 75 ? 'hot' : burn > 45 ? 'warm' : '';
      sbBurnTxt.textContent = `${Math.round(burn)}%`;
      if (sbBottles.textContent !== String(bottles)) (sbBottles.textContent = String(bottles)), bump(sbBottles);
      const p = String(Math.floor(points));
      if (sbPts.textContent !== p) sbPts.textContent = p;
    };
    const pop = (px: number, text: string, kind = 'good') => {
      const el = h('b', { class: `so-pop ${kind}`, style: `left:${px}%` }, text);
      ui.stage.append(el);
      setTimeout(() => el.remove(), 1000);
    };
    const addCloud = () => {
      const w = 15 + Math.random() * 7;
      const el = h('img', { class: 'so-cloud', src: mg('so-nuvem'), alt: '', style: `width:${w}%` });
      const sh = h('i', { class: 'so-shadow', style: `width:${w * 0.9}%` });
      sky.append(el);
      ground.append(sh);
      const fromLeft = Math.random() < 0.5;
      clouds.push({ el, sh, x: fromLeft ? -w : 100 + w, v: (fromLeft ? 1 : -1) * (10 + Math.random() * 6 + (TIME - time) * 0.25), w });
    };
    const say = (who: string, t: string) => {
      if (performance.now() - lastLine < 2600) return;
      lastLine = performance.now();
      ui.say(who, t);
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        time -= dt;
        const dx = (keys.k.r ? 1 : 0) - (keys.k.l ? 1 : 0);
        x = Math.max(9, Math.min(91, x + dx * 40 * dt));
        bella.step(dx, 0, dt);
        weng.step(dx, 0, dt);
        pair.style.left = `${x}%`;
        // nuvens
        spawnCloud -= dt;
        if (spawnCloud <= 0) {
          addCloud();
          spawnCloud = 3.4 + Math.random() * 2.2 + (TIME - time) * 0.06;
        }
        let shade = false;
        for (let i = clouds.length - 1; i >= 0; i--) {
          const c = clouds[i];
          c.x += c.v * dt;
          c.el.style.left = `${c.x}%`;
          c.sh.style.left = `${c.x}%`;
          if (Math.abs(c.x - x) < c.w * 0.4) shade = true;
          if (c.x < -40 || c.x > 140) {
            c.el.remove();
            c.sh.remove();
            clouds.splice(i, 1);
          }
        }
        // protetor e picolé na areia
        spawnBottle -= dt;
        if (spawnBottle <= 0 && items.filter((i) => i.kind === 'bottle').length < 2) {
          const bx = 12 + Math.random() * 76;
          const el = h('img', { class: 'so-item bottle', src: mg('so-protetor'), alt: '', style: `left:${bx}%` });
          ui.stage.append(el);
          items.push({ el, x: bx, kind: 'bottle', v: 0 });
          spawnBottle = 7 + Math.random() * 4;
        }
        spawnPop -= dt;
        if (spawnPop <= 0) {
          const fromLeft = Math.random() < 0.5;
          const el = h('div', { class: 'so-item popsicle' }, h('i', {}));
          ui.stage.append(el);
          items.push({ el, x: fromLeft ? -4 : 104, kind: 'pop', v: fromLeft ? 16 : -16 });
          spawnPop = 8 + Math.random() * 4;
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          if (it.v) {
            it.x += it.v * dt;
            it.el.style.left = `${it.x}%`;
          }
          if (it.x < -8 || it.x > 108) {
            it.el.remove();
            items.splice(i, 1);
            continue;
          }
          if (Math.abs(it.x - x) < 5.5) {
            it.el.remove();
            items.splice(i, 1);
            AudioSystem.play('pickup');
            if (it.kind === 'bottle') {
              bottles++;
              pop(x, 'Protetor!');
              say('weng', 'Protetor! Aperta Espaço que eu passo nas suas costas.');
            } else {
              burn = Math.max(0, burn - 25);
              points += 15;
              pop(x, 'Picolé! +15');
              say('bella', 'PICOLÉ! Weng, divide comigo. Metade. Tá, um terço.');
            }
          }
        }
        // o sol mira uma faixa e solta o raio de sol
        beamIn -= dt;
        if (beamIn <= 0) {
          const w = 16 + Math.random() * 6;
          const bx = Math.max(w / 2 + 2, Math.min(98 - w / 2, x + (Math.random() * 2 - 1) * 14));
          const el = h('div', { class: 'so-beam', style: `left:${bx}%;width:${w}%` });
          ui.stage.append(el);
          beams.push({ el, x: bx, w, t: 0, fired: false });
          sun.classList.add('charge');
          beamIn = Math.max(1.2, 2.8 - (TIME - time) * 0.05) + Math.random() * 0.8;
        }
        for (let i = beams.length - 1; i >= 0; i--) {
          const b = beams[i];
          b.t += dt;
          if (!b.fired && b.t > 1.1) {
            b.fired = true;
            b.el.classList.add('fire');
            sun.classList.remove('charge');
            ui.shake();
            AudioSystem.play('cancel');
            if (Math.abs(b.x - x) < b.w / 2) {
              if (protect > 0) {
                pop(x, 'Escudo!', 'meh');
              } else {
                burn = Math.min(100, burn + 26);
                pop(x, 'AI! +26%', 'bad');
                say('bella', 'AAAI! O sol mirou na gente! Ele tá de MAL com a gente!');
              }
            } else pop(b.x, 'Errou!', 'meh');
          }
          if (b.t > 1.9) {
            b.el.remove();
            beams.splice(i, 1);
          }
        }
        if (protect > 0) protect -= dt;
        // sombra: esfria e soma pontos (quanto mais tempo seguido, mais)
        if (shade) {
          shadeRun += dt;
          points += dt * (4 + Math.min(8, shadeRun * 2));
          if (!wasShade) pop(x, 'Ahh, sombra!', 'cool');
        } else shadeRun = 0;
        wasShade = shade;
        const rate = shade ? -8 : protect > 0 ? 2 : 8 + (TIME - time) * 0.2;
        burn = Math.max(0, Math.min(100, burn + rate * dt));
        maxBurn = Math.max(maxBurn, burn);
        pair.classList.toggle('shade', shade);
        pair.classList.toggle('red', burn > 50);
        pair.classList.toggle('prot', protect > 0);
        sweat.classList.toggle('on', !shade && burn > 35);
        heat.style.opacity = String(Math.min(0.85, burn / 110));
        sun.classList.toggle('angry', !shade);
        if (!shade && burn > 65) say('bella', 'TÁ ARDENDO! Weng, acha uma sombra!');
        if (burn >= 100 || time <= 0) return finish();
        hud();
      }
      raf = requestAnimationFrame(tick);
    };
    const useLotion = () => {
      if (!running || bottles <= 0 || protect > 0) return;
      bottles--;
      protect = 4;
      burn = Math.max(0, burn - 10);
      points += 5;
      AudioSystem.play('confirm');
      lotion.style.left = `${x}%`;
      lotion.classList.remove('pop');
      void lotion.offsetWidth;
      lotion.classList.add('pop');
      ui.say('bella', 'Fator 50! Agora sim, pode vir, sol!');
      hud();
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      keys.off();
      window.removeEventListener('keydown', onKey);
      hud();
      const queimou = burn >= 100;
      const stars = queimou ? 1 : maxBurn < 70 && points >= 70 ? 3 : maxBurn < 90 ? 2 : 1;
      ui.stage.append(h('img', { class: 'so-end', src: mg('so-casal'), alt: '' }));
      ui.say('bella', queimou ? 'Virei camarão. Oficialmente. Weng, a gente precisa de um guarda-sol AGORA.' : `${Math.floor(points)} pontos de sombra... e mesmo assim meu ombro tá rosa. O seu nariz tá vermelho.`);
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
    pair.style.left = `${x}%`;
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

/** Raio desenhado (zigue-zague com galhos), do topo da pista até o ponto. Coordenadas em % da pista. */
function boltSVG(x: number, y: number): string {
  const pts: [number, number][] = [[x + (Math.random() * 10 - 5), -2]];
  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const k = i / steps;
    pts.push([x + (Math.random() * 2 - 1) * 5 * (1 - k * 0.6), -2 + (y + 2) * k]);
  }
  pts.push([x, y]);
  const main = pts.map((p) => p.join(',')).join(' ');
  const bi = 2 + Math.floor(Math.random() * 3);
  const [bx, by] = pts[bi];
  const branch = `${bx},${by} ${bx + (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 4)},${by + 6 + Math.random() * 6} ${bx + (Math.random() * 2 - 1) * 6},${by + 12 + Math.random() * 6}`;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="${main}" fill="none" stroke="#9ec8ff" stroke-width="2.6" stroke-linejoin="bevel" opacity=".55" vector-effect="non-scaling-stroke" style="stroke-width:9px"/>
    <polyline points="${branch}" fill="none" stroke="#cfe4ff" stroke-linejoin="bevel" vector-effect="non-scaling-stroke" style="stroke-width:2px"/>
    <polyline points="${main}" fill="none" stroke="#ffffff" stroke-linejoin="bevel" vector-effect="non-scaling-stroke" style="stroke-width:3.5px"/>
  </svg>`;
}

export function playTempestadeGame(parent: HTMLElement): Promise<MiniResult & { lives: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'tp', 'A tempestade');
    const bg = textureURL('map-ro-praia-bg');
    const TIME = 50;
    const field = h('div', { class: 'tp-field' });
    const dark = h('div', { class: 'tp-dark' });
    const rain = h('div', { class: 'tp-rain' });
    const rain2 = h('div', { class: 'tp-rain far' });
    const kiosk = h('div', { class: 'tp-kiosk' }, h('div', { class: 'tp-awning' }), h('b', {}, 'Quiosque'), h('span', { class: 'tp-runhere' }, 'CORRE PRA CÁ!'));
    const bella = walker('bella-praia', 'b');
    const me = h('div', { class: 'tp-me' }, h('i', { class: 'tp-meshadow' }), bella.el, h('i', { class: 'tp-zap' }));
    const flash = h('div', { class: 'tp-flash' });
    const bolts = h('div', { class: 'tp-bolts' });
    // nuvens: só na abertura, chegando dos dois lados e cobrindo o céu (depois sobem e somem)
    const clouds = h(
      'div',
      { class: 'tp-clouds' },
      h('img', { src: mg('tp-nuvem'), alt: '', class: 'c1' }),
      h('img', { src: mg('tp-nuvem2'), alt: '', class: 'c2' }),
      h('img', { src: mg('tp-nuvem'), alt: '', class: 'c3' }),
      h('img', { src: mg('tp-nuvem2'), alt: '', class: 'c4' }),
    );
    const banner = h('div', { class: 'tp-banner' }, 'Chuva torrencial!');
    const rules = h(
      'div',
      { class: 'cs-rules tp-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('tp-isopor'), alt: '' }), h('span', {}, 'O céu fechou! Ande com as ', h('kbd', {}, 'setas'), ' e passe por cima das 6 coisas na areia pra juntar tudo.')),
      h('div', {}, h('img', { src: mg('tp-raio'), alt: '' }), h('span', {}, 'Onde o chão ', h('u', {}, 'começar a faiscar'), ', vai cair um raio: saia de perto! Cada raio que pega tira 1 ♥ (são 3).')),
      h('div', {}, h('img', { src: mg('tp-casal'), alt: '' }), h('span', {}, `Juntou tudo? Corra pro QUIOSQUE (em cima, à direita). Vocês têm ${TIME} segundos.`)),
    );
    ui.stage.append(h('div', { class: 'tp-bg', style: bg ? `background-image:url(${bg})` : '' }), dark, kiosk, field, me, rain2, bolts, rain, clouds, banner, flash, rules);

    // a areia vai até a beira do mar (o mar sobe na diagonal à direita)
    const sandMaxY = (x: number) => (x < 28 ? 90 : 90 - (x - 28) * 0.42);
    let px = 8;
    let py = 66;
    let time = TIME;
    let lives = 3;
    let stun = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    let boltIn = 1.2;
    const got = new Set<string>();
    const slots = [[16, 54], [36, 66], [56, 50], [20, 82], [44, 78], [74, 58]].sort(() => Math.random() - 0.5);
    const items = STUFF.map((s, i) => {
      const x = slots[i][0] + Math.random() * 6 - 3;
      const y = Math.min(sandMaxY(x) - 4, slots[i][1] + Math.random() * 4 - 2);
      const el = h('div', { class: 'tp-item', style: `left:${x}%;top:${y}%` }, h('i', {}), h('img', { src: mg(`tp-${s.id}`), alt: s.name }));
      field.append(el);
      return { ...s, el, x, y };
    });
    const strikes: { el: HTMLElement; x: number; y: number; t: number; hit: boolean }[] = [];
    const keys = heldKeys();
    let ratio = 1.8;

    // placar: tempo, as 6 coisas (acendem quando pega) e as vidas
    const sbTime = h('b', { class: 'so-sb-time' }, String(TIME));
    const sbItems = h('div', { class: 'tp-sb-items' }, ...STUFF.map((s) => h('img', { src: mg(`tp-${s.id}`), alt: s.name, 'data-id': s.id })));
    const sbLives = h('div', { class: 'tp-sb-lives' });
    ui.hud.replaceChildren(h('div', { class: 'so-sb tp-sb' }, h('div', { class: 'so-sb-chip time' }, h('span', {}, 'Tempo'), sbTime), h('div', { class: 'so-sb-chip items' }, h('span', {}, 'Juntou'), sbItems), h('div', { class: 'so-sb-chip' }, sbLives)));
    const hud = () => {
      const t = Math.max(0, Math.ceil(time));
      if (sbTime.textContent !== String(t)) sbTime.textContent = String(t);
      sbTime.classList.toggle('hurry', running && t <= 10);
      sbItems.querySelectorAll('img').forEach((im) => im.classList.toggle('on', got.has(im.getAttribute('data-id') ?? '')));
      if (sbLives.childElementCount !== 3 || sbLives.getAttribute('data-l') !== String(lives)) {
        sbLives.setAttribute('data-l', String(lives));
        sbLives.replaceChildren(...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥')));
      }
    };
    const near = (x: number, y: number, r: number) => Math.hypot(x - px, (y - py) / ratio) < r;
    const spawnStrike = (bx: number, by: number) => {
      const el = h('div', { class: 'tp-warn', style: `left:${bx}%;top:${by}%` }, h('i', { class: 'r1' }), h('i', { class: 'r2' }), h('i', { class: 'sp' }));
      field.append(el);
      strikes.push({ el, x: bx, y: by, t: 0, hit: false });
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      const b = ui.stage.getBoundingClientRect();
      if (b.height) ratio = b.width / b.height;
      if (running) {
        time -= dt;
        const dx = (keys.k.r ? 1 : 0) - (keys.k.l ? 1 : 0);
        const dy = (keys.k.d ? 1 : 0) - (keys.k.u ? 1 : 0);
        const sp = stun > 0 ? 9 : 23;
        const len = Math.hypot(dx, dy) || 1;
        px = Math.max(4, Math.min(96, px + (dx / len) * sp * dt));
        py = Math.max(38, Math.min(sandMaxY(px), py + (dy / len) * sp * ratio * dt));
        if (stun > 0) stun -= dt;
        bella.step(dx, dy, dt);
        me.style.left = `${px}%`;
        me.style.top = `${py}%`;
        me.style.zIndex = String(3 + Math.round(py));
        me.classList.toggle('stun', stun > 0);
        // juntar as coisas
        for (const it of items) {
          if (got.has(it.id) || !near(it.x, it.y, 4)) continue;
          got.add(it.id);
          it.el.classList.add('got');
          AudioSystem.play('pickup');
          ui.say('weng', got.size === STUFF.length ? 'Pegou tudo! AGORA CORRE PRO QUIOSQUE!' : `Pegou ${it.name}! Falta ${STUFF.length - got.size}!`);
        }
        kiosk.classList.toggle('on', got.size === STUFF.length);
        // muitos raios: um perto de vocês e, às vezes, outros pela praia
        boltIn -= dt;
        if (boltIn <= 0) {
          const k = TIME - time;
          spawnStrike(Math.max(5, Math.min(95, px + (Math.random() * 2 - 1) * 14)), Math.max(42, Math.min(sandMaxY(px) - 2, py + (Math.random() * 2 - 1) * 16)));
          const extra = Math.random() < 0.22 + k * 0.008 ? 1 : 0;
          for (let e = 0; e < extra; e++) {
            const ex = 6 + Math.random() * 88;
            spawnStrike(ex, 42 + Math.random() * (sandMaxY(ex) - 46));
          }
          boltIn = Math.max(0.75, 1.4 - k * 0.012) + Math.random() * 0.4;
        }
        for (let i = strikes.length - 1; i >= 0; i--) {
          const s = strikes[i];
          s.t += dt;
          s.el.style.setProperty('--k', String(Math.min(1, s.t / 1.35)));
          if (!s.hit && s.t > 1.35) {
            s.hit = true;
            s.el.classList.add('strike');
            const bolt = h('div', { class: 'tp-bolt', html: boltSVG(s.x, s.y) });
            bolts.append(bolt);
            setTimeout(() => bolt.remove(), 380);
            flash.classList.remove('on');
            void flash.offsetWidth;
            flash.classList.add('on');
            AudioSystem.play('cancel');
            if (near(s.x, s.y, 5.5) && stun <= 0) {
              lives--;
              stun = 1.1;
              ui.shake();
              const pop = h('b', { class: 'tp-pop', style: `left:${px}%;top:${py - 14}%` }, '−1 ♥');
              ui.stage.append(pop);
              setTimeout(() => pop.remove(), 900);
              ui.say('bella', lives > 0 ? 'AAAH! Esse foi perto! Meu cabelo tá em pé!' : 'Chega! A gente tá ensopado!');
              hud();
              if (lives <= 0) return finish(false);
            }
          }
          if (s.t > 2.6) {
            s.el.remove();
            strikes.splice(i, 1);
          }
        }
        if (got.size === STUFF.length && px > 70 && py < 54) return finish(true);
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
      hud();
      const stars = !won ? 1 : lives === 3 ? 3 : lives === 2 ? 2 : 1;
      ui.stage.append(h('img', { class: 'tp-end', src: mg('tp-casal'), alt: '' }));
      ui.say(won ? 'bella' : 'weng', won ? 'CONSEGUIMOS! Tudo seco... quer dizer, a gente tá ensopado, mas o isopor tá salvo!' : 'Deixamos um chinelo pra trás... mas a gente chegou rindo. Isso vale mais.');
      ui.end(stars, 'Se abrigar no quiosque', () => resolve({ stars, mistakes: 3 - lives, lives }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if ((e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') && !started && !done) {
        e.preventDefault();
        start();
      }
    };
    let started = false;
    const start = async () => {
      if (started || done) return;
      started = true;
      rules.classList.add('off');
      ui.actions.replaceChildren();
      // abertura: as nuvens chegam, o céu escurece, um trovão... e a chuva cai
      ui.stage.classList.add('tp-intro');
      ui.say('bella', 'Weng... olha o céu. OLHA O CÉU.');
      await new Promise((r) => setTimeout(r, 1500));
      flash.classList.add('on');
      AudioSystem.play('cancel');
      ui.shake();
      ui.stage.classList.add('tp-storm');
      await new Promise((r) => setTimeout(r, 1300));
      ui.stage.classList.add('tp-go');
      running = true;
      ui.say('weng', 'Pega tudo e corre! E desvia dos raios!');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Correr!');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    bella.step(0, 0, 0);
    me.style.left = `${px}%`;
    me.style.top = `${py}%`;
    hud();
    ui.say('bella', 'Weng... aquilo é uma tempestade? Vindo direto pra cá?');
    raf = requestAnimationFrame(tick);
  });
}

// ====================================================================== Frescobol
/**
 * Frescobol (v2). A Bella (esquerda) e o Weng (direita) batem a bolinha.
 *  - ↑ ↓ : a Bella anda pra frente/pra trás na areia (3 posições). Vá pro círculo onde a bolinha vai cair.
 *  - Espaço / E : rebater. PERFEITO (anel verde fechadinho), BOM ou NO LIMITE.
 * O Weng varia: bola normal, ALTA (lenta, sobe muito), CORTADA (rápida e baixa) e com EFEITO (troca de lado no meio).
 * Seguidas aumentam o multiplicador (x2 com 5, x3 com 10, bola de fogo). Deixou cair: perde 1 ♥ (são 3).
 */
type Shot = 'normal' | 'alta' | 'cortada' | 'efeito';
export function playFrescobolGame(parent: HTMLElement): Promise<MiniResult & { best: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'fr', 'Frescobol');
    const bg = textureURL('map-ro-praia-bg');
    const GOAL = 15;
    const LANES = [-1, 0, 1]; // trás, meio, frente
    const bellaEl = h('img', { class: 'fr-p fr-bella', src: mg('fr-b0'), alt: '' }) as HTMLImageElement;
    const wengEl = h('img', { class: 'fr-p fr-weng', src: mg('fr-w0'), alt: '' }) as HTMLImageElement;
    const bellaShadow = h('i', { class: 'fr-pshadow b' });
    const wengShadow = h('i', { class: 'fr-pshadow w' });
    const ball = h('div', { class: 'fr-ball' }, h('img', { src: mg('fr-bola'), alt: '' }));
    const ballShadow = h('i', { class: 'fr-bshadow' });
    const target = h('div', { class: 'fr-target' }, h('i', { class: 'fr-ring' }));
    const lanesEl = h('div', { class: 'fr-lanes' }, ...LANES.map((l) => h('i', { 'data-l': String(l) })));
    const fx = h('div', { class: 'fr-fx' });
    const callout = h('div', { class: 'fr-callout' });
    const big = h('div', { class: 'fr-big' });
    const gull = h('div', { class: 'fr-gull' });
    const rules = h(
      'div',
      { class: 'cs-rules fr-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('fr-b1'), alt: '' }), h('span', {}, 'Ande com ', h('kbd', {}, '↑'), ' ', h('kbd', {}, '↓'), ' até o ', h('u', { class: 'g' }, 'círculo'), ' onde a bolinha vai cair e aperte ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), ' pra rebater.')),
      h('div', {}, h('img', { src: mg('fr-bola'), alt: '' }), h('span', {}, 'O anel fecha: bata quando ele ficar ', h('u', { class: 'g' }, 'verde'), ' = PERFEITO! O Weng manda bola alta, cortada e com efeito.')),
      h('div', {}, h('img', { src: mg('fr-areia'), alt: '' }), h('span', {}, `Seguidas dão multiplicador (x2, x3 e bola de fogo!). Deixou cair: perde 1 ♥ (são 3). Meta: ${GOAL} seguidas!`)),
    );
    ui.stage.append(h('div', { class: 'fr-bg', style: bg ? `background-image:url(${bg})` : '' }), lanesEl, bellaShadow, wengShadow, target, bellaEl, wengEl, ballShadow, ball, fx, callout, gull, big, rules);

    // geometria (% da pista)
    const BX = 18;
    const WX = 82;
    const laneY = (l: number) => 64 - l * 11; // onde a raquete pega a bola em cada posição
    const footY = (l: number) => 92 - l * 11;
    let bl = 0; // posição da Bella
    let wl = 0;
    let lives = 3;
    let rally = 0;
    let best = 0;
    let points = 0;
    let dir = 1;
    let t = 0;
    let dur = 1.4;
    let arc = 22;
    let shot: Shot = 'normal';
    let fromL = 0;
    let toL = 0;
    let switched = false;
    let fire = false;
    let running = false;
    let done = false;
    let wait = 0;
    let swung = false;
    let hitstop = 0;
    let last = 0;
    let raf = 0;

    // placar
    const sbRally = h('b', { class: 'so-sb-n' }, '0');
    const sbPts = h('b', { class: 'so-sb-n' }, '0');
    const sbMult = h('b', { class: 'fr-mult' }, 'x1');
    const sbLives = h('div', { class: 'tp-sb-lives' });
    ui.hud.replaceChildren(
      h(
        'div',
        { class: 'so-sb' },
        h('div', { class: 'so-sb-chip' }, h('span', {}, 'Seguidas'), sbRally, sbMult),
        h('div', { class: 'so-sb-chip' }, h('span', {}, 'Pontos'), sbPts),
        h('div', { class: 'so-sb-chip' }, h('span', {}, 'Recorde'), h('b', { class: 'so-sb-n rec' }, '0')),
        h('div', { class: 'so-sb-chip' }, sbLives),
      ),
    );
    const mult = () => (rally >= 10 ? 3 : rally >= 5 ? 2 : 1);
    const bump = (el: HTMLElement) => {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    };
    const hud = () => {
      if (sbRally.textContent !== String(rally)) (sbRally.textContent = String(rally)), bump(sbRally);
      if (sbPts.textContent !== String(points)) (sbPts.textContent = String(points)), bump(sbPts);
      sbMult.textContent = `x${mult()}`;
      sbMult.className = `fr-mult m${mult()}`;
      (ui.hud.querySelector('.rec') as HTMLElement).textContent = String(best);
      sbLives.replaceChildren(...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥')));
    };
    const pose = (el: HTMLImageElement, who: 'b' | 'w', f: number) => (el.src = mg(`fr-${who}${f}`));
    const swingAnim = (el: HTMLImageElement, who: 'b' | 'w') => {
      pose(el, who, 1);
      setTimeout(() => pose(el, who, 2), 140);
      setTimeout(() => pose(el, who, 0), 380);
    };
    const pop = (x: number, y: number, text: string, cls: string) => {
      const el = h('b', { class: `fr-pop ${cls}`, style: `left:${x}%;top:${y}%` }, text);
      fx.append(el);
      setTimeout(() => el.remove(), 900);
    };
    const burst = (x: number, y: number, n: number, cls = '') => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const el = h('i', { class: `fr-spark ${cls}`, style: `left:${x}%;top:${y}%;--dx:${Math.cos(a) * 40}px;--dy:${Math.sin(a) * 40}px` });
        fx.append(el);
        setTimeout(() => el.remove(), 600);
      }
    };
    const showBig = (text: string, cls = '') => {
      big.textContent = text;
      big.className = `fr-big ${cls}`;
      void big.offsetWidth;
      big.classList.add('on');
    };
    const placePlayers = () => {
      bellaEl.style.bottom = `${8 + bl * 11}%`;
      bellaShadow.style.top = `${footY(bl)}%`;
      wengEl.style.bottom = `${8 + wl * 11}%`;
      wengShadow.style.top = `${footY(wl)}%`;
      bellaEl.style.zIndex = String(10 - bl);
      lanesEl.querySelectorAll('i').forEach((i) => i.classList.toggle('on', Number(i.getAttribute('data-l')) === bl));
    };
    const posAt = (tt: number) => {
      const from = dir > 0 ? { x: BX + 7, y: laneY(fromL) } : { x: WX - 7, y: laneY(fromL) };
      const to = dir > 0 ? { x: WX - 7, y: laneY(toL) } : { x: BX + 7, y: laneY(toL) };
      return { x: from.x + (to.x - from.x) * tt, y: from.y + (to.y - from.y) * tt - Math.sin(Math.PI * tt) * arc, gy: from.y + (to.y - from.y) * tt + 22 };
    };
    const place = () => {
      const { x, y, gy } = posAt(Math.min(1.08, t));
      ball.style.left = `${x}%`;
      ball.style.top = `${y}%`;
      ballShadow.style.left = `${x}%`;
      ballShadow.style.top = `${gy}%`;
      ballShadow.style.setProperty('--h', String(Math.max(0.35, 1 - (gy - y) / 60)));
      ball.className = `fr-ball ${shot}${fire ? ' fire' : ''}${dir < 0 ? ' in' : ''}`;
      if (dir < 0 && running && wait <= 0) {
        target.style.left = `${BX + 7}%`;
        target.style.top = `${laneY(toL)}%`;
        target.classList.add('on');
        target.classList.toggle('match', bl === toL);
        const k = Math.max(0, Math.min(1, (t - 0.45) / 0.5));
        target.style.setProperty('--k', String(1 - k));
        target.classList.toggle('perfect', t > 0.86 && t < 1.0);
        target.classList.toggle('good', t >= 0.72 && t < 1.06);
      } else target.classList.remove('on', 'good', 'perfect');
    };
    const newShot = () => {
      dir = -1;
      t = 0;
      swung = false;
      switched = false;
      fromL = wl;
      const pool: Shot[] = rally < 3 ? ['normal'] : rally < 7 ? ['normal', 'normal', 'alta', 'cortada'] : ['normal', 'alta', 'cortada', 'efeito', 'efeito'];
      shot = pool[Math.floor(Math.random() * pool.length)];
      toL = LANES[Math.floor(Math.random() * 3)];
      const base = Math.max(0.95, 1.6 - rally * 0.035);
      dur = shot === 'alta' ? base * 1.45 : shot === 'cortada' ? base * 0.68 : base;
      arc = shot === 'alta' ? 40 : shot === 'cortada' ? 5 : 16 + Math.random() * 10;
      swingAnim(wengEl, 'w');
      AudioSystem.play('blip');
      const txt: Record<Shot, string> = { normal: '', alta: 'BOLA ALTA!', cortada: 'CORTADA!', efeito: 'COM EFEITO!' };
      if (txt[shot]) {
        callout.textContent = txt[shot];
        callout.className = `fr-callout on ${shot}`;
        setTimeout(() => callout.classList.remove('on'), 900);
      }
    };
    const miss = (line: string) => {
      lives--;
      rally = 0;
      fire = false;
      AudioSystem.play('cancel');
      ui.shake();
      const { x, gy } = posAt(1.05);
      const sp = h('img', { class: 'fr-splash', src: mg('fr-areia'), alt: '', style: `left:${x}%;top:${gy}%` });
      ui.stage.append(sp);
      setTimeout(() => sp.remove(), 900);
      ball.style.visibility = 'hidden';
      ballShadow.style.visibility = 'hidden';
      pop(x, gy - 10, 'Caiu!', 'bad');
      ui.say('weng', line);
      hud();
      if (lives <= 0) return finish();
      wait = 1.3;
      setTimeout(() => !done && showBig('Lá vem outra!', 'm1'), 450);
    };
    let swingCd = 0;
    const swing = () => {
      if (!running || swung || wait > 0 || swingCd > 0 || dir > 0) return;
      swingAnim(bellaEl, 'b');
      if (t < 0.72) {
        // cedo: só a raquetada no ar, dá pra tentar de novo
        swingCd = 0.18;
        pop(BX + 7, laneY(bl) - 8, 'Cedo!', 'meh');
        return;
      }
      swung = true;
      if (dir < 0 && t >= 0.72 && t < 1.08) {
        if (Math.abs(bl - toL) > 1) {
          pop(BX + 7, laneY(bl) - 8, 'Longe!', 'meh');
          swung = false;
          swingCd = 0.18;
          return;
        }
        const near = bl === toL;
        const grade = !near ? 1 : t > 0.86 && t < 1.0 ? 3 : t >= 0.78 && t < 1.05 ? 2 : 1;
        rally++;
        best = Math.max(best, rally);
        const gained = grade * mult() * (fire ? 2 : 1);
        points += gained;
        const { x, y } = posAt(t);
        if (grade === 3) {
          hitstop = 0.09;
          AudioSystem.play('quest');
          burst(x, y, 10, fire ? 'fire' : '');
          pop(x, y - 10, `PERFEITO! +${gained}`, 'perfect');
          ui.stage.classList.remove('fr-flash');
          void ui.stage.offsetWidth;
          ui.stage.classList.add('fr-flash');
        } else {
          AudioSystem.play('pickup');
          burst(x, y, 5);
          pop(x, y - 10, grade === 2 ? `Bom! +${gained}` : `No limite! +${gained}`, grade === 2 ? 'good' : 'meh');
        }
        if (rally === 5) showBig('x2!', 'm2');
        if (rally === 10) {
          showBig('BOLA DE FOGO!', 'm3');
          fire = true;
          ui.say('weng', 'DEZ! A praia inteira tá olhando! A bola tá pegando fogo!');
        } else if (rally === 5) ui.say('bella', 'Cinco! Tá pegando o ritmo, hein!');
        hud();
        if (rally >= GOAL) return finish();
        dir = 1;
        t = 0;
        fromL = bl;
        toL = LANES[Math.floor(Math.random() * 3)];
        dur = Math.max(0.85, 1.4 - rally * 0.03);
        arc = 14 + Math.random() * 14;
        shot = 'normal';
      }
    };
    let gullT = 6;
    const tick = (now: number) => {
      let dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (hitstop > 0) {
        hitstop -= dt;
        dt = 0;
      }
      if (running) {
        gullT -= dt;
        if (gullT <= 0) {
          gullT = 7 + Math.random() * 6;
          gull.classList.remove('fly');
          void gull.offsetWidth;
          gull.classList.add('fly');
        }
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) {
            ball.style.visibility = '';
            ballShadow.style.visibility = '';
            newShot();
          }
        } else {
          t += dt / dur;
          if (swingCd > 0) swingCd -= dt;
          // o Weng anda até onde a bola vai
          if (dir > 0) wl += (toL - wl) * Math.min(1, dt * 5);
          // efeito: no meio do caminho a bola muda de lado
          if (dir < 0 && shot === 'efeito' && !switched && t > 0.5) {
            switched = true;
            const opts = LANES.filter((l) => l !== toL);
            toL = opts[Math.floor(Math.random() * opts.length)];
            pop(posAt(t).x, posAt(t).y - 8, 'Curvou!', 'meh');
          }
          if (dir > 0 && t >= 1) {
            wl = toL;
            newShot();
          } else if (dir < 0 && t >= 1.1) {
            miss(swung ? (bl !== toL ? 'Você tava no lugar errado! Olha o círculo.' : 'Bateu cedo demais! Espera ela chegar.') : ['Ih, passou!', 'Cadê a raquete, amor?', 'A bolinha fugiu!'][Math.floor(Math.random() * 3)]);
          }
        }
        placePlayers();
        place();
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      target.classList.remove('on');
      hud();
      const stars = best >= GOAL ? 3 : best >= 8 ? 2 : 1;
      showBig(best >= GOAL ? `${best} SEGUIDAS!` : `Recorde: ${best}`, best >= GOAL ? 'm3' : 'm1');
      ui.say(stars === 3 ? 'bella' : 'weng', stars === 3 ? `${best} seguidas e ${points} pontos! A gente é a dupla de frescobol mais linda dessa praia.` : `Recorde: ${best}, ${points} pontos. E a bolinha acertou a cabeça de um senhor dormindo... DESCULPA, SENHOR!`);
      ui.end(stars, 'Correr pro mar', () => resolve({ stars, mistakes: 3 - lives, best }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame') return;
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && running) {
        e.preventDefault();
        if (!e.repeat) bl = Math.min(1, bl + 1);
        return;
      }
      if ((e.code === 'ArrowDown' || e.code === 'KeyS') && running) {
        e.preventDefault();
        if (!e.repeat) bl = Math.max(-1, bl - 1);
        return;
      }
      if (e.repeat || (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter')) return;
      e.preventDefault();
      if (!running && !done) start();
      else swing();
    };
    const hitBtn = h('button', { class: 'btn primary ce-serve' }, 'Rebater');
    hitBtn.addEventListener('click', swing);
    const stepBtn = (label: string, d: number) => {
      const b = h('button', { class: 'btn pd-steer' }, label);
      b.addEventListener('click', () => (bl = Math.max(-1, Math.min(1, bl + d))));
      return b;
    };
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren(stepBtn('▲', 1), hitBtn, stepBtn('▼', -1));
      ui.say('weng', 'Lá vai! Devagarinho primeiro.');
      newShot();
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Bora jogar');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    hud();
    placePlayers();
    place();
    ui.say('bella', 'Frescobol! Valendo: quem deixar cair paga o açaí.');
    raf = requestAnimationFrame(tick);
  });
}

// ====================================================================== Pular onda
/**
 * Pular onda: o casal de mãos dadas no mar; as ondas vêm da direita.
 *  - Onda azul: aperte Espaço / E pra PULAR quando ela chegar no marcador.
 *  - Onda GIGANTE (espuma vermelha): segure ↓ pra FURAR por baixo.
 * Acertou: pontos + combo. Errou: caixote (perde 1 ♥, são 3). 12 ondas, cada vez mais rápidas.
 */
/** Onda vista de lado, com a crista enrolando pra esquerda (vem da direita). */
const WAVE_SVG = `<svg viewBox="0 0 220 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="ow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe0f0"/><stop offset=".45" stop-color="#2fa0d8"/><stop offset="1" stop-color="#1a5aa8"/></linearGradient></defs>
  <path d="M0 140 L0 118 C28 116 46 100 62 74 C78 46 104 22 136 18 C160 15 178 26 182 44 C185 58 172 66 160 60 C150 55 154 44 146 42 C132 40 124 62 128 86 C132 108 170 120 220 122 L220 140 Z" fill="url(#ow)"/>
  <path d="M60 76 C78 46 104 22 136 18 C160 15 178 26 182 44 C185 58 172 66 160 60 C150 55 154 44 146 42 C124 36 104 50 92 66 C82 80 70 84 60 76 Z" fill="#ffffff" opacity=".92"/>
  <path d="M36 110 C52 104 60 96 66 86" stroke="#e8fbff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
  <circle cx="176" cy="30" r="5" fill="#fff"/><circle cx="188" cy="40" r="3.5" fill="#fff"/><circle cx="168" cy="20" r="3" fill="#fff"/>
</svg>`;

export function playOndaGame(parent: HTMLElement): Promise<MiniResult & { score: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'on', 'Pular onda');
    const bg = textureURL('map-ro-praia-bg');
    const TOTAL = 12;
    const bella = walker('bella-praia', 'b');
    const weng = walker('weng-praia', 'w');
    const pair = h('div', { class: 'on-pair' }, bella.el, weng.el, h('i', { class: 'on-hands' }, '♥'));
    const mark = h('div', { class: 'on-mark' });
    const sea = h('div', { class: 'on-sea' });
    const fx = h('div', { class: 'fr-fx' });
    const rules = h(
      'div',
      { class: 'cs-rules on-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('span', { class: 'on-ico blue' }), h('span', {}, 'Onda azul: aperte ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), ' pra ', h('u', { class: 'g' }, 'pular'), ' quando ela chegar na linha.')),
      h('div', {}, h('span', { class: 'on-ico red' }), h('span', {}, 'Onda GIGANTE (com o "!"): segure ', h('kbd', {}, '↓'), ' pra ', h('u', {}, 'furar por baixo'), '. Pular nela = caixote!')),
      h('div', {}, h('span', { class: 'on-ico' }, '♥'), h('span', {}, `${TOTAL} ondas, cada vez mais rápidas. Levou caixote: perde 1 ♥ (são 3).`)),
    );
    const sky = h('div', { class: 'on-sky' }, h('i', { class: 'on-sun' }), h('i', { class: 'on-cloud c1' }), h('i', { class: 'on-cloud c2' }));
    const far = h('div', { class: 'on-far' });
    const front = h('div', { class: 'on-front' });
    void bg;
    ui.stage.append(sky, far, sea, mark, pair, front, fx, rules);

    const PX = 26;
    let lives = 3;
    let score = 0;
    let combo = 0;
    let sent = 0;
    let passed = 0;
    let nextIn = 1.2;
    let jump = 0;
    let dive = false;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    const waves: { el: HTMLElement; x: number; big: boolean; v: number; judged: boolean }[] = [];

    const sbN = h('b', { class: 'so-sb-n' }, '0');
    const sbW = h('b', { class: 'so-sb-n' }, `0/${TOTAL}`);
    const sbL = h('div', { class: 'tp-sb-lives' });
    ui.hud.replaceChildren(h('div', { class: 'so-sb' }, h('div', { class: 'so-sb-chip' }, h('span', {}, 'Ondas'), sbW), h('div', { class: 'so-sb-chip' }, h('span', {}, 'Pontos'), sbN), h('div', { class: 'so-sb-chip' }, sbL)));
    const hud = () => {
      sbN.textContent = String(score);
      sbW.textContent = `${passed}/${TOTAL}`;
      sbL.replaceChildren(...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥')));
    };
    const pop = (text: string, cls: string) => {
      const el = h('b', { class: `fr-pop ${cls}`, style: `left:${PX}%;top:38%` }, text);
      fx.append(el);
      setTimeout(() => el.remove(), 900);
    };
    const keys = heldKeys();
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        dive = keys.k.d;
        if (jump > 0) jump -= dt;
        pair.classList.toggle('jump', jump > 0);
        pair.classList.toggle('dive', dive && jump <= 0);
        bella.step(0, 0, dt);
        weng.step(0, 0, dt);
        nextIn -= dt;
        if (nextIn <= 0 && sent < TOTAL) {
          sent++;
          const big = sent > 2 && Math.random() < 0.35;
          const el = h('div', { class: `on-wave${big ? ' big' : ''}`, html: WAVE_SVG }, big ? h('b', { class: 'on-warn' }, '!') : null);
          ui.stage.append(el);
          const v = 30 + sent * 2.2;
          waves.push({ el, x: 108, big, v, judged: false });
          nextIn = Math.max(1.1, 2.3 - sent * 0.09) + Math.random() * 0.6;
        }
        for (let i = waves.length - 1; i >= 0; i--) {
          const w = waves[i];
          w.x -= w.v * dt;
          w.el.style.left = `${w.x}%`;
          if (!w.judged && w.x <= PX + 2) {
            w.judged = true;
            passed++;
            const ok = w.big ? dive && jump <= 0 : jump > 0;
            if (ok) {
              combo++;
              const pts = 10 * Math.min(4, combo);
              score += pts;
              AudioSystem.play(combo >= 3 ? 'quest' : 'pickup');
              pop(w.big ? `FUROU! +${pts}` : `PULOU! +${pts}`, combo >= 3 ? 'perfect' : 'good');
              if (combo === 3) ui.say('bella', 'TRÊS SEGUIDAS! A gente é surfista agora!');
              w.el.classList.add('pass');
            } else {
              combo = 0;
              lives--;
              ui.shake();
              AudioSystem.play('cancel');
              pair.classList.add('hit');
              setTimeout(() => pair.classList.remove('hit'), 600);
              pop('CAIXOTE!', 'bad');
              ui.say(w.big ? 'weng' : 'bella', w.big ? 'Era pra furar! A gigante levou a gente rolando!' : 'Engoli água salgada. Muita.');
              if (lives <= 0) return finish();
            }
            hud();
          }
          if (w.x < -20) {
            w.el.remove();
            waves.splice(i, 1);
          }
        }
        if (passed >= TOTAL && !waves.some((w) => !w.judged)) return finish();
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      keys.off();
      window.removeEventListener('keydown', onKey);
      hud();
      const stars = lives === 3 ? 3 : lives >= 1 && passed >= TOTAL ? 2 : 1;
      ui.say(stars >= 2 ? 'bella' : 'weng', stars === 3 ? `${score} pontos sem nenhum caixote! Ninguém pula onda melhor que a gente.` : stars === 2 ? `${score} pontos! Uns caixotes, mas a gente não soltou a mão.` : 'A onda ganhou dessa vez... mas a gente saiu rindo.');
      ui.end(stars, 'Voltar pra areia', () => resolve({ stars, mistakes: 3 - lives, score }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      e.preventDefault();
      if (!running && !done) return start();
      if (running && jump <= 0) {
        jump = 0.55;
        AudioSystem.play('blip');
      }
    };
    const jumpBtn = h('button', { class: 'btn primary ce-serve' }, 'Pular');
    jumpBtn.addEventListener('click', () => running && jump <= 0 && (jump = 0.55));
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren(jumpBtn);
      ui.say('weng', 'Segura minha mão e não solta. Lá vem a primeira!');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Entrar no mar');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    bella.step(1, 0, 0);
    weng.step(1, 0, 0);
    hud();
    ui.say('bella', 'Bora pular onda! A água tá batendo na cintura.');
    raf = requestAnimationFrame(tick);
  });
}

// ====================================================================== Castelo de areia
/**
 * O balde de areia vai e vem em cima do castelo: aperte Espaço / E pra soltar a camada.
 * O que sair pra fora do andar de baixo cai (o castelo afina). Encaixe perfeito = o andar não afina e brilha.
 * São 8 andares antes da onda chegar (a barra da onda enche). Se o castelo ficar fino demais, desmorona.
 */
export function playCasteloGame(parent: HTMLElement): Promise<MiniResult & { floors: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'ca', 'Castelo de areia');
    const bg = textureURL('map-ro-praia-bg');
    const FLOORS = 8;
    const TIME = 30;
    const tower = h('div', { class: 'ca-tower' });
    const bucket = h('div', { class: 'ca-bucket' }, h('i', { class: 'ca-sand' }));
    const wave = h('div', { class: 'ca-wave' });
    const fx = h('div', { class: 'fr-fx' });
    const flag = h('div', { class: 'ca-flag' }, '♥');
    const rules = h(
      'div',
      { class: 'cs-rules ca-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('span', { class: 'ca-ico' }), h('span', {}, 'O balde vai e vem. Aperte ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), ' pra soltar a areia em cima do andar de baixo.')),
      h('div', {}, h('span', { class: 'ca-ico thin' }), h('span', {}, 'O que sobrar pra fora cai e o castelo afina. Encaixe ', h('u', { class: 'g' }, 'perfeito'), ' não perde nada!')),
      h('div', {}, h('span', { class: 'ca-ico wave' }), h('span', {}, `Faça ${FLOORS} andares antes da onda chegar (${TIME} s). Fino demais: desmorona!`)),
    );
    ui.stage.append(h('div', { class: 'ca-bg', style: bg ? `background-image:url(${bg})` : '' }), wave, tower, bucket, flag, fx, rules);

    // em % da largura da pista
    let left = 30;
    let width = 40;
    let bx = 0;
    let dir = 1;
    let speed = 34;
    let floors: { el: HTMLElement; l: number; w: number }[] = [];
    let time = TIME;
    let perfects = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    const sbF = h('b', { class: 'so-sb-n' }, `0/${FLOORS}`);
    const sbW = h('i', {});
    const sbP = h('b', { class: 'so-sb-n' }, '0');
    ui.hud.replaceChildren(h('div', { class: 'so-sb' }, h('div', { class: 'so-sb-chip' }, h('span', {}, 'Andares'), sbF), h('div', { class: 'so-sb-burn' }, h('span', { class: 'lbl' }, 'Onda'), h('div', { class: 'so-sb-bar' }, sbW)), h('div', { class: 'so-sb-chip' }, h('span', {}, 'Perfeitos'), sbP)));
    const H = 8.2; // altura de um andar (% da pista)
    const BASE = 86; // chão
    const hud = () => {
      sbF.textContent = `${floors.length}/${FLOORS}`;
      const k = 1 - Math.max(0, time) / TIME;
      sbW.style.width = `${k * 100}%`;
      sbW.className = k > 0.75 ? 'hot' : k > 0.45 ? 'warm' : '';
      sbP.textContent = String(perfects);
      wave.style.transform = `translateX(${(1 - k) * 100}%)`;
    };
    const addFloor = (l: number, w: number, perfect: boolean) => {
      const i = floors.length;
      const el = h('div', { class: 'ca-floor' + (perfect ? ' perfect' : '') + (i % 2 ? ' alt' : ''), style: `left:${l}%;width:${w}%;bottom:${100 - BASE + i * H}%;height:${H}%` }, h('i'));
      tower.append(el);
      floors.push({ el, l, w });
    };
    const pop = (x: number, y: number, text: string, cls: string) => {
      const el = h('b', { class: `fr-pop ${cls}`, style: `left:${x}%;top:${y}%` }, text);
      fx.append(el);
      setTimeout(() => el.remove(), 900);
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        time -= dt;
        bx += dir * speed * dt;
        if (bx + width > 96) (bx = 96 - width), (dir = -1);
        if (bx < 4) (bx = 4), (dir = 1);
        bucket.style.left = `${bx}%`;
        bucket.style.width = `${width}%`;
        bucket.style.bottom = `${100 - BASE + floors.length * H + H * 0.35}%`;
        if (time <= 0) return finish(false);
        hud();
      }
      raf = requestAnimationFrame(tick);
    };
    const drop = () => {
      if (!running) return;
      const prev = floors[floors.length - 1];
      const l0 = bx;
      const r0 = bx + width;
      const l = Math.max(l0, prev.l);
      const r = Math.min(r0, prev.l + prev.w);
      const w = r - l;
      const y = BASE - floors.length * H;
      if (w <= 3) {
        AudioSystem.play('cancel');
        ui.shake();
        pop(bx + width / 2, y - 8, 'Desmoronou!', 'bad');
        return finish(false);
      }
      const perfect = Math.abs(l0 - prev.l) < 1.6;
      if (perfect) {
        perfects++;
        addFloor(prev.l, prev.w, true);
        AudioSystem.play('quest');
        pop(prev.l + prev.w / 2, y - 8, 'PERFEITO!', 'perfect');
      } else {
        addFloor(l, w, false);
        AudioSystem.play('pickup');
        // a sobra cai
        const cutL = l0 < prev.l ? l0 : r;
        const cutW = width - w;
        const crumb = h('div', { class: 'ca-crumb', style: `left:${cutL}%;width:${cutW}%;bottom:${100 - BASE + (floors.length - 1) * H}%;height:${H}%` });
        tower.append(crumb);
        setTimeout(() => crumb.remove(), 700);
        width = w;
      }
      if (floors.length - 1 === 3) ui.say('weng', 'Tá ficando alto! Devagar com esse balde!');
      if (floors.length - 1 === 6) ui.say('bella', 'Mais um! A onda tá vindo, Weng!');
      speed = Math.min(70, speed + 4.5);
      hud();
      if (floors.length - 1 >= FLOORS) return finish(true);
    };
    const finish = (won: boolean) => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      bucket.style.display = 'none';
      hud();
      const built = floors.length - 1;
      if (won) {
        const top = floors[floors.length - 1];
        flag.style.left = `${top.l + top.w / 2}%`;
        flag.style.bottom = `${100 - BASE + floors.length * H}%`;
        flag.classList.add('on');
      } else {
        tower.classList.add('fall');
      }
      const stars = won ? (perfects >= 4 ? 3 : 2) : built >= 5 ? 2 : 1;
      ui.say(won ? 'bella' : 'weng', won ? `${built} andares${perfects ? `, ${perfects} perfeitos` : ''}! O castelo mais alto da praia de Rio das Ostras.` : `${built} andares... a areia escorregou. Mas a gente refaz!`);
      ui.end(stars, 'Enfeitar o castelo', () => resolve({ stars, mistakes: won ? 0 : 1, floors: built }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      e.preventDefault();
      if (!running && !done) return start();
      drop();
    };
    const dropBtn = h('button', { class: 'btn primary ce-serve' }, 'Soltar a areia');
    dropBtn.addEventListener('click', drop);
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren(dropBtn);
      ui.say('weng', 'Eu encho o balde, você solta. Trabalho em equipe!');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Encher o balde');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    addFloor(left, width, false);
    floors[0].el.classList.add('base');
    hud();
    ui.say('bella', 'Um castelo de areia de verdade. Alto. Com torre. E bandeira.');
    raf = requestAnimationFrame(tick);
  });
}
