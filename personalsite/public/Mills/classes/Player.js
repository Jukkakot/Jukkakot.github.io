class Player {
    constructor(color, img, name, optionIndex) {
        this.name = name
        this.color = color
        this.img = img
        //Options on players play style (Which algoritm it uses and its settings)
        //Defaulting to manual play
        this.optionIndex = optionIndex
        this.options = OPTIONS[optionIndex]

        //Players short name, obivously have to make sure players name cant start with the same letter :D
        this.char = this.name[0]
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
        this.turnData = []
    }
    getData() {
        const totalTurnTime = this.turnData.reduce((a, b) => a + b.time, 0)
        const avgTurnTime = totalTurnTime / this.turnData.length

        return {
            name: this.name,
            char: this.char,
            chipCount: this.chipCount,
            chipsToAdd: this.chipsToAdd,
            moveableChips: this.checkMovableDots(game.dots).length,
            turns: this.turns,
            stage3Turns: this.stage3Turns,
            turnData: this.turnData,
            avgTurnTime: avgTurnTime,
            totalTurnTime: totalTurnTime,
            options: this.options,

        }
    }
    updateOptions(index = ++this.optionIndex % OPTIONS.length) {
        this.optionIndex = index
        this.options = OPTIONS[index]
    }
    drawMills() {
        this.mills.forEach(mill => mill.draw())
    }
    isNewMill(mill) {
        return this.mills.some(m => !m.isSame(mill))
    }
    canEat(dot) {
        let oppPlayer = game.turn === game.playerDark ? game.playerLight : game.playerDark
        //Dot has to be opponent player AND
        //Either all dots in are mill or this dot is not in a mill
        //Comparing player names because of deepcloning players sometimes
        //so they wouldnt match otherwise in that case
        return (dot.player && dot.player.name == oppPlayer.name &&
            (dot.player.allDotsInMill() || !dot.player.dotIsInMill(dot)))

    }
    allDotsInMill() {
        let uniqueDots = []
        for (let mill of this.mills) {
            for (let dot of mill.dots) {
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
    checkMovableDots(board = game.dots) {
        let movableDots = []
        for (let layer of board) {
            for (let dot of layer) {
                //Check if player has 3 chips left or dots neighbours has empty dot
                if (dot.player && dot.player === this && (this.chipCount === 3 || dot.neighbours.some(nDot => !nDot.player))) {
                    movableDots.push(dot)
                }
            }
        }
        return movableDots
    }
    checkIfCanMove() {
        if (getStage(this) !== 2) return true
        let movableDots = this.checkMovableDots()
        return movableDots.length > 0
    }
    hasNewMills() {
        this.mills = this.getUpdatedMills()
        return this.mills.some(m => m.new)
    }
    getUpdatedMills(board = game.dots) {
        let oldMills = this.mills
        let allMills = []
        for (let layer of board) {
            for (let d = 0; d < 8; d++) {
                let mill
                if (d % 2 === 0) {
                    //d = 0,2,4,6
                    //Checking mills on layers (even indexes)
                    mill = isMill(this, layer[d], layer[(d + 1) % 8], layer[(d + 2) % 8])
                } else if (layer[d].l === 0) {
                    //This only needs to be checked once and not on every layer (it caused duplicated mills otherwise)
                    //d = 1,3,5,7
                    //Checking mills between layers (odd indexes)
                    mill = isMill(this, board[0][d], board[1][d], board[2][d])
                }
                if (mill) {
                    let oldMill = oldMills.find(m => m.id == mill.id)
                    if (oldMill && !allMills.some(m => m.id == mill.id)) {
                        allMills.push(oldMill)
                    } else if (!allMills.some(m => m.id == mill.id)) {
                        allMills.push(mill)
                    }

                }
            }
        }
        //Now mills that are returned are mostly the same, just new ones are added and non excistant removed
        //instead of replacing them all which is helpful in future because we can then compare then mills unique id's
        return allMills
    }
}