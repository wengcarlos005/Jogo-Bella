import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigame — Jantar a dois (a primeira noite no apê do Weng).
 *
 * 1. Escolher a receita.
 * 2. Pegar na bancada SÓ os ingredientes da receita (errado = erro).
 * 3. Cortar: a faca passa pela tábua; aperte quando ela estiver em cima de uma marquinha (5 cortes).
 * 4. Fogão: a panela cozinha sozinha; quando aparecer "Mexe!", mexa a tempo (senão gruda e queima)
 *    e desligue o fogo quando o ponto estiver no verde.
 * Estrelas pelos erros. Sprites: cz-*.png (art-source/minigames/cozinha.webp).
 */
export interface CookResult {
  recipe: number;
  stars: number;
  mistakes: number;
}

type Ing = 'macarrao' | 'creme' | 'queijo' | 'alho' | 'cebola' | 'carne' | 'tomate' | 'cogumelo' | 'batata' | 'miojo' | 'ovo' | 'cebolinha';
const NAME: Record<Ing, string> = {
  macarrao: 'Macarrão', creme: 'Creme de leite', queijo: 'Queijo', alho: 'Alho', cebola: 'Cebola', carne: 'Carne',
  tomate: 'Molho de tomate', cogumelo: 'Cogumelo', batata: 'Batata palha', miojo: 'Miojo', ovo: 'Ovo', cebolinha: 'Cebolinha',
};
const RECIPES: { name: string; pic: string; need: Ing[]; chop: Ing; pan: string; weng: string }[] = [
  { name: 'Macarrão ao molho branco', pic: 'panela-massa', need: ['macarrao', 'creme', 'queijo', 'alho'], chop: 'alho', pan: 'panela-massa', weng: 'Molho branco. Clássico e cheiroso.' },
  { name: 'Strogonoff com batata palha', pic: 'panela-strogo', need: ['carne', 'creme', 'tomate', 'cogumelo', 'cebola', 'batata'], chop: 'cebola', pan: 'panela-strogo', weng: 'Strogonoff! Eu pico a cebola e choro sozinho.' },
  { name: 'Miojo gourmet (com ovo!)', pic: 'miojo', need: ['miojo', 'ovo', 'cebolinha', 'queijo'], chop: 'cebolinha', pan: 'panela-massa', weng: 'Miojo gourmet. Respeito a ousadia.' },
];
const SHELF: Ing[] = ['macarrao', 'creme', 'queijo', 'alho', 'cebola', 'carne', 'tomate', 'cogumelo', 'batata', 'miojo', 'ovo', 'cebolinha'];

export function playCookGame(parent: HTMLElement): Promise<CookResult> {
  return new Promise((resolve) => {
    const mg = (f: string) => new URL(`assets/minigames/cz-${f}.png`, document.baseURI).href;
    let recipe = 0;
    let mistakes = 0;
    let raf = 0;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    let keyHandler: ((e: KeyboardEvent) => void) | null = null;

    const stage = h('div', { class: 'ck-stage' });
    const step = h('div', { class: 'ck-step' });
    const face = h('img', { class: 'ck-face', alt: '' }) as HTMLImageElement;
    const msg = h('div', { class: 'gp-bubble ck-msg' });
    const errEl = h('div', { class: 'ck-err' });
    const actions = h('div', { class: 'bg-actions' });
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel ck-panel' },
      h('div', { class: 'bg-title ck-title' }, 'Jantar a dois'),
      h('div', { class: 'ck-hud' }, step, errEl),
      stage,
      h('div', { class: 'ck-talk' }, face, msg),
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen ck-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const say = (who: 'bella' | 'weng', t: string) => {
      const url = textureURL(`portrait-${who}`);
      if (url) face.src = url;
      msg.textContent = t;
      msg.classList.remove('pop');
      void msg.offsetWidth;
      msg.classList.add('pop');
    };
    const hud = (n: number, label: string) => {
      step.textContent = `${n}/4 · ${label}`;
      errEl.textContent = mistakes ? `Erros: ${mistakes}` : '';
    };
    const oops = () => {
      mistakes++;
      AudioSystem.play('cancel');
      stage.classList.remove('bg-shake');
      void stage.offsetWidth;
      stage.classList.add('bg-shake');
      errEl.textContent = `Erros: ${mistakes}`;
    };
    const setKeys = (fn: ((e: KeyboardEvent) => void) | null) => {
      if (keyHandler) window.removeEventListener('keydown', keyHandler);
      keyHandler = fn;
      if (fn) window.addEventListener('keydown', fn);
    };

    // ---------------------------------------------------------------- 1. receita
    const chooseRecipe = () => {
      hud(1, 'Escolha a receita');
      say('weng', 'O que a gente cozinha hoje?');
      stage.replaceChildren(
        h(
          'div',
          { class: 'ck-recipes' },
          ...RECIPES.map((r, i) =>
            h(
              'button',
              {
                class: 'ck-recipe',
                'data-nav': '',
                onclick: () => {
                  recipe = i;
                  AudioSystem.play('confirm');
                  say('weng', r.weng);
                  later(900, pickIngredients);
                },
              },
              h('img', { src: mg(r.pic), alt: '' }),
              h('span', {}, r.name),
            ),
          ),
        ),
      );
    };

    // ---------------------------------------------------------------- 2. ingredientes
    const pickIngredients = () => {
      const r = RECIPES[recipe];
      const got = new Set<Ing>();
      hud(2, 'Pegue os ingredientes');
      say('bella', `${r.name}: pega só o que vai na receita. Eu fiscalizo.`);
      const list = h('div', { class: 'ck-list' });
      const renderList = () => list.replaceChildren(h('b', {}, 'Receita'), ...r.need.map((k) => h('div', { class: got.has(k) ? 'ok' : '' }, NAME[k])));
      renderList();
      const shelf = h(
        'div',
        { class: 'ck-shelf' },
        ...SHELF.map((k) => {
          const b = h('button', { class: 'ck-ing', title: NAME[k], 'data-nav': '' }, h('img', { src: mg(k), alt: '' }), h('span', {}, NAME[k])) as HTMLButtonElement;
          b.addEventListener('click', () => {
            if (got.has(k)) return;
            if (!r.need.includes(k)) {
              oops();
              say('weng', `${NAME[k]} no ${r.name.split(' ')[0].toLowerCase()}? Acho que não, chef.`);
              return;
            }
            got.add(k);
            b.classList.add('taken');
            AudioSystem.play('pickup');
            renderList();
            if (got.size === r.need.length) {
              say('bella', 'Tudo na bancada! Agora corta.');
              later(900, chop);
            }
          });
          return b;
        }),
      );
      stage.replaceChildren(h('div', { class: 'ck-pick' }, shelf, list));
    };

    // ---------------------------------------------------------------- 3. cortar
    const chop = () => {
      const r = RECIPES[recipe];
      hud(3, `Corte o(a) ${NAME[r.chop].toLowerCase()}`);
      say('weng', 'Quando a faca passar em cima da marquinha... corta! (espaço ou clique)');
      const marks = [18, 34, 50, 66, 82];
      let cuts = 0;
      let pos = 0;
      let dir = 1;
      let speed = 55;
      let last = 0;
      const knife = h('img', { class: 'ck-knife', src: mg('faca'), alt: '' });
      const markEls = marks.map((m) => h('i', { class: 'ck-mark', style: `left:${m}%` }));
      const board = h('div', { class: 'ck-board' }, h('img', { class: 'ck-tabua', src: mg('tabua'), alt: '' }), h('img', { class: 'ck-food', src: mg(r.chop), alt: '' }), ...markEls, knife);
      const btn = h('button', { class: 'btn primary' }, 'Cortar!');
      stage.replaceChildren(board);
      actions.replaceChildren(btn);
      const cut = () => {
        const i = marks.findIndex((m, k) => !markEls[k].classList.contains('done') && Math.abs(m - pos) < 4.5);
        knife.animate([{ transform: 'translate(-50%, -70%)' }, { transform: 'translate(-50%, -20%)' }, { transform: 'translate(-50%, -70%)' }], { duration: 160 });
        if (i < 0) {
          oops();
          say('bella', 'Errou o corte! Cuidado com esse dedo.');
          return;
        }
        markEls[i].classList.add('done');
        cuts++;
        AudioSystem.play('blip');
        speed += 12;
        if (cuts >= marks.length) {
          cancelAnimationFrame(raf);
          setKeys(null);
          actions.replaceChildren();
          say('weng', 'Cortadinho perfeito. Pra panela!');
          later(900, cook);
        }
      };
      btn.addEventListener('click', cut);
      setKeys((e) => {
        if (InputSystem.context !== 'minigame') return;
        if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
          e.preventDefault();
          if (!e.repeat) cut();
        }
      });
      const tick = (t: number) => {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
        last = t;
        pos += dir * speed * dt;
        if (pos > 96) (pos = 96), (dir = -1);
        if (pos < 4) (pos = 4), (dir = 1);
        knife.style.left = `${pos}%`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // ---------------------------------------------------------------- 4. fogão
    const cook = () => {
      const r = RECIPES[recipe];
      hud(4, 'No fogão');
      say('bella', 'Mexe quando aparecer "Mexe!" e desliga o fogo quando ficar no verde.');
      let cookT = 0;
      let burn = 0;
      let stirNeed = false;
      let stirT = 1.8;
      let stirLeft = 0;
      let last = 0;
      let over = false;
      const pan = h('img', { class: 'ck-pan', src: mg('panela'), alt: '' }) as HTMLImageElement;
      const bubble = h('div', { class: 'ck-stir' }, 'Mexe!');
      const fill = h('i');
      const burnFill = h('i');
      const bar = h('div', { class: 'ck-bar' }, h('span', { class: 'ck-ok' }), fill);
      const burnBar = h('div', { class: 'ck-burn' }, h('b', {}, 'Grudando'), h('div', {}, burnFill));
      stage.replaceChildren(h('div', { class: 'ck-stove' }, pan, bubble), h('div', { class: 'ck-meters' }, h('b', {}, 'Ponto'), bar, burnBar));
      const stirBtn = h('button', { class: 'btn' }, h('img', { src: mg('colher'), alt: '' }), 'Mexer');
      const offBtn = h('button', { class: 'btn primary' }, 'Desligar o fogo');
      actions.replaceChildren(stirBtn, offBtn);
      const stir = () => {
        if (over) return;
        pan.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(0)' }], { duration: 300 });
        if (stirNeed) {
          stirNeed = false;
          bubble.classList.remove('on');
          AudioSystem.play('blip');
          stirT = 1.4 + Math.random() * 1.4;
        }
      };
      const off = () => {
        if (over) return;
        over = true;
        cancelAnimationFrame(raf);
        setKeys(null);
        const ok = cookT >= 0.72 && cookT <= 0.9 && burn < 1;
        if (!ok) {
          oops();
          if (cookT < 0.72) say('weng', 'Ficou meio cru... mas a gente come assim mesmo. Com amor.');
          else say('bella', 'Passou um pouquinho... tá crocante. É estilo.');
        } else {
          AudioSystem.play('quest');
          say('weng', 'No ponto. A gente é um ótimo time.');
        }
        later(1100, () => finish(ok));
      };
      stirBtn.addEventListener('click', stir);
      offBtn.addEventListener('click', off);
      setKeys((e) => {
        if (InputSystem.context !== 'minigame') return;
        if (e.code === 'Space' || e.code === 'KeyE') {
          e.preventDefault();
          if (!e.repeat) stir();
        } else if (e.code === 'Enter') off();
      });
      const tick = (t: number) => {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
        last = t;
        cookT += dt / 13;
        if (cookT > 0.12 && pan.src.endsWith('cz-panela.png')) pan.src = mg(r.pan);
        if (!stirNeed) {
          stirT -= dt;
          if (stirT <= 0) {
            stirNeed = true;
            stirLeft = 1.3;
            bubble.classList.add('on');
            AudioSystem.play('door');
          }
        } else {
          stirLeft -= dt;
          if (stirLeft <= 0) burn += dt * 0.9;
        }
        if (cookT > 1 || burn >= 1) {
          pan.src = mg('panela-queimada');
          over = true;
          setKeys(null);
          oops();
          oops();
          say('bella', 'QUEIMOU! Weng, abre a janela! A Meli fugiu da cozinha!');
          later(1500, () => finish(false));
          return;
        }
        fill.style.width = `${Math.min(1, cookT) * 100}%`;
        burnFill.style.width = `${Math.min(1, burn) * 100}%`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // ---------------------------------------------------------------- fim
    const finish = (ok: boolean) => {
      const stars = mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1;
      stage.replaceChildren(h('div', { class: 'ck-final' }, h('img', { src: mg(ok ? 'prato' : 'panela-queimada'), alt: '' }), h('span', {}, RECIPES[recipe].name)));
      say(ok ? 'bella' : 'weng', ok ? 'Hmm... ficou bom demais! Melhor jantar da vida.' : 'Deu ruim... pede pizza? (Brincadeira. A gente come assim mesmo.)');
      AudioSystem.play('quest');
      actions.replaceChildren(
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('button', { class: 'btn primary', onclick: close }, 'Servir'),
      );
      const result = { recipe, stars, mistakes };
      function close() {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve(result);
      }
      InputSystem.once('minigame:interact', close);
    };

    chooseRecipe();
    function cleanup() {
      cancelAnimationFrame(raf);
      timers.forEach((t) => clearTimeout(t));
      setKeys(null);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
