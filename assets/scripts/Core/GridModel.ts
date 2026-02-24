import { TileData } from "./TileData";
import { TileType } from "../Types/Enums";
import { IPos, ICollapseData } from "../Types/Interfaces";
import { GAME_CONFIG } from "../Utils/Constants";
import { CollapseLogic } from "./CollapseLogic";
import { Utils } from "../Utils/Utils";
import { SpecialTileLogic } from "./SpecialTileLogic";



export class GridModel {
    private _grid: (TileData | null)[][] = [];
    public rows: number;
    public cols: number;


    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this._grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    }

    collapse(): ICollapseData {
     const result = CollapseLogic.collapse(
        this._grid,
        this.rows,
        this.cols,
        GAME_CONFIG.COLORS_COUNT
    );
    
    this._grid = result.grid;
    return { moved: result.moved, created: result.created };
    }

    createGrid(colorsCount: number): void {
        for (let r = 0; r < this.rows; r++) {
            this._grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const randomType: TileType = Math.floor(Math.random() * colorsCount);
                this._grid[r][c] = new TileData(r, c, randomType);
            }
        }
    }

    private isValid(r: number, c: number): boolean {
        return Utils.isValid(r, c, this.rows, this.cols);
    }

    getTile(r: number, c: number): TileData | null {
        if (!this.isValid(r, c)) return null;
        return this._grid[r][c];
    }

    getGrid(): (TileData | null)[][] {
         return this._grid.map(row => [...row]); 
    }


    removeTiles(match: IPos[]): void {
        match.forEach(pos => {
            if (this.isValid(pos.r, pos.c)) {
                this._grid[pos.r][pos.c] = null;
            }
        });
    }

    upgradeToBonus(r: number, c: number, matchLength: number): TileType | null {
        const bonusType = SpecialTileLogic.getBonusType(matchLength);
        if (bonusType !== null) {
            this.setTileType(r, c, bonusType);
        }
        return bonusType;
    }



    setTileType(r: number, c: number, type: TileType) {
        if (this.isValid(r, c) && this._grid[r][c]) {
            this._grid[r][c]!.type = type;
        }
    }

    swapTiles(p1: IPos, p2: IPos) {
        if (!this.isValid(p1.r, p1.c) || !this.isValid(p2.r, p2.c)) return;

        const tile1 = this._grid[p1.r][p1.c];
        const tile2 = this._grid[p2.r][p2.c];

        if (!tile1 || !tile2) return;

        this._grid[p1.r][p1.c] = tile2;
        this._grid[p2.r][p2.c] = tile1;

        tile1.r = p2.r;
        tile1.c = p2.c;

        tile2.r = p1.r;
        tile2.c = p1.c;
    }

    shuffleGrid(): IPos[] {
        const tiles: TileData[] = [];
        const positions: {r: number, c: number}[] = [];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this._grid[r][c];
                if (tile) {
                    tiles.push(tile);
                    positions.push({ r, c });
                }
            }
        }

        const oldPositions = tiles.map(t => ({ r: t.r, c: t.c }));

        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            const pos = positions[i];

            tile.r = pos.r;
            tile.c = pos.c;
            this._grid[pos.r][pos.c] = tile;
        }

        return oldPositions;
    }
    }