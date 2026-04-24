import { Scene } from 'phaser';
import { ProgressManager } from '../services/ProgressManager';
import { EventBus } from '../EventBus';

export class LevelSelect extends Scene {
    constructor() {
        super('LevelSelect');
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const maxLevel = ProgressManager.getMaxLevel();
        const lastLevel = ProgressManager.getLastLevel();

        this.add.rectangle(0, 0, width, height, 0x000022).setOrigin(0, 0);

        this.add.text(cx, 30, 'CHOISIR NIVEAU', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '32px',
            color: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // 4×4 grid of level buttons
        const btnW = 200, btnH = 78, gap = 14;
        const cols = 4;
        const totalW = cols * btnW + (cols - 1) * gap;
        const startX = cx - totalW / 2;
        const startY = 90;

        for (let i = 0; i < 16; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const bx = startX + col * (btnW + gap);
            const by = startY + row * (btnH + gap);
            const levelNum = i + 1;
            const unlocked = levelNum <= maxLevel;
            const isLast = levelNum === lastLevel;

            const bgColor = isLast ? 0x005500 : unlocked ? 0x003366 : 0x1a1a2e;
            const btn = this.add.rectangle(bx + btnW / 2, by + btnH / 2, btnW, btnH, bgColor)
                .setInteractive({ useHandCursor: unlocked });

            const textColor = unlocked ? '#FFFFFF' : '#444466';
            this.add.text(bx + btnW / 2, by + 18, `NIVEAU ${levelNum}`, {
                fontFamily: 'Arial Black, Arial',
                fontSize: '15px',
                color: textColor,
            }).setOrigin(0.5, 0);

            if (unlocked) {
                const subLabel = isLast ? '↩ REPRENDRE' : '▶ JOUER';
                const subColor = isLast ? '#00FF88' : '#00CCFF';
                this.add.text(bx + btnW / 2, by + 44, subLabel, {
                    fontFamily: 'Arial',
                    fontSize: '13px',
                    color: subColor,
                }).setOrigin(0.5, 0);

                const normalColor = isLast ? 0x005500 : 0x003366;
                const hoverColor = isLast ? 0x007700 : 0x0055AA;
                btn.on('pointerover', () => btn.setFillStyle(hoverColor));
                btn.on('pointerout', () => btn.setFillStyle(normalColor));
                btn.on('pointerdown', () => {
                    this.scene.start('Game', { level: levelNum });
                });
            } else {
                this.add.text(bx + btnW / 2, by + 44, '🔒', {
                    fontFamily: 'Arial',
                    fontSize: '20px',
                    color: '#333355',
                }).setOrigin(0.5, 0);
            }
        }

        // Info line
        this.add.text(cx, startY + 4 * (btnH + gap) + 10, `Niveaux débloqués : ${maxLevel} / 16`, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#8888AA',
        }).setOrigin(0.5, 0);

        // Back button
        const backY = height - 48;
        const backBtn = this.add.rectangle(cx, backY, 220, 44, 0x332200)
            .setInteractive({ useHandCursor: true });
        this.add.text(cx, backY, '◀ RETOUR AU MENU', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '16px',
            color: '#FFAA00',
        }).setOrigin(0.5);
        backBtn.on('pointerover', () => backBtn.setFillStyle(0x554400));
        backBtn.on('pointerout', () => backBtn.setFillStyle(0x332200));
        backBtn.on('pointerdown', () => this.scene.start('MainMenu'));

        this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MainMenu'));

        EventBus.emit('current-scene-ready', this);
    }
}
