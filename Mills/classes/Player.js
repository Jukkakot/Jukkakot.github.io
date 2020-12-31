class Player {
    constructor(color, img) {
        this.color = color
        this.chipCount = 0
        this.chipsToAdd = MAXCHIPCOUNT / 2
        this.img = img
        this.mills = []
        this.millDots = []
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
        if (dot.player && dot.player === oppPlayer) {
            //Dot was opponent players 
            if (oppPlayer.allDotsInMill()) {
                //All opponents dots are in mill -> can eat any 
                return true
            } else if (oppPlayer.dotIsInMill(dot)) {
                //Can't eat from opponents mills since already checked 
                //that there are available dots
                return false
            } else {
                return true
            }
        } else {
            //Dot was not opponents dot
            return false
        }
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
    }