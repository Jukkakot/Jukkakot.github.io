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
            for (var i = -1; i < 2; i++) {
                for (var j = -1; j < 2; j++) {
                    if (i === 0 && j === 0) continue
                    var player = random(1) < 0.3 ? new Player(color(floor(random(2)) * 255)) : undefined
                    rect.push(new Dot(j, i, player))
                }
            }
            dots.push(rect)
        }
        return dots
    }

}