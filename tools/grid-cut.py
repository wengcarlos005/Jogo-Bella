"""Recorta uma folha em fundo magenta por GRADE fixa (linhas x colunas) em PNGs transparentes.

Uso: python3 tools/grid-cut.py <folha> <pasta-saida> <linhas> <colunas> <escala> nome1 nome2 ...
Os nomes seguem a ordem de leitura. Cada célula é limpa do magenta (e da franja) e cortada justa.
"""
import sys
from PIL import Image

src, out, rows, cols, scale, *names = sys.argv[1:]
rows, cols, scale = int(rows), int(cols), float(scale)
im = Image.open(src).convert('RGBA')
W, H = im.size


def is_bg(r, g, b):
    return r > 140 and b > 140 and g < 120 and abs(r - b) < 100


for i, name in enumerate(names):
    r, c = divmod(i, cols)
    cell = im.crop((c * W // cols, r * H // rows, (c + 1) * W // cols, (r + 1) * H // rows))
    px = cell.load()
    w, h = cell.size
    bg = [[is_bg(*px[x, y][:3]) for x in range(w)] for y in range(h)]
    for _ in range(4):
        kill = []
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if bg[y][x] or not (bg[y - 1][x] or bg[y + 1][x] or bg[y][x - 1] or bg[y][x + 1]):
                    continue
                rr, gg, bb = px[x, y][:3]
                if rr - gg > 35 and bb - gg > 35 and bb > 90:
                    kill.append((x, y))
        for x, y in kill:
            bg[y][x] = True
    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                px[x, y] = (0, 0, 0, 0)
    box = cell.getbbox()
    cell = cell.crop(box)
    if scale != 1:
        cell = cell.resize((max(1, round(cell.width * scale)), max(1, round(cell.height * scale))), Image.NEAREST)
    cell.save(f'{out}/{name}.png')
    print(name, cell.size)
