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
        this.eatenChips = []
        this.eatenChipsCount = 0
        //Stage 3 turns is to encourage staying "alive" when player hits stage 3
        //This is benefical because opponent could make a mistake and therefore player could still win
        this.stage3Turns = 0
    }
    drawMills() {
        this.mills.forEach(mill => mill.draw())
    }
    isNewMill(mill) {
        return this.mills.some(m => !m.isSame(mill))
    }
    canEat(dot) {
        var oppPlayer = game.turn === game.playerDark ? game.playerLight : game.playerDark
        //Dot has to be opponent player AND
        //Either all dots in are mill or this dot is not in a mill
        return (dot.player && dot.player.name == oppPlayer.name && (dot.player.allDotsInMill() || !dot.player.dotIsInMill(dot)))

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
        return this.mills.some(m => m.contain(dot))
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