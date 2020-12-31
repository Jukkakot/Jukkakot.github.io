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
                    if ((dot.player === this.turn ||
                        this.prevDot &&
                        this.prevDot.player === this.turn &&
                        !dot.player) &&
                        pointInCircle(mX, mY, dot.x * size, dot.y * size, r)) {

                        if(dot.click(this.prevDot)){
                            this.prevDot = undefined
                            this.checkForMill(this.dots, this.turn)
                            this.turn = this.turn === this.playerRed ? this.playerBlue : this.playerRed
                        } else {
                            this.prevDot = dot
                        }
                       
                       
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
                        // dot.r = circleSize * 2
                        // this.turn.mills = []
                        // this.turn.millDots = []
                        this.checkForMill(this.dots, this.turn)
                        this.turn = this.turn === this.playerBlue ? this.playerRed : this.playerBlue

                        // this.checkForMill(this.dots, this.turn, true)
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

    checkForMill(board, player) {
        var tempMills = []
        player.mills = []
        for (var layer of board) {
            for (var i = 0; i < 8; i++) {

                if (i % 2 === 0) {
                    //i = 0,2,4,6
                    //Checking mills on layers
                    var mill = isMill(player, layer[i], layer[(i + 1) % 8], layer[(i + 2) % 8])
                    if (mill && player.isValidMill(mill)) {
                        //&& player.isValidMill(mill)
                        player.mills.push(mill)
                    }
                } else {
                    //i = 1,3,5,7
                    //Checking mills between layers (4 of them) so odd indexes
                    var mill = isMill(player, board[0][i], board[1][i], board[2][i])
                    if (mill && player.isValidMill(mill)) {
                        //&& player.isValidMill(mill)
                        player.mills.push(mill)
                    }
                }

            }
        }
        // player.mills = tempMills
        //Replacing mills for player only if they are different
        // for(var tMill of tempMills) {
        //     if(!player.isDupeMill(tMill)){
        //         player.mills = tempMills
        //         break
        //     }
        // }
        
    }
    drawMills() {
        this.playerBlue.drawMills()
        this.playerRed.drawMills()
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
    getLayer(dot) {
        for (var l in game.dots) {
            if (game.dots[l].includes(dot)) {
                return Number(l)
            }
        }
        console.log("Error?")
        return -1
    }
}
function pointInCircle(x, y, cx, cy, radius) {
    var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    return distancesquared <= radius * radius;
}
function isMill(player, d1, d2, d3) {
    if (d1.player === player && d2.player === player && d3.player === player) {
        return new Mill(d1, d2, d3)
    } else {
        return undefined
    }
}
