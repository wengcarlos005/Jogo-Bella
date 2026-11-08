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
| `memory-dq-09.png` | Achadinhos da Multidão | **nova**: saindo do Multidão |
| `memory-dq-10.png` | A lista da Vó | **nova**: saindo do mercadinho |
| `memory-pt-01.png` | Cisnes e nuvens | **nova**: fim do piquenique |
| `memory-pt-02.png` | Meia-noite em ponto | **nova**: parabéns à meia-noite |
| `memory-pt-03.png` | Almoço de aniversário | **nova**: fim do almoço |

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

### Roteiro do capítulo

1. **Chegada à cobertura**: elevador, porta, a família inteira falando ao mesmo tempo. Barra de nervosismo da Bella (igual ao prólogo) que baixa conforme ela conversa com cada um. A tia Tim comanda a casa.
2. **Conhecer (de novo) a família**: falar com a tia Tim, os tios, a Anne e os primos. Cada um tem um pedido pequeno.
3. **Passeio na praia da lagoa**: andar na orla durante o dia, areia branca e água rasa. Minigame opcional: **Pedrinha na lagoa**.
4. **Suco no shopping**: cena ilustrada com escolha de sabor e conversa.
5. **Parque de diversões**: minigame **Argolas** (o Weng tenta ganhar uma pelúcia pra Bella) e cena na **roda-gigante**.
6. **Ceia chinesa**: minigame **Mesa Giratória**. A mesa redonda gira; aperte o botão quando o prato que o parente pediu parar na frente dele.
7. **A virada na varanda**: contagem regressiva, fogos sobre a lagoa. Minigame **Foto dos fogos**. Pedido de ano-novo (escolha). Beijo da meia-noite.

Todos os minigames usam só direcional + 1 botão (prontos pra controle de videogame).

### 2A. Cobertura por dentro (cenário vazio)

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

### 2B. Varanda da cobertura à noite (cenário vazio)

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
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. A bright juice bar inside a small shopping mall in a Brazilian beach town on a hot summer day: a colorful counter with fresh fruits (oranges, pineapples, watermelon, strawberries, passion fruit, açaí) and blenders. The attached girl (long curly brown hair, pink glasses, black t-shirt) and the attached boy (short black hair, black t-shirt) sit at a small round table with two big cups of fresh juice with straws, she offers him a sip of hers and he makes a surprised face at the taste. Cold air-conditioning vibe, warm smiles. No text, no UI, no watermark.
```

### 2F. Família (NPCs)

Pra cada pessoa eu preciso de: idade aproximada, cabelo, um traço (óculos, barba, altura) e uma roupa típica. Se preferir, anexe uma foto da pessoa no ChatGPT junto com o prompt abaixo.

```
Pixel art character sprite sheet, 4 rows x 4 columns walking animation (rows: walking down, walking left, walking right, walking up), same art style, proportions, outline and colors as the attached character sprites. Chibi proportions like the attached ones. Canvas 1024x1024, background ONE flat solid magenta (#FF00FF).
Character: [descrição da pessoa].
No text, no UI, no watermark.
```

### 2G. Minigames

**Mesa Giratória (ceia chinesa)**: anexe o cenário da cobertura como referência de estilo.

```
Pixel art sprite sheet of a Chinese family New Year's Eve dinner seen from directly above (top-down), same art style and colors as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it, nothing touching the edge:
1. A big round dining table with a white tablecloth seen from above, with a round glass lazy susan in the middle, EMPTY (about 520x520 px).
2. Dishes seen from above, each about 110x110 px: a bamboo steamer with dumplings (jiaozi); a plate of steamed buns (baozi); a plate of long noodles; a whole steamed fish with green onions; a plate of spring rolls; a bowl of fried rice; a plate of kung pao chicken; a plate of crispy roast duck slices; a plate of sesame balls; a bowl of tangerines; a pot of jasmine tea with cups.
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

**Ceia chinesa em família** (`memory-ar-01`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. New Year's Eve in a bright penthouse apartment: a big round table with a glass lazy susan full of Chinese food (dumplings, noodles, steamed fish, roast duck, spring rolls, fried rice, tangerines). A big, loud, happy Chinese-Brazilian family around it, kids laughing, an aunt serving food to everyone. The attached girl (long curly brown hair, pink glasses, black t-shirt) and the attached boy (short black hair, black t-shirt) sit side by side; she holds chopsticks a bit nervously and he helps her pick up a dumpling. Warm golden light, red lanterns on the wall. No text, no UI, no watermark.
```

**Roda-gigante** (`memory-ar-02`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Night at a small amusement park in a Brazilian beach town. The attached girl (long curly brown hair, pink glasses, black t-shirt) and the attached boy (short black hair, black t-shirt) sit together inside a Ferris wheel gondola at the top, the colorful lights of the park and the dark lagoon below them. She hugs a big orange cat plush he won for her; he looks at her instead of the view. No text, no UI, no watermark.
```

**Fogos da varanda** (`memory-ar-03`)

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Midnight on New Year's Eve on the big balcony of a penthouse high above a huge calm lagoon (Lagoa de Araruama, Brazil). Colorful fireworks explode over the water along the lit seaside promenade below and reflect on the lagoon. The attached girl (long curly brown hair, pink glasses, black t-shirt) and the attached boy (short black hair, black t-shirt) kiss at the glass railing; behind them, the whole family celebrates and hugs with glasses raised. No text, no UI, no watermark.
```
