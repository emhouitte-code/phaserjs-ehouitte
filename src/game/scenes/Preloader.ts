import { Scene } from 'phaser';
import { SpriteFactory } from '../sprites/SpriteFactory';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    create() {
        try {
            SpriteFactory.generateAll(this);
        } catch (e) {
            console.error('[Preloader] SpriteFactory failed:', e);
        }
        this.scene.start('MainMenu');
    }
}
