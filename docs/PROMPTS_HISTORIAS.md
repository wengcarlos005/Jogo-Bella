# Próximas histórias — plano + prompts de arte

Ordem de produção sugerida: **1) fotos de lembrança que faltam** (o jogo já chama todas) → **2) Capítulo 4, Araruama** (cenários → objetos → NPCs → minigames → lembranças).

Regras de sempre:
- Cenários: 1536x1024, top-down 3/4, mesmo estilo dos mapas atuais. Gere primeiro o **cenário vazio**, depois a **folha de objetos** (fundo magenta liso #FF00FF), anexando o cenário vazio novo.
- Lembranças: 1672x941. Anexe `public/assets/cinematics/pascoa.png` como modelo de estilo + os sprites da Bella e do Weng da roupa da cena (`public/assets/characters/bella-<roupa>.png`, `weng-<roupa>.png`).
- Folhas de minigame: fundo magenta liso, objetos separados por 60 px, nada encostando na borda.

---

## 1. Lembranças que ainda estão sem foto ("foto em breve")

| Arquivo que eu espero | Lembrança | Onde aparece |
|---|---|---|
| `memory-dq-02.png` | Açaí cheio de complemento | depois do açaí |
| `memory-dq-03.png` | O imbatível perdeu | cartas no apê |
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

## 2. Capítulo 4 — Araruama: "Ano-novo em família"

### O que eu preciso que você me conte (pra história ser a de vocês)

1. Que ano-novo foi (ano) e de quem era a casa? Casa da família do Weng, de praia, alugada?
2. Quem estava lá? Nome, como a Bella chama, e um detalhe de cada um (cabelo, idade aproximada, jeito). Ex.: pai, mãe, irmã, avós, tios, primos.
3. Foi a primeira vez que a Bella passou o ano-novo com a família dele? Ela estava nervosa?
4. O que fizeram durante o dia: lagoa, praia, piscina, mercado, cozinhar?
5. O que tinha na ceia? Alguém cozinhou algo marcante?
6. Como foi a virada: fogos na orla, em casa, pularam ondas, comeram uva/lentilha, fizeram pedido?
7. Alguma coisa engraçada ou fofa que aconteceu (frase, mico, presente, briga boba de família)?
8. Roupa: os dois de branco? (o jogo já tem Bella `linho` branco e Weng `reveillon`.)

### Rascunho da história (ajusto quando você responder)

- **Chegada**: estrada até Araruama, a Bella nervosa de conhecer a família inteira. Barra de "nervosismo" (igual ao prólogo) que baixa conversando com cada um.
- **Missão 1, Conhecer a família**: falar com cada parente. Cada um tem um pedido pequeno (pegar gelo, achar o carregador, segurar o cachorro...).
- **Missão 2, A ceia**: minigame **Mesa da Ceia** (abaixo). Depois a família elogia (ou zoa) a Bella.
- **Missão 3, Fim de tarde na lagoa**: passeio na beira da Lagoa de Araruama (areia branca, água rasa). Minigame **Pedrinha na lagoa**.
- **Missão 4, A virada**: trocar de roupa (branco), descer pra orla, contagem regressiva 10→0, fogos. Minigame **Foto dos fogos**. Pedido de ano-novo (escolha). Lembranças: a ceia e o beijo da meia-noite.

### Minigames (todos com direcional + 1 botão, prontos pra controle)

- **Mesa da Ceia**: uma mesa vista de cima com lugares marcados. Um cursor anda pela mesa (direcional) e o botão coloca o item da vez (prato, copo, talher, travessa). Cada parente tem uma preferência ("o vô senta na ponta", "a irmã não come uva-passa"). Vidas e "Jogar de novo".
- **Pedrinha na lagoa**: uma barra de força sobe e desce; o botão solta no ponto certo; quanto mais quiques, mais estrelas. O Weng tenta ganhar e perde.
- **Foto dos fogos**: contagem regressiva; os fogos sobem; aperte o botão no instante em que estouram (no círculo). 6 fogos, 3 vidas.

### 2A. Cenário: casa da família em Araruama (por dentro)

Anexe como referência de estilo um mapa interno atual (ex.: `art-source/maps` da casa da Bella ou do apê do Weng).

```
Pixel art top-down 3/4 view of the inside of a simple, cozy Brazilian beach-town family house on New Year's Eve, seen from above with the walls cut away. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: a big open living room + dining room (center and bottom), a kitchen with a counter, stove, fridge and sink (top right), a hallway with two bedroom doors (top left), and a wide open glass door to a backyard on the right edge. The front door at the bottom center with a doormat.
Details: white tiled floor, light walls, ceiling fan shadow, a few framed family photos (no faces visible), a wall clock, simple white curtains, string lights with small golden bulbs along the walls.
Everything that stands against a wall stays: kitchen counter and appliances, a long sideboard, a bookshelf, a TV on the wall.

DO NOT draw: the big dining table, chairs, the sofa, the coffee table, standing plants, the cooler, people or animals. Where they would be, show clean continuous floor.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Folha de objetos (casa)**, anexando o cenário vazio novo:

```
Pixel art sprite sheet of props for the house interior shown in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024. Background: ONE flat solid magenta color (#FF00FF) everywhere, no gradient, no floor, no shadows on the background.
Draw these objects, each complete and separate, in a loose grid, at least 60 pixels of magenta between any two objects, nothing touching the canvas edge:
1. A long dining table for 8 with a white tablecloth, EMPTY on top (about 360x160 px).
2. Eight simple white chairs, each one separate (about 50x80 px each).
3. A beige three-seat sofa with white cushions, seen from the front (about 240x110 px).
4. A small wooden coffee table (about 110x60 px).
5. A blue cooler box with ice and drinks (about 70x60 px).
6. A tall potted palm plant (about 80x120 px).
7. A standing floor fan (about 50x90 px).
8. A small Christmas-to-New-Year decoration: a white vase with white flowers and golden ribbons (about 50x70 px).
```

### 2B. Cenário: orla da Lagoa de Araruama (fim de tarde / noite da virada)

```
Pixel art top-down 3/4 view of the shore of a huge calm turquoise lagoon in a Brazilian beach town (Lagoa de Araruama), at dusk on New Year's Eve. Same art style, outline thickness, colors and camera angle as the attached reference image. Canvas 1536x1024 pixels, landscape.

Layout: a paved seaside promenade with lamp posts crossing the top third (left to right), a strip of white sand below it, and the shallow, very clear turquoise lagoon water filling the bottom third, getting darker far away. A small wooden pier on the right going into the water. A few coconut palms along the promenade. Small beach kiosks (closed) on the left. The sky is not visible; colors are warm pink and purple from the sunset reflected on the water.

DO NOT draw: people, animals, kiosk chairs, umbrellas, fireworks, boats, or anything standing on the sand. Clean continuous sand and water.

Crisp pixel art, clean dark outlines, no text, no UI, no watermark.
```

**Folha de objetos (orla)**, anexando o cenário vazio novo:

```
Pixel art sprite sheet of props for the lagoon shore scene in the attached images. EXACTLY the same art style, outline, colors, lighting and top-down 3/4 camera angle, same scale: a standing adult is about 140 pixels tall.
Canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, no gradient, no ground, no shadows on the background. Each object complete and separate, at least 60 px of magenta between objects, nothing touching the edge:
1. A coconut palm tree (about 150x260 px).
2. A beach umbrella, white and yellow, closed (about 40x130 px) and open (about 140x130 px).
3. Two white plastic beach chairs (about 60x70 px each, separate).
4. A small wooden rowing boat pulled onto the sand (about 180x80 px).
5. A lamp post, lit (about 40x170 px).
6. A trash bin (about 35x50 px).
7. A white flower offering for New Year (white flowers and a candle in the sand) (about 60x40 px).
8. A sandcastle (about 70x60 px).
```

### 2C. Família do Weng (NPCs)

Me mande as respostas da pergunta 2 que eu escrevo um prompt por pessoa. O modelo é este (troque o que está entre colchetes):

```
Pixel art character sprite sheet, 4 rows x 4 columns walking animation (rows: walking down, walking left, walking right, walking up), same art style, proportions, outline and colors as the attached character sprites. Chibi proportions like the attached ones. Canvas 1024x1024, background ONE flat solid magenta (#FF00FF).
Character: [ex.: Brazilian woman around 50 years old, short wavy black hair, warm smile, white linen blouse and light blue skirt, sandals].
No text, no UI, no watermark.
```

### 2D. Minigames de Araruama

**Mesa da Ceia** (folha, fundo magenta):

```
Pixel art sprite sheet of New Year's Eve dinner items seen from above (top-down), same art style and colors as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it, nothing touching the edge, each about 110x110 px:
1. A white dinner plate. 2. A champagne glass. 3. Fork and knife on a napkin. 4. A roast turkey on a platter. 5. A bowl of white rice with raisins. 6. A bowl of farofa. 7. A bowl of mayonnaise potato salad. 8. A plate of rabanadas (Brazilian French toast) with sugar and cinnamon. 9. A bunch of green grapes. 10. A small bowl of lentils. 11. A pomegranate cut in half. 12. A bottle of sparkling wine with a golden label (no text). 13. A small place card (blank). 14. A white candle in a glass.
No text, no UI, no watermark.
```

**Pedrinha na lagoa**:

```
Pixel art sprite sheet, same art style as the attached reference, canvas 1024x1024, ONE flat solid magenta (#FF00FF) background, items separate with 60 px of magenta around each:
1. A small flat grey stone (about 40x24 px), 4 rotation frames in a row.
2. A water ripple ring, 3 frames growing (about 90x40 px each).
3. A small water splash (about 60x60 px).
4. The attached girl and boy seen from behind, side by side, standing on white sand looking at a turquoise lagoon at sunset, the girl with her arm raised ready to throw a stone (about 300x260 px).
No text, no UI, no watermark.
```

**Foto dos fogos**:

```
Pixel art sprite sheet of fireworks, same art style as the attached reference, canvas 1536x1024, ONE flat solid magenta (#FF00FF) background, each item separate with 60 px of magenta around it:
1. A rising firework rocket with a sparkle trail (about 30x120 px).
2. Firework bursts, each about 240x240 px: golden, pink, white, blue, green, and a heart-shaped pink burst.
3. A phone camera viewfinder frame (white corners, a small circle in the center) (about 300x200 px).
4. The attached girl and boy, both dressed in white, seen from behind, hugging on the sand and looking up at the sky (about 300x280 px).
No text, no UI, no watermark.
```

**Lembranças de Araruama** (1672x941, mesmo estilo de `pascoa.png`, roupas brancas):

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. A Brazilian family New Year's Eve dinner in a simple beach-town house decorated with string lights: a long table with a white tablecloth, roast turkey, rice, farofa, grapes and sparkling wine. The attached girl (long curly brown hair, pink glasses, white linen dress) and the attached boy (short black hair, white shirt) sit side by side at the table, laughing, surrounded by his family (faces simple and friendly, everyone in white). Warm golden light. No text, no UI, no watermark.
```

```
Cozy pixel art illustration, same art style, colors and framing as the attached reference illustration, 1672x941 pixels, landscape. Midnight on New Year's Eve on the white sand shore of a huge calm lagoon (Lagoa de Araruama, Brazil). Colorful fireworks explode over the water and reflect on it. The attached girl (long curly brown hair, pink glasses, white linen dress) and the attached boy (short black hair, white shirt) kiss on the sand, barefoot, with people in white celebrating far behind them. No text, no UI, no watermark.
```
