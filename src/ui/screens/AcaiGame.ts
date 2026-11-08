import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Montar o açaí da Bella (açaiteria de Duque de Caxias).
 *
 * A tigela já vem na bancada. Primeiro o açaí (1 ou 2 bolas), depois os complementos
 * (de 2 a 12, quanto mais melhor: a Bella ama açaí CHEIO de complemento), e a colher serve.
 * Estrelas: 7+ complementos = 3, 4+ = 2, senão 1.
 *
 * Controles: clique/toque, teclas 1–0 (açaí e complementos), Backspace desfaz, Enter serve (colher).
 */
export const ACAI_ITEMS = [
  { id: 'acai', name: 'Açaí' },
  { id: 'granola', name: 'Granola' },
  { id: 'banana', name: 'Banana' },
  { id: 'morango', name: 'Morango' },
  { id: 'leite-condensado', name: 'Leite cond.' },
  { id: 'leite-po', name: 'Leite em pó' },
  { id: 'pacoca', name: 'Paçoca' },
  { id: 'confete', name: 'Confete' },
  { id: 'kiwi', name: 'Kiwi' },
  { id: 'creme-avela', name: 'Creme de avelã' },
] as const;

export type AcaiItemId = (typeof ACAI_ITEMS)[number]['id'];

export interface AcaiResult {
  scoops: number;
  toppings: AcaiItemId[];
  stars: number;
}

export interface AcaiOptions {
  title: string;
  /** Quem comenta as escolhas (retrato + nome). */
  helper?: string;
}

const nameOf = (id: AcaiItemId) => ACAI_ITEMS.find((i) => i.id === id)!.name;

const REACT: Partial<Record<AcaiItemId, string>> = {
  'leite-po': 'Weng: "Leite em pó. Agora sim é açaí de verdade."',
  pacoca: 'Weng: "Paçoca no açaí é patrimônio nacional."',
  'creme-avela': 'Weng: "Creme de avelã... você não brinca em serviço."',
  kiwi: 'Weng: "Kiwi? Diferente. Gostei."',
  confete: 'Weng: "Confete! Ficou com cara de festa."',
  'leite-condensado': 'Weng: "Leite condensado por cima de tudo. Clássico."',
  morango: 'Weng: "Morango combina com você."',
  granola: 'Weng: "Granola pra dar aquela crocância."',
  banana: 'Weng: "Banana: o básico que nunca falha."',
};

export function playAcaiGame(parent: HTMLElement, opts: AcaiOptions): Promise<AcaiResult> {
  return new Promise((resolve) => {
    let scoops = 0;
    const toppings: AcaiItemId[] = [];
    const history: AcaiItemId[] = [];
    let done = false;

    const bowl = textureURL('acai-tigela');
    const domeUrl = textureURL('acai-acai');
    const toppingLayer = h('div', { class: 'ac-toppings' });
    const dome = h('img', { class: 'ac-dome', alt: '', src: domeUrl ?? '' });
    const cup = h('div', { class: 'ac-cup' }, dome, toppingLayer, bowl ? h('img', { class: 'ac-bowl', alt: '', src: bowl }) : null);
    const msg = h('div', { class: 'bg-msg' });
    const counter = h('div', { class: 'ac-count' });
    const buttons = h('div', { class: 'bg-buttons ac-buttons' });
    const actions = h('div', { class: 'bg-actions' });
    const helperPic = textureURL(`portrait-${opts.helper ?? 'weng'}`);
    const panel = h(
      'div',
      { class: 'bg-panel panel ac-panel' },
      h('div', { class: 'bg-title ac-title' }, opts.title),
      h(
        'div',
        { class: 'bg-main' },
        h('div', { class: 'bg-stage ac-stage' }, h('div', { class: 'ac-neon' }, 'AÇAÍ'), cup),
        h(
          'div',
          { class: 'bg-ticket ac-ticket' },
          h('div', { class: 'bg-ticket-head' }, 'Monte do seu jeito'),
          h('div', { class: 'bg-rule' }, '1. Coloque o açaí'),
          h('div', { class: 'bg-rule' }, '2. Capriche nos complementos'),
          h('div', { class: 'bg-rule' }, '3. Sirva com a colher'),
          counter,
          h('div', { class: 'ac-talk' }, helperPic ? h('img', { class: 'ac-helper', src: helperPic, alt: '' }) : null, msg),
        ),
      ),
      buttons,
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen ac-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const say = (t: string) => (msg.textContent = t);
    const updateCount = () => {
      counter.textContent = scoops ? `Complementos: ${toppings.length}${toppings.length >= 7 ? ' ♥' : ''}` : '';
      dome.classList.toggle('on', scoops > 0);
      dome.classList.toggle('big', scoops > 1);
    };

    const shake = () => {
      cup.classList.remove('bg-shake');
      void cup.offsetWidth;
      cup.classList.add('bg-shake');
    };

    // como num açaí de verdade: cada complemento ganha o seu "cantinho" numa faixa em arco por cima do
    // açaí (repetidos empilham no mesmo cantinho); as caldas escorrem por cima, no topo
    const SAUCE: AcaiItemId[] = ['leite-condensado', 'creme-avela'];
    const renderToppings = () => {
      const kinds = [...new Set(toppings.filter((t) => !SAUCE.includes(t)))];
      const n = kinds.length;
      const seen: Record<string, number> = {};
      toppingLayer.replaceChildren(
        ...toppings.map((id, i) => {
          const rep = (seen[id] = (seen[id] ?? 0) + 1) - 1;
          let x: number;
          let y: number;
          let w = 24;
          if (SAUCE.includes(id)) {
            // calda escorrendo no topo do açaí
            x = 50 + (rep % 2 ? 6 : -4);
            y = -6 + rep * 5;
            w = 36;
          } else {
            // cada complemento num cantinho do arco da frente do açaí (como numa tigela de verdade)
            const k = kinds.indexOf(id);
            const t = Math.PI * (n > 1 ? 0.12 + (0.76 * k) / (n - 1) : 0.5);
            x = 50 - 33 * Math.cos(t) + (rep % 2 ? 4 : -3) * Math.min(rep, 1);
            y = 16 + 16 * Math.sin(t) - rep * 7;
          }
          const url = textureURL(`acai-${id}`);
          const el = url ? h('img', { src: url, alt: nameOf(id), class: 'ac-top' }) : h('span', { class: 'ac-top' }, nameOf(id));
          el.style.left = `${x}%`;
          el.style.top = `${y}%`;
          el.style.width = `${w}%`;
          el.style.zIndex = String(SAUCE.includes(id) ? 8 + i : 40 + Math.round(y) + i);
          el.style.setProperty('--rot', `${((i * 37) % 24) - 12}deg`);
          return el;
        }),
      );
    };

    const add = (id: AcaiItemId) => {
      if (done) return;
      if (id === 'acai') {
        if (scoops >= 2) {
          AudioSystem.play('cancel');
          say('Duas bolas já tá ótimo. Agora os complementos!');
          return;
        }
        if (toppings.length) {
          AudioSystem.play('cancel');
          say('O açaí vai embaixo dos complementos!');
          return;
        }
        scoops++;
        history.push(id);
        AudioSystem.play('pickup');
        updateCount();
        say(scoops === 1 ? 'Weng: "Uma bola. E agora, o que vai por cima?"' : 'Weng: "Duas bolas?! Hoje é dia de festa."');
        return;
      }
      if (!scoops) {
        AudioSystem.play('cancel');
        shake();
        say('Primeiro o açaí na tigela!');
        return;
      }
      if (toppings.length >= 12) {
        AudioSystem.play('cancel');
        say('Weng: "Não cabe mais nada! Pega a colher."');
        return;
      }
      toppings.push(id);
      history.push(id);
      AudioSystem.play('pickup');
      renderToppings();
      updateCount();
      const reps = toppings.filter((t) => t === id).length;
      say(reps > 1 ? `Weng: "Mais ${nameOf(id).toLowerCase()}? Você é corajosa."` : toppings.length === 7 ? 'Weng: "Isso já é uma obra de arte."' : REACT[id] ?? '');
    };

    const undo = () => {
      if (done || !history.length) return;
      const last = history.pop()!;
      if (last === 'acai') scoops--;
      else toppings.pop();
      AudioSystem.play('blip');
      renderToppings();
      updateCount();
      say('');
    };

    const serve = () => {
      if (done) return;
      if (!scoops) {
        AudioSystem.play('cancel');
        shake();
        say('Tá vazio! Primeiro o açaí.');
        return;
      }
      if (toppings.length < 2) {
        AudioSystem.play('cancel');
        say('Só isso? Coloca pelo menos 2 complementos!');
        return;
      }
      done = true;
      const stars = toppings.length >= 7 ? 3 : toppings.length >= 4 ? 2 : 1;
      say(
        stars === 3
          ? 'Weng: "Isso não é um açaí, é um sonho. Do jeitinho que você gosta."'
          : stars === 2
            ? 'Weng: "Bonito! Mas eu sei que você queria mais complemento..."'
            : 'Weng: "Tá passando mal? Cadê os complementos?"',
      );
      AudioSystem.play('quest');
      const spoon = textureURL('acai-colher');
      if (spoon) cup.append(h('img', { class: 'ac-spoon', src: spoon, alt: '' }));
      buttons.replaceChildren();
      actions.replaceChildren(
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('button', { class: 'btn primary', onclick: close }, 'Comer ♥'),
      );
      setTimeout(() => (actions.querySelector('button') as HTMLButtonElement | null)?.focus(), 50);
      const result: AcaiResult = { scoops, toppings: [...toppings], stars };
      function close() {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve(result);
      }
      InputSystem.once('minigame:interact', close);
    };

    ACAI_ITEMS.forEach((it, i) => {
      const url = textureURL(`acai-${it.id}`);
      const b = h(
        'button',
        { class: 'bg-btn', title: it.name, 'aria-label': it.name },
        url ? h('img', { src: url, alt: '' }) : null,
        h('span', { class: 'bg-key' }, String((i + 1) % 10)),
        h('span', { class: 'bg-name' }, it.name),
      );
      b.addEventListener('click', () => add(it.id));
      buttons.append(b);
    });
    const spoonUrl = textureURL('acai-colher');
    actions.append(
      h('button', { class: 'btn small', onclick: undo }, '↶ Desfazer'),
      h('button', { class: 'btn primary', onclick: serve, 'aria-label': 'Servir' }, spoonUrl ? h('img', { class: 'ac-spoon-btn', src: spoonUrl, alt: '' }) : null, 'Servir'),
    );
    say('Escolha o açaí e os complementos!');
    updateCount();

    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || done) return;
      if (/^Digit[0-9]$/.test(e.code)) {
        const n = Number(e.code.slice(5));
        add(ACAI_ITEMS[n === 0 ? 9 : n - 1].id);
      } else if (e.code === 'Backspace') undo();
      else if (e.code === 'Enter') serve();
    };
    window.addEventListener('keydown', onKey);

    function cleanup() {
      window.removeEventListener('keydown', onKey);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
