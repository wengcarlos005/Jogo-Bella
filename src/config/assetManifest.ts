/**
 * Manifesto técnico de assets.
 *
 * Cada entrada declara o arquivo ESPERADO em public/. Se o arquivo
 * existir (detectado pelo plugin do Vite), ele é carregado; se não,
 * o PlaceholderFactory gera uma textura provisória com a MESMA chave.
 * Assim o código nunca muda quando a arte definitiva chega.
 *
 * Documentação humana correspondente: docs/ASSET_MANIFEST.md
 */
export type AssetKind = 'image' | 'spritesheet' | 'audio';

export interface AssetEntry {
  id: string;
  key: string;
  file: string;
  kind: AssetKind;
  frameWidth?: number;
  frameHeight?: number;
}

const char = (id: string, key: string, file: string, frame = 32): AssetEntry => ({
  id,
  key,
  file: `assets/${file}`,
  kind: 'spritesheet',
  frameWidth: frame,
  frameHeight: frame,
});

export const ASSETS: AssetEntry[] = [
  // Personagens — walk sheet 4x4 (linhas: baixo, esquerda, direita, cima).
  // Arte real HD: quadros 136x136 (personagem ~100px de arte = 50px lógicos, 1 pixel de arte por pixel de tela).
  // Placeholders: 32x32.
  // Bella tem uma folha por roupa (ver src/data/outfits.ts).
  char('CHAR-001', 'bella-casual', 'characters/bella-casual.png', 136),
  char('CHAR-015', 'bella-pijama', 'characters/bella-pijama.png', 136),
  char('CHAR-016', 'bella-pijama-oculos', 'characters/bella-pijama-oculos.png', 136),
  char('CHAR-011', 'bella-floral', 'characters/bella-floral.png', 136),
  char('CHAR-012', 'bella-linho', 'characters/bella-linho.png', 136),
  char('CHAR-013', 'bella-festa', 'characters/bella-festa.png', 136),
  char('CHAR-014', 'bella-inverno', 'characters/bella-inverno.png', 136),
  // Sentados (2 quadros: olhos abertos / fechados)
  { id: 'CHAR-031', key: 'bella-sit', file: 'assets/characters/bella-sit.png', kind: 'spritesheet', frameWidth: 136, frameHeight: 136 },
  { id: 'CHAR-032', key: 'weng-sit', file: 'assets/characters/weng-sit.png', kind: 'spritesheet', frameWidth: 136, frameHeight: 136 },
  char('CHAR-002', 'weng-casual', 'characters/weng-casual.png', 136),
  char('CHAR-021', 'weng-basica', 'characters/weng-basica.png', 136),
  char('CHAR-022', 'weng-social', 'characters/weng-social.png', 136),
  char('CHAR-023', 'weng-xadrez', 'characters/weng-xadrez.png', 136),
  char('CHAR-024', 'weng-reveillon', 'characters/weng-reveillon.png', 136),
  char('NPC-001', 'mae-bella', 'npcs/mae-bella-walk.png', 136),
  char('NPC-002', 'pai-bella', 'npcs/pai-bella-walk.png', 136),
  char('NPC-003', 'vizinha', 'npcs/vizinha-walk.png', 136),

  char('NPC-004', 'atendente', 'npcs/atendente-walk.png', 136),

  // Minigame do hambúrguer (ingredientes recortados de objects/burger-ingredientes)
  ...['pao-baixo', 'carne', 'queijo', 'alface', 'tomate', 'cebola', 'bacon', 'picles', 'molho', 'pao-cima'].map(
    (n, i): AssetEntry => ({ id: `OBJ-${String(i + 1).padStart(3, '0')}`, key: `burger-${n}`, file: `assets/objects/burger-${n}.png`, kind: 'image' }),
  ),

  // Casal sentado no banco (4 quadros 200x150: normal, piscando, expressão, normal)
  ...['bench-pq-ang-r', 'bench-pq-front-lamp', 'bench-pq-ang-l', 'bench-pq-front-bin', 'bench-rua', 'bench-rua-bin'].map(
    (n, i): AssetEntry => ({ id: `OBJ-04${i}`, key: n, file: `assets/objects/${n}.png`, kind: 'spritesheet', frameWidth: 200, frameHeight: 150 }),
  ),

  // Veículos (HD: quadros 192x128 — esquerda, direita, frente, costas)
  { id: 'OBJ-020', key: 'uber-car', file: 'assets/objects/uber-car.png', kind: 'spritesheet', frameWidth: 192, frameHeight: 128 },

  // Guarda-chuvas (HD, opcionais): sobrepostos ao personagem na chuva
  { id: 'OBJ-021', key: 'umbrella-bella', file: 'assets/objects/umbrella-bella.png', kind: 'image' },
  { id: 'OBJ-022', key: 'umbrella-weng', file: 'assets/objects/umbrella-weng.png', kind: 'image' },

  // Retratos de diálogo (96x96)
  { id: 'PORT-001', key: 'portrait-bella', file: 'assets/portraits/bella-neutral.png', kind: 'image' },
  // Retrato por roupa (a caixa de falas usa o da roupa atual)
  ...['casual', 'floral', 'linho', 'festa', 'inverno', 'pijama', 'pijama-oculos'].map(
    (n, i): AssetEntry => ({ id: `PORT-B${i}`, key: `portrait-bella-${n}`, file: `assets/portraits/bella-${n}.png`, kind: 'image' }),
  ),
  ...['casual', 'basica', 'social', 'xadrez', 'reveillon'].map(
    (n, i): AssetEntry => ({ id: `PORT-W${i}`, key: `portrait-weng-${n}`, file: `assets/portraits/weng-${n}.png`, kind: 'image' }),
  ),
  { id: 'PORT-002', key: 'portrait-weng', file: 'assets/portraits/weng-neutral.png', kind: 'image' },
  { id: 'PORT-003', key: 'portrait-mae-bella', file: 'assets/portraits/mae-bella.png', kind: 'image' },
  { id: 'PORT-004', key: 'portrait-pai-bella', file: 'assets/portraits/pai-bella.png', kind: 'image' },
  { id: 'PORT-005', key: 'portrait-vizinha', file: 'assets/portraits/vizinha.png', kind: 'image' },
  { id: 'PORT-006', key: 'portrait-atendente', file: 'assets/portraits/atendente.png', kind: 'image' },

  // Cenários pintados (opcionais) — se existirem, substituem os tiles visuais
  // Bichinhos: folha 4x4 (quadros 64x64, exibidos em meia escala) + faixa de poses (96x64):
  // 0 sentada, 1 dormindo, 2 se espreguiçando, 3 recebendo carinho.
  char('PET-001', 'meli', 'pets/meli-walk.png', 64),
  { id: 'PET-001P', key: 'meli-poses', file: 'assets/pets/meli-poses.png', kind: 'spritesheet', frameWidth: 96, frameHeight: 64 },
  char('PET-002', 'lala', 'pets/lala-walk.png', 64),
  { id: 'PET-002P', key: 'lala-poses', file: 'assets/pets/lala-poses.png', kind: 'spritesheet', frameWidth: 96, frameHeight: 64 },
  { id: 'MAP-010', key: 'map-duque-apto-bg', file: 'assets/maps/duque-apto-bg.png', kind: 'image' },
  { id: 'MAP-001', key: 'map-piabeta-casa-bella-bg', file: 'assets/maps/piabeta-casa-bella-bg.png', kind: 'image' },
  { id: 'MAP-002', key: 'map-piabeta-casa-bella-fg', file: 'assets/maps/piabeta-casa-bella-fg.png', kind: 'image' },
  { id: 'MAP-003', key: 'map-piabeta-rua-bg', file: 'assets/maps/piabeta-rua-bg.png', kind: 'image' },
  { id: 'MAP-004', key: 'map-piabeta-rua-fg', file: 'assets/maps/piabeta-rua-fg.png', kind: 'image' },

  // Tileset base (16x16, 16 colunas). Placeholder procedural se ausente.
  { id: 'TILE-001', key: 'tiles-base', file: 'assets/tilesets/base-16.png', kind: 'image' },

  // Ilustrações do álbum (320x200)
  { id: 'MEM-001', key: 'memory-pia-01', file: 'assets/cinematics/memory-pia-01.png', kind: 'image' },
  { id: 'MEM-002', key: 'memory-pia-02', file: 'assets/cinematics/memory-pia-02.png', kind: 'image' },
  { id: 'CIN-002', key: 'cena-rota66-mesa', file: 'assets/cinematics/rota66-mesa.png', kind: 'image' },
  { id: 'MEM-004', key: 'memory-pia-04', file: 'assets/cinematics/memory-pia-04.png', kind: 'image' },
  ...['colar', 'oculos', 'celular', 'guardanapo', 'flor'].map(
    (n, i): AssetEntry => ({ id: `ICO-${String(10 + i).padStart(3, '0')}`, key: `icon-${n}`, file: `assets/ui/icon-${n}.png`, kind: 'image' }),
  ),
  { id: 'OBJ-030', key: 'prop-umbrella-stand', file: 'assets/objects/umbrella-stand.png', kind: 'image' },
  { id: 'OBJ-031', key: 'prop-umbrella-stand-empty', file: 'assets/objects/umbrella-stand-empty.png', kind: 'image' },
  { id: 'ICO-001', key: 'icon-rosa', file: 'assets/ui/icon-rosa.png', kind: 'image' },
  { id: 'ICO-002', key: 'icon-vale', file: 'assets/ui/icon-vale.png', kind: 'image' },
  { id: 'ICO-003', key: 'icon-chocolate', file: 'assets/ui/icon-chocolate.png', kind: 'image' },
  ...['tigela', 'acai', 'granola', 'banana', 'morango', 'leite-condensado', 'leite-po', 'pacoca', 'confete', 'kiwi', 'creme-avela', 'colher'].map(
    (n, i): AssetEntry => ({ id: `MG-A${String(i + 1).padStart(2, '0')}`, key: `acai-${n}`, file: `assets/minigames/acai-${n}.png`, kind: 'image' }),
  ),
  ...['verso', 'meli', 'pombo', 'lala', 'acai', 'coracao', 'chocolate', 'novelo'].map(
    (n, i): AssetEntry => ({ id: `MG-C${String(i + 1).padStart(2, '0')}`, key: `carta-${n}`, file: `assets/minigames/carta-${n}.png`, kind: 'image' }),
  ),
  { id: 'MAP-017', key: 'map-piabeta-quintal-bg', file: 'assets/maps/piabeta-quintal-bg.png', kind: 'image' },
  { id: 'MAP-018', key: 'map-piabeta-mexicano-fora-bg', file: 'assets/maps/piabeta-mexicano-fora-bg.png', kind: 'image' },
  { id: 'CIN-015', key: 'memory-dq-04', file: 'assets/cinematics/mexicano-chapeus.png', kind: 'image' },
  { id: 'CIN-014', key: 'cena-pazes', file: 'assets/cinematics/pazes.png', kind: 'image' },
  { id: 'CIN-013', key: 'cena-primeira-noite', file: 'assets/cinematics/primeira-noite.png', kind: 'image' },
  { id: 'ICO-020', key: 'icon-acai', file: 'assets/ui/icon-acai.png', kind: 'image' },
  ...['piranha', 'creme', 'scrunchie', 'pote', 'vela', 'pano', 'pacoca', 'balas', 'chocolate'].map(
    (n, i): AssetEntry => ({ id: `ICO-${String(21 + i).padStart(3, '0')}`, key: `icon-achado-${n}`, file: `assets/ui/icon-achado-${n}.png`, kind: 'image' }),
  ),
  { id: 'MAP-011', key: 'map-duque-rua-bg', file: 'assets/maps/duque-rua-bg.png', kind: 'image' },
  { id: 'MAP-012', key: 'map-duque-acai-bg', file: 'assets/maps/duque-acai-bg.png', kind: 'image' },
  { id: 'MEM-003', key: 'memory-pia-03', file: 'assets/cinematics/memory-pia-03.png', kind: 'image' },

  // UI
  { id: 'UI-001', key: 'ui-title-art', file: 'assets/ui/title-art.png', kind: 'image' },
  { id: 'UI-002', key: 'ui-world-map', file: 'assets/ui/world-map.png', kind: 'image' },
  { id: 'UI-003', key: 'ui-logo', file: 'assets/ui/logo.png', kind: 'image' },
  { id: 'UI-016', key: 'ui-title-full', file: 'assets/ui/title-full.png', kind: 'image' },
  { id: 'UI-009', key: 'ui-bg', file: 'assets/ui/bg.png', kind: 'image' },
  { id: 'UI-004', key: 'ui-panel', file: 'assets/ui/panel.png', kind: 'image' },
  { id: 'UI-005', key: 'ui-dialogue-box', file: 'assets/ui/dialogue-box.png', kind: 'image' },
  { id: 'UI-006', key: 'ui-btn-normal', file: 'assets/ui/btn-normal.png', kind: 'image' },
  { id: 'UI-007', key: 'ui-btn-hover', file: 'assets/ui/btn-hover.png', kind: 'image' },
  { id: 'UI-008', key: 'ui-btn-primary', file: 'assets/ui/btn-primary.png', kind: 'image' },
  ...['album', 'mochila', 'mapa', 'opcoes', 'salvar', 'lua'].map(
    (n, i): AssetEntry => ({ id: `UI-${String(10 + i).padStart(3, '0')}`, key: `ui-icon-${n}`, file: `assets/ui/icon-${n}.png`, kind: 'image' }),
  ),

  // Áudio (opcional)
  { id: 'AUD-001', key: 'music-tema-principal', file: 'assets/audio/music/tema-principal.ogg', kind: 'audio' },
  { id: 'AUD-002', key: 'music-piabeta', file: 'assets/audio/music/piabeta.ogg', kind: 'audio' },
  { id: 'AUD-003', key: 'music-casa', file: 'assets/audio/music/casa.ogg', kind: 'audio' },
];

/** Gera a chave de imagem de cenário de um mapa. */
export const mapLayerKey = (mapId: string, layer: 'bg' | 'fg') => `map-${mapId}-${layer}`;
