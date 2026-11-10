import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { shell, type MiniResult } from './PetroGames';

/**
 * Minigame — A lista da Vó (mercadinho da esquina, Duque de Caxias).
 *
 * As prateleiras vão passando (o carrinho de roda torta andando pelo corredor). Clique nos itens da
 * lista da Vó antes que saiam da tela. Item errado = erro. A paçoca é a tentação da Bella: pegar
 * conta como "paçoca escondida" (não é erro, mas o Weng vê). 45 segundos.
 *
 * Teclado / controle: a mão do Weng fica na frente do carrinho (à esquerda). ↑ ↓ escolhe a prateleira
 * e Espaço / E pega o que estiver passando na frente da mão. O mouse continua funcionando.
 */
/** Faixa da mão (em % da prateleira): o item precisa estar passando aqui pra ser pego pelo teclado. */
const HAND = [6, 26];
type Item = { id: string; file: string; name: string };
const LIST: Item[] = [
  { id: 'ovo', file: 'cz-ovo', name: 'Ovos' },
  { id: 'leite', file: 'acai-leite-condensado', name: 'Leite condensado' },
  { id: 'creme', file: 'cz-creme', name: 'Creme de leite' },
  { id: 'queijo', file: 'cz-queijo', name: 'Queijo' },
  { id: 'banana', file: 'acai-banana', name: 'Banana' },
  { id: 'chocolate', file: 'carta-chocolate', name: 'Chocolate' },
];
const OTHERS: Item[] = [
  { id: 'cebola', file: 'cz-cebola', name: 'Cebola' },
  { id: 'alho', file: 'cz-alho', name: 'Alho' },
  { id: 'miojo', file: 'cz-miojo', name: 'Miojo' },
  { id: 'tomate', file: 'cz-tomate', name: 'Molho de tomate' },
  { id: 'batata', file: 'cz-batata', name: 'Batata palha' },
  { id: 'kiwi', file: 'acai-kiwi', name: 'Kiwi' },
  { id: 'morango', file: 'acai-morango', name: 'Morango' },
  { id: 'leitepo', file: 'acai-leite-po', name: 'Leite em pó' },
];
const PACOCA: Item = { id: 'pacoca', file: 'acai-pacoca', name: 'Paçoca' };
const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;

export function playMarketGame(parent: HTMLElement): Promise<MiniResult & { pacoca: boolean }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'mk', 'A lista da Vó');
    const got = new Set<string>();
    let mistakes = 0;
    let pacoca = false;
    let time = 45;
    let running = false;
    let last = 0;
    let raf = 0;
    let spawnIn = [0.2, 0.9, 1.6];
    const rows = [0, 1, 2].map((r) => h('div', { class: `mk-row r${r}` }));
    let rowSel = 1;
    const hand = h('div', { class: 'mk-hand' });
    const placeHand = () => {
      rows.forEach((r, i) => r.classList.toggle('sel', i === rowSel));
      rows[rowSel].append(hand);
    };
    placeHand();
    const list = h('div', { class: 'mk-list' });
    ui.stage.append(h('div', { class: 'mk-shelves' }, ...rows), list);
    const live: { el: HTMLElement; it: Item; x: number; row: number }[] = [];
    const SPEED = [9, 12, 10.5];

    const renderList = () =>
      list.replaceChildren(h('b', {}, 'Lista da Vó'), ...LIST.map((i) => h('div', { class: got.has(i.id) ? 'ok' : '' }, h('img', { src: mg(i.file), alt: '' }), i.name)));
    const hud = () =>
      ui.hud.replaceChildren(h('span', {}, `Tempo: ${Math.max(0, Math.ceil(time))}s`), h('span', {}, `${got.size}/${LIST.length}`), h('span', { class: 'pg-err' }, mistakes ? `Erros: ${mistakes}` : ''));
    renderList();
    hud();

    const spawn = (row: number) => {
      const missing = LIST.filter((i) => !got.has(i.id));
      const r = Math.random();
      const it = r < 0.08 && !pacoca ? PACOCA : r < 0.55 && missing.length ? missing[Math.floor(Math.random() * missing.length)] : OTHERS[Math.floor(Math.random() * OTHERS.length)];
      const el = h('img', { class: 'mk-item', src: mg(it.file), alt: it.name, title: it.name }) as HTMLImageElement;
      el.addEventListener('pointerdown', () => grab(el, it));
      rows[row].append(el);
      live.push({ el, it, x: 104, row });
    };
    const grab = (el: HTMLElement, it: Item) => {
      if (!running || el.classList.contains('gone')) return;
      el.classList.add('gone');
      if (it.id === 'pacoca') {
        pacoca = true;
        AudioSystem.play('pickup');
        ui.say('weng', 'Eu vi essa paçoca entrando no carrinho.');
        setTimeout(() => ui.say('bella', 'Que paçoca? Não tem paçoca nenhuma. Olha pro outro lado.'), 1300);
        return;
      }
      if (LIST.some((i) => i.id === it.id) && !got.has(it.id)) {
        got.add(it.id);
        AudioSystem.play('pickup');
        renderList();
        hud();
        ui.say('weng', got.size === LIST.length ? 'Tudo da lista! A Vó vai ficar orgulhosa.' : `${it.name}, check. Faltam ${LIST.length - got.size}.`);
        if (got.size === LIST.length) setTimeout(() => finish(), 900);
        return;
      }
      mistakes++;
      AudioSystem.play('cancel');
      ui.shake();
      hud();
      ui.say('weng', got.has(it.id) ? `${it.name} a gente já pegou, amor.` : `${it.name}? Não tá na lista da Vó.`);
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        time -= dt;
        for (let r = 0; r < 3; r++) {
          spawnIn[r] -= dt;
          if (spawnIn[r] <= 0) {
            spawn(r);
            spawnIn[r] = 1.6 + Math.random() * 1.2;
          }
        }
        for (let i = live.length - 1; i >= 0; i--) {
          const o = live[i];
          o.x -= SPEED[o.row] * dt;
          o.el.style.left = `${o.x}%`;
          if (o.x < -12) {
            o.el.remove();
            live.splice(i, 1);
          }
        }
        hud();
        if (time <= 0) finish();
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      const missing = LIST.length - got.size;
      const score = mistakes + missing * 2;
      const stars = score <= 1 ? 3 : score <= 4 ? 2 : 1;
      ui.say('bella', missing ? `Esquecemos ${missing === 1 ? 'uma coisa' : `${missing} coisas`}... a Vó vai improvisar.` : 'Lista completa! E a moça do caixa perguntou se a gente é casado...');
      ui.end(stars, 'Pagar e voltar', () => resolve({ stars, mistakes, pacoca }));
    };
    const grabKey = () => {
      // o item da prateleira escolhida que está passando na frente da mão (o mais perto do meio dela)
      const mid = (HAND[0] + HAND[1]) / 2;
      const cands = live.filter((o) => o.row === rowSel && o.x >= HAND[0] - 2 && o.x <= HAND[1] && !o.el.classList.contains('gone'));
      if (!cands.length) {
        hand.classList.remove('miss');
        void hand.offsetWidth;
        hand.classList.add('miss');
        return;
      }
      cands.sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid));
      grab(cands[0].el, cands[0].it);
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      const act = e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter';
      if (!running) {
        if (act && start.isConnected) {
          e.preventDefault();
          begin();
        }
        return;
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') rowSel = Math.max(0, rowSel - 1);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') rowSel = Math.min(2, rowSel + 1);
      else if (act) grabKey();
      else return;
      e.preventDefault();
      placeHand();
    };
    window.addEventListener('keydown', onKey);
    const start = h('button', { class: 'btn primary' }, 'Empurrar o carrinho');
    ui.actions.append(start);
    const begin = () => {
      if (running || !start.isConnected) return;
      start.remove();
      running = true;
      ui.say('weng', 'Escolhe a prateleira e pega o que tá na lista quando passar na frente da mão. Rápido, que esse carrinho tem vontade própria!');
    };
    start.addEventListener('click', begin);
    ui.say('bella', 'Ovos, leite condensado, creme de leite, queijo, banana e chocolate. A Vó vai fazer bolinho pra mim!');
    raf = requestAnimationFrame(tick);
  });
}
