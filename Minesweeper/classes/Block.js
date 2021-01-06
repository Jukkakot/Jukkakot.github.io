class Block {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.state = states[0]
        this.value = 0
        this.isMine = false
        this.neighbours = []
        this.isFlag = false
        this.hover = () => {
            noFill()
            strokeWeight(5)
            stroke(0);
            rect(this.x * BOXSIZE, this.y * BOXSIZE, BOXSIZE, BOXSIZE)
            noStroke()
        }
        this.rightClick = () => {
            if (!this.isState(1)) this.isFlag = !this.isFlag
        }
        this.draw = (drawMines) => {
            const x = this.x * BOXSIZE
            const y = this.y * BOXSIZE
            drawDef(x, y)
            if (this.isFlag && this.isMine && drawMines) {
                drawMine(x, y)
                drawFlag(x, y)
                return
            }
            if (this.isFlag) {
                drawFlag(x, y)
                return
            }
            if (this.isState(1)) {
                drawOpen(x, y, this.value)
            } else if (this.isState(2) && drawMines) {
                drawMine(x, y)
            } else if (this.isState(3)) {
                drawOpenMine(x, y)
            } else if (this.isState(4)) {
                drawFlag(x, y)
            }
        }
        this.click = () => {
            if (this.isFlag) return true
            //Hidden
            if (this.isState(0) && this.value === 0) {
                this.state = states[1]
                for (var n of this.neighbours) {
                    n.click()
                }
            } else if (this.isState(0) && this.value > 0) {
                this.state = states[1]
            } else if (this.isState(2)) {
                this.state = states[3]
                return false
            }
            return true
        }
        this.isState = (num) => {
            return this.state === states[num]
        }
    }
}
// //Default box
// function drawDef(x, y) {
//     strokeWeight(2)
//     stroke(0)
//     rect(x, y, BOXSIZE, BOXSIZE)
//     noStroke()
// }
function drawDef(x, y) {
    strokeWeight(2)
    stroke(0)
    fill(120)
    rect(x, y, BOXSIZE, BOXSIZE)
    noFill()
    noStroke()
}
function drawOpen(x, y, value) {
    strokeWeight(2)
    stroke(0)
    fill(80)
    rect(x, y, BOXSIZE, BOXSIZE)
    noFill()
    noStroke()
    if (value >= 1) drawValue(x, y, value)
}
function drawOpenMine(x, y) {
    strokeWeight(2)
    stroke(0)
    fill(150, 0, 0)
    rect(x, y, BOXSIZE, BOXSIZE)
    noFill()
    noStroke()

    drawMine(x, y)
}
function drawMine(x, y) {

    noStroke()
    fill(40)
    circle(x + BOXSIZE / 2, y + BOXSIZE / 2, BOXSIZE / 2)
    noFill()
    noStroke()
}
function drawValue(x, y, value) {
    textAlign(CENTER, CENTER);

    switch (value) {
        case (1):
            fill(0, 0, 240)
            break
        case (2):
            fill(0, 150, 0)
            break
        case (3):
            fill(170, 0, 0)
            break
        case (4):
            fill(0, 0, 100)
            break
        case (5):
            fill(100, 0, 0)
            break
        case (6):
            fill(0, 150, 150)
            break
        case (7):
            fill(0, 0, 0)
            break
        case (8):
            fill(150, 150, 150)
            break
    }
    noStroke()
    textSize(BOXSIZE / 2);
    text(value, x + BOXSIZE / 2, y + BOXSIZE / 2);
    noFill()
}
function hoverBox(x, y) {
    noFill()
    strokeWeight(5)
    stroke(0);
    rect(x * BOXSIZE, y * BOXSIZE, BOXSIZE, BOXSIZE)
    noStroke()
}
function drawFlag(x, y) {
    fill(0)
    //bar
    rect(x + BOXSIZE / 2 - BOXSIZE * 0.05, y + BOXSIZE / 2 - BOXSIZE * 0.2, BOXSIZE * 0.10, BOXSIZE * 0.5)
    fill(255, 0, 0)
    //flag
    triangle(
        x + BOXSIZE * 0.20, y + BOXSIZE * 0.3,
        x + BOXSIZE * 0.55, y + BOXSIZE * 0.5,
        x + BOXSIZE * 0.55, y + BOXSIZE * 0.2
    )
    //bottom part
    fill(0)
    rect(x + BOXSIZE * 0.3, y + BOXSIZE - BOXSIZE * 0.35, BOXSIZE * 0.4, BOXSIZE * 0.12)
    rect(x + BOXSIZE * 0.2, y + BOXSIZE - BOXSIZE * 0.25, BOXSIZE * 0.6, BOXSIZE * 0.12)
    noFill()
}