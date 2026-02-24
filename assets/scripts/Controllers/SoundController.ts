const { ccclass } = cc._decorator;

@ccclass
export default class SoundController {
    private static _instance: SoundController = null;
    private _globalSfxVolume: number = 1.0; 

    private _activeLoops: Map<string, number> = new Map();
    private _cache: Map<string, cc.AudioClip> = new Map();

   static get instance(): SoundController {
        if (!this._instance) this._instance = new SoundController();
        return this._instance;
    }

    playSfxByName(name: string, loop: boolean = false, volumeMult: number = 1.0) {
        const path = `sounds/${name}`;
        
        if (this._cache.has(name)) {
            this.executePlay(name, this._cache.get(name), loop, volumeMult);
            return;
        }

        cc.resources.load(path, cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("Sound not found:", name);
                return;
            }
            this._cache.set(name, clip);
            this.executePlay(name, clip, loop, volumeMult);
        });
    }

    private executePlay(name: string, clip: cc.AudioClip, loop: boolean, volumeMult: number) {
        let id = cc.audioEngine.playEffect(clip, loop);
        cc.audioEngine.setVolume(id, this._globalSfxVolume * volumeMult);

        if (loop) {
            this.stopSfxByName(name);
            this._activeLoops.set(name, id);
        }
    }

    stopSfxByName(name: string) {
        if (this._activeLoops.has(name)) {
            let id = this._activeLoops.get(name);
            cc.audioEngine.stopEffect(id);
            this._activeLoops.delete(name);
        }
    }

    stopAll() {
        cc.audioEngine.stopAllEffects();
        this._activeLoops.clear();
    }

    setGlobalVolume(v: number) {
        this._globalSfxVolume = v;
        cc.audioEngine.setEffectsVolume(v);
    }

    playClick() {
        this.playSfxByName('pop', false, 0.5);
    }

    playError() {
        this.playSfxByName('negativeBtn', false, 1.0);
    }

    playBombExplosion() {
        this.playSfxByName('explosion', false, 0.3);
    }

    playDynamiteExplosion() {
        this.playSfxByName('explosion', false, 0.5);
    }

    playTeleport() {
        this.playSfxByName('wooshTeleport', false, 0.5);
    }

    playRocket() {
        this.playSfxByName('rocket', false, 1.0);
    }

    playBonusCreated() {
        this.playSfxByName('bonus', false, 1.0);
    }

    playPoof() {
        this.playSfxByName('poof', false, 1.0);
    }

    playWin() {
        this.playSfxByName('winHorn', false, 1.0);
    }

    playLose() {
        this.playSfxByName('loseHorn', false, 1.0);
        this.playRainLoop();
    }

    playRainLoop() {
        this.playSfxByName('rain', true, 0.8);
    }
}
