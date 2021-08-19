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
        //Total turns this game has had
        this.totalTurns = 0
        this.worker = new Worker("classes/Worker.js")
        this.worker.onmessage = function (e) {
            var data = e.data
            switch (data.cmd) {
                case "findMove":
                    game.playRound(data.move)
                    break;
                case "suggestion":
                    game.setSuggestion(data.move)
                    break;
            };
        }


    }
    findBestMove(cmd) {
        var data = {
            game: deepClone(this),
            cmd: cmd,
            DEBUG: DEBUG,
        }
        this.worker.postMessage(deepClone(data))
    }
    // findBestMove(cmd) {
    //     return new Promise((resolve, reject) => {
    //         const worker = new Worker("classes/Worker.js")

    //         worker.onmessage = function (e) {
    //             worker.terminate()
    //             resolve(e)
    //         }

    //         worker.onerror = function (err) {
    //             worker.terminate();
    //             reject(err);
    //             console.log(err.message, err.lineno)
    //         }

    //         // Post the message to the worker
    //         var data = {
    //             game: deepClone(this),
    //             cmd: cmd,
    //             DEBUG: DEBUG,
    //             // idNumber: ++idNumber,
    //         }
    //         worker.postMessage(deepClone(data))
    //     }).catch((error) => {
    //         console.error(error);
    //     });
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
        if (AUTOPLAY || this.winner) return
        // if (AUTOPLAY && this.turn === this.playerLight) return
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

    checkIfLost(player) {
        return (player.chipCount + player.chipsToAdd) < 3 || !checkIfCanMove(player, this.dots)
    }
    switchTurn() {
        this.clearSuggestion()


        //Checking for new mills before switching turn
        if (isNewMills(this.dots, this.turn)) {
            this.eatMode = true
            if (AUTOPLAY) {
                cursor(WAIT)
                game.findBestMove("findMove")
                // this.playRound(this.findBestMove())
                // game.findBestMove("findMove").then(function (value) {
                //     game.playRound(value.data.move)
                // }).catch((error) => {
                //     console.error(error);
                // });
                cursor(ARROW)
            }
            //Mills are made not new in eatChip method as soon as player has eaten a chip
            return
        }

        if (this.checkIfLost(this.turn)) {
            var oppPlayer = this.turn === this.playerDark ? this.playerLight : this.playerDark
            this.setWinner(oppPlayer)
            return
        }
        if (getStage(this.turn) === 3) this.turn.stage3Turns++
        this.totalTurns++
        this.turn.turns++
        this.turn = this.turn === this.playerDark ? this.playerLight : this.playerDark
        if (this.checkIfLost(this.turn)) {
            var oppPlayer = this.turn === this.playerDark ? this.playerLight : this.playerDark
            this.setWinner(oppPlayer)
            return
        }
        if (AUTOPLAY) {
            cursor(WAIT)
            // game.findBestMove("findMove").then(function (value) {
            //     game.playRound(value.data.move)
            // }).catch((error) => {
            //     console.error(error);
            // });
            game.findBestMove("findMove")
            cursor(ARROW)
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
        oppPlayer.mills = getUpdatedMills(this.dots, oppPlayer)

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