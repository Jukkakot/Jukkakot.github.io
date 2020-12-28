class Game {
    constructor() {
        this.dots = this.initDots()
        this.prevDot
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
        console.log(dots)
        for (var l in dots) {
            for (var d in dots[l]) {
                d = Number(d)
                var currD = dots[l][d]
                var nextD = d < 7 ? dots[l][d + 1] : dots[l][0]
                nextD.neighbours.push(currD)
                currD.neighbours.push(nextD)
            }
        }

        for(var i = 1; i<8;i+=2) {
            dots[0][i].neighbours.push(dots[1][i])
            dots[1][i].neighbours.push(dots[0][i],dots[2][i])
            dots[2][i].neighbours.push(dots[1][i])
        }

        
        return dots
    }
    click() {
        if (this.prevDot) {
            this.prevDot.highlight = false
            for (var n of this.prevDot.neighbours) {
                n.highlight = false
            }
        }
        for (var l in this.dots) {
            for (var dot of this.dots[l]) {
                var size = (outBoxSize - distance * l) / 2
                if ((dot.player || !dot.player && this.prevDot) && pointInCircle(mX, mY, dot.x * size, dot.y * size, dot.r / 2)) {
                    this.prevDot = dot.click(this.prevDot)? undefined : dot 
                    return
                }
            }
        }
        this.prevDot = undefined
    }
    hover() {
        for (var l in this.dots) {
            for (var dot of this.dots[l]) {
                var size = (outBoxSize - distance * l) / 2
                dot.hover = pointInCircle(mX, mY, dot.x * size, dot.y * size, dot.r / 2)
            }
        }
    }
}
function pointInCircle(x, y, cx, cy, radius) {
    var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    return distancesquared <= radius * radius;
}