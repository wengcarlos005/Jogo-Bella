"""Converte uma folha de personagem 4x4 (andando: baixo, esquerda, direita, cima) com fundo claro
ou magenta para o formato do jogo: PNG 544x544, quadros 136x136, pés na linha 135.

Uso: python3 tools/char-sheet.py <folha> <saida.png> <altura-do-personagem-em-px>
O fundo é removido por inundação a partir das bordas de cada célula (o branco DENTRO do contorno,
como camisa branca e tênis, fica intacto).
"""
import sys
from collections import deque
from PIL import Image

src, out, target_h = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGBA')
W, H = im.size
F = 136


def is_bg(p):
    r, g, b, a = p
    if a < 100:
        return True
    if r > 150 and b > 150 and g < 120:  # magenta
        return True
    return min(r, g, b) > 196 and max(r, g, b) - min(r, g, b) < 34


cells = []
for row in range(4):
    for col in range(4):
        cell = im.crop((col * W // 4, row * H // 4, (col + 1) * W // 4, (row + 1) * H // 4))
        w, h = cell.size
        px = cell.load()
        seen = bytearray(w * h)
        q = deque()
        for x in range(w):
            for y in (0, h - 1):
                q.append((x, y))
        for y in range(h):
            for x in (0, w - 1):
                q.append((x, y))
        while q:
            x, y = q.popleft()
            if seen[y * w + x] or not is_bg(px[x, y]):
                continue
            seen[y * w + x] = 1
            px[x, y] = (0, 0, 0, 0)
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                    q.append((nx, ny))
        # franja clara colada no contorno
        for y in range(h):
            for x in range(w):
                p = px[x, y]
                if p[3] and min(p[:3]) > 215 and any(
                    0 <= x + dx < w and 0 <= y + dy < h and px[x + dx, y + dy][3] == 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                ):
                    px[x, y] = (0, 0, 0, 0)
        # só o personagem: o maior pedaço (e o que encosta nele); restos da linha vizinha saem
        comps = []
        seen2 = bytearray(w * h)
        for y0 in range(h):
            for x0 in range(w):
                if seen2[y0 * w + x0] or px[x0, y0][3] == 0:
                    continue
                pts = []
                q2 = deque([(x0, y0)])
                seen2[y0 * w + x0] = 1
                while q2:
                    x, y = q2.popleft()
                    pts.append((x, y))
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if 0 <= nx < w and 0 <= ny < h and not seen2[ny * w + nx] and px[nx, ny][3]:
                            seen2[ny * w + nx] = 1
                            q2.append((nx, ny))
                comps.append(pts)
        if comps:
            big_c = max(comps, key=len)
            bx0 = min(p[0] for p in big_c) - 6
            bx1 = max(p[0] for p in big_c) + 6
            by0 = min(p[1] for p in big_c) - 6
            by1 = max(p[1] for p in big_c) + 6
            for pts in comps:
                if pts is big_c:
                    continue
                inside = sum(1 for (x, y) in pts if bx0 <= x <= bx1 and by0 <= y <= by1)
                if inside < len(pts) * 0.8:
                    for x, y in pts:
                        px[x, y] = (0, 0, 0, 0)
        cells.append(cell)

ref = cells[0].getbbox()
scale = target_h / (ref[3] - ref[1])
sheet = Image.new('RGBA', (F * 4, F * 4), (0, 0, 0, 0))
for i, cell in enumerate(cells):
    bb = cell.getbbox()
    if not bb:
        continue
    cw = cell.width
    big = cell.resize((max(1, round(cell.width * scale)), max(1, round(cell.height * scale))), Image.LANCZOS)
    # limpa semitransparência do redimensionamento (pixel art: tudo ou nada)
    bp = big.load()
    for y in range(big.height):
        for x in range(big.width):
            r, g, b, a = bp[x, y]
            bp[x, y] = (r, g, b, 255 if a >= 128 else 0)
    bb2 = big.getbbox()
    cx = (cw / 2) * scale  # centro da célula
    ox = round(F / 2 - cx)
    oy = 135 - bb2[3]
    r, c = divmod(i, 4)
    tile = Image.new('RGBA', (F, F), (0, 0, 0, 0))
    tile.alpha_composite(big, (max(-big.width, ox), oy)) if ox >= 0 and oy >= 0 else tile.paste(big, (ox, oy), big)
    sheet.alpha_composite(tile, (c * F, r * F))
sheet.save(out)
print(out, 'escala', round(scale, 3))
