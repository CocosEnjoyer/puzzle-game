export class Utils {
    static isValid(r: number, c: number, rows: number, cols: number): boolean {
        return r >= 0 && r < rows && c >= 0 && c < cols;
    }

    static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
