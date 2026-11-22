"""Converte os PNGs pesados de public/assets em WebP (o jogo carrega bem mais rápido).

Uso: python3 tools/optimize-assets.py
- Ilustrações e cenários (cinematics, maps, ui grandes): WebP com perda, qualidade 90.
- Sprites (personagens, npcs, objetos, minigames, retratos...): WebP SEM perda (pixel a pixel igual).
- Só converte se o WebP ficar menor; aí apaga o PNG. O código continua pedindo "x.png":
  src/utils/asset.ts troca sozinho pelo .webp.
Pode rodar de novo sempre que entrar arte nova.
"""
import os, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
LOSSY = {'cinematics', 'maps'}
MIN = 40_000  # bytes: PNG pequeno não vale a pena
before = after = n = 0
for dirpath, _, names in os.walk(ROOT):
    top = os.path.relpath(dirpath, ROOT).split(os.sep)[0]
    if top in ('audio', 'tilesets'):
        continue
    for name in names:
        if not name.endswith('.png'):
            continue
        src = os.path.join(dirpath, name)
        size = os.path.getsize(src)
        if size < MIN:
            continue
        dst = src[:-4] + '.webp'
        im = Image.open(src)
        has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
        im = im.convert('RGBA' if has_alpha else 'RGB')
        lossy = top in LOSSY or (top == 'ui' and not has_alpha and size > 300_000)
        if lossy:
            im.save(dst, 'WEBP', quality=90, method=6)
        else:
            im.save(dst, 'WEBP', lossless=True, quality=100, method=6)
        new = os.path.getsize(dst)
        if new >= size:
            os.remove(dst)
            continue
        os.remove(src)
        before += size; after += new; n += 1
print(f'{n} arquivos: {before/1e6:.1f} MB -> {after/1e6:.1f} MB')
