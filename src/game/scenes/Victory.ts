import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Victory extends Scene {
    private diamonds: number = 0;
    private time: number = 0;

    constructor() {
        super('Victory');
    }

    init(data: { diamonds?: number; time?: number }) {
        this.diamonds = data?.diamonds ?? 0;
        this.time = data?.time ?? 0;
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        this.add.rectangle(0, 0, width, height, 0x002200).setOrigin(0, 0);

        const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        for (let i = 0; i < 12; i++) {
            const x = rnd(30, width - 30);
            const y = rnd(30, height - 30);
            const d = this.add.image(x, y, 'tile-diamond').setScale(0.5).setAlpha(0.5);
            this.tweens.add({
                targets: d,
                y: y - 30,
                alpha: 0.9,
                scaleX: 0.8,
                scaleY: 0.8,
                duration: 1000 + i * 200,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut',
            });
        }

        this.add.text(cx, height * 0.2, 'VICTOIRE !', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '64px',
            color: '#44FF44',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
        }).setOrigin(0.5);

        const mins = Math.floor(this.time / 60);
        const secs = this.time % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        this.add.text(cx, height * 0.42, `Diamants collectes : ${this.diamonds}`, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#FFFF00',
            align: 'center',
        }).setOrigin(0.5);

        this.add.text(cx, height * 0.53, `Temps restant : ${timeStr}`, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#88FFFF',
            align: 'center',
        }).setOrigin(0.5);

        const btnReplay = this.add.rectangle(cx - 120, height * 0.72, 200, 50, 0x006600)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx - 120, height * 0.72, 'REJOUER', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#FFFFFF',
            align: 'center',
        }).setOrigin(0.5);
        btnReplay.on('pointerdown', () => this.scene.start('Game'));
        btnReplay.on('pointerover', () => btnReplay.setFillColor(0x008800));
        btnReplay.on('pointerout', () => btnReplay.setFillColor(0x006600));

        const btnMenu = this.add.rectangle(cx + 120, height * 0.72, 200, 50, 0x444444)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx + 120, height * 0.72, 'MENU', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#FFFFFF',
            align: 'center',
        }).setOrigin(0.5);
        btnMenu.on('pointerdown', () => this.scene.start('MainMenu'));
        btnMenu.on('pointerover', () => btnMenu.setFillColor(0x666666));
        btnMenu.on('pointerout', () => btnMenu.setFillColor(0x444444));

        EventBus.emit('current-scene-ready', this);
    }
}
