import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';
import { shell, type MiniResult } from './PetroGames';

/**
 * Minigame — Bate-bate (parque de diversões de Araruama).
 *
 * A pista vista de cima. O carrinho da Bella e do Weng anda com as setas (segurando). Bata nos
 * carrinhos dos primos pra marcar ponto: a batida só conta se VOCÊ estiver mais rápido (o carrinho
 * brilha e solta faísca quando está rápido o bastante). Se baterem em você, o ponto é deles.
 * O Mingau persegue vocês; o Diego vive preso na parede. 45 segundos. Só o direcional.
 */
type Car = { el: HTMLElement; body: HTMLElement; x: number; y: number; vx: number; vy: number; who: string; color: string; ai: 'chase' | 'wander' | 'wall'; tx: number; ty: number; stun: number; score: number };
const R = 4.3; // raio do carrinho (% da pista, na largura)
const TIME = 45;
const FAST = 30; // velocidade a partir da qual a batida conta (o carrinho brilha)

const COLORS: Record<string, [string, string]> = {
  pink: ['#ff7aa8', '#c83a6e'],
  yellow: ['#ffd84a', '#d79a12'],
  blue: ['#5a9aff', '#2a5ac8'],
  green: ['#6fdc8a', '#2f9a52'],
  orange: ['#ffa24a', '#d0641a'],
};

/** Carrinho de bate-bate visto de cima (a frente aponta pra cima; o CSS gira). */
function carSVG(color: string): string {
  const [c1, c2] = COLORS[color] ?? COLORS.pink;
  return `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect x="4" y="8" width="92" height="104" rx="34" fill="#1d1a26"/>
  <rect x="8" y="12" width="84" height="96" rx="30" fill="#2e2a3a"/>
  <rect x="14" y="16" width="72" height="88" rx="24" fill="${c2}"/>
  <rect x="16" y="16" width="68" height="80" rx="22" fill="${c1}"/>
  <rect x="24" y="20" width="52" height="10" rx="5" fill="#ffffff" opacity=".45"/>
  <circle cx="30" cy="24" r="5" fill="#fff6c0"/><circle cx="70" cy="24" r="5" fill="#fff6c0"/>
  <rect x="26" y="52" width="48" height="44" rx="12" fill="#1d1a26" opacity=".85"/>
  <rect x="36" y="38" width="28" height="7" rx="3" fill="#1d1a26"/>
  <circle cx="50" cy="104" r="6" fill="#c9c2d6" stroke="#1d1a26" stroke-width="3"/>
</svg>`;
}

export function playBateBateGame(parent: HTMLElement): Promise<MiniResult & { hits: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'bb', 'Bate-bate');
    const bulbs = h('div', { class: 'bb-bulbs' }, ...Array.from({ length: 28 }, (_, i) => h('i', { style: `--i:${i}` })));
    const arena = h('div', { class: 'bb-arena' }, h('div', { class: 'bb-floor' }), h('div', { class: 'bb-logo' }, 'BATE-BATE'));
    const count = h('div', { class: 'bb-count' });
    const icon = (color: string) => h('span', { class: 'bb-ico', html: carSVG(color) });
    const rules = h(
      'div',
      { class: 'cs-rules bb-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, icon('pink'), h('span', {}, 'Vocês são o carrinho ', h('u', { class: 'g' }, 'rosa'), '. Dirija segurando ', h('kbd', {}, '←'), ' ', h('kbd', {}, '↑'), ' ', h('kbd', {}, '↓'), ' ', h('kbd', {}, '→'), '.')),
      h('div', {}, icon('blue'), h('span', {}, 'Pegue embalo e bata nos primos: quando o carrinho ', h('u', { class: 'g' }, 'brilha e solta faísca'), ', a batida vale ponto.')),
      h('div', {}, icon('yellow'), h('span', {}, `Se baterem em vocês, o ponto é deles. O Mingau (amarelo) vai perseguir vocês! ${TIME} segundos.`)),
    );
    ui.stage.append(bulbs, arena, count, rules);

    const mk = (who: string, color: string, x: number, y: number, ai: Car['ai']): Car => {
      const face = textureURL(`portrait-${who === 'bella' ? 'bella' : who}`);
      const body = h('div', { class: 'bb-body', html: carSVG(color) });
      const name = who === 'bella' ? 'VOCÊS' : who[0].toUpperCase() + who.slice(1);
      const el = h(
        'div',
        { class: `bb-car ${color}${who === 'bella' ? ' me' : ''}` },
        h('div', { class: 'bb-spark' }),
        body,
        face ? h('img', { class: 'bb-driver', src: face, alt: '' }) : null,
        h('b', { class: 'bb-name' }, name),
      );
      arena.append(el);
      return { el, body, x, y, vx: 0, vy: 0, who, color, ai, tx: x, ty: y, stun: 0, score: 0 };
    };
    const me = mk('bella', 'pink', 50, 72, 'chase');
    const cars = [me, mk('mingau', 'yellow', 18, 24, 'chase'), mk('diego', 'blue', 82, 24, 'wall'), mk('vivian', 'green', 82, 76, 'wander'), mk('julinha', 'orange', 18, 76, 'wander')];
    const keys = { l: false, r: false, u: false, d: false };
    let time = TIME;
    let hits = 0;
    let got = 0;
    let combo = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    let ratio = 1.8; // largura / altura da pista (atualizado no tamanho real)

    // placar: Vocês × Primos, com o relógio no meio
    const sbMe = h('span', { class: 'bb-sb-n' }, '0');
    const sbThem = h('span', { class: 'bb-sb-n' }, '0');
    const sbTime = h('span', { class: 'bb-sb-time' }, String(TIME));
    const sbBar = h('i', {});
    const sbSpeed = h('i', {});
    const sbBox = h(
      'div',
      { class: 'bb-sb' },
      h('div', { class: 'bb-sb-side me' }, h('span', { class: 'bb-sb-name' }, 'Vocês'), sbMe),
      h('div', { class: 'bb-sb-mid' }, sbTime, h('div', { class: 'bb-sb-bar' }, sbBar), h('div', { class: 'bb-sb-speed' }, h('span', {}, 'Embalo'), h('div', {}, sbSpeed))),
      h('div', { class: 'bb-sb-side them' }, sbThem, h('span', { class: 'bb-sb-name' }, 'Primos')),
    );
    ui.hud.replaceChildren(sbBox);
    const bump = (el: HTMLElement) => {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    };
    const hud = () => {
      const t = Math.max(0, Math.ceil(time));
      if (sbTime.textContent !== String(t)) sbTime.textContent = String(t);
      sbTime.classList.toggle('hurry', t <= 10 && running);
      sbBar.style.width = `${(Math.max(0, time) / TIME) * 100}%`;
      if (sbMe.textContent !== String(hits)) {
        sbMe.textContent = String(hits);
        bump(sbMe);
      }
      if (sbThem.textContent !== String(got)) {
        sbThem.textContent = String(got);
        bump(sbThem);
      }
      sbBox.classList.toggle('lead-me', hits > got);
      sbBox.classList.toggle('lead-them', got > hits);
      const sp = Math.hypot(me.vx, me.vy / ratio);
      sbSpeed.style.width = `${Math.min(100, (sp / 55) * 100)}%`;
      sbSpeed.parentElement!.classList.toggle('fast', sp >= FAST);
    };
    const paint = () =>
      cars.forEach((c) => {
        c.el.style.left = `${c.x}%`;
        c.el.style.top = `${c.y}%`;
        const sp = Math.hypot(c.vx, c.vy / ratio);
        if (sp > 3) c.body.style.setProperty('--rot', `${Math.atan2(c.vy / ratio, c.vx) * (180 / Math.PI) + 90}deg`);
        c.el.classList.toggle('stun', c.stun > 0);
        c.el.classList.toggle('fast', sp >= FAST && c.stun <= 0);
      });
    const pop = (x: number, y: number, text: string, kind: string) => {
      const el = h('b', { class: `bb-pop ${kind}`, style: `left:${x}%;top:${y}%` }, text);
      arena.append(el);
      setTimeout(() => el.remove(), 1000);
    };
    const flash = (x: number, y: number) => {
      const el = h('i', { class: 'bb-boom', style: `left:${x}%;top:${y}%` });
      arena.append(el);
      setTimeout(() => el.remove(), 450);
    };
    const LINES_HIT: Record<string, string[]> = {
      mingau: ['Toma, Mingau!', 'O Mingau foi parar na parede!', 'Mingau, respeita os mais velhos!'],
      diego: ['Desculpa, Diego! (não)', 'O Diego nem viu de onde veio.'],
      vivian: ['Vivian, foi sem querer! (foi de querer)', 'A Vivian tá rindo até agora.'],
      julinha: ['Julinha, desculpa!', 'A Julinha ficou girando no lugar.'],
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      const b = arena.getBoundingClientRect();
      if (b.height) ratio = b.width / b.height;
      if (running) {
        time -= dt;
        // vocês: aceleração pelas setas, com atrito
        const ax = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
        const ay = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
        if (me.stun <= 0) {
          me.vx += ax * 130 * dt;
          me.vy += ay * 130 * ratio * dt;
        }
        // os primos
        for (const c of cars) {
          if (c === me) continue;
          if (c.stun > 0) continue;
          if (c.ai === 'chase') {
            c.tx = me.x;
            c.ty = me.y;
          } else if (Math.hypot(c.tx - c.x, (c.ty - c.y) / ratio) < 6) {
            // escolhe outro ponto; o Diego sempre vai pra parede
            c.tx = c.ai === 'wall' ? (Math.random() < 0.5 ? 8 : 92) : 12 + Math.random() * 76;
            c.ty = c.ai === 'wall' ? 12 + Math.random() * 76 : 14 + Math.random() * 72;
          }
          const dx = c.tx - c.x;
          const dy = (c.ty - c.y) / ratio;
          const d = Math.hypot(dx, dy) || 1;
          const acc = c.ai === 'chase' ? 66 + (TIME - time) * 1.1 : 52;
          c.vx += (dx / d) * acc * dt;
          c.vy += (dy / d) * acc * ratio * dt;
        }
        for (const c of cars) {
          c.stun = Math.max(0, c.stun - dt);
          c.vx *= Math.pow(0.35, dt);
          c.vy *= Math.pow(0.35, dt);
          const max = c === me ? 55 : c.ai === 'chase' ? 40 : 32;
          const sp = Math.hypot(c.vx, c.vy / ratio);
          if (sp > max) {
            c.vx *= max / sp;
            c.vy *= max / sp;
          }
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          // paredes da pista
          const rx = R;
          const ry = R * ratio;
          if (c.x < rx) (c.x = rx), (c.vx = Math.abs(c.vx) * 0.6);
          if (c.x > 100 - rx) (c.x = 100 - rx), (c.vx = -Math.abs(c.vx) * 0.6);
          if (c.y < ry) (c.y = ry), (c.vy = Math.abs(c.vy) * 0.6);
          if (c.y > 100 - ry) (c.y = 100 - ry), (c.vy = -Math.abs(c.vy) * 0.6);
        }
        // batidas
        for (let i = 0; i < cars.length; i++)
          for (let j = i + 1; j < cars.length; j++) {
            const a = cars[i];
            const c = cars[j];
            const dx = c.x - a.x;
            const dy = (c.y - a.y) / ratio;
            const d = Math.hypot(dx, dy);
            if (d >= R * 2 || d === 0) continue;
            const nx = dx / d;
            const ny = dy / d;
            // separa
            const push = (R * 2 - d) / 2;
            a.x -= nx * push;
            a.y -= ny * push * ratio;
            c.x += nx * push;
            c.y += ny * push * ratio;
            // velocidade de cada um NA DIREÇÃO do outro
            const va = a.vx * nx + (a.vy / ratio) * ny;
            const vc = -(c.vx * nx + (c.vy / ratio) * ny);
            const rel = va + vc;
            if (rel < 4) continue;
            const imp = rel * 1.1;
            a.vx -= nx * imp;
            a.vy -= ny * imp * ratio;
            c.vx += nx * imp;
            c.vy += ny * imp * ratio;
            const mx = (a.x + c.x) / 2;
            const my = (a.y + c.y) / 2;
            if (a === me || c === me) {
              const other = a === me ? c : a;
              const mine = a === me ? va : vc;
              const theirs = a === me ? vc : va;
              const mySpeed = Math.hypot(me.vx, me.vy / ratio);
              if (mine > theirs && (mine >= FAST * 0.8 || mySpeed >= FAST) && other.stun <= 0) {
                combo++;
                const pts = combo >= 3 ? 2 : 1;
                hits += pts;
                other.stun = 1;
                AudioSystem.play('pickup');
                flash(mx, my);
                pop(mx, my, pts > 1 ? `COMBO! +${pts}` : 'BATEU! +1', 'good');
                ui.shake();
                const lines = LINES_HIT[other.who];
                if (lines && Math.random() < 0.6) ui.say('bella', lines[Math.floor(Math.random() * lines.length)]);
              } else if (theirs > mine && rel > 10 && me.stun <= 0) {
                got++;
                combo = 0;
                me.stun = 0.7;
                AudioSystem.play('cancel');
                ui.shake();
                flash(mx, my);
                pop(mx, my, `${other.who[0].toUpperCase() + other.who.slice(1)} pegou vocês!`, 'bad');
                if (other.who === 'mingau' && Math.random() < 0.6) ui.say('mingau', 'TE PEGUEI, WENG!');
              } else {
                AudioSystem.play('blip');
                pop(mx, my, 'Devagar demais!', 'meh');
              }
            } else if (rel > 12) flash(mx, my);
          }
        if (time <= 0) return finish();
      }
      hud();
      paint();
      raf = requestAnimationFrame(tick);
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      hud();
      const net = hits - Math.floor(got / 2);
      const stars = net >= 8 ? 3 : net >= 4 ? 2 : 1;
      count.textContent = 'FIM!';
      count.className = 'bb-count show';
      ui.say(net >= 4 ? 'bella' : 'weng', net >= 4 ? `${hits} a ${got}! A pista é nossa. O Mingau pediu revanche.` : `${hits} a ${got}... o Mingau tá se achando o rei do bate-bate.`);
      ui.end(stars, 'Sair da pista', () => resolve({ stars, mistakes: got, hits }));
    };
    const dirOf = (code: string) =>
      code === 'ArrowLeft' || code === 'KeyA' ? 'l' : code === 'ArrowRight' || code === 'KeyD' ? 'r' : code === 'ArrowUp' || code === 'KeyW' ? 'u' : code === 'ArrowDown' || code === 'KeyS' ? 'd' : null;
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || done) return;
      const d = dirOf(e.code);
      if (d) {
        e.preventDefault();
        keys[d] = true;
        return;
      }
      if ((e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') && !started && !e.repeat) {
        e.preventDefault();
        start();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const d = dirOf(e.code);
      if (d) keys[d] = false;
    };
    const pad = (label: string, k: keyof typeof keys) => {
      const b = h('button', { class: 'btn pd-steer', 'aria-label': label }, label);
      b.addEventListener('pointerdown', () => (keys[k] = true));
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => (keys[k] = false));
      return b;
    };
    let started = false;
    const start = async () => {
      if (started || done) return;
      started = true;
      rules.classList.add('off');
      ui.actions.replaceChildren(pad('◀', 'l'), pad('▲', 'u'), pad('▼', 'd'), pad('▶', 'r'));
      ui.say('weng', 'Eu piso, você manda. Segura firme!');
      // 3, 2, 1, VAI!
      for (const n of ['3', '2', '1']) {
        count.textContent = n;
        count.className = 'bb-count';
        void count.offsetWidth;
        count.className = 'bb-count show';
        AudioSystem.play('blip');
        await new Promise((r) => setTimeout(r, 650));
      }
      count.textContent = 'VAI!';
      count.className = 'bb-count';
      void count.offsetWidth;
      count.className = 'bb-count show go';
      AudioSystem.play('confirm');
      running = true;
      setTimeout(() => (count.className = 'bb-count'), 700);
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Ligar o carrinho');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    hud();
    ui.say('bella', 'Bate-bate com os primos! O Mingau já tá olhando pra gente com cara de quem vai atacar.');
    raf = requestAnimationFrame(tick);
  });
}
