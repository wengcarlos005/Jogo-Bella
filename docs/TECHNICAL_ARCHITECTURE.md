# Arquitetura Técnica

## Stack
| Peça | Versão | Por quê |
|---|---|---|
| Phaser | 3.90.0 | Motor 2D estável, Arcade Physics, tilemaps, partículas |
| TypeScript | 5.9 | Tipagem forte para dados de história e sistemas |
| Vite | 6.4 | Dev server rápido, build otimizado, plugin próprio de assets |
| IndexedDB | nativo | Saves persistentes (fallback localStorage) |
| Vercel | — | Hospedagem estática (`vercel.json`) |

## Princípios
1. **Dados separados de código.** Mapas, missões, itens, memórias e diálogos vivem em `src/data` e `src/regions`.
2. **Um motor, muitas cidades.** `GameScene` carrega qualquer `MapDef`; adicionar cidade = adicionar pasta em `src/regions/`.
3. **Arte substituível sem tocar no código.** Toda textura tem uma chave; se o arquivo existe em `public/assets`, ele é usado; senão o `PlaceholderFactory` gera uma provisória com as mesmas dimensões.
4. **Estado único.** `GameState.data` é tudo que vai para o save.
5. **Sistemas conversam por eventos** (`EventBus`).

## Estrutura
```
src/
  main.ts                 bootstrap Phaser + UI + fluxo título/jogo
  config/
    gameConfig.ts         resolução, velocidades, tamanhos
    assetManifest.ts      arquivos esperados (chave ↔ caminho ↔ dimensões)
  core/
    GameState.ts          estado salvável + flags
    EventBus.ts           eventos globais
    script.ts             API de scripts (ScriptContext)
    types.ts
  scenes/
    BootScene, PreloadScene, MenuScene, GameScene
  systems/
    InputSystem           teclado + toque, pilha de contextos (jogo/diálogo/menu)
    InteractionSystem     alvo à frente do jogador
    ScriptRunner          implementa ScriptContext sobre a GameScene
    DialogueBox (ui)      texto progressivo, retratos, escolhas
    QuestSystem           missões/objetivos/encadeamento/recompensa
    InventorySystem       itens por categoria
    MemoryAlbumSystem     memórias por região
    SaveSystem            IndexedDB + slots + preferências
    WeatherSystem         chuva, pôr do sol
    AudioSystem           SFX sintetizados + música por arquivo
  entities/
    Character, Player, NPC (idle/wander/follow/scripted)
  world/
    tiles.ts, MapTypes.ts, MapBuilder.ts
  regions/
    piabeta/ (casaBella.map.ts, casaBella.scripts.ts, rua.map.ts)
    index.ts (registro de mapas)
  data/
    personal.ts           ★ nomes, datas, CARTA — edite aqui
    regions.ts, items.ts, memories.ts, quests/, characters/
  graphics/
    PlaceholderFactory.ts arte provisória procedural
    characterLooks.ts
  ui/
    UIManager.ts, styles.css, components/, screens/
public/assets/            arte e áudio definitivos (ver ASSET_MANIFEST.md)
docs/
```

## Resolução
Área lógica 480×270 (toda a lógica, tiles de 16px), canvas 960×540 com `camera.zoom = 2`.
Folhas de personagem com quadros ≥ 64px recebem `scale 0.5` (1 pixel de arte = 1 pixel do canvas).
Cenários pintados são ajustados ao tamanho do mapa com `setDisplaySize`, então aceitam qualquer resolução (2× recomendado).

## Fluxo de cenas
`Boot → Preload → Menu (título DOM) → Game(mapId, spawn | posição)`.
Trocar de mapa = `scene.restart({ mapId, spawn })` com fade. A cena reconstrói tudo a partir do `MapDef` e do `GameState`.

## Mapas (`MapDef`)
- `ground` (+ `detail` opcional): linhas de caracteres + `legend` → índices de tile (16×16). Tiles sólidos colidem.
- `props`: objetos posicionados por tile, colisão na base, interação, `visibleIf`, `markerIf`.
- `npcs`, `spawns`, `exits` (com `blockedIf`), `triggers` (com `once`/`enabledIf`), `scripts`, `onEnter`.
- **Cenário pintado opcional:** `assets/maps/<id>-bg.png` substitui o visual dos tiles (que ficam só como colisão) e `<id>-fg.png` é desenhado sobre os personagens (copas de árvore, telhados). É o caminho recomendado para arte gerada por IA.

## Scripts
Funções `async (ctx) => {}` com a API em `core/script.ts`: `say`, `choose`, `narrate`, `setFlag`, `give`, `objective`, `memory`, `move`, `place`, `emote`, `fadeOut/In`, `weather`, `sfx`, `follow`... Cobrem diálogos, cutscenes e eventos. A entrada do jogador fica bloqueada durante o script.

## Entrada
`InputSystem` mantém uma pilha de contextos (`game`, `script`, `dialogue`, `pause`, `title`...). Ações discretas (interagir, menu, setas) vão só para o topo; o movimento só funciona com a pilha vazia. Isso evita softlocks de "dois sistemas ouvindo a mesma tecla".

## UI
DOM sobre o canvas, alinhado ao retângulo do canvas; a unidade CSS `--u` = 1px do jogo. Fontes: Pixelify Sans (títulos) e Nunito (texto), empacotadas via `@fontsource` (sem CDN).

## Salvamento
- Auto: ao entrar em mapa, ao concluir missão, a cada 60 s e ao ocultar a aba.
- Manual: 3 espaços.
- `migrate()` preenche campos novos em saves antigos.

## Assets
- Plugin Vite `available-assets` lista o que existe em `public/assets` (e recarrega o jogo quando um arquivo é adicionado).
- `npm run assets:check` mostra o que falta.

## Comandos
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build para dist/
npm run preview
npm run assets:check
```

## Depuração
No console do navegador: `bw.GameState.data` (estado), `bw.game.scene.getScene('Game')` (cena).
