import { AUTO, Game } from 'phaser';
import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { Victory } from './scenes/Victory';
import { LevelSelect } from './scenes/LevelSelect';

// Phaser.Scale.FIT = 3, Phaser.Scale.CENTER_BOTH = 1
const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    scale: {
        mode: 3,       // Phaser.Scale.FIT
        autoCenter: 1, // Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver,
        Victory,
        LevelSelect,
    ],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
