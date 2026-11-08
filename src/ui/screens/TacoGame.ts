import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Taco Roleta (restaurante mexicano, 2º encontro).
 *
 * O Weng esconde pimenta nos tacos e o garçom embaralha os pratos, cada vez mais rápido.
 * Siga com o olho e escolha um taco SEM pimenta pra Bella (que odeia pimenta).
 * 5 rodadas; nas 2 últimas são DUAS pimentas (só um taco é seguro).
 * 3 vidas: comeu 3 pimentas, perdeu e recomeça.
 * Estrelas: vidas que sobraram (3 = nenhuma pimenta).
 *
 * Controles: clique/toque no taco, ou ← → e espaço/E (ou 1, 2, 3).
 * Sprites: taco-*.png (art-source/minigames/taco-roleta.webp) e bustos taco-b-*, taco-w-*.
 */
export interface TacoResult {
  stars: number;
  mistakes: number;
}

const ROUNDS = [
  { swaps: 3, ms: 600, show: 1900, peppers: 1, intro: 'Weng: "Uma dessas tem pimenta. Só uma. Boa sorte, amor."' },
  { swaps: 5, ms: 500, show: 1600, peppers: 1, intro: 'Garçom: "¡Otra vez! Agora eu embaralho mais rápido, señorita."' },
  { swaps: 7, ms: 410, show: 1400, peppers: 1, intro: 'Weng: "Essa pimenta é das brabas. Presta atenção..."' },
  { swaps: 7, ms: 380, show: 1600, peppers: 2, intro: 'Weng: "Agora são DUAS pimentas. Só um taco é seguro."' },
  { swaps: 9, ms: 320, show: 1500, peppers: 2, intro: 'Garçom: "¡La final! Duas pimentas e muita velocidade!"' },
];
const LIVES = 3;
const X = [20, 50, 80];
type Mood = 'b-pensa' | 'b-feliz' | 'b-fogo' | 'w-malandro' | 'w-ri' | 'w-orgulho';

export function playTacoGame(parent: HTMLElement, opts: { title?: string } = {}): Promise<TacoResult> {
  return new Promise((resolve) => {
    const mg = (f: string) => new URL(`assets/minigames/taco-${f}.png`, document.baseURI).href;
    for (const f of ['prato', 'fechado', 'aberto', 'pimenta', 'fogo', 'brilho', 'agua', 'sombreiro', 'duvida', 'b-pensa', 'b-feliz', 'b-fogo', 'w-malandro', 'w-ri', 'w-orgulho']) new Image().src = mg(f);
    let round = 0;
    let lives = LIVES;
    let peppers = new Set<number>(); // tacos (0..2) com pimenta
    let pos = [0, 1, 2]; // pos[taco] = coluna
    let picking = false;
    let cursor = 1;
    let finished = false;
    let busy = false;

    const tacos = [0, 1, 2].map((i) => {
      const img = h('img', { class: 'tr-taco', src: mg('aberto'), alt: '' }) as HTMLImageElement;
      const fx = h('img', { class: 'tr-fx', alt: '' }) as HTMLImageElement;
      const slot = h('div', { class: 'tr-slot', role: 'button', 'aria-label': `Taco ${i + 1}` }, h('img', { class: 'tr-plate', src: mg('prato'), alt: '' }), img, fx);
      slot.addEventListener('click', () => void choose(i));
      return { slot, img, fx };
    });
    const bg = textureURL('map-piabeta-mexicano-bg');
    const banner = h('div', { class: 'tr-banner' });
    const stage = h(
      'div',
      { class: 'tr-stage' },
      bg ? h('div', { class: 'tr-bg', style: `background-image:url(${bg})` }) : null,
      h('div', { class: 'tr-table' }),
      h('img', { class: 'tr-deco l', src: mg('molho'), alt: '' }),
      h('img', { class: 'tr-deco r', src: mg('limao'), alt: '' }),
      ...tacos.map((t) => t.slot),
      banner,
    );
    const face = h('img', { class: 'tr-face bust', alt: '' }) as HTMLImageElement;
    const msg = h('div', { class: 'gp-bubble tr-msg' });
    const dots = h('div', { class: 'tr-dots' }, ...ROUNDS.map((r) => h('i', { title: r.peppers > 1 ? '2 pimentas' : '' })));
    const livesEl = h('div', { class: 'tr-lives', title: 'Vidas' });
    const startBtn = h('button', { class: 'btn primary' }, 'Começar');
    const actions = h('div', { class: 'bg-actions tr-actions' }, startBtn);
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel tr-panel' },
      h('div', { class: 'bg-title tr-title' }, h('img', { src: mg('sombreiro'), alt: '' }), opts.title ?? 'Taco Roleta', h('img', { src: mg('sombreiro'), alt: '' })),
      h('div', { class: 'tr-hud' }, livesEl, dots),
      stage,
      h('div', { class: 'tr-talk' }, face, msg),
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen tr-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const say = (who: 'bella' | 'weng' | 'garcom', t: string, mood?: Mood) => {
      const m: Mood | undefined = mood ?? (who === 'bella' ? 'b-pensa' : who === 'weng' ? 'w-malandro' : undefined);
      const url = m ? mg(m) : textureURL('portrait-garcom-mex') ?? textureURL('portrait-garcom');
      if (url) face.src = url;
      face.classList.toggle('bust', !!m);
      msg.textContent = t;
      msg.classList.remove('pop');
      void msg.offsetWidth;
      msg.classList.add('pop');
    };
    const sayLine = (line: string) => {
      const m = line.match(/^(Weng|Bella|Garçom): (.*)$/);
      say(m ? (m[1] === 'Weng' ? 'weng' : m[1] === 'Bella' ? 'bella' : 'garcom') : 'garcom', m ? m[2] : line);
    };
    const renderLives = () => {
      livesEl.replaceChildren(...Array.from({ length: LIVES }, (_, k) => h('i', { class: k < lives ? 'on' : '' }, '♥')));
    };
    const place = () => tacos.forEach((t, i) => (t.slot.style.left = `${X[pos[i]]}%`));
    const setCursor = (c: number) => {
      cursor = (c + 3) % 3;
      tacos.forEach((t, i) => t.slot.classList.toggle('sel', picking && pos[i] === cursor));
    };
    const fx = (i: number, key: string | null) => {
      const el = tacos[i].fx;
      el.classList.remove('on', 'fogo');
      if (!key) return;
      el.src = mg(key);
      el.classList.toggle('fogo', key === 'fogo');
      void el.offsetWidth;
      el.classList.add('on');
    };
    const clearFx = () => [0, 1, 2].forEach((i) => fx(i, null));
    const hop = (i: number) => tacos[i].img.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-22%)' }, { transform: 'translateY(0)' }], { duration: 260, easing: 'ease-out' });
    const R = () => ROUNDS[round];

    const swap = async (ms: number) => {
      const a = Math.floor(Math.random() * 3);
      const b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
      const ta = pos.indexOf(a);
      const tb = pos.indexOf(b);
      tacos[ta].slot.style.transitionDuration = `${ms}ms`;
      tacos[tb].slot.style.transitionDuration = `${ms}ms`;
      tacos[ta].img.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-26%)' }, { transform: 'translateY(0)' }], { duration: ms, easing: 'ease-in-out' });
      tacos[tb].img.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(14%)' }, { transform: 'translateY(0)' }], { duration: ms, easing: 'ease-in-out' });
      pos[ta] = b;
      pos[tb] = a;
      place();
      AudioSystem.play('blip');
      await wait(ms + 30);
    };

    const playRound = async () => {
      busy = true;
      const r = R();
      dots.querySelectorAll('i').forEach((d, k) => d.classList.toggle('now', k === round));
      pos = [0, 1, 2];
      tacos.forEach((t) => (t.slot.style.transitionDuration = '0ms'));
      place();
      clearFx();
      const order = [0, 1, 2].sort(() => Math.random() - 0.5);
      peppers = new Set(order.slice(0, r.peppers));
      banner.textContent = r.peppers > 1 ? `Rodada ${round + 1} · DUAS pimentas!` : `Rodada ${round + 1}`;
      banner.classList.add('on');
      tacos.forEach((t, i) => (t.img.src = mg(peppers.has(i) ? 'pimenta' : 'aberto')));
      sayLine(r.intro);
      for (const i of peppers) fx(i, 'duvida');
      await wait(r.show);
      banner.classList.remove('on');
      clearFx();
      tacos.forEach((t, i) => {
        t.img.src = mg('fechado');
        hop(i);
      });
      AudioSystem.play('pickup');
      await wait(450);
      say('garcom', '¡Mezclando!');
      for (let k = 0; k < r.swaps; k++) await swap(r.ms);
      say('bella', r.peppers > 1 ? 'Só um tá seguro... qual? QUAL?' : 'Hmm... qual é o seguro?', 'b-pensa');
      busy = false;
      picking = true;
      setCursor(1);
    };

    const choose = async (i: number) => {
      if (!picking || busy) return;
      picking = false;
      busy = true;
      setCursor(cursor);
      const hot = peppers.has(i);
      tacos[i].img.src = mg(hot ? 'pimenta' : 'aberto');
      hop(i);
      if (!hot) {
        fx(i, 'brilho');
        AudioSystem.play('quest');
        dots.querySelectorAll('i')[round].classList.add('ok');
        say('bella', ['Ufa! Esse tá seguro. Hmm, que delícia.', 'Achei! Sem pimenta. Toma, Weng.', 'Eu sou boa nisso. Muito boa.', 'Ha! Nem tremi.', 'Olho de águia. Pode chamar.'][round % 5], 'b-feliz');
      } else {
        lives--;
        renderLives();
        livesEl.classList.remove('hit');
        void livesEl.offsetWidth;
        livesEl.classList.add('hit');
        fx(i, 'fogo');
        AudioSystem.play('cancel');
        stage.classList.remove('bg-shake');
        void stage.offsetWidth;
        stage.classList.add('bg-shake');
        dots.querySelectorAll('i')[round].classList.add('bad');
        say('bella', ['AAAAAI! ÁGUA! ÁGUA!', 'TÁ PEGANDO FOGO, WENG!', 'Eu vou chorar. Tô chorando.', 'Por que você faz isso comigo?!'][round % 4], 'b-fogo');
        await wait(1000);
        say('weng', lives > 0 ? '(rindo tanto que nem consegue falar) ...toma a água, toma.' : '...Três pimentas. Ela vai me matar.', lives > 0 ? 'w-ri' : 'w-orgulho');
      }
      await wait(1000);
      // mostra onde estavam as pimentas
      tacos.forEach((t, k) => {
        if (k !== i) t.img.src = mg(peppers.has(k) ? 'pimenta' : 'aberto');
      });
      if (hot && lives > 0) fx(i, 'agua');
      await wait(1300);
      if (lives <= 0) return lose();
      round++;
      if (round < ROUNDS.length) void playRound();
      else finish();
    };

    const lose = () => {
      busy = true;
      clearFx();
      banner.textContent = 'Três pimentas! Perdeu...';
      banner.classList.add('on');
      AudioSystem.play('cancel');
      say('bella', 'Minha boca... tá... pegando fogo. Revanche. AGORA.', 'b-fogo');
      actions.replaceChildren(
        h(
          'button',
          {
            class: 'btn primary',
            onclick: () => {
              round = 0;
              lives = LIVES;
              renderLives();
              dots.querySelectorAll('i').forEach((d) => d.classList.remove('ok', 'bad'));
              actions.replaceChildren();
              banner.classList.remove('on');
              void playRound();
            },
          },
          'Revanche',
        ),
      );
      // E / espaço / Enter também apertam o botão
      const viaKey = () => (actions.querySelector('.btn.primary') as HTMLButtonElement | null)?.click();
      setTimeout(() => InputSystem.once('minigame:interact', viaKey), 300);
      actions.addEventListener('click', () => InputSystem.off('minigame:interact', viaKey), { once: true });
    };

    const finish = () => {
      finished = true;
      clearFx();
      const stars = Math.max(1, lives);
      banner.textContent = lives === LIVES ? 'Nenhuma pimenta!' : `Sobreviveu com ${lives} ♥`;
      banner.classList.add('on');
      if (stars === 3) say('garcom', '¡Increíble! Nenhuma pimenta. Essa señorita tem olho de águia.');
      else if (stars === 2) say('bella', 'Comi uma pimentinha... mas ganhei. Isso que importa.', 'b-feliz');
      else say('weng', 'Por um fio! Eu nunca ri tanto num encontro.', 'w-ri');
      AudioSystem.play('quest');
      actions.replaceChildren(
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('button', { class: 'btn primary', onclick: close }, 'Comer ♥'),
      );
      const result = { stars, mistakes: LIVES - lives };
      function close() {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve(result);
      }
      InputSystem.once('minigame:interact', close);
    };

    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || finished) return;
      if (!picking) {
        if (startBtn.isConnected && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE')) begin();
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') setCursor(cursor - 1);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') setCursor(cursor + 1);
      else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') void choose(pos.indexOf(cursor));
      else if (/^Digit[123]$/.test(e.code)) void choose(pos.indexOf(Number(e.code.slice(5)) - 1));
    };
    window.addEventListener('keydown', onKey);
    const begin = () => {
      if (!startBtn.isConnected) return;
      startBtn.remove();
      void playRound();
    };
    startBtn.addEventListener('click', begin);
    place();
    renderLives();
    say('weng', 'Vou esconder pimenta nos tacos. Você tem 3 vidas: comeu 3 pimentas, perdeu. Nas últimas rodadas... são DUAS.');

    function cleanup() {
      window.removeEventListener('keydown', onKey);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
