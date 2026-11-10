import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';

/**
 * Navegação só com teclado (e, no futuro, controle) nos minigames: as setas movem um cursor entre os
 * elementos marcados com `data-nav` que estão na tela, e Espaço / E / Enter "clica" no selecionado.
 *
 * Fica ligado durante todo o minigame, mas só age quando existe algum `[data-nav]` visível; nas fases
 * de ação (timing, desvio) o próprio minigame cuida das teclas. Quando age, a tecla não chega no
 * minigame (pra não clicar duas vezes). `data-nav-default` escolhe quem começa selecionado.
 */
export function attachKeyNav(root: HTMLElement): () => void {
  let sel: HTMLElement | null = null;

  const items = () => {
    // tela final (estrelas): só os botões dela
    const stars = root.querySelector('.screen .bg-stars');
    const scope: ParentNode = stars?.parentElement ?? root;
    return (Array.from(scope.querySelectorAll<HTMLElement>('[data-nav]')) as HTMLElement[]).filter((el) => {
      if ((el as HTMLButtonElement).disabled || el.closest('.off')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    });
  };
  const paint = (list: HTMLElement[]) => list.forEach((el) => el.classList.toggle('kb-sel', el === sel));
  const ensure = (list: HTMLElement[]) => {
    if (sel && list.includes(sel)) return;
    sel = list.find((el) => el.hasAttribute('data-nav-default')) ?? list[0] ?? null;
  };
  const move = (list: HTMLElement[], dx: number, dy: number) => {
    if (!sel) return;
    const a = sel.getBoundingClientRect();
    const ax = a.left + a.width / 2;
    const ay = a.top + a.height / 2;
    let best: HTMLElement | null = null;
    let bestScore = Infinity;
    for (const el of list) {
      if (el === sel) continue;
      const b = el.getBoundingClientRect();
      const ddx = b.left + b.width / 2 - ax;
      const ddy = b.top + b.height / 2 - ay;
      const along = dx ? ddx * dx : ddy * dy; // quanto anda na direção pedida
      if (along <= 4) continue;
      const across = dx ? Math.abs(ddy) : Math.abs(ddx);
      const score = along + across * 2.2;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }
    if (best) {
      sel = best;
      AudioSystem.play('blip');
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (InputSystem.context !== 'minigame') return;
    const list = items();
    if (!list.length) {
      if (sel) sel.classList.remove('kb-sel');
      sel = null;
      return;
    }
    ensure(list);
    const dirs: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
      ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
    };
    const d = dirs[e.code];
    if (d) {
      e.preventDefault();
      e.stopImmediatePropagation();
      move(list, d[0], d[1]);
      paint(list);
      return;
    }
    if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat || !sel) return;
      const el = sel;
      paint(list);
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      el.click();
    }
  };
  // mostra o cursor assim que algo navegável aparece (sem esperar a primeira tecla)
  const obs = new MutationObserver(() => {
    const list = items();
    if (!list.length) return;
    ensure(list);
    paint(list);
  });
  obs.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-nav'] });
  window.addEventListener('keydown', onKey, true);
  return () => {
    obs.disconnect();
    window.removeEventListener('keydown', onKey, true);
  };
}
