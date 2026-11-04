# A Lua está Bella
## Game Design Document (v0.2)

> Um RPG 2D em pixel art sobre três anos de história.
> Meta: **7h30–8h** de campanha principal + conteúdo opcional.

---

## 1. Visão

| | |
|---|---|
| **Gênero** | RPG 2D narrativo · exploração · life-sim leve · minigames · colecionáveis |
| **Plataforma** | Navegador (desktop e celular), hospedado na Vercel |
| **Resolução interna** | 480×270 (16:9), pixel-perfect, escala inteira/FIT |
| **Perspectiva** | Top-down com construções em 3/4 |
| **Idioma** | Português brasileiro |
| **Jogadora** | Bella |
| **Tom** | Carinho, nostalgia, humor, cumplicidade, expectativa pelo futuro |

### Pilares de design
1. **Lembrança jogável** — cada memória vira algo que a Bella *faz*, não algo que ela só *vê*.
2. **Cada lugar tem personalidade** — mecânica, paleta, música e NPCs próprios por cidade.
3. **Ritmo aconchegante** — sem game over, sem pressa; desafios leves, sempre com dica.
4. **Nada inventado sobre o real** — datas, nomes e fatos reais ficam em `src/data/personal.ts`; o jogo mostra `[a definir]` até o Weng preencher.

---

## 2. Personagens

### Bella (protagonista jogável)
Cabelos escuros cacheados e volumosos, óculos grandes rosados, rosto delicado, bochechas rosadas, colar com pingente, camiseta preta, calça larga, tênis robustos.

**Guarda-roupa por cidade** (integrado): casual (Piabetá, Caxias, Botafogo), jaqueta preta (Petrópolis, Curitiba), linho branco de réveillon (Araruama, Cabo Frio), vestido amarelo florido (Rio das Ostras, Niterói), vestido laranja de festa (Lapa, Seropédica). Em momentos específicos a jogadora escolhe (ex.: guarda-roupa do prólogo: casual ou vestido amarelo).

### Weng (coprotagonista)
Cabelo preto, sorridente, camiseta bege/verde-clara, jaqueta escura, calça cargo verde, tênis claros. Na maior parte do jogo **segue a Bella** (sistema de seguidor com rastro) e participa de diálogos e cenas.

### Elenco de apoio (por região)
Mãe e padrasto da Bella (Piabetá) · vizinhança e comércio (Duque de Caxias) · família do Weng (Araruama) · colegas de faculdade (Seropédica) · equipe do hotel, garçons e guias (Curitiba). Nomes reais configuráveis em `personal.ts`.

### Animações (por personagem)
Idle e caminhada em 4 direções (implementado), corrida (implementado via velocidade da animação), interagir, sentar, acenar, expressões (balões de emoção já implementados: ♥ ! ? ♪ gota). Arquitetura preparada para roupas alternativas (`outfits` no save).

---

## 3. Estrutura da campanha (ordem cronológica obrigatória)

| # | Região | Capítulo | Ano | Papel narrativo | Duração alvo |
|---|---|---|---|---|---|
| 0 | Piabetá | Prólogo | O começo | Onde tudo começou | 40 min |
| 1 | Duque de Caxias | Cap. 1 | Ano 1 | Hub — a convivência | 80 min (60 + revisitas) |
| 2 | Petrópolis | Cap. 2 | Ano 1 | Primeira viagem | 35 min |
| 3 | Araruama | Cap. 3 | Ano 1 | Ano-novo com a família do Weng | 35 min |
| 4 | Rio das Ostras | Cap. 4 | Ano 1 | Férias | 35 min |
| 5 | Niterói | Cap. 5 | Ano 1 | Passeio e fotos | 30 min |
| 6 | Lapa | Cap. 6 | Ano 1 | Aniversário | 30 min |
| 7 | Cabo Frio | Cap. 7 | Ano 1 | Outro ano-novo | 30 min |
| 8 | Botafogo | Cap. 8 | Ano 2 | Cidade grande | 25 min |
| 9 | Seropédica | Cap. 9 | Ano 2 | A formatura do Weng | 40 min |
| 10 | Curitiba | Cap. 10 | Ano 3 | A melhor viagem | 75 min |
| 11 | Piabetá (retorno) | Final | — | A carta | 15 min |
| | | | | **Total campanha** | **≈ 7h50** |

Conteúdo opcional (missões secundárias, colecionáveis 100%, decoração da casa, coleção gastronômica): **+1h a 1h30**.

---

## 4. Capítulos em detalhe

### Prólogo — Piabetá (40 min)
**Mapas:** casa da Bella (interior) · rua/pracinha · hamburgueria (interior) · parque arborizado.

- **M1 — O encontro marcado** *(implementado)*: celular → escolher roupa → óculos → colar → espelho → sala → campainha → atender o Weng → apresentá-lo à mãe e ao padrasto (escolhas com humor) → sair juntos. Memória: *O encontro marcado*.
- **M2 — A hamburgueria**: caminhar pela rua com o Weng; **minigame de montagem de hambúrguer** (pedido por ficha, ingredientes na ordem, tempo folgado, nota de 1–3 estrelas); conversa nervosa de primeiro encontro com escolhas.
- **M3 — O parque e a chuva**: passeio pelo parque (árvores grandes, bancos, flores, luz natural); o clima muda gradualmente; a chuva começa (partículas + escurecimento + som — sistema já implementado); procurar abrigo; conversa especial; **cena cinematográfica do primeiro beijo** (câmera, música própria, corações, fade). Memória: *O primeiro beijo*.
- **Secundária — Florzinhas do caminho** *(implementada)*: colher 3 flores para Dona Cida.

### Capítulo 1 — Duque de Caxias (hub, 80 min)
Região maior, revisitada entre viagens. Praças, ruas, casas, restaurantes, comércio, pequeno parque.
- **Casa do casal personalizável**: móveis desbloqueados em cada viagem (souvenirs viram decoração).
- **Atividades cotidianas**: mercado (lista de compras), **culinária** (receita em etapas), **jardinagem** (plantar/regar/colher ao longo das visitas), **noite de jogos — jogo da memória**.
- **Missões secundárias** com moradores; quadro de avisos com tarefas que se renovam a cada capítulo.
- Ponto de partida das viagens: rodoviária/estação com mapa-múndi.

### Capítulo 2 — Petrópolis (35 min)
Museu Imperial, Palácio de Cristal, Casa de Santos Dumont, centro histórico, ruas de pedra, serra.
- Principal: **A primeira viagem** — roteiro pelo centro histórico.
- **Quebra-cabeça histórico** no museu (ordenar uma linha do tempo de objetos).
- Introdução da **câmera fotográfica** (tirar fotos em pontos marcados → álbum).
- Coleta de objetos (souvenirs para a casa).

### Capítulo 3 — Araruama (35 min)
Casa da família do Weng, lagoa, clima de verão, preparativos de ano-novo.
- Conversar com familiares (NPCs com opiniões e pedidos).
- **Preparação de festa**: lista de tarefas (buscar ingredientes, decorar, arrumar a mesa).
- **Contagem regressiva + fogos** (cena com partículas e som).

### Capítulo 4 — Rio das Ostras (35 min)
Praia de Costazul, Praça da Baleia, píer, orla, quiosques.
- **Pesca** no píer (timing de fisgada; peixes colecionáveis).
- **Coleta de conchas** pela praia.
- **Caça ao tesouro** com pistas espalhadas pela orla.

### Capítulo 5 — Niterói (30 min)
MAC, Parque da Cidade, Icaraí, Caminho Niemeyer.
- **Minigame de fotografia**: enquadrar pontos turísticos (mira + enquadramento + timing de luz).
- Completar a página "Niterói" do álbum.

### Capítulo 6 — Lapa (30 min)
Arcos da Lapa, Escadaria Selarón, ruas históricas, bares.
- Preparar a comemoração de aniversário (encomendas, convites, NPCs).
- **Mosaico da Selarón**: puzzle de encaixe de azulejos.
- Cena especial de aniversário.

### Capítulo 7 — Cabo Frio (30 min)
Praia do Forte, Forte São Mateus, Passagem, Boulevard Canal.
- Atividades de verão: **frescobol** (ritmo/timing), castelo de areia.
- Ano-novo: **pular as sete ondas** (QTE leve) e fogos.

### Capítulo 8 — Botafogo (25 min)
Enseada, praia, vista do Pão de Açúcar, região urbana.
- **Desafio urbano**: chegar a lugares seguindo pistas/placas.
- Restaurante: escolher pratos lembrando o pedido do outro (memória curta).
- Foto com o Pão de Açúcar ao fundo.

### Capítulo 9 — Seropédica (40 min)
Representação artística da UFRRJ: prédios, jardins, caminhos, árvores, áreas de convivência.
- Encontrar colegas (NPCs) pelo campus.
- **Desafios acadêmicos divertidos** (quiz leve, achar a sala certa, devolver livros).
- Preparar a cerimônia (beca, convites, lugar na plateia).
- **Formatura**: cena emocional — Bella acompanha a conquista do Weng.

### Capítulo 10 — Curitiba (75 min)
1. **Aeroporto**: arrumar a mala (**puzzle de encaixe**), check-in, portão, embarque, **cena de voo**.
2. **Hotel**: recepção, quarto, janela com vista, banheiro; pequenas missões internas.
3. **Jardim Botânico**: estufa de vidro, jardins, espelhos d'água — **coleta de flores** (catálogo de espécies).
4. **Ópera de Arame**: estrutura metálica, lago, passarelas, iluminação — cena de contemplação + fotos.
5. **Parque Tanguá**: mirantes, cascata, jardim — exploração com colecionáveis escondidos.
6. **Restaurantes**: sistema de **gastronomia** (cardápios, pratos, minigame de prato, avaliação 1–5, coleção gastronômica).
- Encerramento: **fotografia especial da viagem** — "a melhor parte de qualquer viagem é estar com quem a gente ama".

### Final — A carta de Weng (15 min)
Após Curitiba, Bella recebe uma pista que a leva de volta ao parque de Piabetá, agora no fim de tarde (filtro de pôr do sol já implementado). Um envelope no banco. Animação de abertura → **tela especial de leitura** com texto progressivo → música emocional → cena final do casal → mensagem de encerramento.
- Carta e mensagem final **editáveis** em `src/data/personal.ts` (`letter` e `closing`). O jogo não escreve a carta.

---

## 5. Sistemas de gameplay

| Sistema | Estado | Descrição |
|---|---|---|
| Movimento 4 direções + corrida | ✅ | Arcade physics, corpo nos pés, Shift/botão "Correr" |
| Colisões | ✅ | Tiles sólidos + caixas de colisão dos objetos |
| Interação universal | ✅ | E/Espaço/Enter ou botão A; NPCs, objetos, portas, itens |
| Diálogos | ✅ | Retrato, nome, texto progressivo, escolhas, eventos |
| Missões + rastreamento | ✅ | Objetivos, progresso n/total, dicas, marcador ♥ no alvo |
| Inventário por categorias | ✅ | Fotografias, lembranças, presentes, flores, comidas, especiais, missão |
| Álbum de memórias | ✅ | Páginas por região, imagem, texto, ano, data configurável |
| Salvamento | ✅ | IndexedDB (fallback localStorage), auto + 3 espaços manuais |
| Clima / iluminação | ✅ | Chuva, pôr do sol, transições graduais |
| Cutscenes por script | ✅ | Mover/posicionar atores, emotes, fades, câmera, sons |
| Seguidor (Weng) | ✅ | Segue o rastro da Bella entre mapas |
| Mapa / viagens | 🟡 | Linha do tempo no menu; mapa ilustrado na Fase 4 |
| Minigames | ⏳ | Framework na Fase 3 (hambúrguer primeiro) |
| Personalização / casa | ⏳ | Fase 4 (Duque de Caxias) |
| Câmera fotográfica | ⏳ | Fase 5 (Petrópolis) |

### Minigames (10, sem repetição artificial)
1. Montagem de hambúrguer (Piabetá) · 2. Pesca (Rio das Ostras) · 3. Jardinagem (Caxias) · 4. Fotografia (Niterói, usada também em outras cidades como ferramenta) · 5. Quebra-cabeças (Petrópolis, Lapa) · 6. Jogo da memória (Caxias) · 7. Culinária (Caxias/Curitiba) · 8. Caça ao tesouro (Rio das Ostras) · 9. Preparação de festas (Araruama, Lapa) · 10. Exploração e coleta (Jardim Botânico, conchas, Tanguá).

Cada minigame tem: regras, UI própria, feedback (som/partículas), condição de conclusão e nota opcional que libera colecionável extra. Nenhum minigame pode travar a história: após 3 tentativas aparece "pular".

---

## 6. Progressão
- Regiões desbloqueadas na ordem cronológica.
- Memórias (≈50) e colecionáveis por região.
- Souvenirs → decoração da casa em Caxias.
- Roupas desbloqueadas por capítulo (ex.: roupa de praia, beca).
- Porcentagem de conclusão no menu.

## 7. Interface
- HUD: cartão de missão (fase, título, objetivo, progresso), botões rápidos (álbum, mochila, mapa, menu), prompt de interação.
- Menu: Missões · Inventário · Álbum · Mapa · Salvar · Opções.
- Título com ilustração especial do casal (asset UI-001).
- UI em DOM sobre o canvas: texto nítido em qualquer tela, sem sacrificar o pixel art do mundo.

## 8. Áudio
Tema principal, tema de Piabetá, Caxias, um tema por viagem, Curitiba, primeiro beijo, carta final. SFX: passos, chuva, interações, coleta, menus, portas, ambiente, fogos, avião, minigames. Hoje: SFX sintetizados (placeholders) e música opcional por arquivo. Só músicas livres de direitos.
