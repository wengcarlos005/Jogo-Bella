# Roadmap de Desenvolvimento

| Fase | Entrega | Estado |
|---|---|---|
| 1 | Planejamento: GDD, arquitetura, missões, assets, roadmap | ✅ |
| 2 | Protótipo funcional: motor, menu, movimento, câmera, colisões, interação, diálogos, missões, inventário, álbum, salvamento, toque, clima | ✅ |
| 3 | Vertical slice Piabetá: Uber, Rota 66 (fachada + interior), 2 minigames de hambúrguer, parque, chuva, primeiro beijo, fim do prólogo | ✅ |
| 4 | Duque de Caxias: hub, casa personalizável, jardinagem, culinária, jogo da memória, mapa-múndi, sistema de minigames genérico | ⏳ próxima |
| 5 | Ano 1: Petrópolis, Araruama, Rio das Ostras, Niterói, Lapa, Cabo Frio (câmera fotográfica, pesca, puzzles, festas) | ⏳ |
| 6 | Ano 2: Botafogo, Seropédica (formatura) | ⏳ |
| 7 | Ano 3: Curitiba (aeroporto, voo, hotel, 3 parques, gastronomia) | ⏳ |
| 8 | Final: retorno a Piabetá, carta editável, cena final | ⏳ |
| 9 | Polimento: testes, balanceamento, áudio definitivo, otimização, publicação na Vercel | ⏳ |

## Fase 2 — o que foi entregue
- Projeto Phaser 3 + TypeScript + Vite, build e deploy configurados (`vercel.json`).
- Detecção automática de assets reais vs. placeholders (plugin Vite + `assets:check`).
- Missão 1 completa ("O encontro marcado") e início da Missão 2, testadas de ponta a ponta.
- Missão secundária de exemplo (flores da Dona Cida).
- Salvamento automático/manual, título com Continuar/Carregar, opções.
- Controles de toque (analógico + A + Correr) e aviso para girar o celular.

## Fase 3 — plano
1. Integrar Lote 1 (sprites, retratos, cenários pintados) e ajustar colisões aos desenhos.
2. Framework `MinigameScene` (overlay com regras, UI, feedback, conclusão, pular).
3. Hamburgueria (interior) + minigame de montagem + conversa do encontro.
4. Parque arborizado + transição de clima + abrigo + cena do beijo (CinematicSystem: câmera, música, corações).
5. Memórias 02 e 03 + ilustrações.
6. Folhas de ação (sentar/acenar) e animações especiais.

## Riscos e mitigação
| Risco | Mitigação |
|---|---|
| IA gera spritesheets desalinhadas | Script de normalização (recorte + grade + redução) na Fase 3; specs rígidas no manifesto |
| Cenários pintados não batem com colisão | Colisão é redesenhada a partir da imagem recebida |
| Duração < 6h | Tabela de duração por capítulo no GDD; playtests cronometrados a cada fase |
| Celular pequeno | UI em DOM escalável, texto mínimo de 13px, testes com viewport de iPhone |

## Duração planejada (min)
Prólogo 40 · Caxias 80 · Petrópolis 35 · Araruama 35 · Rio das Ostras 35 · Niterói 30 · Lapa 30 · Cabo Frio 30 · Botafogo 25 · Seropédica 40 · Curitiba 75 · Final 15 = **470 min (≈7h50)** + opcional 60–90 min.
