"""Separa uma folha de objetos em fundo magenta (#FF00FF) em PNGs transparentes.

Uso: python3 tools/sprite-sheet.py <folha.png> <pasta-saida> <prefixo> nome1 nome2 ...
Os nomes seguem a ordem de leitura (linhas de cima pra baixo, esquerda pra direita).
Cada objeto sai recortado justo, em 2/3 do tamanho original (mesma resolução dos cenários no jogo).
"""
import sys
from collections import deque
from PIL import Image, ImageFilter

src, out, prefix, *names = sys.argv[1:]
im = Image.open(src).convert('RGBA')
W, H = im.size
px = im.load()


def is_bg(r, g, b):
    # magenta e tons de magenta (inclui a "névoa" de compressão perto do fundo)
    return r > 150 and b > 150 and g < 110 and abs(r - b) < 90


bg = [[is_bg(*px[x, y][:3]) for x in range(W)] for y in range(H)]

# franja: pixels encostados no fundo e puxados pro magenta viram fundo (2 passadas)
for _ in range(2):
    kill = []
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if bg[y][x]:
                continue
            if not (bg[y - 1][x] or bg[y + 1][x] or bg[y][x - 1] or bg[y][x + 1]):
                continue
            r, g, b = px[x, y][:3]
            if r - g > 45 and b - g > 45 and b > 110:
                kill.append((x, y))
    for x, y in kill:
        bg[y][x] = True

# componentes conectados numa máscara engordada (junta pedacinhos do mesmo objeto, ex.: flor e vaso)
mask = Image.new('L', (W, H), 0)
mp = mask.load()
for y in range(H):
    for x in range(W):
        if not bg[y][x]:
            mp[x, y] = 255
fat = mask.filter(ImageFilter.MaxFilter(13)).load()
seen = bytearray(W * H)
comps = []
for y0 in range(H):
    for x0 in range(W):
        if not fat[x0, y0] or seen[y0 * W + x0]:
            continue
        q = deque([(x0, y0)])
        seen[y0 * W + x0] = 1
        n = 0
        x_min = x_max = x0
        y_min = y_max = y0
        while q:
            x, y = q.popleft()
            if not bg[y][x]:
                n += 1
                x_min, x_max, y_min, y_max = min(x_min, x), max(x_max, x), min(y_min, y), max(y_max, y)
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < W and 0 <= ny < H and fat[nx, ny] and not seen[ny * W + nx]:
                    seen[ny * W + nx] = 1
                    q.append((nx, ny))
        if n > 400:
            comps.append((x_min, y_min, x_max + 1, y_max + 1))

comps.sort(key=lambda c: (int(((c[1] + c[3]) / 2) / (H / 3)), c[0]))
print(len(comps), 'objetos')
for c, name in zip(comps, names):
    x0, y0, x1, y1 = c
    crop = im.crop(c)
    cp = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            if bg[y0 + y][x0 + x]:
                cp[x, y] = (0, 0, 0, 0)
    # 2/3 do tamanho (como os cenários), sem borrar
    w2, h2 = max(1, round(crop.width * 2 / 3)), max(1, round(crop.height * 2 / 3))
    crop = crop.resize((w2, h2), Image.NEAREST)
    crop.save(f'{out}/{prefix}-{name}.png')
    print(name, c, '->', (w2, h2))
