import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Corrida de Uber até a hamburgueria.
 * O carro anda sozinho para a direita; o jogador troca de faixa (↑/↓, W/S, toque em cima/embaixo)
 * para desviar de poças, cones, buracos e outros carros. Cada batida freia o carro: quanto mais
 * batidas, mais demora para chegar. A barra mostra o caminho até a Rota 66.
 */
export interface UberResult {
  hits: number;
  seconds: number;
}

type Kind = 'cone' | 'poca' | 'buraco' | 'carro' | 'caixa' | 'barreira';
interface Obstacle {
  el: HTMLElement;
  lane: number;
  x: number; // 0..100 (% da pista)
  kind: Kind;
  hit: boolean;
}

const LANES = 3;
const HIT_LINES = [
  'Bella: "Ai! Moço, com calma!"',
  'Motorista: "Foi mal, foi mal!"',
  'Weng: "Tô começando a achar que a gente vai chegar amanhã."',
  'Bella: "Segura minha mão. Por segurança."',
  'Motorista: "Esse buraco tá aí desde 2009."',
  'Weng: "Pelo menos o hambúrguer não vai fugir."',
];
const CALM_LINES = [
  'Weng: "Olha a chuva no vidro. Até que é bonito."',
  'Bella: "Tá tocando a nossa música? ...A gente tem música?"',
  'Motorista: "Primeiro encontro, é? Dá pra ver."',
  'Weng: "Você tá nervosa? Eu tô um pouquinho."',
  'Bella: "Fragoso de noite é outra coisa."',
];

export function playUberGame(parent: HTMLElement, opts: { title?: string; destino?: string } = {}): Promise<UberResult> {
  return new Promise((resolve) => {
    const car = textureURL('uber-car');
    const asset = (f: string) => new URL(`assets/minigames/${f}`, document.baseURI).href;
    const roadImg = asset('uber-road.png');
    const traffic = asset('uber-traffic.png');
    // centro de cada faixa (% da altura da pista desenhada: 3 faixas de asfalto)
    const LANE_Y = [45.4, 63.0, 80.9];
    let lane = 1;
    let progress = 0; // 0..1
    let speedMul = 1;
    let slowUntil = 0;
    let hits = 0;
    let last = 0;
    let started = 0;
    let spawnIn = 900;
    let roadX = 0;
    let lineIn = 3500;
    let running = false;
    let done = false;
    let raf = 0;
    const obstacles: Obstacle[] = [];

    const road = h('div', { class: 'ub-road2', style: `background-image:url("${roadImg}")` });
    const player = h('div', { class: 'ub-car', style: car ? `background-image:url("${car}")` : '' });
    const track = h('div', { class: 'ub-track2' }, road, player, h('div', { class: 'ub-night' }));
    const bar = h('div', { class: 'ub-fill' });
    const pin = h('div', { class: 'ub-pin' }, '🍔');
    const hitsEl = h('div', { class: 'ub-hits' }, 'Batidas: 0');
    const msg = h('div', { class: 'ub-msg' }, '↑ ↓ para trocar de faixa. Desvie de tudo!');
    const startBtn = h('button', { class: 'btn primary' }, 'Partiu!');
    const actions = h('div', { class: 'bg-actions' }, startBtn);
    const up = h('button', { class: 'ub-arrow', 'aria-label': 'Faixa de cima' }, '▲');
    const down = h('button', { class: 'ub-arrow', 'aria-label': 'Faixa de baixo' }, '▼');
    const panel = h(
      'div',
      { class: 'bg-panel panel ub-panel' },
      h('div', { class: 'bg-title ub-title' }, opts.title ?? `A caminho da ${opts.destino ?? 'hamburgueria'}`),
      h(
        'div',
        { class: 'ub-stage' },
        h('div', { class: 'ub-rain' }),
        track,
        h('div', { class: 'ub-ctrl' }, up, down),
      ),
      h('div', { class: 'ub-hud' }, h('div', { class: 'ub-bar' }, bar, pin), hitsEl),
      msg,
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen ub-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const place = () => {
      player.style.top = `${LANE_Y[lane]}%`;
    };
    const move = (d: number) => {
      if (!running) return;
      const n = Math.max(0, Math.min(LANES - 1, lane + d));
      if (n !== lane) {
        lane = n;
        AudioSystem.play('blip');
        place();
      }
    };
    place();

    const spawn = () => {
      const kinds: Kind[] = ['cone', 'poca', 'buraco', 'carro', 'carro', 'carro', 'poca', 'caixa', 'barreira'];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const free = [0, 1, 2].filter((l) => !obstacles.some((o) => o.lane === l && o.x > 74));
      // nunca fecha as 3 faixas ao mesmo tempo
      const busy = [0, 1, 2].filter((l) => obstacles.some((o) => o.lane === l && o.x > 60 && o.x < 112));
      if (!free.length || busy.length >= 2) return;
      const l = free[Math.floor(Math.random() * free.length)];
      const el = h('div', { class: `ub-ob ${kind === 'carro' ? 'carro2' : 'sprite'}` });
      if (kind === 'carro') {
        el.style.backgroundImage = `url("${traffic}")`;
        el.style.backgroundPositionX = `${(Math.floor(Math.random() * 7) / 6) * 100}%`;
      } else {
        el.style.backgroundImage = `url("${asset(`uber-${kind}.png`)}")`;
        el.classList.add(kind);
      }
      el.style.top = `${LANE_Y[l]}%`;
      track.append(el);
      obstacles.push({ el, lane: l, x: 110, kind, hit: false });
    };

    const tick = (t: number) => {
      if (!running) return;
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const slowed = t < slowUntil;
      speedMul += ((slowed ? 0.35 : 1) - speedMul) * 0.08;
      // ~36 s sem batidas
      progress = Math.min(1, progress + (dt / 36) * speedMul);
      bar.style.width = `${progress * 100}%`;
      pin.style.left = `${progress * 100}%`;
      roadX += dt * (220 + progress * 120) * speedMul;
      road.style.backgroundPositionX = `${-roadX}px`;
      const v = (46 + progress * 30) * speedMul; // % por segundo
      for (const o of obstacles) {
        o.x -= v * dt * (o.kind === 'carro' ? 0.7 : 1);
        o.el.style.left = `${o.x}%`;
        if (!o.hit && o.lane === lane && o.x < 24 && o.x > 6) {
          o.hit = true;
          hits++;
          hitsEl.textContent = `Batidas: ${hits}`;
          slowUntil = t + 1400;
          AudioSystem.play('cancel');
          player.classList.remove('ub-bump');
          void player.offsetWidth;
          player.classList.add('ub-bump');
          o.el.classList.add('ub-gone');
          msg.textContent = HIT_LINES[(hits - 1) % HIT_LINES.length];
          lineIn = 3800;
        }
      }
      for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].x < -15) {
          obstacles[i].el.remove();
          obstacles.splice(i, 1);
        }
      }
      spawnIn -= dt * 1000;
      if (spawnIn <= 0 && progress < 0.94) {
        spawn();
        spawnIn = Math.max(520, 1150 - progress * 600) * (0.75 + Math.random() * 0.5);
      }
      lineIn -= dt * 1000;
      if (lineIn <= 0) {
        msg.textContent = CALM_LINES[Math.floor(Math.random() * CALM_LINES.length)];
        lineIn = 4200;
      }
      if (progress >= 1) return end(t);
      raf = requestAnimationFrame(tick);
    };

    const end = (t: number) => {
      running = false;
      done = true;
      const seconds = Math.round((t - started) / 1000);
      AudioSystem.play('quest');
      const stars = hits === 0 ? 3 : hits <= 3 ? 2 : 1;
      msg.textContent =
        hits === 0 ? 'Motorista: "Nenhuma batida! Cinco estrelas pra mim, hein?"' : hits <= 3 ? 'Weng: "Chegamos! Inteiros. Quase."' : 'Bella: "Chegamos... eu acho que perdi um brinco no caminho."';
      const close = () => {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve({ hits, seconds });
      };
      actions.replaceChildren(
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('div', { class: 'ub-time' }, `${seconds} s · ${hits} batida${hits === 1 ? '' : 's'}`),
        h('button', { class: 'btn primary', onclick: close }, 'Descer do carro'),
      );
      setTimeout(() => InputSystem.once('minigame:interact', close), 400);
    };

    const start = () => {
      if (running || done) return;
      running = true;
      started = performance.now();
      actions.replaceChildren();
      msg.textContent = 'Motorista: "Segura aí que a chuva tá forte."';
      raf = requestAnimationFrame(tick);
    };
    startBtn.addEventListener('click', start);
    up.addEventListener('click', () => move(-1));
    down.addEventListener('click', () => move(1));
    track.addEventListener('pointerdown', (e) => {
      const r = track.getBoundingClientRect();
      move(e.clientY - r.top < r.height / 2 ? -1 : 1);
    });
    const onUp = () => move(-1);
    const onDown = () => move(1);
    const onInteract = () => (!running && !done ? start() : undefined);
    InputSystem.on('minigame:up', onUp);
    InputSystem.on('minigame:down', onDown);
    InputSystem.on('minigame:interact', onInteract);

    function cleanup() {
      cancelAnimationFrame(raf);
      InputSystem.off('minigame:up', onUp);
      InputSystem.off('minigame:down', onDown);
      InputSystem.off('minigame:interact', onInteract);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
