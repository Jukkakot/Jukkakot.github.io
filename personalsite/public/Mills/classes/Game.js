class Game {
    constructor() {
        this.dots = this.initDots()
        this.prevDot
        this.prevHover
        this.playerRed = new Player(color(255, 0, 0), redDot, "red")
        this.playerBlue = new Player(color(0, 170, 255), blueDot, "blue")
        this.turn = random(1) < 0.5 ? this.playerRed : this.playerBlue
        // this.turn = this.playerBlue
        this.gameStarted = false
        this.eatMode = false
        this.winner
        this.animations = []
    }
    draw() {

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

        // if (this.gameStarted) {
        //      Highlighting players movable dots (Used for debugging)
        //     this.turn.movableDots.forEach(dot => {
        //         dot.highlight = true
        //         dot.hlColor = color(255, 0, 255)
        //         dot.draw()
        //     })
        // }
        noStroke()
        // circle(0, 0, circleSize * 3)
        // tint(this.turn.color)

        this.drawMills()

        textAlign(CENTER)
        if (this.winner) {
            textSize(circleSize * 5)
            stroke(this.winner.color)
            text(this.winner.name + " won!", 0, 0)
            // restartButton.position(cnv.position().x + width / 2 - restartButton.width / 2, cnv.position().y + height * 0.53)
            // restartButton.size(circleSize * 15, circleSize * 3)
            // restartButton.style('font-size', circleSize * 2 + "px")
            // restartButton.style('background-color', color(0, 255, 0, 200))
            pop()
        } else {

            imageMode(CENTER);
            image(this.turn.img, 0, 0, circleSize * 3, circleSize * 3);
            noStroke()
            textSize(circleSize)
            // fill(0)
            if (this.gameStarted) {
                text("Turn:", -circleSize * 3, +circleSize / 5)
            } else if (this.eatMode) {
                text("Mill!", 0, +circleSize * 3)
            } else {
                text("Place a chip", 0, +circleSize * 3)
            }
            // fill(this.turn.color)
            pop()
        }

    }
    drawRect(w) {
        push()
        rectMode(CENTER)
        noFill()
        rect(0, 0, w, w)
        for (var l in this.dots) {
            for (var d in this.dots[l]) {
                var dot = this.dots[l][d]
                dot.draw(this.eatMode)
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
        if (this.winner) return
        var dot = this.getDot(mX, mY)
        if (!dot) {
            //unhighlight everything
            for (var layer of game.dots) {
                for (var d of layer) {
                    d.highlight = false
                }
            }
            this.prevDot = undefined
            return
        }

        if (this.eatMode) {
            if (this.turn.canEat(dot)) {
                //EATING CHIPS

                dot.player.chipCount--

                if (dot.player.chipCount < 3 && this.gameStarted) {
                    // console.log(thus.turn.name, "won!")
                    this.setWinner(this.turn)
                }

                dot.player = undefined
                this.eatMode = false

                // this.turn = this.turn === this.playerRed ? this.playerBlue : this.playerRed
                this.switchTurn()

                //Checking the mills again incase had to eat from a mill
                this.checkForMill(this.dots, this.turn)
            }
            return
        } else if (this.gameStarted) {
            //MOVING CHIPS (Stage 2)

            //unhighlighting everything at the start
            for (var layer of game.dots) {
                for (var d of layer) {
                    d.highlight = false
                }
            }
            //Check if dot is previously clicked dot
            //Check if dot is player or previous dot clicked is player (For moving purposes)
            if (dot && dot !== this.prevDot && dot.player === this.turn || (!dot.player && this.prevDot && this.prevDot.player === this.turn)) {
                //Check if moving was succesful
                if (dot.click(this.prevDot)) {
                    this.prevDot = undefined

                    //Checking if new mill was found
                    if (this.checkForMill(this.dots, this.turn)) {
                        this.eatMode = true
                    } else {
                        this.switchTurn()
                    }
                } else {
                    //This dot and its neighbours was highlighted in dots.click() method
                    this.prevDot = dot
                }
                return dot
            }
            this.prevDot = undefined
        } else if (!dot.player) {
            //PLACING CHIPS (Stage 1)

            dot.player = this.turn
            this.turn.chipCount++
            this.turn.chipsToAdd--
            this.gameStarted = this.playerRed.chipsToAdd + this.playerBlue.chipsToAdd === 0

            //Checking if new mill was found
            if (this.checkForMill(this.dots, this.turn)) {
                this.eatMode = true
            } else {
                this.switchTurn()
                // this.turn = this.turn === this.playerRed ? this.playerBlue : this.playerRed
            }
            return
        }
    }
    hover() {
        //Returning if mouse is still on the prevHover dot place
        //(Just for performance improvement)
        if (this.prevHover) {
            var size = this.prevHover.size()
            if (pointInCircle(mX, mY, this.prevHover.x * size, this.prevHover.y * size, this.prevHover.r )) {
                return
            }
        }

        var dot = this.getDot(mX, mY)
        if (dot) {
            if (this.prevHover && this.prevHover !== dot) {
                this.prevHover.hover = false
                this.prevHover = undefined
            }
            dot.hover = true
            this.prevHover = dot
        } else if (this.prevHover && this.prevHover !== dot) {
            this.prevHover.hover = false
            this.prevHover = undefined
        }

    }
    switchTurn() {
        //Unhighlighting movable dots (Used for debugging)
        // this.turn.movableDots.forEach(dot => {
        //     dot.highlight = false
        //     // dot.hlColor = color(255, 0, 255)
        // })
        this.turn = this.turn === this.playerRed ? this.playerBlue : this.playerRed
        if (this.gameStarted) {
            var movableDots = this.turn.checkMovableDots(this.dots)
            if (movableDots.length > 0) {
                this.turn.movableDots = movableDots
            } else {
                //Winner is opponent this.turn player
                var oppPlayer = this.turn === this.playerRed ? this.playerBlue : this.playerRed
                this.setWinner(oppPlayer)
            }
        }
    }
    setWinner(player) {
        this.winner = player
        restartButton.size(circleSize * 15, circleSize * 3)
        restartButton.position(cnv.position().x + width / 2 - restartButton.width / 2, cnv.position().y + height * 0.53)
        restartButton.style('font-size', circleSize * 2 + "px")
        restartButton.style('background-color', color(0, 255, 0, 200))
    }
    checkForMill(board, player) {
        var newMills = 0
        var mills = []
        for (var layer of board) {
            for (var i = 0; i < 8; i++) {
                var mill
                if (i % 2 === 0) {
                    //i = 0,2,4,6
                    //Checking mills on layers (even indexes)
                    mill = isMill(player, layer[i], layer[(i + 1) % 8], layer[(i + 2) % 8])
                } else {
                    //i = 1,3,5,7
                    //Checking mills between layers (odd indexes)
                    mill = isMill(player, board[0][i], board[1][i], board[2][i])
                }
                if (mill) {
                    if (player.isNewMill(mill)) {
                        newMills++
                    }
                    mills.push(mill)
                }
            }
        }

        //Replacing player mills with currently found mills 
        //(This will remove old mills)
        player.mills = mills
        return newMills > 0
    }
    drawMills() {
        this.playerBlue.drawMills()
        this.playerRed.drawMills()
    }
    getDot(x, y) {
        for (var layer of this.dots) {
            for (var dot of layer) {
                var size = dot.size()
                if (pointInCircle(x, y, dot.x * size, dot.y * size, dot.r)) {
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
    updateAnimations() {
        for(var dot of this.animations) {
            dot.updateAnimation()
        }
    }
}
function pointInCircle(x, y, cx, cy, radius) {
    var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    return distancesquared <= radius * radius;
}
function isMill(player, d1, d2, d3) {
    if (d1.player === player && d2.player === player && d3.player === player) {
        return new Mill(d1, d2, d3)
    }
    return undefined

}