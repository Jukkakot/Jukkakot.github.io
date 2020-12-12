class Block {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.state = states[0]
        this.neighbours = []
        this.draw = (drawShips) => {
            const state = this.state
            const x = this.x * BOXSIZE
            const y = this.y * BOXSIZE
            if (this.isState(1)) {
                drawO(x, y)
            } else if (this.isState(2)) {
                drawX(x, y)
            } else if (this.isState(3) && drawShips) {
                drawS(x, y)
            } else if (this.isState(4)) {
                drawS(x, y)
                drawX(x, y)
                return
            }
            drawDef(x, y)
        }
        this.click = () => {
            //Miss
            if (this.isState(0)) {
                this.state = states[1]
                return true
            }
            //Hit
            if (this.isState(3)) {
                this.state = states[4]
                //Mark diag neighbours as miss because there cant be ship
                for (var n of this.neighbours) {
                    if (n.isState(0) && isDiagNeighbour(this, n)) {
                        n.state = states[1]
                    }
                }
                return true
            }
            //False if isnt either empty block or a ship
            return false
        }
        this.hover = () => {
            const x = this.x * BOXSIZE
            const y = this.y * BOXSIZE
            strokeWeight(5)
            stroke(0);
            rect(x, y, BOXSIZE, BOXSIZE)
            noStroke()
        }
        this.isState = (s) => {
            if (s === undefined || s === null) return false
            return this.state === states[s]
        }
    }
}
//Default box
function drawDef(x, y) {

    strokeWeight(2)
    stroke(0)
    rect(x, y, BOXSIZE, BOXSIZE)
    noStroke()
}
//Miss
function drawO(x, y) {
    strokeWeight(4)
    stroke(0, 0, 255)
    circle(x + BOXSIZE / 2, y + BOXSIZE / 2, BOXSIZE / 2)
    noStroke()
}
//Hit
function drawX(x, y) {
    strokeWeight(4)
    stroke(133, 44, 44)
    line(x + 5, y + 5, x + BOXSIZE - 5, y + BOXSIZE - 5)
    line(x + BOXSIZE - 5, y + 5, x + 5, y + BOXSIZE - 5)
    noStroke()
}
//Ship
function drawS(x, y) {
    strokeWeight(3)
    stroke(0)
    fill(50)
    rect(x, y, BOXSIZE, BOXSIZE)
    noFill()
    noStroke()
}

