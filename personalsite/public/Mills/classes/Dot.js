class Dot {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.player
        this.r = this.player ? circleSize * 2 : circleSize
        this.highlight = false
        this.hlColor = color(0, 255, 0)
        this.hover = false
        this.neighbours = []
        this.moving = false
    }
    size() {
        return (outBoxSize - distance * game.getLayer(this)) / 2
    }

    draw(eatMode) {
        // this.player = game.playerBlue
        var size = (outBoxSize - distance * game.getLayer(this)) / 2
        push()
        if (this.player && !this.moving) {
            this.r = circleSize * 2
            strokeWeight(this.r / 10)
            if (this.hover) this.r *= 1.3
            this.highlight ? stroke(this.hlColor) : noStroke()

            if (eatMode && this.player.canEat(this)) {
                stroke(color(0, 255, 0))
            }
            noFill()
            circle(this.x * size, this.y * size, this.r * 1.1)

            imageMode(CENTER);
            image(this.player.img, this.x * size, this.y * size, this.r, this.r);

            //Text labels to help debugging
            // fill(0, 50, 255)
            // textAlign(CENTER)
            // textSize(circleSize)
            // text(l + "," + d, this.x * size, this.y * size - circleSize * 1.2)
            // text(this.x + "," + this.y, this.x * size, this.y * size + circleSize * 1.5)
        } else {
            this.r = circleSize
            noStroke()
            if (this.hover) this.r *= 1.3
            this.highlight ? fill(this.hlColor) : fill(0)
            circle(this.x * size, this.y * size, this.r)
        }
        //Text labels to help debugging
        // var l = game.getLayer(this)
        // var d = game.dots[l].indexOf(this)
        // fill(0, 50, 255)
        // textAlign(CENTER)
        // textSize(circleSize)
        // text(l + "," + d, this.x * size, this.y * size - circleSize * 0.7)
        // text(this.x + "," + this.y, this.x * size, this.y * size + circleSize * 1.2)
        pop()
    }
    move(x, y) {
        push()
        this.r = circleSize * 2
        imageMode(CENTER);
        image(this.player.img, x, y, this.r, this.r);
        pop()
    }
    click(prevDot) {
        if (prevDot && prevDot !== this && !this.player) {

            if (this.neighbours.includes(prevDot) || prevDot.player.chipCount <= 3) {
                //Succesful move to neighbour dot
                this.player = prevDot.player
                prevDot.player = undefined
                return true
            }

        } else if (this.player) {
            this.highlight = !this.highlight
            this.hlColor = color(0, 0, 255)

            if (this.player.chipCount > 3) {
                //Highlighting neighbours
                for (var n of this.neighbours) {
                    if (!n.player) {
                        n.highlight = !n.highlight
                        n.hlColor = color(0, 255, 0)
                    }
                }
            } else {
                //Highlighting all empty dots
                for (var layer of game.dots) {
                    for (var dot of layer) {
                        if (!dot.player) {
                            dot.highlight = true
                            dot.hlColor = color(0, 255, 0)
                        }
                    }
                }
            }

        }
        return false
    }
}