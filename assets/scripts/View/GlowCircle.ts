const {ccclass, property} = cc._decorator;

@ccclass
export default class GlowCircle extends cc.Component {
    onLoad() {
        const g = this.getComponent(cc.Graphics);
        g.clear();
        g.fillColor = cc.Color.WHITE;
        g.circle(0, 0, 50);
        g.fill();
    }
}
