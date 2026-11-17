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
      if (sbPts.textContent !== p) (sbPts.textContent = p), bump(sbPts);
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
    const TIME = 45;
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
        const sp = stun > 0 ? 8 : 20;
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
          const extra = Math.random() < 0.35 + k * 0.012 ? (Math.random() < 0.4 ? 2 : 1) : 0;
          for (let e = 0; e < extra; e++) {
            const ex = 6 + Math.random() * 88;
            spawnStrike(ex, 42 + Math.random() * (sandMaxY(ex) - 46));
          }
          boltIn = Math.max(0.45, 1.05 - k * 0.014) + Math.random() * 0.35;
        }
        for (let i = strikes.length - 1; i >= 0; i--) {
          const s = strikes[i];
          s.t += dt;
          s.el.style.setProperty('--k', String(Math.min(1, s.t / 1.1)));
          if (!s.hit && s.t > 1.1) {
            s.hit = true;
            s.el.classList.add('strike');
            const bolt = h('div', { class: 'tp-bolt', html: boltSVG(s.x, s.y) });
            bolts.append(bolt);
            setTimeout(() => bolt.remove(), 380);
            flash.classList.remove('on');
            void flash.offsetWidth;
            flash.classList.add('on');
            AudioSystem.play('cancel');
            if (near(s.x, s.y, 6.5) && stun <= 0) {
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
 * A Bella (esquerda) e o Weng (direita) batem a bolinha. Quando a bolinha chega na Bella, aperte
 * Espaço / E na hora certa: o anel em volta da raquete fica verde. Cedo ou tarde demais, a bolinha
 * cai na areia (perde 1 ♥, são 3). Cada rebatida a bolinha vem mais rápida. Meta: 15 seguidas.
 */
export function playFrescobolGame(parent: HTMLElement): Promise<MiniResult & { best: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'fr', 'Frescobol');
    const bg = textureURL('map-ro-praia-bg');
    const GOAL = 15;
    const bellaEl = h('img', { class: 'fr-p fr-bella', src: mg('fr-b0'), alt: '' }) as HTMLImageElement;
    const wengEl = h('img', { class: 'fr-p fr-weng', src: mg('fr-w0'), alt: '' }) as HTMLImageElement;
    const ball = h('img', { class: 'fr-ball', src: mg('fr-bola'), alt: '' });
    const trailEl = h('img', { class: 'fr-trail', src: mg('fr-rastro'), alt: '' });
    const ring = h('div', { class: 'fr-ring' });
    const count = h('div', { class: 'fr-count' });
    const rules = h(
      'div',
      { class: 'cs-rules fr-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('fr-b1'), alt: '' }), h('span', {}, 'Quando a bolinha chegar na Bella, aperte ', h('kbd', {}, 'Espaço'), ' ou ', h('kbd', {}, 'E'), ' pra rebater.')),
      h('div', {}, h('img', { src: mg('fr-bola'), alt: '' }), h('span', {}, 'Bata quando o anel em volta da raquete ficar ', h('u', { class: 'g' }, 'verde'), '. Cedo ou tarde demais, a bolinha cai.')),
      h('div', {}, h('img', { src: mg('fr-areia'), alt: '' }), h('span', {}, `Cada vez ela vem mais rápida. Deixou cair: perde 1 ♥ (são 3). Meta: ${GOAL} rebatidas seguidas!`)),
    );
    ui.stage.append(h('div', { class: 'fr-bg', style: bg ? `background-image:url(${bg})` : '' }), ring, bellaEl, wengEl, trailEl, ball, count, rules);

    const BX = 22;
    const WX = 78;
    const HIT_Y = 50;
    let lives = 3;
    let rally = 0;
    let best = 0;
    let dir = 1; // 1: indo pro Weng, -1: vindo pra Bella
    let t = 0; // 0..1 ao longo do voo
    let dur = 1.35;
    let arc = 22;
    let running = false;
    let done = false;
    let wait = 0;
    let swung = false;
    let last = 0;
    let raf = 0;

    const hud = () =>
      ui.hud.replaceChildren(
        h('span', {}, `Seguidas: ${rally}`),
        h('span', {}, `Recorde: ${best}`),
        h('span', { class: 'nv-lives' }, ...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥'))),
      );
    const pose = (el: HTMLImageElement, who: 'b' | 'w', f: number) => (el.src = mg(`fr-${who}${f}`));
    const posAt = (tt: number) => {
      const from = dir > 0 ? BX + 6 : WX - 6;
      const to = dir > 0 ? WX - 6 : BX + 6;
      const x = from + (to - from) * tt;
      const y = HIT_Y - Math.sin(Math.PI * tt) * arc;
      return { x, y };
    };
    const place = () => {
      const { x, y } = posAt(t);
      ball.style.left = `${x}%`;
      ball.style.top = `${y}%`;
      trailEl.style.left = `${x}%`;
      trailEl.style.top = `${y}%`;
      trailEl.style.transform = `translate(${dir > 0 ? '-100%' : '0'}, -50%) scaleX(${dir > 0 ? 1 : -1})`;
      // anel: aparece quando a bolinha vem pra Bella; verde na janela boa
      if (dir < 0 && running) {
        const good = t > 0.8 && t < 1.0;
        ring.classList.toggle('on', t > 0.55);
        ring.classList.toggle('good', good);
        ring.style.setProperty('--k', String(Math.max(0, 1 - (t - 0.55) / 0.42)));
      } else ring.classList.remove('on', 'good');
    };
    const serve = () => {
      dir = -1;
      t = 0;
      swung = false;
      arc = 18 + Math.random() * 10;
      pose(wengEl, 'w', 1);
      setTimeout(() => pose(wengEl, 'w', 0), 260);
    };
    const miss = (line: string) => {
      lives--;
      rally = 0;
      AudioSystem.play('cancel');
      ui.shake();
      const { x } = posAt(1);
      const sp = h('img', { class: 'fr-splash', src: mg('fr-areia'), alt: '', style: `left:${x}%` });
      ui.stage.append(sp);
      setTimeout(() => sp.remove(), 900);
      ball.classList.add('off');
      trailEl.classList.add('off');
      ui.say('weng', line);
      hud();
      if (lives <= 0) return finish();
      wait = 1.2;
    };
    const swing = () => {
      if (!running || swung) return;
      swung = true;
      pose(bellaEl, 'b', 1);
      setTimeout(() => pose(bellaEl, 'b', 2), 160);
      setTimeout(() => pose(bellaEl, 'b', 0), 420);
      if (dir < 0 && t > 0.8 && t < 1.0) {
        // rebateu!
        rally++;
        best = Math.max(best, rally);
        AudioSystem.play('pickup');
        count.textContent = String(rally);
        count.classList.remove('pop');
        void count.offsetWidth;
        count.classList.add('pop');
        if (rally === 5) ui.say('bella', 'Cinco! Tá pegando o ritmo, hein!');
        if (rally === 10) ui.say('weng', 'DEZ! A praia inteira tá olhando!');
        hud();
        if (rally >= GOAL) return finish();
        dir = 1;
        t = 0;
        dur = Math.max(0.75, 1.35 - rally * 0.045);
        arc = 16 + Math.random() * 12;
      } else if (dir < 0) {
        swung = true;
      }
    };
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (running) {
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) {
            ball.classList.remove('off');
            trailEl.classList.remove('off');
            serve();
          }
        } else {
          t += dt / dur;
          if (dir > 0 && t >= 1) {
            // o Weng sempre devolve (e às vezes faz graça)
            pose(wengEl, 'w', 1);
            setTimeout(() => pose(wengEl, 'w', 2), 160);
            setTimeout(() => pose(wengEl, 'w', 0), 420);
            AudioSystem.play('blip');
            dir = -1;
            t = 0;
            swung = false;
            arc = 16 + Math.random() * 14;
          } else if (dir < 0 && t >= 1.06) {
            miss(swung ? 'Bateu cedo demais! Espera ela chegar.' : ['Ih, passou!', 'Cadê a raquete, amor?', 'A bolinha fugiu!'][Math.floor(Math.random() * 3)]);
          } else if (dir < 0 && swung && t < 0.84 && !ball.classList.contains('early')) {
            // bateu cedo: a bolinha passa direto
            ball.classList.add('early');
          }
        }
        if (dir < 0 && t < 0.05) ball.classList.remove('early');
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
      ring.classList.remove('on', 'good');
      const stars = best >= GOAL ? 3 : best >= 8 ? 2 : 1;
      ui.say(stars === 3 ? 'bella' : 'weng', stars === 3 ? `${best} seguidas! A gente é a dupla de frescobol mais linda dessa praia.` : `Recorde: ${best}. E a bolinha acertou a cabeça de um senhor dormindo... DESCULPA, SENHOR!`);
      ui.end(stars, 'Correr pro mar', () => resolve({ stars, mistakes: 3 - lives, best }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      e.preventDefault();
      if (!running && !done) start();
      else swing();
    };
    const hitBtn = h('button', { class: 'btn primary ce-serve' }, 'Rebater');
    hitBtn.addEventListener('click', swing);
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren(hitBtn);
      ui.say('weng', 'Lá vai! Devagarinho primeiro.');
      serve();
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Bora jogar');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    hud();
    place();
    ui.say('bella', 'Frescobol! Valendo: quem deixar cair paga o açaí.');
    raf = requestAnimationFrame(tick);
  });
}
