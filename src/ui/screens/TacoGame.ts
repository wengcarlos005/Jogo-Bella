import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Noite do Taco (restaurante mexicano, 2º encontro).
 *
 * Os ingredientes caem do teto (com papel picado e tudo); mova a tortilha (← →, A D, mouse ou toque)
 * pra pegar só o que o pedido pede. Ingrediente errado ou cacto = erro. A bebida da casa apaga um erro.
 * 3 rodadas: o taco da Bella (montado pelo Weng), o taco do Weng (pimenta demais) e um pra dividir.
 * Estrelas: até 2 erros = 3, até 5 = 2, senão 1.
 *
 * Sprites opcionais: taco-<id> (art-source/minigames/tacos.webp); sem eles, usa emoji.
 */
type Ing = 'carne' | 'queijo' | 'guaca' | 'tomate' | 'cebola' | 'alface' | 'milho' | 'pimenta' | 'limao' | 'cacto' | 'bebida';

const INFO: Record<Ing, { name: string; emoji: string }> = {
  carne: { name: 'Carne', emoji: '🥩' },
  queijo: { name: 'Queijo', emoji: '🧀' },
  guaca: { name: 'Guacamole', emoji: '🥑' },
  tomate: { name: 'Tomate', emoji: '🍅' },
  cebola: { name: 'Cebola', emoji: '🧅' },
  alface: { name: 'Alface', emoji: '🥬' },
  milho: { name: 'Milho', emoji: '🌽' },
  pimenta: { name: 'Pimenta', emoji: '🌶️' },
  limao: { name: 'Limão', emoji: '🍋' },
  cacto: { name: 'Cacto', emoji: '🌵' },
  bebida: { name: 'Bebida da casa', emoji: '🍹' },
};
const FOODS: Ing[] = ['carne', 'queijo', 'guaca', 'tomate', 'cebola', 'alface', 'milho', 'pimenta', 'limao'];

interface Round {
  title: string;
  by: string;
  need: Partial<Record<Ing, number>>;
  speed: number;
  intro: string;
  done: string;
}
const ROUNDS: Round[] = [
  {
    title: 'O taco da Bella',
    by: 'O Weng monta pra ela',
    need: { carne: 2, queijo: 2, guaca: 1 },
    speed: 1,
    intro: 'Weng: "Muito queijo, guacamole... e NADA de pimenta. Eu presto atenção, viu?"',
    done: 'Bella: "Você decorou meu taco?! Esse homem presta atenção."',
  },
  {
    title: 'O taco do Weng',
    by: 'A Bella monta pra ele',
    need: { carne: 2, pimenta: 3, cebola: 1 },
    speed: 1.25,
    intro: 'Bella: "Ele quer TRÊS pimentas. Esse menino vai pegar fogo."',
    done: 'Weng: "(chorando de pimenta) Perfeito. Tá perfeito. Me dá a bebida."',
  },
  {
    title: 'O taco pra dividir',
    by: 'Os dois juntos',
    need: { carne: 1, queijo: 1, guaca: 1, tomate: 1, milho: 1, limao: 1 },
    speed: 1.5,
    intro: 'Garçom: "Y el último... um de cada! Pra dividir, como os enamorados."',
    done: 'Os dois: "...Metade é minha." "Metade é MINHA."',
  },
];

export interface TacoResult {
  stars: number;
  mistakes: number;
}

interface Falling {
  el: HTMLElement;
  id: Ing;
  x: number;
  y: number;
  v: number;
  spin: number;
}

export function playTacoGame(parent: HTMLElement, opts: { title?: string } = {}): Promise<TacoResult> {
  return new Promise((resolve) => {
    let round = 0;
    let mistakes = 0;
    let got: Partial<Record<Ing, number>> = {};
    let tx = 50;
    let target = 50;
    let left = false;
    let right = false;
    let running = false;
    let finished = false;
    let spawnIn = 0.6;
    let timeLeft = 30;
    let last = 0;
    let raf = 0;
    const items: Falling[] = [];

    const icon = (id: Ing, cls = '') => {
      const url = textureURL(`taco-${id}`);
      return url ? h('img', { class: `tc-ico ${cls}`, src: url, alt: INFO[id].name }) : h('span', { class: `tc-ico tc-emo ${cls}` }, INFO[id].emoji);
    };

    const bg = textureURL('map-piabeta-mexicano-bg');
    const pile = h('div', { class: 'tc-pile' });
    const tortillaUrl = textureURL('taco-tortilha');
    const tortilla = h('div', { class: 'tc-tortilla' }, tortillaUrl ? h('img', { class: 'tc-tort-img', src: tortillaUrl, alt: '' }) : h('div', { class: 'tc-tort-css' }), pile);
    const banner = h('div', { class: 'tc-banner' });
    const clock = h('div', { class: 'tc-clock' });
    const bunting = h('div', { class: 'tc-bunting' }, ...Array.from({ length: 14 }, (_, i) => h('i', { style: `--c:${['#ff5a7a', '#ffd23f', '#3ec1d3', '#7bd36b', '#ff8c3a', '#b36bff'][i % 6]}` })));
    const stage = h('div', { class: 'tc-stage' }, bg ? h('div', { class: 'tc-bg', style: `background-image:url(${bg})` }) : null, bunting, tortilla, banner, clock);
    const orderEl = h('div', { class: 'tc-order' });
    const roundEl = h('div', { class: 'tc-round' });
    const errEl = h('div', { class: 'tc-err' });
    const msg = h('div', { class: 'gp-bubble tc-msg' });
    const btnL = h('button', { class: 'tc-arrow', 'aria-label': 'Esquerda' }, '◀');
    const btnR = h('button', { class: 'tc-arrow', 'aria-label': 'Direita' }, '▶');
    const startBtn = h('button', { class: 'btn primary gp-start' }, '🌮 Bora montar!');
    const actions = h('div', { class: 'bg-actions' }, btnL, startBtn, btnR);
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel tc-panel' },
      h('div', { class: 'bg-title tc-title' }, opts.title ?? '🌮 Noite do Taco 🌵'),
      h('div', { class: 'tc-main' }, stage, h('div', { class: 'tc-side' }, roundEl, orderEl, errEl)),
      msg,
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen tc-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const say = (t: string) => {
      msg.textContent = t;
      msg.classList.remove('pop');
      void msg.offsetWidth;
      msg.classList.add('pop');
    };
    const R = () => ROUNDS[round];
    const missing = () => (Object.keys(R().need) as Ing[]).filter((k) => (got[k] ?? 0) < (R().need[k] ?? 0));
    const renderOrder = () => {
      roundEl.replaceChildren(h('b', {}, `${round + 1}/3 · ${R().title}`), h('small', {}, R().by));
      orderEl.replaceChildren(
        ...(Object.keys(R().need) as Ing[]).map((k) => {
          const n = R().need[k]!;
          const g = Math.min(n, got[k] ?? 0);
          return h('div', { class: `tc-line ${g >= n ? 'ok' : ''}` }, icon(k), h('span', {}, INFO[k].name), h('b', {}, `${g}/${n}`));
        }),
      );
      errEl.textContent = `Erros: ${mistakes}`;
    };
    const place = () => {
      tortilla.style.left = `${tx}%`;
    };

    const startRound = () => {
      got = {};
      pile.replaceChildren();
      tortilla.classList.remove('fold');
      for (const it of items) it.el.remove();
      items.length = 0;
      timeLeft = 30;
      renderOrder();
      banner.textContent = `${R().title}!`;
      banner.classList.add('on');
      say(R().intro);
      running = false;
      setTimeout(() => {
        banner.classList.remove('on');
        running = true;
        last = 0;
      }, 1500);
    };

    const spawn = () => {
      const miss = missing();
      let id: Ing;
      const r = Math.random();
      if (r < 0.07) id = 'bebida';
      else if (r < 0.17) id = 'cacto';
      else if (r < 0.62 && miss.length) id = miss[Math.floor(Math.random() * miss.length)];
      else id = FOODS[Math.floor(Math.random() * FOODS.length)];
      const el = h('div', { class: 'tc-fall' }, icon(id));
      const x = 8 + Math.random() * 84;
      el.style.left = `${x}%`;
      el.style.top = '-10%';
      stage.append(el);
      items.push({ el, id, x, y: -10, v: (30 + Math.random() * 12) * R().speed, spin: (Math.random() - 0.5) * 200 });
    };

    const pop = (x: number, y: number, text: string, good: boolean) => {
      const e = h('div', { class: `tc-pop ${good ? 'good' : 'bad'}`, style: `left:${x}%;top:${y}%` }, text);
      stage.append(e);
      setTimeout(() => e.remove(), 800);
    };

    const catchIt = (it: Falling) => {
      if (it.id === 'bebida') {
        mistakes = Math.max(0, mistakes - 1);
        AudioSystem.play('quest');
        pop(it.x, 70, '🍹 -1 erro', true);
        say('Garçom: "¡Bebida de la casa! Cortesia pro casal."');
      } else if (it.id === 'cacto') {
        mistakes++;
        AudioSystem.play('cancel');
        pop(it.x, 70, 'AI! 🌵', false);
        tortilla.classList.remove('bg-shake');
        void tortilla.offsetWidth;
        tortilla.classList.add('bg-shake');
        say('Bella: "CACTO NÃO! Quem jogou um cacto?!"');
      } else if ((got[it.id] ?? 0) < (R().need[it.id] ?? 0)) {
        got[it.id] = (got[it.id] ?? 0) + 1;
        AudioSystem.play('pickup');
        pop(it.x, 70, '+1', true);
        const p = icon(it.id, 'tc-in');
        p.style.setProperty('--dx', `${((pile.childElementCount * 37) % 60) - 30}%`);
        p.style.setProperty('--r', `${((pile.childElementCount * 53) % 60) - 30}deg`);
        pile.append(p);
      } else {
        mistakes++;
        AudioSystem.play('cancel');
        pop(it.x, 70, '✗', false);
        say(it.id === 'pimenta' && round === 0 ? 'Bella: "PIMENTA NO MEU?! Weng!"' : `${INFO[it.id].name} não tava no pedido...`);
      }
      renderOrder();
      if (!missing().length) endRound(true);
    };

    const endRound = (complete: boolean) => {
      running = false;
      if (!complete) mistakes += missing().reduce((s, k) => s + (R().need[k]! - (got[k] ?? 0)), 0);
      for (const it of items) it.el.remove();
      items.length = 0;
      tortilla.classList.add('fold');
      AudioSystem.play(complete ? 'confirm' : 'cancel');
      say(complete ? R().done : 'Garçom: "Ay, o tempo acabou! Vai assim mesmo, meio vazio."');
      renderOrder();
      setTimeout(() => {
        round++;
        if (round < ROUNDS.length) startRound();
        else finish();
      }, 1900);
    };

    const finish = () => {
      finished = true;
      const stars = mistakes <= 2 ? 3 : mistakes <= 5 ? 2 : 1;
      say(stars === 3 ? 'Garçom: "¡Magnífico! Vocês montam taco melhor que meu chef."' : stars === 2 ? 'Bella: "Ficou meio torto... mas foi a gente que fez."' : 'Weng: "Tem cacto no meu taco. Eu tô feliz mesmo assim."');
      AudioSystem.play('quest');
      actions.replaceChildren(
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('button', { class: 'btn primary', onclick: close }, 'Comer ♥'),
      );
      const result = { stars, mistakes };
      function close() {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve(result);
      }
      InputSystem.once('minigame:interact', close);
    };

    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (left) target -= 95 * dt;
      if (right) target += 95 * dt;
      target = Math.max(9, Math.min(91, target));
      tx += (target - tx) * Math.min(1, dt * 14);
      place();
      if (running) {
        timeLeft -= dt;
        clock.textContent = `⏱ ${Math.max(0, Math.ceil(timeLeft))}`;
        clock.classList.toggle('hurry', timeLeft < 8);
        spawnIn -= dt;
        if (spawnIn <= 0) {
          spawn();
          spawnIn = (0.62 + Math.random() * 0.35) / R().speed;
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.v * dt;
          it.el.style.top = `${it.y}%`;
          it.el.style.transform = `translate(-50%, -50%) rotate(${(it.y * it.spin) / 60}deg)`;
          if (it.y > 74 && it.y < 88 && Math.abs(it.x - tx) < 10) {
            it.el.remove();
            items.splice(i, 1);
            catchIt(it);
            if (!running) break;
          } else if (it.y > 110) {
            it.el.remove();
            items.splice(i, 1);
          }
        }
        if (running && timeLeft <= 0) endRound(false);
      }
      raf = requestAnimationFrame(tick);
    };

    // controles
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame') return;
      const down = e.type === 'keydown';
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') left = down;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') right = down;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      target = ((e.clientX - r.left) / r.width) * 100;
    });
    stage.addEventListener('pointerdown', (e) => {
      const r = stage.getBoundingClientRect();
      target = ((e.clientX - r.left) / r.width) * 100;
    });
    const hold = (b: HTMLElement, set: (v: boolean) => void) => {
      b.addEventListener('pointerdown', () => set(true));
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => set(false));
    };
    hold(btnL, (v) => (left = v));
    hold(btnR, (v) => (right = v));

    const begin = () => {
      if (finished || startBtn.isConnected === false) return;
      InputSystem.off('minigame:interact', begin);
      startBtn.remove();
      startRound();
    };
    startBtn.addEventListener('click', begin);
    InputSystem.once('minigame:interact', begin);
    renderOrder();
    say('Pegue só o que o pedido pede! Fuja dos cactos 🌵. A bebida da casa 🍹 apaga um erro.');
    place();
    raf = requestAnimationFrame(tick);

    function cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
