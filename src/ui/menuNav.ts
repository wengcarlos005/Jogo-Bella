import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';

/**
 * Navegação do menu (Missões, Mochila, Álbum, Mapa, Salvar, Opções, Cenas, Sair) sem mouse:
 *   setas / direcional ...... anda entre abas, itens, cartões e botões (pelo que está mais perto na direção)
 *   Espaço / E / Enter / ✕ .. escolhe
 *   Q / Backspace / ◯ ....... volta (fecha a foto aberta; senão fecha o menu)
 *   PageUp / PageDown / L1 R1  aba anterior / próxima
 *   ← → num controle de volume: muda o volume
 */
export function attachMenuNav(root: HTMLElement, opts: { prevTab(): void; nextTab(): void; close(): void }): () => void {
  let sel: HTMLElement | null = null;

  const items = (): HTMLElement[] => {
    // foto aberta (álbum): só os botões dela
    const light = root.querySelector<HTMLElement>('.pm-light');
    const scope: ParentNode = light ?? root;
    return Array.from(scope.querySelectorAll<HTMLElement>('button, input[type="range"], [data-nav]')).filter((el) => {
      if ((el as HTMLButtonElement).disabled || el.classList.contains('locked')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    });
  };
  const inBody = (el: HTMLElement) => !!el.closest('.tab-body, .pm-light');
  const paint = (list: HTMLElement[]) => {
    list.forEach((el) => el.classList.toggle('kb-sel', el === sel));
    sel?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const ensure = (list: HTMLElement[]) => {
    if (sel && list.includes(sel)) return;
    // começa no conteúdo da aba (o primeiro item de verdade), não nas abas
    sel = list.find((el) => inBody(el) && !el.classList.contains('close')) ?? list.find((el) => el.classList.contains('on')) ?? list[0] ?? null;
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
      const along = dx ? ddx * dx : ddy * dy;
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
      // passar o cursor por um item da Mochila já mostra o que é (como o mouse)
      sel.dispatchEvent(new MouseEvent('mouseenter'));
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (InputSystem.context !== 'pause') return;
    const c = e.code;
    const handled = () => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    if (c === 'PageUp' || c === 'PageDown') {
      handled();
      if (e.repeat) return;
      sel = null;
      if (c === 'PageUp') opts.prevTab();
      else opts.nextTab();
      return;
    }
    if (c === 'KeyQ' || c === 'Backspace') {
      handled();
      if (e.repeat) return;
      const light = root.querySelector('.pm-light');
      if (light) {
        light.remove();
        AudioSystem.play('cancel');
        sel = null;
        const list = items();
        ensure(list);
        paint(list);
      } else opts.close();
      return;
    }
    const list = items();
    if (!list.length) return;
    ensure(list);
    const dirs: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
      ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
    };
    const d = dirs[c];
    if (d) {
      handled();
      // volume: ← → mexe no controle selecionado
      if (sel instanceof HTMLInputElement && sel.type === 'range' && d[0] !== 0) {
        const step = Number(sel.step) || 0.05;
        sel.value = String(Math.min(Number(sel.max), Math.max(Number(sel.min), Number(sel.value) + d[0] * step)));
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      move(list, d[0], d[1]);
      paint(list);
      return;
    }
    if (c === 'Space' || c === 'KeyE' || c === 'Enter') {
      handled();
      if (e.repeat || !sel) return;
      const el = sel;
      if (el instanceof HTMLInputElement) return;
      el.click();
      // a tela pode ter sido redesenhada (troca de aba, botão de salvar): recalcula o cursor
      requestAnimationFrame(() => {
        const l = items();
        if (!l.includes(el)) sel = null;
        ensure(l);
        paint(l);
      });
    }
  };
  // cursor aparece assim que a aba desenha (sem esperar a primeira tecla) — só no modo controle/teclado
  const obs = new MutationObserver(() => {
    const list = items();
    if (!list.length) return;
    ensure(list);
    paint(list);
  });
  obs.observe(root, { childList: true, subtree: true });
  window.addEventListener('keydown', onKey, true);
  requestAnimationFrame(() => {
    const list = items();
    ensure(list);
    paint(list);
  });
  return () => {
    obs.disconnect();
    window.removeEventListener('keydown', onKey, true);
  };
}
