import { showLoader } from './ui/screens/TitleFx';
import Phaser from 'phaser';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
// letra das cartas (cursiva, romântica)
import '@fontsource/dancing-script/500.css';
import '@fontsource/dancing-script/700.css';
import '@fontsource/great-vibes/400.css';
import '@fontsource/patrick-hand/400.css';
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
import { initGamepad, setDevice } from '@/systems/Gamepad';
import { initGlyphs } from '@/ui/glyphs';
import { MAPS } from '@/regions';
import { openPadSetup } from '@/ui/screens/PadSetup';

SettingsStore.load();
InputSystem.init();
showLoader();

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
      AudioSystem.setMuffledRain(false);
      game.scene.stop('Game');
      game.scene.start('Menu');
    },
    playScene: (c) => {
      AudioSystem.setRain(false);
      AudioSystem.setMuffledRain(false);
      GameState.load(c.data);
      const data: GameSceneData = c.position ? { mapId: c.mapId, position: c.position, facing: c.facing } : { mapId: c.mapId, spawn: c.spawn };
      if (game.scene.isActive('Game')) gameScene().scene.restart(data);
      else startGame(data);
    },
    settingsChanged: () => UI.touch.refresh(),
    toast: (t) => UI.toasts.show(t),
  },
  {
    newGame: async () => {
      GameState.reset();
      // a carta do Weng abre a história
      UI.title.close();
      await UI.chooseDevice();
      await UI.letter();
      startGame({ mapId: GameState.data.mapId, spawn: 'start' });
    },
    load: (data: SaveData) => {
      GameState.load(data);
      startGame({ mapId: data.mapId, position: data.position, facing: data.facing });
    },
    openSettings: () => {
      UI.pause.open('config', undefined, ['config']);
    },
    openScenes: () => {
      UI.pause.open('cenas', undefined, ['cenas']);
    },
  },
);

// Controle de videogame (PlayStation / Xbox): cada botão aperta a tecla equivalente.
setDevice(SettingsStore.data.device);
// corações de texto viram o coração desenhado do jogo
initGlyphs();
initGamepad(
  () => UI.toasts.show('Controle conectado: ✕ confirma · ◯ volta · □ corre · OPTIONS menu'),
  // controle que o navegador não reconhece (ex.: "estilo PS5" com SELECT / MODE / START): configura uma vez
  () => void openPadSetup(document.getElementById('ui') ?? document.body),
);

// Salva ao fechar/ocultar a aba (celular).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && game.scene.isActive('Game')) void SaveSystem.autosave();
});

// Rede de segurança: se uma imagem .png não existir (virou .webp), tenta o .webp antes de desistir.
window.addEventListener(
  'error',
  (e) => {
    const img = e.target as HTMLImageElement | null;
    if (img?.tagName === 'IMG' && /\.png(\?|$)/.test(img.src) && !img.dataset.webp) {
      img.dataset.webp = '1';
      img.src = img.src.replace(/\.png(\?|$)/, '.webp$1');
    }
  },
  true,
);

// Acesso de depuração no console: window.bw
(window as unknown as { bw: unknown }).bw = { game, GameState, SaveSystem, UI, InputSystem, MAPS };
