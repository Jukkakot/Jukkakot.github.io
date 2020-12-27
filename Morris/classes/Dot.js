class Dot {
    constructor(x, y, player) {
        this.x = x
        this.y = y
        this.player = player
    }
    draw(l, d) {
        var size = (outBoxSize - distance * l) / 2
        push()
        if (this.player) {
            fill(this.player.color)
            noStroke()
            circle(this.x * size, this.y * size, circleSize * 2)
            fill(0, 50, 255)
            textAlign(CENTER)
            textSize(circleSize)
            text(l + "," + d, this.x * size, this.y * size - circleSize * 1.2)
        } else {
            fill(50)
            noStroke()
            circle(this.x * size, this.y * size, circleSize)
            fill(0, 50, 255)
            textAlign(CENTER)
            textSize(circleSize)
            text(l + "," + d, this.x * size, this.y * size - circleSize * 0.7)
        }

        pop()
    }
}