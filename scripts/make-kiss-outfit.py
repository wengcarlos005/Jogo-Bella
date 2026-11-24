"""Beijo com outra roupa: os olhos fechados do sprite de beijo (desenhado com a roupa do
primeiro encontro) vão pro quadro de lado da roupa nova. Só os pixels do rosto (pele/olhos) mudam.
Uso: make-kiss-outfit.py <repo> <roupa> <saida-dir>   ex.: . branco public/assets/characters"""
import sys
from PIL import Image
import numpy as np

repo, outfit, out = sys.argv[1], sys.argv[2], sys.argv[3]
F = 136


def frame(key, row):
    im = Image.open(f'{repo}/public/assets/characters/{key}.webp').convert('RGBA')
    return np.array(im.crop((0, row * F, F, row * F + F))).astype(int)


def skin(a):
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    return (al > 200) & (r > 170) & (g > 105) & (r > b + 35)


for who, row in (('bella', 2), ('weng', 1)):  # a Bella beija olhando pra direita; o Weng, pra esquerda
    kiss = np.array(Image.open(f'{repo}/public/assets/characters/{who}-kiss.png').convert('RGBA')).astype(int)
    cas = frame(f'{who}-casual', row)
    new = frame(f'{who}-{outfit}', row)
    # onde fica o rosto da roupa nova em relação ao do sprite de beijo
    best = min(((np.abs(np.roll(np.roll(new, dy, 0), dx, 1)[30:75] - cas[30:75])[..., :3].sum(), dx, dy)
                for dx in range(-8, 9) for dy in range(-8, 9)))
    _, dx, dy = best
    diff = np.abs(kiss - cas).sum(2) > 30
    face = np.zeros_like(diff)
    face[38:82] = True
    shifted = np.roll(np.roll(new, dy, 0), dx, 1)
    m = diff & face & (skin(kiss) | skin(cas)) & (skin(shifted) | skin(kiss))
    res = new.copy()
    for y, x in zip(*np.where(m)):
        yy, xx = y - dy, x - dx
        if 0 <= yy < F and 0 <= xx < F:
            res[yy, xx] = kiss[y, x]
    Image.fromarray(res.astype(np.uint8)).save(f'{out}/{who}-kiss-{outfit}.png')
    print(who, outfit, 'offset', dx, dy, 'pixels', int(m.sum()))
