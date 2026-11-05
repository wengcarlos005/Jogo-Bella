#!/usr/bin/env python3
"""
Recorta folhas de bichinhos (fundo transparente):
  walk  -> grade 4x4 (baixo, esquerda, direita, cima), quadros FxF, alinhados pela base e pelo centro da caixa
  poses -> faixa de N poses, quadros WxH, mesma escala da folha de andar (passada por --scale-ref)

Uso:
  python3 scripts/process-pet.py walk  entrada.png saida.png --frame 64 --height 40
  python3 scripts/process-pet.py poses entrada.png saida.png --fw 96 --fh 64 --height 44 --ref-index 0
"""
import argparse, importlib.util, os
import numpy as np
from PIL import Image

spec = importlib.util.spec_from_file_location("ps", os.path.join(os.path.dirname(__file__), "process-spritesheet.py"))
ps = importlib.util.module_from_spec(spec); spec.loader.exec_module(ps)


def shrink(crop: Image.Image, scale: float) -> Image.Image:
    w = max(1, round(crop.width * scale)); h = max(1, round(crop.height * scale))
    arr = np.asarray(crop).astype(np.float32) / 255.0
    arr[..., :3] *= arr[..., 3:4]
    small = np.stack([np.asarray(Image.fromarray((arr[..., k] * 255).astype(np.uint8)).resize((w, h), Image.BOX)) for k in range(4)], 2).astype(np.float32) / 255.0
    a = small[..., 3:4]
    rgb = np.where(a > 0, small[..., :3] / np.maximum(a, 1e-6), 0)
    ab = (a[..., 0] > 0.4).astype(np.float32)
    pad = np.pad(ab, 1)
    neigh = sum(np.roll(np.roll(pad, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)[1:-1, 1:-1]
    ab[(ab > 0) & (neigh <= 1)] = 0
    return Image.fromarray((np.dstack([np.clip(rgb, 0, 1), ab]) * 255).astype(np.uint8), "RGBA")


def load(path):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im)[..., 3] > 128
    return im, a


def cells_grid(a, n):
    out = []
    for r0, r1 in ps.segments(a.sum(axis=1), n, min_gap=8):
        for c0, c1 in ps.segments(a[r0:r1].sum(axis=0), n, min_gap=8):
            ys, xs = np.nonzero(a[r0:r1, c0:c1])
            out.append((c0 + xs.min(), r0 + ys.min(), c0 + xs.max() + 1, r0 + ys.max() + 1))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["walk", "poses"])
    ap.add_argument("src"); ap.add_argument("dst")
    ap.add_argument("--frame", type=int, default=64)
    ap.add_argument("--fw", type=int, default=96); ap.add_argument("--fh", type=int, default=64)
    ap.add_argument("--height", type=float, default=40)
    ap.add_argument("--n", type=int, default=4)
    ap.add_argument("--ref-index", type=int, default=0, help="pose cuja altura vira --height")
    args = ap.parse_args()
    im, a = load(args.src)
    if args.mode == "walk":
        cells = cells_grid(a, 4)
        front = [c[3] - c[1] for c in cells[:4]]
        scale = args.height / float(np.median(front))
        fw = fh = args.frame
        out = Image.new("RGBA", (fw * 4, fh * 4), (0, 0, 0, 0))
        for i, (x0, y0, x1, y1) in enumerate(cells):
            s = shrink(im.crop((x0, y0, x1, y1)), scale)
            col, row = i % 4, i // 4
            out.alpha_composite(s, (col * fw + (fw - s.width) // 2, row * fh + fh - 1 - s.height))
    else:
        (r0, r1), = ps.segments(a.sum(axis=1), 1, min_gap=8)
        cols = ps.segments(a[r0:r1].sum(axis=0), args.n, min_gap=20)
        cells = []
        for c0, c1 in cols:
            ys, xs = np.nonzero(a[r0:r1, c0:c1])
            cells.append((c0 + xs.min(), r0 + ys.min(), c0 + xs.max() + 1, r0 + ys.max() + 1))
        ref = cells[args.ref_index]
        scale = args.height / float(ref[3] - ref[1])
        fw, fh = args.fw, args.fh
        out = Image.new("RGBA", (fw * len(cells), fh), (0, 0, 0, 0))
        for i, (x0, y0, x1, y1) in enumerate(cells):
            s = shrink(im.crop((x0, y0, x1, y1)), scale)
            if s.width > fw or s.height > fh:
                k = min(fw / s.width, fh / s.height); s = s.resize((int(s.width * k), int(s.height * k)), Image.NEAREST)
            out.alpha_composite(s, (i * fw + (fw - s.width) // 2, fh - 1 - s.height))
    out.save(args.dst)
    print(args.dst, out.size, "escala", round(scale, 4))


if __name__ == "__main__":
    main()
