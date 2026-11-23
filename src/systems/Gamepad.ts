/**
 * Controle (PlayStation / Xbox / genérico) → teclado.
 *
 * O jogo inteiro (mapa, diálogos, menus e minigames) é lido pelo teclado. Aqui cada botão do
 * controle "aperta" a tecla equivalente (keydown/keyup sintéticos na janela), então tudo funciona
 * sem mexer em cada tela. Mapeamento (layout padrão do navegador):
 *   ✕ (Cross / A) ......... Espaço  → confirmar, conversar, pular, usar
 *   ◯ (Circle / B) ........ Q       → voltar / cancelar
 *   □ (Square / X) ........ Shift   → correr (segurar)
 *   △ (Triangle / Y) ...... M       → menu
 *   OPTIONS / START ....... Esc     → menu
 *   L1 / R1 ............... ← / →   (atalho pra escolher nos minijogos)
 *   L2 / R2 ............... Shift   → correr
 *   Direcional / analógico  setas
 * Enquanto o controle é usado, os textos de tecla viram os símbolos do controle (✕ ◯ □ △).
 */

type Key = { code: string; key: string };
const K = (code: string, key: string): Key => ({ code, key });
const SPACE = K('Space', ' ');
const BUTTONS: Record<number, Key> = {
  0: SPACE,
  1: K('KeyQ', 'q'),
  2: K('ShiftLeft', 'Shift'),
  3: K('KeyM', 'm'),
  4: K('ArrowLeft', 'ArrowLeft'),
  5: K('ArrowRight', 'ArrowRight'),
  6: K('ShiftLeft', 'Shift'),
  7: K('ShiftLeft', 'Shift'),
  9: K('Escape', 'Escape'),
  12: K('ArrowUp', 'ArrowUp'),
  13: K('ArrowDown', 'ArrowDown'),
  14: K('ArrowLeft', 'ArrowLeft'),
  15: K('ArrowRight', 'ArrowRight'),
};
const DEAD = 0.45;

/** quantas fontes (botões/eixos) estão segurando cada tecla agora */
const holding = new Map<string, number>();
let padMode = false;
let raf = 0;
let prev: boolean[] = [];

function send(type: 'keydown' | 'keyup', k: Key): void {
  window.dispatchEvent(new KeyboardEvent(type, { code: k.code, key: k.key, bubbles: true, cancelable: true }));
}
function press(k: Key): void {
  const n = holding.get(k.code) ?? 0;
  holding.set(k.code, n + 1);
  if (n === 0) send('keydown', k);
}
function release(k: Key): void {
  const n = holding.get(k.code) ?? 0;
  if (n <= 1) {
    holding.delete(k.code);
    if (n === 1) send('keyup', k);
  } else holding.set(k.code, n - 1);
}

function poll(): void {
  raf = requestAnimationFrame(poll);
  const pads = navigator.getGamepads?.() ?? [];
  const pad = Array.from(pads).find((p) => p && p.connected);
  if (!pad) return;
  const now: boolean[] = [];
  for (const i of Object.keys(BUTTONS)) now[+i] = !!pad.buttons[+i]?.pressed;
  // analógico esquerdo vira setas
  const ax = pad.axes[0] ?? 0;
  const ay = pad.axes[1] ?? 0;
  now[100] = ax < -DEAD;
  now[101] = ax > DEAD;
  now[102] = ay < -DEAD;
  now[103] = ay > DEAD;
  const STICK: Record<number, Key> = { 100: BUTTONS[14], 101: BUTTONS[15], 102: BUTTONS[12], 103: BUTTONS[13] };
  for (let i = 0; i < now.length; i++) {
    if (now[i] === undefined || now[i] === !!prev[i]) continue;
    const k = BUTTONS[i] ?? STICK[i];
    if (!k) continue;
    if (now[i]) {
      setPadMode(true);
      press(k);
    } else release(k);
  }
  prev = now;
}

// ---------------------------------------------------------------- textos das teclas
const LABEL: Record<string, string> = { Espaço: '✕', Enter: '✕', Esc: 'OPTIONS', Shift: '□', setas: 'direcional' };
const original = new WeakMap<Node, string>();
const hidden = new Set<HTMLElement>();

function swapText(node: Text): void {
  // textos que já mostram as duas formas (ex.: "✕ / Espaço") ficam como estão
  if ((node.parentElement as HTMLElement | null)?.closest('.kb-only, .no-swap')) return;
  const t = node.nodeValue ?? '';
  if (!/Espaço|\bShift\b|\bEsc\b/.test(t)) return;
  if (!original.has(node)) original.set(node, t);
  node.nodeValue = t.replace(/Espaço/g, '✕').replace(/\bShift\b/g, '□').replace(/\bEsc\b/g, 'OPTIONS');
}
function relabel(root: ParentNode): void {
  if (!padMode) return;
  root.querySelectorAll?.('kbd').forEach((el) => {
    const k = el as HTMLElement;
    if (k.dataset.kb) return;
    const t = k.textContent ?? '';
    if (t === 'E') {
      // "Espaço / E" vira só "✕": some o E e o separador
      k.dataset.kb = t;
      k.style.display = 'none';
      hidden.add(k);
      const sep = k.previousSibling;
      if (sep && sep.nodeType === 3 && /^\s*(\/|ou)\s*$/.test(sep.nodeValue ?? '')) {
        original.set(sep, sep.nodeValue ?? '');
        sep.nodeValue = ' ';
      }
      return;
    }
    const to = LABEL[t];
    if (to) {
      k.dataset.kb = t;
      k.textContent = to;
    }
  });
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) swapText(n as Text);
}
function restore(): void {
  document.querySelectorAll<HTMLElement>('kbd[data-kb]').forEach((k) => {
    if (k.dataset.kb === 'E') k.style.display = '';
    else k.textContent = k.dataset.kb ?? '';
    delete k.dataset.kb;
  });
  hidden.clear();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const o = original.get(n);
    if (o !== undefined) n.nodeValue = o;
  }
}

export function isPadMode(): boolean {
  return padMode;
}

/** Escolha feita no início ("PC" ou "Controle"): com Controle, os textos ficam sempre com ✕ ◯ □ △. */
let device: 'pc' | 'controle' = 'pc';
export function setDevice(d: 'pc' | 'controle'): void {
  device = d;
  setPadMode(d === 'controle');
}

function setPadMode(on: boolean): void {
  if (!on && device === 'controle') return;
  if (padMode === on) return;
  padMode = on;
  document.body.classList.toggle('pad', on);
  if (on) relabel(document.body);
  else restore();
}

let started = false;
export function initGamepad(onConnect?: (name: string) => void): void {
  if (started) return;
  started = true;
  window.addEventListener('gamepadconnected', (e) => {
    setPadMode(true);
    if (!raf) poll();
    onConnect?.((e as GamepadEvent).gamepad.id);
  });
  window.addEventListener('gamepaddisconnected', () => {
    for (const [code] of holding) send('keyup', { code, key: code });
    holding.clear();
    prev = [];
    if (!Array.from(navigator.getGamepads?.() ?? []).some((p) => p?.connected)) setPadMode(false);
  });
  // voltou pro teclado de verdade: textos de teclado de volta
  window.addEventListener('keydown', (e) => e.isTrusted && device === 'pc' && setPadMode(false), true);
  // textos que aparecem depois (diálogos, minijogos, menus)
  new MutationObserver((muts) => {
    if (!padMode) return;
    for (const m of muts) {
      if (m.type === 'characterData' && m.target.nodeType === 3) swapText(m.target as Text);
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 3) swapText(n as Text);
        else if (n.nodeType === 1) relabel(n as Element);
      });
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  // controle já conectado antes de a página abrir
  if (Array.from(navigator.getGamepads?.() ?? []).some((p) => p?.connected) && !raf) poll();
}
