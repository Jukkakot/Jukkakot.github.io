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
        this.movingAnimations = []
        this.eatableAnimations = []
        this.initStartChips()
    }
    getEmptyDots() {
        var dots = []
        for (var layer of this.dots) {
            for (var dot of layer) {
                if (dot.player === undefined) {
                    dots.push(dot)
                }
            }
        }
        return dots
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
        this.drawStartChips()
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
    initStartChips() {
        for (var i = 0; i < MAXCHIPCOUNT / 2; i++) {
            var dot = new Dot(-1.4 + i / 10, -1.7, true)
            dot.player = this.playerBlue
            this.playerBlue.startChips.push(dot)

            var dot = new Dot(1.4 - i / 10, -1.7, true)
            dot.player = this.playerRed
            this.playerRed.startChips.push(dot)
        }
    }
    drawStartChips() {
        this.playerBlue.startChips.forEach(chip => chip.draw())
        this.playerRed.startChips.forEach(chip => chip.draw())
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
                this.eatableAnimations = []
                // this.turn = this.turn === this.playerRed ? this.playerBlue : this.playerRed
                this.switchTurn()

                //Checking the mills again incase had to eat from a mill
                this.checkNewMills(this.dots, this.turn)
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
            if (dot  && dot.player === this.turn || (!dot.player && this.prevDot && this.prevDot.player === this.turn)) {
                //Check if moving was succesful
                if (dot.click(this.prevDot)) {
                    this.prevDot = undefined

                    //Checking if new mill was found
                    if (this.checkNewMills(this.dots, this.turn)) {
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
            this.placeAChip(dot)
        }
    }
    placeAChip(cDot) {
        //First need to find the actual dot from board (given dot is a copy from a copied board)
        for (var dot of game.getEmptyDots()) {
            
            if (dot.getLayer() === cDot.getLayer() && dot.getDotIndex() === cDot.getDotIndex()) {
                // console.log("onko true", dot === cDot)
                dot.player = this.turn
                this.turn.chipCount++
                this.turn.chipsToAdd--

                var prevDot = this.turn.startChips.pop()
                dot.setTargetDot(prevDot)

                this.gameStarted = this.playerRed.chipsToAdd + this.playerBlue.chipsToAdd === 0

                //Checking if new mill was found
                if (this.checkNewMills(this.dots, this.turn)) {
                    this.eatMode = true
                } else {
                    this.switchTurn()
                    // this.turn = this.turn === this.playerRed ? this.playerBlue : this.playerRed
                }
                return
            }
        }
        console.log("Ei pitäs mennä tänne")
    }
    hover() {
        //Returning if mouse is still on the prevHover dot place
        //(Just for performance improvement)
        if (this.prevHover) {
            var size = this.prevHover.size()
            if (pointInCircle(mX, mY, this.prevHover.x * size, this.prevHover.y * size, this.prevHover.r)) {
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
    checkIfCanMove(player, board) {
        var movableDots = player.checkMovableDots(board)
        if (movableDots.length > 0) {
            player.movableDots = movableDots
            return true
        } else {
            return false
        }

    }
    switchTurn() {
        //Unhighlighting movable dots (Used for debugging)
        // this.turn.movableDots.forEach(dot => {
        //     dot.highlight = false
        //     // dot.hlColor = color(255, 0, 255)
        // })
        this.turn = this.turn === this.playerRed ? this.playerBlue : this.playerRed
        //Checking if opponent can move
        if (this.gameStarted && !this.checkIfCanMove(this.turn, this.dots)) {
            var oppPlayer = this.turn === this.playerRed ? this.playerBlue : this.playerRed
            this.setWinner(oppPlayer)
        }
    }
    checkIfLost(board, player) {
        if (player.chipCount < 3 || !this.checkIfCanMove(player, board)) {
            return true
        } else {
            return false
        }
    }
    setWinner(player) {
        this.winner = player
        restartButton.size(circleSize * 15, circleSize * 3)
        restartButton.position(cnv.position().x + width / 2 - restartButton.width / 2, cnv.position().y + height * 0.53)
        restartButton.style('font-size', circleSize * 2 + "px")
        restartButton.style('background-color', color(0, 255, 0, 200))
    }
    checkNewMills(board, player) {
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
    //Returns a dot at given coordinates (Like cursor place)
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
        for (var l in this.dots) {
            if (this.dots[l].includes(dot)) {
                return Number(l)
            }
        }
        console.log("Error when getting layer")
        return -1
    }
    updateAnimations() {
        for (var dot of this.movingAnimations) {
            dot.updateMovingAnimation()
        }
        for (var dot of this.eatableAnimations) {
            dot.updateEatableAnimation()
        }
        ANGLE += SPEED
        // ANGLE = ANGLE % PI
    }
    findBestMove() {
        // var copyGrid = JSON.parse(JSON.stringify(this.grid));
        // var cPlayerRed = CircularJSON.parse(CircularJSON.stringify(this.playerRed));
        // var cPlayerBlue = CircularJSON.parse(CircularJSON.stringify(this.playerBlue));
        // var cBoard = CircularJSON.parse(CircularJSON.stringify(this.dots));
        console.log(this.playerRed)
        var cPlayerRed = JSON.parse(JSON.stringify(this.playerRed));
        console.log(cPlayerRed)
        var cPlayerBlue = JSON.parse(JSON.stringify(this.playerBlue));
        var cBoard = deepClone(this.dots)
        console.log(cBoard)
        let move
        let bestScore = -Infinity
        var depth = 100
        let result = minimax(cBoard, cPlayerRed, cPlayerBlue, depth, -Infinity, Infinity, true)
        move = result[0]
        bestScore = result[1]
        // if (bestScore >= 100000000) break

        // console.log("depth", depth, "best score", bestScore, "move", move, this.grid)

        //Play the best move
        console.log("Suggesting", move, bestScore)
        this.placeAChip(move)
    }
}

function minimax(board, playerRed, playerBlue, depth, alpha, beta, isMaximizing) {
    //Checking wins
    // let blueCheck = game.checkNewMills(board, game.playerBlue)
    // let redCheck = game.checkNewMills(board, game.playerRed)
    // if (blueCheck !== undefined || redCheck !== undefined) {
    //     if (yellowCheck) {
    //         return [undefined, 100000000]
    //     } else if (redCheck) {
    //         return [undefined, -100000000]
    //     } else if (yellowCheck === "tie" || redCheck === "tie") {
    //         return [undefined, 0]
    //     }
    // } else if (depth === 0) {
    //     return [undefined, scoreBoard(board, game.playerYellow)]
    // }
    if (depth === 0) {
        return [undefined, scoreBoard(board, playerBlue, playerRed)]
    }

    if (isMaximizing) {
        let bestScore = -Infinity
        let bestMove
        console.log(playerBlue.checkMovableDots(board))
        for (var dot of playerBlue.checkMovableDots(board)) {
            for (var nDot of dot.getNeighbours()) {

                //Making the move
                nDot.player = playerBlue
                console.log("before clone",board)
                var cBoard = deepClone(board)
                console.log("after clone",board)
                let score = minimax(cBoard, playerRed, playerBlue, depth - 1, alpha, beta, false)[1]
                // bestScore = max(score, bestScore)
                if (score > bestScore) {
                    bestScore = score
                    bestMove = nDot
                }
                alpha = max(bestScore, alpha)
                if (alpha >= beta)
                    break

            }
        }
        return [bestMove, bestScore]
    } else {
        let bestScore = Infinity;
        let bestMove

        for (var dot of  playerRed.checkMovableDots(board)) {
            for (var nDot of dot.getNeighbours()) {

                //Making the move
                nDot.player = playerRed

                var cBoard = deepClone(board)
                cBoard[column].push(game.playerRed.name)
                let score = minimax(cBoard, playerRed, playerBlue, depth - 1, alpha, beta, true)[1]
                // bestScore = min(score, bestScore);
                if (score < bestScore) {
                    bestScore = score
                    bestMove = nDot
                }
                beta = min(bestScore, beta)
                if (alpha >= beta)
                    break

            }
        }
        return [bestMove, bestScore]
    }
}
function scoreBoard(board, player, oppPlayer) {
    var value = 0

    //Checking for new mills
    if (game.checkNewMills(board, player)) {
        value += 100
    } else if (game.checkNewMills(board, oppPlayer)) {
        value -= 100
    }
    return value
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
function deepClone(obj) {
    var visitedNodes = [];
    var clonedCopy = [];
    function clone(item) {
        if (typeof item === "object" && !Array.isArray(item)) {
            if (visitedNodes.indexOf(item) === -1) {
                visitedNodes.push(item);
                var cloneObject = {};
                clonedCopy.push(cloneObject);
                for (var i in item) {
                    if (item.hasOwnProperty(i)) {
                        cloneObject[i] = clone(item[i]);
                    }
                }
                return cloneObject;
            } else {
                return clonedCopy[visitedNodes.indexOf(item)];
            }
        }
        else if (typeof item === "object" && Array.isArray(item)) {
            if (visitedNodes.indexOf(item) === -1) {
                var cloneArray = [];
                visitedNodes.push(item);
                clonedCopy.push(cloneArray);
                for (var j = 0; j < item.length; j++) {
                    cloneArray.push(clone(item[j]));
                }
                return cloneArray;
            } else {
                return clonedCopy[visitedNodes.indexOf(item)];
            }
        }

        return item; // not object, not array, therefore primitive
    }
    return clone(obj);
}