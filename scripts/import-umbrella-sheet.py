"""Importa uma folha "segurando guarda-chuva" desenhada à parte (fundo de cor sólida, grade de
quadros) pro formato do jogo: 4x4 quadros de 136x192 (frente, esquerda, direita, costas), fundo
transparente, mesma escala dos sprites normais e os pés na mesma linha.

Uso: import-umbrella-sheet.py <entrada> <saida.webp> <cor-fundo r,g,b> <escala> <linhas> <ordem>
  ordem: índice da linha da entrada pra frente,esquerda,direita,costas (ex.: 0,1,2,3)
"""
import sys
from PIL import Image
import numpy as np

src, out, bg, scale, nrows, order = sys.argv[1:7]
bg = np.array([float(v) for v in bg.split(',')])
scale, nrows = float(scale), int(nrows)
order = [int(v) for v in order.split(',')]
FW, FH, BASE = 136, 192, 190

rgb = np.array(Image.open(src).convert('RGB')).astype(float)
dist = np.sqrt(((rgb - bg) ** 2).sum(2))
alpha = np.clip((dist - 40) / 50, 0, 1)
# tira a cor do fundo que vazou nas bordas (des-mistura)
a3 = np.maximum(alpha, 1e-3)[..., None]
clean = np.clip((rgb - (1 - alpha[..., None]) * bg) / a3, 0, 255)
# borda: o que sobrou da cor do fundo (rosa-magenta ou verde) some, sem mexer no resto do desenho
edge = alpha < 0.5
for _ in range(4):
    e = edge.copy()
    e[1:] |= edge[:-1]; e[:-1] |= edge[1:]; e[:, 1:] |= edge[:, :-1]; e[:, :-1] |= edge[:, 1:]
    edge = e
R, G, B = clean[..., 0], clean[..., 1], clean[..., 2]
if bg[1] > bg[0] and bg[1] > bg[2]:  # fundo verde
    spill = edge & (G > R + 12) & (G > B + 12)
    clean[..., 1] = np.where(spill, np.maximum(R, B), G)
else:  # fundo magenta
    spill = edge & (R > G + 30) & (B > G + 30) & (np.abs(R - B) < 70)
    low = np.minimum(R, B)
    clean[..., 0] = np.where(spill, np.minimum(R, G + (low - G) * 0.25), R)
    clean[..., 2] = np.where(spill, np.minimum(B, G + (low - G) * 0.6), B)
rgba = np.dstack([clean, alpha * 255]).astype(np.uint8)
solid = alpha > 0.5
H, W = solid.shape


def runs(p, minlen):
    r, s = [], None
    for i, v in enumerate(p > 0):
        if v and s is None:
            s = i
        if not v and s is not None:
            if i - s >= minlen:
                r.append((s, i))
            s = None
    if s is not None:
        r.append((s, len(p)))
    return r


cols = runs(solid.sum(0), 20)
assert len(cols) == 4, cols
prof = solid.sum(1)
cuts = [0] + [int(np.argmin(prof[int(i * H / nrows) - 30:int(i * H / nrows) + 30])) + int(i * H / nrows) - 30 for i in range(1, nrows)] + [H]
bands = [(cuts[i], cuts[i + 1]) for i in range(nrows)]

sheet = Image.new('RGBA', (FW * 4, FH * 4))
for gr, sr in enumerate(order):
    y0, y1 = bands[sr]
    info = []
    for (x0, x1) in cols:
        m = solid[y0:y1, x0:x1]
        ys = np.where(m.any(1))[0]
        top, bot = ys[0], ys[-1]
        # centro do corpo pelas pernas (o guarda-chuva fica fora da conta)
        legs = m[bot - int((bot - top) * 0.22):bot + 1]
        xs = np.where(legs.any(0))[0]
        info.append(((xs[0] + xs[-1]) / 2, bot))
    cx = np.mean([i[0] for i in info])
    bottom = max(i[1] for i in info)
    for gc, (x0, x1) in enumerate(cols):
        cell = Image.fromarray(rgba[y0:y1, x0:x1]).convert('RGBa')
        w, h = cell.size
        cell = cell.resize((round(w * scale), round(h * scale)), Image.LANCZOS).convert('RGBA')
        a = np.array(cell)
        al = a[..., 3].astype(float)
        a[..., 3] = np.where(al < 90, 0, np.where(al > 165, 255, al)).astype(np.uint8)
        cell = Image.fromarray(a)
        ox = round(FW / 2 - cx * scale)
        oy = round(BASE - bottom * scale)
        frame = Image.new('RGBA', (FW, FH))
        frame.paste(cell, (ox, oy), cell)
        sheet.alpha_composite(frame, (gc * FW, gr * FH))
sheet.save(out, lossless=True, quality=100, method=6)
print('ok', out, 'bandas', bands)
