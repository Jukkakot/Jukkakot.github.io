class Game {
    constructor() {
        this.floor = new Box(width / 2, height - 2.5, width, 5)
        this.floor.body.label = "floor"
        this.walls = this.makeGrid()
        this.colors = [color(220, 0, 0), color(220, 220, 0)]
        this.chips = []
        this.playerA = new Player(this.colors[0], "red")
        this.playerB = new Player(this.colors[1], "yellow")
        this.turn = random() < 0.5 ? this.playerA : this.playerB
    }
    makeGrid() {
        var walls = []
        var offset = 2.5
        for (var x = 0; x < 8; x++) {
            walls.push(new Box(x + offset, height - chipRadius * 7, 5, chipRadius * 12))
            offset += chipRadius * 2 + 2.5
        }
        walls.push(new Box(width / 2, 0, width, 5))
        walls.push(new Box(2.5, height / 2, 5, height))
        walls.push(new Box(width - 2.5, height / 2, 5, height))
        return walls
    }
    playRound() {
        var chip = new Chip(this.turn.color)
        this.chips.push(chip)
        this.turn.addChip(mouseX)
        // this.chips.push(this.turn.addChip(x))
        this.checkWin(this.turn)
        this.turn = this.turn === this.playerA ? this.playerB : this.playerA

    }
    checkWin(player) {
        var chips = player.chips
        for (var chip of chips) {
            var x = chip.body.position.x
            var y = chip.body.position.y
            console.log(x, y)
        }
    }
    show() {
        // this.playerA.show()
        // this.playerB.show()
       
        
        for (var c = 0; c < this.chips.length; c++) {
            if (this.chips[c].isOffScreen()) {
                World.remove(world, this.chips[c].body);
                this.chips.splice(c, 1);
                c--
            } else {
                this.chips[c].show()
            }

        }
        tint(39, 39, 163)
        image(gridImg,0,height-gridImg.height)
        push();
        ellipseMode(RADIUS);
        rectMode(CENTER, CENTER)
        // strokeWeight(chipRadius / 10)
        // stroke(this.turn.color)
        fill(this.turn.color)
        var row = Math.floor(mouseX / (chipRadius * 2.05))
        var x = row * chipRadius * 2 + chipRadius + row * 5 + 2.5
        circle(x, chipRadius , chipRadius)
        pop();
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