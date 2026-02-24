import { GridModel } from "../Core/GridModel";
import { TileType } from "../Types/Enums";
import { IPos, ICreatedTile, IMovedTile } from "../Types/Interfaces";
import { GAME_CONFIG } from "../Utils/Constants";
import TileView from "./TileView";


const { ccclass, property } = cc._decorator;

@ccclass
export default class GridView extends cc.Component {
    @property(cc.Prefab)
    tilePrefab: cc.Prefab = null;
    @property(cc.Prefab)
    explosionPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    rocketPrefab: cc.Prefab = null;

    private tilesNodes: (cc.Node | null)[][] = [];

    private tilePool: cc.NodePool = new cc.NodePool('TileView');
    private ghostPool: cc.NodePool = new cc.NodePool();

    
    private ghostBomb: cc.Node = null;

    private readonly TILE_STEP: number = GAME_CONFIG.TILE_STEP; 
    private readonly TILE_WIDTH: number = GAME_CONFIG.TILE_WIDTH; 
    private readonly TILE_HEIGHT: number = GAME_CONFIG.TILE_HEIGHT;

    initView(model: GridModel) {

        this.node.children.forEach(child => this.tilePool.put(child));
        this.node.removeAllChildren();

        for (let r = 0; r < model.rows; r++) {
            for (let c = 0; c < model.cols; c++) {
                const data = model.getTile(r, c);
                if (!data) continue;

                const tileNode = this.getTileFromPool(); 
                tileNode.parent = this.node;
            

                const sprite = tileNode.getComponent(cc.Sprite);
                if (sprite) { 
                    sprite.sizeMode = cc.Sprite.SizeMode.RAW;
                    sprite.trim = false; 
                }
                
                tileNode.setContentSize(this.TILE_WIDTH, this.TILE_HEIGHT);

                const posX = (c - (model.cols - 1) / 2) * this.TILE_STEP;
                const posY = (r - (model.rows - 1) / 2) * this.TILE_STEP;
                tileNode.setPosition(posX, posY);

                const tileScript = tileNode.getComponent("TileView");
                if (tileScript) { 
                    tileScript.init(data.type, r, c); 
                }
            }
        }
    }

    private getTileFromPool(): cc.Node {
        let tile = this.tilePool.size() > 0 ? this.tilePool.get() : cc.instantiate(this.tilePrefab);
        tile.opacity = 255;
        tile.scale = 1;
        return tile;
    }


    async animateBonusCreation(r: number, c: number, type: number): Promise<void> {
    const node = this.getTileNode(r, c);
    if (!node) return;

    return new Promise(resolve => {
        cc.tween(node)
            .to(0.15, { scale: 0 }, { easing: 'backIn' })
            .call(() => {
                
                const tileView = node.getComponent(TileView);
                if (tileView) tileView.init(type, r, c);
                
                if (this.explosionPrefab) {
                   const fx = cc.instantiate(this.explosionPrefab);
                   fx.parent = this.node;
                   fx.setPosition(node.position);
                   fx.setScale(0.5);
                   cc.tween(fx).delay(0.3).call(() => fx.destroy()).start();
                }
            })
            .to(0.25, { scale: 1.2 }, { easing: 'expoOut' })
            .to(0.1, { scale: 1.0 })
            .call(() => resolve())
            .start();
        });
    }



    removeTiles(tiles: IPos[], isSpecial: boolean = false) {

        const TILE_COLORS = [
            cc.color(70, 150, 255),   // 0: Синий
            cc.color(0, 255, 0),  // 1: Зеленый
            cc.color(255, 255, 0),   // 2: Желтый
            cc.color(255, 0, 0),  // 3: Красный
            cc.color(255, 0, 255)   // 4: Фиолетовый
        ];

        tiles.forEach((t, index) => {
            const node = this.getTileNode(t.r, t.c);
            if (!node) return;

            const tileScript = node.getComponent(TileView);
            const tileType = tileScript ? tileScript.type : 0;
            const targetColor = TILE_COLORS[tileType] || cc.Color.WHITE;

            node.stopAllActions();

            if (this.explosionPrefab) {
                const fx = cc.instantiate(this.explosionPrefab);
                this.node.addChild(fx);
                fx.setPosition(node.position);
                fx.zIndex = 5000;

                const glowNode = fx.getChildByName("Glow");
                if (glowNode) {
                    glowNode.color = targetColor;
                    glowNode.active = isSpecial ? (index === 0) : false;
                }

                const sparksNode = fx.getChildByName("Sparks");
                if (sparksNode) {
                    const ps = sparksNode.getComponent(cc.ParticleSystem);
                    if (ps) {
                        ps.startColor = targetColor;
                        ps.endColor = targetColor;
                        ps.startColorVar = cc.color(0, 0, 0, 0);
                        ps.endColorVar = cc.color(0, 0, 0, 0);
                        ps.resetSystem();
                    }
                }

                const allPS = fx.getComponentsInChildren(cc.ParticleSystem);
                allPS.forEach(ps => {
                    if (ps.node.name !== "Sparks") {
                        ps.resetSystem();
                    }
                });

                fx.setScale(isSpecial && index === 0 ? 3.0 : 1.0); 
                cc.tween(fx).delay(0.5).call(() => fx.destroy()).start();
            }

            cc.tween(node)
                .to(0.1, { scale: 0, opacity: 0 })
                .call(() => {
                    this.tilePool.put(node);
                })
                .start();
        });

        if (isSpecial) {
            cc.tween(this.node)
                .by(0.05, { x: 10, y: 5 })
                .by(0.05, { x: -20, y: -10 })
                .by(0.05, { x: 10, y: 5 })
                .to(0.05, { x: 0, y: 0 })
                .start();
        }
    }    

    animateRocket(r: number, c: number, type: TileType) {
        const startNode = this.getTileNode(r, c);
        if (!startNode || !this.rocketPrefab) return;

        startNode.opacity = 0; 

        const fx = cc.instantiate(this.rocketPrefab);
        this.node.addChild(fx);
        const startPos = startNode.getPosition();
        fx.setPosition(startPos);
        fx.zIndex = 9999;

        const p1 = fx.getChildByName("Part1");
        const p2 = fx.getChildByName("Part2");
        
        const stopOffset = GAME_CONFIG.TILE_STEP;
        const halfWidth = (GAME_CONFIG.COLS * GAME_CONFIG.TILE_STEP) / 2 - stopOffset;
        const halfHeight = (GAME_CONFIG.ROWS * GAME_CONFIG.TILE_STEP) / 2 - stopOffset;

        const duration = 0.25;
        if (type === TileType.ROCKET_H) {
            p1.scaleX = 1; p2.scaleX = -1;
            
            const targetRight = halfWidth - startPos.x;
            const targetLeft = -halfWidth - startPos.x;

            cc.tween(p1)
                .to(duration, { x: targetRight }, { easing: 'quadIn' })
                .call(() => p1.active = false)
                .start();

            cc.tween(p2)
                .to(duration, { x: targetLeft }, { easing: 'quadIn' })
                .call(() => p2.active = false)
                .start();
        } else {
            p1.angle = 90; p2.angle = -90;
            
            const targetUp = halfHeight - startPos.y;
            const targetDown = -halfHeight - startPos.y;

            cc.tween(p1)
                .to(duration, { y: targetUp }, { easing: 'quadIn' })
                .call(() => p1.active = false)
                .start();

            cc.tween(p2)
                .to(duration, { y: targetDown }, { easing: 'quadIn' })
                .call(() => p2.active = false)
                .start();
        }

        cc.tween(fx).delay(duration + 0.05).call(() => fx.destroy()).start();
    }



    onDestroy() {
        if (this.tilePool) {
            this.tilePool.clear();
        }
        if (this.ghostPool) {
            this.ghostPool.clear();
        }
    }

    async applyCollapse(data: { moved: IMovedTile[], created: ICreatedTile[] }): Promise<void> {
        const promises: Promise<void>[] = [];

        this.schedule(this.updateZOrder, 0.05); 

        data.moved.forEach(m => {
            const node = this.getTileNode(m.fromR, m.fromC);
            if (node) {
                node.stopAllActions();
                const script = node.getComponent("TileView");
                script.row = m.toR; 
                script.col = m.toC;

                const targetY = (m.toR - (GAME_CONFIG.ROWS - 1) / 2) * this.TILE_STEP;
                const p = new Promise<void>(resolve => {
                    cc.tween(node)
                        .to(0.35, { y: targetY }, { easing: 'circOut' })
                        .call(() => resolve())
                        .start();
                });
                promises.push(p);
            }
        });

        data.created.forEach((c) => {
            const node = this.getTileFromPool();
            node.parent = this.node;
            
            node.opacity = 0; 
            node.scale = 1;
            node.active = true;

            const targetX = (c.c - (GAME_CONFIG.COLS - 1) / 2) * this.TILE_STEP;
            const targetY = (c.r - (GAME_CONFIG.ROWS - 1) / 2) * this.TILE_STEP;

            const baseSpawnY = ((GAME_CONFIG.ROWS - 1) / 2) * this.TILE_STEP + this.TILE_STEP;
            const offsetHeight = (GAME_CONFIG.ROWS - c.r) * (this.TILE_STEP * 0.5); 
            const finalSpawnY = baseSpawnY + offsetHeight;
            
            node.setPosition(targetX, finalSpawnY);

            const script = node.getComponent(TileView);
            if (script) script.init(c.type, c.r, c.c);
            
            const p = new Promise<void>(resolve => {
                cc.tween(node)
                    .delay(0.02 * (GAME_CONFIG.ROWS - c.r))
                    .parallel(
                        cc.tween().to(0.3, { y: targetY }, { easing: 'circOut' }),
                        cc.tween().delay(0.05).to(0.1, { opacity: 255 })
                    )
                    .call(() => resolve())
                    .start();
            });
            promises.push(p);
        });

     
        await Promise.all(promises);
       
        this.unschedule(this.updateZOrder);
        this.updateZOrder();
        this.rebuildNodesArray(); 
    }

    private rebuildNodesArray() {
        this.tilesNodes = Array.from({ length: GAME_CONFIG.ROWS }, () => 
            new Array(GAME_CONFIG.COLS).fill(null)
        );

        this.node.children.forEach(child => {
            const tile = child.getComponent(TileView);
            if (tile && cc.isValid(child)) {
                if (this.tilesNodes[tile.row]) {
                    this.tilesNodes[tile.row][tile.col] = child;
                }
            }
        });

    }

    showGhostIfNeeded() {
        if (!this.ghostBomb) return;
        
        if (this.ghostBomb.active && this.ghostBomb.getNumberOfRunningActions() > 0) return;

        this.ghostBomb.active = true;
        this.ghostBomb.opacity = 255;
        
        cc.tween(this.ghostBomb)
            .to(0.5, { opacity: 100 })
            .to(0.5, { opacity: 255 })
            .union()
            .repeatForever()
            .start();
    }


    showGhostBomb(type: number) {
        if (this.ghostBomb) this.hideGhostBomb();

        this.ghostBomb = this.ghostPool.size() > 0 ? this.ghostPool.get() : new cc.Node("GhostBomb");
        
        this.ghostBomb.parent = cc.Canvas.instance.node;
        this.ghostBomb.zIndex = 10000;
        this.ghostBomb.opacity = 0;
        this.ghostBomb.scale = 1;

        let sprite = this.ghostBomb.getComponent(cc.Sprite);
        if (!sprite) {
            sprite = this.ghostBomb.addComponent(cc.Sprite);
        }
        
        cc.resources.load(`tiles/tile_${type}`, cc.SpriteFrame, (err, sf: cc.SpriteFrame) => {
            if (!err && sprite && cc.isValid(this.ghostBomb)) {
                sprite.spriteFrame = sf;
                sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                this.ghostBomb.setContentSize(this.TILE_WIDTH, this.TILE_HEIGHT);
            }
        });
    }

    hideGhostBomb() {
        if (this.ghostBomb) {
            this.ghostBomb.stopAllActions();
            this.ghostPool.put(this.ghostBomb);
            this.ghostBomb = null;
        }
    }


    updateGhostPosition(worldPos: cc.Vec2) {
        if (!this.ghostBomb) return;

        if (!this.ghostBomb.active || this.ghostBomb.opacity === 0) {
            this.showGhostIfNeeded();
        }

        const localPos = this.ghostBomb.parent.convertToNodeSpaceAR(worldPos);
        
        this.ghostBomb.setPosition(localPos);

    }


    updateZOrder() {
        if (!this.node || !cc.isValid(this.node)) return;
        const children = this.node.children.filter(c => cc.isValid(c));
        
        children.sort((a, b) => a.y - b.y);
        
        children.forEach((child, index) => {
            if (child.zIndex < 9000) {
                child.zIndex = index;
            }
        });
    }


    async animateSwap(node1: cc.Node, node2: cc.Node): Promise<void> {
        const pos1 = node1.getPosition();
        const pos2 = node2.getPosition();
        
        const tile1 = node1.getComponent(TileView);
        const tile2 = node2.getComponent(TileView);
        
        if (!tile1 || !tile2) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            node1.stopAllActions();
            node2.stopAllActions();
            
            node1.scale = 1;
            node2.scale = 1;
            
            node1.zIndex = 1000;
            node2.zIndex = 1001;
            
            let completed = 0;
            const animationTime = 0.3;

            const updateInterval = setInterval(() => {
                this.updateZOrder();
            }, 50);
            
            cc.tween(node1)
                .to(animationTime, { 
                    position: cc.v3(pos2.x, pos2.y, 0) 
                }, { 
                    easing: 'quartInOut',
                    onUpdate: (ratio: number) => {
                        if (ratio >= 0.33 && node1.zIndex === 1000) {
                            node1.zIndex = tile2.row;
                        }
                    }
                })
                .call(() => {
                    completed++;
                    if (completed === 2) {
                        clearInterval(updateInterval);
                        this.updateZOrder(); 
                        resolve();
                    }
                })
                .start();

            cc.tween(node2)
                .to(animationTime, { 
                    position: cc.v3(pos1.x, pos1.y, 0) 
                }, { 
                    easing: 'quartInOut',
                    onUpdate: (ratio: number) => {
                        if (ratio >= 0.33 && node2.zIndex === 1001) {
                            node2.zIndex = tile1.row;
                        }
                    }
                })
                .call(() => {
                    completed++;
                    if (completed === 2) {
                        this.updateZOrder();
                        resolve();
                    }
                })
                .start();
        });
    }


    getTileNode(r: number, c: number): cc.Node {
        return this.node.children.find(n => {
            const t = n.getComponent("TileView");
            return t && t.row === r && t.col === c;
        });
    }

    async animateTensionShuffle(model: GridModel) {
        const movePromises: Promise<void>[] = [];

        const children = [...this.node.children]; 
        
        children.forEach(tileNode => {
            const script = tileNode.getComponent("TileView");
            if (!script) return;

            const startPos = tileNode.getPosition();
            const targetX = (script.col - (model.cols - 1) / 2) * this.TILE_STEP;
            const targetY = (script.row - (model.rows - 1) / 2) * this.TILE_STEP;
            const targetPos = cc.v2(targetX, targetY);

            const dir = targetPos.sub(startPos).normalize();
            const tensionDistance = 30; 
            const tensionPos = startPos.sub(dir.mul(tensionDistance));

            const p = new Promise<void>(resolve => {
                cc.tween(tileNode)
                    .to(0.1, { position: cc.v3(tensionPos.x, tensionPos.y), scale: 1.1 }, { easing: 'quadOut' })
                    .to(0.3, { 
                        position: cc.v3(startPos.x, startPos.y), 
                        scale: 0,  
                    }, { easing: 'fade' })
                    
                    .call(() => {
                        const newData = model.getTile(script.row, script.col);
                        if (newData) {
                            script.init(newData.type, script.row, script.col);
                        }
                        tileNode.setPosition(targetPos.x, targetPos.y);
                        
                        tileNode['_updateWorldMatrix']();
                    })

                    .to(0.4, { scale: 1.0, opacity: 255 }, { easing: 'expoIn' })

                    .call(() => {
                        resolve();
                    })
                    .start();
            });
            movePromises.push(p);
        });
        await Promise.all(movePromises);

        this.node.active = true; 
    }

    
    updateTileView(r: number, c: number, type: number) {
        const node = this.getTileNode(r, c);
        if (node) {
            const tileView = node.getComponent(TileView);
            if (tileView) {
                tileView.init(type, r, c);
            }
        } else {
            cc.warn(`Node not found at ${r},${c} for updateTileView`);
        }
    }


}
