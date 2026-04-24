import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Victory extends Scene {
    private diamonds: number = 0;
    private timeLeft: number = 0;
    private levelNum: number = 1;

    constructor() {
        super('Victory');
    }

    init(data: { diamonds?: number; timeLeft?: number; level?: number }) {
        this.diamonds = data?.diamonds ?? 0;
        this.timeLeft = data?.timeLeft ?? 0;
        this.levelNum = data?.level ?? 1;
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        this.add.rectangle(0, 0, width, height, 0x002200).setOrigin(0, 0);

        // Animated diamonds background
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

        this.add.text(cx, height * 0.12, `NIVEAU ${this.levelNum} TERMINE !`, {
            fontFamily: 'Arial Black, Arial',
            fontSize: '48px',
            color: '#44FF44',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
        }).setOrigin(0.5);

        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        this.add.text(cx, height * 0.32, `Diamants : ${this.diamonds}`, {
            fontFamily: 'Arial', fontSize: '26px', color: '#FFFF00',
        }).setOrigin(0.5);
        this.add.text(cx, height * 0.42, `Temps restant : ${timeStr}`, {
            fontFamily: 'Arial', fontSize: '26px', color: '#88FFFF',
        }).setOrigin(0.5);

        const isLastLevel = this.levelNum >= 16;
        const btnY1 = height * 0.57;
        const btnY2 = height * 0.69;
        const btnY3 = height * 0.81;

        // Button: Next level (or congratulations if last level)
        const btn1Color = isLastLevel ? 0x886600 : 0x006600;
        const btn1Label = isLastLevel ? '🏆 TERMINÉ ! MENU' : `▶ NIVEAU ${this.levelNum + 1}`;
        const btnNext = this.add.rectangle(cx, btnY1, 260, 50, btn1Color)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, btnY1, btn1Label, {
            fontFamily: 'Arial', fontSize: '18px', color: '#FFFFFF',
        }).setOrigin(0.5);
        const btn1Hover = isLastLevel ? 0xBB9900 : 0x008800;
        const btn1Normal = btn1Color;
        btnNext.on('pointerover', () => btnNext.setFillStyle(btn1Hover));
        btnNext.on('pointerout', () => btnNext.setFillStyle(btn1Normal));
        btnNext.on('pointerdown', () => {
            if (isLastLevel) {
                this.scene.start('MainMenu');
            } else {
                this.scene.start('Game', { level: this.levelNum + 1 });
            }
        });

        // Button: Choose level
        const btnSelect = this.add.rectangle(cx, btnY2, 260, 50, 0x004466)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, btnY2, '☰ CHOISIR NIVEAU', {
            fontFamily: 'Arial', fontSize: '18px', color: '#FFFFFF',
        }).setOrigin(0.5);
        btnSelect.on('pointerdown', () => this.scene.start('LevelSelect'));
        btnSelect.on('pointerover', () => btnSelect.setFillStyle(0x0066AA));
        btnSelect.on('pointerout', () => btnSelect.setFillStyle(0x004466));

        // Button: Menu
        const btnMenu = this.add.rectangle(cx, btnY3, 260, 50, 0x444444)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, btnY3, '⌂ MENU PRINCIPAL', {
            fontFamily: 'Arial', fontSize: '18px', color: '#FFFFFF',
        }).setOrigin(0.5);
        btnMenu.on('pointerdown', () => this.scene.start('MainMenu'));
        btnMenu.on('pointerover', () => btnMenu.setFillStyle(0x666666));
        btnMenu.on('pointerout', () => btnMenu.setFillStyle(0x444444));

        EventBus.emit('current-scene-ready', this);
    }
}

