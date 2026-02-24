import { IPos } from "../Types/Interfaces";
import { Utils } from "../Utils/Utils";
import { SpecialTileLogic } from "./SpecialTileLogic";
import { TileData } from "./TileData";


export class MatchLogic {
     static findMatches(grid: (TileData | null)[][], startR: number, startC: number): IPos[] {
        const targetType = grid[startR][startC]?.type;
        if (targetType === undefined || targetType === null || SpecialTileLogic.isSpecialTile(targetType)) return [];

        const rows = grid.length;
        const cols = grid[0].length;
        const match: IPos[] = [];
        const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
        const queue: IPos[] = [{ r: startR, c: startC }];
        
        visited[startR][startC] = true;

        while (queue.length > 0) {
            const curr = queue.shift()!;
            match.push(curr);

            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dr, dc] of dirs) {
                const nr = curr.r + dr;
                const nc = curr.c + dc;

                if (Utils.isValid(nr, nc, rows, cols) && 
                    !visited[nr][nc] && 
                    grid[nr][nc]?.type === targetType) {
                    visited[nr][nc] = true;
                    queue.push({ r: nr, c: nc });
                }
            }
        }
        return match;
    }


    static hasPossibleMatches(grid: (TileData | null)[][]): boolean {
        const rows = grid.length;
        const cols = grid[0] ? grid[0].length : 0;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const current = grid[r][c];
                if (!current || current.type === null) continue;

                if (SpecialTileLogic.isSpecialTile(current.type)) return true;

                const right = grid[r][c + 1];
                const top = grid[r + 1] ? grid[r + 1][c] : null;

                if (right && right.type === current.type) return true;
                if (top && top.type === current.type) return true;
            }
        }
        return false;
    }


}