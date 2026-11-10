import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';
import { shell, type MiniResult } from './PetroGames';

/**
 * Minigame — Pedrinha na lagoa (beira da Lagoa de Araruama, tarde do dia 31).
 *
 * A Bella e o Weng revezam jogando pedrinha pra quicar na água. Cada jogada:
 *  1. ↑ ↓ escolhe o ângulo: rasante (mais quiques, vai menos longe) ou alto (menos quiques, vai longe).
 *  2. Espaço / E segura o ponteiro na barra de força. O VENTO muda a cada jogada e empurra o verde.
 * Na água tem vitórias-régias (quique em cima delas vale +1) e, lá no fundo, a boia (chegar nela: +3).
 * A 3ª pedra é a pedra-coração: vale o dobro. 5 jogadas cada; ganha quem fizer mais pontos.
 * Pensado pra controle: direcional + 1 botão.
 */
const ROUNDS = 5;
const ANGLES = [
  { id: 'rasante', name: 'Rasante', hops: 1.25, len: 0.82 },
  { id: 'medio', name: 'Médio', hops: 1, len: 1 },
  { id: 'alto', name: 'Alto', hops: 0.7, len: 1.3 },
];
const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;
const START_X = 12;
const BOIA_X = 88;
/** As jogadas do Weng (o "campeão"): pontos e a desculpa. */
const WENG = [
  { pts: 5, line: 'Agora o profissional. Observa a técnica.', after: 'Cinco! Viu? Técnica.' },
  { pts: 7, line: 'Concentração... vento a favor...', after: 'Sete! O campeão voltou.' },
  { pts: 3, line: 'Essa vai até Cabo Frio.', after: '...Cabo Frio ficou bem pertinho.' },
  { pts: 6, line: 'Tá, essa conta como aquecimento.', after: 'Seis. Aquecido.' },
  { pts: 6, line: 'Última. Agora é sério.', after: 'Seis. Supera essa.' },
];

export function playPedrinhaGame(parent: HTMLElement): Promise<MiniResult & { skips: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'pe', 'Pedrinha na lagoa');
    const bg = textureURL('map-ar-praia-bg');
    const water = h('div', { class: 'pe-water', style: bg ? `background-image:url(${bg})` : '' });
    const layer = h('div', { class: 'pe-layer' });
    const pads = h('div', { class: 'pe-pads' });
    const boia = h('img', { class: 'pe-boia', src: mg('pd-boia'), alt: '', style: `left:${BOIA_X}%;top:${86 - (BOIA_X - START_X) * 0.42}%` });
    const ducks = h('img', { class: 'pe-ducks', src: mg('pd-patos'), alt: '', style: `top:${86 - (76 - START_X) * 0.42 - 6}%` });
    const needle = h('i', { class: 'pe-needle' });
    const zWeak = h('i', { class: 'z weak' });
    const zOk = h('i', { class: 'z ok' });
    const zGood = h('i', { class: 'z good' });
    const zOk2 = h('i', { class: 'z ok2' });
    const zStrong = h('i', { class: 'z strong' });
    const meter = h('div', { class: 'pe-meter' }, zWeak, zOk, zGood, zOk2, zStrong, needle);
    const windEl = h('div', { class: 'pe-wind' });
    const angleEl = h('div', { class: 'pe-angle' });
    const special = h('div', { class: 'pe-special' });
    const score = h('div', { class: 'pe-score' });
    const thrower = h('div', { class: 'pe-thrower' });
    const rules = h(
      'div',
      { class: 'cs-rules pe-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('span', { class: 'pe-ico' }), h('span', {}, 'Escolha o ângulo com ', h('kbd', {}, '↑'), ' ', h('kbd', {}, '↓'), ': rasante quica mais, alto vai mais longe.')),
      h('div', {}, h('span', { class: 'pe-ico' }), h('span', {}, 'Aperte ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), ' com o ponteiro no ', h('u', { class: 'g' }, 'verde'), '. O vento muda a cada jogada e empurra o verde.')),
      h('div', {}, h('img', { src: mg('pd-vitoria'), alt: '' }), h('span', {}, 'Quique numa vitória-régia: +1. Chegar na boia lá no fundo: +3. A 3ª pedra é a pedra-coração: vale o dobro!')),
    );
    ui.stage.append(water, pads, boia, ducks, layer, thrower, h('div', { class: 'pe-bar' }, h('div', { class: 'pe-bar-top' }, angleEl, windEl, special), meter), score, rules);

    let round = 0;
    let bella = 0;
    let weng = 0;
    let bellaSkips = 0;
    let angle = 1;
    let wind = 0;
    let phase: 'rules' | 'aim' | 'fly' | 'done' = 'rules';
    let t0 = 0;
    let raf = 0;
    let padXs: number[] = [];

    const hud = () =>
      ui.hud.replaceChildren(h('span', {}, `Jogada ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`), h('span', { class: 'pe-placar' }, `Bella ${bella} × ${weng} Weng`));
    const paintAngle = () => {
      angleEl.replaceChildren('Ângulo: ', ...ANGLES.map((a, i) => h('span', { class: i === angle ? 'on' : '' }, a.name)));
      thrower.className = `pe-thrower a${angle}`;
    };
    const goodCenter = () => 0.5 + wind * 0.2;
    const paintMeter = () => {
      const c = goodCenter();
      const g0 = c - 0.09;
      const g1 = c + 0.09;
      const set = (el: HTMLElement, a: number, b: number) => (el.style.cssText = `position:absolute;left:${a * 100}%;width:${Math.max(0, b - a) * 100}%;top:0;bottom:0`);
      set(zWeak, 0, g0 - 0.14);
      set(zOk, g0 - 0.14, g0);
      set(zGood, g0, g1);
      set(zOk2, g1, g1 + 0.14);
      set(zStrong, g1 + 0.14, 1);
      const arrow = wind < -0.15 ? '←' : wind > 0.15 ? '→' : '·';
      const force = Math.abs(wind) > 0.6 ? 'forte' : Math.abs(wind) > 0.15 ? 'fraco' : 'parado';
      windEl.textContent = `Vento: ${arrow} ${force}`;
    };
    const layPads = () => {
      // 3 vitórias-régias espalhadas no caminho da pedra
      padXs = [26 + Math.random() * 12, 46 + Math.random() * 12, 64 + Math.random() * 12];
      pads.replaceChildren(...padXs.map((x) => h('img', { class: 'pe-pad', src: mg('pd-vitoria'), alt: '', style: `left:${x}%;top:${86 - (x - START_X) * 0.42}%` })));
    };
    const newRound = () => {
      wind = round === 0 ? 0 : Math.max(-1, Math.min(1, (Math.random() * 2 - 1) * (0.5 + round * 0.15)));
      layPads();
      paintMeter();
      paintAngle();
      special.textContent = round === 2 ? '♥ Pedra-coração: vale o dobro!' : '';
      special.classList.toggle('on', round === 2);
      t0 = 0;
      phase = 'aim';
    };
    const pos = (t: number) => {
      const p = (t * (1.0 + round * 0.12)) % 2;
      return p < 1 ? p : 2 - p;
    };
    const tick = (t: number) => {
      if (!t0) t0 = t;
      if (phase === 'aim') needle.style.left = `${pos((t - t0) / 1000) * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    /** Quiques que a força dá (sem ângulo). */
    const quality = (p: number) => {
      const d = Math.abs(p - goodCenter());
      if (d < 0.03) return 7;
      if (d < 0.09) return 5;
      if (d < 0.16) return 3;
      if (d < 0.23) return 1;
      return 0;
    };
    /** Anima a pedra quicando. Devolve os pontos extras (vitórias-régias e boia). */
    const throwStone = (hops: number, reach: number, who: 'bella' | 'weng', heart: boolean) =>
      new Promise<{ bonus: number; boia: boolean }>((done) => {
        const stone = h('i', { class: `pe-stone ${who}${heart ? ' heart' : ''}` });
        layer.append(stone);
        let x = START_X;
        let y = 86;
        let hop = 0;
        let bonus = 0;
        const total = Math.max(1, hops);
        // comprimento dos pulos: o primeiro maior, depois diminuindo, somando até "reach"
        const weights = Array.from({ length: total }, (_, i) => 1 - i * 0.55 / total);
        const sum = weights.reduce((a, b) => a + b, 0);
        const step = () => {
          if (hop >= total) {
            const atBoia = x >= BOIA_X - 4;
            if (atBoia) {
              boia.classList.remove('hit');
              void boia.offsetWidth;
              boia.classList.add('hit');
              AudioSystem.play('quest');
              bonus += 3;
              pop(x, y, '+3 BOIA!', 'gold');
            }
            stone.classList.add('sink');
            AudioSystem.play('cancel');
            setTimeout(() => {
              stone.remove();
              done({ bonus, boia: atBoia });
            }, 450);
            return;
          }
          const len = hops === 0 ? 5 : ((reach - START_X) * weights[hop]) / sum;
          const nx = Math.min(96, x + len);
          const ny = 86 - (nx - START_X) * 0.42;
          const peak = Math.min(y, ny) - (14 - hop * 1.5) * (angle === 2 && who === 'bella' ? 1.4 : 1);
          stone.animate(
            [
              { left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%) rotate(0deg)' },
              { left: `${(x + nx) / 2}%`, top: `${peak}%`, transform: 'translate(-50%,-50%) rotate(360deg) scale(.92)' },
              { left: `${nx}%`, top: `${ny}%`, transform: 'translate(-50%,-50%) rotate(720deg) scale(.84)' },
            ],
            { duration: 300, easing: 'ease-in-out', fill: 'forwards' },
          );
          setTimeout(() => {
            x = nx;
            y = ny;
            if (hops > 0) {
              const ring = h('i', { class: 'pe-ring', style: `left:${x}%;top:${y}%` });
              layer.append(ring);
              setTimeout(() => ring.remove(), 900);
              AudioSystem.play('blip');
              pop(x, y - 8, String(hop + 1), 'white');
              // caiu numa vitória-régia?
              const pi = padXs.findIndex((px) => Math.abs(px - x) < 4.5);
              if (pi >= 0) {
                bonus++;
                const pad = pads.children[pi] as HTMLElement;
                pad.classList.remove('hit');
                void pad.offsetWidth;
                pad.classList.add('hit');
                AudioSystem.play('pickup');
                pop(x, y - 16, '+1', 'green');
              }
              // assustou os patinhos?
              if (x > 70 && x < 82 && !ducks.classList.contains('fly')) ducks.classList.add('fly');
            }
            hop++;
            step();
          }, 300);
        };
        step();
      });
    const pop = (x: number, y: number, text: string, kind: string) => {
      const el = h('b', { class: `pe-pop ${kind}`, style: `left:${x}%;top:${y}%` }, text);
      layer.append(el);
      setTimeout(() => el.remove(), 900);
    };
    const shoot = async () => {
      if (phase !== 'aim') return;
      phase = 'fly';
      const p = parseFloat(needle.style.left) / 100;
      const heart = round === 2;
      const q = quality(p);
      const a = ANGLES[angle];
      const hops = Math.round(q * a.hops);
      const reach = START_X + (q === 0 ? 4 : Math.min(84, (30 + q * 7) * a.len));
      const c = goodCenter();
      ui.say('bella', p < c - 0.23 ? 'Ih... fraquinha demais.' : p > c + 0.23 ? 'Forte demais! Ela voou!' : q >= 7 ? 'PERFEITA! Conta, conta!' : 'Vai, vai, vai...');
      thrower.classList.add('throw');
      setTimeout(() => thrower.classList.remove('throw'), 300);
      const r = await throwStone(hops, reach, 'bella', heart);
      let pts = hops + r.bonus;
      if (heart) pts *= 2;
      bella += pts;
      bellaSkips += hops;
      score.textContent = pts ? `${pts} ponto${pts > 1 ? 's' : ''}${heart ? ' (x2 ♥)' : ''}!` : 'Afundou...';
      score.classList.remove('pop');
      void score.offsetWidth;
      score.classList.add('pop');
      hud();
      await wait(800);
      // vez do Weng
      ducks.classList.remove('fly');
      const w = WENG[round];
      ui.say('weng', w.line);
      await wait(500);
      const wr = await throwStone(Math.min(w.pts, 7), START_X + 22 + w.pts * 7, 'weng', false);
      const wpts = w.pts + wr.bonus;
      weng += wpts;
      score.textContent = `Weng: ${wpts}`;
      hud();
      ui.say('weng', w.after);
      await wait(900);
      if (wpts < pts) ui.say('bella', ['Profissional, é? Hm.', 'Vento a favor de quem?', 'Cabo Frio ficou bem pertinho, né.', 'Aquecimento eterno.', 'Sério mesmo?'][round]);
      round++;
      ducks.classList.remove('fly');
      if (round >= ROUNDS) return finish();
      hud();
      await wait(600);
      newRound();
    };
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const finish = () => {
      phase = 'done';
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      const won = bella > weng;
      const stars = bella >= 30 ? 3 : won ? 2 : 1;
      ui.say(won ? 'bella' : 'weng', won ? `${bella} a ${weng}! O campeão da família perdeu pra mim.` : `${weng} a ${bella}... ok, dessa vez o "profissional" ganhou. Revanche amanhã.`);
      ui.end(stars, 'Voltar pra areia', () => resolve({ stars, mistakes: 0, skips: bellaSkips }));
    };
    const start = () => {
      if (phase !== 'rules') return;
      rules.classList.add('off');
      ui.actions.replaceChildren(throwBtn);
      newRound();
      ui.say('weng', 'Pedra chatinha, de lado, rente à água. Olha o vento! Primeiro você.');
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (phase !== 'aim') return;
        e.preventDefault();
        angle = Math.max(0, Math.min(2, angle + (e.code === 'ArrowUp' || e.code === 'KeyW' ? 1 : -1)));
        AudioSystem.play('blip');
        paintAngle();
        return;
      }
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
    paintAngle();
    ui.say('bella', 'A lagoa tá tão parada que parece um espelho. Bora jogar pedrinha?');
    raf = requestAnimationFrame(tick);
  });
}
