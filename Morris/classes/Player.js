class Player {
    constructor(color, img) {
        this.color = color
        this.chipCount = 0
        this.img = img
        this.mills = []
        this.millDots = []
    }
    drawMills() {
        this.mills.forEach(mill => mill.draw())
    }
    isDupeMill(mill) {
        for (var m of this.mills) {
            if (m.isSame(mill)) {
                return true
            }
        }
        return false
    }
    isValidMill(mill) {
        if (!this.isDupeMill(mill)) {

            for (var m of this.mills) {
                for (var dot of mill.dots) {
                    if (m.contain(dot)) {
                        return false
                    }
                }
            }
        }

        return true
    }
}