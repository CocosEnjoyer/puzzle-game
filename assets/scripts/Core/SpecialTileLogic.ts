import { TileType } from "../Types/Enums";
import { IPos } from "../Types/Interfaces";
import { TileData } from "./TileData";
import { Utils } from "../Utils/Utils";
import { GAME_CONFIG } from "../Utils/Constants";


export class SpecialTileLogic {
    static getRange(r: number, c: number, type: TileType, rows: number, cols: number): IPos[] {
       const result: IPos[] = [];
        
          switch (type) {
            case TileType.ROCKET_H:
                for (let i = 0; i < cols; i++) result.push({ r, c: i });
                break;
                
            case TileType.ROCKET_V:
                for (let i = 0; i < rows; i++) result.push({ r: i, c });
                break;
                
            case TileType.BOMB:
                for (let i = r - 1; i <= r + 1; i++) {
                    for (let j = c - 1; j <= c + 1; j++) {
                        if (Utils.isValid(i, j, rows, cols)) result.push({ r: i, c: j });
                    }
                }
                break;

            case TileType.DYNAMITE:
                for (let i = r - 2; i <= r + 2; i++) {
                    for (let j = c - 2; j <= c + 2; j++) {

                        if (Utils.isValid(i, j, rows, cols)) result.push({ r: i, c: j });
                    }
                }
                break;
        }
        return result;
    }

    static getRecursiveRange(
        grid: (TileData | null)[][], 
        startR: number, 
        startC: number, 
        type: TileType
    ): IPos[] {
        if (grid.length === 0) return [];
        const rows = grid.length;
        const cols = grid[0].length;
        
        const toRemove: IPos[] = [{ r: startR, c: startC }];
        const visited = new Set<string>();
        const queue: { r: number, c: number, type: TileType }[] = [{ r: startR, c: startC, type }];

        while (queue.length > 0) {
            const curr = queue.shift()!;
            const key = `${curr.r},${curr.c}`;

            if (visited.has(key)) continue;
            visited.add(key);

            const area = this.getRange(curr.r, curr.c, curr.type, rows, cols);

            for (const pos of area) {
                const posKey = `${pos.r},${pos.c}`;
                if (!visited.has(posKey)) {
                    toRemove.push(pos);
                    
                    const tile = grid[pos.r]?.[pos.c];
                    if (tile && SpecialTileLogic.isSpecialTile(tile.type) && !visited.has(posKey)) {
                        queue.push({ r: pos.r, c: pos.c, type: tile.type });
                    }
                }
            }
        }
        return toRemove;
    }
     static getBonusType(length: number): TileType | null {
        if (length >= GAME_CONFIG.TILES_FOR_DYNAMITE) return TileType.DYNAMITE;
        if (length === GAME_CONFIG.TILES_FOR_ROCKET_V) return TileType.ROCKET_V;
        if (length === GAME_CONFIG.TILES_FOR_ROCKET_H) return TileType.ROCKET_H;
        if (length === GAME_CONFIG.TILES_FOR_BOMB) return TileType.BOMB;
        return null;
    }

    static isSpecialTile(type: number): boolean {
        return type >= 100;
    }

}