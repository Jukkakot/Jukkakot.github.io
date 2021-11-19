
class Game {
    constructor(settings) {
        this.settings = settings
        //Game board storing all the dots
        //its a 3 x 8 dot long array, each array is a "layer" of dots on the board
        this.dots = this.initDots()

        this.playerDark = new Player(color(100, 60, 20), darkDot, "Dark wood", this.settings.darkOption)

        this.playerLight = new Player(color(145, 132, 102), lightDot, "Light wood", this.settings.lightOption)
        //turn is current player that has the turn
        // this.turn = random(1) < 0.5 ? this.playerDark : this.playerLight
        this.turn = this.playerLight
        //Games turn number is counter for player turns but each turn has its own number
        //First player gets turn 0 and 2nd player gets turn 1 etc..
        this.turnNum = 0
        this.eatMode = false
        this.winner
        //Storage for the suggested dot(s) so its easy to clear afterwards
        this.suggestion

        this.movingAnimations = []

        // this.difficulty = this.settings.difficulty

        this.worker

        this.initWorker()
        this.initExtraChips()

        //Helper variables for moving chips and for the hover effects
        this.prevDot
        this.prevHover

        this.startTime = new Date().getTime()
        this.startDate = Date()
    }
    stringify(board = this.dots) {
        let str = ""
        for (let layer of board) {
            for (let dot of layer) {
                str += !dot.player ? EMPTYDOT : dot.player.char
            }
        }
        return str
    }
    setDots(board, player, oppPlayer) {
        this.dots = this.initDots()
        for (var i = 0; i < board.length; i++) {
            if (board[i] != EMPTYDOT) {
                let dot = indexToDot(i)
                this.dots[dot.l][dot.d].player = board[i] === player.char ? player : oppPlayer
            }
        }
    }
    setState(state) {
        console.log(state)

        let board = state.board
        let player = this.playerDark.char === state.player.char ? this.playerDark : this.playerLight
        let oppPlayer = this.playerDark.char === state.player.char ? this.playerLight : this.playerDark

        this.setDots(board, player, oppPlayer)

        this.eatMode = state.eatMode
        this.turn = state.isPlayerTurn ? player : oppPlayer

        player.setState(state.player)
        oppPlayer.setState(state.oppPlayer)

        this.turnNum = player.turns + oppPlayer.turns

        if (state.winner) {
            let winner = state.winner.char === player.char ? player : oppPlayer
            this.setWinner(winner)
        } else {
            this.winner = undefined
        }
        
        if (autoMultiLookups && lastMultiIndices && lastMultiIndices.length !== 0) {
            this.getBestMoves(lastMultiIndices)
        } else if (this.turn.options.autoPlay) {
            this.findBestMove("findMove")
        }
        console.log(this)
    }
    getEmptyDots(board = this.dots) {
        let dots = []
        for (let layer of board) {
            for (let dot of layer) {
                if (!dot.player) {
                    dots.push(dot)
                }
            }
        }
        return dots
    }
    initWorker() {
        if (this.worker) {
            // this.worker.postMessage({cmd:"close"})
            this.worker.terminate()
            this.worker = undefined
            loadingGif.hide()
            LOADING = false
        }

        this.worker = new Worker("workers/WorkerHelpers.js")
        this.worker.onmessage = function (e) {
            let data = e.data
            switch (data.cmd) {
                case "findMove":
                    LOADING = false
                    loadingGif.hide()
                    game.turn.turnData.push(data.moveData)
                    game.playRound(data.move)
                    break;
                case "suggestion":
                    LOADING = false
                    loadingGif.hide()
                    game.setSuggestion(data.move)
                    break;
                case "randomGameStage":
                    LOADING = false
                    loadingGif.hide()
                    game.setState(data.state)
                    break;
                case "multiLookup":
                    LOADING = false
                    loadingGif.hide()
                    game.handleMultiLookupResult(data)
            };
        }
    }
    handleMultiLookupResult(data) {
        console.log(data.cmd, data.name)
        if (SENDDATA) {
            const gameData = {
                data: data,
                players: {
                    playerLight: this.playerLight.getData(),
                    playerDark: this.playerDark.getData(),
                },
                game: {
                    totalTurns: this.turnNum,
                    autoPlay: AUTOPLAY,
                    maxChipCount: MAXCHIPCOUNT,
                    gameSettings: this.settings,
                    board: this.stringify(),
                    startDate: this.startDate,
                    endDate: Date()
                },
            }
            sendData(gameData, "multiLookup")
        }
        if (autoMultiLookups) {
           randomStatebuttonPress()
        }
    }
    getRandGameState() {
        if (LOADING) return
        LOADING = true
        loadingGif.show()

        let player = this.turn
        let oppPlayer = this.turn.char === "D" ? this.playerLight : this.playerDark
        let data = {
            player: deepClone(player),
            oppPlayer: deepClone(oppPlayer),
            board: this.stringify(),
            eatmode: this.eatmode,
            rounds: floor(random(0, 150)),
            cmd: "randomGameStage"
        }
        console.log("rounds:", data.rounds)
        this.worker.postMessage(deepClone(data))
    }
    getBestMoves(aiIndices) {
        if (LOADING) return
        LOADING = true
        loadingGif.show()
        if (aiIndices.length === 0) return

        let data = {
            game: deepClone(this),
            board: this.stringify(),
            cmd: "multiLookup",
            allOptions: OPTIONS,
            indices: aiIndices,
            DEBUG: DEBUG,
            NODELAY: true
        }
        lastMultiIndices = aiIndices
        this.worker.postMessage(deepClone(data))
    }
    findBestMove(cmd, options) {
        if (LOADING) return
        LOADING = true
        loadingGif.show()

        let data = {
            game: deepClone(this),
            board: this.stringify(),
            cmd: cmd,
            options: options || game.turn.options,
            DEBUG: DEBUG,
            NODELAY: NODELAY
        }
        //If player manually playing but wants a suggestion, options are defaulted to iterative 3s
        if (!data.options.autoPlay && cmd == "suggestion") {
            data.options = OPTIONS[7]
            console.log("Settings options to", data.options.text)
        }
        this.worker.postMessage(deepClone(data))
    }
    drawWinner() {
        push()
        textAlign(CENTER)
        textSize(circleSize * 2.5)
        stroke(this.winner.color)
        fill(color(255, 255, 255))
        text(this.winner.name + " won!", 0, -circleSize)
        pop()
    }
    drawTurn() {
        push()
        textAlign(CENTER)
        imageMode(CENTER);
        image(this.turn.img, 0, 0, circleSize * 3, circleSize * 3);
        textSize(circleSize * 0.8)
        noStroke()
        // fill(0)
        if (this.eatMode) {
            text("Mill!", 0, circleSize * 3)
        } else if (getStage(this.turn) !== 1) {
            text(this.turn.name + " turn", 0, circleSize * 3)
        } else {
            text("Place a chip", 0, circleSize * 3)
        }
        pop()
    }
    drawBoard() {
        push()
        strokeWeight(circleSize / 5)

        let startX = (outBoxSize - distance) / 2 - distance / 2
        let end = startX + distance
        line(startX, 0, end, 0)
        line(-startX, 0, -end, 0)
        line(0, -startX, 0, -end)
        line(0, startX, 0, end)
        for (let layers = 0; layers < 3; layers++) {
            this.drawRect(outBoxSize - distance * layers)
        }
        pop()
    }
    drawAutoplay() {
        push()
        textAlign(CENTER)
        fill(0)
        textSize(circleSize * 1.3)
        text("AUTOPLAY", 0, -height * 0.38)
        pop()
    }
    draw() {
        this.drawBoard()

        this.drawMills()

        this.drawStartChips()
        this.drawEatenChips()

        if (AUTOPLAY && !this.winner) {
            this.drawAutoplay()
        }

        if (this.winner) {
            this.drawWinner()
        } else {
            this.drawTurn()
        }

        if (LOADING && !AUTOPLAY) {
            cursor(WAIT)
        } else {
            cursor(ARROW)
        }

    }

    drawRect(w) {
        push()
        rectMode(CENTER)
        noFill()
        rect(0, 0, w, w)
        for (let l in this.dots) {
            for (let d in this.dots[l]) {
                let dot = this.dots[l][d]
                dot.draw(this.eatMode)
            }
        }
        pop()
    }
    initDots() {
        let dots = []
        for (let l = 0; l < 3; l++) {
            let rect = []
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
        for (let l in dots) {
            for (let dot in dots[l]) {
                dot = Number(dot)
                let currD = dots[l][dot]
                let nextD = dot < 7 ? dots[l][dot + 1] : dots[l][0]
                nextD.neighbours.push(currD)
                currD.neighbours.push(nextD)
            }
        }

        for (let i = 1; i < 8; i += 2) {
            dots[0][i].neighbours.push(dots[1][i])
            dots[1][i].neighbours.push(dots[0][i], dots[2][i])
            dots[2][i].neighbours.push(dots[1][i])
        }
        return dots
    }
    //Initializes start chips and eaten chips
    initExtraChips() {
        for (let i = 0; i < MAXCHIPCOUNT / 2; i++) {
            //Start chips
            let dot = new Dot(-1.4 + i / 10, -1.7, -1, -1, true)
            dot.player = this.playerLight
            this.playerLight.startChips.push(dot)

            dot = new Dot(1.4 - i / 10, -1.7, -1, -1, true)
            dot.player = this.playerDark
            this.playerDark.startChips.push(dot)

            //Eaten chips
            dot = new Dot(-1.4 + i / 10, 1.7, -1, -1, true)
            dot.player = this.playerDark
            dot.visible = false
            this.playerLight.eatenChips.push(dot)

            dot = new Dot(1.4 - i / 10, 1.7, -1, -1, true)
            dot.player = this.playerLight
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
        if (this.turn.options.autoPlay || this.winner) return
        let dot = this.getDot(mX, mY)
        if (!dot) {
            //unhighlight everything
            for (let layer of game.dots) {
                for (let d of layer) {
                    d.highlight = false
                }
            }
            this.prevDot = undefined
            return
        }

        if (this.eatMode) {
            //EATING CHIPS
            if (this.turn.canEat(dot))
                this.eatChip(dot)

            return
        } else if (getStage(this.turn) === 1) {
            //Placing chips (Stage 1)
            this.placeChip(dot)
        } else {
            //MOVING CHIPS (Stage 2 & 3)

            //unhighlighting everything at the start
            for (let layer of this.dots) {
                for (let d of layer) {
                    d.highlight = false
                }
            }

            //Check if dot player is current turn or if previous dot clicked is (For moving purposes)
            if (dot.player === this.turn || (!dot.player && this.prevDot && this.prevDot.player === this.turn)) {
                //Check if moving was succesful
                if (dot.click(this.prevDot)) {
                    playAudio("moving")
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
        }
    }
    eatChip(dot) {
        dot = this.dots[dot.l][dot.d]
        dot.player.chipCount--
        playAudio("eating")
        this.turn.eatenChips[this.turn.eatenChipsCount].setTargetDot(dot)
        this.turn.eatenChips[this.turn.eatenChipsCount++].visible = true

        this.eatMode = false
        dot.player = undefined
        this.turn.mills.forEach(m => m.new = false)
        this.switchTurn()

        //Checking the mills again incase had to eat from (at the time) opponents  mill
        this.turn.mills = this.turn.getUpdatedMills()

    }
    clearSuggestion() {
        if (!this.suggestion) return
        for (let dot of this.suggestion) {
            this.dots[dot.l][dot.d].suggested = false
        }
        this.suggestion = undefined
    }
    setSuggestion(move) {
        let type = move[1]
        move = move[0]
        this.clearSuggestion()
        if (type == "moving") {
            this.suggestion = move
            move.forEach(dot => {
                dot = this.dots[dot.l][dot.d]
                dot.suggested = true
            })
        } else {
            this.suggestion = [move]
            let dot = this.dots[move.l][move.d]
            dot.suggested = true
        }
    }
    placeChip(dot) {
        if (dot.player) return
        dot = this.dots[dot.l][dot.d]
        dot.player = this.turn
        // setPlayerTo(this.dots, this.turn, dot)
        this.turn.chipCount++
        this.turn.chipsToAdd--

        let prevDot = this.turn.startChips.pop()
        dot.setTargetDot(prevDot)
        this.switchTurn()
    }
    hover() {
        let dot = this.getDot(mX, mY)
        if (dot) {

            if (getStage(this.turn) !== 1 && dot.player === this.turn) {
                //Moving chips
                cursor(MOVE)
            } else if (getStage(this.turn) === 1 && dot.player === undefined) {
                //Placing chips
                cursor(HAND)
            } else {
                cursor(ARROW)
            }

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

    checkIfLost(player) {
        return (player.chipCount + player.chipsToAdd) < 3 || !player.checkIfCanMove()
    }
    switchTurn() {
        this.clearSuggestion()
        //Checking for new mills before switching turn
        if (this.turn.hasNewMills()) {
            this.eatMode = true
            if (this.turn.options.autoPlay)
                this.findBestMove("findMove")
            //Mills are made "not new" in eatChip method as soon as player has eaten a chip
            return
        }
        //Adding turn to player after checking for eatmode to not add 2 turns whenever player eats
        this.turn.turns++
        this.turnNum++
        if (getStage(this.turn) === 3) this.turn.stage3Turns++
        if (this.checkIfLost(this.turn)) {
            let oppPlayer = this.turn === this.playerDark ? this.playerLight : this.playerDark
            this.setWinner(oppPlayer)
            return
        }
        this.turn = this.turn === this.playerDark ? this.playerLight : this.playerDark
        if (this.checkIfLost(this.turn)) {
            let oppPlayer = this.turn === this.playerDark ? this.playerLight : this.playerDark
            this.setWinner(oppPlayer)
            return
        }
        if (this.turn.options.autoPlay) {
            this.findBestMove("findMove")
        }
    }
    playRound(move) {
        // console.log("move",move)
        //This is just to prevent an error happening
        if (!move) return
        let type = move[1]
        move = move[0]

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
                console.log("Invalid move", move, type)
        }
    }
    moveChip(move) {
        let fromDot = move[0]
        let toDot = move[1]
        //Have to find the "same" dot from this.dots because given dots are cloned dots so they are not the same
        fromDot = this.dots[fromDot.l][fromDot.d]
        toDot = this.dots[toDot.l][toDot.d]

        toDot.setTargetDot(fromDot)
        playAudio("moving")
        this.switchTurn()
    }
    setWinner(player) {
        this.winner = player

        this.initWorker()

        loadingGif.hide()
        LOADING = false

        let oppPlayer = this.winner === this.playerDark ? this.playerLight : this.playerDark
        let totalTurns = this.winner.turns + oppPlayer.turns
        let currTime = new Date().getTime()
        let gameTime = currTime - this.startTime
        let avgTurnTime = (gameTime / totalTurns).toFixed(3)
        console.log(this.winner.name, "won!",
            "total turns:", totalTurns,
            "chip counts:", this.winner.char, this.winner.chipCount, oppPlayer.char, oppPlayer.chipCount,
            "game lasted for", gameTime / 1000, "s",
            "average turn time:", Number(avgTurnTime), "ms")
        //Checking the mills again incase had to eat from (at the time) opponents  mill
        //This is to clear mill lines from not anymore mills
        oppPlayer.mills = oppPlayer.getUpdatedMills()
        if (SENDDATA) {
            const gameData = {
                players: {
                    winner: this.winner.getData(),
                    oppPlayer: oppPlayer.getData(),
                },
                game: {
                    gameTime: gameTime,
                    averageTurnTime: Number(avgTurnTime),
                    totalTurns: totalTurns,
                    autoPlay: AUTOPLAY,
                    maxChipCount: MAXCHIPCOUNT,
                    gameSettings: this.settings,
                    board: this.stringify(),
                    startDate: this.startDate,
                    endDate: Date()
                }

            }
            sendData(gameData, "game")
        }

        restartButton.size(circleSize * 15, circleSize * 6)
        restartButton.position(cnv.position().x + width / 2 - restartButton.width / 2, cnv.position().y + height * 0.53)
        restartButton.style('font-size', circleSize * 1.5 + "px")
        restartButton.style('background', "transparent  url('./resources/img/woodenButton.png') no-repeat center top")
        restartButton.style("background-size", "cover")

        suggestionButton.style("visibility", "hidden")
        autoPlayButton.style("visibility", "hidden")
        pDarkButton.style("visibility", "hidden")
        pLightButton.style("visibility", "hidden")
        // difficultyButton.style("visibility", "hidden")
        //Automatically restarting the game
        if (AUTOPLAY) {
            setTimeout(() => {
                restartPress()
            }, 500);
        }
    }
    drawMills() {
        this.playerLight.drawMills()
        this.playerDark.drawMills()
    }
    //Returns a dot at given coordinates (Like cursor place)
    getDot(x, y) {
        for (let layer of this.dots) {
            for (let dot of layer) {
                let size = dot.size()
                let r = dot.r
                if (!dot.player) r *= 1.3
                if (pointInCircle(x, y, dot.x * size, dot.y * size, r)) {
                    return dot
                }
            }
        }
    }
    updateAnimations() {
        this.movingAnimations.forEach(dot => dot.updateMovingAnimation())
        //Angle and Speed are eatable dot animation values
        ANGLE += SPEED
    }
}


function pointInCircle(x, y, cx, cy, radius) {
    let distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    return distancesquared <= radius * radius;
}
function deepClone(obj) {
    let visitedNodes = [];
    let clonedCopy = [];
    function clone(item) {
        if (typeof item === "object" && !Array.isArray(item)) {
            if (visitedNodes.indexOf(item) === -1) {
                visitedNodes.push(item);
                let cloneObject = {};
                clonedCopy.push(cloneObject);
                for (let i in item) {
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
                let cloneArray = [];
                visitedNodes.push(item);
                clonedCopy.push(cloneArray);
                for (let j = 0; j < item.length; j++) {
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
function getStage(player) {
    if (player.chipsToAdd > 0) {
        return 1
    } else if (player.chipCount + player.chipsToAdd === 3) {
        return 3
    } else if (player.chipsToAdd === 0) {
        return 2
    } else {
        console.log("returning 0 stage", player)
        return 0
    }
}
function getLayer(i) {
    return floor(i / 8)
}
function indexToDot(index) {
    return {
        l: getLayer(index),
        d: index - getLayer(index) * 8
    }
}