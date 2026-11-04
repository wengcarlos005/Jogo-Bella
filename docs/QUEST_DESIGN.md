# Design de Missões

Legenda: **P** = principal · **S** = secundária · **C** = colecionáveis · ✅ implementado · ⏳ planejado
Memórias (álbum): meta ≈ 52.

---

## Prólogo — Piabetá (5 memórias)
| ID | Tipo | Nome | Objetivos | Recompensa | Estado |
|---|---|---|---|---|---|
| pia-m1 | P | O encontro marcado | celular · roupa · óculos · colar · espelho · sala · porta · mãe · pai · sair | mem-pia-01 | ✅ |
| pia-m2 | P | A Rota 66 | esperar o Uber na calçada ✅ · trajeto de Uber · chegar na Rota 66 · fazer o pedido (minigame) · conversar no lanche | mem-pia-02 | 🟡 |
| pia-m3 | P | O parque e a chuva | caminhar pelo parque · a chuva começa · achar abrigo · conversa · **primeiro beijo** | mem-pia-03 | ⏳ |
| pia-s1 | S | Florzinhas do caminho | colher 3 flores · entregar à Dona Cida | flor/decoração | ✅ |
| pia-s2 | S | O gato da rua | encontrar o gato 3 vezes e dar petisco | mem-pia-04 | ⏳ |
| pia-c | C | Bilhetes antigos | 3 bilhetes escondidos | mem-pia-05 | ⏳ |

## Cap. 1 — Duque de Caxias (7)
| ID | Tipo | Nome | Resumo |
|---|---|---|---|
| ddc-m1 | P | Nosso cantinho | conhecer a casa, arrumar os primeiros móveis (decoração) |
| ddc-m2 | P | Um dia comum | mercado com lista → culinária (receita em etapas) → jantar |
| ddc-m3 | P | Noite de jogos | jogo da memória com o Weng |
| ddc-m4 | P | Hora de viajar | estação → mapa-múndi → Petrópolis (repete-se entre capítulos) |
| ddc-s1..s6 | S | Vizinhança | quadro de avisos com pedidos que mudam a cada capítulo |
| ddc-s7 | S | Horta | jardinagem: plantar, regar a cada visita, colher |
| ddc-c | C | Souvenirs | cada viagem traz 1–3 objetos de decoração |

## Cap. 2 — Petrópolis (4)
P: roteiro do centro histórico · **puzzle histórico** no Museu Imperial · Palácio de Cristal · Casa de Santos Dumont (a escada "de um pé só" como mini-desafio de passos). S: fotografias (introdução da câmera), objetos perdidos de turistas. C: 6 cartões-postais.

## Cap. 3 — Araruama (4)
P: chegar à casa da família → conversar com cada familiar → **preparar a festa** (ingredientes, decoração, mesa) → contagem regressiva → fogos. S: passeio na lagoa, ajudar na cozinha. C: 5 enfeites de festa.

## Cap. 4 — Rio das Ostras (4)
P: férias na orla → **caça ao tesouro** (pistas na Praça da Baleia, píer, quiosques). S: **pesca** (8 espécies), **conchas** (10). C: conchas raras.

## Cap. 5 — Niterói (4)
P: **álbum fotográfico** — fotografar MAC, Parque da Cidade, Icaraí, Caminho Niemeyer (minigame de enquadramento). S: vista da baía ao pôr do sol. C: fotos bônus.

## Cap. 6 — Lapa (4)
P: preparar a comemoração de aniversário (encomendas, convites) → **mosaico da Selarón** → cena de aniversário. S: músicos de rua, Arcos à noite. C: azulejos.

## Cap. 7 — Cabo Frio (4)
P: atividades de verão (**frescobol**, castelo de areia) → ano-novo: **sete ondas** + fogos. S: Forte São Mateus, Boulevard Canal. C: conchas/estrelas-do-mar.

## Cap. 8 — Botafogo (3)
P: **desafio urbano** por pistas → restaurante (pedido de memória) → foto com o Pão de Açúcar. S: passeio na enseada.

## Cap. 9 — Seropédica (4)
P: chegar ao campus → encontrar colegas → **desafios acadêmicos** (quiz leve, sala certa, livros) → preparar a cerimônia → **formatura** (cena emocional). S: lugares favoritos do Weng no campus. C: fotos da turma.

## Cap. 10 — Curitiba (8)
P: **malas** (puzzle de encaixe) → check-in → embarque → **voo** → hotel → Jardim Botânico (**coleta de flores**) → Ópera de Arame → Parque Tanguá → **restaurantes** (gastronomia) → foto especial. S: missões do hotel, colecionáveis do Tanguá, coleção gastronômica 100%. C: flores (catálogo), pratos.

## Final — A carta (1)
P: pista → retorno ao parque de Piabetá ao pôr do sol → envelope → leitura da carta → cena final.

---

## Regras anti-softlock
1. Toda missão tem `hint` no objetivo atual (menu Missões) e marcador ♥ no alvo quando faz sentido.
2. Saídas bloqueadas explicam o motivo (`blockedIf` → mensagem).
3. Minigames oferecem "pular" após 3 tentativas.
4. Gatilhos `once` gravam flag; scripts são reentrantes (checam o estado antes de agir).
5. Itens de missão nunca podem ser descartados.

## Convenções
- IDs: `<regiao>-m<n>` (principal), `<regiao>-s<n>` (secundária).
- Flags: `kebab-case`; gatilhos automáticos: `trigger:<mapa>:<id>`.
