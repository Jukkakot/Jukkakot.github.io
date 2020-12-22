
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
                    game.isOver = game.checkWin(game.turn, game.grid, true) == null ? false : true
                    if (!game.isOver) {
                        game.turn = game.turn === game.playerRed ? game.playerYellow : game.playerRed
                        if (game.turn === game.playerYellow) {
                            console.log("finding best move", game.turn)
                            game.findBestMove()
                        }

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
        if (this.grid[column].length < 6) {
            //Adding the chip to both arrays
            this.chips.push(new Chip(column, this.turn.color))
            this.grid[column] ? this.grid[column].push(this.turn.name) : this.grid[column] = [this.turn.name]

            //Chip collsion will cause win check and player turning
            // return true
        }
    }
    checkWin(player, board, pushLines) {
        if (!board) {
            board = this.grid
        }
        // player === this.playerYellow ? this.checkWin(this.playerRed,board,pushLines) : this.checkWin(this.playerYellow,board,pushLines)
        // var wasWin = false

        //Columns check
        for (let column in board) {
            //If column has less than 4 chips, there cant be win
            if (board[column].length > 3) {
                var counter = 0
                for (let row in board[column]) {
                    row = Number(row)
                    var chipName = board[column][row]
                    chipName === player.name ? counter++ : counter = 0
                    if (counter > 3) {
                        // console.log(counter,"column win on column:", column, "indexes", row - 3, row)
                        if (pushLines) {
                            this.winLines.push([column, row - 3, column, row])
                        }

                        return player.name
                        // return true
                        // wasWin = true
                    }
                }
            }
        }

        //Rows check
        for (var row = 0; row < 6; row++) {
            var counter = 0
            for (var column = 0; column < 7; column++) {
                if (board[column][row] === undefined) {
                    counter = 0
                    continue
                }
                board[column][row] === player.name ? counter++ : counter = 0
                if (counter > 3) {
                    // console.log(counter,"row win on row:", row, "indexes", column - 3, column)
                    if (pushLines) {
                        this.winLines.push([column - 3, row, column, row])
                    }
                    return player.name
                    // return true
                    // wasWin = true
                }
            }
        }

        //Diagonals check
        //             ne       se
        var diags = [[1, 1], [1, -1]]
        for (var row = 0; row < 6; row++) {
            for (var column = 0; column < 7; column++) {
                //keeping track of the starting block for marking the line incase there was a win
                var startX = Number(column)
                var startY = row
                if (board[startX][startY] === undefined || board[startX][startY] !== player.name) continue
                //Check each diagonal (ne,se) for this board place
                for (let diag of diags) {
                    var counter = 1
                    var x = startX
                    var y = startY
                    for (var i = 0; i < 3; i++) {
                        x += diag[0]
                        y += diag[1]
                        if (board[x] === undefined || board[x][y] === undefined || board[x][y] !== player.name) continue
                        counter++
                        if (counter > 3) {
                            // console.log("Diag win: from", startX, startY, "to", x, y)
                            if (pushLines) {
                                this.winLines.push([startX, startY, x, y])
                            }
                            return player.name
                            // return true
                            // wasWin = true
                        }
                    }
                }
            }
        }
        //Checking for tie in the end
        if (this.chips.length >= 6 * 7) return "tie"
        let isTie = true
        // console.log("checking for tie")
        for (let column in board) {
            if (board[column].length < 6) {
                isTie = false
                break
            }
        }
        if (isTie) {
            return "tie"
        } else {
            return null
        }

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
        } else if (this.chips.length === 0 || this.chips.length > 0 && !this.chips[this.chips.length - 1].isMoving()) {
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
        let bestScore = -Infinity;
        let move;

        // console.log(copyGrid,this.grid)
        for (var column = 0; column < 7; column++) {
            if (this.grid[column].length < 6) {
                var copyGrid = JSON.parse(JSON.stringify(this.grid));
                copyGrid[column].push(this.turn.name)
                let score = minimax(copyGrid, 4, false);
                if (score > bestScore) {
                    bestScore = score;
                    move = column
                }
            }
        }
        // console.log(copyGrid,this.grid)
        console.log("bestscore", bestScore, "move", move, this.grid)
        this.playRound(move)
    }

}
function evaluateWindow(window, player) {
    // console.log("windowd tässä",window)
    var value = 0
    var oppPlayer = player === game.playerYellow ? game.playerRed : game.playerYellow

    var pieceCount = window.filter(chip => chip == player.name).length
    var emptyCount = 4 - window.length
    var oppCount = window.filter(chip => chip == oppPlayer.name).length
    // console.log("value on", value)
    if (pieceCount === 4) value += 100
    else if (pieceCount === 3 && emptyCount === 1) value += 5
    else if (pieceCount === 2 && emptyCount === 2) value += 2
    else if (oppCount == 3 && emptyCount == 1) value -= 4
    // console.log("value on", value)
    return value
}
function scoreWindow(board, player) {
    var value = 0
    //Center pieces
    var centerPieceCount = board[3].filter(chip => chip == player.name).length
    value += centerPieceCount * 3
    // console.log(centerPieceCount)
    //Vertical
    for (var i = 0; i < 3; i++) {
        for (var x = 0; x < 7; x++) {
            var window = []
            for (var y = i; y < i + 4; y++) {
                if (board[x][y]) {
                    window.push(board[x][y])
                }
            }
            if (window.length > 0) {
                value += evaluateWindow(window, player)
            }
        }
    }
    //Horizontal
    for (var i = 0; i < 4; i++) {
        for (var y = 0; y < 6; y++) {
            var window = []
            for (var x = i; x < i + 4; x++) {
                if (board[x][y]) {
                    window.push(board[x][y])
                }
            }
            if (window.length > 0) {
                value += evaluateWindow(window, player)
            }
        }
    }

    //Diagonal north east
    for (var y = 0; y < 3; y++) {
        var window = []
        for (var x = 0; x < 4; x++) {
            for (var i = 0; i < 4; i++) {
                if (board[x + i][y + i]) {
                    window.push(board[x + i][y + i])
                }
            }
        }
        if (window.length > 0) {
            value += evaluateWindow(window, player)
        }
    }

    //Diagonal south east
    for (var y = 3; y < 6; y++) {
        var window = []
        for (var x = 0; x < 4; x++) {
            for (var i = 0; i < 4; i++) {
                if (board[x + i][y - i]) {
                    window.push(board[x + i][y - i])
                }
            }
        }
        if (window.length > 0) {
            value += evaluateWindow(window, player)
        }
    }
    return value
}


function minimax(board, depth, isMaximizing) {
    let scores = {
        "yellow": 100000000000000,
        "red": -100000000000000,
        "tie": 0
    };
    let result = game.checkWin(game.playerRed, board, false)
    if (result === null) {
        result = game.checkWin(game.playerYellow, board, false)
    }
    if (result !== null) {
        return scores[result];
    }
    var player = isMaximizing ? game.playerYellow : game.playerRed
    if (depth === 0) {
        //    debugger // console.log("tässä on board", board)
        var score = scoreWindow(board, player)
        // console.log(score)
        return score
    }

    if (isMaximizing) {
        let bestScore = -Infinity
        for (var column = 0; column < 7; column++) {
            if (board[column].length < 6) {
                var cBoard = JSON.parse(JSON.stringify(board));
                cBoard[column].push(player.name)
                // board[column].push(player.name)
                let score = minimax(cBoard, depth - 1, false);
                // board[column].pop()
                bestScore = max(score, bestScore)
            }
        }
        return bestScore
    } else {
        let bestScore = Infinity;
        for (var column = 0; column < 7; column++) {
            if (board[column].length < 6) {
                var cBoard = JSON.parse(JSON.stringify(board));
                cBoard[column].push(player.name)
                // board[column].push(player.name)
                let score = minimax(cBoard, depth - 1, true);
                // board[column].pop()
                bestScore = min(score, bestScore);
            }
        }
        return bestScore;
    }
}