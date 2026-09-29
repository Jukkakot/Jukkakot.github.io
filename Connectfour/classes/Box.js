class Box {
    constructor(x, y, w, h) {
        const options = {
            isStatic: true,
            friction:0
        }
        this.body = Bodies.rectangle(x, y, w, h, options)
        World.add(world, this.body)
        this.w = w
        this.h = h
    }

    show() {
        const pos = this.body.position;
        const angle = this.body.angle;
        push();
        translate(pos.x, pos.y);
        rotate(angle);
        fill(0);
        rectMode(CENTER,CENTER)
        rect(0, 0, this.w, this.h)
        pop();
    }
}