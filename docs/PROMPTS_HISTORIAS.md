# Próximas histórias — plano + prompts de arte

Ordem de produção sugerida: **1) fotos de lembrança que faltam** (o jogo já chama todas) → **2) Capítulo 4, Araruama** (cenários → objetos → família → minigames → lembranças).

Regras de sempre:
- Cenários: 1536x1024, top-down 3/4, mesmo estilo dos mapas atuais. Gere primeiro o **cenário vazio**, depois a **folha de objetos** (fundo magenta liso #FF00FF), anexando o cenário vazio novo.
- Lembranças: 1672x941. Anexe `public/assets/cinematics/pascoa.png` como modelo de estilo + os sprites da Bella e do Weng da roupa da cena (`public/assets/characters/bella-<roupa>.png`, `weng-<roupa>.png`).
- Folhas de minigame: fundo magenta liso, objetos separados por 60 px, nada encostando na borda.

---

## 1. Lembranças que ainda estão sem foto ("foto em breve")

| Arquivo que eu espero | Lembrança | Onde aparece |
|---|---|---|
| `memory-dq-02.png` | Açaí cheio de complemento | depois do açaí (**pronta**) |
| `memory-dq-03.png` | O imbatível perdeu | cartas no apê (**pronta**) |
| `memory-dq-09.png` | Achadinhos da Multidão | **nova**: saindo do Multidão (**pronta**) |
| `memory-dq-10.png` | A lista da Vó | **nova**: saindo do mercadinho (**pronta**) |
| `memory-pt-01.png` | Cisnes e nuvens | **nova**: fim do piquenique (**pronta**) |
| `memory-pt-02.png` | Meia-noite em ponto | **nova**: parabéns à meia-noite (**pronta**) |
| `memory-pt-03.png` | Almoço de aniversário | **nova**: fim do almoço (**pronta**) |

Os prompts de `memory-dq-02` e `memory-dq-03` estão em `PROMPTS_MINIGAMES.md`, seção 9.

### Achadinhos da Multidão (memory-dq-09). Roupas: casual

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Inside a busy, colorful popular shopping center in Duque de Caxias, Brazil, full of small stores with clothes, phone cases, toys and snacks. The attached girl (long curly brown hair, pink glasses, black t-shirt, wide pants) happily holds up a cute item to show him, with two shopping bags on her arm. The attached boy (short black hair, black t-shirt) carries four more shopping bags and smiles with a tired but loving face. Warm store lights, small hanging signs without readable text, a few blurry shoppers in the background. No text, no UI, no watermark.
```

### A lista da Vó (memory-dq-10). Roupas: casual

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Inside a small neighborhood grocery store in Brazil. The attached boy (short black hair, black t-shirt) pushes a small shopping cart with eggs, a can of condensed milk, cream, cheese, bananas and a chocolate bar, and reads a handwritten paper list. The attached girl (long curly brown hair, pink glasses) is sneakily dropping a paçoca (small Brazilian peanut candy) into the cart behind his back, with a mischievous smile. At the cashier, a friendly lady smiles at them. Warm afternoon light, shelves full of colorful products without readable labels. No text, no UI, no watermark.
```

### Cisnes e nuvens (memory-pt-01). Roupas: Bella `floral` (vestido amarelo), Weng `reveillon` (camisa branca)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. A sunny afternoon at a big white palace with dark timber roofs in the mountains (Palácio Quitandinha, Petrópolis, Brazil), in front of a lake. On the green lawn by the lake, the attached girl (long curly brown hair, pink glasses, yellow floral dress) and the attached boy (short black hair, white shirt, black pants) lie on a red-and-white checkered picnic blanket, looking up and pointing at a cloud shaped like a heart. A picnic basket next to them, and a white swan pedal boat floating on the lake behind them. Soft blue sky with fluffy clouds. No text, no UI, no watermark.
```

### Meia-noite em ponto (memory-pt-02). Roupas: pijama (Bella `pijama-oculos`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. A warm mountain hotel room at midnight, lit only by the orange glow of a stone fireplace and a small bedside lamp. The attached girl (long curly brown hair, pink glasses, pajamas) is sitting up in a bed with a red plaid blanket, sleepy but smiling with surprise, hands on her cheeks. The attached boy (short black hair) kneels beside the bed whispering "happy birthday", holding her hand. A phone on the nightstand shows a clock at 00:00 (only the numbers). Woolen socks on the floor, snowy-cold mist on the window. No other text, no UI, no watermark.
```

### Almoço de aniversário (memory-pt-03). Roupas: Bella `floral`, Weng `reveillon`

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. An elegant restaurant in the mountains of Petrópolis, Brazil, with red velvet chairs, white tablecloths, a grand piano and a window with blue hydrangeas and misty mountains outside. The attached girl (long curly brown hair, pink glasses, yellow floral dress) and the attached boy (short black hair, white shirt) sit at a table with a single red rose in a vase. A waiter places in front of her a petit gâteau with one lit candle; she covers her mouth with both hands, emotional. Other guests in the background clap. Warm golden light. No text, no UI, no watermark.
```

---

## 2. Capítulo 4 — Araruama: "Ano-novo em família" (2024)

### O que aconteceu de verdade (contado pelo Weng)

- Ano-novo de 2024, na **cobertura dos tios do Weng, em frente à Lagoa de Araruama**.
- Família: 4 tios (a principal é a **tia Tim**), os primos **Lilian, Vivian, Diego, Julinha, Mingau e Laylinha**, e a **Anne**, irmã do Weng.
- Não era a primeira vez da Bella com a família, mas ela estava nervosa.
- Durante os dias: passeio na praia da lagoa, **suco no shopping**, **parque de diversões**.
- Ceia com **muita comida chinesa**.
- Virada: fogos na orla, assistidos da **varanda grande da cobertura**.
- Roupa: "qualquer coisa" (o jogo usa a roupa casual dos dois).
- Primos pequenos: **Mingau (Miguel, 10, menino)**, **Julinha (10)**, **Laylinha (5)**.
- A ceia foi a **tia** que fez. Pratos marcantes: **pato**, **macarrão de arroz**, **frango xadrez**.
- Suco no **Cosechas**. No parque foram em vários brinquedos.
- A Bella estava nervosa porque **conhecia pouco a família e tinha medo de ser julgada**.

### Roteiro do capítulo

1. **Chegada à cobertura**: elevador, porta, a família inteira falando ao mesmo tempo. Barra de nervosismo da Bella (igual ao prólogo) que baixa conforme ela conversa com cada um. A tia Tim comanda a casa.
2. **Conhecer (de novo) a família**: falar com a tia Tim, os tios, a Anne e os primos. Cada um tem um pedido pequeno.
3. **Passeio na praia da lagoa**: andar na orla durante o dia, areia branca e água rasa. Minigame opcional: **Pedrinha na lagoa**.
4. **Suco no shopping**: cena ilustrada com escolha de sabor e conversa.
5. **Parque de diversões**: minigame **Argolas** (o Weng tenta ganhar uma pelúcia pra Bella) e cena na **roda-gigante**.
6. **Ceia chinesa**: minigame **Mesa Giratória**. A mesa redonda gira; aperte o botão quando o prato que o parente pediu parar na frente dele.
7. **A virada na varanda**: contagem regressiva, fogos sobre a lagoa. Minigame **Foto dos fogos**. Pedido de ano-novo (escolha). Beijo da meia-noite.

Todos os minigames usam só direcional + 1 botão (prontos pra controle de videogame).

### 2A. Cobertura por dentro (cenário vazio) — **pronto** (cenário e objetos já no jogo)

Anexe como referência de estilo um mapa interno atual (ex.: o apê do Weng).

```
Pixel art top-down 3/4 view of the inside of a large, bright penthouse apartment in a Brazilian beach town, seen from above with the walls cut away. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: a big open living room and dining area filling the center; an open kitchen with counter, stove, fridge and sink at the top right; a hallway with bedroom doors at the top left; the apartment front door with a doormat at the left edge; and along the whole bottom edge, wide open sliding glass doors leading out to a big balcony (only the doorframe and the first strip of the balcony floor are visible at the bottom edge).
Details: light beige porcelain floor, white walls, a big framed painting of red Chinese lanterns, a small red Chinese good-luck knot hanging on a wall, a wall clock, white curtains, string lights with small golden bulbs, potted plants against the walls.
Everything that stands against a wall stays: kitchen counter and appliances, a long sideboard, a bookshelf, a TV on the wall.

DO NOT draw: the round dining table, chairs, sofas, the coffee table, the cooler, people or animals. Where they would be, show clean continuous floor.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Folha de objetos (cobertura)**, anexando o cenário vazio novo:

```
Pixel art sprite sheet of props for the penthouse interior shown in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024. Background: ONE flat solid magenta color (#FF00FF) everywhere, no gradient, no floor, no shadows on the background.
Draw these objects, each complete and separate, in a loose grid, at least 60 pixels of magenta between any two objects, nothing touching the canvas edge:
1. A big ROUND dining table for 12 with a white tablecloth and a glass lazy susan (rotating glass disc) in the center, EMPTY on top (about 330x230 px).
2. Twelve simple wooden chairs, each one separate (about 50x80 px each).
3. A large L-shaped grey sofa with colorful cushions (about 300x150 px).
4. A small wooden coffee table with a bowl of tangerines (about 110x60 px).
5. A blue cooler box with ice and drinks (about 70x60 px).
6. A tall potted plant (about 80x120 px).
7. A standing floor fan (about 50x90 px).
8. A pile of kids' toys and a small tablet on a floor cushion (about 90x60 px).
```

### 2B. Varanda da cobertura à noite (cenário vazio) — **pronto** (cenário, objetos, fogos e ceia já no jogo)

```
Pixel art top-down 3/4 view of a very large penthouse balcony at night on New Year's Eve, high above a Brazilian beach town, facing a huge calm lagoon (Lagoa de Araruama). Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: the top edge shows the open sliding glass doors of the apartment with warm light coming out. The wide balcony floor (light wooden deck) fills the middle. Along the bottom, a long glass railing with a metal handrail. Beyond and below the railing, far down: the lit seaside promenade with tiny street lamps, a strip of white sand, and the dark blue lagoon reflecting the city lights, with the dark night sky above the far shore.
Details: potted plants in the corners, string lights hanging along the top wall, a built-in barbecue grill against the left wall.

DO NOT draw: tables, chairs, hammocks, people, animals or fireworks. Clean continuous deck floor.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Folha de objetos (varanda)**, anexando o cenário vazio novo:

```
Pixel art sprite sheet of props for the penthouse balcony scene in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, no gradient, no ground, no shadows on the background. Each object complete and separate, at least 60 px of magenta between objects, nothing touching the edge:
1. A long outdoor table with a white tablecloth, plates of fruit and glasses (about 260x120 px).
2. Six white outdoor chairs, each separate (about 50x75 px each).
3. A colorful hammock on a stand (about 200x90 px).
4. Two lounge chairs, separate (about 70x130 px each).
5. A cooler with drinks (about 70x60 px).
6. A small side table with a bowl of grapes (about 60x60 px).
```

### 2C. Praia da lagoa de dia (cenário vazio + objetos)

```
Pixel art top-down 3/4 view of the shore of a huge calm turquoise lagoon in a Brazilian beach town (Lagoa de Araruama) on a sunny summer afternoon. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: a paved seaside promenade with lamp posts crossing the top third (left to right), with tall white apartment buildings partly visible at the very top edge; a strip of soft white sand below it; and the shallow, very clear turquoise lagoon water filling the bottom third, getting darker far away. A small wooden pier on the right going into the water. A few coconut palms along the promenade. Small beach kiosks on the left.

DO NOT draw: people, animals, kiosk chairs, umbrellas, boats, or anything standing on the sand. Clean continuous sand and water.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

```
Pixel art sprite sheet of props for the lagoon shore scene in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, no gradient, no ground, no shadows on the background. Each object complete and separate, at least 60 px of magenta between objects, nothing touching the edge:
1. A coconut palm tree (about 150x260 px).
2. A beach umbrella, white and yellow, open (about 140x130 px).
3. Two white plastic beach chairs (about 60x70 px each, separate).
4. A small wooden rowing boat pulled onto the sand (about 180x80 px).
5. A lamp post (about 40x170 px).
6. A trash bin (about 35x50 px).
7. A sandcastle (about 70x60 px).
8. A coconut water cart with green coconuts (about 110x100 px).
```

### 2D. Parque de diversões (cenário vazio + objetos)

```
Pixel art top-down 3/4 view of a small traveling amusement park at night in a Brazilian beach town, full of colorful lights. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: the entrance arch made of light bulbs at the bottom center (no readable text); a dirt and gravel ground with paths; a big Ferris wheel at the top left (base and lower half visible, the top cut by the canvas edge is fine); a bumper car arena with a fence at the top right; a row of game booths along the right side; a carousel in the center left; strings of colored light bulbs crossing above the paths.

DO NOT draw: people, animals, food carts, benches, trash bins, balloons or prizes. Clean continuous ground.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

```
Pixel art sprite sheet of props for the amusement park scene in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, no gradient, no ground, no shadows on the background. Each object complete and separate, at least 60 px of magenta between objects, nothing touching the edge:
1. A popcorn cart (about 100x120 px).
2. A cotton candy cart with pink cotton candy (about 100x120 px).
3. A churros cart (about 100x110 px).
4. A bench (about 110x60 px).
5. A trash bin (about 35x50 px).
6. A bunch of colorful balloons tied to a weight (about 60x130 px).
7. A ticket booth (about 110x130 px).
8. A ring-toss booth with bottles and plush toys hanging (about 220x170 px).
```

### 2E. Suco no shopping (ilustração de fundo da cena)

Anexe `pascoa.png` + `bella-casual` + `weng-casual`.

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. A bright, modern juice and smoothie bar inside a shopping mall in a Brazilian beach town on a hot summer day, green and white decor with a wooden counter, fresh fruits (oranges, pineapples, watermelon, strawberries, passion fruit) and blenders, a menu board without readable text. The attached girl (long curly brown hair, pink glasses, black t-shirt) and the attached boy (short black hair, black t-shirt) sit at a small round table with two big cups of fresh juice with straws, she offers him a sip of hers and he makes a surprised face at the taste. Cold air-conditioning vibe, warm smiles. No text, no UI, no watermark.
```

### 2F. Família (NPCs)

Pra cada pessoa eu preciso de: idade aproximada, cabelo, um traço (óculos, barba, altura) e uma roupa típica. Se preferir, anexe uma foto da pessoa no ChatGPT junto com o prompt abaixo.

```
Pixel art character sprite sheet, 4 rows x 4 columns walking animation (rows: walking down, walking left, walking right, walking up), same art style, proportions, outline and colors as the attached character sprites. Chibi proportions like the attached ones. Canvas 1024x1024, background ONE flat solid magenta (#FF00FF).
Character: [descrição da pessoa].
No text, no UI, no watermark.
```

### 2F-0. Tia Tim (a partir da foto)

Anexe a folha andando da atendente (`public/assets/npcs/atendente-walk.png`) como modelo de layout **e** a foto da tia Tim. Salvar como `npcs/tia-tim-walk.png`.

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and smile, in the same cute chibi pixel style): a warm Chinese-Brazilian woman in her forties, long straight black hair past her shoulders with a side part, a gentle kind smile, a sleeveless black-and-white patterned blouse, a red kitchen apron tied at the waist (she is the one who cooks the New Year's dinner), black capri pants, simple sandals.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

### 2F-1. Primos (a partir das fotos)

Em cada um, anexe: a folha andando da atendente (`public/assets/npcs/atendente-walk.png`) como modelo de layout **e** a foto da pessoa.

**Lilian** (`npcs/lilian-walk.png`)

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and smile, in the same cute chibi pixel style): a cheerful young Chinese-Brazilian woman around 20 years old, dark brown hair pulled back in a low ponytail, a big bright smile, a thin gold necklace, a fitted brown tank top, light-wash denim cutoff shorts with a small red lips patch, a beige canvas tote bag on her shoulder, white sneakers.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

**Miguel, o Mingau, 10 anos** (`npcs/mingau-walk.png`)

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and smile, in the same cute chibi pixel style): a 10-year-old Chinese-Brazilian boy, short spiky black hair, slim, a calm little smile, a white t-shirt with a small black graphic print on the chest, black shorts, sneakers. He is a kid, so he is clearly shorter than the adults (about 75% of their height).

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

**Vivian** (`npcs/vivian-walk.png`)

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and smile, in the same cute chibi pixel style): a young Chinese-Brazilian woman around 20 years old, long straight dark brown hair falling past her shoulders, a huge sunny smile, a thin silver necklace and small earrings, a black off-the-shoulder top, light jeans shorts, sandals.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

**Diego** (`npcs/diego-walk.png`)

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and smile, in the same cute chibi pixel style): a young Chinese-Brazilian man in his twenties, short messy black hair with a fringe over the forehead, a relaxed half smile, a plain navy blue t-shirt, beige bermuda shorts, flip-flops.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

**Laylinha, 5 anos** (`npcs/laylinha-walk.png`). A foto é de quando ela era bem pequena; o prompt já pede ela com 5 anos.

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo of her as a toddler but now 5 years old (keep the round face, the black hair with bangs and the sweet look, in the same cute chibi pixel style): a lively 5-year-old Chinese-Brazilian girl, straight black hair in a short bob with straight bangs, chubby cheeks, a big playful smile, a light pink summer dress with small white flowers, white sandals. She is a small child, so she is clearly much shorter than the adults (about 60% of their height).

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

**Anne, irmã do Weng** (`npcs/anne-walk.png`)

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and calm smile, in the same cute chibi pixel style): a young Chinese-Brazilian woman around 20 years old, straight black hair just past the shoulders with a side part, a calm friendly smile, a black zip-up jacket open over a white t-shirt, a small crossbody bag with a mustard yellow strap, dark jeans, white sneakers.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

**Julinha, 10 anos** (`npcs/julinha-walk.png`)

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the round face, the straight black hair with side-swept bangs and the sweet smile, in the same cute chibi pixel style): a 10-year-old Chinese-Brazilian girl, straight black hair to her shoulders with side-swept bangs, a white top, a small navy blue backpack, light blue shorts, pink sneakers. She is a kid, so she is clearly shorter than the adults (about 75% of their height).

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

### 2B-2. Varanda de verdade (opcional, mais fiel à foto)

A varanda real tem tela de proteção, guarda-corpo cinza, piso de porcelanato bege e a avenida com palmeiras entre o prédio e a lagoa. Se quiser trocar a varanda do jogo por uma igual à de vocês, anexe a **foto da varanda** e o **cenário atual da varanda** (`art-source/maps/ar-varanda.webp`), e gere de novo o cenário vazio:

```
Pixel art top-down 3/4 view of a large penthouse balcony at night on New Year's Eve, EXACTLY the same art style, outline thickness, colors, camera angle and LAYOUT as the attached pixel art balcony, but with the real details of the attached photo: light beige porcelain floor tiles instead of wood, a light grey metal and glass railing along the bottom with a black safety net stretched above it, a small cypress tree in a beige pot and a yellow pot with plants near the railing. Canvas 1536x1024 pixels, landscape.

Keep the open sliding glass doors with warm light at the top, the string lights on the top wall and the built-in barbecue grill in the top-left corner.
Below and beyond the railing, far down: a wide seaside avenue with two lanes, palm trees and small parked cars along it, a grass strip, then the huge calm lagoon on the left side reflecting the city lights, and the lit city with white buildings on the far shore, dark night sky.

DO NOT draw: tables, chairs, hammocks, people, animals or fireworks. Clean continuous floor.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

### 2C-2. Praia da lagoa, versão fiel à vista real — **pronto** (cenário e objetos já no jogo)

Use este no lugar do 2C se quiser que a orla pareça a de verdade (anexe a foto da varanda como referência de lugar):

```
Pixel art top-down 3/4 view of the seaside avenue along a huge calm lagoon in a Brazilian beach town (Lagoa de Araruama) on a sunny summer afternoon, seen from above like the attached photo. Same art style, outline thickness, colors and camera angle as the attached pixel art reference. Canvas 1536x1024 pixels, landscape.

Layout: across the top, the front of tall white apartment buildings with entrances; below them a wide two-lane avenue with a median strip of grass and tall palm trees; then a wide sidewalk promenade with lamp posts and a grass strip with palm trees; then a strip of soft white sand; and the shallow, clear blue-green lagoon water filling the bottom third, getting darker far away. A small kiosk on the left of the promenade.

DO NOT draw: people, cars, animals, umbrellas, chairs, boats, or anything standing on the sand or the avenue. Clean continuous ground.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

### 2G. Minigames

**Mesa Giratória (ceia chinesa)**: anexe o cenário da cobertura como referência de estilo.

```
Pixel art sprite sheet of a Chinese family New Year's Eve dinner seen from directly above (top-down), same art style and colors as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it, nothing touching the edge:
1. A big round dining table with a white tablecloth seen from above, with a round glass lazy susan in the middle, EMPTY (about 520x520 px).
2. Dishes seen from above, each about 110x110 px: a whole glazed roast duck on a platter; a plate of crispy roast duck slices; a big plate of stir-fried rice noodles (thin rice vermicelli with vegetables); a plate of diced chicken with peppers, onions and peanuts in brown sauce (Brazilian-style "frango xadrez"); a bamboo steamer with dumplings; a plate of spring rolls; a bowl of fried rice; a bowl of white rice; a plate of sesame balls; a bowl of tangerines; a pot of jasmine tea with cups.
3. A pair of chopsticks (about 100x20 px).
4. A small red "speech bubble" with no text (about 60x50 px).
No text, no UI, no watermark.
```

**Argolas (parque)**: anexe o cenário do parque.

```
Pixel art sprite sheet for a ring-toss carnival game, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it:
1. The inside of a ring-toss booth seen from the front: a wooden shelf with 3 rows of glass bottles in different colors, red and white striped awning above, string lights (about 700x450 px).
2. A plastic ring, 3 rotation frames (about 60x30 px each).
3. Plush prizes, each about 120x120 px: a big orange cat, a white bunny, a yellow chick, a pink heart, a panda.
4. A small "miss" puff of dust (about 50x40 px).
No text, no UI, no watermark.
```

**Pedrinha na lagoa**: anexe `bella-casual` + `weng-casual`.

```
Pixel art sprite sheet, same art style as the attached reference, canvas 1024x1024, ONE flat solid magenta (#FF00FF) background, items separate with 60 px of magenta around each:
1. A small flat grey stone (about 40x24 px), 4 rotation frames in a row.
2. A water ripple ring, 3 frames growing (about 90x40 px each).
3. A small water splash (about 60x60 px).
4. The attached girl and boy seen from behind, side by side, standing on white sand looking at a turquoise lagoon on a sunny afternoon, the girl with her arm raised ready to throw a stone (about 300x260 px).
No text, no UI, no watermark.
```

**Foto dos fogos (da varanda)**: anexe `bella-casual` + `weng-casual`.

```
Pixel art sprite sheet of fireworks, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it:
1. A rising firework rocket with a sparkle trail (about 30x120 px).
2. Firework bursts, each about 240x240 px: golden, pink, white, blue, green, and a heart-shaped pink burst.
3. A phone camera viewfinder frame (white corners, a small circle in the center) (about 300x200 px).
4. The attached girl and boy seen from behind, hugging at a glass balcony railing high above a lagoon at night, looking up at the sky (about 320x280 px).
No text, no UI, no watermark.
```

### 2H. Lembranças de Araruama

Anexe `pascoa.png` + `bella-casual` + `weng-casual`.

**Ceia chinesa em família** (`memory-ar-01`). Anexe `pascoa.png`, `bella-casual`, `weng-casual` e a folha da tia Tim (`npcs/tia-tim-walk.png`).

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. New Year's Eve dinner in a bright penthouse apartment in a Brazilian beach town, warm golden light, a painting of red Chinese lanterns and a red Chinese knot on the wall. A big round table with a white tablecloth and a glass lazy susan in the middle, full of Chinese food: a whole glazed roast duck in the center, stir-fried rice noodles, Brazilian-style "frango xadrez" (diced chicken with peppers and peanuts), dumplings in a bamboo steamer, spring rolls, fried rice, a bowl of tangerines. Around the table, a big, happy Chinese-Brazilian family: the attached aunt (long straight black hair, red apron) proudly serving food, adult cousins laughing, a 10-year-old boy and a 10-year-old girl, and a 5-year-old girl with a black bob and a pink dress. The attached girl (long curly brown hair, pink glasses, black t-shirt) and the attached boy (short black hair, black t-shirt) sit side by side; she smiles a little shy, holding chopsticks, and he helps her pick up a piece of duck. No text, no UI, no watermark.
```

**Roda-gigante** (`memory-ar-02`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Night at a small amusement park in a Brazilian beach town. The attached girl (long curly brown hair, pink glasses, black t-shirt) and the attached boy (short black hair, black t-shirt) sit together inside a Ferris wheel gondola at the top, the colorful lights of the park and the dark lagoon below them. She hugs a big orange teddy bear plush he won for her at the ring-toss booth; he looks at her instead of the view. No text, no UI, no watermark.
```

**Fogos da varanda** (`memory-ar-03`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Midnight on New Year's Eve on the big balcony of a penthouse high above a huge calm lagoon (Lagoa de Araruama, Brazil). Colorful fireworks explode over the water along the lit seaside promenade below and reflect on the lagoon. The attached girl (long curly brown hair, pink glasses, black t-shirt) and the attached boy (short black hair, black t-shirt) kiss at the glass railing; behind them, the whole family celebrates and hugs with glasses raised. No text, no UI, no watermark.
```


---

## 3. Capítulo 5 — Rio das Ostras: "Um dia de praia"

### O que aconteceu (contado pelo Weng)

- Uma passagem rápida por Rio das Ostras. O ponto alto foi a praia: ficaram um bom tempo curtindo.
- O pai da Bella não quis pagar o guarda-sol: os dois ficaram no sol e se queimaram um pouco.
- O Weng ajudou a pagar o guarda-sol e virou o salvador do dia.
- Brincaram na praia.
- O pai trouxe frutas e torradas de casa; a Bella ficou bolada achando ele "canguinha".
- No fim, comeram petisco na barraca até a tempestade chegar.

### Roteiro do capítulo

1. **Chegada na praia**: o pai da Bella escolhe um lugar no sol ("guarda-sol é roubo!"). Conversa com a Bella revirando os olhos.
2. **Minigame Sol de rachar**: a barra de queimadura sobe; corra pra sombrinhas que passam (nuvens, guarda-sol dos vizinhos) e passe protetor no tempo certo. Mesmo assim os dois ficam vermelhinhos.
3. **O salvador**: o Weng vai até o barraqueiro e racha o guarda-sol. Sombra, cadeira e a Bella olhando pra ele como herói.
4. **Lanche do pai**: o isopor com frutas e torradas. A Bella bolada ("pai, a gente tá na praia, não no piquenique da escola"). Escolhas de diálogo.
5. **Minigame Frescobol**: rebater a bolinha com o Weng no ritmo; o vento e as ondas atrapalham. Quanto mais longa a sequência, mais estrelas.
6. **Petisco na barraca**: escolher os petiscos (batata frita, isca de peixe, camarão, aipim) e conversar.
7. **Minigame A tempestade**: o céu escurece de repente. Junte tudo (toalhas, cadeiras, guarda-sol, isopor) antes da chuva e corra pro quiosque. Raio cai: desvia.
8. **Fim**: os dois molhados e queimados de sol, rindo debaixo do toldo do quiosque.

Todos os minigames com direcional + 1 botão (prontos pra controle).

### 3A. Praia de Rio das Ostras (cenário vazio) — **pronto** (cenário e objetos no jogo)

Anexe como referência de estilo a orla de Araruama (`art-source/maps/ar-praia.webp`).

```
Pixel art top-down 3/4 view of a wide sunny ocean beach in Rio das Ostras, Brazil, on a hot summer day. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: across the top, a seaside promenade with a low stone wall, palm trees and a row of colorful beach kiosks (one bigger kiosk with a striped awning on the right, with an open front where people can sit). Below it, a very wide strip of light golden sand filling the middle of the canvas, with footprints. At the bottom, the ocean: turquoise shallow water with white foam and small waves coming to the sand, darker blue further away. A small rental stand for beach umbrellas and chairs on the left side of the sand.

DO NOT draw: people, animals, beach umbrellas, chairs, towels, coolers, balls or anything standing on the sand. Clean continuous sand and water.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Folha de objetos (praia)**, anexando o cenário vazio novo:

```
Pixel art sprite sheet of props for the beach scene in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, no gradient, no ground, no shadows on the background. Each object complete and separate, at least 60 px of magenta between objects, nothing touching the edge:
1. A big rental beach umbrella, blue and white stripes, open, planted in the sand (about 170x170 px).
2. The same umbrella CLOSED, leaning (about 40x150 px).
3. Two folding beach chairs, blue and white, separate (about 70x90 px each).
4. A big beach towel with a yellow and pink pattern, flat on the sand (about 150x80 px).
5. A red cooler box (isopor) with the lid open showing fruit, a bag of toast and drinks (about 90x80 px).
6. A plastic beach table with a plate of fried snacks (french fries and fried fish) and two drinks (about 110x90 px).
7. A pair of wooden beach paddle rackets (frescobol) and a small rubber ball, lying on the sand (about 90x60 px).
8. A sandcastle (about 70x60 px).
9. A sunscreen bottle (about 30x50 px).
10. A small sign "ALUGUEL" style board WITHOUT readable text, with a drawing of an umbrella (about 70x90 px).
```

### 3B. Roupa de praia da Bella e do Weng — **pronto**

Anexe a folha andando da Bella (`public/assets/characters/bella-casual.png`) no prompt da Bella e a do Weng (`weng-casual.png`) no do Weng, como modelo de rosto, cabelo e layout.

**Bella**

```
Pixel art walking sprite sheet of the SAME character as the attached sprite sheet (same face, curly long brown hair, pink glasses, same proportions, outline and style), now dressed for the beach: a light coral one-piece swimsuit under a loose white cotton beach shirt worn open, short denim shorts, flip-flops and a straw hat with a pink ribbon.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

**Weng**

```
Pixel art walking sprite sheet of the SAME character as the attached sprite sheet (same face, short black messy hair, same proportions, outline and style), now dressed for the beach: a light blue short-sleeve shirt with small white palm-tree prints, worn open over a white tank top, navy blue swim shorts, flip-flops, sunglasses pushed up on the head.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

### 3C. NPCs — **prontos** (Anderson, pai da Bella, e o barraqueiro)

**Pai da Bella** (anexe `public/assets/npcs/atendente-walk.png` como modelo de layout e, se puder, uma foto dele). Troque a descrição pela aparência real:

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and expression, in the same cute chibi pixel style): [a Brazilian man around 50 years old, short dark hair, a cheerful stubborn smile, a white tank top, colorful beach shorts, flip-flops, a cap, carrying a red cooler box in one hand].

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

**Barraqueiro do aluguel de guarda-sol** (anexe `atendente-walk.png`):

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person: a friendly suntanned Brazilian beach vendor around 40 years old, short curly black hair, a big smile, an orange tank top with a small umbrella logo (no text), white bermuda shorts, flip-flops, a fanny pack and a towel over the shoulder.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

### 3D. Minigames

**Sol de rachar** — **pronto**:

```
Pixel art sprite sheet, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it, nothing touching the edge:
1. A big cartoon sun with a hot, grumpy face and wavy rays (about 200x200 px).
2. A small fluffy white cloud (about 180x100 px) and its round shadow on the sand, semi-dark oval (about 160x60 px).
3. A sunscreen bottle (about 50x80 px) and a white splash of sunscreen (about 60x40 px).
4. A thermometer-like "sunburn" meter: a vertical bar frame with a sun icon on top, EMPTY inside (about 50x200 px).
5. The attached girl and boy (beach clothes) sitting on a towel on the sand, both with red sunburned cheeks and shoulders, fanning themselves, funny suffering faces (about 300x220 px).
No text, no UI, no watermark.
```

**Frescobol** (anexe as folhas de praia da Bella e do Weng):

```
Pixel art sprite sheet for a beach paddle game, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it:
1. The attached girl in beach clothes seen from the side, holding a wooden beach paddle, 3 frames: ready, swinging, after the hit (about 180x220 px each).
2. The attached boy in beach clothes seen from the side, facing left, holding a wooden beach paddle, 3 frames: ready, swinging, after the hit (about 180x220 px each).
3. A small rubber ball (about 30x30 px), and a motion trail of the ball (about 120x30 px).
4. A small sand splash where the ball falls (about 80x50 px).
No text, no UI, no watermark.
```

**A tempestade** — **pronto**:

```
Pixel art sprite sheet, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it:
1. A big dark grey storm cloud (about 360x180 px), and a smaller one (about 220x120 px).
2. A lightning bolt (about 80x220 px) and a bright flash star where it hits the sand (about 120x80 px).
3. Items scattered on the sand to pick up, each about 80-120 px: a folded beach towel, a closed beach umbrella, a folded beach chair, a red cooler box, a straw hat, a pair of flip-flops.
4. The attached girl and boy in beach clothes running side by side, carrying a closed umbrella and a cooler over their heads, laughing in the rain (about 300x240 px).
No text, no UI, no watermark.
```

### 3E. Lembranças (1672x941, anexe `pascoa.png` + as folhas de praia da Bella e do Weng)

**O salvador do guarda-sol** (`memory-ro-01`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. A sunny, crowded beach in Rio das Ostras, Brazil. The attached boy (beach clothes) proudly plants a big blue-and-white striped rental beach umbrella in the sand like a hero, sunlight behind him. The attached girl (beach clothes, straw hat) sits on a towel looking up at him with heart eyes, both with red sunburned cheeks and shoulders. Nearby, a red cooler with fruit and a bag of toast. Turquoise sea and white foam in the background. No text, no UI, no watermark.
```

**Petisco até a tempestade** (`memory-ro-02`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. A beach kiosk with a striped awning in Rio das Ostras, Brazil, late afternoon. Dark storm clouds roll in over the sea and the first big raindrops fall. Under the awning, the attached girl and boy (beach clothes, a little sunburned and wet) sit at a plastic table full of fried snacks (french fries, fried fish, shrimp, fried cassava), laughing, while the wind blows napkins away. No text, no UI, no watermark.
```

---

## 4. Capítulo 6 — Niterói: "Do outro lado da baía"

### O que aconteceu (contado pelo Weng)

- Fomos pra **Praia de Icaraí**, onde os tios do Weng moram, num **apartamento luxuoso**.
- Era a família da **outra tia**, que todo mundo chama só de **"mãe da Lilian"** (sem nome no jogo), não a tia Tim.
- Estavam lá: a **mãe da Lilian**, o **tio** (marido dela), a **Lilian** e o namorado dela, **Vinicius**, a **Vivian**, o **Diego** e o **Mingau**. Mais ninguém.
- Passeamos no **Caminho Niemeyer**.
- Comemos **churrasco no OnFire American BBQ** (churrasco americano defumado, em São Francisco, Niterói).
- A mãe da Lilian **lotou a Bella de chocolates**.

### Roteiro

1. **O apê em Icaraí**: chegada, a mãe da Lilian recebe e já enche a Bella de chocolate; o tio na varanda; a Lilian apresenta o Vinicius (o Weng e o Diego zoam ele); o Mingau querendo os chocolates da Bella. Minigame **Chuva de chocolate** (pegar os chocolates que a tia joga, desviando dos "chega, tia!").
2. **A varanda**: vista da Praia de Icaraí e da Pedra de Itapuca, com o Rio e o Pão de Açúcar do outro lado da baía.
3. **Caminho Niemeyer**: as curvas brancas, a Praça JK, o Teatro Popular. Minigame **Foto no Niemeyer** (enquadrar o casal e o prédio na foto).
4. **Churrasco no OnFire**: a família inteira numa mesa grande; brisket, costela, linguiça, molho barbecue. Minigame **Bandeja do pitmaster** (montar a bandeja do pedido de cada um).
5. **Fim**: pôr do sol na baía.

### 4A. Apê em Icaraí (cenário vazio). Anexe `art-source/maps/ar-cobertura.webp` como estilo.

```
Pixel art top-down 3/4 view of the inside of a luxurious, modern apartment facing the beach in Icaraí, Niterói, Brazil, seen from above with the walls cut away. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: a spacious living and dining room with polished light marble floor in the center; an elegant open kitchen with a long island and bar stools at the top right; a hallway with bedroom doors at the top left; the front door at the left edge; along the whole bottom edge, wide floor-to-ceiling glass doors opening to a long balcony with a glass railing, and beyond it, far below, the curved Icaraí beach, the blue Guanabara Bay and a rocky islet near the sand.
Details: a big abstract painting, warm wall lamps, a tall bookshelf, a bar cart against the wall, white curtains, indoor plants against the walls.

DO NOT draw: the dining table, chairs, sofas, coffee table, rugs, people or animals. Where they would be, show clean continuous floor.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Objetos do apê** (anexe o cenário novo):

```
Pixel art sprite sheet of props for the luxurious apartment shown in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, no gradient, no floor, no shadows on the background. Each object complete and separate, at least 60 px of magenta between objects, nothing touching the edge:
1. A large modern grey sectional sofa with cushions (about 300x150 px).
2. A low marble coffee table with a big bowl FULL of colorful wrapped chocolates and bonbons (about 140x80 px).
3. A long dark wood dining table for 6, empty on top (about 280x130 px), and 6 modern chairs, separate (about 50x80 px each).
4. A soft round beige rug (about 260x120 px), flat.
5. A tall floor lamp (about 40x150 px).
6. Two balcony lounge chairs, separate (about 70x120 px each).
7. A big gift basket full of chocolates with a red ribbon (about 100x100 px).
```

### 4B. Caminho Niemeyer (cenário vazio). Anexe `art-source/maps/ro-praia.webp` como estilo.

```
Pixel art top-down 3/4 view of the Caminho Niemeyer cultural complex in Niterói, Brazil, on a sunny late afternoon. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: a huge open white concrete plaza (Praça JK) filling the center, with smooth curved paths; at the top left, a white modernist theater with a big undulating wavy concrete roof and a red curved ramp (Teatro Popular); at the top right, a white dome-shaped modern building; a long curved white walkway along the right side; at the bottom, a seaside promenade with palm trees and the blue Guanabara Bay with the Rio de Janeiro skyline and Sugarloaf Mountain far away on the horizon.

DO NOT draw: people, animals, benches, lamp posts, kiosks or anything standing on the plaza. Clean continuous ground.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Objetos do Caminho Niemeyer** (anexe o cenário novo):

```
Pixel art sprite sheet of props for the modernist plaza shown in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, no ground, no shadows on the background. Each object separate, at least 60 px of magenta between objects, nothing touching the edge:
1. A modern white curved concrete bench (about 180x70 px).
2. A tall slim modern lamp post (about 40x180 px).
3. A coconut water / ice cream cart with an umbrella (about 110x120 px).
4. A palm tree (about 140x240 px).
5. A white sculpture with a soft wavy shape (about 100x140 px).
6. A small flock of pigeons on the ground (about 90x40 px).
```

### 4C. OnFire American BBQ (por dentro). Anexe `art-source/maps/piabeta-mexicano.webp` como estilo.

```
Pixel art top-down 3/4 view of the inside of an American barbecue restaurant (smokehouse) in Niterói, Brazil, seen from above with the walls cut away. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: dark wood floor; exposed red brick walls; a long counter at the top with a big black barrel smoker and a grill behind it, with warm fire glow and smoke; neon-like warm signs WITHOUT readable text; Edison light bulbs hanging; a small kids play corner with colorful soft blocks at the top left; the entrance door at the bottom center.

DO NOT draw: tables, chairs, booths, people or animals. Clean continuous floor where they would be.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Objetos do OnFire** (anexe o cenário novo):

```
Pixel art sprite sheet of props for the barbecue restaurant shown in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, no floor, no shadows on the background. Each object separate, at least 60 px of magenta between objects, nothing touching the edge:
1. A big wooden table for 6 with a red-and-white checkered paper (about 260x130 px), EMPTY.
2. Six wooden chairs, separate (about 50x80 px each).
3. A rustic wooden booth bench (about 200x90 px).
4. A metal bucket with a roll of paper towels and bottles of barbecue sauce (about 60x70 px).
5. A potted plant in a barrel planter (about 80x110 px).
```

### 4D. NPCs novos: mãe da Lilian, tio e Vinicius

**Mãe da Lilian.** Anexe `public/assets/npcs/atendente-walk.png` como layout e uma foto dela.

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and smile, in the same cute chibi pixel style): a friendly Asian woman around 50 years old, round face, straight black hair pulled back in a low ponytail with a few loose strands framing the face, warm gentle smile, a simple light grey t-shirt, dark capri pants and sandals, carrying a small pink gift bag full of chocolates.

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

**Tio (marido da mãe da Lilian).** Anexe `atendente-walk.png` como layout e uma foto dele:

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and expression, in the same cute chibi pixel style): [descrição do tio: idade, cabelo, barba/óculos, roupa].

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

**Vinicius (namorado da Lilian).** Anexe `atendente-walk.png` como layout e uma foto dele:

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and expression, in the same cute chibi pixel style): [descrição do Vinicius: idade, cabelo, roupa].

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

### 4E. Minigames

**Chuva de chocolate** (anexe `bella-casual.png`):

```
Pixel art sprite sheet, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it:
1. Chocolates and sweets, each about 70-90 px: a chocolate bar in red wrapper, a chocolate bar in blue wrapper, a heart-shaped chocolate box, a golden wrapped bonbon, a brigadeiro with sprinkles, a chocolate egg with a pink ribbon, a Kinder-style small egg (no logo).
2. A green vegetable as a "trap" item: a broccoli (about 70 px).
3. The attached girl seen from the front holding open a big pink gift bag with both hands above her head, happy, 2 frames: normal and catching (about 180x220 px each).
4. A sparkle burst (about 80x80 px).
No text, no logos, no UI, no watermark.
```

**Foto no Niemeyer** (anexe `bella-casual.png` + `weng-casual.png`):

```
Pixel art sprite sheet, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it:
1. The attached girl and boy standing side by side posing for a photo, 3 poses: making a heart with hands together, peace sign, hugging (about 220x260 px each).
2. A white seagull flying, 2 frames (about 90x60 px each).
3. A phone camera viewfinder frame with white corners and a small focus square in the center (about 360x240 px).
No text, no UI, no watermark.
```

**Bandeja do pitmaster** (anexe o cenário do OnFire):

```
Pixel art sprite sheet of American barbecue food seen from slightly above, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it, each about 120x110 px:
1. Sliced smoked brisket with a dark pink smoke ring. 2. A rack of pork ribs glazed with barbecue sauce. 3. Pulled pork. 4. Smoked sausage slices. 5. Mac and cheese in a small skillet. 6. Coleslaw in a bowl. 7. Corn on the cob with butter. 8. French fries in a paper cone. 9. A cup of barbecue sauce. 10. A metal tray lined with checkered paper, EMPTY (about 360x220 px).
No text, no logos, no UI, no watermark.
```

### 4F. Lembranças (1672x941, anexe `pascoa.png` + `bella-casual` + `weng-casual`)

**Chocolates da tia** (`memory-nt-01`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. A bright, luxurious apartment living room in Icaraí, Niterói, with a big glass window showing the beach and Guanabara Bay. A smiling aunt piles a huge amount of chocolates and bonbons into the arms of the attached girl (long curly brown hair, pink glasses, black t-shirt), who laughs and can barely hold them all. The attached boy (short black hair, black t-shirt) stands next to her trying to steal one chocolate. No text, no UI, no watermark.
```

**Caminho Niemeyer** (`memory-nt-02`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Sunset at the Caminho Niemeyer in Niterói, Brazil: white modernist buildings with wavy concrete roofs, a big open white plaza, and the Guanabara Bay with the Rio de Janeiro skyline and Sugarloaf Mountain on the horizon, under an orange and pink sky. The attached girl (long curly brown hair, pink glasses, black t-shirt) and the attached boy (short black hair, black t-shirt) take a selfie together, cheek to cheek, smiling. No text, no UI, no watermark.
```

**Almoço no OnFire** (`memory-nt-03`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Inside a warm American barbecue restaurant with brick walls, a big black smoker with fire glow and Edison bulbs. At a wooden table with checkered paper, the attached girl and boy share a huge tray of smoked brisket, glazed ribs, pulled pork, mac and cheese and fries, both with barbecue sauce on their faces, laughing. Around the big table, the boy's family: his aunt, his uncle, two young women cousins, a young man cousin, the boyfriend of one cousin and a 10-year-old boy, all laughing and passing plates. No text, no logos, no UI, no watermark.
```

---

## 5. Capítulo 7 — Cabo Frio: "A virada a pé"

### O que aconteceu (contado pelo Weng)

- Viagem com os amigos: **Nathan e Vitória** (namorados), **Puggian**, **Felipe** e **Ruan**.
- Ficaram num **Airbnb, uma casa de praia em Peró**.
- **Dia 1:** Praia do Peró e, de noite, pizza.
- **Dia 2 (31/12):** Praia do Japonês com churrasco; de noite, jogo de cartas de gatinho explosivo.
- Faltando 2 horas pra virada: **nenhum Uber aceitava**. Foram **a pé até a Praia do Forte (5 km)**; no **km 3 conseguiram uma carona** e viram a virada lá.

### Roteiro

1. **Chegada na casa de praia** (Peró): a turma escolhendo quarto, a Bella e o Weng com o melhor (ou o pior).
2. **Praia do Peró**: minijogo **Altinha** (manter a bola no alto passando entre os amigos, sem deixar cair).
3. **Noite da pizza**: escolher os sabores pra agradar a turma inteira.
4. **Praia do Japonês**: churrasco na areia e água calminha. A turma **atravessa a pé até a ilha** pela faixa de areia na água; a Bella morrendo de medo (fundo? concha? bicho?). Minijogo **Travessia até a ilha** (escolher onde pisar: areia clarinha é seguro, água escura pode ser fundo, concha e siri beliscam; o Weng segura a mão). **Ficam um tempo na ilha** antes de voltar.
5. **Gatinho-Bomba**: jogo de cartas de "sorte e coragem" com a turma (compra carta, foge do gatinho-bomba, usa a carta de desarmar).
6. **Nenhum Uber aceita**: a tela do app recusando, recusando...
7. **5 km até a virada** (minijogo): a turma andando de branco pela estrada de noite, o relógio correndo pra meia-noite; no km 3, a carona.
8. **Praia do Forte**: a contagem e os fogos (minijogo de fogos com a turma).

### 5A. Cenários vazios

**Casa de praia (Airbnb) em Peró.** Anexe `art-source/maps/ar-cobertura.webp`.

```
Pixel art top-down 3/4 view of a simple, cozy rented beach house in Cabo Frio, Brazil, seen from above with the walls cut away. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: white tiled floor; a living room with a big open area in the center; a small open kitchen with a fridge and stove at the top right; three bedroom doors along the top wall; the front door on the left; at the bottom, sliding glass doors opening to a covered porch (varanda) with a hammock hook and a small garden with a coconut palm and a low white wall, a sandy path outside. Details: beach-style decor, a surfboard leaning on a wall, a shell decoration, a ceiling fan, string lights on the porch.

DO NOT draw: tables, chairs, sofas, beds, rugs, people or animals. Clean continuous floor where they would be.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Praia do Peró (dia).** Anexe `art-source/maps/ro-praia.webp`.

```
Pixel art top-down 3/4 view of Praia do Peró in Cabo Frio, Brazil, on a bright sunny day. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: at the top, low green dunes with restinga vegetation and a wooden walkway coming down to the sand; a very wide strip of white fine sand in the middle; at the bottom, clear turquoise sea with gentle white waves; a rocky point with green hill on the right edge. Wide open, natural, few buildings.

DO NOT draw: people, animals, umbrellas, chairs, towels or anything standing on the sand.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Praia do Japonês (dia).** Anexe `art-source/maps/ro-praia.webp`.

```
Pixel art top-down 3/4 view of Praia do Japonês in Cabo Frio, Brazil: a small calm cove with crystal-clear shallow turquoise water like a natural pool, surrounded by rocks and green hills. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: green hills and rocks across the top and the left edge; a small curved strip of white sand in the middle left; the calm transparent water filling the right and bottom, with visible sand and small rocks under the water; a small sandbar connecting to a little island on the bottom right.

DO NOT draw: people, animals, umbrellas, grills, chairs, coolers or anything on the sand.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Praia do Forte (noite de réveillon).** Anexe `art-source/maps/ar-praia.webp`.

```
Pixel art top-down 3/4 view of Praia do Forte in Cabo Frio, Brazil, on New Year's Eve at night. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: across the top, the lit seaside avenue with palm trees, warm street lamps and buildings with lit windows; a wide strip of sand in the middle, lit by the city; at the bottom, the dark sea with soft moonlight reflections; on the right edge, the old stone fort (Forte São Mateus) on the rocks, softly lit. Festive mood: string lights along the promenade.

DO NOT draw: people, fireworks, umbrellas or anything on the sand.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

### 5B. Os amigos (um prompt pra cada). Anexe `public/assets/npcs/atendente-walk.png` e uma foto da pessoa.

```
Pixel art walking sprite sheet of a character, using EXACTLY the same art style, outline, proportions, size and LAYOUT as the attached sprite sheet, but a DIFFERENT person, based on the attached photo (keep the face shape, hair and expression, in the same cute chibi pixel style): [descrição: idade, cabelo, barba/óculos], wearing all-white New Year's Eve clothes [roupa branca: ex. white linen shirt and white shorts].

Background: ONE flat solid magenta color (#FF00FF) everywhere. No gradient, no floor, no shadows on the background.

STRICT GRID of 4 rows and 4 columns, same as the attached sheet:
Row 1: walking toward the viewer (facing down), 4 frames.
Row 2: walking to the left, 4 frames.
Row 3: walking to the right, 4 frames.
Row 4: walking away from the viewer (facing up), 4 frames.

The character must look identical in every frame. No text, no labels, no numbers, no watermark.
```

### 5C. Objetos (anexe a casa de praia e as praias novas)

```
Pixel art sprite sheet of props for the beach house and beaches shown in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, no floor, no shadows on the background. Each object complete and separate, at least 60 px of magenta between objects, nothing touching the edge:
1. A simple wooden dining table for 8 with three open pizza boxes on top (about 300x140 px).
2. A colorful fabric sofa (about 240x120 px) and a hammock hanging, seen from above (about 200x80 px).
3. A low coffee table with a card game in progress: scattered cards, a draw pile and snacks (about 160x90 px).
4. A portable charcoal beach grill with skewers and smoke (about 110x110 px).
5. A big red cooler box and a stack of plastic cups (about 100x80 px).
6. Three beach umbrellas of different colors, open (about 170x170 px each).
7. A soccer ball on the sand (about 40x40 px) and a pile of flip-flops (about 70x40 px).
8. A white plastic table with farofa, bread and grilled meat (about 120x100 px).
```

### 5D. Minijogos

**Gatinho-Bomba (jogo de cartas)** — original, NÃO copiar o visual de nenhum jogo existente:

```
Pixel art sprite sheet of ORIGINAL playing cards for a silly card game, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each card separate with 60 px of magenta around it, each card about 140x200 px, rounded corners, cream background with a thick colored border, NO text on the cards, only drawings:
1. BOMB CAT: a cartoon orange cat holding a round black bomb with a lit fuse, panicked face (red border).
2. DEFUSE: a hand cutting a bomb wire with scissors (green border).
3. SKIP: a cat sleeping in a hammock (blue border).
4. PEEK: a cat with a big magnifying glass (purple border).
5. SHUFFLE: a cat juggling cards (yellow border).
6. STEAL: a sneaky cat in a mask grabbing a card (grey border).
7. Two silly filler cards: a cat eating pizza, a cat in sunglasses on the beach (pink border).
8. The back of the card: a pink paw print on a dark purple pattern.
9. A cartoon explosion puff with confetti (about 220x200 px).
No text, no logos, no UI, no watermark.
```

**5 km até a virada** (anexe `bella-linho.png` e `weng-reveillon.png`):

```
Pixel art sprite sheet for a side-scrolling walking game at night, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it:
1. The attached girl and boy (all-white New Year's Eve clothes) walking side by side, seen from the side facing right, holding hands, 4 walking frames (about 200x220 px each).
2. The same two out of breath, bent over with hands on knees, 1 frame (about 200x200 px).
3. Obstacles on a sidewalk, each about 80-120 px: a puddle, a traffic cone, a sleeping street dog, a pothole, a loose flip-flop.
4. A white compact car with headlights on, side view, the window open with a friendly driver waving (about 300x150 px).
5. A road kilometer marker sign without numbers (about 50x90 px) and a street lamp (about 40x180 px).
No text, no UI, no watermark.
```

**Altinha** (anexe `bella-praia.png`):

```
Pixel art sprite sheet for a beach keepy-uppy game, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it:
1. The attached girl in beach clothes kicking a ball up with her knee, 3 frames: ready, kicking, after the kick (about 160x220 px each).
2. A colorful soccer ball (about 50x50 px), with a motion blur trail (about 120x50 px).
3. A sand puff where the ball lands (about 90x50 px).
No text, no UI, no watermark.
```

### 5E. Lembranças (1672x941, anexe `pascoa.png` + `bella-praia`/`weng-praia` ou `bella-linho`/`weng-reveillon`)

**A turma na casa de praia** (`memory-cf-01`):

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Night in a simple beach house in Cabo Frio: a group of seven young friends around a wooden table full of open pizza boxes, laughing, string lights on the porch behind them. In the center, the attached girl and boy share a slice of pizza that stretches with cheese between them. No text, no UI, no watermark.
```

**Gatinho-Bomba** (`memory-cf-02`):

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. The same group of friends sitting on the floor of the beach house around a low table playing a silly card game, everyone screaming and laughing as the attached girl draws a card with a cartoon cat holding a bomb, the attached boy covering his face in fake horror. Cards and snacks everywhere. No text, no UI, no watermark.
```

**A virada a pé** (`memory-cf-03`):

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Midnight on Praia do Forte in Cabo Frio: a sky full of colorful fireworks over the sea, the old stone fort lit on the right. The attached girl and boy, dressed in white, sweaty and out of breath after walking kilometers, hug and kiss on the sand with their friends cheering around them, flip-flops in their hands. No text, no UI, no watermark.
```

---

## 6. Itens da mochila (sprites)

Ícones dos itens do inventário, desenhados (substituem os quadradinhos gerados por código).
Anexe uma folha de objetos já usada no jogo (ex.: `cf-` ou `pq-`) como referência de estilo.
Grade fixa 4×3, em ordem de leitura (esquerda→direita, cima→baixo) — é assim que o recorte numera.

### 6A. Itens dos capítulos 3 a 7

```
Pixel art sprite sheet of 11 small inventory item icons for a cozy RPG, EXACTLY the same art style, outline thickness and colors as the attached reference sheet. Each item drawn front-facing like an inventory icon (not top-down), centered, about 150x150 px, with a soft highlight. Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, items arranged in a clean grid of 4 columns x 3 rows, reading order left to right, top to bottom, at least 80 px of magenta between items, nothing touching the edge, the last cell (row 3, column 4) left empty:
1. A pink cotton candy on a wooden stick, fluffy.
2. An old brass hotel room key with a red leather tag (no number written).
3. Three yellow amusement-park tokens/tickets stacked, with a red star in the middle.
4. A smooth grey lake pebble in the exact shape of a heart.
5. A small orange teddy bear plush with a pink bow.
6. A tiny pink plush keychain with a golden ring.
7. A pink and cream scallop seashell with sand grains.
8. A wicker basket full of wrapped chocolates and bonbons with a red ribbon.
9. A white spiral seashell with a lilac shine.
10. A small deck of cards with a dark purple back and a pink paw print, slightly fanned.
11. A single lost rubber flip-flop, blue and yellow.
No text, no numbers, no letters, no UI, no watermark.
```

Arquivo: `itens-cap3-7.png`

### 6B. Itens dos capítulos 1 e 2 (refazer os antigos)

```
Pixel art sprite sheet of 11 small inventory item icons for a cozy RPG, EXACTLY the same art style, outline thickness and colors as the attached reference sheet. Each item drawn front-facing like an inventory icon (not top-down), centered, about 150x150 px, with a soft highlight. Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, items arranged in a clean grid of 4 columns x 3 rows, reading order left to right, top to bottom, at least 80 px of magenta between items, nothing touching the edge, the last cell (row 3, column 4) left empty:
1. A thin gold necklace with a small pink heart pendant.
2. Round glasses with a pink/rose tinted frame.
3. A modern smartphone with a pink case, the screen showing a chat bubble with a heart.
4. A small wild flower picked from a backyard, white and yellow, with a short stem.
5. A single pink rose with leaves, wrapped in kraft paper with a ribbon.
6. Two handmade paper coupons with a red heart drawn on each, tied with string.
7. A gift box of chocolates with a red ribbon, lid half open showing bonbons.
8. A crumpled white paper napkin with a small red sauce stain and a burger doodle.
9. A small folded paper note sealed with a red heart sticker.
10. A small foil pouch of cat food with a fish drawing.
11. A ball of blue wool yarn with a loose thread.
No text, no numbers, no letters, no UI, no watermark.
```

Arquivo: `itens-cap1-2.png`
