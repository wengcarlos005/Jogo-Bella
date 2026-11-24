"""Recorta os ícones da roleta (fundo magenta) em public/assets/minigames/roleta-<id>.webp.

uso: python3 scripts/import-roleta-icons.py <folha> <colunas> <linhas> <id1,id2,...> [lado]
     python3 scripts/import-roleta-icons.py <folha> box <id:x0,y0,x1,y1:lado> [<id:...> ...]
     (box: recorta retângulos escolhidos à mão; o item fica no tamanho natural, maior lado = lado)
"""
import sys
import numpy as np
from PIL import Image

src = sys.argv[1]
BOXES = []
if sys.argv[2] == 'box':
    for spec in sys.argv[3:]:
        i_, b_, sd = spec.split(':')
        BOXES.append((i_, tuple(int(v) for v in b_.split(',')), int(sd)))
    cols = rows = 1
    ids = []
    side = 0
else:
    cols, rows, ids = int(sys.argv[2]), int(sys.argv[3]), sys.argv[4].split(',')
    side = int(sys.argv[5]) if len(sys.argv) > 5 else 192
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
r, g, b = im[..., 0], im[..., 1], im[..., 2]
# distância do magenta: magenta tem R e B altos e G baixo
mag = np.clip(((r + b) / 2 - g - 120) / 60, 0, 1)  # 1 = fundo, 0 = item
alpha = 1 - mag
# tira o rosa que vaza na borda: o magenta misturado vira a cor sem o magenta
rgb = im.copy()
m = mag[..., None]
fg = (im - m * np.array([255, 0, 255])) / np.maximum(1 - m, 1e-3)
edge = (mag > 0.02) & (mag < 0.98)
rgb[edge] = np.clip(fg[edge], 0, 255)
# vizinhos rosados: limita R e B pelo verde + margem perto da borda
a8 = (alpha * 255).astype(np.uint8)
out = np.dstack([rgb.astype(np.uint8), a8])
img = Image.fromarray(out, 'RGBA')
cw, ch = W / cols, H / rows


def item_mask(on):
    """Só o item: descarta pedaços que encostam na borda da célula (vizinho vazando) e migalhas."""
    h, w = on.shape
    lab = np.zeros((h, w), np.int32)
    keep = np.zeros((h, w), bool)
    n = 0
    comps = []
    for y0, x0 in zip(*np.where(on)):
        if lab[y0, x0]:
            continue
        n += 1
        stack = [(y0, x0)]
        lab[y0, x0] = n
        pts = []
        while stack:
            y, x = stack.pop()
            pts.append((y, x))
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and on[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n
                    stack.append((yy, xx))
        ys_ = [p[0] for p in pts]
        xs_ = [p[1] for p in pts]
        touches = min(xs_) == 0 or min(ys_) == 0 or max(xs_) == w - 1 or max(ys_) == h - 1
        comps.append((pts, touches))
    big = max(len(p) for p, _ in comps)
    for pts, touches in comps:
        # pedaço do vizinho vazando: encosta na borda e é bem menor que o item
        if len(pts) <= 30 or (touches and len(pts) < big * 0.5):
            continue
        for y, x in pts:
            keep[y, x] = True
    return keep

def save(cell, id_, side, square=True):
    a = np.asarray(cell)[..., 3]
    keep = item_mask(a > 40)
    cell = Image.fromarray(np.dstack([np.asarray(cell)[..., :3], np.where(keep, a, 0).astype(np.uint8)]), 'RGBA')
    ys, xs = np.where(keep)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    piece = cell.crop(box)
    s = side / max(piece.size)
    w, h = max(1, round(piece.width * s)), max(1, round(piece.height * s))
    arr = np.asarray(piece).astype(np.float32) / 255
    pm = arr.copy(); pm[..., :3] *= pm[..., 3:4]
    pm_img = [Image.fromarray((pm[..., c] * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS) for c in range(4)]
    pm2 = np.dstack([np.asarray(x).astype(np.float32) / 255 for x in pm_img])
    al = pm2[..., 3:4]
    col = np.where(al > 0, pm2[..., :3] / np.maximum(al, 1e-4), 0)
    res = Image.fromarray((np.dstack([np.clip(col, 0, 1), al]) * 255).astype(np.uint8), 'RGBA')
    if square:
        canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        canvas.paste(res, ((side - w) // 2, (side - h) // 2))
        res = canvas
    res.save(f'public/assets/minigames/roleta-{id_}.webp', lossless=True)
    print(id_, piece.size, '->', res.size)


for id_, b_, sd in BOXES:
    save(img.crop(b_), id_, sd, square=False)

for k, id_ in enumerate(ids):
    if id_ == '-':
        continue
    cx, cy = k % cols, k // cols
    cell = img.crop((int(cx * cw), int(cy * ch), int((cx + 1) * cw), int((cy + 1) * ch)))
    save(cell, id_, side)
