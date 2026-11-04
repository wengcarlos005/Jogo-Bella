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

const char = (id: string, key: string, file: string): AssetEntry => ({
  id,
  key,
  file: `assets/${file}`,
  kind: 'spritesheet',
  frameWidth: 32,
  frameHeight: 32,
});

export const ASSETS: AssetEntry[] = [
  // Personagens — walk sheet 4x4 frames de 32x32 (linhas: baixo, esquerda, direita, cima)
  char('CHAR-001', 'bella', 'characters/bella-walk.png'),
  char('CHAR-002', 'weng', 'characters/weng-walk.png'),
  char('NPC-001', 'mae-bella', 'npcs/mae-bella-walk.png'),
  char('NPC-002', 'pai-bella', 'npcs/pai-bella-walk.png'),
  char('NPC-003', 'vizinha', 'npcs/vizinha-walk.png'),

  // Retratos de diálogo (96x96)
  { id: 'PORT-001', key: 'portrait-bella', file: 'assets/portraits/bella-neutral.png', kind: 'image' },
  { id: 'PORT-002', key: 'portrait-weng', file: 'assets/portraits/weng-neutral.png', kind: 'image' },
  { id: 'PORT-003', key: 'portrait-mae-bella', file: 'assets/portraits/mae-bella.png', kind: 'image' },
  { id: 'PORT-004', key: 'portrait-pai-bella', file: 'assets/portraits/pai-bella.png', kind: 'image' },
  { id: 'PORT-005', key: 'portrait-vizinha', file: 'assets/portraits/vizinha.png', kind: 'image' },

  // Cenários pintados (opcionais) — se existirem, substituem os tiles visuais
  { id: 'MAP-001', key: 'map-piabeta-casa-bella-bg', file: 'assets/maps/piabeta-casa-bella-bg.png', kind: 'image' },
  { id: 'MAP-002', key: 'map-piabeta-casa-bella-fg', file: 'assets/maps/piabeta-casa-bella-fg.png', kind: 'image' },
  { id: 'MAP-003', key: 'map-piabeta-rua-bg', file: 'assets/maps/piabeta-rua-bg.png', kind: 'image' },
  { id: 'MAP-004', key: 'map-piabeta-rua-fg', file: 'assets/maps/piabeta-rua-fg.png', kind: 'image' },

  // Tileset base (16x16, 16 colunas). Placeholder procedural se ausente.
  { id: 'TILE-001', key: 'tiles-base', file: 'assets/tilesets/base-16.png', kind: 'image' },

  // Ilustrações do álbum (320x200)
  { id: 'MEM-001', key: 'memory-pia-01', file: 'assets/cinematics/memory-pia-01.png', kind: 'image' },
  { id: 'MEM-002', key: 'memory-pia-02', file: 'assets/cinematics/memory-pia-02.png', kind: 'image' },
  { id: 'MEM-003', key: 'memory-pia-03', file: 'assets/cinematics/memory-pia-03.png', kind: 'image' },

  // UI
  { id: 'UI-001', key: 'ui-title-art', file: 'assets/ui/title-art.png', kind: 'image' },
  { id: 'UI-002', key: 'ui-world-map', file: 'assets/ui/world-map.png', kind: 'image' },

  // Áudio (opcional)
  { id: 'AUD-001', key: 'music-tema-principal', file: 'assets/audio/music/tema-principal.ogg', kind: 'audio' },
  { id: 'AUD-002', key: 'music-piabeta', file: 'assets/audio/music/piabeta.ogg', kind: 'audio' },
  { id: 'AUD-003', key: 'music-casa', file: 'assets/audio/music/casa.ogg', kind: 'audio' },
];

/** Gera a chave de imagem de cenário de um mapa. */
export const mapLayerKey = (mapId: string, layer: 'bg' | 'fg') => `map-${mapId}-${layer}`;
