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
        this.initExtraChips()
        this.suggestion
    }
    getEmptyDots(board) {
        var dots = []
        for (var layer of board) {
            for (var dot of layer) {
                if (!dot.player) {
                    dots.push(dot)
                }
            }
        }
        return dots
    }
    // getEmptyDots() {
    //     console.log("Hujahti tänne")
    //     var dots = []
    //     for (var layer of this.dots) {
    //         for (var dot of layer) {
    //             if (dot.player === undefined) {
    //                 dots.push(dot)
    //             }
    //         }
    //     }
    //     return dots
    // }

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
        this.drawEatenChips()
        noStroke()
        // circle(0, 0, circleSize * 3)
        // tint(this.turn.color)

        this.drawMills()

        textAlign(CENTER)
        if (this.winner) {
            textSize(circleSize * 5)
            stroke(this.winner.color)
            text(this.winner.name + " won!", 0, 0)
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
        for (var l = 0; l < 3; l++) {
            var rect = []
            //Top
            rect.push(new Dot(-1, -1, l, 0))
            rect.push(new Dot(0, -1, l, 1))
            rect.push(new Dot(1, -1, l, 2))
            //Right
            rect.push(new Dot(1, 0, l, 3))
            //Bottom
            rect.push(new Dot(1, 1, l, 4))
            rect.push(new Dot(0, 1, l, 5))
            rect.push(new Dot(-1, 1, l, 6))
            //Left
            rect.push(new Dot(-1, 0, l, 7))
            dots.push(rect)
        }
        //Adding neighbours to dots
        for (var l in dots) {
            for (var dot in dots[l]) {
                dot = Number(dot)
                var currD = dots[l][dot]
                var nextD = dot < 7 ? dots[l][dot + 1] : dots[l][0]
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
    //Initializes start chips and eaten chips
    initExtraChips() {
        for (var i = 0; i < MAXCHIPCOUNT / 2; i++) {
            //Start chips
            var dot = new Dot(-1.4 + i / 10, -1.7, -1, -1, true)
            dot.player = this.playerBlue
            this.playerBlue.startChips.push(dot)

            dot = new Dot(1.4 - i / 10, -1.7, -1, -1, true)
            dot.player = this.playerRed
            this.playerRed.startChips.push(dot)

            //Eaten chips
            dot = new Dot(-1.4 + i / 10, 1.7, -1, -1, true)
            dot.player = this.playerBlue
            dot.visible = false
            this.playerBlue.eatenChips.push(dot)

            dot = new Dot(1.4 - i / 10, 1.7, -1, -1, true)
            dot.player = this.playerRed
            dot.visible = false
            this.playerRed.eatenChips.push(dot)
        }
    }
    drawEatenChips() {
        this.playerBlue.eatenChips.forEach(chip => chip.draw())
        this.playerRed.eatenChips.forEach(chip => chip.draw())
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
                this.eatChip(dot)
            }
            return
        } else if (this.gameStarted) {
            //MOVING CHIPS (Stage 2)

            //unhighlighting everything at the start
            for (var layer of this.dots) {
                for (var d of layer) {
                    d.highlight = false
                }
            }

            //Check if dot is player or previous dot clicked is player (For moving purposes)
            if (dot && dot.player === this.turn || (!dot.player && this.prevDot && this.prevDot.player === this.turn)) {
                //Check if moving was succesful
                if (dot.click(this.prevDot)) {
                    this.prevDot = undefined
                    this.switchTurn()
                } else {
                    //This dot and its neighbours was highlighted in dots.click() method
                    this.prevDot = dot
                }
                //using return value on mouse dragging
                return dot
            }
            this.prevDot = undefined
        } else if (!dot.player) {
            //Placing chips (Stage 1)
            this.playRound(dot)
        }
    }
    eatChip(dot) {
        dot.player.chipCount--
        if (dot.player.chipCount < 3 && this.gameStarted) {
            // console.log(thus.turn.name, "won!")
            this.setWinner(this.turn)
        }
       

        this.turn.eatenChips[this.turn.eatenChipsCount].setTargetDot(dot)
        this.turn.eatenChips[this.turn.eatenChipsCount++].visible = true
        
        this.eatMode = false
        this.eatableAnimations = []
        dot.player = undefined
        
        this.switchTurn()

        //Checking the mills again incase had to eat from (at the time) opponents  mill
        this.checkNewMills(this.dots, this.turn)
    }
    clearSuggestion() {
        if (!this.suggestion) return
        for (var dot of this.suggestion) {
            this.dots[dot.l][dot.d].suggested = false
        }
        this.suggestion = undefined
    }
    setSuggestion(move) {
        this.clearSuggestion()

        if (this.gameStarted) {
            this.suggestion = move
            for (var dot of move) {
                dot = this.dots[dot.l][dot.d]
                dot.suggested = true
            }
        } else {
            this.suggestion = [move]
            dot = this.dots[move.l][move.d]
            dot.suggested = true
        }
    }
    placeChip(dot) {
        dot = this.dots[dot.l][dot.d]
        dot.player = this.turn
        // setPlayerTo(this.dots, this.turn, dot)
        this.turn.chipCount++
        this.turn.chipsToAdd--

        var prevDot = this.turn.startChips.pop()
        dot.setTargetDot(prevDot)

        //Checking if all chips has been added
        this.gameStarted = this.playerRed.chipsToAdd + this.playerBlue.chipsToAdd === 0

        this.switchTurn()

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
        var movableDots = this.checkMoveableDots(board, player)
        player.movableDots = movableDots
        return movableDots.length > 0
    }
    checkMoveableDots(board, player) {
        var movableDots = []
        for (var layer of board) {
            for (var dot of layer) {

                //Check if player has 3 chips left or dots neighbours has empty dot
                if (dot.player && dot.player.name == player.name && (player.chipCount === 3 || dot.neighbours.some(nDot => !nDot.player))) {
                    movableDots.push(dot)
                }
            }
        }
        return movableDots
    }
    switchTurn() {
        this.clearSuggestion()

        //Checking for new mills before switching turn
        if (this.checkNewMills(this.dots, this.turn)) {
            this.eatMode = true
            return
        }

        this.turn = this.turn === this.playerRed ? this.playerBlue : this.playerRed
        //Checking if opponent can move
        if (this.gameStarted && !this.checkIfCanMove(this.turn, this.dots)) {
            var oppPlayer = this.turn === this.playerRed ? this.playerBlue : this.playerRed
            this.setWinner(oppPlayer)
        }
        if (AUTOPLAY && this.turn === this.playerBlue && !this.eatMode) {
            this.playRound(this.findBestMove())
        }
    }
    playRound(move) {
        if (this.movingAnimations.length > 0) {
            console.log("no spam clicking")
            return
        }
        if (this.eatMode) {
            return
            //TODO
            //this.eatChip(move)
        } else if (!this.gameStarted && this.turn.chipsToAdd > 0) {
            this.placeChip(move)
        } else {
            this.moveChip(move)
        }
    }
    moveChip(move) {
        var fromDot = move[0]
        var toDot = move[1]
        //Have to find the "same" dot from this.dots because given dots are cloned dots so they are not the same
        fromDot = this.dots[fromDot.l][fromDot.d]
        toDot = this.dots[toDot.l][toDot.d]

        toDot.setTargetDot(fromDot)
        this.switchTurn()
        // //unhighlighting everything at the end
        // for (var layer of this.dots) {
        //     for (var d of layer) {
        //         d.highlight = false
        //     }
        // }
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
        // console.log("checking for mill",player.name)
        var newMills = 0
        var mills = []
        for (var layer of board) {
            for (var d = 0; d < 8; d++) {
                var mill
                if (d % 2 === 0) {
                    //d = 0,2,4,6
                    //Checking mills on layers (even indexes)
                    mill = isMill(player, layer[d], layer[(d + 1) % 8], layer[(d + 2) % 8])
                } else if (layer[d].l === 0) {
                    //This only needs to be checked once and not on every layer (it caused duplicated mills otherwise)
                    //d = 1,3,5,7
                    //Checking mills between layers (odd indexes)
                    mill = isMill(player, board[0][d], board[1][d], board[2][d])
                }
                if (mill) {
                    if (isNewMill(player, mill)) {
                        newMills++
                    }
                    if (!mills.includes(mill)) {
                        mills.push(mill)
                    }

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
                var r = dot.r
                if (!dot.player) r *= 1.3
                if (pointInCircle(x, y, dot.x * size, dot.y * size, r)) {
                    return dot
                }
            }
        }
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
        //Only allow this when on stage 1 and not on eating mode
        if (this.eatMode) {
            console.log("Bot can't eat yet")
            return
        }

        var player = this.turn === this.playerRed ? deepClone(this.playerRed) : deepClone(this.playerBlue)
        var oppPlayer = this.turn === this.playerRed ? deepClone(this.playerBlue) : deepClone(this.playerRed)
        var cBoard = deepClone(this.dots)

        let move
        let bestScore = -Infinity
        //this for loop is to prioritize earlier win or mill
        for (var depth = 1; depth < 4; depth++) {
            // var depth = 4
            let result = minimax(cBoard, player, oppPlayer, depth, -Infinity, Infinity, true)
            move = result[0]
            bestScore = result[1]
            if (bestScore >= 90) {
                break
            }
        }
        //Play the best move
        if (move && move.length === 1) {
            move = move[0]
            console.log("Stage 1", "x", move.x, "y", move.y, "l", move.l, "score", bestScore)
            return move
        } else if (move && move.length === 2) {
            var fromDot = move[0]
            var toDot = move[1]
            console.log("Stage 2", "from", [fromDot.l, fromDot.d], "to", [toDot.l, toDot.d], "score", bestScore)
            return move
        } else {
            console.log("Couldn't find a move")
        }
    }
}
function scoreWindow(window, player, oppPlayer) {
    if (window.length !== 3) {
        console.log("not 3 length window", window)
    }
    var value = 0

    var pieceCount = window.filter(chip => chip.player && chip.player.name == player.name).length
    var emptyCount = window.filter(chip => !chip.player).length
    var oppCount = window.filter(chip => chip.player && chip.player.name == oppPlayer.name).length
    if (pieceCount + emptyCount + oppCount !== 3) {
        console.log(pieceCount, emptyCount, oppCount, window)
        console.log("Shouldn't happen?")
    }

    //Mill
    if (pieceCount === 3) value += 400
    //OppMill
    else if (oppCount === 3) value -= 300
    //blocking opp mill
    else if (oppCount === 2 && pieceCount === 1) value += 30
    //almost mill
    else if (pieceCount === 2 && emptyCount === 1) value += 4
    //Opponent almost mill
    else if (oppCount === 2 && emptyCount === 1) value -= 4

    return value
}
function scoreBoard(board, player, oppPlayer) {
    var value = 0

    //Giving points for neighbour dots
    for (var layer of board) {
        for (var dot of layer) {
            if (!dot.player) continue
            if (dot.player.name == player.name) {
                value += dot.neighbours.length * 2
            } else {
                value -= dot.neighbours.length * 2
            }
        }
    }
    for (var layer of board) {
        for (var d = 0; d < 8; d++) {
            d
            var window
            if (d % 2 === 0) {
                //i = 0,2,4,6
                //Checking window on layers (even indexes)
                window = [layer[d], layer[(d + 1) % 8], layer[(d + 2) % 8]]
                value += scoreWindow(window, player, oppPlayer)
            } else {
                //i = 1,3,5,7
                //Checking window between layers (odd indexes)
                window = [board[0][d], board[1][d], board[2][d]]
                value += scoreWindow(window, player, oppPlayer)
            }
        }
    }

    return value
}
function minimax(board, player, oppPlayer, depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
        return [undefined, scoreBoard(board, player, oppPlayer)]
    }
    if (player.chipsToAdd !== 0 || oppPlayer.chipsToAdd !== 0) {
        return stage1MinMax(board, player, oppPlayer, depth, alpha, beta, isMaximizing)
    } else {
        if (player.chipCount === 3 || oppPlayer.chipCount === 3) {
            //Checking wins
            if (game.checkIfLost(board, oppPlayer)) {
                console.log("winner")
                return [undefined, 100000000]
            } else if (game.checkIfLost(board, player)) {
                console.log("loser")
                return [undefined, -100000000]
            }
        }
        return stage2MinMax(board, player, oppPlayer, depth, alpha, beta, isMaximizing)
    }
}
function movePlayerTo(board, player, fromDot, toDot) {
    board[toDot.l][toDot.d].player = player
    board[fromDot.l][fromDot.d].player = undefined
}
function stage2MinMax(board, player, oppPlayer, depth, alpha, beta, isMaximizing) {
    if (isMaximizing) {
        let bestScore = -Infinity
        let bestMove

        for (var fromDot of game.checkMoveableDots(board, player)) {
            //If player can fly, we check fromDot against every empty dot on the board
            var neighbours
            if (player.chipCount === 3) {
                neighbours = game.getEmptyDots(board)
            } else {
                neighbours = fromDot.neighbours
            }
            for (var toDot of neighbours) {
                //toDot has to be empty dot
                if (toDot.player) continue

                var cBoard = deepClone(board)
                var cPlayer = deepClone(player)
                var cOppPlayer = deepClone(oppPlayer)
                //Making the move
                movePlayerTo(cBoard, cPlayer, fromDot, toDot)

                let score = minimax(cBoard, cPlayer, cOppPlayer, depth - 1, alpha, beta, false)[1]

                if (score > bestScore) {
                    bestScore = score
                    bestMove = [fromDot, toDot]
                }
                alpha = max(bestScore, alpha)
                if (alpha >= beta)
                    return [bestMove, bestScore]
            }
        }
        return [bestMove, bestScore]
    } else {
        let bestScore = Infinity;
        let bestMove

        for (var fromDot of game.checkMoveableDots(board, oppPlayer)) {
            //If player can fly, we check fromDot against every empty dot on the board
            var neighbours
            if (oppPlayer.chipCount === 3) {
                neighbours = game.getEmptyDots(board)
            } else {
                neighbours = fromDot.neighbours
            }
            for (var toDot of neighbours) {
                //toDot has to be empty dot
                if (toDot.player) continue

                var cBoard = deepClone(board)
                var cPlayer = deepClone(player)
                var cOppPlayer = deepClone(oppPlayer)
                //Making the move
                movePlayerTo(cBoard, cOppPlayer, fromDot, toDot)

                let score = minimax(cBoard, cPlayer, cOppPlayer, depth - 1, alpha, beta, true)[1]

                if (score < bestScore) {
                    bestScore = score
                    bestMove = [fromDot, toDot]
                }
                beta = min(bestScore, beta)
                if (alpha >= beta)
                    return [bestMove, bestScore]
            }
        }
        return [bestMove, bestScore]
    }
}

function stage1MinMax(board, player, oppPlayer, depth, alpha, beta, isMaximizing) {

    if (isMaximizing) {
        let bestScore = -Infinity
        let bestMove

        for (var dot of game.getEmptyDots(board)) {
            var cBoard = deepClone(board)
            var cPlayer = deepClone(player)
            var cOppPlayer = deepClone(oppPlayer)
            //Making the move
            // setPlayerTo(cBoard, cPlayer, dot)
            cBoard[dot.l][dot.d].player = cPlayer
            let score = minimax(cBoard, cPlayer, cOppPlayer, depth - 1, alpha, beta, false)[1]

            if (score > bestScore) {
                bestScore = score
                bestMove = [dot]
            }
            alpha = max(bestScore, alpha)
            if (alpha >= beta)
                break
        }
        return [bestMove, bestScore]
    } else {
        let bestScore = Infinity;
        let bestMove

        for (var dot of game.getEmptyDots(board)) {
            var cBoard = deepClone(board)
            var cPlayer = deepClone(player)
            var cOppPlayer = deepClone(oppPlayer)
            //Making the move
            // setPlayerTo(cBoard, cOppPlayer, dot)
            cBoard[dot.l][dot.d].player = cOppPlayer
            let score = minimax(cBoard, cPlayer, cOppPlayer, depth - 1, alpha, beta, true)[1]

            if (score < bestScore) {
                bestScore = score
                bestMove = [dot]
            }
            beta = min(bestScore, beta)
            if (alpha >= beta)
                break
        }
        return [bestMove, bestScore]
    }
}
function pointInCircle(x, y, cx, cy, radius) {
    var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    return distancesquared <= radius * radius;
}
//isMill does not check if dots are next to eachother
function isMill(player, d1, d2, d3) {

    //All dots must have a player
    if (!d1.player || !d2.player || !d3.player) {
        // console.log("dots included empty dot")
        return undefined
    }

    //All dots must be unique
    if (d1 === d2 || d2 === d3 || d1 === d3) {
        // console.log("dots has duplicates")
        return undefined
    }

    //All dots must have same player
    //Have to compare player names cause players are deepcloned so player objects might not match
    if (d1.player.name != player.name || d2.player.name != player.name || d3.player.name != player.name) {
        // console.log("dots players didn't match")
        return undefined
    }

    //Checking that one of the dots contains 2 of the other dots in its neighbours
    //Aka, all dots are next to eachother
    //d2 neighbours should always include d1/d3 cause its the middle dot?
    if (!d2.neighbours.includes(d1) || !d2.neighbours.includes(d3)) {
        console.table(d1)
        console.table(d2)
        console.table(d3)
        console.log("dots were not next to eachother")
        return undefined
    }
    return new Mill(d1, d2, d3)
}
function isNewMill(player, mill) {
    for (var m of player.mills) {
        if (mill.id == m.id) {
            return false
        }
    }
    return true
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