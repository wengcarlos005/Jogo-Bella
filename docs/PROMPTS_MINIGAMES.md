# Prompts — sprites dos minigames

Todas as folhas vão em fundo magenta liso (#FF00FF) e em **grade fixa**, para o recorte automático (`tools/sprite-sheet.py`) acertar a ordem.

Já têm sprites (não precisa gerar): hambúrguer (Rota 66), Uber, açaí, cartas Bate-Gato.

| # | Minigame | O que falta | Anexar no ChatGPT |
|---|---|---|---|
| 1 | Churrasqueira (10 fases) | ✅ carnes, grelha e fogo | cenário do quintal |
| 2 | Beijo escondido (sofá) | ✅ mãe, sombra e casal no sofá | sprite da mãe, da Bella e do Weng + sala |
| 3 | Novelo da Meli (apê) | Meli correndo/pulando + novelo | sprite da Meli |
| 4 | Achadinhos da Multidão | ✅ já jogável (escolha com orçamento nas lojinhas) · folha de itens opcional | fachada do Multidão |
| 7 | Moça do caixa do Multidão | ✅ no jogo | sprite da atendente |
| 5 | Doces do Quitandinha | algodão-doce, pipoca, máquina de foto | folha do Quitandinha |
| 6 | Gatinhos de Fragoso | cancelado (ficam os atuais) | — |

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

## 7. Moça do caixa do Multidão (NPC)

Anexe: a folha andando da atendente (`npcs/atendente-walk.png`) como modelo de layout.

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person: a cheerful young Brazilian woman, store cashier, short curly dark hair in a puff with a yellow headband, warm brown skin, red store polo shirt with a small name badge (no readable text), dark jeans, white sneakers.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

## 8. Garçons (NPCs)

Anexe nos dois a folha andando da atendente (`public/assets/npcs/atendente-walk.png`) como modelo de layout.

### Garçom do restaurante chique de Petrópolis

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person: a friendly young Brazilian male waiter, short dark hair, light brown skin, white shirt with rolled sleeves, black vest, black bow tie, black apron at the waist, black pants and shoes.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

### Garçom do restaurante mexicano

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person: a cheerful Brazilian male waiter at a colorful Mexican restaurant, curly dark hair and a short mustache, tan skin, bright red short-sleeve shirt with a small colorful embroidered pattern on the chest, a green apron with orange stripes at the waist, dark jeans, brown shoes. No hat.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

## 9. Lembranças que ainda estão sem foto

Anexe uma lembrança que já existe como modelo de estilo (`public/assets/cinematics/pascoa.png`) e os sprites da Bella e do Weng.

### Açaí cheio de complemento (mem-dq-02)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Inside a small purple-neon açaí shop at night in Duque de Caxias, Brazil: the attached girl (long curly brown hair, pink glasses, black t-shirt) and the attached boy (short black hair, black t-shirt) sit side by side at a small wooden table. In front of them, one HUGE cup of açaí overflowing with toppings: granola, banana slices, strawberries, condensed milk drizzle, paçoca, colorful candy. She is happily eating the part full of toppings; he holds a spoon with only plain purple açaí and makes a funny resigned face. Warm lighting, a purple neon "Açaiteria" sign glowing behind them, little hearts in the air. No text other than the neon sign, no UI, no watermark.
```

### O imbatível perdeu (mem-dq-03)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. In a cozy apartment living room at night: the attached girl (long curly brown hair, pink glasses) and the attached boy (short black hair) sit on the floor facing each other with playing cards spread between them. She raises her arms in victory, laughing, with a big pile of won cards; he covers his face with one hand in fake despair. An orange cat sits next to them looking at the cards. Warm lamp light, a blue couch behind them. No text, no UI, no watermark.
```

## 10. Taco Roleta (minigame novo do mexicano)

Jogo: o Weng esconde uma pimenta dentro de um dos 3 tacos e o garçom embaralha os pratos cada vez mais rápido.
A Bella (que odeia pimenta) tem que seguir com o olho e escolher um taco SEM pimenta. 5 rodadas. Errou: cara vermelha e fumaça.

### Folha A — tacos e objetos

Anexe o cenário do restaurante mexicano (`art-source/maps/piabeta-mexicano-base.webp`).

```
Pixel art sprite sheet of props for a Mexican restaurant minigame, same art style as the attached image (cozy pixel art, clean dark outlines, warm saturated colors), slightly top-down 3/4 view.

Canvas 1536x1024 pixels. Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 3 rows and 4 columns (each cell 384x341 px), every sprite centered in its own cell, nothing touching another sprite or the cell edge:
Row 1:
1. A colorful round Mexican talavera clay plate, empty, seen from slightly above (about 260x120 px).
2. A closed crunchy corn taco lying on its side, filling hidden (about 200x120 px). The SAME taco shape must be used in 3 and 4.
3. The same taco tilted open showing a normal filling: beef, yellow cheese, guacamole, tomato (about 200x140 px).
4. The same taco tilted open showing ONE big shiny red chili pepper hidden inside the filling, with a tiny glint (about 200x140 px).
Row 2:
5. A glass of water with ice (about 80x120 px).
6. A big red-orange puff of spicy fire/steam, cartoon style (about 160x160 px).
7. A colorful Mexican sombrero hat (about 220x120 px).
8. A white question mark speech bubble (about 80x90 px).
Row 3:
9. A golden sparkle star (about 90x90 px).
10. A red "X" mark made of two chili peppers crossed (about 110x110 px).
11. A small bowl of lime wedges (about 120x80 px).
12. A bottle of red hot sauce (about 60x130 px).

No text, no labels, no numbers, no watermark.
```

### Folha B — reações da Bella e do Weng (bustos)

Anexe o sprite da Bella (casual, camiseta preta, óculos rosa) e o do Weng (casual).

```
Pixel art sprite sheet of character bust reactions, using EXACTLY the same characters, art style, outline and colors as the attached character sprites, drawn bigger as chest-up busts facing the viewer, cute chibi proportions.

Canvas 1536x1024 pixels. Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no shadows on the background.

STRICT GRID of 2 rows and 3 columns (each cell 512x512 px), each bust centered in its own cell, about 340x400 px, nothing touching:
Row 1 — the girl (long curly brown hair, pink glasses, black t-shirt), wearing a colorful Mexican sombrero:
1. Concentrated, squinting, following something with her eyes.
2. Happy, eating a taco, eyes closed, little hearts around.
3. Burning from spicy food: face bright red, tears, steam coming out of her ears, tongue out.
Row 2 — the boy (short black hair, black t-shirt), wearing a colorful Mexican sombrero:
4. Mischievous grin, hiding a red chili pepper behind his back.
5. Laughing out loud, holding his belly.
6. Proud and sweating, eating a taco with three chili peppers sticking out, one tear rolling down.

No text, no labels, no numbers, no watermark.
```
