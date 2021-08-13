class Mill {
    constructor(d1, d2, d3) {
        this.dots = [d1, d2, d3]
        this.player = d1.player
        this.id =   d1.l.toString() + d1.d.toString() + 
                    d2.l.toString() + d2.d.toString() + 
                    d3.l.toString() + d3.d.toString()
    }
    draw() {
        push()

        stroke(this.player.color)
        strokeWeight(circleSize / 5)
        var d1 = this.dots[0]
        var d2 = this.dots[2]
        line(d1.x * d1.size(), d1.y * d1.size(), d2.x * d2.size(), d2.y * d2.size())

        pop()
    }
    isSame(mill) {
        return areEqual(mill.dots, this.dots)
    }
    contain(dot) {
        for (var d of this.dots) {
            if (dot === d) {
                return true
            }
        }
        return false
    }
}