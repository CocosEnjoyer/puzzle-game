import { TileData } from "./TileData";
import { IMovedTile, ICreatedTile } from "../Types/Interfaces";

export class CollapseLogic {
    static collapse(grid: (TileData | null)[][], rows: number, cols: number, colorsCount: number) {
        const moved: IMovedTile[] = [];
        const created: ICreatedTile[] = [];
        const newGrid: (TileData | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

        for (let c = 0; c < cols; c++) {
            let writeIdx = 0;
            for (let r = 0; r < rows; r++) {
                if (grid[r][c] !== null) {
                    const tile = grid[r][c]!;
                    if (tile.r !== writeIdx) {
                        moved.push({ fromR: tile.r, fromC: c, toR: writeIdx, toC: c });
                        tile.r = writeIdx;
                    }
                    newGrid[writeIdx][c] = tile;
                    writeIdx++;
                }
            }
            for (let r = writeIdx; r < rows; r++) {
                const type = Math.floor(Math.random() * colorsCount);
                newGrid[r][c] = new TileData(r, c, type);
                created.push({ r, c, type });
            }
        }
        return { grid: newGrid, moved, created };
    }
}

