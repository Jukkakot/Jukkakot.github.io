class Player {
    constructor(color, img) {
        this.color = color
        this.chipCount = 0
        this.chipsToAdd = MAXCHIPCOUNT/2
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
        var oppPlayer =  game.turn === game.playerRed ? game.playerBlue : game.playerRed 
        if(dot.player && dot.player === oppPlayer) {
            for(var mill of oppPlayer.mills) {
                if(mill.contain(dot)) {
                    return false
                }
            }
        } else {
            return false
        }
        return true
    }
    
}