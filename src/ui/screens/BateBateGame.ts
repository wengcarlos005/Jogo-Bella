import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';
import { shell, type MiniResult } from './PetroGames';

/**
 * Minigame — Bate-bate (parque de diversões de Araruama).
 *
 * A pista vista de cima. O carrinho da Bella e do Weng anda com as setas (segurando). Bata nos
 * carrinhos dos primos pra marcar ponto (a batida só conta se VOCÊ estiver mais rápido). Se baterem
 * em você de lado, quem marca é eles. O Mingau persegue você; o Diego vive preso na parede. 40 segundos.
 * Pensado pra controle: só o direcional.
 */
type Car = { el: HTMLElement; x: number; y: number; vx: number; vy: number; who: string; color: string; ai: 'chase' | 'wander' | 'wall'; tx: number; ty: number; stun: number; score: number };
const R = 5.2; // raio do carrinho (% da pista, na largura)
const TIME = 40;

export function playBateBateGame(parent: HTMLElement): Promise<MiniResult & { hits: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'bb', 'Bate-bate');
    const arena = h('div', { class: 'bb-arena' });
    const rules = h(
      'div',
      { class: 'cs-rules bb-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('span', { class: 'bb-ico me' }), h('span', {}, 'Dirija o carrinho de vocês segurando ', h('kbd', {}, '←'), ' ', h('kbd', {}, '↑'), ' ', h('kbd', {}, '↓'), ' ', h('kbd', {}, '→'), '.')),
      h('div', {}, h('span', { class: 'bb-ico' }), h('span', {}, 'Bata nos carrinhos dos primos pra marcar ponto. Só conta se ', h('u', { class: 'g' }, 'você estiver mais rápido'), '.')),
      h('div', {}, h('span', { class: 'bb-ico red' }), h('span', {}, `Se eles baterem em você, o ponto é deles. O Mingau vai te perseguir! São ${TIME} segundos.`)),
    );
    ui.stage.append(arena, rules);

    const mk = (who: string, color: string, x: number, y: number, ai: Car['ai']): Car => {
      const face = textureURL(`portrait-${who}`);
      const el = h('div', { class: `bb-car ${color}` }, h('i', { class: 'bb-bumper' }), face ? h('img', { src: face, alt: '' }) : h('span', {}, who), h('b', { class: 'bb-name' }, who === 'bella' ? 'Vocês' : who[0].toUpperCase() + who.slice(1)));
      arena.append(el);
      return { el, x, y, vx: 0, vy: 0, who, color, ai, tx: x, ty: y, stun: 0, score: 0 };
    };
    const me = mk('bella', 'pink', 50, 70, 'chase');
    const cars = [me, mk('mingau', 'yellow', 20, 25, 'chase'), mk('diego', 'blue', 80, 25, 'wall'), mk('vivian', 'green', 80, 75, 'wander'), mk('julinha', 'orange', 20, 75, 'wander')];
    const keys = { l: false, r: false, u: false, d: false };
    let time = TIME;
    let hits = 0;
    let got = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    let ratio = 1.8; // largura / altura da pista (atualizado no tamanho real)

    const hud = () =>
      ui.hud.replaceChildren(h('span', {}, `Tempo: ${Math.max(0, Math.ceil(time))}s`), h('span', {}, `Batidas: ${hits}`), h('span', { class: 'pg-err' }, got ? `Levou: ${got}` : ''));
    const paint = () =>
      cars.forEach((c) => {
        c.el.style.left = `${c.x}%`;
        c.el.style.top = `${c.y}%`;
        const sp = Math.hypot(c.vx, c.vy);
        if (sp > 3) c.el.style.setProperty('--rot', `${Math.atan2(c.vy / ratio, c.vx) * (180 / Math.PI) + 90}deg`);
        c.el.classList.toggle('stun', c.stun > 0);
      });
    const pop = (x: number, y: number, text: string, kind: string) => {
      const el = h('b', { class: `bb-pop ${kind}`, style: `left:${x}%;top:${y}%` }, text);
      arena.append(el);
      setTimeout(() => el.remove(), 900);
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
          me.vx += ax * 120 * dt;
          me.vy += ay * 120 * ratio * dt;
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
          const acc = c.ai === 'chase' ? 70 + (TIME - time) * 1.2 : 55;
          c.vx += (dx / d) * acc * dt;
          c.vy += (dy / d) * acc * ratio * dt;
        }
        for (const c of cars) {
          c.stun = Math.max(0, c.stun - dt);
          c.vx *= Math.pow(0.35, dt);
          c.vy *= Math.pow(0.35, dt);
          const max = c === me ? 55 : c.ai === 'chase' ? 42 : 34;
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
            if (a === me || c === me) {
              const other = a === me ? c : a;
              const mine = a === me ? va : vc;
              const theirs = a === me ? vc : va;
              const mx = (a.x + c.x) / 2;
              const my = (a.y + c.y) / 2;
              if (mine > theirs && rel > 10 && other.stun <= 0) {
                hits++;
                other.stun = 0.9;
                AudioSystem.play('pickup');
                pop(mx, my, 'BATEU! +1', 'good');
                const lines = LINES_HIT[other.who];
                if (lines && Math.random() < 0.6) ui.say('bella', lines[Math.floor(Math.random() * lines.length)]);
              } else if (theirs > mine && rel > 10 && me.stun <= 0) {
                got++;
                me.stun = 0.6;
                AudioSystem.play('cancel');
                ui.shake();
                pop(mx, my, 'Pegaram vocês!', 'bad');
                if (other.who === 'mingau' && Math.random() < 0.6) ui.say('mingau', 'TE PEGUEI, WENG!');
              } else AudioSystem.play('blip');
              hud();
            }
          }
        if (time <= 0) return finish();
        hud();
      }
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
      const net = hits - Math.floor(got / 2);
      const stars = net >= 8 ? 3 : net >= 4 ? 2 : 1;
      ui.say(net >= 4 ? 'bella' : 'weng', net >= 4 ? `${hits} batidas! A pista é nossa. O Mingau pediu revanche.` : `O Mingau bateu na gente ${got} vezes... ele tá se achando o rei do bate-bate.`);
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
      if ((e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') && !running && !e.repeat) {
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
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren(pad('◀', 'l'), pad('▲', 'u'), pad('▼', 'd'), pad('▶', 'r'));
      ui.say('weng', 'Eu piso, você manda. Vai, vai, VAI!');
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
