import GridView from "../View/GridView";
import TileView from "../View/TileView";
import { GameState } from "./GameState";
import { GridModel } from "./GridModel";
import { SpecialTileLogic } from "./SpecialTileLogic";
import { IPos } from "../Types/Interfaces";
import { TileType } from "../Types/Enums";


export class BoosterManager {
    private isBombMode: boolean = false;
    private isTeleportMode: boolean = false;
    private firstSelectedTile: { row: number, col: number } | null = null;

    get bombMode() { return this.isBombMode; }
    get teleportMode() { return this.isTeleportMode; }
    get selectedTile() { return this.firstSelectedTile; }

    activateBombMode() {
        this.cancelAll();
        this.isBombMode = true;
    }

    activateTeleportMode() {
        this.cancelAll();
        this.isTeleportMode = true;
    }


    cancelAll(view?: GridView) {
    if (this.firstSelectedTile && view) {
        const node = view.getTileNode(this.firstSelectedTile.row, this.firstSelectedTile.col);
        node?.getComponent(TileView)?.unhighlight();
        view.updateZOrder();
    }

    this.isBombMode = false;
    this.isTeleportMode = false;
    this.firstSelectedTile = null;
}

    executeBomb(row: number, col: number, model: GridModel, view: GridView, state: GameState): IPos[] {
        state.useBomb();
        this.cancelAll();
        view.hideGhostBomb();
        
        const toRemove = SpecialTileLogic.getRecursiveRange(model.getGrid(), row, col, TileType.BOMB);
        return toRemove;
    }

    async executeTeleport(tile: TileView, model: GridModel, view: GridView, state: GameState): Promise<boolean> {

        if (!this.firstSelectedTile) {
            this.firstSelectedTile = { row: tile.row, col: tile.col };
            tile.highlight();
            return false;
        }

        const first = this.firstSelectedTile;
        const second = { row: tile.row, col: tile.col };
        
        if (first.row === second.row && first.col === second.col) {
            this.cancelAll();
            tile.unhighlight();
            return false;
        }

        model.swapTiles({r: first.row, c: first.col}, {r: second.row, c: second.col});
        state.useTeleport();
        
        const node1 = view.getTileNode(first.row, first.col);
        const node2 = view.getTileNode(second.row, second.col);
        
        await view.animateSwap(node1, node2);
        
        node1.getComponent(TileView).setPos(second.row, second.col);
        node2.getComponent(TileView).setPos(first.row, first.col);
        
        this.cancelAll();
        view.updateZOrder();
        return true;
    }
}