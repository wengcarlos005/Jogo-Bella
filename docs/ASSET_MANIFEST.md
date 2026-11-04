# Manifesto de Assets

> Documento vivo. Sempre que voltar do ChatGPT com arte nova, coloque o arquivo
> no caminho indicado e rode `npm run assets:check`.
> O jogo usa o arquivo automaticamente; enquanto ele não existir, aparece um placeholder.

**Estados:** `planejado` → `solicitado` → `recebido` → `integrado` · `pendente` = aguardando decisão

---

> **Resolução HD:** o canvas é desenhado em 960×540 (2× a área lógica de 480×270).
> Personagens e cenários do ChatGPT entram com o dobro de pixels e são exibidos em
> meia escala, preservando o detalhe da arte.

## 0. Regras para TODA arte (cole no começo de cada pedido ao ChatGPT)

```
Estilo: pixel art 16-bit, aconchegante e detalhada, inspirada em RPGs de fazenda/aventura
modernos. Perspectiva top-down com objetos e construções em 3/4. Paleta quente:
verdes para vegetação, tons terrosos para caminhos, creme/bege em superfícies claras,
rosa e vermelho em detalhes românticos, dourado para itens especiais. Contorno escuro
suave (não preto puro). Sem anti-aliasing, sem desfoque, sem texto, sem marca d'água,
sem moldura. Personagens chibi (cabeça grande, ~2,5 cabeças de altura).
```

**Personagens/objetos:** fundo **transparente** (PNG).
**Cenários:** imagem única, sem personagens.
**Tamanho:** pode enviar no tamanho que o ChatGPT gerar; eu reduzo com vizinho-mais-próximo e recorto para as dimensões finais abaixo.
**Consistência:** sempre anexe a imagem de referência oficial da Bella e do Weng ao pedir qualquer arte com eles.

### Especificações técnicas
| Tipo | Dimensão final no jogo | Grade | Observações |
|---|---|---|---|
| Spritesheet de personagem | 384×384 (HD) | 4×4 quadros de 96×96 (personagem ~72px de arte) | linhas: frente, esquerda, direita, costas · 4 quadros de passo · processada por `scripts/process-spritesheet.py` |
| Retrato de diálogo | 192×192 (HD) | — | rosto + ombros, fundo liso claro |
| Objeto | múltiplos de 16 (ex.: 32×48) | — | base apoiada no "chão" da imagem |
| Ícone de item | 16×16 (gerar 256×256) | — | silhueta clara |
| Cenário pintado | **2× o tamanho do mapa** (HD, abaixo) | 32px por tile | vista de cima; luz vindo do canto superior esquerdo |
| Camada frontal (`-fg`) | igual ao cenário | — | só o que fica NA FRENTE dos personagens (copas, telhados), resto transparente |
| Ilustração de memória | 320×200 | — | cena especial, pode ter personagens |

---

## 1. Inventário

### LOTE 1 — Personagens base + Piabetá (PRIORIDADE MÁXIMA)
| ID | Arquivo | Categoria | Dimensões | Frames | Estado |
|---|---|---|---|---|---|
| CHAR-001 | `characters/bella-casual.png` | Bella — camiseta preta, óculos rosados | 384×384 | 16 (4×4) | **integrado** |
| CHAR-011 | `characters/bella-floral.png` | Bella — vestido amarelo florido | 384×384 | 16 | **integrado** |
| CHAR-012 | `characters/bella-linho.png` | Bella — conjunto de linho branco | 384×384 | 16 | **integrado** |
| CHAR-013 | `characters/bella-festa.png` | Bella — vestido laranja de festa | 384×384 | 16 | **integrado** |
| CHAR-014 | `characters/bella-inverno.png` | Bella — jaqueta preta | 384×384 | 16 | **integrado** |
| CHAR-002 | `characters/weng-casual.png` | Weng — camiseta preta estampada | 384×384 | 16 (4×4) | **integrado** |
| CHAR-021 | `characters/weng-basica.png` | Weng — camiseta branca | 384×384 | 16 | **integrado** |
| CHAR-022 | `characters/weng-social.png` | Weng — colete e gravata | 384×384 | 16 | **integrado** |
| CHAR-023 | `characters/weng-xadrez.png` | Weng — camisa xadrez preta | 384×384 | 16 | **integrado** |
| CHAR-024 | `characters/weng-reveillon.png` | Weng — camisa branca xadrez | 384×384 | 16 | **integrado** |
| PORT-001 | `portraits/bella-neutral.png` | Retrato (gerado da folha casual) | 96×96 | 1 | **integrado** |
| PORT-002 | `portraits/weng-neutral.png` | Retrato (gerado da folha casual) | 192×192 | 1 | **integrado** |
| NPC-001 | `npcs/mae-bella-walk.png` | NPC | 384×384 | 16 | solicitado |
| NPC-002 | `npcs/pai-bella-walk.png` | NPC | 384×384 | 16 | **integrado** |
| NPC-003 | `npcs/vizinha-walk.png` | NPC (Dona Cida) | 384×384 | 16 | **integrado** |
| PORT-003 | `portraits/mae-bella.png` | Retrato | 96×96 | 1 | solicitado |
| PORT-004 | `portraits/pai-bella.png` | Retrato (gerado da folha) | 192×192 | 1 | **integrado** |
| PORT-005 | `portraits/vizinha.png` | Retrato (gerado da folha) | 192×192 | 1 | **integrado** |
| MAP-001 | `maps/piabeta-casa-bella-bg.png` | Cenário (original 1536×1024) | 1024×683 | — | **integrado** |
| MAP-003 | `maps/piabeta-rua-bg.png` | Cenário (original 1619×971) | 1079×647 | — | **integrado** |
| MAP-002 | `maps/piabeta-casa-bella-fg.png` | Camada frontal | 704×480 | — | planejado (opcional) |
| MAP-004 | `maps/piabeta-rua-fg.png` | Camada frontal | 1280×768 | — | planejado (opcional) |

**Como integrar um cenário do ChatGPT:** guarde o original em `art-source/maps/`, reduza para 2/3
(o jogo exibe 1 tile = 48 px da imagem original) e meça paredes/móveis em pixels da imagem original
com o helper `R(x0, y0, x1, y1)` no arquivo do mapa (`blocks`, `hotspots`, `triggers`, `exits`).
Abra o jogo com `?debug` na URL para ver colisões (vermelho), interações (verde), gatilhos (azul) e saídas (amarelo).

**Como integrar uma folha nova do ChatGPT:** salve o original em `art-source/` e rode
`python3 scripts/process-spritesheet.py art-source/<arquivo> public/assets/<pasta>/<nome>.png --frame 96 --height 72`
(remove o fundo, recorta a grade, padroniza a escala e alinha os pés).

**Roupas por cidade** (`src/data/outfits.ts`):

| Cidade | Bella | Weng |
|---|---|---|
| Piabetá, Duque de Caxias, Botafogo | casual (óculos rosados) | camiseta preta estampada |
| Petrópolis, Curitiba | jaqueta preta | camisa xadrez preta |
| Araruama, Cabo Frio (réveillon) | linho branco | camisa branca xadrez |
| Rio das Ostras, Niterói | vestido amarelo | camiseta branca |
| Lapa | vestido laranja | camisa xadrez preta |
| Seropédica (formatura) | vestido laranja | colete e gravata |

Só a roupa casual da Bella tem os óculos rosados.

**Prompts sugeridos (Lote 1):**

- **CHAR-001 Bella:** "Spritesheet de pixel art 4×4 em fundo transparente da personagem Bella (use a imagem anexada como referência): cabelo escuro cacheado e volumoso, óculos grandes rosados, bochechas rosadas, colar com pequeno pingente, camiseta preta, calça larga clara, tênis robustos. Linha 1: andando de frente (4 quadros); linha 2: andando para a esquerda; linha 3: andando para a direita; linha 4: andando de costas. Todos os quadros com o mesmo tamanho, personagem centralizada, pés na mesma altura."
- **CHAR-002 Weng:** use a folha casual da Bella como referência de estilo e escala (anexe-a). Mesmo texto, com: "cabelo preto curto, sorridente, camiseta bege/verde-clara, jaqueta escura aberta, calça cargo verde, tênis claros". **Mesma escala da Bella.**
- **MAP-001 Casa da Bella:** "Cenário de pixel art visto de cima, interior de uma casa brasileira simples e aconchegante, sem personagens. Esquerda superior: quarto da Bella (cama com colcha rosa, guarda-roupa de madeira, escrivaninha, penteadeira com espelho, planta). Direita superior: cozinha com piso quadriculado (geladeira, fogão, mesa com toalha). Parte de baixo: sala com sofá azul, tapete vermelho estampado, TV, estante com livros e porta de entrada no centro da parede de baixo. Paredes internas finas separando os cômodos, passagem do quarto para a sala à esquerda, passagem da cozinha para a sala no centro."
- **MAP-003 Rua de Piabetá:** "Cenário de pixel art visto de cima, rua residencial brasileira de bairro tranquilo, fim de tarde ensolarado, sem personagens. Faixa de cima: três construções lado a lado — casa da Bella (telhado laranja, muro baixo de madeira, jardinzinho e caixa de correio vermelha), casa da vizinha (telhado azul, paredes verde-água) e uma hamburgueria com letreiro vermelho de hambúrguer e calçada larga; entre a casa azul e a hamburgueria, uma trilha de terra subindo para o norte. Meio: calçada, meio-fio, rua de asfalto com faixa amarela tracejada, um carro estacionado. Faixa de baixo: pracinha com grama, flores, árvores, dois bancos de madeira, postes de luz e caminhos de terra em cruz, cercada por cerca viva."

### LOTE 2 — Piabetá completo (Fase 3)
| ID | Arquivo | Categoria | Dimensões | Estado |
|---|---|---|---|---|
| MAP-005 | `maps/piabeta-hamburgueria-bg.png` | Cenário interior | 320×240 | planejado |
| MAP-006 | `maps/piabeta-parque-bg.png` | Cenário (parque arborizado) | 640×480 | planejado |
| MAP-007 | `maps/piabeta-parque-fg.png` | Copas das árvores | 640×480 | planejado |
| OBJ-001..010 | `objects/burger-*.png` | Ingredientes do minigame (pão, carne, queijo, alface, tomate, cebola, bacon, molho, picles, pão de cima) | 32×16 cada | planejado |
| UI-010 | `ui/burger-order-card.png` | Ficha de pedido | 96×128 | planejado |
| CIN-001 | `cinematics/primeiro-beijo.png` | Cena do beijo na chuva | 480×270 | planejado |
| MEM-001..003 | `cinematics/memory-pia-0X.png` | Ilustrações do álbum | 320×200 | planejado |
| CHAR-003 | `characters/bella-actions.png` | Sentar, acenar, interagir (4 dir.) | 128×96 | planejado |
| CHAR-004 | `characters/weng-actions.png` | idem | 128×96 | planejado |
| UI-001 | `ui/title-art.png` | Ilustração do título (casal) | 320×180 | planejado |
| NPC-004 | `npcs/atendente-burger-walk.png` | NPC | 128×128 | planejado |

### LOTE 3 — Duque de Caxias (Fase 4)
Cenários: bairro/praça (960×640), casa do casal (interior 320×240), mercado (320×240), estação (480×270). Móveis de decoração (~20 objetos, 16–48px). NPCs de vizinhança (6 folhas 4×4). Ícones de inventário (16×16). UI-002 mapa-múndi ilustrado (480×270).

### LOTE 4–6 — Viagens do Ano 1 e 2 (Fases 5–6)
Por cidade: 2–4 cenários pintados + camadas frontais, 3–6 NPCs, objetos-chave dos minigames, 3–4 ilustrações de memória. Lista detalhada será gerada no início de cada fase.

### LOTE 7 — Curitiba (Fase 7)
Aeroporto (3 cenas), avião (cena de voo), hotel (recepção + quarto), Jardim Botânico (estufa), Ópera de Arame, Parque Tanguá, 4 restaurantes, ~12 pratos (32×32), ~10 flores (16×16), 8 memórias.

### LOTE 8 — Final
Parque ao pôr do sol (variação de MAP-006), envelope (animação 4 quadros 48×32), papel de carta (UI 320×240), cena final do casal (480×270).

---

## 2. Arte provisória em uso (gerada por código)
Tudo listado acima ainda não recebido é desenhado pelo `PlaceholderFactory` com a mesma chave e as mesmas dimensões: tileset base (30 tiles), 5 personagens, 5 retratos, ~25 objetos, 5 ícones, balões de emoção, chuva, marcador de objetivo e ilustrações de memória.
