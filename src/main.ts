import Phaser from 'phaser';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene, type GameSceneData } from './scenes/GameScene';
import { GameState } from './core/GameState';
import { InputSystem } from './systems/InputSystem';
import { SaveSystem, SettingsStore } from './systems/SaveSystem';
import { AudioSystem } from './systems/AudioSystem';
import { UI } from './ui/UIManager';
import type { SaveData } from './core/types';

SettingsStore.load();
InputSystem.init();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH * RENDER_SCALE,
  height: GAME_HEIGHT * RENDER_SCALE,
  backgroundColor: '#1b1838',
  pixelArt: true,
  roundPixels: true,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { keyboard: false },
  scene: [BootScene, PreloadScene, MenuScene, GameScene],
});

const gameScene = () => game.scene.getScene('Game') as GameScene;

function startGame(data: GameSceneData): void {
  UI.title.close();
  game.scene.stop('Menu');
  game.scene.start('Game', data);
}

UI.init(
  game,
  {
    travel: (r) => gameScene().travelTo(r),
    canTravel: () => game.scene.isActive('Game') && !gameScene().busy,
    quitToTitle: async () => {
      await SaveSystem.autosave();
      AudioSystem.setRain(false);
      game.scene.stop('Game');
      game.scene.start('Menu');
    },
    settingsChanged: () => UI.touch.refresh(),
    toast: (t) => UI.toasts.show(t),
  },
  {
    newGame: () => {
      GameState.reset();
      startGame({ mapId: GameState.data.mapId, spawn: 'start' });
    },
    load: (data: SaveData) => {
      GameState.load(data);
      startGame({ mapId: data.mapId, position: data.position, facing: data.facing });
    },
    openSettings: () => {
      UI.pause.open('config', undefined, ['config']);
    },
  },
);

// Salva ao fechar/ocultar a aba (celular).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && game.scene.isActive('Game')) void SaveSystem.autosave();
});

// Acesso de depuração no console: window.bw
(window as unknown as { bw: unknown }).bw = { game, GameState, SaveSystem };
