import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';
import { shell, type MiniResult } from './PetroGames';

/**
 * Minigame — Foto dos fogos (virada de 2024, na varanda da cobertura, de frente pra Lagoa de Araruama).
 *
 * Contagem regressiva 10 → 0 e os fogos começam. Mova a câmera do celular com ← → (ou o mouse)
 * até debaixo do foguete e aperte Espaço / E / FOTO na hora em que ele ESTOURA. Foto fora de hora
 * ou sem fogo nenhum no quadro = perde 1 ♥ (são 3). O último é um coração.
 * Pensado pra controle: direcional + 1 botão.
 */
const BURSTS = ['ouro', 'rosa', 'azul', 'verde', 'roxo', 'ouro', 'rosa', 'azul', 'verde', 'roxo'];
const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;

type Rocket = { el: HTMLElement; x: number; y: number; top: number; kind: string; t: number; phase: 'up' | 'boom' | 'gone'; shot: boolean };

export function playFogosGame(parent: HTMLElement): Promise<MiniResult & { photos: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'fg', 'Foto dos fogos');
    const lagoa = textureURL('map-ar-varanda-bg');
    const sky = h('div', { class: 'fg-sky' });
    const cam = h('div', { class: 'fg-cam' }, h('i', { class: 'tl' }), h('i', { class: 'tr' }), h('i', { class: 'bl' }), h('i', { class: 'br' }), h('b'));
    const count = h('div', { class: 'fg-count off' });
    const strip = h('div', { class: 'fg-strip' });
    const rules = h(
      'div',
      { class: 'cs-rules fg-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('fg-foguete'), alt: '' }), h('span', {}, 'Mova a câmera do celular com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' (ou o mouse) até debaixo do foguete que está subindo.')),
      h('div', {}, h('img', { src: mg('fg-ouro'), alt: '' }), h('span', {}, 'Aperte ', h('kbd', {}, 'Espaço'), ' ou ', h('kbd', {}, 'E'), ' na hora em que ele ESTOURA dentro do quadro.')),
      h('div', {}, h('img', { src: mg('fg-coracao'), alt: '' }), h('span', {}, 'Foto fora de hora ou sem fogo no quadro ', h('u', {}, 'perde 1 ♥'), ' (são 3). Fique esperta no último!')),
    );
    ui.stage.append(
      h('div', { class: 'fg-bg', style: lagoa ? `background-image:url(${lagoa})` : '' }),
      sky,
      h('img', { class: 'fg-casal', src: mg('fg-casal'), alt: '' }),
      cam,
      count,
      strip,
      rules,
    );

    let camX = 50;
    let hold = 0;
    let lives = 3;
    let mistakes = 0;
    let photos = 0;
    let launched = 0;
    let spawnIn = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    const total = BURSTS.length + 1; // + o coração
    const rockets: Rocket[] = [];

    const hud = () =>
      ui.hud.replaceChildren(
        h('span', {}, `Fotos: ${photos}/${total}`),
        h('span', { class: 'nv-lives' }, ...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥'))),
      );
    const placeCam = () => (cam.style.left = `${camX}%`);
    placeCam();

    const launch = () => {
      const heart = launched === BURSTS.length;
      const kind = heart ? 'coracao' : BURSTS[launched];
      launched++;
      const x = heart ? 50 : 12 + Math.random() * 76;
      const el = h('img', { class: 'fg-rocket', src: mg('fg-foguete'), alt: '', style: `left:${x}%;top:78%` });
      sky.append(el);
      AudioSystem.play('blip');
      rockets.push({ el, x, y: 78, top: heart ? 22 : 14 + Math.random() * 22, kind, t: 0, phase: 'up', shot: false });
    };
    const boom = (r: Rocket) => {
      r.phase = 'boom';
      r.t = 0;
      (r.el as HTMLImageElement).src = mg(`fg-${r.kind}`);
      r.el.className = `fg-burst${r.kind === 'coracao' ? ' heart' : ''}`;
      AudioSystem.play('confirm');
    };
    // janela boa: do estouro até ~0.75 s depois
    const shootable = (r: Rocket) => r.phase === 'boom' && r.t > 0.05 && r.t < 0.75 && !r.shot;
    const shoot = () => {
      if (!running) return;
      cam.classList.remove('flash');
      void cam.offsetWidth;
      cam.classList.add('flash');
      const hit = rockets.find((r) => shootable(r) && Math.abs(r.x - camX) < 11);
      if (hit) {
        hit.shot = true;
        photos++;
        AudioSystem.play('pickup');
        strip.append(h('img', { src: mg(`fg-${hit.kind}`), alt: '' }));
        hud();
        if (hit.kind === 'coracao') ui.say('bella', 'UM CORAÇÃO! Weng, o céu tá apaixonado também!');
        else if (photos === 3) ui.say('bella', 'Essa ficou linda! Olha o reflexo na lagoa!');
        return;
      }
      lives--;
      mistakes++;
      AudioSystem.play('cancel');
      ui.shake();
      const early = rockets.some((r) => r.phase === 'up' && Math.abs(r.x - camX) < 11);
      ui.say('weng', early ? 'Calma! Ele ainda tá subindo. Espera estourar!' : 'Saiu só o céu escuro na foto. Mira no foguete!');
      hud();
      if (lives <= 0) finish();
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (hold) {
        camX = Math.max(8, Math.min(92, camX + hold * 70 * dt));
        placeCam();
      }
      if (running) {
        spawnIn -= dt;
        if (spawnIn <= 0 && launched < total) {
          launch();
          // fica mais rápido; no meio, às vezes sobem dois juntos
          spawnIn = Math.max(0.9, 1.9 - launched * 0.1) + Math.random() * 0.5;
          if (launched >= 5 && launched < BURSTS.length && Math.random() < 0.35) launch();
          if (launched === BURSTS.length) spawnIn = 2.4; // respiro antes do coração
        }
        for (const r of rockets) {
          if (r.phase === 'gone') continue;
          r.t += dt;
          if (r.phase === 'up') {
            const dur = r.kind === 'coracao' ? 1.8 : 1.15;
            r.y = 78 - (78 - r.top) * Math.min(1, r.t / dur);
            r.el.style.top = `${r.y}%`;
            if (r.t >= dur) boom(r);
          } else {
            const s = Math.min(1, 0.25 + r.t * 3.5);
            r.el.style.transform = `translate(-50%, -50%) scale(${s})`;
            r.el.style.opacity = String(r.t < 0.9 ? 1 : Math.max(0, 1 - (r.t - 0.9) / 0.5));
            if (r.t > 1.4) {
              r.phase = 'gone';
              r.el.remove();
            }
          }
        }
        if (launched >= total && rockets.every((r) => r.phase === 'gone')) finish();
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      const stars = lives <= 0 ? 1 : photos >= 9 ? 3 : photos >= 6 ? 2 : 1;
      ui.say('bella', lives <= 0 ? 'Saiu tudo tremido... mas a melhor parte dessa virada eu nem precisei fotografar.' : `${photos} fotos dos fogos! A galeria do celular agora é só 2024.`);
      ui.end(stars, 'Feliz ano-novo', () => resolve({ stars, mistakes, photos }));
    };
    const countdown = async () => {
      count.classList.remove('off');
      for (let n = 10; n >= 1; n--) {
        count.textContent = String(n);
        count.classList.remove('tick');
        void count.offsetWidth;
        count.classList.add('tick');
        AudioSystem.play('blip');
        if (n === 10) ui.say('weng', 'DEZ! A família inteira contando junto!');
        if (n === 3) ui.say('bella', 'TRÊS! DOIS! UM!');
        await new Promise((r) => setTimeout(r, 650));
      }
      count.textContent = 'FELIZ 2024!';
      count.classList.add('big');
      AudioSystem.play('quest');
      await new Promise((r) => setTimeout(r, 1300));
      count.classList.add('off');
      ui.say('weng', 'Pega o celular! Mira e tira foto na hora que estoura!');
      running = true;
      spawnIn = 0.4;
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || done) return;
      const l = e.code === 'ArrowLeft' || e.code === 'KeyA';
      const r = e.code === 'ArrowRight' || e.code === 'KeyD';
      const act = e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter';
      if (!l && !r && !act) return;
      e.preventDefault();
      if (l) hold = -1;
      else if (r) hold = 1;
      else if (!e.repeat) {
        if (rules.classList.contains('off')) shoot();
        else start();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && hold < 0) hold = 0;
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && hold > 0) hold = 0;
    };
    ui.stage.addEventListener('pointermove', (e) => {
      const b = ui.stage.getBoundingClientRect();
      camX = Math.max(8, Math.min(92, ((e.clientX - b.left) / b.width) * 100));
      placeCam();
    });
    ui.stage.addEventListener('pointerdown', () => rules.classList.contains('off') && shoot());
    const left = h('button', { class: 'btn pd-steer', 'aria-label': 'Esquerda' }, '◀');
    const fotoBtn = h('button', { class: 'btn primary ce-serve' }, 'FOTO');
    const right = h('button', { class: 'btn pd-steer', 'aria-label': 'Direita' }, '▶');
    for (const [b, d] of [[left, -1], [right, 1]] as const) {
      b.addEventListener('pointerdown', () => (hold = d));
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => hold === d && (hold = 0));
    }
    fotoBtn.addEventListener('click', shoot);
    const startBtn = h('button', { class: 'btn primary' }, 'Começar a contagem');
    const start = () => {
      if (rules.classList.contains('off') || done) return;
      rules.classList.add('off');
      ui.actions.replaceChildren(left, fotoBtn, right);
      void countdown();
    };
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    hud();
    ui.say('bella', 'Faltam dez segundos! Todo mundo na varanda!');
    raf = requestAnimationFrame(tick);
  });
}
