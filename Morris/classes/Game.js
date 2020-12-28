class Game {
    constructor() {
        this.dots = this.initDots()
        this.prevDot
        this.playerB = new Player(color(0))
        this.playerW = new Player(color(255))
        this.turn = random(1) < 0.5 ? this.playerB : this.playerW
        this.gameStarted = false
    }
    drawBoard() {
        push()
        strokeWeight(circleSize / 5)

        var startX = (outBoxSize - distance) / 2 - distance / 2
        var end = startX + distance
        line(startX, 0, end, 0)
        line(-startX, 0, -end, 0)
        line(0, -startX, 0, -end)
        line(0, startX, 0, end)

        for (var layers = 0; layers < 3; layers++) {
            this.drawRect(outBoxSize - distance * layers)
        }
        textSize(30)
        fill(0)
        textAlign(CENTER)
        if (this.gameStarted) {
            text("Turn:",-circleSize*3,+circleSize/5)
        } else {
            text("Place your chips", 0, +circleSize*3)
        }
        fill(this.turn.color)
        noStroke()
        circle(0,0,circleSize*3)
        pop()
    }
    drawRect(w) {
        push()
        rectMode(CENTER)
        noFill()
        rect(0, 0, w, w)
        for (var l in this.dots) {
            for (var d in this.dots[l]) {
                var dot = this.dots[l][d]
                dot.draw(l, d)
            }
        }
        pop()
    }
    initDots() {
        var dots = []
        for (var layers = 0; layers < 3; layers++) {
            var rect = []
            //Top
            rect.push(new Dot(-1, -1))
            rect.push(new Dot(0, -1))
            rect.push(new Dot(1, -1))
            //Right
            rect.push(new Dot(1, 0))
            //Bottom
            rect.push(new Dot(1, 1))
            rect.push(new Dot(0, 1))
            rect.push(new Dot(-1, 1))
            //Left
            rect.push(new Dot(-1, 0))
            dots.push(rect)
        }
        //Adding neighbours to dots
        for (var l in dots) {
            for (var d in dots[l]) {
                d = Number(d)
                var currD = dots[l][d]
                var nextD = d < 7 ? dots[l][d + 1] : dots[l][0]
                nextD.neighbours.push(currD)
                currD.neighbours.push(nextD)
            }
        }

        for (var i = 1; i < 8; i += 2) {
            dots[0][i].neighbours.push(dots[1][i])
            dots[1][i].neighbours.push(dots[0][i], dots[2][i])
            dots[2][i].neighbours.push(dots[1][i])
        }
        return dots
    }
    click() {
        if (this.gameStarted) {
            if (this.prevDot) {
                this.prevDot.highlight = false
                for (var n of this.prevDot.neighbours) {
                    n.highlight = false
                }
            }
            for (var l in this.dots) {
                for (var dot of this.dots[l]) {
                    var size = (outBoxSize - distance * l) / 2
                    if ((dot.player === this.turn || this.prevDot && this.prevDot.player === this.turn && !dot.player) && pointInCircle(mX, mY, dot.x * size, dot.y * size, dot.r / 2)) {
                        this.prevDot = dot.click(this.prevDot) ? undefined : dot
                        return
                    }
                }
            }
            this.prevDot = undefined
        } else {
            for (var l in this.dots) {
                for (var dot of this.dots[l]) {
                    var size = (outBoxSize - distance * l) / 2
                    if (!dot.player && pointInCircle(mX, mY, dot.x * size, dot.y * size, dot.r)) {
                        this.turn.chipCount++
                        dot.player = this.turn
                        dot.r = circleSize * 2
                        this.turn = this.turn === this.playerW ? this.playerB : this.playerW
                        this.gameStarted = this.playerB.chipCount + this.playerW.chipCount === 4
                    }
                }
            }
        }
        
    }
    hover() {
        for (var l in this.dots) {
            for (var dot of this.dots[l]) {
                var size = (outBoxSize - distance * l) / 2
                dot.hover = pointInCircle(mX, mY, dot.x * size, dot.y * size, dot.r )
            }
        }
    }
}
function pointInCircle(x, y, cx, cy, radius) {
    var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    return distancesquared <= radius * radius;
}