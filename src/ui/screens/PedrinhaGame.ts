import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';
import { shell, type MiniResult } from './PetroGames';

/**
 * Minigame — Pedrinha na lagoa (beira da Lagoa de Araruama, tarde do dia 31).
 *
 * A Bella e o Weng revezam jogando pedrinha pra quicar na água. Na vez da Bella, o ponteiro corre
 * pela barra de força: aperte Espaço / E / JOGAR com ele no verde. Quanto mais no centro do verde,
 * mais quiques. 5 jogadas cada; ganha quem somar mais quiques (o Weng jura que é bom nisso).
 * Pensado pra controle: 1 botão.
 */
const ROUNDS = 5;
const WENG = [2, 4, 1, 3, 2]; // o "campeão" da família

export function playPedrinhaGame(parent: HTMLElement): Promise<MiniResult & { skips: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'pe', 'Pedrinha na lagoa');
    const bg = textureURL('map-ar-praia-bg');
    const water = h('div', { class: 'pe-water', style: bg ? `background-image:url(${bg})` : '' });
    const layer = h('div', { class: 'pe-layer' });
    const needle = h('i', { class: 'pe-needle' });
    const meter = h('div', { class: 'pe-meter' }, h('i', { class: 'z weak' }), h('i', { class: 'z ok' }), h('i', { class: 'z good' }), h('i', { class: 'z ok2' }), h('i', { class: 'z strong' }), needle);
    const score = h('div', { class: 'pe-score' });
    const rules = h(
      'div',
      { class: 'cs-rules pe-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('span', { class: 'pe-ico' }), h('span', {}, 'O ponteiro corre pela barra de força. Aperte ', h('kbd', {}, 'Espaço'), ' ou ', h('kbd', {}, 'E'), ' com ele no ', h('u', { class: 'g' }, 'verde'), '.')),
      h('div', {}, h('span', { class: 'pe-ico ring' }), h('span', {}, 'Bem no meio do verde = mais quiques. Fraco demais afunda; forte demais, a pedra voa e cai.')),
      h('div', {}, h('span', { class: 'pe-ico' }), h('span', {}, `São ${ROUNDS} jogadas pra cada um. O Weng jura que é o campeão da família. Ganhe dele!`)),
    );
    ui.stage.append(water, layer, h('div', { class: 'pe-bar' }, meter), score, rules);

    let round = 0;
    let bella = 0;
    let weng = 0;
    let best = 0;
    let phase: 'rules' | 'aim' | 'fly' | 'done' = 'rules';
    let t0 = 0;
    let raf = 0;
    const SPEED = 1.15; // idas e voltas por segundo

    const hud = () =>
      ui.hud.replaceChildren(h('span', {}, `Jogada ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`), h('span', {}, `Bella ${bella} × ${weng} Weng`));
    const pos = (t: number) => {
      // ponteiro vai e volta (0..1), um pouco mais rápido a cada rodada
      const p = (t * (SPEED + round * 0.12)) % 2;
      return p < 1 ? p : 2 - p;
    };
    const tick = (t: number) => {
      if (!t0) t0 = t;
      if (phase === 'aim') needle.style.left = `${pos((t - t0) / 1000) * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    /** Anima a pedra quicando: n quiques, terminando em afundar. */
    const throwStone = (n: number, who: 'bella' | 'weng') =>
      new Promise<void>((done) => {
        const stone = h('i', { class: `pe-stone ${who}` });
        layer.append(stone);
        let x = who === 'bella' ? 18 : 24;
        let y = 92;
        let hop = 0;
        const hops = Math.max(1, n);
        const step = () => {
          if (hop >= hops) {
            stone.classList.add('sink');
            AudioSystem.play('cancel');
            setTimeout(() => {
              stone.remove();
              done();
            }, 450);
            return;
          }
          const len = n === 0 ? 4 : 12 - hop * 1.2;
          const nx = x + len;
          const ny = y - 7 - hop * 1.5;
          stone.animate(
            [
              { left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%) scale(1)' },
              { left: `${(x + nx) / 2}%`, top: `${Math.min(y, ny) - 9}%`, transform: 'translate(-50%,-50%) scale(.9)' },
              { left: `${nx}%`, top: `${ny}%`, transform: 'translate(-50%,-50%) scale(.82)' },
            ],
            { duration: 260, easing: 'ease-out', fill: 'forwards' },
          );
          setTimeout(() => {
            x = nx;
            y = ny;
            if (n > 0) {
              const ring = h('i', { class: 'pe-ring', style: `left:${x}%;top:${y}%` });
              layer.append(ring);
              setTimeout(() => ring.remove(), 900);
              AudioSystem.play('blip');
            }
            hop++;
            step();
          }, 260);
        };
        step();
      });
    const quality = (p: number) => {
      const d = Math.abs(p - 0.5);
      if (d < 0.05) return 7;
      if (d < 0.1) return 5;
      if (d < 0.16) return 4;
      if (d < 0.26) return 2;
      return 0;
    };
    const shoot = async () => {
      if (phase !== 'aim') return;
      phase = 'fly';
      const p = parseFloat(needle.style.left) / 100;
      const n = quality(p) - (quality(p) && Math.random() < 0.25 ? 1 : 0);
      ui.say('bella', p < 0.24 ? 'Ih... fraquinha demais.' : p > 0.76 ? 'Forte demais! Ela voou!' : n >= 6 ? 'OLHA ISSO! Conta, conta!' : 'Vai, vai, vai...');
      await throwStone(n, 'bella');
      bella += n;
      best = Math.max(best, n);
      score.textContent = n ? `${n} quique${n > 1 ? 's' : ''}!` : 'Afundou...';
      score.classList.remove('pop');
      void score.offsetWidth;
      score.classList.add('pop');
      hud();
      await new Promise((r) => setTimeout(r, 700));
      const w = WENG[round];
      ui.say('weng', ['Agora o profissional. Observa a técnica.', 'Concentração... vento a favor...', 'Essa vai até Cabo Frio.', 'Tá, essa conta como aquecimento.', 'Última. Agora é sério.'][round]);
      await throwStone(w, 'weng');
      weng += w;
      score.textContent = `Weng: ${w}`;
      hud();
      await new Promise((r) => setTimeout(r, 600));
      if (w < n) ui.say('bella', ['Profissional, é? Hm.', 'Vento a favor de quem?', 'Cabo Frio ficou bem pertinho, né.', 'Aquecimento eterno.', 'Sério mesmo?'][round]);
      round++;
      if (round >= ROUNDS) return finish();
      hud();
      phase = 'aim';
      t0 = 0;
    };
    const finish = () => {
      phase = 'done';
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      const won = bella > weng;
      const stars = bella >= 24 ? 3 : bella > weng ? 2 : 1;
      ui.say(won ? 'bella' : 'weng', won ? `${bella} a ${weng}! O campeão da família perdeu pra mim.` : `${weng} a ${bella}... ok, dessa vez o "profissional" ganhou. Revanche amanhã.`);
      ui.end(stars, 'Voltar pra areia', () => resolve({ stars, mistakes: 0, skips: bella }));
    };
    const start = () => {
      if (phase !== 'rules') return;
      rules.classList.add('off');
      ui.actions.replaceChildren(throwBtn);
      phase = 'aim';
      t0 = 0;
      ui.say('weng', 'Pedra chatinha, joga de lado, bem rente à água. Primeiro você.');
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      e.preventDefault();
      if (phase === 'rules') start();
      else void shoot();
    };
    const throwBtn = h('button', { class: 'btn primary ce-serve' }, 'JOGAR');
    throwBtn.addEventListener('click', () => void shoot());
    const startBtn = h('button', { class: 'btn primary' }, 'Escolher uma pedrinha');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    hud();
    ui.say('bella', 'A lagoa tá tão parada que parece um espelho. Bora jogar pedrinha?');
    raf = requestAnimationFrame(tick);
  });
}
