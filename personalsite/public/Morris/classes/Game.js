class Game {
    constructor() {
        this.dots = this.initDots()
        this.prevDot
        this.prevHover
        this.playerRed = new Player(color(255, 0, 0), redDot)
        this.playerBlue = new Player(color(0, 170, 255), blueDot)
        this.turn = random(1) < 0.5 ? this.playerRed : this.playerBlue
        // this.turn = this.playerBlue
        this.gameStarted = false
        this.mills = []
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

        this.drawMills()
        textSize(circleSize)
        fill(0)
        textAlign(CENTER)
        if (this.gameStarted) {
            text("Turn:", -circleSize * 3, +circleSize / 5)
        } else {
            text("Place your chips", 0, +circleSize * 3)
        }
        // fill(this.turn.color)
        noStroke()
        // circle(0, 0, circleSize * 3)
        // tint(this.turn.color)
        imageMode(CENTER);
        image(this.turn.img, 0, 0, circleSize * 3, circleSize * 3);

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
                var size = (outBoxSize - distance * l) / 2
                for (var dot of this.dots[l]) {
                    var r = dot.player ? dot.r * 0.6 : dot.r * 2
                    if ((dot.player === this.turn || this.prevDot && this.prevDot.player === this.turn && !dot.player) &&
                        pointInCircle(mX, mY, dot.x * size, dot.y * size, r)) {
                        this.prevDot = dot.click(this.prevDot) ? undefined : dot
                        return dot
                    }
                }
            }
            this.prevDot = undefined
        } else {
            for (var l in this.dots) {
                var size = (outBoxSize - distance * l) / 2
                for (var dot of this.dots[l]) {
                    var r = dot.player ? dot.r * 0.6 : dot.r * 2
                    if (!dot.player && pointInCircle(mX, mY, dot.x * size, dot.y * size, r)) {
                        this.turn.chipCount++
                        dot.player = this.turn
                        dot.r = circleSize * 2
                        this.mills = []
                        this.checkForMill(this.dots, this.turn, true)
                        this.turn = this.turn === this.playerBlue ? this.playerRed : this.playerBlue
                        this.checkForMill(this.dots, this.turn, true)
                        this.gameStarted = this.playerRed.chipCount + this.playerBlue.chipCount >= MAXCHIPCOUNT
                    }
                }
            }
        }

    }
    hover() {
        if (this.prevHover) {
            var r = this.prevHover.player ? this.prevHover.r * 0.6 : this.prevHover.r * 2
            if (pointInCircle(mX, mY, this.prevHover.x * size, this.prevHover.y * size, r)) return
        }
        for (var l in this.dots) {
            var size = (outBoxSize - distance * l) / 2
            for (var dot of this.dots[l]) {
                var r = dot.player ? dot.r * 0.6 : dot.r * 2
                if (pointInCircle(mX, mY, dot.x * size, dot.y * size, r)) {
                    if (this.prevHover && this.prevHover !== dot) {
                        this.prevHover.hover = false
                        this.prevHover = undefined
                    }
                    dot.hover = true
                    this.prevHover = dot
                    return
                }
            }

        }
        if (this.prevHover && this.prevHover !== dot) {
            this.prevHover.hover = false
            this.prevHover = undefined
        }
    }

    checkForMill(board, player, drawMills) {
        for (var l in board) {
            var size = (outBoxSize - distance * l) / 2
            for (var i = 0; i < 7; i += 2) {
                var layer = board[l]
                var isMill = true
                for (var j = 0; j < 3; j++) {
                    var index = (i + j) % 8
                    if (!layer[index].player || layer[index].player !== player) {
                        isMill = false
                        break
                    }
                }
                if (isMill && drawMills) {
                    var line = [player.color, layer[i].x * size, layer[i].y * size, layer[(i + 2) % 8].x * size, layer[(i + 2) % 8].y * size]
                    this.mills.push(line)
                }

            }
            for (var i = 1; i < 8; i += 2) {
                if (this.dots[0][i].player === player &&
                    this.dots[1][i].player === player &&
                    this.dots[2][i].player === player) {
                    var size1 = (outBoxSize - distance * 0) / 2
                    var size2 = (outBoxSize - distance * 2) / 2
                    if (drawMills) {
                        var line = [player.color, this.dots[0][i].x * size1, this.dots[0][i].y * size1, this.dots[2][i].x * size2, this.dots[2][i].y * size2]
                        this.mills.push(line)
                    }
                }
            }
        }
    }
    drawMills() {
        push()
        for (var l of this.mills) {
            stroke(l[0])
            strokeWeight(circleSize / 5)
            line(l[1], l[2], l[3], l[4])
        }
        pop()
    }
    getDot(x, y) {
        for (var l in this.dots) {
            var size = (outBoxSize - distance * l) / 2
            for (var dot of this.dots[l]) {
                var r = dot.player ? dot.r * 0.6 : dot.r * 2
                if (pointInCircle(x, y, dot.x * size, dot.y * size, r)) {
                    this.prevDot = dot.click(this.prevDot) ? undefined : dot
                    return dot
                }
            }
        }
    }
}
function pointInCircle(x, y, cx, cy, radius) {
    var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    return distancesquared <= radius * radius;
}
function isMill(player, d1, d2, d3) {
    return d1.player === d2.player === d3.player === player
}
