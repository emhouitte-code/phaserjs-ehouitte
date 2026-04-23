import { Scene } from 'phaser';
import { Level1 } from '../levels/Level1';

export type LevelData = typeof Level1;

const TEXTURE_MAP: Record<string, string> = {
    '0': 'tile-empty',
    '1': 'tile-dirt',
    '2': 'tile-diamond',
    '3': 'tile-rock',
    'W': 'tile-wall',
    'M': 'tile-brick',
    'E': 'tile-enemy',
    'F': 'tile-enemy',
    'B': 'tile-barrier',
    'X': 'tile-exit-closed',
    'O': 'tile-exit-open',
    'P': 'tile-player',
};

export class LevelManager {
    private scene: Scene;
    private tileSize: number;
    private width: number;
    private height: number;
    private sprites: Phaser.GameObjects.Image[][];
    private diamondTweens: Map<string, Phaser.Tweens.Tween> = new Map();
    private enemyTweens: Map<string, Phaser.Tweens.Tween> = new Map();

    constructor(scene: Scene, levelData: LevelData) {
        this.scene = scene;
        this.tileSize = levelData.tileSize;
        this.width = levelData.width;
        this.height = levelData.height;
        this.sprites = Array.from({ length: this.height }, () =>
            new Array<Phaser.GameObjects.Image>(this.width)
        );
    }

    buildFullDisplay(grid: string[][]): void {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = grid[y][x];
                const px = x * this.tileSize + this.tileSize / 2;
                const py = y * this.tileSize + this.tileSize / 2;
                const textureKey = TEXTURE_MAP[cell] ?? 'tile-empty';
                const sprite = this.scene.add.image(px, py, textureKey);
                sprite.setDepth(cell === 'P' ? 3 : cell === 'E' || cell === 'F' ? 2 : 1);
                this.sprites[y][x] = sprite;

                if (cell === '2') this.addDiamondTween(x, y, sprite);
                if (cell === 'E' || cell === 'F') this.addEnemyTween(x, y, sprite);
            }
        }
    }

    updateCells(grid: string[][], changedCells: Array<[number, number]>): void {
        for (const [y, x] of changedCells) {
            this.updateSprite(x, y, grid[y][x]);
        }
    }

    private updateSprite(x: number, y: number, cell: string): void {
        const sprite = this.sprites[y]?.[x];
        if (!sprite) return;

        const key = `${x},${y}`;

        const dt = this.diamondTweens.get(key);
        if (dt) { dt.stop(); this.diamondTweens.delete(key); }
        const et = this.enemyTweens.get(key);
        if (et) { et.stop(); this.enemyTweens.delete(key); }

        sprite.setAlpha(1).setScale(1);

        const textureKey = TEXTURE_MAP[cell] ?? 'tile-empty';
        sprite.setTexture(textureKey);
        sprite.setDepth(cell === 'P' ? 3 : cell === 'E' || cell === 'F' ? 2 : 1);

        if (cell === '2') this.addDiamondTween(x, y, sprite);
        if (cell === 'E' || cell === 'F') this.addEnemyTween(x, y, sprite);
    }

    private addDiamondTween(x: number, y: number, sprite: Phaser.GameObjects.Image): void {
        const tween = this.scene.tweens.add({
            targets: sprite,
            alpha: { from: 0.65, to: 1 },
            duration: 500,
            repeat: -1,
            yoyo: true,
        });
        this.diamondTweens.set(`${x},${y}`, tween);
    }

    private addEnemyTween(x: number, y: number, sprite: Phaser.GameObjects.Image): void {
        const tween = this.scene.tweens.add({
            targets: sprite,
            scaleX: { from: 0.9, to: 1.1 },
            duration: 300,
            repeat: -1,
            yoyo: true,
        });
        this.enemyTweens.set(`${x},${y}`, tween);
    }

    getPlayerSprite(): Phaser.GameObjects.Image | null {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.sprites[y]?.[x]?.texture?.key === 'tile-player') {
                    return this.sprites[y][x];
                }
            }
        }
        return null;
    }

    getSprite(x: number, y: number): Phaser.GameObjects.Image | null {
        return this.sprites[y]?.[x] ?? null;
    }

    getWorldX(gridX: number): number { return gridX * this.tileSize + this.tileSize / 2; }
    getWorldY(gridY: number): number { return gridY * this.tileSize + this.tileSize / 2; }
}
