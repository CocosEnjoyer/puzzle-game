const { ccclass, property } = cc._decorator;

@ccclass
export default class UIManager extends cc.Component {
    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) movesLabel: cc.Label = null;
    @property(cc.Label)bombCountLabel: cc.Label = null;
    @property(cc.Label)teleportCountLabel: cc.Label = null;

    @property(cc.Node)
        loadingScreen: cc.Node = null;
    
    @property(cc.Node)
        winScreen: cc.Node = null;
    
    @property(cc.Node)
        loseScreen: cc.Node = null;

    @property(cc.Node)
            bombPatternContainer: cc.Node = null; 

    updateScore(score: number, targetScore: number) {
        if (this.scoreLabel) this.scoreLabel.string = `${score + '/' + targetScore}`;
    }

    updateMoves(moves: number) {
        if (this.movesLabel) {
            this.movesLabel.string = `${moves}`;
        } else {
            cc.error("MovesLabel не привязан в UIManager!");
        }
    }
    
    updateBoosterCount(type: 'bomb' | 'teleport', count: number) {
        if (type === 'bomb' && this.bombCountLabel) {
            this.bombCountLabel.string = count.toString();
        } else if (type === 'teleport' && this.teleportCountLabel) {
            this.teleportCountLabel.string = count.toString();
        }
    }

    showEndScreen(screen: cc.Node) {
        if (!screen) return;
        
        screen.active = true;
        screen.scale = 0.5;
        screen.opacity = 0;

        cc.tween(screen)
            .parallel(
                cc.tween().to(0.5, { scale: 1.0 }, { easing: 'backOut' }),
                cc.tween().to(0.3, { opacity: 255 })
            )
            .call(() => {
                if (screen === this.winScreen) {
                    this.animateWinElements();
                }
                else if (screen === this.loseScreen) {
                    this.animateLoseElements();
                }
            })
            .start();
    }       

    animateWinElements() {
        const trophy = this.winScreen.getChildByName("PrizeImg"); 
        const glow = this.winScreen.getChildByName("Glow"); 


        if (trophy) {
            cc.tween(trophy)
                .repeatForever(
                    cc.tween()
                        .by(1.5, { y: 20 }, { easing: 'sineInOut' })
                        .by(1.5, { y: -20 }, { easing: 'sineInOut' })
                )
                .start();
        }

        if (glow) {
            cc.tween(glow)
                .repeatForever(cc.tween().by(5, { angle: 360 }))
                .start();
            cc.tween(glow)
                .repeatForever(
                    cc.tween()
                        .to(2, { scale: 1.2, opacity: 180 }, { easing: 'sineInOut' })
                        .to(2, { scale: 0.9, opacity: 100 }, { easing: 'sineInOut' })
                )
                .start();
        }
    }

    animateLoseElements() {
        const loseImg = this.loseScreen.getChildByName("LoseImg"); 

        if (loseImg) {
            cc.tween(loseImg)
                .repeatForever(
                    cc.tween()
                        .by(1.5, { y: 20 }, { easing: 'sineInOut' })
                        .by(1.5, { y: -20 }, { easing: 'sineInOut' })
                )
                .start();
        }
    }

    startLoadingAnimation() {
        if (!this.bombPatternContainer) return;

        this.bombPatternContainer.stopAllActions();
        this.bombPatternContainer.y = 0;

        cc.tween(this.bombPatternContainer)
            .repeatForever(
                cc.tween()
                    .to(4, { y: -560 }, { easing: 'linear' })
                    .set({ y: 0 })
            )
            .start();

        const labelNode = this.loadingScreen?.getChildByName("LoadingLabel");
        if (labelNode) {
            cc.tween(labelNode)
                .to(0.8, { scale: 1.1 }, { easing: 'sineInOut' })
                .to(0.8, { scale: 1.0 }, { easing: 'sineInOut' })
                .union()
                .repeatForever()
                .start();
        }

    }


    hideLoadingScreen() {
        if (!this.loadingScreen) {
            cc.warn("LoadingScreen не привязан");
            return;
        }

        cc.tween(this.loadingScreen)
            .delay(0.2)
            .to(0.4, { opacity: 0, scale: 1.2 }, { easing: 'fade' }) 
            .call(() => {
                this.loadingScreen.active = false;
                this.loadingScreen.stopAllActions();
                
                if (this.bombPatternContainer) {
                    this.bombPatternContainer.stopAllActions();
                }
                
            })
            .start();
    }

}
