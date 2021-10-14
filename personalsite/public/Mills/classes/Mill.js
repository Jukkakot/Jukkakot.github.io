class Mill {
    constructor(d1, d2, d3) {
        this.dots = [d1, d2, d3]
        this.fastDots = [toFastDot(d1), toFastDot(d2), toFastDot(d3)]
        this.fastId = this.fastDots.reduce((a, b) => a.toString() + b.toString())
        this.player = d1.player
        this.id = d1.l.toString() + d1.d.toString() +
            d2.l.toString() + d2.d.toString() +
            d3.l.toString() + d3.d.toString()
        this.uniqNum = this.player.turns

        this.uniqId = this.id + this.uniqNum.toString()
        this.fastUniqId = this.fastId + this.uniqNum.toString()
        this.new = true
    }
    toFastMill() {
        return {
            fastDots: this.fastDots,
            fastId: this.fastId,
            uniqNum: this.uniqNum,
            new: this.new,
        }
    }

    draw() {
        push()
        this.new ? stroke(color(255, 0, 0)) : stroke(this.player.color)
        strokeWeight(circleSize / 3)
        let d1 = this.dots[0]
        let d2 = this.dots[2]
        line(d1.x * d1.size(), d1.y * d1.size(), d2.x * d2.size(), d2.y * d2.size())

        pop()
    }
    contain(dot) {
        return this.dots.includes(dot)
    }
}
function isMill(player, d1, d2, d3) {
    //All dots must have a player
    if (!d1.player || !d2.player || !d3.player) return undefined

    //All dots must be unique
    if (d1 === d2 || d2 === d3 || d1 === d3) return undefined

    //All dots must have same player
    //Have to compare player names cause players are deepcloned so player objects might not match
    if (d1.player.name != player.name || d2.player.name != player.name || d3.player.name != player.name) return undefined

    //Checking that one of the dots contains 2 of the other dots in its neighbours
    //Aka, all dots are next to eachother
    //d2 neighbours should always include d1/d3 cause its the middle dot?
    if (!d2.neighbours.includes(d1) || !d2.neighbours.includes(d3)) return undefined
    return new Mill(d1, d2, d3)
}
function toFastDot(dot) {
    let layer = dot.l * 8
    return dot.d + layer
}