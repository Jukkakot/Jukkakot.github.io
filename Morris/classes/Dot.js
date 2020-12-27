class Dot {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.player = random(1) < 0.3 && new Player(color(floor(random(2)) * 255))
        this.r = this.player ? circleSize * 2 : circleSize
        this.highlight = false
        this.hover = false
    }

    draw(l, d) {
        var size = (outBoxSize - distance * l) / 2
        push()
        if (this.player) {
            this.r = circleSize * 2
            stroke(255, 0, 0)
            if (this.hover) this.r *= 1.3
            this.highlight ? strokeWeight(this.r / 10) : noStroke()
            fill(this.player.color)
            circle(this.x * size, this.y * size, this.r)
            noStroke()
            fill(0, 50, 255)
            textAlign(CENTER)
            textSize(circleSize)
            text(l + "," + d, this.x * size, this.y * size - circleSize * 1.2)
            text(this.x + "," + this.y, this.x * size, this.y * size + circleSize * 1.5)
        } else {
            this.r = circleSize
            stroke(255, 0, 0)
            if (this.hover) this.r *= 1.3
            this.highlight ? strokeWeight(this.r / 10) : noStroke()
            fill(50)
            circle(this.x * size, this.y * size, this.r)
            noStroke()
            fill(0, 50, 255)
            textAlign(CENTER)
            textSize(circleSize)
            text(l + "," + d, this.x * size, this.y * size - circleSize * 0.7)
            text(this.x + "," + this.y, this.x * size, this.y * size + circleSize * 1.2)
        }

        pop()
    }
    click() {
        this.highlight = !this.highlight
    }
}