import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { LevelManager } from '../services/LevelManager';
import { PhysicsEngine } from '../engine/PhysicsEngine';
import { EnemyAI, EnemyState } from '../engine/EnemyAI';
import { PlayerController } from '../engine/PlayerController';
import { SoundManager } from '../audio/SoundManager';
import { generateLevel } from '../levels/LevelGenerator';
import { ProgressManager } from '../services/ProgressManager';

export class Game extends Scene {
    private levelManager!: LevelManager;
    private physicsEngine!: PhysicsEngine;
    private enemyAI!: EnemyAI;
    private playerController!: PlayerController;
    private soundManager!: SoundManager;

    private grid: string[][] = [];
    private playerX: number = 0;
    private playerY: number = 0;
    private enemies: EnemyState[] = [];
    private exitX: number = 0;
    private exitY: number = 0;
    private exitOpen: boolean = false;

    private diamondsCollected: number = 0;
    private diamondQuota: number = 10;
    private timeRemaining: number = 300;
    private gameRunning: boolean = false;
    private currentLevel: number = 1;

    private hudDiamonds!: Phaser.GameObjects.Text;
    private hudTimer!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    init(data: { level?: number }) {
        this.currentLevel = data?.level ?? 1;
    }

    create() {
        const levelData = generateLevel(this.currentLevel);
        this.diamondQuota = levelData.diamondQuota;
        this.timeRemaining = levelData.timeLimit;
        this.diamondsCollected = 0;
        this.exitOpen = false;
        this.gameRunning = true;

        this.grid = levelData.grid.map(row => [...row]);

        this.enemies = [];
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const cell = this.grid[y][x];
                if (cell === 'P') { this.playerX = x; this.playerY = y; }
                else if (cell === 'E') this.enemies.push({ x, y, type: 'E', dir: 1, id: `e-${x}-${y}` });
                else if (cell === 'F') this.enemies.push({ x, y, type: 'F', dir: 1, id: `f-${x}-${y}` });
                else if (cell === 'X') { this.exitX = x; this.exitY = y; }
            }
        }

        this.soundManager = new SoundManager();
        this.physicsEngine = new PhysicsEngine();
        this.enemyAI = new EnemyAI();
        this.playerController = new PlayerController();
        this.levelManager = new LevelManager(this, levelData);
        this.levelManager.buildFullDisplay(this.grid);

        const worldWidth = levelData.width * levelData.tileSize;
        const worldHeight = levelData.height * levelData.tileSize;
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBackgroundColor(0x000000);
        const playerSprite = this.levelManager.getPlayerSprite();
        if (playerSprite) {
            this.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
        }

        // === HUD EN BAS — style fidèle à l'image de référence MO5 ===
        const sw = this.scale.width;
        const sh = this.scale.height;
        const hudY = sh - 64;
        const hudH = 64;

        this.add.rectangle(0, hudY, sw, hudH, 0x000000)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(10);

        // Bloc jaune gauche
        this.add.rectangle(0, hudY, 130, hudH, 0xBB8800)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(11);
        this.add.rectangle(2, hudY + 2, 126, hudH - 4, 0xDDAA00)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(11);
        this.add.text(65, hudY + 10, 'La mine\naux\ndiamants', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '11px',
            color: '#FFFF00',
            align: 'center',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(12);

        // Séparateurs dorés
        this.add.rectangle(130, hudY, 3, hudH, 0xBB8800).setOrigin(0, 0).setScrollFactor(0).setDepth(11);
        this.add.rectangle(sw - 130, hudY, 3, hudH, 0xBB8800).setOrigin(0, 0).setScrollFactor(0).setDepth(11);

        // Bloc jaune droit — niveau + diamants
        this.add.rectangle(sw - 130, hudY, 130, hudH, 0xBB8800)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(11);
        this.add.rectangle(sw - 128, hudY + 2, 126, hudH - 4, 0xDDAA00)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(11);
        this.add.text(sw - 65, hudY + 6, `Niveau ${this.currentLevel}`, {
            fontFamily: 'Arial Black, Arial', fontSize: '13px', color: '#FFFF00',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(12);

        // Étiquettes centrales
        this.add.text(200, hudY + 6, 'Points', {
            fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#FFFFFF',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(12);
        this.add.text(sw / 2, hudY + 6, 'Temps', {
            fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#FFFFFF',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(12);
        this.add.text(sw - 230, hudY + 6, 'Diamants', {
            fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#FFFFFF',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(12);

        // Score (fixe)
        this.add.text(200, hudY + 30, '000000', {
            fontFamily: 'Arial Black, Arial', fontSize: '16px', color: '#00DDDD',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(12);

        // Timer dynamique
        this.hudTimer = this.add.text(sw / 2, hudY + 30, '5:00', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '20px',
            color: '#00DDDD',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(12);

        // Compteur diamants
        this.hudDiamonds = this.add.text(sw - 230, hudY + 30, `◆ 0/${this.diamondQuota}`, {
            fontFamily: 'Arial Black, Arial',
            fontSize: '16px',
            color: '#FFFF00',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(12);

        this.input.keyboard?.on('keydown-LEFT', () => this.handleInput('left'));
        this.input.keyboard?.on('keydown-RIGHT', () => this.handleInput('right'));
        this.input.keyboard?.on('keydown-UP', () => this.handleInput('up'));
        this.input.keyboard?.on('keydown-DOWN', () => this.handleInput('down'));

        this.time.addEvent({ delay: 200, callback: this.runPhysics, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 600, callback: this.runEnemyAI, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 1000, callback: this.decrementTimer, callbackScope: this, loop: true });

        EventBus.emit('current-scene-ready', this);
    }

    private handleInput(dir: 'left' | 'right' | 'up' | 'down'): void {
        if (!this.gameRunning) return;

        const result = this.playerController.move(this.grid, this.playerX, this.playerY, dir);

        if (result.died) {
            this.die('Touche par un ennemi !');
            return;
        }

        if (result.moved) {
            this.playerX = result.newX;
            this.playerY = result.newY;

            if (result.collectedDiamond) {
                this.diamondsCollected++;
                this.soundManager.playDiamond();
                this.updateHUD();
                if (this.diamondsCollected >= this.diamondQuota && !this.exitOpen) {
                    this.openExit();
                }
            }

            if (result.pushedRock) {
                this.soundManager.playRock();
            }

            if (result.reachedExit) {
                this.win();
                return;
            }

            this.levelManager.updateCells(this.grid, result.changedCells);

            const ps = this.levelManager.getPlayerSprite();
            if (ps) {
                this.cameras.main.startFollow(ps, true, 0.1, 0.1);
            }
        }
    }

    private runPhysics(): void {
        if (!this.gameRunning) return;

        const result = this.physicsEngine.tick(this.grid, { x: this.playerX, y: this.playerY });

        if (result.changedCells.length > 0) {
            this.levelManager.updateCells(this.grid, result.changedCells);
        }

        if (result.playerCrushed) {
            this.die('Ecrase par un rocher !');
            return;
        }

        for (const killed of result.enemiesKilled) {
            this.enemies = this.enemies.filter(e => !(e.x === killed.x && e.y === killed.y));
            this.showExplosion(killed.x, killed.y);
            this.soundManager.playExplosion();
        }
    }

    private runEnemyAI(): void {
        if (!this.gameRunning) return;

        const result = this.enemyAI.tick(this.grid, this.enemies, { x: this.playerX, y: this.playerY });
        this.enemies = result.enemies;

        if (result.changedCells.length > 0) {
            this.levelManager.updateCells(this.grid, result.changedCells);
        }

        if (result.playerKilled) {
            this.die('Capture par un ennemi !');
        }
    }

    private decrementTimer(): void {
        if (!this.gameRunning) return;
        this.timeRemaining = Math.max(0, this.timeRemaining - 1);
        this.updateHUD();

        if (this.timeRemaining <= 30 && this.timeRemaining % 2 === 0) {
            this.soundManager.playTimerWarning();
        }

        if (this.timeRemaining <= 0) {
            this.die('Temps ecoule !');
        }
    }

    private updateHUD(): void {
        const mins = Math.floor(this.timeRemaining / 60);
        const secs = this.timeRemaining % 60;
        this.hudTimer.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
        this.hudDiamonds.setText(`◆ ${this.diamondsCollected}/${this.diamondQuota}`);

        if (this.timeRemaining <= 30) {
            this.hudTimer.setColor('#FF2200');
            this.hudTimer.setAlpha(this.timeRemaining % 2 === 0 ? 1 : 0.4);
        } else {
            this.hudTimer.setColor('#00DDDD');
            this.hudTimer.setAlpha(1);
        }
    }

    private openExit(): void {
        this.exitOpen = true;
        this.grid[this.exitY][this.exitX] = 'O';
        this.levelManager.updateCells(this.grid, [[this.exitY, this.exitX]]);
        this.soundManager.playExitOpen();

        const exitSprite = this.levelManager.getSprite(this.exitX, this.exitY);
        if (exitSprite) {
            this.tweens.add({
                targets: exitSprite,
                alpha: 0.3,
                duration: 300,
                repeat: 4,
                yoyo: true,
                onComplete: () => exitSprite.setAlpha(1),
            });
        }
    }

    private showExplosion(gridX: number, gridY: number): void {
        const px = this.levelManager.getWorldX(gridX);
        const py = this.levelManager.getWorldY(gridY);
        const gfx = this.add.graphics();
        gfx.fillStyle(0xFF8800, 0.9);
        gfx.fillCircle(px, py, 16);
        gfx.setDepth(8);
        this.tweens.add({
            targets: gfx,
            alpha: 0,
            scaleX: 4,
            scaleY: 4,
            duration: 500,
            ease: 'Power2Out',
            onComplete: () => gfx.destroy(),
        });
    }

    private die(reason: string): void {
        if (!this.gameRunning) return;
        this.gameRunning = false;
        ProgressManager.setLastLevel(this.currentLevel);
        this.soundManager.playDeath();
        this.cameras.main.shake(300, 0.01);
        this.time.delayedCall(600, () => {
            this.scene.start('GameOver', { reason, level: this.currentLevel });
        });
    }

    private win(): void {
        if (!this.gameRunning) return;
        this.gameRunning = false;
        // Unlock next level
        ProgressManager.setMaxLevel(this.currentLevel + 1);
        this.time.delayedCall(300, () => {
            this.scene.start('Victory', {
                diamonds: this.diamondsCollected,
                timeLeft: this.timeRemaining,
                level: this.currentLevel,
            });
        });
    }
}

