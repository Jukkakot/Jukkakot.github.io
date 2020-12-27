
class Game {
    constructor() {
        //making floor seperatly from other walls so can detech collisions with it
        this.floor = new Box(width / 2, height - 2.5, width, 5)
        this.floor.body.label = "floor"
        this.walls = this.makeWalls()
        //Arr storing visible chips for drawing
        this.chips = []
        //Directory for game state (win/lose/draw)
        this.grid = [...Array(7)].map(e => []);
        this.winLines = []
        this.isOver = false
        this.playerRed = new Player(color(220, 0, 0), "red")
        this.playerYellow = new Player(color(220, 220, 0), "yellow")
        // this.turn = random() < 0.5 ? this.playerRed : this.playerYellow
        this.turn = this.playerRed
        this.canClick = true
        Events.on(engine, 'collisionStart', this.collision);
    }
    collision(event) {
        var pairs = event.pairs;
        for (var i = 0; i < pairs.length; i++) {
            var bodyA = pairs[i].bodyA;
            var bodyB = pairs[i].bodyB;
            if (Math.abs(bodyA.velocity.y) > 2 || Math.abs(bodyB.velocity.y) > 2) {
                if (bodyA.label == 'Rectangle Body' || bodyB.label == 'Rectangle Body') return
                if (bodyA.label == 'Circle Body' || bodyB.label == 'Circle Body') {
                    bopSound.play()
                    game.canClick = true
                    setTimeout(() => {
                        bodyA.isStatic = true
                        bodyB.isStatic = true
                    }, 200);
                    game.isOver = game.checkWin(game.turn, game.grid, true) == undefined ? false : true
                    if (!game.isOver) {
                        game.turn = game.turn === game.playerRed ? game.playerYellow : game.playerRed
                        if (game.turn === game.playerYellow) {
                            game.findBestMove()
                        }
                        // game.findBestMove()
                    }

                }
            }
        }
    }
    makeWalls() {
        var walls = []
        var offset = 2.5
        for (var x = 0; x < 8; x++) {
            walls.push(new Box(x + offset, height - chipRadius * 7, 5, chipRadius * 14.5))
            offset += chipRadius * 2 + 2.5
        }
        walls.push(new Box(width / 2, 0, width, 5))
        walls.push(new Box(2.5, height / 2, 5, height))
        walls.push(new Box(width - 2.5, height / 2, 5, height))
        return walls
    }
    playRound(column) {
        //Cant put another chip until the last chip has landed on the board
        //(Preventing spam clicking)
        // if (this.chips.length > 0 && this.chips[this.chips.length - 1].isMoving()){
        //     console.log("previous was moving")
        //     return
        // }
        //Preventing more than 6 chips in a column
        if (this.grid[column].length < 6 && this.canClick) {
            //Adding the chip to both arrays
            this.chips.push(new Chip(column, this.turn.color))
            this.grid[column].push(this.turn.name)
            this.canClick = false
            //Chip collsion will cause win check and player turning
            // return true
        }
    }
    checkWin(player, board, pushLines) {
        //Vertical
        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 7; x++) {
                var startY = y
                var startX = x
                let wasWin = true
                for (var i = 0; i < 4; i++) {
                    // console.log(y,x,i)
                    if (board[x][y + i] !== player.name) {
                        wasWin = false
                        break
                    }
                }
                if (wasWin) {
                    if (pushLines) {
                        console.log("vertical win", startX, startY, startX, startY + 3)
                        this.winLines.push([startX, startY, startX, startY + 3])
                    }
                    return player.name
                }
            }
        }
        //Horizontal
        for (var y = 0; y < 6; y++) {
            for (var x = 0; x < 4; x++) {
                var startY = y
                var startX = x
                let wasWin = true
                for (var i = 0; i < 4; i++) {
                    if (board[x + i][y] !== player.name) {
                        wasWin = false
                        break
                    }
                }
                if (wasWin) {
                    if (pushLines) {
                        console.log("Horizontal", startX, startY, startX + 3, startY)
                        this.winLines.push([startX, startY, startX + 3, startY])
                    }
                    return player.name
                }
            }
        }

        //Diagonal north east
        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 4; x++) {
                var startY = y
                var startX = x
                let wasWin = true
                for (var i = 0; i < 4; i++) {
                    if (board[x + i][y + i] !== player.name) {
                        wasWin = false
                        break
                    }
                }
                if (wasWin) {
                    if (pushLines) {
                        console.log("posi diag win", startX, startY, startX + 3, startY + 3)
                        this.winLines.push([startX, startY, startX + 3, startY + 3])
                    }
                    return player.name
                }
            }

        }

        //Diagonal south east
        for (var y = 3; y < 6; y++) {
            for (var x = 0; x < 4; x++) {
                var startY = y
                var startX = x
                let wasWin = true
                for (var i = 0; i < 4; i++) {
                    if (board[x + i][y - i] !== player.name) {
                        wasWin = false
                        break
                    }
                }
                if (wasWin) {
                    if (pushLines) {
                        console.log("nega diag win", startX, startY, x + 3, y - 3)
                        this.winLines.push([startX, startY, x + 3, y - 3])
                    }
                    return player.name
                }
            }

        }
        //Checking for tie in the end
        if (this.chips.length >= 6 * 7) return "tie"

        // console.log("checking for tie")
        for (let column of board) {
            if (column.length < 6) {
                //Not win or tie -> return undefined
                return undefined
            }
        }

        console.log("was tie", board)
        return "tie"


    }
    drawWins() {
        for (let l of this.winLines) {
            var startX = l[0] * chipRadius * 2 + chipRadius + l[0] * 5 + 2.5
            var startY = height - l[1] * chipRadius * 2 - chipRadius
            var endX = l[2] * chipRadius * 2 + chipRadius + l[2] * 5 + 2.5
            var endY = height - l[3] * chipRadius * 2 - chipRadius
            push()
            stroke(0, 200, 0)
            strokeWeight(10)
            line(startX, startY, endX, endY)
            pop()
        }
    }
    show() {
        //Draw chips
        for (var c = 0; c < this.chips.length; c++) {
            if (this.chips[c].isOffScreen()) {
                World.remove(world, this.chips[c].body);
                this.chips.splice(c, 1);
                c--
            } else {
                this.chips[c].show()
            }
        }
        //Draw game board
        tint(39, 39, 163)
        image(gridImg, 0, height - gridImg.height)

        if (this.isOver) {
            this.drawWins()
        } else if (this.canClick && this.turn === this.playerRed) {
            if (mouseY > height) return
            //Drawing chip above the board if we can click (Previous chip has landed)
            push();
            // ellipseMode(RADIUS);
            // rectMode(CENTER, CENTER)
            // noStroke()
            // fill(this.turn.color)
            var row = Math.floor(mouseX / (chipRadius * 2.07))
            var x = row * chipRadius * 2 + chipRadius + row * 5 + 2.5
            tint(this.turn.color)
            imageMode(CENTER);
            image(chipImg, x, chipRadius, chipRadius * 2, chipRadius * 2);
            // circle(x, chipRadius, chipRadius)
            pop();
        }
        // for (var wall of this.walls) {
        //     wall.show()
        // }
        // for (var y = 0; y < 6; y++) {
        //     fill(0)
        //     noStroke()
        //     rect(0, height - y * chipRadius * 2 - 5, width, 5)
        // }

    }

    findBestMove() {
        // var copyGrid = JSON.parse(JSON.stringify(this.grid));
        let result = minimax(this.grid, 6, -Infinity, Infinity, true)
        let move = result[0]
        let bestScore = result[1]
        console.log("best score", bestScore, "move", move, this.grid)
        this.playRound(move)
    }

}
function evaluateWindow(window, player) {
    if (window.length !== 4) {
        console.log("not 4 length window", window)
    }
    var value = 0
    var oppPlayer = player === game.playerYellow ? game.playerRed : game.playerYellow

    var pieceCount = window.filter(chip => chip === player.name).length
    var emptyCount = window.filter(chip => chip === "").length
    var oppCount = window.filter(chip => chip === oppPlayer.name).length

    if (pieceCount === 4) value += 100
    else if (pieceCount === 3 && emptyCount === 1) value += 5
    else if (pieceCount === 2 && emptyCount === 2) value += 2
    else if (oppCount === 3 && emptyCount === 1) value -= 4

    return value
}
function scoreWindow(board, player) {
    var value = 0
    //Center pieces
    var centerPieceCount = board[3].filter(chip => chip == player.name).length
    value += centerPieceCount * 3

    //Vertical
    for (var y = 0; y < 3; y++) {
        for (var x = 0; x < 7; x++) {
            var window = []
            for (var i = 0; i < 4; i++) {
                if (board[x][y + i]) {
                    window.push(board[x][y + i])
                } else {
                    window.push("")
                }
            }
            value += evaluateWindow(window, player)
        }
    }
    //Horizontal
    for (var y = 0; y < 6; y++) {
        for (var x = 0; x < 4; x++) {
            var window = []
            for (var i = 0; i < 4; i++) {
                if (board[x + i][y]) {
                    window.push(board[x + i][y])
                } else {
                    window.push("")
                }
            }
            value += evaluateWindow(window, player)
        }
    }
    //Diagonal north east
    for (var y = 0; y < 3; y++) {

        for (var x = 0; x < 4; x++) {
            var window = []
            for (var i = 0; i < 4; i++) {
                if (board[x + i][y + i]) {
                    // console.log("ne diag",window)
                    window.push(board[x + i][y + i])
                } else {
                    window.push("")
                }
            }
            value += evaluateWindow(window, player)
        }

    }

    //Diagonal south east
    for (var y = 3; y < 6; y++) {
        for (var x = 0; x < 4; x++) {
            var window = []
            for (var i = 0; i < 4; i++) {
                if (board[x + i][y - i]) {
                    // console.log("se diag",window)
                    window.push(board[x + i][y - i])
                } else {
                    window.push("")
                }
            }
            value += evaluateWindow(window, player)
        }

    }

    return value
}


function minimax(board, depth, alpha, beta, isMaximizing) {
    // let scores = {
    //     "yellow": 10000000000,
    //     "red": -10000000000,
    //     "tie": 0
    // };
    let yellowCheck = game.checkWin(game.playerYellow, board, false)
    let redCheck = game.checkWin(game.playerRed, board, false)
    if (yellowCheck === "yellow") {
        return [undefined, 10000000000-depth]
    } else if (redCheck === "red") {
        return [undefined, -10000000000+depth]
    } else if (yellowCheck === "tie" || redCheck === "tie") {
        return [undefined, 0]
    }
    if (depth === 0) {
        // var player = isMaximizing ? game.playerYellow : game.playerRed
        // return [undefined, scoreWindow(board, player)]
        return [undefined, scoreWindow(board, game.playerYellow)]
    }
    // let result = game.checkWin(game.playerRed, board, false)
    // if (result === undefined) {
    //     result = game.checkWin(game.playerYellow, board, false)
    // } else {
    //     return [undefined, scores[result]]
    // }
    

    if (isMaximizing) {
        let bestScore = -Infinity
        let bCol = floor(random(7))
        for (var column = 0; column < 7; column++) {
            if (board[column].length < 6) {
                var cBoard = JSON.parse(JSON.stringify(board));
                cBoard[column].push(game.playerYellow.name)
                let score = minimax(cBoard, depth - 1, alpha, beta, false)[1]
                // bestScore = max(score, bestScore)
                if (score > bestScore) {
                    bestScore = score
                    bCol = column
                }
                alpha = max(bestScore, alpha)
                if (alpha >= beta)
                    break
            }
        }
        return [bCol, bestScore]
    } else {
        let bestScore = Infinity;
        let bCol = floor(random(7))
        for (var column = 0; column < 7; column++) {
            if (board[column].length < 6) {
                var cBoard = JSON.parse(JSON.stringify(board));
                cBoard[column].push(game.playerRed.name)
                let score = minimax(cBoard, depth - 1, alpha, beta, true)[1]
                // bestScore = min(score, bestScore);
                if (score < bestScore) {
                    bestScore = score
                    bCol = column
                }
                beta = min(bestScore, beta)
                if (alpha >= beta)
                    break
            }
        }
        return [bCol, bestScore]
    }
}