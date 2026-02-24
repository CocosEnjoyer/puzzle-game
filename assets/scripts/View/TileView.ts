import { GAME_CONFIG } from "../Utils/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TileView extends cc.Component {
    public row: number = 0;
    public col: number = 0;
    public type: number = 0;


    unuse() {
        this.node.stopAllActions();
        this.node.scale = 1;
        this.node.opacity = 255;
    }

    init(type: number, r: number, c: number) {
        this.type = type;
        this.row = r;
        this.col = c;

        const sprite = this.getComponent(cc.Sprite);
        if (!sprite) return;

        this.node.width = GAME_CONFIG.TILE_WIDTH;
        this.node.height = GAME_CONFIG.TILE_HEIGHT;
        this.node.scale = 1.0; 

        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.trim = false;

        const path = `tiles/tile_${type}`;

        cc.resources.load(path, cc.SpriteFrame, (err, sf: cc.SpriteFrame) => {
            if (err || !cc.isValid(this.node)) return;

            const currentSprite = this.getComponent(cc.Sprite);
            if (currentSprite) {

                currentSprite.spriteFrame = sf;

                this.node.width = GAME_CONFIG.TILE_WIDTH;
                this.node.height = GAME_CONFIG.TILE_HEIGHT;
                
            }
        })

            this.node.off(cc.Node.EventType.TOUCH_END);
            this.node.on(cc.Node.EventType.TOUCH_END, () => {
                this.node.dispatchEvent(new cc.Event.EventCustom('TILE_CLICK', true));
            }, this);
    }

    highlight() {
        this.node.stopAllActions();

        this.node.setSiblingIndex(this.node.parent.childrenCount - 1);
        
        this.node.zIndex = 9999; 
        
        cc.tween(this.node)
            .to(0.2, { scale: 1.2 })
            .to(0.2, { scale: 1.1 })
            .union()
            .repeatForever()
            .start();
    }


    unhighlight() {
        this.node.stopAllActions();
        
        this.node.zIndex = 0; 

        cc.tween(this.node)
            .to(0.1, { scale: 1.0 })
            .call(() => {
                const gridView = this.node.parent.getComponent("GridView");
                if (gridView) {
                    gridView.updateZOrder();
                }
            })
            .start();
    }

    setPos(r: number, c: number) {
            this.row = r;
            this.col = c;
        }
    }


