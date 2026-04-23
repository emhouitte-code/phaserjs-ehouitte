export interface EnemyState {
    x: number;
    y: number;
    type: 'E' | 'F';
    dir: number;
    id: string;
}

const DIRS = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
];

const PASSABLE = new Set(['0', 'P']);

export class EnemyAI {
    tick(
        grid: string[][],
        enemies: EnemyState[],
        playerPos: { x: number; y: number }
    ): { enemies: EnemyState[]; playerKilled: boolean; changedCells: Array<[number, number]> } {
        const changed: Array<[number, number]> = [];
        let playerKilled = false;
        const newEnemies: EnemyState[] = [];

        for (const enemy of enemies) {
            const result = this.moveEnemy(grid, enemy, playerPos);
            if (result.playerKilled) playerKilled = true;
            changed.push(...result.changed);
            newEnemies.push(result.enemy);
        }

        return { enemies: newEnemies, playerKilled, changedCells: changed };
    }

    private moveEnemy(
        grid: string[][],
        enemy: EnemyState,
        playerPos: { x: number; y: number }
    ): { enemy: EnemyState; playerKilled: boolean; changed: Array<[number, number]> } {
        const changed: Array<[number, number]> = [];
        const isLeftFollower = enemy.type === 'E';

        const tryDirs: number[] = isLeftFollower
            ? [(enemy.dir + 3) % 4, enemy.dir, (enemy.dir + 1) % 4, (enemy.dir + 2) % 4]
            : [(enemy.dir + 1) % 4, enemy.dir, (enemy.dir + 3) % 4, (enemy.dir + 2) % 4];

        for (const dir of tryDirs) {
            const { dx, dy } = DIRS[dir];
            const nx = enemy.x + dx;
            const ny = enemy.y + dy;

            if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) continue;

            const cell = grid[ny][nx];
            if (!PASSABLE.has(cell)) continue;

            const playerKilled = nx === playerPos.x && ny === playerPos.y;

            grid[enemy.y][enemy.x] = '0';
            if (!playerKilled) {
                grid[ny][nx] = enemy.type;
            }
            changed.push([enemy.y, enemy.x], [ny, nx]);

            return {
                enemy: { ...enemy, x: nx, y: ny, dir },
                playerKilled,
                changed,
            };
        }

        return { enemy, playerKilled: false, changed };
    }
}
