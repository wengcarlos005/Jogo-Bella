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
  python3 scripts/process-spritesheet.py entrada.png saida.png [--frame 48] [--height 38]

Requer: Pillow e numpy.
"""
import argparse
import numpy as np
from PIL import Image


def load_flat(path: str) -> np.ndarray:
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return np.asarray(bg.convert("RGB")).astype(np.int16)


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
        grown = mask.copy()
        grown[1:, :] |= mask[:-1, :]
        grown[:-1, :] |= mask[1:, :]
        grown[:, 1:] |= mask[:, :-1]
        grown[:, :-1] |= mask[:, 1:]
        grown &= cand
        if (grown == mask).all():
            return mask
        mask = grown


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
    ap.add_argument("--frame", type=int, default=48)
    ap.add_argument("--height", type=int, default=38, help="altura do personagem (px) no quadro")
    ap.add_argument("--grid", type=int, default=4)
    args = ap.parse_args()

    rgb = load_flat(args.src)
    alpha = ~background_mask(rgb)
    n = args.grid
    rows = segments(alpha.sum(axis=1), n, min_gap=8)
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
    rgba = np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])
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
