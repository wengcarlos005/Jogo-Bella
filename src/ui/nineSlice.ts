import { assetURL } from '@/utils/asset';

/**
 * Molduras desenhadas do HUD (barra de cima, plaquinhas, pergaminho, barra de itens) esticam só no
 * meio: as pontas (laços, lua, rolinhos, pedrinhas) ficam na proporção da arte, sem achatar.
 * É um "9-slice" com border-image, na escala da altura de cada elemento.
 */
type Spec = { sel: string; file: string; h: number; slice: [number, number, number, number] };
const SPECS: Spec[] = [
  { sel: '#topbar', file: 'hud-topbar.png', h: 183, slice: [28, 200, 48, 300] },
  { sel: '.tb-place, .tb-mem, .tb-nerves, .tb-encanto', file: 'hud-plaque.png', h: 165, slice: [40, 55, 40, 55] },
  { sel: '.tb-quest', file: 'hud-scroll.png', h: 174, slice: [30, 92, 38, 92] },
  { sel: '#hotbar .sb-bag', file: 'hud-hotbar-frame.png', h: 190, slice: [30, 86, 30, 86] },
];

const specOf = new WeakMap<Element, Spec>();
let ro: ResizeObserver | null = null;

function paint(el: HTMLElement): void {
  const s = specOf.get(el);
  if (!s) return;
  const hgt = el.offsetHeight;
  if (!hgt) return;
  const k = hgt / s.h;
  const [t, r, b, l] = s.slice;
  const px = (n: number) => `${(n * k).toFixed(2)}px`;
  el.style.setProperty('border-image', `url("${assetURL(`assets/ui/${s.file}`)}") ${t} ${r} ${b} ${l} fill / ${px(t)} ${px(r)} ${px(b)} ${px(l)} / 0 stretch`, 'important');
  el.style.setProperty('border-style', 'solid', 'important');
  el.style.setProperty('border-width', '0', 'important');
  el.style.setProperty('background', 'none', 'important');
}

function scan(root: ParentNode = document): void {
  for (const s of SPECS)
    root.querySelectorAll<HTMLElement>(s.sel).forEach((el) => {
      if (specOf.has(el)) return;
      specOf.set(el, s);
      ro?.observe(el);
      paint(el);
    });
}

export function initNineSlice(): void {
  if (ro) return;
  ro = new ResizeObserver((entries) => entries.forEach((e) => paint(e.target as HTMLElement)));
  scan();
  // peças que aparecem depois (ex.: plaquinha de nervosismo): só olha dentro das barras
  const mo = new MutationObserver(() => scan());
  for (const id of ['topbar', 'hotbar']) {
    const bar = document.getElementById(id);
    if (bar) mo.observe(bar, { childList: true, subtree: true });
  }
}
