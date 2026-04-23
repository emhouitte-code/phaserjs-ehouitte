export interface PlayerMoveResult {
    moved: boolean;
    newX: number;
    newY: number;
    collectedDiamond: boolean;
    pushedRock: boolean;
    died: boolean;
    reachedExit: boolean;
    changedCells: Array<[number, number]>;
}

export class PlayerController {
    move(
        grid: string[][],
        playerX: number,
        playerY: number,
        dir: 'left' | 'right' | 'up' | 'down'
    ): PlayerMoveResult {
        const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
        const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
        const nx = playerX + dx;
        const ny = playerY + dy;

        const noMove: PlayerMoveResult = {
            moved: false, newX: playerX, newY: playerY,
            collectedDiamond: false, pushedRock: false,
            died: false, reachedExit: false, changedCells: [],
        };

        if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) return noMove;

        const target = grid[ny][nx];
        const changed: Array<[number, number]> = [];

        if (target === 'W' || target === 'M' || target === 'B' || target === 'X') return noMove;

        if (target === '3') {
            if (dy !== 0) return noMove;
            const rnx = nx + dx;
            const rny = ny;
            if (rny < 0 || rny >= grid.length || rnx < 0 || rnx >= grid[0].length) return noMove;
            if (grid[rny][rnx] !== '0') return noMove;
            grid[rny][rnx] = '3';
            grid[ny][nx] = 'P';
            grid[playerY][playerX] = '0';
            changed.push([playerY, playerX], [ny, nx], [rny, rnx]);
            return { moved: true, newX: nx, newY: ny, collectedDiamond: false, pushedRock: true, died: false, reachedExit: false, changedCells: changed };
        }

        if (target === 'E' || target === 'F') {
            return { ...noMove, died: true };
        }

        const collectedDiamond = target === '2';
        const reachedExit = target === 'O';

        grid[playerY][playerX] = '0';
        grid[ny][nx] = 'P';
        changed.push([playerY, playerX], [ny, nx]);

        return { moved: true, newX: nx, newY: ny, collectedDiamond, pushedRock: false, died: false, reachedExit, changedCells: changed };
    }
}
