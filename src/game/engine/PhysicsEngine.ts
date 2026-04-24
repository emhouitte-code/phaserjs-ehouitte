export interface PhysicsResult {
    changedCells: Array<[number, number]>;
    playerCrushed: boolean;
    enemiesKilled: Array<{ x: number; y: number }>;
}

export class PhysicsEngine {
    // Tracks cells that contain items currently in motion (falling or sliding)
    private fallingItems = new Set<string>();

    tick(grid: string[][], playerPos: { x: number; y: number }): PhysicsResult {
        const height = grid.length;
        const width = grid[0].length;
        const changed: Array<[number, number]> = [];
        let playerCrushed = false;
        const enemiesKilled: Array<{ x: number; y: number }> = [];
        const newFalling = new Set<string>();
        // Prevent a rock/diamond moved this tick from being processed again
        const processed = new Set<string>();

        for (let y = height - 2; y >= 0; y--) {
            for (let x = 1; x < width - 1; x++) {
                const key = `${x},${y}`;
                if (processed.has(key)) continue;

                const cell = grid[y][x];
                if (cell !== '2' && cell !== '3') continue;

                const wasFalling = this.fallingItems.has(key);
                const below = grid[y + 1][x];

                if (below === '0') {
                    // Chute libre verticale
                    grid[y + 1][x] = cell;
                    grid[y][x] = '0';
                    changed.push([y, x], [y + 1, x]);
                    const destKey = `${x},${y + 1}`;
                    newFalling.add(destKey);
                    processed.add(destKey);

                } else if (below === 'P') {
                    // Joueur directement en dessous
                    if (wasFalling) {
                        // Objet était en chute → écrase le joueur
                        grid[y + 1][x] = cell;
                        grid[y][x] = '0';
                        changed.push([y, x], [y + 1, x]);
                        newFalling.add(`${x},${y + 1}`);
                        playerCrushed = true;
                    }
                    // Sinon : le joueur a creusé dessous, le rocher reste posé sur lui

                } else if (below === 'E' || below === 'F') {
                    // Tombe sur ennemi → explosion 3×3
                    const playerHit = this.explode(grid, x, y + 1, playerPos, changed, enemiesKilled);
                    if (playerHit) playerCrushed = true;
                    grid[y][x] = '0';
                    changed.push([y, x]);

                } else if (below === 'B') {
                    // Barrière : l'objet passe à travers et se transforme (rock↔diamond)
                    const transformed = cell === '3' ? '2' : '3';
                    const belowY = y + 2;
                    grid[y][x] = '0';
                    changed.push([y, x]);
                    if (belowY < height) {
                        const belowBarrier = grid[belowY][x];
                        if (belowBarrier === '0') {
                            grid[belowY][x] = transformed;
                            changed.push([belowY, x]);
                            newFalling.add(`${x},${belowY}`);
                        } else if (belowBarrier === 'P') {
                            grid[belowY][x] = transformed;
                            changed.push([belowY, x]);
                            playerCrushed = true;
                        }
                        // Sinon : objet consommé (sortie bloquée)
                    }

                } else if (below === '2' || below === '3' || below === 'M') {
                    // Repose sur un rocher, un diamant, ou un mur de brique → glissement latéral
                    // Condition : la case de côté ET la case diagonale doivent être vides
                    const canSlideLeft = x > 1
                        && grid[y][x - 1] === '0'
                        && grid[y + 1][x - 1] === '0';
                    const canSlideRight = x < width - 2
                        && grid[y][x + 1] === '0'
                        && grid[y + 1][x + 1] === '0';

                    if (canSlideLeft) {
                        grid[y][x - 1] = cell;
                        grid[y][x] = '0';
                        changed.push([y, x], [y, x - 1]);
                        const destKey = `${x - 1},${y}`;
                        newFalling.add(destKey);
                        processed.add(destKey);
                    } else if (canSlideRight) {
                        grid[y][x + 1] = cell;
                        grid[y][x] = '0';
                        changed.push([y, x], [y, x + 1]);
                        const destKey = `${x + 1},${y}`;
                        newFalling.add(destKey);
                        processed.add(destKey);
                    }
                    // Sinon : reste immobile sur le rocher/diamant
                }
                // Sur terre ('1'), mur ('W','M'), sortie ('X','O'), barrière ('B') → reste immobile
            }
        }

        this.fallingItems = newFalling;
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
