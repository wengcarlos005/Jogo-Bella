import type { RegionId } from '@/core/types';

export interface RegionMeta {
  id: RegionId;
  name: string;
  chapter: string;
  year: string;
  subtitle: string;
  /** Mapa onde a viagem chega. null = região ainda não implementada. */
  entryMap: string | null;
  entrySpawn: string;
  /** Posição no mapa-múndi (0..1). */
  worldPos: { x: number; y: number };
}

/** Ordem cronológica obrigatória. Não reordene. */
export const REGIONS: RegionMeta[] = [
  { id: 'piabeta', name: 'Piabetá', chapter: 'Prólogo', year: 'O começo', subtitle: 'Onde tudo começou', entryMap: 'piabeta-rua', entrySpawn: 'from-casa', worldPos: { x: 0.36, y: 0.30 } },
  { id: 'duque-de-caxias', name: 'Duque de Caxias', chapter: 'Capítulo 2', year: 'Ano 1', subtitle: 'Nosso cantinho', entryMap: 'duque-apto', entrySpawn: 'porta', worldPos: { x: 0.30, y: 0.45 } },
  { id: 'petropolis', name: 'Petrópolis', chapter: 'Capítulo 3', year: 'Ano 1', subtitle: 'O aniversário dela', entryMap: 'pt-quitandinha', entrySpawn: 'entrada', worldPos: { x: 0.40, y: 0.14 } },
  { id: 'araruama', name: 'Araruama', chapter: 'Capítulo 4', year: 'Ano 1', subtitle: 'Ano-novo em família', entryMap: 'ar-cobertura', entrySpawn: 'porta', worldPos: { x: 0.74, y: 0.52 } },
  { id: 'rio-das-ostras', name: 'Rio das Ostras', chapter: 'Capítulo 5', year: 'Ano 1', subtitle: 'Um dia de praia', entryMap: 'ro-praia', entrySpawn: 'chegada', worldPos: { x: 0.90, y: 0.34 } },
  { id: 'niteroi', name: 'Niterói', chapter: 'Capítulo 6', year: 'Ano 1', subtitle: 'Do outro lado da baía', entryMap: null, entrySpawn: 'start', worldPos: { x: 0.52, y: 0.64 } },
  { id: 'lapa', name: 'Lapa', chapter: 'Capítulo 7', year: 'Ano 1', subtitle: 'Um aniversário inesquecível', entryMap: null, entrySpawn: 'start', worldPos: { x: 0.40, y: 0.70 } },
  { id: 'cabo-frio', name: 'Cabo Frio', chapter: 'Capítulo 8', year: 'Ano 1', subtitle: 'Mais um ano-novo', entryMap: null, entrySpawn: 'start', worldPos: { x: 0.92, y: 0.62 } },
  { id: 'botafogo', name: 'Botafogo', chapter: 'Capítulo 9', year: 'Ano 2', subtitle: 'Com o Pão de Açúcar ao fundo', entryMap: null, entrySpawn: 'start', worldPos: { x: 0.46, y: 0.80 } },
  { id: 'seropedica', name: 'Seropédica', chapter: 'Capítulo 10', year: 'Ano 2', subtitle: 'A formatura', entryMap: null, entrySpawn: 'start', worldPos: { x: 0.12, y: 0.62 } },
  { id: 'curitiba', name: 'Curitiba', chapter: 'Capítulo 11', year: 'Ano 3', subtitle: 'A melhor viagem', entryMap: null, entrySpawn: 'start', worldPos: { x: 0.10, y: 0.90 } },
];

export function regionMeta(id: RegionId): RegionMeta {
  const r = REGIONS.find((r) => r.id === id);
  if (!r) throw new Error(`Região desconhecida: ${id}`);
  return r;
}
