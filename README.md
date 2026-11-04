# Bella & Weng — Nossa História 💗

RPG 2D em pixel art feito para comemorar os 3 anos de namoro da Bella e do Weng.
Phaser 3 + TypeScript + Vite, roda no navegador (computador e celular).

## Rodar
```bash
npm install
npm run dev
```
Abra http://localhost:5173. Para gerar a versão de produção: `npm run build`.

## Controles
| Ação | Teclado | Celular |
|---|---|---|
| Andar | WASD / setas | analógico |
| Correr | Shift | botão "Correr" |
| Interagir / avançar texto | E, Espaço, Enter | botão A ou tocar no diálogo |
| Menu | Esc / M | botões do topo |

## Onde editar o que é pessoal
`src/data/personal.ts`: nomes, datas reais, mensagem do celular, **a carta final** e a mensagem de encerramento.

## Arte (ChatGPT)
Veja `docs/ASSET_MANIFEST.md`. Coloque cada PNG no caminho indicado em `public/assets/…`;
o jogo troca o placeholder automaticamente. `npm run assets:check` mostra o que falta.

## Deploy (Vercel)
Importe o repositório na Vercel: o `vercel.json` já define `npm run build` e a saída `dist/`.

## Documentação
- `docs/GAME_DESIGN_DOCUMENT.md`: história, capítulos, sistemas, duração
- `docs/TECHNICAL_ARCHITECTURE.md`: como o código é organizado
- `docs/QUEST_DESIGN.md`: missões por região
- `docs/ASSET_MANIFEST.md`: lista de arte a gerar
- `docs/DEVELOPMENT_ROADMAP.md`: fases
