class Player {
    constructor(color, img, name) {
        this.name = name
        this.color = color
        this.chipCount = 0
        this.chipsToAdd = MAXCHIPCOUNT / 2
        this.img = img
        this.mills = []
        this.millDots = []
        this.movableDots = []
        this.startChips = []
    }
    drawMills() {
        this.mills.forEach(mill => mill.draw())
    }
    isNewMill(mill) {
        for (var m of this.mills) {
            if (m.isSame(mill)) {
                return false
            }
        }
        return true
    }
    canEat(dot) {
        var oppPlayer = game.turn === game.playerRed ? game.playerBlue : game.playerRed
        //Dot has to be opponent player AND
        //Either all dots in are mill or this dot is not in a mill
        return (dot.player && dot.player === oppPlayer && (dot.player.allDotsInMill() || !dot.player.dotIsInMill(dot)))

    }
    allDotsInMill() {
        var uniqueDots = []
        for (var mill of this.mills) {
            for (var dot of mill.dots) {
                if (!uniqueDots.includes(dot)) {
                    uniqueDots.push(dot)
                }
            }
        }
        return uniqueDots.length === this.chipCount
    }
    dotIsInMill(dot) {
        for (var mill of this.mills) {
            if (mill.contain(dot)) {
                return true
            }
        }
        return false
    }
    checkMovableDots(board) {
        var movableDots = []
        for (var layer of board) {
            for (var dot of layer) {
                //Check if player has 3 chips left or dots neighbours has empty dot
                if (dot.player && dot.player === this && (this.chipCount === 3 || dot.neighbours.some(nDot => !nDot.player))) {
                    movableDots.push(dot)
                }
            }
        }
        return movableDots
    }
}