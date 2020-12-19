class Chip {
    constructor(col) {
        var row = Math.floor(mouseX / (chipRadius * 2.05))
        if (row > 6) row = 6
        var x = row * chipRadius * 2 + chipRadius + row * 5 + 2.5
        var y = chipRadius*2
        const options = {
            friction: 0,
            restitution:0,
            density:100
        }
        this.color = col
        // this.color = color(255)
        this.r = chipRadius
        this.body = Bodies.circle(x, y, this.r, options)
        World.add(world, this.body)
    }
    isOffScreen() {
        var x = this.body.position.x;
        var y = this.body.position.y;
        return (x < -this.r || x > width + this.r || y > height);
    }
    show() {
        const pos = this.body.position;
        const angle = this.body.angle;
        push();
        ellipseMode(RADIUS);
        translate(pos.x, pos.y);
        rotate(angle);
        rectMode(CENTER)
        // strokeWeight(this.r/10)
        // colorMode(HSB)
        // stroke(color(0,0,255))
        noStroke()
        fill(this.color)
        circle(0, 0, this.r)
        textAlign(CENTER)
        textSize(35)
        fill(0)
        // text(Math.floor((pos.x / (chipRadius * 2))) + "," + Math.floor((pos.y / (chipRadius * 2)) - 1), 0, 0)
        pop();
    }
}