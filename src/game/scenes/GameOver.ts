import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class GameOver extends Scene {
    private reason: string = '';
    private levelNum: number = 1;

    constructor() {
        super('GameOver');
    }

    init(data: { reason?: string; level?: number }) {
        this.reason = data?.reason ?? 'Game Over';
        this.levelNum = data?.level ?? 1;
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        this.add.rectangle(0, 0, width, height, 0x220000).setOrigin(0, 0);

        this.add.text(cx, height * 0.15, 'GAME OVER', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '72px',
            color: '#FF0000',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
        }).setOrigin(0.5);

        this.add.text(cx, height * 0.33, this.reason, {
            fontFamily: 'Arial',
            fontSize: '26px',
            color: '#FFAAAA',
            align: 'center',
        }).setOrigin(0.5);

        this.add.text(cx, height * 0.44, `Niveau ${this.levelNum}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#FF6666',
            align: 'center',
        }).setOrigin(0.5);

        const btnY1 = height * 0.58;
        const btnY2 = height * 0.70;
        const btnY3 = height * 0.82;

        // Button: Retry same level
        const btnRetry = this.add.rectangle(cx, btnY1, 260, 50, 0x880000)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, btnY1, `↩ RECOMMENCER NIVEAU ${this.levelNum}`, {
            fontFamily: 'Arial',
            fontSize: '17px',
            color: '#FFFFFF',
        }).setOrigin(0.5);
        btnRetry.on('pointerdown', () => this.scene.start('Game', { level: this.levelNum }));
        btnRetry.on('pointerover', () => btnRetry.setFillStyle(0xBB0000));
        btnRetry.on('pointerout', () => btnRetry.setFillStyle(0x880000));

        // Button: Choose level
        const btnSelect = this.add.rectangle(cx, btnY2, 260, 50, 0x004466)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, btnY2, '☰ CHOISIR NIVEAU', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFFFFF',
        }).setOrigin(0.5);
        btnSelect.on('pointerdown', () => this.scene.start('LevelSelect'));
        btnSelect.on('pointerover', () => btnSelect.setFillStyle(0x0066AA));
        btnSelect.on('pointerout', () => btnSelect.setFillStyle(0x004466));

        // Button: Menu
        const btnMenu = this.add.rectangle(cx, btnY3, 260, 50, 0x444444)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, btnY3, '⌂ MENU PRINCIPAL', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFFFFF',
        }).setOrigin(0.5);
        btnMenu.on('pointerdown', () => this.scene.start('MainMenu'));
        btnMenu.on('pointerover', () => btnMenu.setFillStyle(0x666666));
        btnMenu.on('pointerout', () => btnMenu.setFillStyle(0x444444));

        this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Game', { level: this.levelNum }));

        EventBus.emit('current-scene-ready', this);
    }
}

