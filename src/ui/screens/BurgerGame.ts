import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame 1 — Montagem de hambúrguer (Rota 66).
 *
 *  - 'livre': a Bella monta o próprio lanche. Começa no pão de baixo, 2–6 recheios,
 *    termina no pão de cima. Sem erro possível; o Weng comenta as escolhas.
 *  - 'memoria': o pedido é mostrado por alguns segundos e depois some. Ingrediente
 *    errado = tremidinha + erro. "Lembrar pedido" mostra de novo (custa estrela).
 *
 * Controles: clique/toque nos ingredientes, teclas 1–0, Backspace desfaz (modo livre),
 * Enter/E serve (modo livre).
 */
export const INGREDIENTS = [
  { id: 'pao-baixo', name: 'Pão de baixo' },
  { id: 'carne', name: 'Hambúrguer' },
  { id: 'queijo', name: 'Queijo' },
  { id: 'alface', name: 'Alface' },
  { id: 'tomate', name: 'Tomate' },
  { id: 'cebola', name: 'Cebola' },
  { id: 'bacon', name: 'Bacon' },
  { id: 'picles', name: 'Picles' },
  { id: 'molho', name: 'Molho' },
  { id: 'pao-cima', name: 'Pão de cima' },
] as const;

export type IngredientId = (typeof INGREDIENTS)[number]['id'];

export interface BurgerResult {
  layers: IngredientId[];
  stars: number;
  mistakes: number;
  hints: number;
}

export interface BurgerOptions {
  mode: 'livre' | 'memoria';
  title: string;
  /** Pedido alvo (modo memória), de baixo para cima. */
  order?: IngredientId[];
  /** Quem fala o pedido / comenta. */
  helper?: string;
  /** Tempo (ms) que o pedido fica visível no modo memória. */
  showMs?: number;
}

const name = (id: IngredientId) => INGREDIENTS.find((i) => i.id === id)!.name;

export function playBurgerGame(parent: HTMLElement, opts: BurgerOptions): Promise<BurgerResult> {
  return new Promise((resolve) => {
    const layers: IngredientId[] = [];
    let mistakes = 0;
    let hints = 0;
    let done = false;
    const order = opts.order ?? [];

    const stack = h('div', { class: 'bg-stack' });
    const plate = h('div', { class: 'bg-plate' }, stack);
    const msg = h('div', { class: 'bg-msg' });
    const ticket = h('div', { class: 'bg-ticket' });
    const buttons = h('div', { class: 'bg-buttons' });
    const actions = h('div', { class: 'bg-actions' });
    const panel = h(
      'div',
      { class: 'bg-panel panel' },
      h('div', { class: 'bg-title' }, opts.title),
      h('div', { class: 'bg-main' }, ticket, plate),
      msg,
      buttons,
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const say = (text: string) => {
      msg.textContent = text;
    };

    const renderStack = () => {
      stack.replaceChildren(
        ...layers.map((id, i) => {
          const url = textureURL(`burger-${id}`);
          const el = url ? h('img', { src: url, alt: name(id), class: `bg-layer bg-${id}` }) : h('div', { class: 'bg-layer bg-fallback' }, name(id));
          el.style.zIndex = String(i + 1);
          return el;
        }),
      );
    };

    const showOrder = (visible: boolean) => {
      ticket.replaceChildren(h('div', { class: 'bg-ticket-head' }, opts.mode === 'livre' ? 'Monte do seu jeito' : 'Pedido do Weng'));
      if (opts.mode === 'livre') {
        ticket.append(
          h('div', { class: 'bg-rule' }, '1. Comece pelo pão de baixo'),
          h('div', { class: 'bg-rule' }, '2. Escolha de 2 a 6 recheios'),
          h('div', { class: 'bg-rule' }, '3. Feche com o pão de cima'),
        );
        return;
      }
      order.forEach((id, i) => {
        const doneLayer = i < layers.length;
        ticket.append(
          h('div', { class: `bg-line ${doneLayer ? 'ok' : ''}` }, visible || doneLayer ? `${doneLayer ? '✔' : '•'} ${name(id)}` : '• ???'),
        );
      });
    };

    const finish = () => {
      done = true;
      const stars = opts.mode === 'livre' ? 3 : Math.max(1, 3 - mistakes - hints);
      AudioSystem.play('quest');
      buttons.replaceChildren();
      actions.replaceChildren(
        h('div', { class: 'bg-stars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
        h('button', { class: 'btn primary', onclick: close }, 'Servir ♥'),
      );
      setTimeout(() => (actions.querySelector('button') as HTMLButtonElement | null)?.focus(), 50);
      const result = { layers: [...layers], stars, mistakes, hints };
      function close() {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve(result);
      }
      InputSystem.once('minigame:interact', close);
    };

    const shake = () => {
      plate.classList.remove('bg-shake');
      void plate.offsetWidth;
      plate.classList.add('bg-shake');
    };

    const add = (id: IngredientId) => {
      if (done) return;
      if (opts.mode === 'memoria') {
        const expected = order[layers.length];
        if (id !== expected) {
          mistakes++;
          AudioSystem.play('cancel');
          shake();
          say(mistakes === 1 ? `Hmm... ${name(id)}? Acho que não era isso.` : `Não era ${name(id).toLowerCase()}...`);
          return;
        }
        layers.push(id);
        AudioSystem.play('pickup');
        say('');
        renderStack();
        showOrder(false);
        if (layers.length === order.length) {
          say(mistakes === 0 && hints === 0 ? 'Exatamente como eu pedi! Você presta atenção, hein?' : 'Ficou perfeito. Do jeitinho que eu gosto!');
          finish();
        }
        return;
      }
      // modo livre
      const fillings = layers.length - 1;
      if (layers.length === 0 && id !== 'pao-baixo') {
        AudioSystem.play('cancel');
        shake();
        say('Primeiro o pão de baixo!');
        return;
      }
      if (layers.length > 0 && id === 'pao-baixo') {
        say('Pão de baixo duas vezes? Ousado. Mas não.');
        AudioSystem.play('cancel');
        return;
      }
      if (id === 'pao-cima') {
        if (fillings < 2) {
          AudioSystem.play('cancel');
          shake();
          say('Coloca pelo menos 2 recheios antes de fechar!');
          return;
        }
        layers.push(id);
        AudioSystem.play('pickup');
        renderStack();
        say(commentFree(layers));
        finish();
        return;
      }
      if (fillings >= 6) {
        AudioSystem.play('cancel');
        say('Mais que isso não cabe na boca! Fecha com o pão de cima.');
        return;
      }
      layers.push(id);
      AudioSystem.play('pickup');
      renderStack();
      say(reactFree(id, layers));
    };

    const undo = () => {
      if (done || opts.mode !== 'livre' || layers.length === 0) return;
      layers.pop();
      AudioSystem.play('blip');
      renderStack();
      say('');
    };

    INGREDIENTS.forEach((ing, i) => {
      const url = textureURL(`burger-${ing.id}`);
      const b = h(
        'button',
        { class: 'bg-btn', title: ing.name, 'aria-label': ing.name },
        url ? h('img', { src: url, alt: '' }) : null,
        h('span', { class: 'bg-key' }, String((i + 1) % 10)),
        h('span', { class: 'bg-name' }, ing.name),
      );
      b.addEventListener('click', () => add(ing.id));
      buttons.append(b);
    });

    if (opts.mode === 'livre') {
      actions.append(h('button', { class: 'btn small', onclick: undo }, '↶ Desfazer'));
      say('Escolha os ingredientes!');
    } else {
      const hintBtn = h('button', { class: 'btn small' }, 'Lembrar pedido');
      hintBtn.addEventListener('click', () => {
        if (done) return;
        hints++;
        showOrder(true);
        say(`${opts.helper ?? 'Weng'}: "De novo? Tá bom..."`);
        setTimeout(() => !done && showOrder(false), 2200);
      });
      actions.append(hintBtn);
      say('Memorize o pedido!');
      buttons.classList.add('bg-locked');
      setTimeout(() => {
        showOrder(false);
        buttons.classList.remove('bg-locked');
        say('Agora monte de memória!');
      }, opts.showMs ?? 5000);
    }
    showOrder(true);
    renderStack();

    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || done) return;
      if (/^Digit[0-9]$/.test(e.code)) {
        const n = Number(e.code.slice(5));
        const idx = n === 0 ? 9 : n - 1;
        if (!buttons.classList.contains('bg-locked')) add(INGREDIENTS[idx].id);
      } else if (e.code === 'Backspace') {
        undo();
      }
    };
    window.addEventListener('keydown', onKey);

    function cleanup() {
      window.removeEventListener('keydown', onKey);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}

function reactFree(id: IngredientId, layers: IngredientId[]): string {
  const lines: Partial<Record<IngredientId, string>> = {
    picles: 'Weng: "Picles! Corajosa."',
    cebola: 'Weng: "Cebola no primeiro encontro... confiança total."',
    bacon: 'Weng: "Bacon. Excelente escolha. Aprovado."',
    molho: 'Weng: "Molho é sempre uma boa ideia."',
    alface: 'Weng: "Alface pra dizer que é saudável, né?"',
  };
  if (layers.filter((l) => l === id).length > 1) return `Weng: "Dose dupla de ${name(id).toLowerCase()}? Respeito."`;
  return lines[id] ?? '';
}

function commentFree(layers: IngredientId[]): string {
  const fillings = layers.length - 2;
  if (fillings >= 6) return 'Weng: "Isso é um hambúrguer ou um prédio?"';
  if (layers.includes('cebola')) return 'Weng: "Lindo. E eu nem ligo pra cebola."';
  return 'Weng: "Ficou com cara de hambúrguer de propaganda!"';
}
