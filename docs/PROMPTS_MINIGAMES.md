# Prompts — sprites dos minigames

Todas as folhas vão em fundo magenta liso (#FF00FF) e em **grade fixa**, para o recorte automático (`tools/sprite-sheet.py`) acertar a ordem.

Já têm sprites (não precisa gerar): hambúrguer (Rota 66), Uber, açaí, cartas Bate-Gato.

| # | Minigame | O que falta | Anexar no ChatGPT |
|---|---|---|---|
| 1 | Churrasqueira (10 fases) | 2 folhas: carnes em 4 pontos + churrasqueira/fogo | cenário do quintal |
| 2 | Beijo escondido (sofá) | poses da mãe espiando/flagrando + casal no sofá | sprite da mãe, da Bella e do Weng + sala |
| 3 | Novelo da Meli (apê) | Meli correndo/pulando + novelo | sprite da Meli |
| 4 | Achadinhos da Multidão (novo) | 16 achadinhos + cesta | fachada do Multidão |
| 5 | Doces do Quitandinha | algodão-doce, pipoca, máquina de foto | folha do Quitandinha |
| 6 | Gatinhos de Fragoso | 3 gatos novos (andando + poses) | folhas da Meli |

---

## 1A. Churrasqueira — carnes (4 pontos)

Anexe: o cenário do quintal da Bella.

```
Pixel art sprite sheet of Brazilian barbecue meats for a cooking minigame, same art style as the attached image (crisp pixel art, clean dark outlines, warm saturated colors). Each piece is seen from above at a slight 3/4 angle, as if lying on a grill.

Canvas 1536x1024 pixels. Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no texture, no grill, no plate, no shadows on the background.

Arrange the sprites in a STRICT GRID of 4 rows and 4 columns (each cell 384x256 px), every sprite centered in its own cell, each about 220x130 px, with lots of empty magenta around it. Nothing touches another sprite or the canvas edge.

Columns, left to right = cooking stage: (1) raw, (2) half-cooked/golden, (3) perfectly cooked with dark grill marks, (4) burnt black with little smoke wisps.
Rows, top to bottom:
Row 1: a thick slice of picanha with its white fat cap on top.
Row 2: two linked Brazilian sausages (linguiça toscana).
Row 3: three chicken drumsticks (coxinhas da asa) side by side.
Row 4: a garlic bread baguette (pão de alho) with melted garlic cheese filling.

The same piece must have exactly the same shape and size in all 4 columns; only the color/cooking changes.
No text, no labels, no numbers, no people, no watermark.
```

## 1B. Churrasqueira — grelha e fogo

Anexe: o cenário do quintal da Bella **e** a folha 1A.

```
Pixel art sprite sheet for a barbecue cooking minigame, same art style as the attached images (crisp pixel art, clean dark outlines, warm saturated colors).

Canvas 1536x1024 pixels. Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no texture, no floor, no shadows on the background.

Draw these sprites, each complete and separate, with at least 60 px of magenta between them. Nothing touches another sprite or the canvas edge. Layout:
- TOP ROW: 1. A wide brick Brazilian barbecue (churrasqueira de alvenaria) seen from the front-top, with a big empty metal grill grate on top and glowing orange charcoal embers visible under the grate (about 900x420 px).
- MIDDLE ROW, left to right: 2, 3, 4. A flame bursting up from the coals in 3 animation frames: small, medium, big (each about 130x180 px).  5, 6, 7. A puff of grey-white smoke in 3 frames: small, medium, fading (each about 120x120 px).
- BOTTOM ROW, left to right: 8. Stainless steel barbecue tongs (about 70x220 px). 9. A wooden cutting board (about 260x140 px). 10. A small hand fan made of cardboard for fanning coals (abanador) (about 110x110 px). 11. A bright orange flying spark (about 30x30 px). 12. A golden star for scoring (about 90x90 px).

No text, no labels, no numbers, no people, no watermark.
```

## 2. Beijo escondido — mãe e casal no sofá

Anexe: o sprite da mãe da Bella, da Bella e do Weng (sentados) e a sala da casa da Bella.

```
Pixel art sprite sheet of characters for a "secret kiss on the couch" minigame, using EXACTLY the same characters, art style, outline, colors and scale as the attached character sprites (a standing adult is about 140 px tall). Same top-down 3/4 camera angle as the attached room.

Canvas 1536x1024 pixels. Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no texture, no floor, no furniture, no shadows on the background.

Arrange in a STRICT GRID of 2 rows and 3 columns (each cell 512x512 px), each drawing centered in its own cell, nothing touching anything else.
Row 1 — Bella's mom (the attached mom character):
1. Peeking from the left side, only head, shoulder and one hand visible, as if leaning out of a doorway, suspicious squinting eyes.
2. Standing facing the viewer, arms crossed, one eyebrow raised, "I caught you" face.
3. A long dark human shadow cast on the floor (just the shadow shape, semi-dark purple, no person), as if someone is about to come through the door.
Row 2 — the couple (the attached Bella and Weng) sitting side by side on an invisible seat (do NOT draw the couch):
4. Both sitting straight looking forward innocently, Bella pretending to watch TV, Weng whistling.
5. Both leaning in and kissing, eyes closed, tiny hearts above them.
6. Both startled, jumping apart, wide eyes, sweat drops.

No text, no labels, no numbers, no watermark.
```

## 3. Novelo da Meli

Anexe: o sprite da Meli (gatinha do Weng).

```
Pixel art sprite sheet of a cat playing with a ball of yarn, using EXACTLY the same cat as the attached sprite (same fur colors, markings, art style, outline and scale: the cat is about 64 px long). Seen from the side, top-down 3/4 game camera.

Canvas 1536x1024 pixels. Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no texture, no floor, no shadows on the background.

Arrange in a STRICT GRID of 3 rows and 4 columns (each cell 384x340 px), each sprite centered in its own cell, drawn BIG (cat about 220 px long in this sheet), nothing touching anything else.
Row 1: the cat running to the right, 4 animation frames.
Row 2: the cat pouncing to the right, 4 frames: crouching with wiggling butt, jumping, in the air with paws forward, landing on the yarn.
Row 3: 1. a round blue ball of yarn with lighter strands; 2. the same ball rolling, slightly unrolled with a loose thread trailing; 3. the cat lying on its back hugging the yarn, tangled in blue thread, happy; 4. the cat sitting proudly with the yarn between its paws.

No text, no labels, no numbers, no people, no watermark.
```

## 4. Achadinhos da Multidão (minigame novo)

Anexe: a rua do Weng com a fachada do Multidão.

```
Pixel art sprite sheet of small cute shopping items ("achadinhos") for a Brazilian discount store minigame, same art style as the attached image (crisp pixel art, clean dark outlines, bright happy colors).

Canvas 1536x1024 pixels. Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no texture, no shelf, no shadows on the background.

Arrange in a STRICT GRID of 4 rows and 5 columns (each cell about 307x256 px), every item centered in its own cell, each item about 150x150 px, nothing touching anything else.
Row 1: 1. a pink velvet scrunchie, 2. a tortoiseshell hair claw clip, 3. a tube of hair cream, 4. a round hairbrush, 5. a scented candle in a glass jar.
Row 2: 6. a set of colorful plastic organizer pots, 7. a striped dish towel, 8. a cute mug with a cat face, 9. a stack of paçoca candies, 10. a bag of gummy candies.
Row 3: 11. a chocolate bar, 12. a heart lollipop, 13. a phone case with a cat print, 14. white earphones, 15. a small cat plush toy.
Row 4: 16. a red plastic shopping basket (empty), 17. the same red basket full of items, 18. a yellow price tag (blank, no text), 19. a pink shopping bag, 20. a sparkle effect (4 point star burst).

No text, no letters, no numbers, no labels, no people, no watermark.
```

## 5. Doces e foto do Quitandinha

Anexe: a folha de objetos do Quitandinha.

```
Pixel art sprite sheet of small items, same art style, outline and colors as the attached sprite sheet.

Canvas 1536x1024 pixels. Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no texture, no shadows on the background.

Arrange in a STRICT GRID of 2 rows and 3 columns (each cell 512x512 px), every item centered in its own cell, each about 200x200 px, nothing touching anything else.
Row 1: 1. a big pink cotton candy on a stick, 2. a red and white striped paper bag of sweet popcorn, 3. a vintage camera.
Row 2: 4. an instant photo (polaroid) with a blank sky-blue picture, 5. a small birthday cupcake with one lit candle, 6. a juice box with a straw.

No text, no letters, no numbers, no labels, no people, no watermark.
```

## 6. Gatinhos de Fragoso (3 gatos novos)

Os gatos atuais de Fragoso são a Meli repintada; estes substituem. Cada gato tem 2 folhas: andando e poses.
Anexe sempre a folha correspondente da **Meli** (andando ou poses) como modelo de estilo e layout; na folha de poses, anexe também a folha andando do gato novo.

### Gato 1 — cinza rajado: andando

```
Pixel art walking sprite sheet of a cat, using EXACTLY the same art style, outline thickness, size, proportions and LAYOUT as the attached cat sprite sheet, but a DIFFERENT cat: a SILVER-GREY TABBY street cat with dark grey stripes, white chin and white paws, green eyes, NO collar.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet, each frame centered in its own cell, nothing touching:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up, showing its back and tail), 4 frames.

The cat must look identical in every frame (same colors, same markings). No text, no labels, no numbers, no watermark.
```

### Gato 1 — cinza rajado: poses

```
Pixel art sprite sheet of 4 poses of a cat, using EXACTLY the same art style, outline, size and LAYOUT as the attached cat poses sheet, and EXACTLY the same cat as the attached walking sheet: a SILVER-GREY TABBY street cat with dark grey stripes, white chin and white paws, green eyes, NO collar.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

ONE ROW of 4 poses, left to right, each centered in its own equal cell, nothing touching:
1. Sitting facing the viewer, calm.
2. Curled up sleeping, with small "z z" above.
3. Startled: back arched, fur puffed up, tail up, wide eyes, small surprise marks above (about to run away).
4. Sitting happy with eyes half closed and a small red heart above its head (being petted).

No text, no labels, no numbers, no watermark.
```

### Gato 2 — frajola: andando

```
Pixel art walking sprite sheet of a cat, using EXACTLY the same art style, outline thickness, size, proportions and LAYOUT as the attached cat sprite sheet, but a DIFFERENT cat: a TUXEDO street cat: black body with a white chest, white muzzle, white paws and white belly, yellow eyes, NO collar.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet, each frame centered in its own cell, nothing touching:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up, showing its back and tail), 4 frames.

The cat must look identical in every frame (same colors, same markings). No text, no labels, no numbers, no watermark.
```

### Gato 2 — frajola: poses

```
Pixel art sprite sheet of 4 poses of a cat, using EXACTLY the same art style, outline, size and LAYOUT as the attached cat poses sheet, and EXACTLY the same cat as the attached walking sheet: a TUXEDO street cat: black body with a white chest, white muzzle, white paws and white belly, yellow eyes, NO collar.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

ONE ROW of 4 poses, left to right, each centered in its own equal cell, nothing touching:
1. Sitting facing the viewer, calm.
2. Curled up sleeping, with small "z z" above.
3. Startled: back arched, fur puffed up, tail up, wide eyes, small surprise marks above (about to run away).
4. Sitting happy with eyes half closed and a small red heart above its head (being petted).

No text, no labels, no numbers, no watermark.
```

### Gato 3 — siamês: andando

```
Pixel art walking sprite sheet of a cat, using EXACTLY the same art style, outline thickness, size, proportions and LAYOUT as the attached cat sprite sheet, but a DIFFERENT cat: a SIAMESE street cat: cream body, dark chocolate-brown face mask, ears, paws and tail, bright blue eyes, NO collar.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet, each frame centered in its own cell, nothing touching:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up, showing its back and tail), 4 frames.

The cat must look identical in every frame (same colors, same markings). No text, no labels, no numbers, no watermark.
```

### Gato 3 — siamês: poses

```
Pixel art sprite sheet of 4 poses of a cat, using EXACTLY the same art style, outline, size and LAYOUT as the attached cat poses sheet, and EXACTLY the same cat as the attached walking sheet: a SIAMESE street cat: cream body, dark chocolate-brown face mask, ears, paws and tail, bright blue eyes, NO collar.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

ONE ROW of 4 poses, left to right, each centered in its own equal cell, nothing touching:
1. Sitting facing the viewer, calm.
2. Curled up sleeping, with small "z z" above.
3. Startled: back arched, fur puffed up, tail up, wide eyes, small surprise marks above (about to run away).
4. Sitting happy with eyes half closed and a small red heart above its head (being petted).

No text, no labels, no numbers, no watermark.
```
