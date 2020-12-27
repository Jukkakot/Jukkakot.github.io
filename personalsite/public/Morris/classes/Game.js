class Game {
    constructor() {
        this.dots = this.initDots()
        console.log("dots", this.dots)
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
    drawRect(w) {
        push()
        rectMode(CENTER)
        noFill()
        // strokeWeight(circleSize / 5)
        // translate(x, y)
        rect(0, 0, w, w)


        for (var l in this.dots) {
            for (var d in this.dots[l]) {
                var dot = this.dots[l][d]
                dot.draw(l, d)
            }
        }
        pop()
    }
    initDots() {
        var dots = []
        for (var layers = 0; layers < 3; layers++) {
            var rect = []


            //Top
            rect.push(new Dot(-1, -1))
            rect.push(new Dot(0, -1))
            rect.push(new Dot(1, -1))
            //Right
            rect.push(new Dot(1, 0))
            //Bottom
            rect.push(new Dot(1, 1))
            rect.push(new Dot(0, 1))
            rect.push(new Dot(-1, 1))
            //Left
            rect.push(new Dot(-1, 0))


            dots.push(rect)
        }

        return dots
    }
    click() {
        for (var l = 2; l >= 0; l--) {
            for (var dot of this.dots[l]) {
                var size = (outBoxSize - distance * l) / 2
                if (pointInCircle(mX, mY, dot.x * size, dot.y * size, dot.r)) {
                    dot.click()
                } else {
                    dot.highlight = false
                }
            }
        }
    }
    hover() {
        for (var l = 2; l >= 0; l--) {
            for (var dot of this.dots[l]) {
                var size = (outBoxSize - distance * l) / 2
                if (pointInCircle(mX, mY, dot.x * size, dot.y * size, dot.r)) {
                    dot.hover = true
                } else {
                    dot.hover = false
                }
            }
        }
    }
}
function pointInCircle(x, y, cx, cy, radius) {
    var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    return distancesquared <= radius * radius;
}