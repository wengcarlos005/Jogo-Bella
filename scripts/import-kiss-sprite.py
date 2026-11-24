"""Importa um sprite de beijo desenhado à parte (fundo de cor sólida) pro formato do jogo:
136x136, fundo transparente, mesma altura e a frente do rosto no mesmo lugar do sprite de beijo
original (a animação do beijo aproxima os dois por essa medida).

Uso: import-kiss-sprite.py <entrada> <x0,x1 do recorte> <cor-fundo r,g,b> <referencia.png> <frente: right|left> <saida.png>
"""
import sys
from PIL import Image
import numpy as np

src, crop, bg, ref, front, out = sys.argv[1:7]
x0, x1 = (int(v) for v in crop.split(','))
bg = np.array([float(v) for v in bg.split(',')])
F = 136

rgb = np.array(Image.open(src).convert('RGB')).astype(float)[:, x0:x1]
dist = np.sqrt(((rgb - bg) ** 2).sum(2))
alpha = np.clip((dist - 40) / 50, 0, 1)
clean = np.clip((rgb - (1 - alpha[..., None]) * bg) / np.maximum(alpha, 1e-3)[..., None], 0, 255)
edge = alpha < 0.5
for _ in range(4):
    e = edge.copy()
    e[1:] |= edge[:-1]; e[:-1] |= edge[1:]; e[:, 1:] |= edge[:, :-1]; e[:, :-1] |= edge[:, 1:]
    edge = e
R, G, B = clean[..., 0], clean[..., 1], clean[..., 2]
if bg[1] > bg[0] and bg[1] > bg[2]:
    clean[..., 1] = np.where(edge & (G > R + 12) & (G > B + 12), np.maximum(R, B), G)
else:
    spill = edge & (R > G + 30) & (B > G + 30) & (np.abs(R - B) < 70)
    clean[..., 0] = np.where(spill, np.minimum(R, G + (np.minimum(R, B) - G) * 0.25), R)
    clean[..., 2] = np.where(spill, np.minimum(B, G + (np.minimum(R, B) - G) * 0.6), B)
img = Image.fromarray(np.dstack([clean, alpha * 255]).astype(np.uint8))
solid = alpha > 0.5
ys, xs = np.where(solid.any(1))[0], np.where(solid.any(0))[0]
img = img.crop((xs[0], ys[0], xs[-1] + 1, ys[-1] + 1))

r = np.array(Image.open(ref).convert('RGBA'))[..., 3] > 40
rys, rxs = np.where(r.any(1))[0], np.where(r.any(0))[0]
scale = (rys[-1] - rys[0] + 1) / img.height
img = img.convert('RGBa').resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS).convert('RGBA')
a = np.array(img)
al = a[..., 3].astype(float)
a[..., 3] = np.where(al < 90, 0, np.where(al > 165, 255, al)).astype(np.uint8)
img = Image.fromarray(a)
ox = rxs[-1] + 1 - img.width if front == 'right' else rxs[0]
oy = rys[-1] + 1 - img.height
outimg = Image.new('RGBA', (F, F))
outimg.paste(img, (int(ox), int(oy)), img)
outimg.save(out)
print('ok', out, 'escala', round(scale, 4), 'pos', ox, oy)
