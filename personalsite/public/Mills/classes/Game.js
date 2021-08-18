class Game {
    constructor() {
        this.dots = this.initDots()
        this.prevDot
        this.prevHover
        this.playerDark = new Player(color(100, 60, 20), darkDot, "Dark wood")
        this.playerLight = new Player(color(145, 132, 102), lightDot, "Light wood")
        this.turn = random(1) < 0.5 ? this.playerDark : this.playerLight
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
            textSize(circleSize * 4)
            stroke(this.winner.color)
            fill(color(255, 255, 255))
            text(this.winner.name + " won!", 0, -circleSize)
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

        }
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
            dot.player = this.playerLight
            this.playerLight.startChips.push(dot)

            dot = new Dot(1.4 - i / 10, -1.7, -1, -1, true)
            dot.player = this.playerDark
            this.playerDark.startChips.push(dot)

            //Eaten chips
            dot = new Dot(-1.4 + i / 10, 1.7, -1, -1, true)
            dot.player = this.playerLight
            dot.visible = false
            this.playerLight.eatenChips.push(dot)

            dot = new Dot(1.4 - i / 10, 1.7, -1, -1, true)
            dot.player = this.playerDark
            dot.visible = false
            this.playerDark.eatenChips.push(dot)
        }
    }
    drawEatenChips() {
        this.playerLight.eatenChips.forEach(chip => chip.draw())
        this.playerDark.eatenChips.forEach(chip => chip.draw())
    }
    drawStartChips() {
        this.playerLight.startChips.forEach(chip => chip.draw())
        this.playerDark.startChips.forEach(chip => chip.draw())
    }
    click() {
        if (this.winner) return
        if (AUTOPLAY && this.turn === this.playerLight) return
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
            this.placeChip(dot)
        }
    }
    eatChip(dot) {
        dot = this.dots[dot.l][dot.d]
        dot.player.chipCount--

        this.turn.eatenChips[this.turn.eatenChipsCount].setTargetDot(dot)
        this.turn.eatenChips[this.turn.eatenChipsCount++].visible = true

        this.eatMode = false
        this.eatableAnimations = []
        dot.player = undefined
        this.turn.mills.forEach(m => m.new = false)
        this.switchTurn()

        //Checking the mills again incase had to eat from (at the time) opponents  mill
        this.turn.mills = this.getUpdatedMills(this.dots, this.turn)

    }
    clearSuggestion() {
        if (!this.suggestion) return
        for (var dot of this.suggestion) {
            this.dots[dot.l][dot.d].suggested = false
        }
        this.suggestion = undefined
    }
    setSuggestion(move) {
        var type = move[1]
        var move = move[0]
        this.clearSuggestion()
        switch (type) {
            case ("placing"):
                this.suggestion = [move]
                dot = this.dots[move.l][move.d]
                dot.suggested = true
                break;
            case ("moving"):
                this.suggestion = move
                for (var dot of move) {
                    dot = this.dots[dot.l][dot.d]
                    dot.suggested = true
                }
                break;
            case ("eating"):
                this.suggestion = [move]
                dot = this.dots[move.l][move.d]
                dot.suggested = true
                break;
            default:
                console.log(move, type, "Shouldnt happen?")
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
        this.gameStarted = this.playerDark.chipsToAdd + this.playerLight.chipsToAdd === 0

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
            if (this.gameStarted && dot.player === this.turn) {
                //Moving chips
                cursor(MOVE)
            } else {
                //Placing chips
                cursor(HAND)
                // cursor("./resources/img/cursor.png")
            }
            if (this.prevHover && this.prevHover !== dot) {
                this.prevHover.hover = false
                this.prevHover = undefined
            }
            dot.hover = true
            this.prevHover = dot
        } else if (this.prevHover && this.prevHover !== dot) {
            cursor(ARROW)
            this.prevHover.hover = false
            this.prevHover = undefined
        }

    }
    checkIfCanMove(player, board) {
        if (getStage(player) !== 2) return true
        var movableDots = this.getMoveableDots(board, player)
        return movableDots.length > 0
    }
    getMoveableDots(board, player) {
        var movableDots = []
        for (var layer of board) {
            for (var dot of layer) {
                //Check if player has 3 chips left or dots neighbours has empty dot
                if (dot.player && dot.player.name == player.name && (player.chipCount + player.chipsToAdd === 3 || dot.neighbours.some(nDot => !nDot.player))) {
                    movableDots.push(dot)
                }
            }
        }
        player.movableDots = movableDots
        return movableDots
    }
    checkIfLost(player) {
        return (player.chipCount + player.chipsToAdd) < 3 || !this.checkIfCanMove(player, this.dots)
    }
    switchTurn() {
        this.clearSuggestion()


        //Checking for new mills before switching turn
        if (this.isNewMills(this.dots, this.turn)) {
            this.eatMode = true
            //Mills are made not new in eatChip method as soon as player has eaten a chip
            return
        }

        if (this.checkIfLost(this.turn)) {
            var oppPlayer = this.turn === this.playerDark ? this.playerLight : this.playerDark
            this.setWinner(oppPlayer)
            return
        }
        if (getStage(this.turn) === 3) this.turn.stage3Turns++
        this.turn = this.turn === this.playerDark ? this.playerLight : this.playerDark
        if (this.checkIfLost(this.turn)) {
            var oppPlayer = this.turn === this.playerDark ? this.playerLight : this.playerDark
            this.setWinner(oppPlayer)
            return
        }
        if (AUTOPLAY && this.turn === this.playerLight) {
            // cursor(WAIT)
            this.playRound(this.findBestMove())
            // cursor(ARROW)
        }
    }
    playRound(move) {
        //This is just to prevent an error happening
        if (!move) return
        var type = move[1]
        var move = move[0]

        switch (type) {
            case ("placing"):
                this.placeChip(move)
                break;
            case ("moving"):
                this.moveChip(move)
                break;
            case ("eating"):
                this.eatChip(move)
                break;
            default:
                console.log(move, type, "Shouldnt happen?")
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
    setWinner(player) {
        var oppPlayer = this.turn === this.playerDark ? this.playerLight : this.playerDark
        //Checking the mills again incase had to eat from (at the time) opponents  mill
        //This is to clear mill lines from not anymore mills
        oppPlayer.mills = this.getUpdatedMills(this.dots, oppPlayer)

        this.winner = player
        restartButton.size(circleSize * 15, circleSize * 6)
        restartButton.position(cnv.position().x + width / 2 - restartButton.width / 2, cnv.position().y + height * 0.53)
        restartButton.style('font-size', circleSize * 2 + "px")
        restartButton.style('background', "transparent  url('./resources/img/woodenButton.png') no-repeat center top")
        restartButton.style("background-size", "cover")
        suggestionButton.style("visibility", "hidden")
        autoPlayButton.style("visibility", "hidden")
        // restartButton.style('background-color', color(0, 255, 0, 200))
    }
    getUpdatedMills(board, player) {
        var oldMills = player.mills
        var allMills = []
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
                    var oldMill = oldMills.find(m => m.id == mill.id)
                    if (oldMill && !allMills.some(m => m.id == mill.id)) {
                        allMills.push(oldMill)
                    } else if (!allMills.some(m => m.id == mill.id)) {
                        allMills.push(mill)
                    }

                }
            }
        }
        //Now mills that are returned are mostly the same, just new ones are added and non excistant removed
        //instead of replacing them all which is helpful in future because we can then compare then mills unique id's
        return allMills
    }
    isNewMills(board, player) {
        player.mills = this.getUpdatedMills(board, player)
        //result is new mills that given player did not have before checking them now

        return player.mills.some(m => m.new)
    }
    drawMills() {
        this.playerLight.drawMills()
        this.playerDark.drawMills()
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
    getEatableDots(board, player) {
        //Updating player.mills array
        // player.mills = game.getUpdatedMills(board, player)
        var dotsInMill = this.getPlayerMillDots(board, player)
        var allDots = this.getPlayerDots(board, player)
        var eatableDots = []

        //if there is same amount if dots in mills as total player dots, then all of them are eatable
        if (dotsInMill.length === allDots.length) {
            return allDots
        } else {
            //Otherwise have to look for the dots that are not in mills
            for (var dot of allDots) {
                if (!dotsInMill.some(chip => chip.id == dot.id)) {
                    eatableDots.push(dot)
                }
            }
            return eatableDots
        }

    }
    getPlayerDots(board, player) {
        var allDots = []
        for (var layer of board) {
            for (var dot of layer) {
                if (!dot.player) continue
                if (dot.player.name == player.name) {
                    allDots.push(dot)
                }
            }
        }
        return allDots
    }
    getPlayerMillDots(board, player) {
        player.mills = this.getUpdatedMills(board, player)
        var dots = []
        for (var mill of player.mills) {
            for (var mDot of mill.dots) {
                if (!dots.some(dot => dot.id == mDot.id)) {
                    dots.push(mDot)
                }
            }
        }
        return dots
    }
    findBestMove() {
        if (this.movingAnimations.length > 0) {
            // console.log("Waiting for animations to end")
            return
        }
        if (this.winner) {
            console.log(this.winner.name, "won the game")
            return
        }
        console.time("time finding a move")
        var player = this.turn === this.playerDark ? deepClone(this.playerDark) : deepClone(this.playerLight)
        var oppPlayer = this.turn === this.playerDark ? deepClone(this.playerLight) : deepClone(this.playerDark)
        var cBoard = deepClone(this.dots)
        let move
        let bestScore = -Infinity
        let type
        //this loop is to prioritize earlier good move (Like winning or making a mill)
        // for (var depth = 1; depth < 5; depth++) {
        var depth = this.eatMode || getStage(player) === 3 || getStage(oppPlayer) === 3 ? 2 : 4
        let result = minimax(cBoard, player, oppPlayer, depth, -Infinity, Infinity, this.eatMode, true)
        move = result[0]
        bestScore = result[1]
        type = result[2]
        //     if (bestScore >= 100000000) break
        // }
        if (!move) {
            console.log("Couldn't find a move")
            console.timeEnd("time finding a move")
            return
        }
        //Play the best move
        if (type == "placing") {
            console.log(type, "l", move.l, "d", move.d, "score", bestScore)
        } else if (type == "moving") {
            var fromDot = move[0]
            var toDot = move[1]
            console.log(type, "from", [fromDot.l, fromDot.d], "to", [toDot.l, toDot.d], "score", bestScore)
        } else if (type == "eating") {
            console.log(type, "l", move.l, "d", move.d, "score", bestScore)
        } else {
            console.log(type, move, "typeless move?")
        }
        console.timeEnd("time finding a move")
        return [move, type]
    }
    //Checks if given window is the same in this.dots board
    //Used when looking for new mills
    isSameWindow(window) {
        return window.every(wDot => this.dots[wDot.l][wDot.d].player && this.dots[wDot.l][wDot.d].player.name === wDot.player.name)
    }
}
function getWindowId(window) {
    var d1 = window[0]
    var d2 = window[1]
    var d3 = window[2]

    return d1.l.toString() + d1.d.toString() +
        d2.l.toString() + d2.d.toString() +
        d3.l.toString() + d3.d.toString()
}
function scoreWindow(board, window, player, oppPlayer, scoreObject) {
    var value = 0
    var pieceCount = window.filter(chip => chip.player && chip.player.name == player.name).length
    var emptyCount = window.filter(chip => !chip.player).length
    var oppCount = window.filter(chip => chip.player && chip.player.name == oppPlayer.name).length

    //New mill
    if (pieceCount === 3) {
        //Getting the non deepCopied player
        var gamePlayer = player.name == game.playerLight.name ? game.playerLight : game.playerDark
        var clonePlayerMill = player.mills.find(m => m.id == getWindowId(window))
        var gamerMill = gamePlayer.mills.find(m => m.id == getWindowId(window))
        if (!clonePlayerMill) console.log(player.mills)
        //First checking if this mill is in the game.dots board, if it isnt, then its a new mill
        //Second check is to check if the mill is in the game.dots board but it has been formed another time
        //This has to be checked with unique number given to every mill formed in the game
        //So that two mills that are in same place but formed at different times can be differentiated
        if (clonePlayerMill && !game.isSameWindow(window) || (gamerMill && clonePlayerMill.uniqNum !== gamerMill.uniqNum)) {
            //Win
            // if (getStage(oppPlayer) === 3) {
            //     // console.log(player.name, "win")
            //     return 100000000
            // }
            // console.log(player.name, "new mill")
            scoreObject.update("newMill")
            value += 2500
        }
    }
    if (oppCount === 3) {
        //Getting the non deepCopied player
        var gamePlayer = oppPlayer.name == game.playerLight.name ? game.playerLight : game.playerDark
        var clonePlayerMill = oppPlayer.mills.find(m => m.id == getWindowId(window))
        var gamerMill = gamePlayer.mills.find(m => m.id == getWindowId(window))
        //First checking if this mill is in the game.dots board, if it isnt, then its a new mill
        //Second check is to check if the mill is in the game.dots board but it has been formed another time
        //This has to be checked with unique number given to every mill formed in the game
        //So that two mills that are in same place but formed at different times can be differentiated
        if (clonePlayerMill && !game.isSameWindow(window) || (gamerMill && clonePlayerMill.uniqNum !== gamerMill.uniqNum)) {
            //Win
            // if (getStage(player) === 3) {
            //     // console.log(player.name, "lost")
            //     return -100000000
            // }
            // console.log(player.name, "new mill")
            scoreObject.update("oppNewMll")
            value -= 2500
        }
    }
    switch (getStage(player)) {
        case (1):
            return stage1Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) + value
        case (2):
            return stage2Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) + value
        case (3):
            return stage3Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) + value
        default:
            console.log("Player has won or lost?")
    }
}
function stage1Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) {
    var value = 0
    var oppStage = getStage(oppPlayer)
    var playerDots = window.filter(chip => chip.player && chip.player.name == player.name)
    var oppDots = window.filter(chip => chip.player && chip.player.name == oppPlayer.name)
    var emptyDot = window.filter(chip => !chip.player)[0]

    //blocking opp mill stage 1
    if (oppStage === 1 && oppCount === 2 && pieceCount === 1) {
        scoreObject.update("blockOppMill")
        value += 300
    }
    //blocking opp mill stage 2
    else if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
        playerDots[0].neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
            !oppDots.some(chip => chip.id == dot.id))) {
        scoreObject.update("blockOppMillStage2")
        value += 300
    }
    //almost mill
    else if (oppStage == 1 && pieceCount === 2 && emptyCount === 1) {
        scoreObject.update("almostMill")
        value += 200
    }
    //mill
    else if (pieceCount === 3) {
        scoreObject.update("mill")
        value += 100
    }
    //making safe open mill with last chip
    //opponent being stage 2 means that player is placing its last chip
    else if (oppStage === 2 && pieceCount === 2 && emptyCount === 1 && !emptyDot.neighbours.some(chip => chip.player && chip.player.name == oppPlayer.name) &&
        emptyDot.neighbours.some(chip => chip.player && chip.player.name == player.name &&
            !playerDots.some(dot => dot.id == chip.id))) {
        //"safe" Open mill as in opponent player cant block it on next move 
        scoreObject.update("safeOpenMill")
        value += 200

    }

    //opp mill
    else if (oppCount === 3) {
        scoreObject.update("opp mill")
        value -= 100
    }
    //opp almost mill stage 1
    else if (oppStage === 1 && oppCount === 2 && emptyCount === 1) {
        scoreObject.update("oppAlmostMillStage1")
        value -= 200
    }
    //opp blocking mill stage 1
    else if (oppStage === 1 && pieceCount === 2 && oppCount === 1) {
        scoreObject.update("oppBlockingMillStage1")
        value -= 200
    }
    //opponent safe open mill stage2
    else if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
        emptyDot.neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
            !oppDots.some(chip => chip.id == dot.id))) {
        scoreObject.update("oppSafeOpenMillStage2")
        value -= 300
    }


    return value
}
function stage2Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) {
    var value = 0
    var emptyDot
    var playerDots = window.filter(chip => chip.player && chip.player.name == player.name)
    if (emptyCount === 1) {
        emptyDot = window.filter(chip => !chip.player)[0]
    }
    var oppDots = window.filter(chip => chip.player && chip.player.name == oppPlayer.name)
    var oppStage = getStage(oppPlayer)

    //Syhky miilu is finnish and means double mill
    //which happens when you have 2 mills next to eachother and can get a mill every turn
    if (pieceCount === 2 && emptyCount === 1 &&
        emptyDot.neighbours.some(dot => dot.player && dot.player.name == player.name &&
            !playerDots.some(pDot => pDot.id == dot.id) &&
            player.mills.some(mill => mill.dots.some(chip => chip.id == dot.id)))) {
        scoreObject.update("doubleMill")
        value += 5000
    }
    //Blocking opp double mill
    if (oppCount === 2 && pieceCount === 1 &&
        playerDots[0].neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
            !oppDots.some(pDot => pDot.id == dot.id) &&
            oppPlayer.mills.some(mill => mill.dots.some(chip => chip.id == dot.id)))) {
        scoreObject.update("blockingOppDoubleMill")
        value += 5500
    }
    //"safe" Open mill as in opponent player cant block it on next move 
    else if (pieceCount === 2 && emptyCount === 1 && !emptyDot.neighbours.some(chip => chip.player && chip.player.name == oppPlayer.name) &&
        emptyDot.neighbours.some(chip => chip.player && chip.player.name == player.name &&
            !playerDots.some(dot => dot.id == chip.id))) {
        scoreObject.update("safeOpenMill")
        //good to be less than 1000 because double safe open mill happens, and it would be same value as new mill
        value += 800
    }
    //mill
    else if (pieceCount === 3) {
        scoreObject.update("mill")
        value += 500
    }
    //Opponent mill is blocked from opening
    else if (oppStage === 2 && oppCount === 3 &&
        oppDots.every(dot => dot.neighbours.every(chip => chip.player))) {
        scoreObject.update("blockOppMillStuck")
        value += 300
    }
    //blocking opp mill stage 3
    else if (oppStage === 3 && oppCount === 2 && pieceCount === 1) {
        scoreObject.update("blockOppMillStage3")
        value += 300
    }
    //blocking opp mill stage 2
    else if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
        playerDots[0].neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
            !oppDots.some(chip => chip.id == dot.id))) {
        scoreObject.update("blockOppMillStage2")
        value += 300
    }

    //chip is in the middle of nowhere
    //(this is to try and encourage moving chips towards other chips)
    else if (pieceCount == 1 && !playerDots[0].neighbours.some(d => d.player)) {
        scoreObject.update("chipOnItsOwn")
        value -= 50
    }
    //opponent safe open mill stage2
    else if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
        emptyDot.neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
            !oppDots.some(chip => chip.id == dot.id))) {
        scoreObject.update("oppSafeOpenMillStage2")
        value -= 500
    }
    //opponent open mill stage 3
    else if (oppStage === 3 && oppCount === 2 && emptyCount === 1) {
        scoreObject.update("oppOpenMillStage3")
        value -= 500
    }
    //Syhky miilu is finnish and means double mill
    //which happens when you have 2 mills next to eachother and can get a mill every turn
    //Opp double mill
    if (oppCount === 2 && emptyCount === 1 &&
        emptyDot.neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
            !oppDots.some(pDot => pDot.id == dot.id) &&
            oppPlayer.mills.some(mill => mill.dots.some(chip => chip.id == dot.id)))) {
        scoreObject.update("oppDoubleMill")
        value -= 5000
    }
    return value
}
function stage3Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) {
    var value = 0
    // var emptyDot
    var oppStage = getStage(oppPlayer)
    var oppDots = window.filter(chip => chip.player && chip.player.name == oppPlayer.name)
    // if (emptyCount === 1) {
    //     emptyDot = window.filter(chip => !chip.player)[0]
    // }
    var playerDot
    if (pieceCount === 1) {
        playerDot = window.filter(chip => chip.player && chip.player.name == player.name)[0]
    }
    //blocking opp mill when opp is on stage 2
    //this is important because player will lose on next move otherwise
    if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
        playerDot.neighbours.some(chip => chip.player && chip.player.name == oppPlayer.name &&
            !oppDots.some(dot => dot.id == chip.id))) {
        scoreObject.update("blockOppMillStage2")
        value += 3000
    }
    //Blocking opp double mill
    else if (oppCount === 2 && pieceCount === 1 &&
        playerDot.neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
            !oppDots.some(pDot => pDot.id == dot.id) &&
            oppPlayer.mills.some(mill => mill.dots.some(chip => chip.id == dot.id)))) {
        scoreObject.update("blockingOppDoubleMill")
        value += 5500
    }
    //blocking opp mill when opp is on stage 3
    //this is also important because player will lose on next move otherwise
    else if (oppStage === 3 && oppCount === 2 && pieceCount === 1) {
        scoreObject.update("blockOppMillStage3")
        value += 3000
    }
    //almost mill
    else if (pieceCount === 2 && emptyCount === 1) {
        scoreObject.update("almostMill")
        value += 800
    }

    // //opponent safe open mill
    // else if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
    //     emptyDot.neighbours.some(chip => chip.player && chip.player.name == oppPlayer.name &&
    //         !oppDots.some(dot => dot.id == chip.id))) {
    //     scoreObject.update("oppOpenMillStage2")
    //     value -= 3000
    // }
    // //opponent open mill
    // else if (oppStage === 3 && oppCount === 2 && emptyCount === 1) {
    //     scoreObject.update("oppOpenMillStage3")
    //     value -= 3000
    // }
    return value
}
function getStage(player) {
    if (player.chipsToAdd > 0) {
        return 1
    } else if (player.chipCount + player.chipsToAdd === 3) {
        return 3
    } else if (player.chipsToAdd === 0) {
        return 2
    } else {
        console.log("returning 0 stage")
        return 0
    }
}
function scoreBoard(board, player, oppPlayer) {
    if (DEBUG) console.time("scoreBoard")

    //Updating players chipCounts incase they are wrong because of bugs :)
    //This is to get player stages right when evaluating each window
    player.chipCount = game.getPlayerDots(board, player).length
    oppPlayer.chipCount = game.getPlayerDots(board, oppPlayer).length

    var value = 0
    //Object to store info about where the different points for each board is coming from
    //Helpful for debugging
    var scoreObject = {
        update: function (property) {
            this[property] ? this[property]++ : this[property] = 1
        }
    }
    if ((player.chipCount + player.chipsToAdd) < 3) {
        console.log(oppPlayer.name, "win")
        return -100000000
    }
    if ((oppPlayer.chipCount + oppPlayer.chipsToAdd) < 3) {
        console.log(player.name, "win")
        return 100000000
    }
    if (getStage(player) === 1) {
        //Giving points for each neighbour dot of players dots
        for (var dot of game.getPlayerDots(board, player)) {
            scoreObject.neighbours = dot.neighbours.length
            value += dot.neighbours.length
        }
    }
    if (getStage(player) === 2) {
        //Adding 25 points for each moveable dot
        var moveableDots = game.getMoveableDots(board, player).length
        value += moveableDots * 25
        scoreObject.moveablepDots = moveableDots

        //player loses if cant move
        if (moveableDots === 0) {
            console.log(oppPlayer.name, "win")
            return -100000000
        }

    }
    if (getStage(oppPlayer) === 2) {
        var oppMoveableDots = game.getMoveableDots(board, oppPlayer).length
        var oppUnmoveableDots = oppPlayer.chipCount - oppMoveableDots

        value += oppUnmoveableDots * 25
        scoreObject.oppUnmoveableDots = oppUnmoveableDots

        if (oppMoveableDots === 0) {
            console.log(player.name, "win")
            return 100000000
        }

    }
    if (getStage(player) === 3) {
        //Giving 10000 points for each turn during stage 3 to encourage delaying losing a game
        scoreObject.s3Turns = player.stage3Turns
        value += player.stage3Turns * 10000
    }
    // if (getStage(oppPlayer) === 3) {

    //     scoreObject.oppS3Turns = oppPlayer.stage3Turns
    //     value -= oppPlayer.stage3Turns * 10000
    // }

    for (var layer of board) {
        for (var d = 0; d < 8; d++) {
            var window
            if (d % 2 === 0) {
                //d = 0,2,4,6
                //Checking window on layers (even indexes)
                window = [layer[d], layer[(d + 1) % 8], layer[(d + 2) % 8]]
                value += scoreWindow(board, window, player, oppPlayer, scoreObject)
            } else if (layer[d].l === 0) {
                //This only needs to be checked once and not on every layer (it caused duplicated mills otherwise)
                //d = 1,3,5,7
                //Checking window between layers (odd indexes)
                window = [board[0][d], board[1][d], board[2][d]]
                value += scoreWindow(board, window, player, oppPlayer, scoreObject)
            }
        }
    }
    if (DEBUG) {
        console.timeEnd("scoreBoard")
        //This is helpful when looking at where the score comes from for a board
        console.log("scoreObject", scoreObject)
    }

    return value
}
function minimax(board, player, oppPlayer, depth, alpha, beta, eatmode, isMaximizing) {
    if (depth < 1) {
        // return [undefined, scoreBoard(board, player, oppPlayer)]
        if (isMaximizing) {
            return [undefined, scoreBoard(board, player, oppPlayer)]
        }
        else {
            return [undefined, scoreBoard(board, oppPlayer, player)]
        }
    }

    if (isMaximizing) {
        if (player.chipCount + player.chipsToAdd < 3) {
            console.log(oppPlayer.name, "win")
            return [undefined, -100000000]
        } else if (oppPlayer.chipCount + oppPlayer.chipsToAdd < 3) {
            console.log(player.name, "win")
            return [undefined, 100000000]
        }

        if (eatmode) {
            return eatingMinMax(board, player, oppPlayer, depth, alpha, beta, eatmode, isMaximizing)
        } else if (getStage(player) === 1) {
            return stage1MinMax(board, player, oppPlayer, depth, alpha, beta, eatmode, isMaximizing)
        } else {
            //Won by opponent not being able to move
            if (!game.checkIfCanMove(player, board)) {
                console.log(oppPlayer.name, "win")
                return [undefined, -100000000]
            } else if (!game.checkIfCanMove(oppPlayer, board)) {
                console.log(player.name, "win")
                return [undefined, 100000000]
            }
            return stage23MinMax(board, player, oppPlayer, depth, alpha, beta, eatmode, isMaximizing)
        }
    } else {
        if (player.chipCount + player.chipsToAdd < 3) {
            console.log(oppPlayer.name, "win")
            return [undefined, 100000000]
        } else if (oppPlayer.chipCount + oppPlayer.chipsToAdd < 3) {
            console.log(player.name, "win")
            return [undefined, -100000000]
        }

        if (eatmode) {
            return eatingMinMax(board, player, oppPlayer, depth, alpha, beta, eatmode, isMaximizing)
        } else if (getStage(oppPlayer) === 1) {
            return stage1MinMax(board, player, oppPlayer, depth, alpha, beta, eatmode, isMaximizing)
        } else {
            //Won by opponent not being able to move
            if (!game.checkIfCanMove(player, board)) {
                console.log(oppPlayer.name, "win")
                return [undefined, 100000000]
            } else if (!game.checkIfCanMove(oppPlayer, board)) {
                console.log(player.name, "win")
                return [undefined, -100000000]
            }
            return stage23MinMax(board, player, oppPlayer, depth, alpha, beta, eatmode, isMaximizing)
        }
    }
}
function movePlayerTo(board, player, fromDot, toDot) {
    board[toDot.l][toDot.d].player = player
    board[fromDot.l][fromDot.d].player = undefined
}
function eatingMinMax(board, player, oppPlayer, depth, alpha, beta, eatmode, isMaximizing) {
    if (isMaximizing) {
        let bestScore = -Infinity
        let bestMove

        var eatableDots = game.getEatableDots(board, oppPlayer)
        for (var dot of eatableDots) {
            if (getStage(oppPlayer) === 3) {
                console.log(player.name, "win")
                return [dot, 100080085, "eating"]
            }
            var cBoard = deepClone(board)
            var cPlayer = deepClone(player)
            // var cPlayer = player
            var cOppPlayer = deepClone(oppPlayer)
            //Making the move
            // cOppPlayer.chipCount--
            cBoard[dot.l][dot.d].player = undefined

            //Checking mills again incase ate from a mill

            cOppPlayer.mills = game.getUpdatedMills(cBoard, cOppPlayer)

            let score = minimax(cBoard, cPlayer, cOppPlayer, depth - 1, alpha, beta, false, false)[1]
            if (score > bestScore) {
                bestScore = score
                bestMove = dot
            }
            alpha = max(bestScore, alpha)
            if (alpha >= beta)
                break
        }

        return [bestMove, bestScore, "eating"]
    } else {
        let bestScore = Infinity;
        let bestMove

        var eatableDots = game.getEatableDots(board, player)
        for (var dot of eatableDots) {
            if (getStage(player) === 3) {
                console.log(oppPlayer.name, "win")
                return [dot, 100080085, "eating"]
            }
            var cBoard = deepClone(board)
            var cPlayer = deepClone(player)
            var cOppPlayer = deepClone(oppPlayer)
            // var cOppPlayer = oppPlayer

            //Making the move
            // cPlayer.chipCount--
            cBoard[dot.l][dot.d].player = undefined

            //Checking mills again incase ate from a mill
            cPlayer.mills = game.getUpdatedMills(cBoard, cPlayer)


            let score = minimax(cBoard, cPlayer, cOppPlayer, depth - 1, alpha, beta, false, true)[1]

            if (score < bestScore) {
                bestScore = score
                bestMove = dot
            }
            beta = min(bestScore, beta)
            if (alpha >= beta)
                break
        }

        return [bestMove, bestScore, "eating"]
    }
}
function stage23MinMax(board, player, oppPlayer, depth, alpha, beta, eatmode, isMaximizing) {
    var allEmptydots = game.getEmptyDots(board)
    if (isMaximizing) {
        let bestScore = -Infinity
        let bestMove


        for (var fromDot of game.getMoveableDots(board, player)) {
            //If player can fly, we check fromDot against every empty dot on the board
            var neighbours = []
            if (getStage(player) === 3) {
                var playerDots = game.getPlayerDots(board, player)
                playerDots.push(...game.getPlayerDots(board, oppPlayer))
                var emptydots = []
                playerDots.forEach(dot => emptydots.push(...dot.neighbours.filter(dn => !dn.player)))
                emptydots.forEach(dot => {
                    if (!neighbours.includes(dot)) neighbours.push(dot)
                })
                //Finally adding all the rest of the empty dots in board
                neighbours.push(...allEmptydots.filter(dot => !neighbours.includes(dot)))
            } else {
                neighbours = fromDot.neighbours
            }
            for (var toDot of neighbours) {
                //toDot has to be empty dot
                if (toDot.player) continue

                var cBoard = deepClone(board)
                var cPlayer = deepClone(player)
                var cOppPlayer = deepClone(oppPlayer)
                // var cOppPlayer = oppPlayer
                //Making the move
                movePlayerTo(cBoard, cPlayer, fromDot, toDot)
                //Won by opponent not being able to move
                if (!game.checkIfCanMove(cOppPlayer, cBoard)) {
                    console.log(player.name, "win")
                    return [[fromDot, toDot], 100000000, "moving"]
                }
                if (getStage(cPlayer) === 3) {
                    cPlayer.stage3Turns++
                }
                // var score
                eatmode = game.isNewMills(cBoard, cPlayer)
                if (eatmode) {
                    cPlayer.mills.forEach(m => m.new = false)
                }

                var score = minimax(cBoard, cPlayer, cOppPlayer, eatmode ? depth : depth - 1, alpha, beta, eatmode, eatmode)[1]

                if (score > bestScore) {
                    bestScore = score
                    bestMove = [fromDot, toDot]
                }
                alpha = max(bestScore, alpha)
                if (alpha >= beta)
                    return [bestMove, bestScore, "moving"]
            }
        }
        return [bestMove, bestScore, "moving"]
    } else {
        let bestScore = Infinity;
        let bestMove

        for (var fromDot of game.getMoveableDots(board, oppPlayer)) {
            //If player can fly, we check fromDot against every empty dot on the board
            var neighbours = []
            if (getStage(oppPlayer) === 3) {
                var playerDots = game.getPlayerDots(board, oppPlayer)
                playerDots.push(...game.getPlayerDots(board, player))
                var emptydots = []
                playerDots.forEach(dot => emptydots.push(...dot.neighbours.filter(dn => !dn.player)))
                emptydots.forEach(dot => {
                    if (!neighbours.includes(dot)) neighbours.push(dot)
                })
                //Finally adding all the rest of the empty dots in board
                neighbours.push(...allEmptydots.filter(dot => !neighbours.includes(dot)))
            } else {
                neighbours = fromDot.neighbours
            }

            for (var toDot of neighbours) {
                //toDot has to be empty dot
                if (toDot.player) continue

                var cBoard = deepClone(board)
                var cPlayer = deepClone(player)
                // var cPlayer = player
                var cOppPlayer = deepClone(oppPlayer)
                //Making the move
                movePlayerTo(cBoard, cOppPlayer, fromDot, toDot)
                if (!game.checkIfCanMove(cPlayer, cBoard)) {
                    console.log(cOppPlayer.name, "win")
                    return [[fromDot, toDot], 100000000, "moving"]
                }
                if (getStage(cOppPlayer) === 3) {
                    cOppPlayer.stage3Turns++
                }
                eatmode = game.isNewMills(cBoard, cOppPlayer)
                if (eatmode) {
                    cOppPlayer.mills.forEach(m => m.new = false)
                }

                var score = minimax(cBoard, cPlayer, cOppPlayer, eatmode ? depth : depth - 1, alpha, beta, eatmode, !eatmode)[1]

                if (score < bestScore) {
                    bestScore = score
                    bestMove = [fromDot, toDot]
                }
                beta = min(bestScore, beta)
                if (alpha >= beta)
                    return [bestMove, bestScore, "moving"]
            }
        }
        return [bestMove, bestScore, "moving"]
    }
}

function stage1MinMax(board, player, oppPlayer, depth, alpha, beta, eatmode, isMaximizing) {
    var allEmptydots = game.getEmptyDots(board)
    if (isMaximizing) {
        let bestScore = -Infinity
        let bestMove
        // putting boards empty dots in better order to check (More likely to find good move early)
        var emptyDotsInOrder = board[1].filter(dot => !dot.player)

        var playerDots = game.getPlayerDots(board, player)
        playerDots.push(...game.getPlayerDots(board, oppPlayer))
        var dupeDots = []
        playerDots.forEach(dot => dupeDots.push(...dot.neighbours.filter(dn => !dn.player)))
        dupeDots.forEach(dot => {
            if (!emptyDotsInOrder.includes(dot)) emptyDotsInOrder.push(dot)
        })
        //Finally adding all the rest of the empty dots in board
        emptyDotsInOrder.push(...allEmptydots.filter(dot => !emptyDotsInOrder.includes(dot)))
        // console.log("found empty dots",emptyDotsInOrder.length)
        if (DEBUG && game.getEmptyDots(board).length !== emptyDotsInOrder.length) {
            console.log("1 not the same length!!")
        }
        for (var dot of emptyDotsInOrder) {
            var cBoard = deepClone(board)
            var cPlayer = deepClone(player)
            var cOppPlayer = deepClone(oppPlayer)
            // var cOppPlayer = oppPlayer
            //Making the move
            // setPlayerTo(cBoard, cPlayer, dot)
            cBoard[dot.l][dot.d].player = cPlayer
            cPlayer.chipsToAdd--
            cPlayer.chipCount++

            eatmode = game.isNewMills(cBoard, cPlayer)
            if (eatmode) {
                cPlayer.mills.forEach(m => m.new = false)
            }

            var score = minimax(cBoard, cPlayer, cOppPlayer, eatmode ? depth : depth - 1, alpha, beta, eatmode, eatmode)[1]
            if (score > bestScore) {
                bestScore = score
                bestMove = dot
            }
            alpha = max(bestScore, alpha)
            if (alpha >= beta)
                break
        }
        return [bestMove, bestScore, "placing"]
    } else {
        let bestScore = Infinity;
        let bestMove
        //putting boards empty dots in better order to check (More likely to find good move early)
        var emptyDotsInOrder = board[1].filter(dot => !dot.player)

        var playerDots = game.getPlayerDots(board, oppPlayer)
        playerDots.push(...game.getPlayerDots(board, player))
        var dupeDots = []
        playerDots.forEach(dot => dupeDots.push(...dot.neighbours.filter(dn => !dn.player)))
        dupeDots.forEach(dot => {
            if (!emptyDotsInOrder.includes(dot)) emptyDotsInOrder.push(dot)
        })
        //Finally adding all the rest of the empty dots in board
        emptyDotsInOrder.push(...allEmptydots.filter(dot => !emptyDotsInOrder.includes(dot)))
        if (DEBUG && game.getEmptyDots(board).length !== emptyDotsInOrder.length) {
            console.log("2 not the same length!!")
        }
        for (var dot of emptyDotsInOrder) {
            var cBoard = deepClone(board)
            var cPlayer = deepClone(player)
            // var cPlayer = player
            var cOppPlayer = deepClone(oppPlayer)
            //Making the move
            // setPlayerTo(cBoard, cOppPlayer, dot)
            cBoard[dot.l][dot.d].player = cOppPlayer
            cOppPlayer.chipsToAdd--
            cOppPlayer.chipCount++

            eatmode = game.isNewMills(cBoard, cOppPlayer)
            if (eatmode) {
                cOppPlayer.mills.forEach(m => m.new = false)

            }

            var score = minimax(cBoard, cPlayer, cOppPlayer, eatmode ? depth : depth - 1, alpha, beta, eatmode, !eatmode)[1]
            if (score < bestScore) {
                bestScore = score
                bestMove = dot
            }
            beta = min(bestScore, beta)
            if (alpha >= beta)
                break
        }
        return [bestMove, bestScore, "placing"]
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
    return !player.mills.some(pMill => pMill.id == mill.id)
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