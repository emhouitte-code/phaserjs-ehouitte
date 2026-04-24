export interface LevelData {
    width: number;
    height: number;
    tileSize: number;
    diamondQuota: number;
    timeLimit: number;
    grid: string[][];
}

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

// Quota formula (user-specified):
//   quota = openDiamonds + enemies * 9 + barriers * 2 - 3
// Each enemy kill converts 3x3 zone -> diamonds (9 cells).
// Each sealed room: 6 inner diamonds + 3 M-wall cells breached = 9 per enemy.
// Open enemies (hazards only) also yield 9 diamonds but are counted separately.

interface Config {
    rocks: number;
    openDiamonds: number;    // few placed open diamonds
    sealedRooms: number;     // 1-2 rooms, each needs enemy kill to access 9 diamonds
    openEnemies: number;     // free-roaming enemies (hazards + diamond sources)
    barrierCount: number;
    horizWalls: number;
    vertWalls: number;
    timeLimit: number;
}

function getConfig(level: number): Config {
    const t = (level - 1) / 15;
    return {
        rocks:        Math.floor(50 + t * 60),    // 50-110
        openDiamonds: Math.floor(3 + t * 5),      // 3-8 (few; rest comes from kills)
        sealedRooms:  Math.min(2, Math.floor(1 + t * 1.5)), // 1-2
        openEnemies:  Math.floor(1 + t * 4),      // 1-5 free-roaming enemies
        barrierCount: level <= 3 ? 1 : level <= 9 ? 2 : 3,
        horizWalls:   Math.floor(3 + t * 6),      // 3-9
        vertWalls:    Math.floor(t * 5),           // 0-5
        timeLimit:    Math.floor(260 - t * 60),   // 260-200
    };
}

export function generateLevel(levelNum: number): LevelData {
    const rng = makeRng(levelNum * 98765 + 12345);
    const cfg = getConfig(levelNum);
    const width = 32;
    const height = 22;
    const tileSize = 32;

    // Init grid: outer W walls, inner dirt
    const grid: string[][] = [];
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++) {
            grid[y][x] = (x === 0 || x === width - 1 || y === 0 || y === height - 1) ? 'W' : '1';
        }
    }

    const playerX = 1, playerY = 1;
    grid[playerY][playerX] = 'P';

    const exitX = width - 2 - rngInt(rng, 0, 4);
    const exitY = height - 2 - rngInt(rng, 0, 3);
    grid[exitY][exitX] = 'X';

    // Safe set: no obstacle placed here — guaranteed traversable path
    const safe = new Set<string>();
    safe.add(`${playerX},${playerY}`);
    safe.add(`${exitX},${exitY}`);

    // Player start bubble (3x6)
    for (let dy = 0; dy <= 5; dy++)
        for (let dx = 0; dx <= 3; dx++)
            safe.add(`${playerX + dx},${playerY + dy}`);

    // L-path guarantee: col 1+2 (full height) + exit row and row above it
    for (let y = 1; y < height - 1; y++) {
        safe.add(`1,${y}`);
        safe.add(`2,${y}`);
    }
    for (let x = 1; x < width - 1; x++) {
        safe.add(`${x},${exitY}`);
        safe.add(`${x},${exitY - 1}`);
    }

    // Exit neighbourhood (2-cell radius)
    for (let dy = -2; dy <= 1; dy++)
        for (let dx = -2; dx <= 1; dx++) {
            const nx = exitX + dx, ny = exitY + dy;
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1)
                safe.add(`${nx},${ny}`);
        }

    const isInside = (x: number, y: number) =>
        x > 0 && x < width - 1 && y > 0 && y < height - 1;

    const isFree = (x: number, y: number): boolean =>
        isInside(x, y) && !safe.has(`${x},${y}`) && grid[y][x] === '1';

    // ── HORIZONTAL BRICK-WALL DIVIDERS ───────────────────────────────────────
    const usedRows = new Set<number>();
    for (let attempt = 0; attempt < cfg.horizWalls * 15 && usedRows.size < cfg.horizWalls; attempt++) {
        const y = 3 + rngInt(rng, 0, height - 8);
        if (usedRows.has(y) || usedRows.has(y - 1) || usedRows.has(y + 1)) continue;
        let safeCount = 0;
        for (let x = 3; x < width - 1; x++) if (safe.has(`${x},${y}`)) safeCount++;
        if (safeCount > (width - 4) * 0.35) continue;

        const section = Math.floor((width - 4) / 3);
        const gapSet = new Set<number>();
        const addGap = (baseX: number) => {
            const gx = baseX + rngInt(rng, 0, Math.max(1, section - 2));
            for (let d = 0; d < 1 + rngInt(rng, 0, 1); d++) gapSet.add(gx + d);
        };
        addGap(3);
        addGap(3 + section + rngInt(rng, 0, Math.max(1, section - 1)));

        let placed = 0;
        for (let x = 3; x < width - 1; x++) {
            if (gapSet.has(x) || safe.has(`${x},${y}`)) continue;
            if (grid[y][x] === '1') { grid[y][x] = 'M'; placed++; }
        }
        if (placed >= 5) usedRows.add(y);
    }

    // ── VERTICAL BRICK-WALL DIVIDERS ─────────────────────────────────────────
    if (cfg.vertWalls > 0) {
        const usedCols = new Set<number>();
        for (let attempt = 0; attempt < cfg.vertWalls * 15 && usedCols.size < cfg.vertWalls; attempt++) {
            const x = 5 + rngInt(rng, 0, width - 12);
            if (usedCols.has(x) || usedCols.has(x - 1) || usedCols.has(x + 1)) continue;
            let safeCount = 0;
            for (let y = 2; y < height - 2; y++) if (safe.has(`${x},${y}`)) safeCount++;
            if (safeCount > (height - 4) * 0.35) continue;

            const section = Math.floor((height - 4) / 3);
            const gapSet = new Set<number>();
            const addGap = (baseY: number) => {
                const gy = baseY + rngInt(rng, 0, Math.max(1, section - 2));
                for (let d = 0; d < 1 + rngInt(rng, 0, 1); d++) gapSet.add(gy + d);
            };
            addGap(2);
            addGap(2 + section + rngInt(rng, 0, Math.max(1, section - 1)));

            let placed = 0;
            for (let y = 2; y < height - 2; y++) {
                if (gapSet.has(y) || safe.has(`${x},${y}`)) continue;
                if (grid[y][x] === '1') { grid[y][x] = 'M'; placed++; }
            }
            if (placed >= 4) usedCols.add(x);
        }
    }

    // ── SEALED DIAMOND ROOMS ─────────────────────────────────────────────────
    // Outer 5x4 box of M walls, inner 3x2 = 6 locked diamonds.
    // Enemy spawned directly below bottom wall (oy+oH) at center column.
    // Explosion (3x3) at enemy position hits bottom M wall row (3 cells -> diamonds).
    // Total yield per room: 6 inner + 3 from explosion = 9. Matches quota formula.
    const oW = 5, oH = 4;
    const iW = 3, iH = 2; // inner area: 3x2 = 6 diamonds
    let sealedRoomsCreated = 0;

    for (let attempt = 0; attempt < cfg.sealedRooms * 30 && sealedRoomsCreated < cfg.sealedRooms; attempt++) {
        const ox = 5 + rngInt(rng, 0, width - oW - 10);
        const oy = 3 + rngInt(rng, 0, height - oH - 8);

        // Room cells + 1-cell margin + enemy row below must all be inside & free of safe/non-dirt
        let canPlace = true;
        outer:
        for (let dy = -1; dy <= oH + 1; dy++) {
            for (let dx = -1; dx <= oW; dx++) {
                const cx = ox + dx, cy = oy + dy;
                if (!isInside(cx, cy)) { canPlace = false; break outer; }
                if (safe.has(`${cx},${cy}`)) { canPlace = false; break outer; }
                // Interior and perimeter room cells must be dirt
                if (dy >= 0 && dy < oH && dx >= 0 && dx < oW) {
                    if (grid[cy][cx] !== '1') { canPlace = false; break outer; }
                }
            }
        }
        // Also check enemy spawn row (oy + oH) center column
        const spawnY = oy + oH;
        const spawnX = ox + Math.floor(oW / 2); // center = ox+2
        if (!isInside(spawnX, spawnY) || safe.has(`${spawnX},${spawnY}`) || grid[spawnY][spawnX] !== '1') continue;
        if (!canPlace) continue;

        // Place M walls on perimeter, diamonds in inner area
        for (let dy = 0; dy < oH; dy++) {
            for (let dx = 0; dx < oW; dx++) {
                const cx = ox + dx, cy = oy + dy;
                safe.add(`${cx},${cy}`);
                const isInnerCell = dx >= 1 && dx <= iW && dy >= 1 && dy <= iH;
                grid[cy][cx] = isInnerCell ? '2' : 'M';
            }
        }

        // Place enemy directly below bottom wall at center column
        grid[spawnY][spawnX] = 'E';
        safe.add(`${spawnX},${spawnY}`);

        // Clear patrol cells around enemy so it can move (EnemyAI needs '0' cells)
        const patrolDirs = shuffle(
            [[-1,0],[1,0],[0,1],[-1,1],[1,1],[-1,-1],[1,-1]] as [number,number][],
            rng
        );
        let cleared = 0;
        for (const [pdx, pdy] of patrolDirs) {
            if (cleared >= 5) break;
            const nx = spawnX + pdx, ny = spawnY + pdy;
            if (!isInside(nx, ny) || safe.has(`${nx},${ny}`)) continue;
            if (grid[ny][nx] === '1') {
                grid[ny][nx] = '0';
                safe.add(`${nx},${ny}`);
                cleared++;
            }
        }

        sealedRoomsCreated++;
    }

    // ── TRANSFORMATION BARRIERS (min 5 cells wide) ───────────────────────────
    const usedBarrierRows = new Set<number>();
    let barriersPlaced = 0;
    for (let attempt = 0; attempt < cfg.barrierCount * 12 && barriersPlaced < cfg.barrierCount; attempt++) {
        const by = 4 + rngInt(rng, 0, height - 10);
        if (usedBarrierRows.has(by) || usedBarrierRows.has(by - 1) || usedBarrierRows.has(by + 1)) continue;

        let run = 0, runStart = -1;
        for (let bx = 3; bx < width - 1; bx++) {
            if (!safe.has(`${bx},${by}`) && grid[by][bx] === '1') {
                if (run === 0) runStart = bx;
                run++;
                if (run >= 5) {
                    const len = 5 + rngInt(rng, 0, 2);
                    for (let i = 0; i < len && runStart + i < width - 1; i++) {
                        const bxp = runStart + i;
                        if (safe.has(`${bxp},${by}`)) continue;
                        grid[by][bxp] = 'B';
                        safe.add(`${bxp},${by}`);
                        if (by + 1 < height - 1 && !safe.has(`${bxp},${by + 1}`)) {
                            grid[by + 1][bxp] = '0';
                            safe.add(`${bxp},${by + 1}`);
                        }
                        if (by - 1 > 0 && grid[by - 1][bxp] === '1' && !safe.has(`${bxp},${by - 1}`)) {
                            grid[by - 1][bxp] = rng() < 0.6 ? '3' : '2';
                            safe.add(`${bxp},${by - 1}`);
                        }
                    }
                    usedBarrierRows.add(by);
                    barriersPlaced++;
                    break;
                }
            } else {
                run = 0;
            }
        }
    }

    // ── FREE-ROAMING ENEMIES ─────────────────────────────────────────────────
    // These patrol open areas. Their kill also yields 9 diamonds (3x3 explosion).
    // EnemyAI.PASSABLE = {'0','P'} — enemies MUST have cleared patrol zone to move.
    const getAllFree = (minManhattan = 0): [number, number][] => {
        const cells: [number, number][] = [];
        for (let y = 1; y < height - 1; y++)
            for (let x = 1; x < width - 1; x++) {
                if (!isFree(x, y)) continue;
                if (Math.abs(x - playerX) + Math.abs(y - playerY) < minManhattan) continue;
                cells.push([x, y]);
            }
        return cells;
    };

    let freeCells = shuffle(getAllFree(12), rng);
    let enemiesPlaced = 0;
    for (const [ex, ey] of freeCells) {
        if (enemiesPlaced >= cfg.openEnemies) break;
        if (!isFree(ex, ey)) continue;

        grid[ey][ex] = rng() < 0.25 ? 'F' : 'E';
        safe.add(`${ex},${ey}`);

        // Clear patrol zone — CRITICAL: enemy AI only traverses '0' cells
        const patrolDirs = shuffle(
            [[-1,0],[1,0],[0,1],[0,-1],[-1,1],[1,1],[-1,-1],[1,-1]] as [number,number][],
            rng
        );
        let cleared = 0;
        for (const [pdx, pdy] of patrolDirs) {
            if (cleared >= 5) break;
            const nx = ex + pdx, ny = ey + pdy;
            if (!isInside(nx, ny) || safe.has(`${nx},${ny}`)) continue;
            if (grid[ny][nx] === '1') {
                grid[ny][nx] = '0';
                safe.add(`${nx},${ny}`);
                cleared++;
            }
        }
        enemiesPlaced++;
    }

    // ── ROCKS ────────────────────────────────────────────────────────────────
    freeCells = shuffle(getAllFree(), rng);
    let rocksPlaced = 0;
    for (const [rx, ry] of freeCells) {
        if (rocksPlaced >= cfg.rocks) break;
        if (grid[ry][rx] === '1') { grid[ry][rx] = '3'; rocksPlaced++; }
    }

    // ── OPEN DIAMONDS ────────────────────────────────────────────────────────
    freeCells = shuffle(getAllFree(), rng);
    let openDiamondsPlaced = 0;
    for (const [dx, dy] of freeCells) {
        if (openDiamondsPlaced >= cfg.openDiamonds) break;
        if (grid[dy][dx] === '1') { grid[dy][dx] = '2'; openDiamondsPlaced++; }
    }

    // ── QUOTA FORMULA ────────────────────────────────────────────────────────
    // Each enemy kill converts 3x3 = 9 cells to diamonds.
    // Total enemies = sealedRoomsCreated (guards) + enemiesPlaced (open).
    // Buffer of 3: player has 3 extra diamonds beyond quota.
    const totalEnemies = sealedRoomsCreated + enemiesPlaced;
    const rawQuota = openDiamondsPlaced + totalEnemies * 9 + barriersPlaced * 2 - 3;
    const diamondQuota = Math.max(5, rawQuota);

    return { width, height, tileSize, diamondQuota, timeLimit: cfg.timeLimit, grid };
}
