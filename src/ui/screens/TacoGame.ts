import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Taco Roleta (restaurante mexicano, 2º encontro).
 *
 * O Weng esconde uma pimenta dentro de um dos 3 tacos e o garçom embaralha os pratos.
 * Siga com o olho e escolha um taco SEM pimenta pra Bella (que odeia pimenta).
 * 5 rodadas, cada vez mais rápidas; na última é a vingança: achar o taco COM pimenta pro Weng.
 * Estrelas: 5 acertos = 3, 3–4 = 2, senão 1.
 *
 * Controles: clique/toque no taco, ou ← → pra escolher e espaço/E pra confirmar (ou 1, 2, 3).
 * Sprites: assets/minigames/taco-*.png (art-source/minigames/taco-roleta.webp).
 * Reações: retratos da Bella e do Weng (trocar pelos bustos de sombreiro quando chegarem).
 */
export interface TacoResult {
  stars: number;
  mistakes: number;
}

const ROUNDS = [
  { swaps: 3, ms: 620, show: 1700, intro: 'Weng: "Uma dessas tem pimenta. Só uma. Boa sorte, amor."' },
  { swaps: 5, ms: 520, show: 1400, intro: 'Garçom: "¡Otra vez! Agora eu embaralho mais rápido, señorita."' },
  { swaps: 7, ms: 430, show: 1200, intro: 'Weng: "Essa pimenta é das brabas. Presta atenção..."' },
  { swaps: 9, ms: 340, show: 1000, intro: 'Garçom: "¡Rápido, rápido, rápido!"' },
  { swaps: 10, ms: 300, show: 1000, revenge: true, intro: 'Bella: "Agora é a MINHA vez. Garçom, esconde a pimenta pra ele!"' },
];
const X = [20, 50, 80];

export function playTacoGame(parent: HTMLElement, opts: { title?: string } = {}): Promise<TacoResult> {
  return new Promise((resolve) => {
    const mg = (f: string) => new URL(`assets/minigames/taco-${f}.png`, document.baseURI).href;
    for (const f of ['prato', 'fechado', 'aberto', 'pimenta', 'fogo', 'brilho', 'agua', 'sombreiro', 'duvida']) new Image().src = mg(f);
    let round = 0;
    let hits = 0;
    let pepper = 0; // índice do taco (0..2) que tem a pimenta
    let pos = [0, 1, 2]; // pos[taco] = coluna
    let picking = false;
    let cursor = 1;
    let finished = false;

    const tacos = [0, 1, 2].map((i) => {
      const img = h('img', { class: 'tr-taco', src: mg('aberto'), alt: '' }) as HTMLImageElement;
      const slot = h('button', { class: 'tr-slot', 'aria-label': `Taco ${i + 1}` }, h('img', { class: 'tr-plate', src: mg('prato'), alt: '' }), img, h('img', { class: 'tr-fx', alt: '' }));
      slot.addEventListener('click', () => choose(i));
      return { slot, img, fx: slot.querySelector('.tr-fx') as HTMLImageElement };
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
    const face = h('img', { class: 'tr-face', alt: '' }) as HTMLImageElement;
    const msg = h('div', { class: 'gp-bubble tr-msg' });
    const dots = h('div', { class: 'tr-dots' }, ...ROUNDS.map(() => h('i')));
    const startBtn = h('button', { class: 'btn primary gp-start' }, '🌮 Começar');
    const actions = h('div', { class: 'bg-actions' }, startBtn);
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel tr-panel' },
      h('div', { class: 'bg-title tr-title' }, h('img', { src: mg('sombreiro'), alt: '' }), opts.title ?? 'Taco Roleta', h('img', { src: mg('sombreiro'), alt: '' })),
      dots,
      stage,
      h('div', { class: 'tr-talk' }, face, msg),
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen tr-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    // bustos de sombreiro (art-source/minigames/taco-bustos.webp); o garçom usa o retrato
    type Mood = 'b-pensa' | 'b-feliz' | 'b-fogo' | 'w-malandro' | 'w-ri' | 'w-orgulho';
    for (const m of ['b-pensa', 'b-feliz', 'b-fogo', 'w-malandro', 'w-ri', 'w-orgulho']) new Image().src = mg(m);
    const say = (who: 'bella' | 'weng' | 'garcom', t: string, mood?: Mood) => {
      const m: Mood | undefined = mood ?? (who === 'bella' ? 'b-pensa' : who === 'weng' ? 'w-malandro' : undefined);
      const url = m ? mg(m) : textureURL('portrait-garcom-mex') ?? textureURL('portrait-garcom');
      if (url) face.src = url;
      face.classList.toggle('bust', !!m);
      face.classList.remove('pop');
      void face.offsetWidth;
      face.classList.add('pop');
      msg.textContent = t;
      msg.classList.remove('pop');
      void msg.offsetWidth;
      msg.classList.add('pop');
    };
    const sayLine = (line: string) => {
      const m = line.match(/^(Weng|Bella|Garçom): (.*)$/);
      say(m ? (m[1] === 'Weng' ? 'weng' : m[1] === 'Bella' ? 'bella' : 'garcom') : 'garcom', m ? m[2] : line);
    };
    const place = () => tacos.forEach((t, i) => (t.slot.style.left = `${X[pos[i]]}%`));
    const setCursor = (c: number) => {
      cursor = (c + 3) % 3;
      tacos.forEach((t, i) => t.slot.classList.toggle('sel', picking && pos[i] === cursor));
    };
    const fx = (i: number, key: string | null) => {
      const el = tacos[i].fx;
      el.classList.remove('on');
      if (!key) return;
      el.src = mg(key);
      void el.offsetWidth;
      el.classList.add('on');
    };
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
      const r = R();
      dots.querySelectorAll('i').forEach((d, k) => d.classList.toggle('now', k === round));
      pos = [0, 1, 2];
      place();
      [0, 1, 2].forEach((i) => fx(i, null));
      pepper = Math.floor(Math.random() * 3);
      banner.textContent = r.revenge ? 'Vingança! Ache o taco COM pimenta' : `Rodada ${round + 1}`;
      banner.classList.add('on');
      // mostra onde está a pimenta
      tacos.forEach((t, i) => (t.img.src = mg(i === pepper ? 'pimenta' : 'aberto')));
      sayLine(r.intro);
      fx(pepper, 'duvida');
      await wait(r.show);
      banner.classList.remove('on');
      fx(pepper, null);
      // fecha os tacos
      tacos.forEach((t, i) => {
        t.img.src = mg('fechado');
        hop(i);
      });
      AudioSystem.play('pickup');
      await wait(450);
      say('garcom', '¡Mezclando!');
      for (let k = 0; k < r.swaps; k++) await swap(r.ms);
      say('bella', r.revenge ? 'Cadê a pimenta... cadê... (sorriso maligno)' : 'Hmm... qual é o seguro?', 'b-pensa');
      picking = true;
      setCursor(1);
    };

    const choose = async (i: number) => {
      if (!picking) return;
      picking = false;
      setCursor(cursor);
      const r = R();
      const hasPepper = i === pepper;
      const ok = r.revenge ? hasPepper : !hasPepper;
      tacos[i].img.src = mg(hasPepper ? 'pimenta' : 'aberto');
      hop(i);
      if (ok) {
        hits++;
        fx(i, 'brilho');
        AudioSystem.play('quest');
        if (r.revenge) say('weng', '(com a boca pegando fogo) ...É. Eu mereci essa.', 'w-orgulho');
        else say('bella', ['Ufa! Esse tá seguro. Hmm, que delícia.', 'Achei! Sem pimenta. Toma, Weng.', 'Eu sou boa nisso. Muito boa.', 'Ha! Nem tremi.'][round % 4], 'b-feliz');
      } else {
        fx(i, r.revenge ? 'x' : 'fogo');
        AudioSystem.play('cancel');
        stage.classList.remove('bg-shake');
        void stage.offsetWidth;
        stage.classList.add('bg-shake');
        if (r.revenge) say('weng', 'Hahaha! Sem pimenta! Que delícia de taco normal!', 'w-ri');
        else {
          say('bella', ['AAAAAI! ÁGUA! ÁGUA!', 'TÁ PEGANDO FOGO, WENG!', 'Eu vou chorar. Tô chorando.', 'Por que você faz isso comigo?!'][round % 4], 'b-fogo');
          await wait(900);
          say('weng', '(rindo tanto que nem consegue falar) ...toma a água, toma.', 'w-ri');
        }
      }
      dots.querySelectorAll('i')[round].classList.add(ok ? 'ok' : 'bad');
      await wait(900);
      // mostra os outros
      tacos.forEach((t, k) => {
        if (k !== i) t.img.src = mg(k === pepper ? 'pimenta' : 'aberto');
      });
      if (!ok && !r.revenge) fx(i, 'agua');
      await wait(1300);
      round++;
      if (round < ROUNDS.length) void playRound();
      else finish();
    };

    const finish = () => {
      finished = true;
      const stars = hits >= 5 ? 3 : hits >= 3 ? 2 : 1;
      [0, 1, 2].forEach((i) => fx(i, null));
      banner.textContent = `${hits}/5`;
      banner.classList.add('on');
      if (stars === 3) say('garcom', '¡Increíble! Nenhuma pimenta. Essa señorita tem olho de águia.');
      else if (stars === 2) say('bella', 'Comi umas pimentas... mas o Weng comeu mais. Isso que importa.', 'b-feliz');
      else say('weng', 'Você comeu TODAS as pimentas. Eu nunca ri tanto num encontro.', 'w-ri');
      AudioSystem.play('quest');
      actions.replaceChildren(
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('button', { class: 'btn primary', onclick: close }, 'Comer ♥'),
      );
      const result = { stars, mistakes: 5 - hits };
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
    say('weng', 'Vou esconder uma pimenta num desses tacos. Se você pegar o certo... boa. Se não... ÁGUA.');

    function cleanup() {
      window.removeEventListener('keydown', onKey);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
