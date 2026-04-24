export interface LevelData {
    width: number;
    height: number;
    tileSize: number;
    diamondQuota: number;
    timeLimit: number;
    grid: string[][];
}

// Seeded mulberry32 RNG
function makeRng(seed: number): () => number {
    let s = seed >>> 0;
    return (): number => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function rngInt(rng: () => number, min: number, max: number): number {
    return min + Math.floor(rng() * (max - min + 1));
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

interface Config {
    rocks: number;
    diamonds: number;
    diamondQuota: number;
    enemies: number;
    barrierCount: number;
    timeLimit: number;
}

function getConfig(level: number): Config {
    const t = (level - 1) / 15;
    return {
        rocks: Math.floor(15 + t * 28),
        diamonds: Math.floor(14 + t * 16),
        diamondQuota: Math.floor(6 + t * 12),
        enemies: Math.floor(1 + t * 9),
        barrierCount: level <= 3 ? 1 : level <= 9 ? 2 : 3,
        timeLimit: Math.floor(300 - t * 100),
    };
}

export function generateLevel(levelNum: number): LevelData {
    const rng = makeRng(levelNum * 98765 + 12345);
    const cfg = getConfig(levelNum);
    const width = 32;
    const height = 22;
    const tileSize = 32;

    // Initialize: outer walls ('W'), inner dirt ('1')
    const grid: string[][] = [];
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++) {
            grid[y][x] = (x === 0 || x === width - 1 || y === 0 || y === height - 1) ? 'W' : '1';
        }
    }

    // Player at (1, 1)
    const playerX = 1, playerY = 1;
    grid[playerY][playerX] = 'P';

    // Exit: bottom-right area, varies by level seed
    const exitX = width - 2 - rngInt(rng, 0, 4);
    const exitY = height - 2 - rngInt(rng, 0, 3);
    grid[exitY][exitX] = 'X';

    // Safety path: L-shape — col 1 (y=1→exitY) then row exitY (x=1→exitX)
    // These remain '1' (dirt), no rocks/enemies placed on them.
    // Rocks won't fall on dirt cells (dirt is SOLID in PhysicsEngine).
    const safe = new Set<string>();
    safe.add(`${playerX},${playerY}`);
    safe.add(`${exitX},${exitY}`);
    for (let y = playerY; y <= exitY; y++) {
        safe.add(`1,${y}`);
        safe.add(`2,${y}`); // small buffer
    }
    for (let x = 1; x <= exitX; x++) {
        safe.add(`${x},${exitY}`);
        safe.add(`${x},${exitY - 1}`); // protect row above horizontal path
    }
    // Protect exit neighborhood
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            safe.add(`${exitX + dx},${exitY + dy}`);
        }
    }

    const isFree = (x: number, y: number): boolean => {
        if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return false;
        if (safe.has(`${x},${y}`)) return false;
        return grid[y][x] === '1';
    };

    const getAllFree = (avoidNearPlayer = false): [number, number][] => {
        const cells: [number, number][] = [];
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (!isFree(x, y)) continue;
                if (avoidNearPlayer && Math.abs(x - playerX) <= 3 && Math.abs(y - playerY) <= 3) continue;
                cells.push([x, y]);
            }
        }
        return cells;
    };

    // Place barriers (horizontal, min 5 wide)
    const candidateBarriers: Array<{ y: number; start: number; len: number }> = [];
    for (let y = 4; y < height - 5; y++) {
        if (Math.abs(y - exitY) < 4) continue;
        let run = 0, runStart = 2;
        for (let x = 2; x < width - 2; x++) {
            const blocked = safe.has(`${x},${y}`);
            if (!blocked && grid[y][x] === '1') {
                if (run === 0) runStart = x;
                run++;
                if (run >= 5) {
                    candidateBarriers.push({ y, start: runStart, len: run });
                    break;
                }
            } else {
                run = 0;
            }
        }
    }

    const shuffledBarriers = shuffle(candidateBarriers, rng);
    const usedBarrierRows = new Set<number>();
    let barriersPlaced = 0;
    for (const b of shuffledBarriers) {
        if (barriersPlaced >= cfg.barrierCount) break;
        if (usedBarrierRows.has(b.y) || usedBarrierRows.has(b.y - 1) || usedBarrierRows.has(b.y + 1)) continue;

        const barrierLen = Math.min(b.len, 5 + rngInt(rng, 0, 2));
        for (let bx = b.start; bx < b.start + barrierLen && bx < width - 1; bx++) {
            // Place barrier
            grid[b.y][bx] = 'B';
            safe.add(`${bx},${b.y}`);
            // Clear row below for transformed items output
            if (b.y + 1 < height - 1) {
                grid[b.y + 1][bx] = '0';
                safe.add(`${bx},${b.y + 1}`);
            }
            // Place rock or diamond directly above barrier (they transform on first tick)
            const aboveY = b.y - 1;
            if (aboveY > 0 && grid[aboveY][bx] === '1' && !safe.has(`${bx},${aboveY}`)) {
                grid[aboveY][bx] = rng() < 0.55 ? '3' : '2';
                safe.add(`${bx},${aboveY}`);
            }
        }
        usedBarrierRows.add(b.y);
        barriersPlaced++;
    }

    // Place enemies (avoid near player and safety path)
    let freeCells = shuffle(getAllFree(true), rng);
    let placed = 0;
    for (const [ex, ey] of freeCells) {
        if (placed >= cfg.enemies) break;
        if (grid[ey][ex] === '1') {
            grid[ey][ex] = rng() < 0.25 ? 'F' : 'E';
            safe.add(`${ex},${ey}`);
            // Protect adjacent cells to give player some space around each enemy
            safe.add(`${ex - 1},${ey}`);
            safe.add(`${ex + 1},${ey}`);
            placed++;
        }
    }

    // Place rocks
    freeCells = shuffle(getAllFree(), rng);
    placed = 0;
    for (const [rx, ry] of freeCells) {
        if (placed >= cfg.rocks) break;
        if (grid[ry][rx] === '1') {
            grid[ry][rx] = '3';
            placed++;
        }
    }

    // Place diamonds
    freeCells = shuffle(getAllFree(), rng);
    placed = 0;
    for (const [dx, dy] of freeCells) {
        if (placed >= cfg.diamonds) break;
        if (grid[dy][dx] === '1') {
            grid[dy][dx] = '2';
            placed++;
        }
    }

    return { width, height, tileSize, diamondQuota: cfg.diamondQuota, timeLimit: cfg.timeLimit, grid };
}
