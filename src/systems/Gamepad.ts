/**
 * Controle (PlayStation / Xbox / genérico) → teclado.
 *
 * O jogo inteiro (mapa, diálogos, menus e minigames) é lido pelo teclado. Aqui cada botão do
 * controle "aperta" a tecla equivalente (keydown/keyup sintéticos na janela), então tudo funciona
 * sem mexer em cada tela. Mapeamento (layout padrão do navegador):
 *   ✕ (Cross / A) ......... Espaço    → confirmar, conversar, pular, usar
 *   ◯ (Circle / B) ........ Q         → voltar / cancelar / fechar o menu
 *   □ (Square / X) ........ Shift     → correr (segurar)
 *   △ (Triangle / Y) ...... I         → Mochila
 *   OPTIONS / START ....... Esc       → menu
 *   SHARE / SELECT ........ L         → Álbum
 *   L1 / R1 ............... PgUp/PgDn → trocar de aba no menu
 *   L2 / R2 ............... Shift     → correr
 *   Direcional / analógico  setas
 * Enquanto o controle é usado, os textos de tecla viram os símbolos do controle (✕ ◯ □ △).
 */

type Key = { code: string; key: string };
const K = (code: string, key: string): Key => ({ code, key });
const SPACE = K('Space', ' ');

/** Ações do controle → tecla que elas "apertam". */
export type PadAction = 'confirm' | 'back' | 'run' | 'bag' | 'menu' | 'album' | 'tabPrev' | 'tabNext' | 'up' | 'down' | 'left' | 'right';
export const ACTION_KEY: Record<PadAction, Key> = {
  confirm: SPACE,
  back: K('KeyQ', 'q'),
  run: K('ShiftLeft', 'Shift'),
  bag: K('KeyI', 'i'),
  menu: K('Escape', 'Escape'),
  album: K('KeyL', 'l'),
  tabPrev: K('PageUp', 'PageUp'),
  tabNext: K('PageDown', 'PageDown'),
  up: K('ArrowUp', 'ArrowUp'),
  down: K('ArrowDown', 'ArrowDown'),
  left: K('ArrowLeft', 'ArrowLeft'),
  right: K('ArrowRight', 'ArrowRight'),
};
/** Um botão (b) ou um eixo (a) num valor (v): direcional "de eixo" dos controles genéricos, gatilhos. */
export type Bind = { b: number } | { a: number; v: number };
export type PadMap = [PadAction, Bind][];

/** Layout padrão do navegador (DualSense / DualShock / Xbox reconhecidos). */
const STANDARD: PadMap = [
  ['confirm', { b: 0 }], ['back', { b: 1 }], ['run', { b: 2 }], ['bag', { b: 3 }],
  ['tabPrev', { b: 4 }], ['tabNext', { b: 5 }], ['run', { b: 6 }], ['run', { b: 7 }],
  ['album', { b: 8 }], ['menu', { b: 9 }],
  ['up', { b: 12 }], ['down', { b: 13 }], ['left', { b: 14 }], ['right', { b: 15 }],
];
/** Controle não reconhecido e ainda sem configuração: qualquer botão da frente confirma, START abre o menu,
 *  direcional de eixo ("chapéu" no eixo 9) anda. Dá pra navegar no título e na carta antes de configurar. */
const FORGIVING: PadMap = [
  ['confirm', { b: 0 }], ['confirm', { b: 1 }], ['confirm', { b: 2 }], ['confirm', { b: 3 }],
  ['tabPrev', { b: 4 }], ['tabNext', { b: 5 }], ['run', { b: 6 }], ['run', { b: 7 }],
  ['album', { b: 8 }], ['menu', { b: 9 }],
  ['up', { b: 12 }], ['down', { b: 13 }], ['left', { b: 14 }], ['right', { b: 15 }],
  ['up', { a: 9, v: -1 }], ['right', { a: 9, v: -0.4286 }], ['down', { a: 9, v: 0.1429 }], ['left', { a: 9, v: 0.7143 }],
];
const DEAD = 0.45;

/** Mapas configurados pela Bella (Opções › Configurar controle), por modelo de controle. */
const MAPS_KEY = 'bella-controle-v1';
function loadMaps(): Record<string, PadMap> {
  try {
    return JSON.parse(localStorage.getItem(MAPS_KEY) ?? '{}') as Record<string, PadMap>;
  } catch {
    return {};
  }
}
let customMaps = loadMaps();
export function saveCustomMap(padId: string, map: PadMap): void {
  customMaps = { ...customMaps, [padId]: map };
  try {
    localStorage.setItem(MAPS_KEY, JSON.stringify(customMaps));
  } catch {
    /* modo privado: vale só nesta sessão */
  }
}
export function hasCustomMap(padId: string): boolean {
  return !!customMaps[padId];
}
/** Todos os controles conectados (controles genéricos às vezes aparecem duas vezes, ou vem um "fantasma"). */
export function allPads(): Gamepad[] {
  return Array.from(navigator.getGamepads?.() ?? []).filter((p): p is Gamepad => !!p && p.connected);
}
/** O controle que ela está usando: o que mandou sinal por último. */
let lastActiveId = '';
export function currentPad(): Gamepad | null {
  const pads = allPads();
  return pads.find((p) => p.id === lastActiveId) ?? pads.sort((x, y) => y.timestamp - x.timestamp)[0] ?? null;
}
/** Controle desconhecido (ordem de botões própria) ainda sem configuração? */
export function needsSetup(): boolean {
  return allPads().some((p) => p.mapping !== 'standard' && !customMaps[p.id]);
}
/** Enquanto a tela de configurar está aberta, o controle não aperta tecla nenhuma. */
let calibrating = false;
export function setCalibrating(on: boolean): void {
  calibrating = on;
  if (on) {
    for (const [code] of holding) send('keyup', { code, key: code });
    holding.clear();
    prev = {};
  }
}

export function bindActive(pad: Gamepad, bind: Bind): boolean {
  if ('b' in bind) return !!pad.buttons[bind.b]?.pressed || (pad.buttons[bind.b]?.value ?? 0) > 0.5;
  const val = pad.axes[bind.a] ?? 0;
  // eixo de analógico/gatilho: passou da metade pro lado certo; "chapéu" do direcional: valor exato
  if (Math.abs(bind.v) >= 0.9) return val * Math.sign(bind.v) > 0.5;
  return Math.abs(val - bind.v) < 0.12;
}

/** quantas fontes (botões/eixos) estão segurando cada tecla agora */
const holding = new Map<string, number>();
let padMode = false;
let raf = 0;
let prev: Record<string, boolean> = {};

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
  if (calibrating) return;
  const now: Record<string, boolean> = {};
  const keyOf: Record<string, Key> = {};
  // lê TODOS os controles conectados (o que recebe os botões pode não ser o primeiro da lista)
  allPads().forEach((pad, pi) => {
    const map = customMaps[pad.id] ?? (pad.mapping === 'standard' ? STANDARD : FORGIVING);
    let any = false;
    map.forEach(([action, bind], i) => {
      const id = `${pi}:${i}:${action}`;
      now[id] = bindActive(pad, bind);
      keyOf[id] = ACTION_KEY[action];
      if (now[id]) any = true;
    });
    // analógico esquerdo sempre anda (setas)
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    const st: [string, boolean, Key][] = [['l', ax < -DEAD, ACTION_KEY.left], ['r', ax > DEAD, ACTION_KEY.right], ['u', ay < -DEAD, ACTION_KEY.up], ['d', ay > DEAD, ACTION_KEY.down]];
    for (const [k, on, key] of st) {
      now[`${pi}:s:${k}`] = on;
      keyOf[`${pi}:s:${k}`] = key;
      if (on) any = true;
    }
    if (any) lastActiveId = pad.id;
  });
  for (const id of Object.keys(now)) {
    if (now[id] === !!prev[id]) continue;
    if (now[id]) {
      setPadMode(true);
      press(keyOf[id]);
    } else release(keyOf[id]);
  }
  prev = now;
}

// ---------------------------------------------------------------- nomes dos botões (PlayStation ou Xbox)
/** 'xbox' = A B X Y / START / SELECT (Xbox e genéricos); 'ps' = ✕ ◯ □ △ / OPTIONS / SHARE. */
export type PadStyle = 'auto' | 'ps' | 'xbox';
let styleSetting: PadStyle = 'auto';
const GLYPHS = {
  ps: { confirm: '✕', back: '◯', run: '□', bag: '△', menu: 'OPTIONS', album: 'SHARE', tabs: 'L1 / R1' },
  xbox: { confirm: 'A', back: 'B', run: 'X', bag: 'Y', menu: 'START', album: 'SELECT', tabs: 'L1 / R1' },
};
export type GlyphKey = keyof (typeof GLYPHS)['ps'];
function resolvedStyle(): 'ps' | 'xbox' {
  if (styleSetting !== 'auto') return styleSetting;
  const id = currentPad()?.id ?? '';
  return /054c|sony|dualsense|dualshock|playstation|ps4|ps5/i.test(id) ? 'ps' : 'xbox';
}
/** Nome do botão no controle que ela tem na mão. */
export function glyph(k: GlyphKey): string {
  return GLYPHS[resolvedStyle()][k];
}
export function setPadStyle(st: PadStyle): void {
  styleSetting = st;
  if (padMode) {
    restore();
    relabel(document.body);
  }
}
const label = (): Record<string, string> => ({ Espaço: glyph('confirm'), Enter: glyph('confirm'), Esc: glyph('menu'), Shift: glyph('run'), setas: 'direcional' });
const original = new WeakMap<Node, string>();
const hidden = new Set<HTMLElement>();

function swapText(node: Text): void {
  // textos que já mostram as duas formas (ex.: "✕ / Espaço") ficam como estão
  if ((node.parentElement as HTMLElement | null)?.closest('.kb-only, .no-swap')) return;
  const t = node.nodeValue ?? '';
  if (!/Espaço|\bShift\b|\bEsc\b/.test(t)) return;
  if (!original.has(node)) original.set(node, t);
  node.nodeValue = t.replace(/Espaço/g, glyph('confirm')).replace(/\bShift\b/g, glyph('run')).replace(/\bEsc\b/g, glyph('menu'));
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
    const to = label()[t];
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
export function initGamepad(onConnect?: (name: string) => void, onUnknown?: (pad: Gamepad) => void): void {
  if (started) return;
  started = true;
  window.addEventListener('gamepadconnected', (e) => {
    setPadMode(true);
    if (!raf) poll();
    const pad = (e as GamepadEvent).gamepad;
    onConnect?.(pad.id);
    // controle que o navegador não reconhece: só avisa (a configuração é oferecida depois da carta, ou em Opções)
    if (pad.mapping !== 'standard' && !hasCustomMap(pad.id)) onUnknown?.(pad);
    if (!raf) poll();
  });
  window.addEventListener('gamepaddisconnected', () => {
    for (const [code] of holding) send('keyup', { code, key: code });
    holding.clear();
    prev = {};
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
