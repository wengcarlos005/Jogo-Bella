/**
 * Máquina de escrever: o texto vai aparecendo letra por letra dentro de `el`.
 * `skip()` completa na hora (Espaço no meio da frase). `done` resolve quando terminar.
 */
export function typewrite(el: HTMLElement, text: string, cps = 38, onTick?: () => void): { done: Promise<void>; skip: () => void; typing: () => boolean } {
  const chars = Array.from(text);
  let n = 0;
  let timer = 0;
  let finished = false;
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));
  const caret = document.createElement('i');
  caret.className = 'tw-caret';
  const textNode = document.createTextNode('');
  el.replaceChildren(textNode, caret);
  const end = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    textNode.nodeValue = text;
    caret.remove();
    onTick?.();
    resolveDone();
  };
  const tick = () => {
    if (finished) return;
    n++;
    textNode.nodeValue = chars.slice(0, n).join('');
    if (n % 6 === 0) onTick?.();
    if (n >= chars.length) return end();
    const c = chars[n - 1];
    // pausinha nas pontuações, como quem escreve à mão
    const pause = /[.!?]/.test(c) ? 260 : /[,;:]/.test(c) ? 120 : 0;
    timer = window.setTimeout(tick, 1000 / cps + pause);
  };
  timer = window.setTimeout(tick, 120);
  return { done, skip: end, typing: () => !finished };
}
