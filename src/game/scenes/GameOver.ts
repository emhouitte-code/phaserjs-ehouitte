import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class GameOver extends Scene {
    private reason: string = '';

    constructor() {
        super('GameOver');
    }

    init(data: { reason?: string }) {
        this.reason = data?.reason ?? 'Game Over';
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        this.add.rectangle(0, 0, width, height, 0x220000).setOrigin(0, 0);

        this.add.text(cx, height * 0.25, 'GAME OVER', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '72px',
            color: '#FF0000',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
        }).setOrigin(0.5);

        this.add.text(cx, height * 0.45, this.reason, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#FFAAAA',
            align: 'center',
        }).setOrigin(0.5);

        const btnRestart = this.add.rectangle(cx - 120, height * 0.65, 200, 50, 0x880000)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx - 120, height * 0.65, 'RECOMMENCER', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#FFFFFF',
            align: 'center',
        }).setOrigin(0.5);
        btnRestart.on('pointerdown', () => this.scene.start('Game'));
        btnRestart.on('pointerover', () => btnRestart.setFillColor(0xBB0000));
        btnRestart.on('pointerout', () => btnRestart.setFillColor(0x880000));

        const btnMenu = this.add.rectangle(cx + 120, height * 0.65, 200, 50, 0x444444)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx + 120, height * 0.65, 'MENU', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#FFFFFF',
            align: 'center',
        }).setOrigin(0.5);
        btnMenu.on('pointerdown', () => this.scene.start('MainMenu'));
        btnMenu.on('pointerover', () => btnMenu.setFillColor(0x666666));
        btnMenu.on('pointerout', () => btnMenu.setFillColor(0x444444));

        this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Game'));

        EventBus.emit('current-scene-ready', this);
    }
}
