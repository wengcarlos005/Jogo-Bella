import { assetURL } from '@/utils/asset';

/**
 * Troca os corações de texto (♥ / ❤️) da interface pelo coração desenhado do jogo (hud-heart-*).
 * Vale pra tudo: vidas dos minijogos, placares, menus, cartas. Num "medidor" (vidas, pips),
 * coração sem a classe "on" vira o coração vazio.
 */
const HEART = /♥|❤️|❤/;
const METER = /lives|hearts|balde|pips|nerves|kg-|title-hearts/;

let ready = false;
function setVars(): void {
  if (ready) return;
  ready = true;
  const de = document.documentElement.style;
  de.setProperty('--px-heart', `url("${assetURL('assets/ui/hud-heart-full.png')}")`);
  de.setProperty('--px-heart-empty', `url("${assetURL('assets/ui/hud-heart-empty.png')}")`);
}

function isMeter(el: HTMLElement): boolean {
  const p = el.parentElement;
  return !!p && METER.test(p.className || '');
}

function leaf(el: HTMLElement): void {
  if (el.dataset.pxh) return;
  el.dataset.pxh = '1';
  el.classList.add('pxh');
  const empty = el.classList.contains('off') || (isMeter(el) && !el.classList.contains('on'));
  el.classList.toggle('pxh-empty', empty);
}

/** "perde 1 ♥ (são 3)": o coração no meio do texto vira o desenho. */
function inline(node: Text): void {
  const t = node.nodeValue ?? '';
  if (!HEART.test(t) || t.trim().length <= 2) return;
  const parts = t.split(/(♥|❤️|❤)/);
  const frag = document.createDocumentFragment();
  for (const part of parts) {
    if (HEART.test(part) && part.length <= 2) {
      const i = document.createElement('i');
      i.className = 'pxh pxh-inline';
      i.dataset.pxh = '1';
      i.textContent = '♥';
      frag.append(i);
    } else if (part) frag.append(part);
  }
  node.replaceWith(frag);
}

/** Aplica dentro de um elemento (também chamado no fim da máquina de escrever). */
export function decorateHearts(root: Node): void {
  setVars();
  if (root.nodeType === 3) {
    const p = (root as Text).parentElement;
    if (!p || p.closest('[data-typing], .ph-screen, .ph-msgs, input, textarea')) return;
    if (p.childNodes.length === 1 && HEART.test((root as Text).nodeValue?.trim() ?? '') && ((root as Text).nodeValue?.trim().length ?? 0) <= 2) leaf(p);
    else inline(root as Text);
    return;
  }
  if (root.nodeType !== 1) return;
  const el = root as HTMLElement;
  if (el.closest('[data-typing], .ph-screen, .ph-msgs')) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (HEART.test(n.nodeValue ?? '')) texts.push(n as Text);
  for (const t of texts) decorateHearts(t);
}

export function initGlyphs(): void {
  setVars();
  decorateHearts(document.body);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') {
        const t = m.target as Text;
        const p = t.parentElement;
        if (p?.dataset.pxh) {
          // o texto do coração mudou (ex.: meter trocou classes) — recalcula vazio/cheio
          p.classList.toggle('pxh-empty', p.classList.contains('off') || (isMeter(p) && !p.classList.contains('on')));
          continue;
        }
        if (HEART.test(t.nodeValue ?? '')) decorateHearts(t);
        continue;
      }
      if (m.type === 'attributes') {
        const el = m.target as HTMLElement;
        if (el.dataset.pxh) el.classList.toggle('pxh-empty', el.classList.contains('off') || (isMeter(el) && !el.classList.contains('on')));
        continue;
      }
      m.addedNodes.forEach((n) => decorateHearts(n));
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
}
