import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';
import { assetURL } from '@/utils/asset';

/**
 * Minigame — Jantar a dois (a primeira noite no apê do Weng).
 *
 * Três etapas curtas, com combo, pontos e muita festinha:
 *  1. Pega no ar: o Weng joga os ingredientes; a Bella pega na panela (← →) só o que é da receita.
 *  2. Corte no ritmo: o anel fecha em cima do ingrediente; Espaço quando ele encostar no círculo.
 *  3. Mexe com amor: ← e → alternados giram a colher e enchem o "Sabor"; "Tempero!" = Espaço rápido.
 * Final: o prato aparece com confete e a nota do chef. Sprites: cz-*.png.
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
const ALL: Ing[] = ['macarrao', 'creme', 'queijo', 'alho', 'cebola', 'carne', 'tomate', 'cogumelo', 'batata', 'miojo', 'ovo', 'cebolinha'];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function playCookGame(parent: HTMLElement): Promise<CookResult> {
  return new Promise((resolve) => {
    const mg = (f: string) => assetURL(`assets/minigames/cz-${f}.png`);
    let recipe = 0;
    let mistakes = 0;
    let score = 0;
    let combo = 0;
    let bestCombo = 0;
    let raf = 0;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const handlers: [string, (e: KeyboardEvent) => void][] = [];

    // ------------------------------------------------------------ moldura
    const stepEl = h('b', { class: 'so-sb-n' }, '1/3');
    const scoreEl = h('b', { class: 'so-sb-n' }, '0');
    const comboEl = h('b', { class: 'so-sb-n' }, 'x0');
    const comboChip = h('div', { class: 'so-sb-chip ck2-combo' }, h('span', {}, 'Combo'), comboEl);
    const sb = h(
      'div',
      { class: 'so-sb ck2-sb' },
      h('div', { class: 'so-sb-chip' }, h('span', {}, 'Etapa'), stepEl),
      h('div', { class: 'so-sb-chip' }, h('span', {}, 'Pontos'), scoreEl),
      comboChip,
    );
    const stage = h('div', { class: 'ck-stage ck2-stage' });
    const face = h('img', { class: 'ck-face', alt: '' }) as HTMLImageElement;
    const msg = h('div', { class: 'gp-bubble ck-msg' });
    const actions = h('div', { class: 'bg-actions' });
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel ck-panel' },
      h('div', { class: 'bg-title ck-title' }, 'Jantar a dois'),
      sb,
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
    const bump = (el: HTMLElement) => {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    };
    const paintScore = () => {
      scoreEl.textContent = String(score);
      comboEl.textContent = `x${combo}`;
      comboChip.classList.toggle('hot', combo >= 3);
    };
    /** acerto: pontos com multiplicador de combo + texto flutuante */
    const gain = (base: number, x: number, y: number, label?: string) => {
      combo++;
      bestCombo = Math.max(bestCombo, combo);
      const pts = base * Math.min(4, 1 + Math.floor(combo / 3));
      score += pts;
      paintScore();
      bump(scoreEl);
      bump(comboEl);
      float(x, y, label ? `${label} +${pts}` : `+${pts}`, 'good');
      if (combo > 0 && combo % 5 === 0) {
        float(50, 18, `Combo x${combo}!`, 'combo');
        AudioSystem.play('quest');
      }
    };
    const miss = (x: number, y: number, label = 'Ops!') => {
      mistakes++;
      combo = 0;
      paintScore();
      AudioSystem.play('cancel');
      stage.classList.remove('bg-shake');
      void stage.offsetWidth;
      stage.classList.add('bg-shake');
      float(x, y, label, 'bad');
    };
    /** texto que sobe e some (em % do palco) */
    const float = (x: number, y: number, text: string, kind: 'good' | 'bad' | 'combo') => {
      const el = h('div', { class: `ck2-float ${kind}`, style: `left:${x}%;top:${y}%` }, text);
      stage.append(el);
      later(900, () => el.remove());
    };
    /** brilhinhos: estrelas e corações desenhados */
    const burst = (x: number, y: number, n = 8, hearts = false) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
        const d = 30 + Math.random() * 40;
        const el = h('i', {
          class: `ck2-spark ${hearts && i % 2 ? 'heart' : ''}`,
          style: `left:${x}%;top:${y}%;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 20}px;animation-delay:${Math.random() * 60}ms`,
        });
        stage.append(el);
        later(800, () => el.remove());
      }
    };
    const setStep = (n: number) => {
      stepEl.textContent = `${n}/3`;
      bump(stepEl);
    };
    const onKey = (type: 'keydown' | 'keyup', fn: (e: KeyboardEvent) => void) => {
      const wrapped = (e: KeyboardEvent) => {
        if (InputSystem.context !== 'minigame') return;
        fn(e);
      };
      handlers.push([type, wrapped]);
      window.addEventListener(type, wrapped);
    };
    const clearKeys = () => {
      for (const [t, f] of handlers) window.removeEventListener(t, f as EventListener);
      handlers.length = 0;
    };
    const isAction = (c: string) => c === 'Space' || c === 'KeyE' || c === 'Enter';
    /** botão de toque/clique que aperta a tecla (o controle e o teclado usam as teclas direto) */
    const keyBtn = (label: string | HTMLElement, code: string, cls = 'btn') => {
      const b = h('button', { class: `${cls} ck2-key` }, label) as HTMLButtonElement;
      const send = (type: string) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        send('keydown');
      });
      b.addEventListener('pointerup', () => send('keyup'));
      b.addEventListener('pointerleave', () => send('keyup'));
      return b;
    };
    /** cartão de abertura de cada etapa (o jogo dá uma respirada e explica em uma linha) */
    const intro = (title: string, line: string, next: () => void) => {
      const card = h('div', { class: 'ck2-intro' }, h('b', {}, title), h('span', {}, line));
      stage.replaceChildren(card);
      actions.replaceChildren();
      AudioSystem.play('confirm');
      later(1500, () => {
        card.classList.add('out');
        later(250, next);
      });
    };

    // ------------------------------------------------------------ 0. receita
    const chooseRecipe = () => {
      say('weng', 'O que a gente cozinha hoje, chef?');
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
                  later(700, () => intro('1 · Pega no ar!', 'O Weng joga, você pega na panela. Só o que é da receita!', catchStage));
                },
              },
              h('img', { src: mg(r.pic), alt: '' }),
              h('span', {}, r.name),
            ),
          ),
        ),
      );
    };

    // ------------------------------------------------------------ 1. pega no ar
    const catchStage = () => {
      setStep(1);
      const r = RECIPES[recipe];
      const got = new Set<Ing>();
      say('weng', 'Lá vai! ← → pra andar com a panela. O que não é da receita, desvia!');
      const list = h('div', { class: 'ck2-list' });
      const renderList = () =>
        list.replaceChildren(h('b', { class: 'ck2-list-t' }, 'Receita'), ...r.need.map((k) => h('div', { class: `ck2-need ${got.has(k) ? 'ok' : ''}` }, h('img', { src: mg(k), alt: '' }), h('span', {}, NAME[k]))));
      renderList();
      const pot = h('img', { class: 'ck2-pot', src: mg('panela'), alt: '' });
      // o Weng, lá em cima, corre até onde vai jogar cada ingrediente
      const tosser = h('img', { class: 'ck2-tosser', src: textureURL('portrait-weng') ?? '', alt: '' });
      const field = h('div', { class: 'ck2-field' }, h('div', { class: 'ck2-counter' }), tosser, pot);
      stage.replaceChildren(field, list);
      actions.replaceChildren(keyBtn('◀', 'ArrowLeft'), keyBtn('▶', 'ArrowRight'));
      let px = 50;
      const held = { l: false, r: false };
      onKey('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') (held.l = true), e.preventDefault();
        if (e.code === 'ArrowRight' || e.code === 'KeyD') (held.r = true), e.preventDefault();
      });
      onKey('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') held.l = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') held.r = false;
      });
      type Drop = { el: HTMLElement; x: number; y: number; vy: number; rot: number; vr: number; k: Ing; need: boolean };
      const drops: Drop[] = [];
      let spawnT = 0.4;
      let elapsed = 0;
      let last = 0;
      let done = false;
      const spawn = () => {
        const missing = r.need.filter((k) => !got.has(k) && !drops.some((d) => d.k === k));
        const needIt = missing.length > 0 && Math.random() < 0.58;
        const decoys = ALL.filter((k) => !r.need.includes(k));
        const k = needIt ? pick(missing) : pick(decoys);
        const el = h('img', { class: 'ck2-drop', src: mg(k), alt: '' });
        field.append(el);
        const x = 8 + Math.random() * 84;
        tosser.style.left = `${x}%`;
        tosser.animate([{ transform: 'translateX(-50%) rotate(0)' }, { transform: 'translateX(-50%) rotate(-12deg) translateY(-4px)' }, { transform: 'translateX(-50%) rotate(0)' }], { duration: 260 });
        drops.push({ el, x, y: -8, vy: 26 + Math.min(18, elapsed * 1.2) + Math.random() * 8, rot: Math.random() * 360, vr: (Math.random() - 0.5) * 300, k, need: r.need.includes(k) });
      };
      const tick = (t: number) => {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
        last = t;
        elapsed += dt;
        px += ((held.r ? 1 : 0) - (held.l ? 1 : 0)) * 78 * dt;
        px = Math.max(8, Math.min(92, px));
        pot.style.left = `${px}%`;
        spawnT -= dt;
        if (spawnT <= 0 && !done) {
          spawn();
          spawnT = Math.max(0.55, 1.05 - elapsed * 0.02);
        }
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i];
          d.y += d.vy * dt;
          d.rot += d.vr * dt;
          d.el.style.left = `${d.x}%`;
          d.el.style.top = `${d.y}%`;
          d.el.style.transform = `translate(-50%, -50%) rotate(${d.rot}deg)`;
          // boca da panela
          if (d.y > 74 && d.y < 88 && Math.abs(d.x - px) < 10) {
            drops.splice(i, 1);
            d.el.classList.add('in');
            later(250, () => d.el.remove());
            pot.animate([{ transform: 'translateX(-50%) scale(1, 1)' }, { transform: 'translateX(-50%) scale(1.15, .85)' }, { transform: 'translateX(-50%) scale(1, 1)' }], { duration: 220 });
            if (d.need && !got.has(d.k)) {
              got.add(d.k);
              renderList();
              AudioSystem.play('pickup');
              gain(10, px, 66, NAME[d.k]);
              burst(px, 74, 8);
              if (got.size === r.need.length) {
                done = true;
                say('bella', 'Tudo na panela! Agora é comigo: corta!');
                later(1100, () => {
                  cancelAnimationFrame(raf);
                  clearKeys();
                  intro('2 · Corte no ritmo!', 'Aperte Espaço quando o anel encostar no círculo.', chopStage);
                });
              }
            } else if (!d.need) {
              miss(px, 66, `${NAME[d.k]}? Não!`);
              say('weng', `${NAME[d.k]} no ${r.name.split(' ')[0].toLowerCase()}? Essa foi minha culpa, joguei errado.`);
            }
            continue;
          }
          if (d.y > 108) {
            drops.splice(i, 1);
            d.el.remove();
            if (d.need && !got.has(d.k)) {
              combo = 0;
              paintScore();
            }
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // ------------------------------------------------------------ 2. corte no ritmo
    const chopStage = () => {
      setStep(2);
      const r = RECIPES[recipe];
      say('weng', 'Espera o anel encostar no círculo... e CORTA!');
      const food = h('img', { class: 'ck2-food', src: mg(r.chop), alt: '' });
      const target = h('i', { class: 'ck2-target' });
      const ring = h('i', { class: 'ck2-ring' });
      const knife = h('img', { class: 'ck2-knife', src: mg('faca'), alt: '' });
      const pile = h('div', { class: 'ck2-pile' });
      const beats = h('div', { class: 'ck2-beats' });
      // setinha amarela guiando a faca: aponta onde corta e pisca "Agora!" na hora certa
      const guide = h('div', { class: 'ck2-guide' }, h('img', { src: assetURL('assets/ui/ui-marker.png'), alt: '' }), h('span', {}, 'Agora!'));
      const board = h('div', { class: 'ck2-board' }, h('img', { class: 'ck2-tabua', src: mg('tabua'), alt: '' }), pile, food, target, ring, knife, guide);
      stage.replaceChildren(board, beats);
      const total = 6;
      const dots = Array.from({ length: total }, () => h('i'));
      beats.replaceChildren(...dots);
      actions.replaceChildren(keyBtn('Cortar!', 'Space', 'btn primary'));
      let beat = 0;
      let s = 2.4; // escala do anel (1 = encostou no círculo)
      let speed = 1.25; // quanto o anel fecha por segundo
      let last = 0;
      let waiting = false;
      const judge = (hit: boolean) => {
        const off = Math.abs(s - 1);
        const dot = dots[beat];
        knife.animate([{ transform: 'translate(-50%, -80%) rotate(-25deg)' }, { transform: 'translate(-50%, -30%) rotate(0deg)' }, { transform: 'translate(-50%, -80%) rotate(-25deg)' }], { duration: 170 });
        if (hit && off < 0.13) {
          AudioSystem.play('blip');
          gain(20, 50, 30, 'Perfeito!');
          burst(50, 50, 10);
          dot.className = 'perf';
          slice();
        } else if (hit && off < 0.32) {
          AudioSystem.play('pickup');
          gain(10, 50, 30, 'Bom!');
          dot.className = 'good';
          slice();
        } else {
          miss(50, 30, hit ? 'Cedo demais!' : 'Passou!');
          dot.className = 'bad';
        }
        board.classList.remove('chop');
        void board.offsetWidth;
        board.classList.add('chop');
        beat++;
        if (beat >= total) {
          cancelAnimationFrame(raf);
          clearKeys();
          say('weng', combo >= 4 ? 'Que mão! Parece programa de culinária.' : 'Cortadinho com carinho. Pra panela!');
          later(1100, () => intro('3 · Mexe com amor!', '← e → alternados giram a colher. Tempero? Espaço!', stirStage));
          return;
        }
        waiting = true;
        later(380, () => {
          s = 2.4;
          speed += 0.16;
          waiting = false;
        });
      };
      const slice = () => {
        const p = h('img', { class: 'ck2-slice', src: mg(r.chop), alt: '', style: `--dx:${-60 + Math.random() * 120}px;--rot:${-40 + Math.random() * 80}deg` });
        pile.append(p);
      };
      onKey('keydown', (e) => {
        if (!isAction(e.code)) return;
        e.preventDefault();
        if (e.repeat || waiting) return;
        judge(true);
      });
      const tick = (t: number) => {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
        last = t;
        if (!waiting) {
          s -= speed * dt;
          if (s < 0.62) judge(false);
        }
        ring.style.transform = `translate(-50%, -50%) scale(${Math.max(0.6, s)})`;
        ring.classList.toggle('near', Math.abs(s - 1) < 0.13);
        guide.classList.toggle('now', !waiting && Math.abs(s - 1) < 0.2);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // ------------------------------------------------------------ 3. mexe com amor
    const stirStage = () => {
      setStep(3);
      const r = RECIPES[recipe];
      say('bella', 'Agora mexe! ← → ← → ... e quando gritar "Tempero!", Espaço!');
      const pan = h('img', { class: 'ck2-pan', src: mg(r.pan), alt: '' });
      const spoon = h('img', { class: 'ck2-spoon', src: mg('colher'), alt: '' });
      const flame = h('div', { class: 'ck2-flame' }, h('i'), h('i'), h('i'));
      const spice = h('div', { class: 'ck2-spice' }, 'Tempero!');
      const fill = h('i');
      const meter = h('div', { class: 'ck2-meter' }, h('span', {}, 'Sabor'), h('div', { class: 'ck2-bar' }, fill));
      const timeEl = h('b', { class: 'ck2-time' }, '12');
      const stove = h('div', { class: 'ck2-stove' }, flame, pan, spoon, spice);
      stage.replaceChildren(stove, meter, timeEl);
      actions.replaceChildren(keyBtn('←', 'ArrowLeft'), keyBtn('Tempero!', 'Space', 'btn primary'), keyBtn('→', 'ArrowRight'));
      let flavor = 0;
      let lastSide = '';
      let angle = 0;
      let left = 12;
      let spiceT = 2.2;
      let spiceOn = 0;
      let last = 0;
      let over = false;
      const puff = (heart: boolean) => {
        const el = h('i', { class: `ck2-steam ${heart ? 'heart' : ''}`, style: `left:${40 + Math.random() * 20}%;--dx:${-20 + Math.random() * 40}px` });
        stove.append(el);
        later(1200, () => el.remove());
      };
      const stir = (side: 'l' | 'r') => {
        if (over) return;
        if (side === lastSide) return; // tem que alternar
        lastSide = side;
        angle += 90;
        spoon.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-18%)`;
        flavor = Math.min(100, flavor + 4.2);
        AudioSystem.play('blip');
        if (Math.random() < 0.5) puff(Math.random() < 0.3);
        if (flavor >= 100) end();
      };
      const season = () => {
        if (over) return;
        if (spiceOn > 0) {
          spiceOn = 0;
          spice.classList.remove('on');
          flavor = Math.min(100, flavor + 12);
          gain(25, 50, 20, 'Tempero!');
          burst(50, 40, 12, true);
          if (flavor >= 100) end();
        } else miss(50, 22, 'Ainda não!');
      };
      onKey('keydown', (e) => {
        if (e.repeat) return;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') (e.preventDefault(), stir('l'));
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') (e.preventDefault(), stir('r'));
        else if (isAction(e.code)) (e.preventDefault(), season());
      });
      const end = () => {
        if (over) return;
        over = true;
        cancelAnimationFrame(raf);
        clearKeys();
        // sabor também vale ponto
        score += Math.round(flavor);
        paintScore();
        if (flavor >= 100) {
          AudioSystem.play('quest');
          say('weng', 'Sente esse cheirinho... no ponto certinho!');
          burst(50, 45, 16, true);
        } else say('weng', 'Tá quase... mas já tá cheiroso. Vamos servir assim mesmo, com amor.');
        later(1300, finish);
      };
      const tick = (t: number) => {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
        last = t;
        left -= dt;
        timeEl.textContent = String(Math.max(0, Math.ceil(left)));
        flavor = Math.max(0, flavor - dt * 2.2);
        fill.style.width = `${flavor}%`;
        meter.classList.toggle('hot', flavor > 70);
        if (spiceOn > 0) {
          spiceOn -= dt;
          if (spiceOn <= 0) {
            spice.classList.remove('on');
            combo = 0;
            paintScore();
          }
        } else {
          spiceT -= dt;
          if (spiceT <= 0) {
            spiceOn = 1.3;
            spiceT = 2 + Math.random() * 1.6;
            spice.classList.add('on');
            AudioSystem.play('door');
          }
        }
        if (left <= 0) return end();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // ------------------------------------------------------------ fim: o prato
    const finish = () => {
      const r = RECIPES[recipe];
      const max = r.need.length * 10 * 2 + 6 * 20 * 2 + 4 * 25 + 100;
      const pct = score / max;
      const stars = pct >= 0.55 && mistakes <= 3 ? 3 : pct >= 0.32 ? 2 : 1;
      const nota = Math.min(10, Math.max(6, 6 + pct * 6)).toFixed(1).replace('.', ',');
      const plate = h('img', { class: 'ck2-plate', src: mg('prato'), alt: '' });
      stage.replaceChildren(
        h('div', { class: 'ck2-final' }, h('div', { class: 'ck2-rays' }), plate, h('b', {}, r.name), h('span', {}, `Nota do chef: ${nota} · maior combo x${bestCombo}`)),
      );
      for (let i = 0; i < 24; i++) {
        const c = h('i', { class: 'ck2-confetti', style: `left:${Math.random() * 100}%;--h:${Math.floor(Math.random() * 360)};animation-delay:${Math.random() * 500}ms;--dx:${-40 + Math.random() * 80}px` });
        stage.append(c);
      }
      say('bella', stars >= 3 ? 'Hmm... ficou bom demais! Melhor jantar da vida.' : stars === 2 ? 'Ficou uma delícia! A gente é um ótimo time.' : 'Ficou do nosso jeitinho. Foi a gente que fez, então é perfeito.');
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
      clearKeys();
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
