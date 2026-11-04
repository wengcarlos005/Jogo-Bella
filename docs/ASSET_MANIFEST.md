# Manifesto de Assets

> Documento vivo. Sempre que voltar do ChatGPT com arte nova, coloque o arquivo
> no caminho indicado e rode `npm run assets:check`.
> O jogo usa o arquivo automaticamente; enquanto ele não existir, aparece um placeholder.

**Estados:** `planejado` → `solicitado` → `recebido` → `integrado` · `pendente` = aguardando decisão

---

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
| Spritesheet de personagem | 128×128 | 4×4 quadros de 32×32 | linhas: frente, esquerda, direita, costas · 4 quadros de passo · pés na mesma linha em todos |
| Retrato de diálogo | 96×96 | — | rosto + ombros, fundo liso claro |
| Objeto | múltiplos de 16 (ex.: 32×48) | — | base apoiada no "chão" da imagem |
| Ícone de item | 16×16 (gerar 256×256) | — | silhueta clara |
| Cenário pintado | tamanho do mapa (abaixo) | 16px | vista de cima; luz vindo do canto superior esquerdo |
| Camada frontal (`-fg`) | tamanho do mapa | — | só o que fica NA FRENTE dos personagens (copas, telhados), resto transparente |
| Ilustração de memória | 320×200 | — | cena especial, pode ter personagens |

---

## 1. Inventário

### LOTE 1 — Personagens base + Piabetá (PRIORIDADE MÁXIMA)
| ID | Arquivo | Categoria | Dimensões | Frames | Estado |
|---|---|---|---|---|---|
| CHAR-001 | `characters/bella-walk.png` | Personagem | 128×128 | 16 (4×4) | solicitado |
| CHAR-002 | `characters/weng-walk.png` | Personagem | 128×128 | 16 (4×4) | solicitado |
| PORT-001 | `portraits/bella-neutral.png` | Retrato | 96×96 | 1 | solicitado |
| PORT-002 | `portraits/weng-neutral.png` | Retrato | 96×96 | 1 | solicitado |
| NPC-001 | `npcs/mae-bella-walk.png` | NPC | 128×128 | 16 | solicitado |
| NPC-002 | `npcs/pai-bella-walk.png` | NPC | 128×128 | 16 | solicitado |
| NPC-003 | `npcs/vizinha-walk.png` | NPC (Dona Cida) | 128×128 | 16 | solicitado |
| PORT-003 | `portraits/mae-bella.png` | Retrato | 96×96 | 1 | solicitado |
| PORT-004 | `portraits/pai-bella.png` | Retrato | 96×96 | 1 | solicitado |
| PORT-005 | `portraits/vizinha.png` | Retrato | 96×96 | 1 | solicitado |
| MAP-001 | `maps/piabeta-casa-bella-bg.png` | Cenário | 352×240 | — | solicitado |
| MAP-003 | `maps/piabeta-rua-bg.png` | Cenário | 640×384 | — | solicitado |
| MAP-002 | `maps/piabeta-casa-bella-fg.png` | Camada frontal | 352×240 | — | planejado (opcional) |
| MAP-004 | `maps/piabeta-rua-fg.png` | Camada frontal | 640×384 | — | planejado (opcional) |

**Prompts sugeridos (Lote 1):**

- **CHAR-001 Bella:** "Spritesheet de pixel art 4×4 em fundo transparente da personagem Bella (use a imagem anexada como referência): cabelo escuro cacheado e volumoso, óculos grandes rosados, bochechas rosadas, colar com pequeno pingente, camiseta preta, calça larga clara, tênis robustos. Linha 1: andando de frente (4 quadros); linha 2: andando para a esquerda; linha 3: andando para a direita; linha 4: andando de costas. Todos os quadros com o mesmo tamanho, personagem centralizada, pés na mesma altura."
- **CHAR-002 Weng:** mesmo texto, com: "cabelo preto curto, sorridente, camiseta bege/verde-clara, jaqueta escura aberta, calça cargo verde, tênis claros". **Mesma escala da Bella.**
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
