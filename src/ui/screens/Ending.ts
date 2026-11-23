import { h, formatPlaytime } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { GameState } from '@/core/GameState';
import { MEMORIES } from '@/data/memories';
import { REGIONS } from '@/data/regions';
import { PERSONAL } from '@/data/personal';
import { textureURL } from '../textures';
import { assetURL } from '@/utils/asset';

/**
 * O final do jogo (depois da virada em Cabo Frio):
 *  1. "Sete capítulos depois..."
 *  2. Retrospectiva: cada lembrança desbloqueada passa como polaroide, capítulo por capítulo.
 *  3. A carta final do Weng (personal.ts › finalLetter), parágrafo por parágrafo.
 *  4. "Status da missão" com os dois rostinhos (personal.ts › closing).
 *  5. "Fim" + números da jornada + Voltar ao título / Continuar passeando.
 * (A carta do Weng abre o jogo: ver Letter.ts.)
 * Teclado: Espaço / E / Enter avança (e pula a animação da vez); ← → escolhe no final.
 */
export function playEnding(root: HTMLElement): Promise<'title' | 'stay'> {
  return new Promise((resolve) => {
    const screen = h('div', { class: 'screen opaque end-screen' });
    const stars = h('div', { class: 'end-stars' }, ...Array.from({ length: 40 }, (_, i) => h('i', { style: `left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;animation-delay:${-(i % 9) * 0.4}s` })));
    const stage = h('div', { class: 'end-stage' });
    const hint = h('div', { class: 'end-hint' }, h('b', { class: 'pad-glyph' }, '✕'), h('span', { class: 'kb-only' }, ' / Espaço'), ' ▸');
    screen.append(stars, stage, hint);
    root.append(screen);
    InputSystem.push('chapter');
    InputSystem.releaseAll();

    // ---- avançar: Espaço pula a espera atual
    let skip: (() => void) | null = null;
    const wait = (ms: number) =>
      new Promise<void>((r) => {
        const t = setTimeout(() => {
          skip = null;
          r();
        }, ms);
        skip = () => {
          clearTimeout(t);
          skip = null;
          r();
        };
      });
    /** espera o jogador apertar Espaço */
    const press = () =>
      new Promise<void>((r) => {
        hint.classList.add('on');
        skip = () => {
          hint.classList.remove('on');
          skip = null;
          r();
        };
      });
    let choose: ((dir: number | 'ok') => void) | null = null;
    const onKey = (e: KeyboardEvent) => {
      const c = e.code;
      if (choose && (c === 'ArrowLeft' || c === 'ArrowRight' || c === 'KeyA' || c === 'KeyD')) {
        e.preventDefault();
        choose(c === 'ArrowLeft' || c === 'KeyA' ? -1 : 1);
        return;
      }
      if (c === 'Space' || c === 'KeyE' || c === 'Enter') {
        e.preventDefault();
        if (e.repeat) return;
        if (choose) return choose('ok');
        skip?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    screen.addEventListener('click', () => !choose && skip?.());

    const show = async (el: HTMLElement) => {
      stage.replaceChildren(el);
      void el.offsetWidth;
      el.classList.add('in');
    };
    const hide = async (el: HTMLElement) => {
      el.classList.add('out');
      await new Promise((r) => setTimeout(r, 450));
    };

    void (async () => {
      AudioSystem.play('quest');
      // 1. abertura
      const open = h('div', { class: 'end-open' }, h('p', {}, 'Sete capítulos depois...'), h('p', { class: 'sm' }, 'de Piabetá à Praia do Forte.'));
      await show(open);
      await wait(3200);
      await hide(open);

      // 2. retrospectiva
      const got = new Set(GameState.data.memories);
      for (const r of REGIONS) {
        const mems = MEMORIES.filter((m) => m.region === r.id && got.has(m.id) && textureURL(m.image));
        if (!mems.length) continue;
        const reel = h(
          'div',
          { class: 'end-reel' },
          h('div', { class: 'end-chap' }, h('span', {}, r.chapter), h('b', {}, r.name), h('i', {}, r.subtitle)),
          h('div', { class: 'end-polas' }),
        );
        await show(reel);
        const polas = reel.querySelector('.end-polas') as HTMLElement;
        for (const [i, m] of mems.slice(0, 4).entries()) {
          const rot = (i % 2 ? 1 : -1) * (2 + ((i * 3) % 4));
          polas.append(h('div', { class: 'end-pola', style: `--r:${rot}deg` }, h('img', { src: textureURL(m.image)!, alt: '' }), h('span', {}, m.title)));
          AudioSystem.play('blip');
          await wait(900);
        }
        await wait(1600);
        await hide(reel);
      }

      // 3. a carta final (Espaço revela cada parágrafo)
      const body = h('div', { class: 'lt-body' });
      const paper = h('div', { class: 'lt-paper end-final' }, body);
      const col = h('div', { class: 'lt-col' }, paper);
      await show(col);
      await wait(500);
      const kind = (t: string) => ({ '#': 'hi', '~': 'beat', '@': 'sig', '+': 'ps' })[t[0]] ?? '';
      for (const raw of PERSONAL.finalLetter) {
        const k = kind(raw);
        const el = h('p', { class: k }, k ? raw.slice(1) : raw);
        body.append(el);
        el.scrollIntoView({ behavior: 'smooth', block: 'end' });
        AudioSystem.play('blip');
        // título e assinatura entram sozinhos; o resto espera o Espaço
        if (k === 'hi' || k === 'sig') await wait(1100);
        else {
          await wait(500);
          await press();
        }
      }
      await hide(col);

      // 4. status da missão
      const fb = textureURL('portrait-bella');
      const fw = textureURL('portrait-weng');
      const lines = h('div', { class: 'end-lines end-quest' });
      const closing = h(
        'div',
        { class: 'end-closing' },
        h('div', { class: 'end-faces' }, fb ? h('img', { src: fb, alt: '' }) : h('span'), h('b', {}, '♥'), fw ? h('img', { src: fw, alt: '' }) : h('span')),
        lines,
      );
      await show(closing);
      for (const [i, l] of PERSONAL.closing.entries()) {
        const [label, ...rest] = l.split(':');
        lines.append(h('p', { class: i === 0 ? 'done' : 'next' }, h('span', {}, `${label}:`), h('b', {}, rest.join(':').trim())));
        AudioSystem.play(i === 0 ? 'quest' : 'confirm');
        await wait(2600);
      }
      await press();
      await hide(closing);

      // 5. fim
      const total = MEMORIES.length;
      const n = MEMORIES.filter((m) => got.has(m.id)).length;
      const btnTitle = h('button', { class: 'btn primary' }, 'Voltar ao título');
      const btnStay = h('button', { class: 'btn' }, 'Continuar passeando');
      const btns = [btnTitle, btnStay];
      const fim = h(
        'div',
        { class: 'end-fim' },
        h('div', { class: 'end-fim-t' }, 'Fim'),
        h('div', { class: 'end-fim-s' }, 'A Lua está Bella'),
        h('div', { class: 'end-fim-d' }, '25/11/2023 → 25/11/2026 · 3 anos'),
        h(
          'div',
          { class: 'end-stats' },
          h('div', {}, h('b', {}, `${n}/${total}`), h('span', {}, 'lembranças')),
          h('div', {}, h('b', {}, String(REGIONS.length)), h('span', {}, 'capítulos')),
          h('div', {}, h('b', {}, formatPlaytime(GameState.data.playtimeMs)), h('span', {}, 'juntos')),
        ),
        n < total ? h('div', { class: 'end-miss' }, `Ainda faltam ${total - n} lembranças no álbum. Dá pra voltar em qualquer capítulo pelo menu Cenas.`) : h('div', { class: 'end-miss' }, 'Álbum completo. ♥'),
        h('div', { class: 'end-btns' }, ...btns),
      );
      // ilustração de fundo do "Fim" (assets/ui/fim.webp), se existir
      const art = new Image();
      art.onload = () => screen.insertBefore(h('div', { class: 'end-art', style: `background-image:url(${art.src})` }), stage);
      art.src = assetURL('assets/ui/fim.webp');
      await show(fim);
      hint.remove();
      let sel = 0;
      const paint = () => btns.forEach((b, i) => b.classList.toggle('kb-focus', i === sel));
      paint();
      const finish = (r: 'title' | 'stay') => {
        window.removeEventListener('keydown', onKey, true);
        InputSystem.pop('chapter');
        screen.classList.add('out');
        setTimeout(() => screen.remove(), 500);
        resolve(r);
      };
      btnTitle.addEventListener('click', () => finish('title'));
      btnStay.addEventListener('click', () => finish('stay'));
      choose = (d) => {
        if (d === 'ok') return finish(sel === 0 ? 'title' : 'stay');
        sel = (sel + (d as number) + btns.length) % btns.length;
        AudioSystem.play('blip');
        paint();
      };
    })();
  });
}
