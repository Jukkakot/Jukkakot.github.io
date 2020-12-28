class Dot {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.player
        this.r = this.player ? circleSize * 2 : circleSize
        this.highlight = false
        this.hlColor = color(0, 0, 255)
        this.hover = false
        this.neighbours = []
    }

    draw(l, d) {
        // this.player = game.playerBlue
        var size = (outBoxSize - distance * l) / 2
        push()
        if (this.player) {
            this.r = circleSize * 2
            stroke(this.hlColor)
            if (this.hover) this.r *= 1.3
            this.highlight ? strokeWeight(this.r / 10) : noStroke()
            noFill()
            circle(this.x * size, this.y * size, this.r * 1.1)
            // noStroke()
            tint(this.player.color)
            imageMode(CENTER);
            image(dotImg, this.x * size, this.y * size, this.r, this.r);
            noStroke()

            fill(0, 50, 255)
            textAlign(CENTER)
            textSize(circleSize)
            text(l + "," + d, this.x * size, this.y * size - circleSize * 1.2)
            // text(this.x + "," + this.y, this.x * size, this.y * size + circleSize * 1.5)
        } else {
            this.r = circleSize
            // stroke(this.hlColor)
            noStroke()
            if (this.hover) this.r *= 1.3
            this.highlight ? fill(this.hlColor) : fill(0)

            circle(this.x * size, this.y * size, this.r)
            noStroke()
            fill(0, 50, 255)
            textAlign(CENTER)
            textSize(circleSize)
            text(l + "," + d, this.x * size, this.y * size - circleSize * 0.7)
            // text(this.x + "," + this.y, this.x * size, this.y * size + circleSize * 1.2)
        }

        pop()
    }
    click(prevDot) {
        if (prevDot && prevDot !== this && this.neighbours.includes(prevDot) && !this.player) {
            this.player = prevDot.player
            prevDot.player = undefined
            this.r = this.player ? circleSize * 2 : circleSize
            game.mills = []
            game.checkForMill(game.dots, game.turn, true)
            game.turn = game.turn === game.playerRed ? game.playerBlue : game.playerRed
            game.checkForMill(game.dots, game.turn, true)
            return true
        } else if (this.player) {
            this.highlight = !this.highlight
            this.hlColor = color(0, 0, 255)
            for (var n of this.neighbours) {
                if (!n.player) {
                    n.highlight = !n.highlight
                    n.hlColor = color(0, 255, 0)
                }
            }
        }
        return false

    }
}