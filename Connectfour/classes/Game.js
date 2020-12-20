class Game {
    constructor() {
        //making floor seperatly from other walls so can detech collisions with it
        this.floor = new Box(width / 2, height - 2.5, width, 5)
        this.floor.body.label = "floor"
        this.walls = this.makeWalls()
        //Arr storing visible chips for drawing
        this.chips = []
        //Directory for game state (win/lose/draw)
        this.grid = {}
        this.winLines = []
        this.isOver = false
        this.playerA = new Player(color(220, 0, 0), "red")
        this.playerB = new Player(color(220, 220, 0), "yellow")
        this.turn = random() < 0.5 ? this.playerA : this.playerB
        Events.on(engine, 'collisionStart', this.collision);
    }
    collision(event) {
        var pairs = event.pairs;
        for (var i = 0; i < pairs.length; i++) {
            var bodyA = pairs[i].bodyA;
            var bodyB = pairs[i].bodyB;
            if (Math.abs(bodyA.velocity.y) > 1 || Math.abs(bodyB.velocity.y) > 1) {
                if (bodyA.label == 'Rectangle Body' || bodyB.label == 'Rectangle Body') return
                if (bodyA.label == 'Circle Body' || bodyB.label == 'Circle Body') {
                    bopSound.play()
                    game.isOver = game.checkWin(game.turn)
                    game.turn = game.turn === game.playerA ? game.playerB : game.playerA
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
    playRound() {
        //Cant put another chip until the last chip has landed on the board
        //(Preventing spam clicking)
        if (this.chips.length > 0 && this.chips[this.chips.length - 1].isMoving())
            return
        var column = Math.floor(mouseX / (chipRadius * 2.07))

        //Preventing from being able to drop a chip over the canvas
        column = min(column, 6)

        //Preventing more than 6 chips in a column
        if (this.grid[column] !== undefined && this.grid[column].length > 5)
            return

        //Adding the chip to both arrays
        this.chips.push(new Chip(column, this.turn.color))
        this.grid[column] ? this.grid[column].push(this.turn.name) : this.grid[column] = [this.turn.name]

        //Chip collsion will cause win check and player turning
    }
    checkWin(player) {
        // var wasWin = false

        //Columns check
        for (let column in this.grid) {
            //If column has less than 4 chips, there cant be win
            if (this.grid[column].length > 3) {
                var counter = 0
                for (let row in this.grid[column]) {
                    row = Number(row)
                    var chipName = this.grid[column][row]
                    chipName === player.name ? counter++ : counter = 0
                    if (counter > 3) {
                        // console.log(counter,"column win on column:", column, "indexes", row - 3, row)
                        this.winLines.push([column, row - 3, column, row])
                        return true
                        // wasWin = true
                    }
                }
            }
        }

        //Rows check
        for (var row = 0; row < 6; row++) {
            var counter = 0
            for (var column = 0; column < 7; column++) {
                if (this.grid[column] === undefined || this.grid[column][row] === undefined) {
                    counter = 0
                    continue
                }
                this.grid[column][row] === player.name ? counter++ : counter = 0
                if (counter > 3) {
                    // console.log(counter,"row win on row:", row, "indexes", column - 3, column)
                    this.winLines.push([column - 3, row, column, row])
                    return true
                    // wasWin = true
                }
            }
        }

        //Diagonals check
        //             ne       sw
        var diags = [[1, 1], [1, -1]]
        for (var row = 0; row < 6; row++) {
            for (var column = 0; column < 7; column++) {
                if (this.grid[column] === undefined || this.grid[column][row] === undefined) continue
                var startX = Number(column)
                var startY = row
                if (this.grid[startX][startY] === undefined) continue
                for (let diag of diags) {
                    var counter = 1
                    var x = startX
                    var y = startY
                    for (var i = 0; i < 3; i++) {
                        x += diag[0]
                        y += diag[1]
                        if (this.grid[x] === undefined || this.grid[x][y] === undefined || this.grid[x][y] !== player.name) break
                        counter++
                        if (counter > 3) {
                            // console.log("Diag win: from", startX, startY, "to", x, y)
                            this.winLines.push([startX, startY, x, y])
                            return true
                            // wasWin = true
                        }
                    }
                }
            }
        }
        return false
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
}