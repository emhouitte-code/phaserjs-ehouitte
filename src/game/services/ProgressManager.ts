const KEY_MAX = 'mine_maxLevel';
const KEY_LAST = 'mine_lastLevel';

export class ProgressManager {
    static getMaxLevel(): number {
        return parseInt(localStorage.getItem(KEY_MAX) ?? '1', 10);
    }

    static setMaxLevel(n: number): void {
        const current = ProgressManager.getMaxLevel();
        if (n > current) localStorage.setItem(KEY_MAX, String(n));
    }

    static getLastLevel(): number {
        return parseInt(localStorage.getItem(KEY_LAST) ?? '1', 10);
    }

    static setLastLevel(n: number): void {
        localStorage.setItem(KEY_LAST, String(n));
    }

    static reset(): void {
        localStorage.removeItem(KEY_MAX);
        localStorage.removeItem(KEY_LAST);
    }
}
