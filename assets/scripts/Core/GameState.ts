// Core/GameState.ts
import { GameStatus } from "../Types/Enums";

export class GameState {
    private _score: number = 0;
    private _moves: number;
    private _status: GameStatus = GameStatus.PLAYING;
    private _bombCount: number;
    private _teleportCount: number;
    private _shuffleCount: number;

    constructor(
        initialMoves: number,
        initialBombCount: number,
        initialTeleportCount: number,
        initialShuffleCount: number
    ) {
        this._moves = initialMoves;
        this._bombCount = initialBombCount;
        this._teleportCount = initialTeleportCount;
        this._shuffleCount = initialShuffleCount;
    }

    get score() { return this._score; }
    get moves() { return this._moves; }
    get status() { return this._status; }
    get bombCount() { return this._bombCount; }
    get teleportCount() { return this._teleportCount; }
    get shuffleCount() { return this._shuffleCount; }

    addScore(value: number) {
        this._score += value;
    }

    useMove() {
        this._moves--;
    }

    useBomb() {
        this._bombCount--;
    }

    useTeleport() {
        this._teleportCount--;
    }

    useShuffle() {
        this._shuffleCount--;
    }

    setStatus(status: GameStatus) {
        this._status = status;
    }

}