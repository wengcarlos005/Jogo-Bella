import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — "Bate-Gato" (jogo de cartas de reflexo, regras próprias).
 *
 * A Bella e o Weng viram cartas no monte, falando em sequência: Meli, Pombo, Lala, Açaí, Coração.
 * Se a carta virada for igual à palavra falada, quem bater primeiro no monte ganha o ponto.
 * O novelo embolado vale sempre (bate!). Bater sem motivo perde 1 ponto.
 * 20 cartas; o Weng vai ficando mais rápido.
 *
 * Controles: Espaço/E/Enter ou clique no monte para bater.
 */
const WORDS = ['meli', 'pombo', 'lala', 'acai', 'coracao'] as const;
const LABEL: Record<string, string> = { meli: 'Meli', pombo: 'Pombo', lala: 'Lala', acai: 'Açaí', coracao: 'Coração' };
const DECK = ['meli', 'pombo', 'lala', 'acai', 'coracao', 'chocolate', 'novelo'] as const;
type Card = (typeof DECK)[number];

export interface CardResult {
  bella: number;
  weng: number;
  won: boolean;
}

export function playCardGame(parent: HTMLElement, opts: { title?: string; rounds?: number } = {}): Promise<CardResult> {
  return new Promise((resolve) => {
    const rounds = opts.rounds ?? 20;
    let bella = 0;
    let weng = 0;
    let turn = 0;
    let current: Card | null = null;
    let open = false; // janela para bater
    let slapped = false;
    let running = false;
    let finished = false;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    const word = h('div', { class: 'cg-word' }, 'Pronta?');
    const who = h('div', { class: 'cg-who' });
    const pileImg = h('img', { class: 'cg-card', alt: '', src: textureURL('carta-verso') ?? '' });
    const pile = h('button', { class: 'cg-pile', 'aria-label': 'Bater no monte' }, pileImg, h('div', { class: 'cg-hand' }, 'BATE!'));
    const msg = h('div', { class: 'cg-msg' }, 'Quando a carta for igual à palavra, BATE no monte!');
    const sb = h('b', {}, '0');
    const sw = h('b', {}, '0');
    const left = h('div', { class: 'cg-left' }, `Cartas: ${rounds}`);
    const pB = textureURL('portrait-bella');
    const pW = textureURL('portrait-weng');
    const startBtn = h('button', { class: 'btn primary' }, 'Começar');
    const actions = h('div', { class: 'bg-actions' }, startBtn);
    const panel = h(
      'div',
      { class: 'bg-panel panel cg-panel' },
      h('div', { class: 'bg-title cg-title' }, opts.title ?? 'Bate-Gato'),
      h(
        'div',
        { class: 'cg-table' },
        h('div', { class: 'cg-player' }, pB ? h('img', { src: pB, alt: '' }) : null, h('span', {}, 'Bella'), sb),
        h('div', { class: 'cg-center' }, word, who, pile, left),
        h('div', { class: 'cg-player' }, pW ? h('img', { src: pW, alt: '' }) : null, h('span', {}, 'Weng'), sw),
      ),
      msg,
      h('div', { class: 'cg-rules' }, 'Sequência: Meli → Pombo → Lala → Açaí → Coração  ·  novelo: bate sempre  ·  bater errado: −1'),
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen cg-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const score = () => {
      sb.textContent = String(bella);
      sw.textContent = String(weng);
      left.textContent = `Cartas: ${Math.max(0, rounds - turn)}`;
    };
    const pop = (el: HTMLElement, cls: string) => {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    };

    // baralho com cartas "certas" suficientes para ser divertido
    const draw = (): Card => {
      const w = WORDS[turn % WORDS.length];
      const r = Math.random();
      if (r < 0.3) return w;
      if (r < 0.38) return 'novelo';
      return DECK[Math.floor(Math.random() * DECK.length)];
    };
    const isMatch = (c: Card, w: string) => c === 'novelo' || c === w;

    const next = () => {
      if (finished) return;
      if (turn >= rounds) return end();
      const w = WORDS[turn % WORDS.length];
      word.textContent = `${LABEL[w]}!`;
      who.textContent = turn % 2 === 0 ? 'Bella vira...' : 'Weng vira...';
      pop(word, 'cg-say');
      current = draw();
      const url = textureURL(`carta-${current}`);
      if (url) pileImg.src = url;
      pop(pileImg, 'cg-flip');
      AudioSystem.play('blip');
      slapped = false;
      open = true;
      const match = isMatch(current, w);
      const speed = Math.max(420, 900 - turn * 22);
      if (match) {
        // reação do Weng (fica mais rápido)
        const react = speed * (0.7 + Math.random() * 0.5);
        later(react, () => {
          if (slapped || finished) return;
          slapped = true;
          open = false;
          weng++;
          score();
          AudioSystem.play('cancel');
          pop(pile, 'cg-slap-w');
          msg.textContent = pickW();
          later(700, step);
        });
      } else {
        // às vezes o Weng se empolga e bate errado
        if (Math.random() < 0.08) later(speed * 0.8, () => {
          if (slapped || finished) return;
          weng = Math.max(0, weng - 1);
          score();
          msg.textContent = 'Weng bateu errado! "Era Pombo, eu juro que era Pombo!"';
        });
        later(speed + 350, step);
      }
    };
    const step = () => {
      if (finished) return;
      open = false;
      turn++;
      score();
      next();
    };

    const slap = () => {
      if (!running || finished) return;
      if (slapped) return;
      const w = WORDS[turn % WORDS.length];
      if (open && current && isMatch(current, w)) {
        slapped = true;
        open = false;
        bella++;
        score();
        AudioSystem.play('pickup');
        pop(pile, 'cg-slap-b');
        msg.textContent = current === 'novelo' ? 'Novelo embolado! Bella foi mais rápida!' : pickB();
        timers.forEach((t) => clearTimeout(t));
        timers.length = 0;
        later(700, step);
      } else {
        bella = Math.max(0, bella - 1);
        score();
        AudioSystem.play('cancel');
        pop(pile, 'cg-wrong');
        msg.textContent = 'Bateu errado! −1. O Weng tá rindo da sua cara.';
      }
    };

    const B_LINES = ['Bella bateu primeiro! ♥', 'Rápida demais!', 'Weng: "Como assim?!"', 'Ponto da Bella!', 'Weng: "Eu tava distraído olhando pra você."'];
    const W_LINES = ['Weng bateu primeiro!', 'Weng: "Imbatível, eu disse."', 'Ponto do Weng...', 'Weng: "Treinei com a Meli."'];
    const pickB = () => B_LINES[Math.floor(Math.random() * B_LINES.length)];
    const pickW = () => W_LINES[Math.floor(Math.random() * W_LINES.length)];

    const end = () => {
      finished = true;
      running = false;
      timers.forEach((t) => clearTimeout(t));
      const won = bella > weng;
      word.textContent = won ? 'Vitória da Bella!' : bella === weng ? 'Empate!' : 'O Weng ganhou...';
      who.textContent = `${bella} × ${weng}`;
      msg.textContent = won ? 'Weng: "Ok... revanche amanhã. E depois de amanhã."' : bella === weng ? 'Weng: "Empate técnico. Eu aceito."' : 'Weng: "Imbatível. Mas você quase me pegou."';
      AudioSystem.play(won ? 'quest' : 'blip');
      const close = () => {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve({ bella, weng, won });
      };
      actions.replaceChildren(h('span', { class: 'bg-stars mg-end' }), h('button', { class: 'btn primary', onclick: close }, 'Guardar as cartas'));
      setTimeout(() => InputSystem.once('minigame:interact', close), 400);
    };

    const start = () => {
      if (running || finished) return;
      running = true;
      actions.replaceChildren();
      msg.textContent = '';
      later(500, next);
    };
    startBtn.addEventListener('click', start);
    pile.addEventListener('click', () => (running ? slap() : start()));
    const onInteract = () => (running ? slap() : finished ? undefined : start());
    InputSystem.on('minigame:interact', onInteract);

    function cleanup() {
      timers.forEach((t) => clearTimeout(t));
      InputSystem.off('minigame:interact', onInteract);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
