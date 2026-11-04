#!/usr/bin/env python3
"""
Gera um retrato de diálogo (96x96) a partir do primeiro quadro (frente)
de uma spritesheet de IA em alta resolução.

Uso: python3 scripts/make-portrait.py entrada.webp saida.png [--crop 0.55]
"""
import argparse
import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image

spec = importlib.util.spec_from_file_location("ps", Path(__file__).with_name("process-spritesheet.py"))
ps = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ps)

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("dst")
ap.add_argument("--crop", type=float, default=0.55, help="fração superior do corpo usada (cabeça+ombros)")
ap.add_argument("--size", type=int, default=96)
a = ap.parse_args()

rgb = ps.load_flat(a.src)
alpha = ~ps.background_mask(rgb)
r0, r1 = ps.segments(alpha.sum(axis=1), 4, 8)[0]
c0, c1 = ps.segments(alpha[r0:r1].sum(axis=0), 4, 8)[0]
sub = alpha[r0:r1, c0:c1]
ys, xs = np.nonzero(sub)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
h = int((y1 - y0) * a.crop)
side = max(h, x1 - x0)
cx = (x0 + x1) // 2
box = (c0 + cx - side // 2, r0 + y0, c0 + cx + side // 2, r0 + y0 + side)
img = Image.fromarray(np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)]), "RGBA").crop(box)
img = img.resize((a.size, a.size), Image.BOX)
arr = np.asarray(img).copy()
arr[..., 3] = np.where(arr[..., 3] > 127, 255, 0)
Image.fromarray(arr, "RGBA").save(a.dst)
print(f"{a.src} -> {a.dst}")
