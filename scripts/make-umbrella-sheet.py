"""Folha 'segurando guarda-chuva': a folha 4x4 (136px) ganha 48px em cima, a cobertura por cima
da cabeça e, de frente, a mão no cabo. Uso: gen_umb.py <repo> <saida>"""
import sys
from PIL import Image, ImageDraw
import numpy as np

repo, out = sys.argv[1], sys.argv[2]
F, EXTRA = 136, 48
SEAM = 104  # cintura: em cima, o tronco com a mão no cabo; embaixo, as pernas do próprio quadro

CFG = {
    # quadros de frente cuja parte de cima (com o punho na frente do peito) vira a de todos
    'bella-casual': dict(umb='umbrella-bella', up_src={0: 2, 1: 1, 2: 2, 3: 3}, fist=(56, 89), rim=8),
    'weng-casual': dict(umb='umbrella-weng', up_src={0: 1, 1: 1, 2: 3, 3: 3}, fist=(55, 86), rim=6),
}
SHAFT = (74, 52, 44, 255)
SHAFT_HI = (128, 96, 80, 255)


def top_row(a):
    ys = np.where((a[:, :, 3] > 40).any(1))[0]
    return int(ys[0])


for key, c in CFG.items():
    sheet = Image.open(f'{repo}/public/assets/characters/{key}.webp').convert('RGBA')
    canopy = Image.open(f'{repo}/public/assets/objects/{c["umb"]}.png').convert('RGBA')
    cw, ch = canopy.size
    res = Image.new('RGBA', (F * 4, (F + EXTRA) * 4), (0, 0, 0, 0))
    frames = [[sheet.crop((col * F, row * F, col * F + F, row * F + F)) for col in range(4)] for row in range(4)]
    for row in range(4):  # 0 frente, 1 esquerda, 2 direita, 3 costas
        for col in range(4):
            fr = frames[row][col]
            if row == 0:
                src = frames[0][c['up_src'][col]]
                fr = Image.new('RGBA', (F, F))
                fr.paste(src.crop((0, 0, F, SEAM)), (0, 0))
                fr.paste(frames[0][col].crop((0, SEAM, F, F)), (0, SEAM))
            a = np.array(fr)
            top = top_row(a)
            cell = Image.new('RGBA', (F, F + EXTRA))
            rimY = EXTRA + top + c['rim']  # a borda da cobertura encosta no alto do cabelo
            xs = np.where((a[:, :, 3] > 40).any(0))[0]
            headC = (int(xs[0]) + int(xs[-1])) // 2
            d = ImageDraw.Draw(cell)
            if row == 0:
                fx, fy = c['fist']
                cx = fx - 12
                cell.alpha_composite(fr, (0, EXTRA))
                # cabo: da mão até o meio da cobertura, um pouco inclinado pra fora do rosto
                x0, y0, x1, y1 = fx, EXTRA + fy + 8, cx, rimY - 6
                d.line([(x0, y0), (x1, y1)], fill=SHAFT, width=3)
                d.line([(x0 + 1, y0), (x1 + 1, y1)], fill=SHAFT_HI, width=1)
                # gancho do cabo, saindo por baixo da mão
                d.arc([x0 - 1, y0 + 1, x0 + 7, y0 + 9], 20, 200, fill=SHAFT, width=3)
                # a mão por cima do cabo (os pixels de pele do próprio quadro)
                hand = fr.crop((fx - 9, fy - 2, fx + 9, fy + 14))
                ha = np.array(hand)
                sk = (ha[:, :, 0] > 180) & (ha[:, :, 1] > 110) & (ha[:, :, 0] > ha[:, :, 2] + 40) & (ha[:, :, 3] > 200)
                ha[~sk] = 0
                cell.alpha_composite(Image.fromarray(ha), (fx - 9, EXTRA + fy - 2))
                rot = Image.Image.rotate(canopy, 7, resample=Image.NEAREST, expand=True)
                cell.alpha_composite(rot, (cx - rot.width // 2, rimY - rot.height + 4))
            else:
                face = {1: -1, 2: 1, 3: 0}[row]
                cx = headC + face * 4
                if row != 3:
                    # cabo atrás do corpo (a mão de lá segura): aparece só entre a cobertura e a cabeça
                    d.line([(cx, rimY - 4), (cx, EXTRA + 80)], fill=SHAFT, width=3)
                cell.alpha_composite(fr, (0, EXTRA))
                cell.alpha_composite(canopy, (cx - cw // 2, rimY - ch + 2))
            res.alpha_composite(cell, (col * F, row * (F + EXTRA)))
    res.save(f'{out}/{key}-umb.png')
    print('ok', key, res.size)
