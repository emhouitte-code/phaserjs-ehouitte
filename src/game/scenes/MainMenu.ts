import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { ProgressManager } from '../services/ProgressManager';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0);

        const infoText = this.add.text(cx, height * 0.12, 'INFOGRAMES', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '42px',
            color: '#DDAA00',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center',
        }).setOrigin(0.5);

        const barY = infoText.y + infoText.height / 2 + 6;
        this.add.rectangle(cx - 120, barY, 240, 5, 0xDDAA00).setOrigin(0, 0);
        this.add.rectangle(cx - 120, barY + 7, 240, 5, 0xDDAA00).setOrigin(0, 0);

        this.add.text(cx, height * 0.29, 'PRESENTE', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#CCCCCC',
            letterSpacing: 6,
        }).setOrigin(0.5);

        this.add.text(cx, height * 0.40, 'LA  MINE', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '58px',
            color: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 3,
            letterSpacing: 4,
        }).setOrigin(0.5);

        this.add.text(cx, height * 0.53, 'AUX  DIAMANTS', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '58px',
            color: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 3,
            letterSpacing: 4,
        }).setOrigin(0.5);

        // Authors box
        this.add.rectangle(cx - 80, height * 0.65, 160, 50, 0xDDAA00).setOrigin(0, 0);
        this.add.rectangle(cx - 78, height * 0.65 + 2, 156, 46, 0xBB8800).setOrigin(0, 0);
        this.add.text(cx, height * 0.65 + 6, 'Auteurs\nP.Bruneel  C.Lemaire', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#FF4400',
            align: 'center',
        }).setOrigin(0.5, 0);

        this.add.text(cx, height * 0.65 + 58, '© INFOGRAMES  1986', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '13px',
            color: '#00CC44',
        }).setOrigin(0.5);

        // Animated diamonds
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * (width - 80)) + 40;
            const y = Math.floor(Math.random() * (height * 0.6 - 60)) + 30;
            const diamond = this.add.image(x, y, 'tile-diamond').setScale(0.5).setAlpha(0.25);
            this.tweens.add({
                targets: diamond,
                y: y - 15,
                alpha: 0.55,
                duration: 1200 + i * 400,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut',
            });
        }

        // === THREE MENU BUTTONS ===
        const lastLevel = ProgressManager.getLastLevel();
        const maxLevel = ProgressManager.getMaxLevel();

        const btnY1 = height * 0.775;
        const btnY2 = height * 0.865;
        const btnY3 = height * 0.950;
        const btnW = 280, btnH = 50;

        // Button 1: JOUER (start from level 1)
        const btnPlay = this.add.rectangle(cx, btnY1, btnW, btnH, 0x006600)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, btnY1, '▶  JOUER  (Niveau 1)', {
            fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#FFFFFF',
        }).setOrigin(0.5);
        btnPlay.on('pointerover', () => btnPlay.setFillStyle(0x009900));
        btnPlay.on('pointerout', () => btnPlay.setFillStyle(0x006600));
        btnPlay.on('pointerdown', () => this.scene.start('Game', { level: 1 }));

        // Button 2: CONTINUER (resume last level)
        const continueLabel = maxLevel > 1
            ? `↩  CONTINUER  (Niveau ${lastLevel})`
            : `↩  CONTINUER  (Niveau 1)`;
        const btnContinue = this.add.rectangle(cx, btnY2, btnW, btnH, 0x004488)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, btnY2, continueLabel, {
            fontFamily: 'Arial Black, Arial', fontSize: '16px', color: '#FFFFFF',
        }).setOrigin(0.5);
        btnContinue.on('pointerover', () => btnContinue.setFillStyle(0x0066BB));
        btnContinue.on('pointerout', () => btnContinue.setFillStyle(0x004488));
        btnContinue.on('pointerdown', () => this.scene.start('Game', { level: lastLevel }));

        // Button 3: CHOISIR NIVEAU
        const btnSelect = this.add.rectangle(cx, btnY3, btnW, btnH, 0x443300)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, btnY3, '☰  CHOISIR NIVEAU', {
            fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#FFFF00',
        }).setOrigin(0.5);
        btnSelect.on('pointerover', () => btnSelect.setFillStyle(0x665500));
        btnSelect.on('pointerout', () => btnSelect.setFillStyle(0x443300));
        btnSelect.on('pointerdown', () => this.scene.start('LevelSelect'));

        // Keep space/enter key for quick start
        this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Game', { level: lastLevel }));
        this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Game', { level: lastLevel }));

        EventBus.emit('current-scene-ready', this);
    }
}

