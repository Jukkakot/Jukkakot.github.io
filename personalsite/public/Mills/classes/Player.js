class Player {
    constructor(color, img, name) {
        this.name = name
        this.color = color
        this.img = img
        this.autoPlay = false

        this.chipCount = 0
        this.chipsToAdd = MAXCHIPCOUNT / 2

        //Extra chips at the bottom and top of the board
        this.startChips = []
        this.eatenChips = []

        //EatenChips is initialized full (9 chips)
        //we just turn them visible as player eats chips
        this.eatenChipsCount = 0

        this.mills = []
        this.millDots = []

        this.movableDots = []

        //Turns is to keep track of how many turns this player has done
        //This is used to identify mills made at different turns in the same place
        this.turns = 0

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
        //Comparing player names because of deepcloning players sometimes
        //so they wouldnt match otherwise in that case
        return (dot.player && dot.player.name == oppPlayer.name &&
            (dot.player.allDotsInMill() || !dot.player.dotIsInMill(dot)))

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