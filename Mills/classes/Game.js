
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
        var str = ""
        for (var layer of board) {
            for (var dot of layer) {
                str += !dot.player ? EMPTYDOT : dot.player.char
            }
        }
        return str
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
            var data = e.data
            switch (data.cmd) {
                case "findMove":
                    LOADING = false
                    loadingGif.hide()
                    game.playRound(data.move)
                    game.turn.turnData.push(data.moveData)
                    break;
                case "suggestion":
                    LOADING = false
                    loadingGif.hide()
                    game.setSuggestion(data.move)
                    game.turn.turnData.push(data.moveData)
                    break;
            };
        }
    }
    findBestMove(cmd) {
        if (LOADING) return
        LOADING = true
        // if(!AUTOPLAY)cursor(WAIT)
        loadingGif.show()
        var data = {
            game: deepClone(this),
            board: this.stringify(),
            cmd: cmd,
            options: game.turn.options,
            DEBUG: DEBUG,
        }
        //If player manually playing but wants a suggestion, options are defaulted to minmax 4
        if (!data.options.autoPlay && cmd == "suggestion") {
            data.options = OPTIONS[5]
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
        if (getStage(this.turn) !== 1) {
            text(this.turn.name + " turn", 0, circleSize * 3)
        } else if (this.eatMode) {
            text("Mill!", 0, circleSize * 3)
        } else {
            text("Place a chip", 0, circleSize * 3)
        }
        pop()
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
        if (this.turn.options.autoPlay || this.winner) return
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
            for (var layer of this.dots) {
                for (var d of layer) {
                    d.highlight = false
                }
            }

            //Check if dot player is current turn or if previous dot clicked is (For moving purposes)
            if (dot.player === this.turn || (!dot.player && this.prevDot && this.prevDot.player === this.turn)) {
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
        }
    }
    eatChip(dot) {
        dot = this.dots[dot.l][dot.d]
        dot.player.chipCount--

        this.turn.eatenChips[this.turn.eatenChipsCount].setTargetDot(dot)
        this.turn.eatenChips[this.turn.eatenChipsCount++].visible = true

        this.eatMode = false
        dot.player = undefined
        this.turn.mills.forEach(m => m.new = false)
        this.switchTurn()

        //Checking the mills again incase had to eat from (at the time) opponents  mill
        this.turn.mills = getUpdatedMills(this.dots, this.turn)

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
        if (type == "moving") {
            this.suggestion = move
            move.forEach(dot => {
                dot = this.dots[dot.l][dot.d]
                dot.suggested = true
            })
        } else {
            this.suggestion = [move]
            var dot = this.dots[move.l][move.d]
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

        var prevDot = this.turn.startChips.pop()
        dot.setTargetDot(prevDot)

        this.switchTurn()
    }
    hover() {
        var dot = this.getDot(mX, mY)
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
        return (player.chipCount + player.chipsToAdd) < 3 || !checkIfCanMove(player, this.dots)
    }
    switchTurn() {
        this.clearSuggestion()
        //Checking for new mills before switching turn
        if (hasNewMills(this.dots, this.turn)) {
            this.eatMode = true
            if (this.turn.options.autoPlay)
                this.findBestMove("findMove")
            //Mills are made not new in eatChip method as soon as player has eaten a chip
            return
        }
        //Adding turn to player after checking for eatmode to not add 2 turns whenever player eats
        this.turn.turns++
        if (getStage(this.turn) === 3) this.turn.stage3Turns++
        if (this.checkIfLost(this.turn)) {
            var oppPlayer = this.turn === this.playerDark ? this.playerLight : this.playerDark
            this.setWinner(oppPlayer)
            return
        }
        this.turn = this.turn === this.playerDark ? this.playerLight : this.playerDark
        if (this.checkIfLost(this.turn)) {
            var oppPlayer = this.turn === this.playerDark ? this.playerLight : this.playerDark
            this.setWinner(oppPlayer)
            return
        }
        if (this.turn.options.autoPlay) {
            game.findBestMove("findMove")
        }
    }
    playRound(move) {
        // console.log("move",move)
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
                console.log("Invalid move", move, type)
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
    }
    setWinner(player) {
        this.winner = player

        this.initWorker()

        loadingGif.hide()
        LOADING = false

        var oppPlayer = this.winner === this.playerDark ? this.playerLight : this.playerDark
        var totalTurns = this.winner.turns + oppPlayer.turns
        let currTime = new Date().getTime()
        var gameTime = currTime - this.startTime
        var avgTurnTime = (gameTime / totalTurns).toFixed(3)
        console.log(this.winner.name, "won!",
            "total turns:", totalTurns,
            "chip counts:", this.winner.char, this.winner.chipCount, oppPlayer.char, oppPlayer.chipCount,
            "game lasted for", gameTime / 1000, "s",
            "average turn time:", Number(avgTurnTime), "ms")
        //Checking the mills again incase had to eat from (at the time) opponents  mill
        //This is to clear mill lines from not anymore mills
        oppPlayer.mills = getUpdatedMills(this.dots, oppPlayer)
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
        this.movingAnimations.forEach(dot => dot.updateMovingAnimation())
        //Angle and Speed are eatable dot animation values
        ANGLE += SPEED
    }
}


function pointInCircle(x, y, cx, cy, radius) {
    var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    return distancesquared <= radius * radius;
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
