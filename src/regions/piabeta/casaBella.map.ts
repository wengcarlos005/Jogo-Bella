import { T } from '@/world/tiles';
import type { MapDef } from '@/world/MapTypes';
import { GameState } from '@/core/GameState';
import { QuestSystem } from '@/systems/QuestSystem';
import { casaScripts } from './casaBella.scripts';

const Q = 'pia-m1';
const objDone = (o: string) => QuestSystem.isObjectiveDone(Q, o);
const objActive = (o: string) => QuestSystem.isActive(Q) && !objDone(o);

/** Prólogo — casa da Bella em Piabetá (interior). */
export const casaBellaMap: MapDef = {
  id: 'piabeta-casa-bella',
  region: 'piabeta',
  name: 'Casa da Bella',
  indoor: true,
  music: 'casa',
  background: '#1b1838',
  legend: { '#': T.WALL_TOP, '=': T.WALL_FACE, '.': T.WOOD, k: T.KITCHEN, r: T.RUG },
  ground: [
    '######################',
    '#========#===========#',
    '#........#kkkkkkkkkkk#',
    '#........#kkkkkkkkkkk#',
    '#........#kkkkkkkkkkk#',
    '#........#kkkkkkkkkkk#',
    '#........#kkkkkkkkkkk#',
    '###..######kk#########',
    '#....................#',
    '#....................#',
    '#.....rrrrrr.........#',
    '#.....rrrrrr.........#',
    '#....................#',
    '#....................#',
    '##########..##########',
  ],
  props: [
    // Quarto
    { key: 'prop-vanity', tx: 1, ty: 2, interact: 'colar', label: 'Penteadeira', markerIf: () => objActive('colar') },
    { key: 'prop-mirror', tx: 3, ty: 2, interact: 'espelho', label: 'Espelho', markerIf: () => objActive('espelho') && objDone('roupa') && objDone('oculos') && objDone('colar') },
    { key: 'prop-desk', tx: 4, ty: 2, interact: 'oculos', label: 'Escrivaninha', markerIf: () => objActive('oculos') },
    { key: 'prop-wardrobe', tx: 7, ty: 2, interact: 'guarda-roupa', label: 'Guarda-roupa', markerIf: () => objActive('roupa') && objDone('celular') },
    { key: 'prop-bed', tx: 1, ty: 5, interact: 'cama', label: 'Cama', block: [2, 2, 28, 28], markerIf: () => objActive('celular') },
    { key: 'prop-plant', tx: 8, ty: 6 },
    // Cozinha
    { key: 'prop-fridge', tx: 10, ty: 2, interact: 'geladeira', label: 'Geladeira' },
    { key: 'prop-stove', tx: 11, ty: 2, interact: 'fogao', label: 'Fogão' },
    { key: 'prop-table', tx: 15, ty: 4, block: [1, 4, 30, 14] },
    { key: 'prop-plant', tx: 20, ty: 2 },
    // Sala
    { key: 'prop-sofa', tx: 6, ty: 9, block: [0, 2, 48, 12] },
    { key: 'prop-tv', tx: 7, ty: 13, interact: 'tv', label: 'TV' },
    { key: 'prop-bookshelf', tx: 17, ty: 9, interact: 'estante', label: 'Estante' },
    { key: 'prop-plant', tx: 1, ty: 8 },
    { key: 'prop-plant', tx: 20, ty: 13 },
    { key: 'prop-door-mat', tx: 10, ty: 13, flat: true, block: false },
    { key: 'prop-door-mat', tx: 11, ty: 13, flat: true, block: false },
  ],
  npcs: [
    { id: 'mae-bella', sprite: 'mae-bella', tx: 7.5, ty: 10, facing: 'down', interact: 'mae', markerIf: () => objActive('mae') && GameState.is('weng-entrou') },
    { id: 'pai-bella', sprite: 'pai-bella', tx: 16, ty: 5, facing: 'up', interact: 'pai', markerIf: () => objActive('pai') && GameState.is('weng-entrou') },
    {
      id: 'weng',
      sprite: 'weng',
      tx: 10.5,
      ty: 12,
      facing: 'up',
      interact: 'weng',
      visibleIf: () => GameState.is('weng-entrou') && !objDone('sair'),
    },
  ],
  spawns: {
    start: { tx: 4, ty: 4, facing: 'down' },
    'from-rua': { tx: 10.5, ty: 12, facing: 'up' },
  },
  exits: [
    {
      rect: { x: 10, y: 14, w: 2, h: 1 },
      toMap: 'piabeta-rua',
      toSpawn: 'from-casa',
      sfx: 'door',
      blockedIf: () => {
        if (!QuestSystem.isActive(Q)) return false;
        if (!GameState.is('weng-entrou')) return 'Ainda não... o Weng tá vindo te buscar!';
        if (!objDone('mae') || !objDone('pai')) return 'Antes de sair, apresente o Weng para seus pais.';
        return false;
      },
    },
  ],
  triggers: [
    {
      id: 'chegou-sala',
      rect: { x: 1, y: 8, w: 20, h: 1 },
      script: 'chegou-sala',
      once: true,
      enabledIf: () => objDone('espelho'),
    },
    {
      id: 'porta',
      rect: { x: 8, y: 12, w: 6, h: 2 },
      script: 'atender-porta',
      once: true,
      enabledIf: () => GameState.is('campainha'),
    },
    {
      id: 'sair-cedo',
      rect: { x: 3, y: 7, w: 2, h: 1 },
      script: 'sair-quarto-cedo',
      enabledIf: () => QuestSystem.isActive(Q) && !objDone('espelho'),
    },
  ],
  scripts: casaScripts,
  onEnter: 'entrar',
};
