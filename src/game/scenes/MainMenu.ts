import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        // Fond noir pur (fidèle image 01)
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0);

        // Logo INFOGRAMES — texte doré avec barre horizontale (fidèle image 01)
        const infoText = this.add.text(cx, height * 0.18, 'INFOGRAMES', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '42px',
            color: '#DDAA00',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center',
        }).setOrigin(0.5);

        // Barre horizontale dorée sous INFOGRAMES
        const barY = infoText.y + infoText.height / 2 + 6;
        this.add.rectangle(cx - 120, barY, 240, 5, 0xDDAA00).setOrigin(0, 0);
        this.add.rectangle(cx - 120, barY + 7, 240, 5, 0xDDAA00).setOrigin(0, 0);

        // "PRESENTE"
        this.add.text(cx, height * 0.36, 'PRESENTE', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#CCCCCC',
            letterSpacing: 6,
        }).setOrigin(0.5);

        // "LA MINE" en grand jaune (fidèle image 01)
        this.add.text(cx, height * 0.50, 'LA  MINE', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '64px',
            color: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            letterSpacing: 4,
        }).setOrigin(0.5);

        // "AUX DIAMANTS"
        this.add.text(cx, height * 0.64, 'AUX  DIAMANTS', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '64px',
            color: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            letterSpacing: 4,
        }).setOrigin(0.5);

        // Auteurs (fidèle image 02)
        const authBox = this.add.rectangle(cx - 80, height * 0.77, 160, 50, 0xDDAA00).setOrigin(0, 0);
        this.add.rectangle(cx - 78, height * 0.77 + 2, 156, 46, 0xBB8800).setOrigin(0, 0);
        this.add.text(cx, height * 0.77 + 6, 'Auteurs\nP.Bruneel  C.Lemaire', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#FF4400',
            align: 'center',
        }).setOrigin(0.5, 0);

        // Instruction clignotante (en rouge/rose comme image 02)
        const instruction = this.add.text(cx, height * 0.91, 'APPUYEZ SUR LA BARRE', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '20px',
            color: '#FF4488',
            align: 'center',
        }).setOrigin(0.5);

        this.tweens.add({
            targets: instruction,
            alpha: 0.1,
            duration: 500,
            repeat: -1,
            yoyo: true,
        });

        // Copyright en vert (fidèle image 02)
        this.add.text(cx, height * 0.91 - 28, '© INFOGRAMES  1986', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '14px',
            color: '#00CC44',
            align: 'center',
        }).setOrigin(0.5);

        // Quelques diamants décoratifs animés
        const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        for (let i = 0; i < 5; i++) {
            const x = rnd(40, width - 40);
            const y = rnd(height * 0.1, height * 0.9);
            const diamond = this.add.image(x, y, 'tile-diamond').setScale(0.5).setAlpha(0.3);
            this.tweens.add({
                targets: diamond,
                y: y - 15,
                alpha: 0.6,
                duration: 1200 + i * 400,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut',
            });
        }

        this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
        this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
        this.input.once('pointerdown', () => this.startGame());

        EventBus.emit('current-scene-ready', this);
    }

    private startGame(): void {
        this.scene.start('Game');
    }
}
