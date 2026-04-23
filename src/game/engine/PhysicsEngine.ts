export interface PhysicsResult {
    changedCells: Array<[number, number]>;
    playerCrushed: boolean;
    enemiesKilled: Array<{ x: number; y: number }>;
}

// 'M' = mur brique destructible, 'W' = mur extérieur indestructible
const SOLID = new Set(['W', 'M', 'B', '1', 'X', 'O', 'P']);

export class PhysicsEngine {
    tick(grid: string[][], playerPos: { x: number; y: number }): PhysicsResult {
        const height = grid.length;
        const width = grid[0].length;
        const changed: Array<[number, number]> = [];
        let playerCrushed = false;
        const enemiesKilled: Array<{ x: number; y: number }> = [];

        for (let y = height - 2; y >= 0; y--) {
            for (let x = 1; x < width - 1; x++) {
                const cell = grid[y][x];
                if (cell !== '2' && cell !== '3') continue;

                const below = grid[y + 1][x];

                if (below === '0') {
                    // Chute libre
                    grid[y + 1][x] = cell;
                    grid[y][x] = '0';
                    changed.push([y, x], [y + 1, x]);
                } else if (below === 'P') {
                    // Rocher/diamant tombe sur le joueur → écrasé
                    grid[y + 1][x] = cell;
                    grid[y][x] = '0';
                    changed.push([y, x], [y + 1, x]);
                    playerCrushed = true;
                } else if (below === 'E' || below === 'F') {
                    // Tombe sur ennemi → explosion 3×3
                    const playerHit = this.explode(grid, x, y + 1, playerPos, changed, enemiesKilled);
                    if (playerHit) playerCrushed = true;
                    grid[y][x] = '0';
                    changed.push([y, x]);
                } else if (below === 'B') {
                    // Barrière : l'objet disparaît au-dessus, réapparaît transformé en-dessous
                    const transformed = cell === '3' ? '2' : '3';
                    const belowY = y + 2;
                    grid[y][x] = '0';
                    changed.push([y, x]);
                    if (belowY < height) {
                        const belowBarrier = grid[belowY][x];
                        if (belowBarrier === '0') {
                            grid[belowY][x] = transformed;
                            changed.push([belowY, x]);
                        } else if (belowBarrier === 'P') {
                            // L'objet transformé tombe sur le joueur
                            grid[belowY][x] = transformed;
                            changed.push([belowY, x]);
                            playerCrushed = true;
                        }
                        // Sinon : objet consommé (détruit par la barrière)
                    }
                } else if (below === '2' || below === '3' || SOLID.has(below)) {
                    // Glissement à gauche
                    const canSlideLeft = x > 1 && grid[y][x - 1] === '0';
                    const leftLanding = x > 1 ? grid[y + 1][x - 1] : null;
                    if (canSlideLeft && (leftLanding === '0' || leftLanding === 'P')) {
                        grid[y + 1][x - 1] = cell;
                        grid[y][x] = '0';
                        changed.push([y, x], [y + 1, x - 1]);
                        if (x - 1 === playerPos.x && y + 1 === playerPos.y) playerCrushed = true;
                    } else {
                        // Glissement à droite
                        const canSlideRight = x < width - 2 && grid[y][x + 1] === '0';
                        const rightLanding = x < width - 2 ? grid[y + 1][x + 1] : null;
                        if (canSlideRight && (rightLanding === '0' || rightLanding === 'P')) {
                            grid[y + 1][x + 1] = cell;
                            grid[y][x] = '0';
                            changed.push([y, x], [y + 1, x + 1]);
                            if (x + 1 === playerPos.x && y + 1 === playerPos.y) playerCrushed = true;
                        }
                    }
                }
            }
        }

        return { changedCells: changed, playerCrushed, enemiesKilled };
    }

    private explode(
        grid: string[][],
        ex: number, ey: number,
        playerPos: { x: number; y: number },
        changed: Array<[number, number]>,
        enemiesKilled: Array<{ x: number; y: number }>
    ): boolean {
        const height = grid.length;
        const width = grid[0].length;
        let playerHit = false;
        enemiesKilled.push({ x: ex, y: ey });
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = ex + dx;
                const ny = ey + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                const c = grid[ny][nx];
                if (c === 'W') continue; // Murs extérieurs indestructibles
                if (nx === playerPos.x && ny === playerPos.y) {
                    playerHit = true; // Joueur dans la zone → mort
                    continue;         // Ne pas remplacer 'P' par un diamant
                }
                // Tout le reste (dont 'M' murs brique) devient diamant
                grid[ny][nx] = '2';
                changed.push([ny, nx]);
            }
        }
        return playerHit;
    }
}
