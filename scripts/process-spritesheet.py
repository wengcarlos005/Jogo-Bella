#!/usr/bin/env python3
"""
Converte uma spritesheet gerada por IA (grade 4x4, fundo branco/xadrez)
em uma spritesheet limpa para o jogo.

  - remove o fundo (flood fill a partir das bordas, cores claras e neutras)
  - detecta os 16 quadros pela projeção (linhas/colunas vazias)
  - usa UMA escala para a folha toda (personagem com altura uniforme)
  - alinha cada quadro pelos pés (base) e pelo centro da cabeça
  - reduz com filtro de área e binariza o alfa (bordas nítidas)

Uso:
  python3 scripts/process-spritesheet.py entrada.png saida.png [--frame 96] [--height 72]

Requer: Pillow e numpy.
"""
import argparse
import numpy as np
from PIL import Image


def load_alpha(path: str) -> np.ndarray | None:
    """Canal alfa original, se a imagem tiver transparência de verdade."""
    im = Image.open(path)
    if im.mode not in ("RGBA", "LA", "PA") and "transparency" not in im.info:
        return None
    a = np.asarray(im.convert("RGBA"))[..., 3]
    return a if a.min() < 250 else None


def load_flat(path: str) -> np.ndarray:
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return np.asarray(bg.convert("RGB")).astype(np.int16)


def _grow(mask: np.ndarray) -> np.ndarray:
    g = mask.copy()
    g[1:, :] |= mask[:-1, :]
    g[:-1, :] |= mask[1:, :]
    g[:, 1:] |= mask[:, :-1]
    g[:, :-1] |= mask[:, 1:]
    return g


def _absorb_halo(mask: np.ndarray, rgb: np.ndarray, iters: int = 6) -> np.ndarray:
    """Pixels claros/neutros (antialias do fundo) colados no fundo entram na máscara."""
    mn = rgb.min(axis=2)
    mx = rgb.max(axis=2)
    halo = (mn > 120) & ((mx - mn) < 45)
    for _ in range(iters):
        mask = mask | (_grow(mask) & halo)
    return mask


def _components(mask: np.ndarray) -> list[np.ndarray]:
    """Componentes conexos (4-vizinhança) — devolve arrays de coordenadas (y, x)."""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    out = []
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        stack = [(y, x)]
        seen[y, x] = True
        pts = []
        while stack:
            cy, cx = stack.pop()
            pts.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        out.append(np.array(pts))
    return out


def background_mask(rgb: np.ndarray) -> np.ndarray:
    mn = rgb.min(axis=2)
    mx = rgb.max(axis=2)
    cand = (mn > 185) & ((mx - mn) < 28)
    mask = np.zeros_like(cand)
    mask[0, :] = cand[0, :]
    mask[-1, :] = cand[-1, :]
    mask[:, 0] |= cand[:, 0]
    mask[:, -1] |= cand[:, -1]
    while True:
        grown = _grow(mask) & cand
        if (grown == mask).all():
            break
        mask = grown
    return _absorb_halo(mask, rgb)


def fill_edge_holes(
    mask: np.ndarray,
    rgb: np.ndarray,
    bands: list[tuple[int, int]],
    max_area: int,
    near: int,
    min_light: int = 175,
    max_sat: int = 35,
) -> np.ndarray:
    """
    Remove "bolsões" de fundo presos dentro do contorno (ex.: miolo dos cachos
    na borda do cabelo). Só remove bolsões pequenos, perto da silhueta e fora
    da faixa dos pés — preserva olhos, dentes, estampas e tênis brancos.
    """
    mn = rgb.min(axis=2)
    mx = rgb.max(axis=2)
    cand = (mn > min_light) & ((mx - mn) < max_sat) & ~mask
    near_bg = mask.copy()
    for _ in range(near):
        near_bg = _grow(near_bg)
    fg = ~mask
    for comp in _components(cand):
        if len(comp) > max_area:
            continue
        ys, xs = comp[:, 0], comp[:, 1]
        if not near_bg[ys, xs].any():
            continue
        # anel ao redor do bolsão: precisa ser quase todo contorno escuro/cabelo
        # (miolo de cacho). Tecido branco é cercado de dobras e linhas claras.
        y0, y1 = max(0, ys.min() - 2), min(mask.shape[0], ys.max() + 3)
        x0, x1 = max(0, xs.min() - 2), min(mask.shape[1], xs.max() + 3)
        local = np.zeros((y1 - y0, x1 - x0), dtype=bool)
        local[ys - y0, xs - x0] = True
        ring = _grow(_grow(local)) & ~local & ~mask[y0:y1, x0:x1]
        ring_rgb = rgb[y0:y1, x0:x1][ring]
        if len(ring_rgb) == 0:
            continue
        dark = (ring_rgb.max(axis=1) < 110).mean()
        if dark < 0.7:
            continue
        cy = ys.mean()
        band = next(((a, b) for a, b in bands if a <= cy < b), None)
        if band:
            rows = np.nonzero(fg[band[0]:band[1]].any(axis=1))[0]
            if len(rows):
                top, bottom = band[0] + rows.min(), band[0] + rows.max()
                if (cy - top) / max(1, bottom - top) > 0.8:
                    continue  # faixa dos pés/tênis
        mask[ys, xs] = True
    return _absorb_halo(mask, rgb, 4)


def segments(profile: np.ndarray, n: int, min_gap: int = 3) -> list[tuple[int, int]]:
    filled = profile > 0
    segs, start = [], None
    for i, f in enumerate(filled):
        if f and start is None:
            start = i
        elif not f and start is not None:
            segs.append([start, i])
            start = None
    if start is not None:
        segs.append([start, len(filled)])
    # funde segmentos separados por vãos minúsculos
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    # mantém os n maiores, em ordem
    if len(merged) > n:
        merged = sorted(sorted(merged, key=lambda s: s[1] - s[0], reverse=True)[:n])
    if len(merged) != n:
        size = len(profile) / n
        return [(int(i * size), int((i + 1) * size)) for i in range(n)]
    return [tuple(s) for s in merged]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--frame", type=int, default=96)
    ap.add_argument("--height", type=int, default=72, help="altura do personagem (px) no quadro")
    ap.add_argument("--grid", type=int, default=4)
    ap.add_argument("--no-holes", dest="holes", action="store_false", help="não remove bolsões de fundo internos")
    ap.add_argument("--hole-area", type=int, default=900, help="área máx. (px da imagem original) de um bolsão")
    ap.add_argument("--hole-near", type=int, default=16, help="distância máx. (px) do bolsão até o fundo externo")
    args = ap.parse_args()

    rgb = load_flat(args.src)
    bg = background_mask(rgb)
    src_alpha = load_alpha(args.src)
    alpha_cut = 128
    if src_alpha is not None:
        # transparência real (ex.: miolo dos cachos já vem vazado). O limite fica
        # no meio entre a opacidade típica do fundo (bordas) e o opaco total.
        border = np.concatenate([src_alpha[0], src_alpha[-1], src_alpha[:, 0], src_alpha[:, -1]])
        alpha_cut = int((float(np.median(border)) + 255) / 2)
        bg = _absorb_halo(bg | (src_alpha < alpha_cut), rgb, 3)
    n = args.grid
    rows = segments((~bg).sum(axis=1), n, min_gap=8)
    if args.holes:
        bg = fill_edge_holes(bg, rgb, rows, args.hole_area, args.hole_near)
        # 2ª passada: miolos minúsculos e acinzentados colados na borda
        bg = fill_edge_holes(bg, rgb, rows, 60, 8, min_light=85, max_sat=45)
    alpha = ~bg
    cells = []
    for r0, r1 in rows:
        band = alpha[r0:r1]
        cols = segments(band.sum(axis=0), n, min_gap=8)
        for c0, c1 in cols:
            sub = alpha[r0:r1, c0:c1]
            ys, xs = np.nonzero(sub)
            if len(ys) == 0:
                cells.append(None)
                continue
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            cells.append((r0 + y0, r0 + y1, c0 + x0, c0 + x1))

    heights = [c[1] - c[0] for c in cells if c]
    scale = args.height / float(np.median(heights))
    fw = fh = args.frame
    out = Image.new("RGBA", (fw * n, fh * n), (0, 0, 0, 0))
    # Cor de saída: em imagens com transparência real, usa a cor original do
    # pixel (contornos semitransparentes não "acinzentam" sobre o branco).
    color = rgb.astype(np.uint8)
    if src_alpha is not None:
        raw = np.asarray(Image.open(args.src).convert("RGBA"))[..., :3]
        color = np.where((src_alpha >= alpha_cut)[..., None], raw, color).astype(np.uint8)
    rgba = np.dstack([color, (alpha * 255).astype(np.uint8)])
    src_img = Image.fromarray(rgba, "RGBA")

    for i, c in enumerate(cells):
        if not c:
            continue
        y0, y1, x0, x1 = c
        crop = src_img.crop((x0, y0, x1, y1))
        w = max(1, round((x1 - x0) * scale))
        h = max(1, round((y1 - y0) * scale))
        # reduz com alfa pré-multiplicado para não "vazar" branco
        arr = np.asarray(crop).astype(np.float32) / 255.0
        arr[..., :3] *= arr[..., 3:4]
        small = np.stack(
            [np.asarray(Image.fromarray((arr[..., k] * 255).astype(np.uint8)).resize((w, h), Image.BOX)) for k in range(4)],
            axis=2,
        ).astype(np.float32) / 255.0
        a = small[..., 3:4]
        rgbs = np.where(a > 0, small[..., :3] / np.maximum(a, 1e-6), 0)
        alpha_bin = (a[..., 0] > 0.5).astype(np.float32)
        # remove pixels soltos (≤ 1 vizinho opaco em 8 direções)
        pad = np.pad(alpha_bin, 1)
        neigh = sum(np.roll(np.roll(pad, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)[1:-1, 1:-1]
        alpha_bin[(alpha_bin > 0) & (neigh <= 1)] = 0
        frame = np.dstack([np.clip(rgbs, 0, 1), alpha_bin])
        frame_img = Image.fromarray((frame * 255).astype(np.uint8), "RGBA")

        # centro horizontal = centro da cabeça (terço superior)
        top = np.asarray(crop)[: max(1, (y1 - y0) // 3), :, 3]
        xs = np.nonzero(top.sum(axis=0))[0]
        head_cx = ((xs.min() + xs.max()) / 2.0) * scale if len(xs) else w / 2
        col, row = i % n, i // n
        px = col * fw + round(fw / 2 - head_cx)
        py = row * fh + fh - 1 - h
        out.alpha_composite(frame_img, (max(col * fw, px), max(row * fh, py)))

    out.save(args.dst)
    print(f"{args.src} -> {args.dst}  quadros={len([c for c in cells if c])} escala={scale:.4f}")


if __name__ == "__main__":
    main()
