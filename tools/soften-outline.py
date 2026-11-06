"""Deixa um objeto recortado mais "integrado" ao cenário de noite.

Uso: python3 tools/soften-outline.py <png> [escurecer=0.82]
- contorno de fora (pixels escuros encostados no transparente) vira marrom-escuro meio transparente
- o corpo escurece um pouco (sem mexer nos pixels de luz amarela da lâmpada)
"""
import sys
from PIL import Image

path = sys.argv[1]
k = float(sys.argv[2]) if len(sys.argv) > 2 else 0.82
im = Image.open(path).convert('RGBA')
W, H = im.size
px = im.load()
src = im.copy().load()


def edge(x, y):
    return any(not (0 <= x + dx < W and 0 <= y + dy < H) or src[x + dx, y + dy][3] == 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))


for y in range(H):
    for x in range(W):
        r, g, b, a = src[x, y]
        if a == 0:
            continue
        lum = max(r, g, b)
        glow = r > 200 and g > 150 and b < 140  # luz da lâmpada: fica como está
        if lum < 70 and edge(x, y):
            px[x, y] = (52, 36, 34, 120)
        elif lum < 70:
            px[x, y] = (min(255, r + 22), min(255, g + 14), min(255, b + 10), a)
        elif not glow:
            px[x, y] = (round(r * k), round(g * k * 0.97), round(b * k * 0.95), a)
im.save(path)
