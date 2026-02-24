export interface IPos {
    r: number;
    c: number;
}

export interface ICollapseData {
    moved: IMovedTile[];
    created: ICreatedTile[];
}

export interface IMovedTile {
    fromR: number;
    fromC: number;
    toR: number;
    toC: number;
}

export interface ICreatedTile {
    r: number;
    c: number;
    type: number;
}

