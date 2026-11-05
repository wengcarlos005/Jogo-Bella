#!/usr/bin/env python3
"""
Corrige folhas de caminhada em que, de frente/de costas, os dois passos usam o
mesmo pé (comum em arte gerada por IA): o 4º quadro recebe as pernas do 2º
espelhadas, criando o passo do outro pé.

Uso: python3 scripts/fix-walk-cycle.py folha.png [mais.png ...]
"""
import sys
import numpy as np
from PIL import Image

for path in sys.argv[1:]:
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).copy()
    fw = im.width // 4
    fh = im.height // 4
    changed = []
    for row in (0, 3):  # frente e costas
        f1 = a[row * fh:(row + 1) * fh, fw:2 * fw]
        f3 = a[row * fh:(row + 1) * fh, 3 * fw:4 * fw]
        cut = int(fh * 0.79)  # só das coxas para baixo (sem pegar a camiseta)
        l1 = f1[cut:, :, 3] > 0
        l3 = f3[cut:, :, 3] > 0
        if (l1 ^ l3).mean() > 0.03:
            continue  # já são passos diferentes
        legs = f1[cut:, ::-1].copy()
        # o desenho é centrado em fw/2 → espelhar mantém o centro
        a[row * fh + cut:(row + 1) * fh, 3 * fw:4 * fw] = legs
        changed.append(row)
    Image.fromarray(a).save(path)
    print(path, 'corrigido' if changed else 'ok', changed)
