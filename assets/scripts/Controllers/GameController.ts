import { GridModel } from "../Core/GridModel";
import { GameState } from "../Core/GameState";
import { BoosterManager } from "../Core/BoosterManager";
import GridView from "../View/GridView";
import UIManager from "../View/UIManager";
import TileView from "../View/TileView";
import { GAME_CONFIG } from "../Utils/Constants";
import { TileType, GameStatus } from "../Types/Enums";
import { IPos } from "../Types/Interfaces";
import { MatchLogic } from "../Core/MatchLogic";
import { SpecialTileLogic } from "../Core/SpecialTileLogic";
import SoundController from "./SoundController";
import { Utils } from "../Utils/Utils";


const { ccclass, property } = cc._decorator;

@ccclass
export default class GameController extends cc.Component {
    @property(GridView)
    gridView: GridView = null;

    @property(UIManager)
    uiManager: UIManager = null;


    private model: GridModel;
    private state: GameState;
    private boosterManager: BoosterManager;
    private isProcessing: boolean = false;
    private debug: boolean = true;

    onLoad() {
        this.model = new GridModel(GAME_CONFIG.ROWS, GAME_CONFIG.COLS);
        this.model.createGrid(GAME_CONFIG.COLORS_COUNT);
        
        this.state = new GameState(
            GAME_CONFIG.INITIAL_MOVES,
            GAME_CONFIG.BOOSTER_BOMB_COUNT,
            GAME_CONFIG.TELEPORT_COUNT,
            GAME_CONFIG.SHUFFLE_COUNT
        );
        
        this.boosterManager = new BoosterManager();

        this.registerEvents();
         if (this.uiManager.winScreen) this.uiManager.winScreen.active = false;
         if (this.uiManager.loseScreen) this.uiManager.loseScreen.active = false;
    }

    private registerEvents() {
        cc.Canvas.instance.node.on('TILE_CLICK', this.onTileClick, this);
        cc.Canvas.instance.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        cc.Canvas.instance.node.on(cc.Node.EventType.TOUCH_MOVE, this.onMouseMove, this);
        cc.Canvas.instance.node.on(cc.Node.EventType.TOUCH_START, this.onTouchMove, this);
        cc.Canvas.instance.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    onDestroy() {
        cc.Canvas.instance.node.off('TILE_CLICK', this.onTileClick, this);
        cc.Canvas.instance.node.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        cc.Canvas.instance.node.off(cc.Node.EventType.TOUCH_MOVE, this.onMouseMove, this);
    }

    start() {
         if (this.uiManager) {
             this.uiManager.startLoadingAnimation(); 
            }
        cc.resources.preloadDir("tiles", cc.SpriteFrame, () => {
        this.gridView.initView(this.model);
        this.updateUI();
        cc.tween(this.node)
            .delay(1.2) //Это чтобы можно было немного рассмотреть экран загрузки
            .call(() => {
                this.uiManager.hideLoadingScreen();
            })
            .start(); 
        });
    }


    private onMouseMove(event: cc.Event.EventMouse) {
            if (!this.boosterManager.bombMode || !this.gridView) return;
            this.gridView.updateGhostPosition(event.getLocation());
            this.gridView.showGhostIfNeeded();
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        if (!this.boosterManager.bombMode || !this.gridView) return;
        this.gridView.updateGhostPosition(event.getLocation());
        this.gridView.showGhostIfNeeded();
    }

    private async onTileClick(event: cc.Event.EventCustom) {
        
        if (this.state.status !== GameStatus.PLAYING) {
            return;
        }
        
        if (this.isProcessing) {
            return;
        }

        const tileView = event.target.getComponent(TileView);
        if (!tileView) return;

        if (this.boosterManager.bombMode) {
            await  this.executeBombBooster(tileView.row, tileView.col);
        } else if (this.boosterManager.teleportMode) {
            await this.handleTeleport(tileView);
        } else {
            await this.handleMatch(tileView.row, tileView.col);
        }
    }

  activateBombBooster() {
        if (this.isProcessing) return;

        if (this.boosterManager.bombMode) {
            this.boosterManager.cancelAll(this.gridView);
            this.gridView.hideGhostBomb();
            this.updateUI();
            return;
        }

        if (this.state.bombCount <= 0) {
            SoundController.instance.playError();
            return;
        }

        else {
            SoundController.instance.playClick();
        }

        this.boosterManager.cancelAll(this.gridView);
        this.boosterManager.activateBombMode();
        this.gridView.showGhostBomb(TileType.BOMB);
    }

 activateTeleport() {
    if (this.isProcessing) return;

    if (this.boosterManager.teleportMode) {
        this.boosterManager.cancelAll(this.gridView);
        this.updateUI();
        return;
    }

     if (this.state.teleportCount <= 0) {
        SoundController.instance.playError();
        return;
    }

    else {
        SoundController.instance.playClick();
    }
    
    this.boosterManager.cancelAll(this.gridView);
    this.gridView.hideGhostBomb();
    this.boosterManager.activateTeleportMode();
  }

   private async executeBombBooster(row: number, col: number) {
        this.isProcessing = true;
        try {
            const toRemove = this.boosterManager.executeBomb(
                row, col, this.model, this.gridView, this.state
            );
            SoundController.instance.playBombExplosion();
            if (toRemove.length > 0) {
                this.state.useMove();
                await this.processRemoval(toRemove, 20);
                this.checkGameStatus();
            }
        } finally {
            this.isProcessing = false;
            this.updateUI();
        }
    }   

    private async handleTeleport(tile: TileView) {
        const isFinished = await this.boosterManager.executeTeleport(
            tile, this.model, this.gridView, this.state
        );
        
        if (isFinished) {
            this.state.useMove();
            this.updateUI();
            SoundController.instance.playTeleport(); 
            this.gridView.updateZOrder();
            this.checkGameStatus();
        }
    }

    private async handleMatch(row: number, col: number) {
        const tile = this.model.getTile(row, col);
        if (!tile) return;

        this.isProcessing = true;

        try {
            let toRemove: IPos[] = [];
            let scoreMultiplier = GAME_CONFIG.SCORE_MULT_STANDART;
            let shouldSpendMove = false;

            if (SpecialTileLogic.isSpecialTile(tile.type)) {
                
            tile.type === TileType.DYNAMITE ? 
                SoundController.instance.playDynamiteExplosion() 
                : SoundController.instance.playBombExplosion();

                toRemove = SpecialTileLogic.getRecursiveRange(this.model.getGrid(), row, col, tile.type);
                scoreMultiplier = GAME_CONFIG.SCORE_MULT_2;

                if (tile.type === TileType.ROCKET_H || tile.type === TileType.ROCKET_V) {
                    SoundController.instance.playRocket();
                    this.gridView.animateRocket(row, col, tile.type);
                    await  Utils.delay(100);
                }
                
                shouldSpendMove = true; 
            } 
            else {

                const match = MatchLogic.findMatches(this.model.getGrid(), row, col);
                if (match.length < GAME_CONFIG.MIN_MATCH) {
                    this.isProcessing = false;
                    return; 
                }

                const bonusCreated = this.model.upgradeToBonus(row, col, match.length);
                
                if (bonusCreated !== null) {
                    SoundController.instance.playBonusCreated();
                    await this.gridView.animateBonusCreation(row, col, bonusCreated);
                    toRemove = match.filter(p => !(p.r === row && p.c === col));
                } else {
                    toRemove = match;
                }
                
                shouldSpendMove = true; 
            }

            if (shouldSpendMove) {
                this.state.useMove();
                this.updateUI();
            }

            if (toRemove.length > 0) {
                await this.processRemoval(toRemove, scoreMultiplier);
            }
            
            this.checkGameStatus();
        } finally {
            this.isProcessing = false;
            this.updateUI();
        }
    }


    private async processRemoval(positions: IPos[], scoreMultiplier: number) {

        const uniquePositions = positions.filter((pos, index, self) =>
            index === self.findIndex((p) => p.r === pos.r && p.c === pos.c)
        );

        const isSpecial = scoreMultiplier >= GAME_CONFIG.SCORE_MULT_1; 
        
        this.state.addScore(uniquePositions.length * scoreMultiplier);
        this.model.removeTiles(uniquePositions);
        
        SoundController.instance.playPoof();
        
        this.gridView.removeTiles(uniquePositions, isSpecial);

        await Utils.delay(150);
        
        const collapseData = this.model.collapse();
        
        await this.gridView.applyCollapse(collapseData);
        
        await this.checkAndHandleNoMoves(); 
    }


    private async checkAndHandleNoMoves(depth: number = 0) {
    if (depth > 5) return;

    if (this.state.score >= GAME_CONFIG.TARGET_SCORE) {
        this.checkGameStatus();
        return;
    }

    const hasOptions = MatchLogic.hasPossibleMatches(this.model.getGrid()) || this.state.bombCount > 0;
    
    if (this.state.moves <= 0 && this.state.score < GAME_CONFIG.TARGET_SCORE) {
        this.state.setStatus(GameStatus.LOST);
        this.checkGameStatus();
        return;
    }

    if (!hasOptions) {
        if (this.state.shuffleCount > 0) {
            this.isProcessing = true;
            this.state.useShuffle();
            this.updateUI();
            
            SoundController.instance.playTeleport();
            this.model.shuffleGrid();
            await this.gridView.animateTensionShuffle(this.model);
            
            this.isProcessing = false;

            await this.checkAndHandleNoMoves(depth + 1);
        } else {
            this.state.setStatus(GameStatus.LOST);
            this.checkGameStatus();
        }
    }
   }


    private checkGameStatus() {
    if (this.state.score >= GAME_CONFIG.TARGET_SCORE) {
        this.state.setStatus(GameStatus.WON);
        SoundController.instance.playWin();
        this.uiManager.showEndScreen(this.uiManager.winScreen);
        this.updateUI();
        return;
    }

    if (this.state.status === GameStatus.LOST) {
        SoundController.instance.playLose();
        this.uiManager.showEndScreen(this.uiManager.loseScreen);
        this.updateUI();
    }
}

    onRestartClick() {
        SoundController.instance.playClick();
        
        this.isProcessing = true;
        cc.Canvas.instance.node.off('TILE_CLICK'); 

        if (this.uiManager.loadingScreen) {
            this.uiManager.loadingScreen.active = true;
            this.uiManager.loadingScreen.opacity = 0;
            this.uiManager.loadingScreen.scale = 1.0;

            cc.tween(this.uiManager.loadingScreen)
                .to(0.4, { opacity: 255 })
                .call(() => {
                    SoundController.instance.stopAll();
                    cc.director.loadScene(cc.director.getScene().name);
                })
                .start();
        } else {
            cc.director.loadScene(cc.director.getScene().name);
        }
    }


    private updateUI() {
        if (!this.uiManager) return;
        
        this.uiManager.updateScore(this.state.score, GAME_CONFIG.TARGET_SCORE);
        this.uiManager.updateMoves(this.state.moves);
        this.uiManager.updateBoosterCount('bomb', this.state.bombCount);
        this.uiManager.updateBoosterCount('teleport', this.state.teleportCount);
         }
}