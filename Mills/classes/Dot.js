class Dot {
    constructor(x, y, startChip) {
        this.x = x
        this.y = y
        this.animLocX
        this.animLocY
        this.animTargetX
        this.animTargetY
        this.animPlayer
        this.player
        this.r = this.player ? circleSize * 2 : circleSize
        this.highlight = false
        this.hlColor = color(0, 255, 0)
        this.hover = false
        this.neighbours = []
        this.moving = false
        this.startChip = startChip
    }
    size() {
        if (this.startChip) return (outBoxSize - distance) / 2
        return (outBoxSize - distance * game.getLayer(this)) / 2
    }

    draw(eatMode) {
        // this.player = game.playerBlue
        // var size = (outBoxSize - distance * game.getLayer(this)) / 2
        push()

        if (this.player && !this.moving) {
            //Drawing player chip
            this.r = circleSize * 2
            strokeWeight(this.r / 10)

            if (this.hover) this.r *= 1.3

            this.highlight ? stroke(this.hlColor) : noStroke()
            if (eatMode && this.player.canEat(this)) {
                if (game.eatableAnimations.indexOf(this) === -1) {
                    this.setEatableDot()
                }
            } else if (this.canMove()) {
                this.drawMoveable()
            } else {
                this.drawDefault()
            }
            // noFill()

            //Text labels to help debugging
            // fill(0, 50, 255)
            // textAlign(CENTER)
            // textSize(circleSize)
            // text(l + "," + d, this.x * this.size(), this.y * this.size() - circleSize * 1.2)
            // text(this.x + "," + this.y, this.x * this.size(), this.y * this.size() + circleSize * 1.5)
        } else {
            //Drawing empty dot
            if (!game.gameStarted && this.hover && !eatMode) {
                //Drawing player chip when placing them at stage 1 of game
                this.r = circleSize * 2.6
                push()
                imageMode(CENTER);
                tint(100)
                image(game.turn.img, this.x * this.size(), this.y * this.size(), this.r, this.r);

                pop()
            } else {
                this.drawEmpty()
            }

        }
        //Text labels to help debugging
        // if(!this.startChip) {
        //     var l = game.getLayer(this)
        //     var d = game.dots[l].indexOf(this)
        //     fill(0, 50, 255)
        //     textAlign(CENTER)
        //     textSize(circleSize)
        //     // text(l + "," + d, this.x * this.size(), this.y * this.size() - circleSize * 0.7)
        //     text(this.x + "," + this.y, this.x * this.size(), this.y * this.size() + circleSize * 1.2)
        // }

        pop()
    }
    //Method to use when moving chip by dragging mouse
    move(x, y) {
        push()
        this.r = circleSize * 2
        imageMode(CENTER);
        image(this.player.img, x, y, this.r, this.r);
        pop()
    }
    click(prevDot) {
        if (prevDot && prevDot !== this && !this.player) {
            //Clicking empty spot
            if (this.neighbours.includes(prevDot) || prevDot.player.chipCount <= 3) {
                //Succesful move to neighbour dot or flying
                //Moving animation
                this.setTargetDot(prevDot)
                return true
            }

        } else if (this.player) {
            //Clicking a dot with player chip in it
            this.highlight = !this.highlight
            this.hlColor = color(0, 0, 255)

            if (this.player.chipCount > 3) {
                //Highlighting neighbours
                for (var n of this.neighbours) {
                    if (!n.player) {
                        n.highlight = !n.highlight
                        n.hlColor = color(0, 255, 0)
                    }
                }
            } else {
                //Highlighting all empty dots
                for (var layer of game.dots) {
                    for (var dot of layer) {
                        if (!dot.player) {
                            dot.highlight = true
                            dot.hlColor = color(0, 255, 0)
                        }
                    }
                }
            }

        }
        return false
    }
    canMove() {
        if (this.startChip) return false
        if (this.player && this.player.chipCount <= 3) return true
        //Checking for empty dot in neighbour dots
        for (var dot of this.neighbours) {
            if (!dot.player) return true
        }
        return false
    }
    setEatableDot() {
        game.eatableAnimations.push(this)
    }
    updateEatableAnimation() {
        var value = map(sin(ANGLE), -1, 1, 0.6, 1.4)
        this.r = this.r * value
        if (this.canMove()) {
            this.drawMoveable()
        } else {
            this.drawDefault()
        }
    }
    drawMoveable() {
        var index = game.movingAnimations.indexOf(this)
        if (index >= 0) {
            this.drawEmpty()
            return
        }
        push()
        strokeWeight(this.r / 30)
        stroke(color(0, 255, 160))
        circle(this.x * this.size(), this.y * this.size(), this.r * 1.1)
        imageMode(CENTER);
        image(this.player.img, this.x * this.size(), this.y * this.size(), this.r, this.r);
        pop()
    }
    drawDefault() {
        var index = game.movingAnimations.indexOf(this)
        if (index >= 0) {
            this.drawEmpty()
            return
        }
        push()
        imageMode(CENTER);
        image(this.player.img, this.x * this.size(), this.y * this.size(), this.r, this.r);
        pop()
    }
    drawEmpty() {
        push()
        this.r = circleSize
        noStroke()
        if (this.hover) this.r *= 1.3
        this.highlight ? fill(this.hlColor) : fill(0)
        circle(this.x * this.size(), this.y * this.size(), this.r)
        pop()
    }
    drawAnimation() {
        push()
        imageMode(CENTER);
        image(this.animPlayer.img, this.animLocX, this.animLocY, this.r * 2, this.r * 2);
        pop()
    }
    setTargetDot(prevDot) {
        this.player = prevDot.player
        // this.player = undefined
        this.animPlayer = prevDot.player

        this.animLocX = prevDot.x * prevDot.size();
        this.animLocY = prevDot.y * prevDot.size();

        this.animTargetX = this.x * this.size()
        this.animTargetY = this.y * this.size()
        // console.log("From", this.animLocX, this.animLocY, "To", this.animTargetX, this.animTargetY)
        prevDot.player = undefined
        game.movingAnimations.push(this)
    }
    updateMovingAnimation() {
        if (this.animTargetX !== this.animLocX || this.animTargetY !== this.animLocY) {

            let dx = this.animTargetX - this.animLocX;
            if (abs(dx) < 10) {
                this.animLocX = this.animTargetX
            } else {
                this.animLocX += dx * EASING;
            }

            let dy = this.animTargetY - this.animLocY;
            if (abs(dy) < 10) {
                this.animLocY = this.animTargetY
            } else {
                this.animLocY += dy * EASING;
            }

            if (this.animTargetX === this.animLocX && this.animLocY === this.animTargetY) {
                this.player = this.animPlayer

                this.animLocX = undefined
                this.animLocY = undefined

                this.animTargetX = undefined
                this.animTargetY = undefined

                this.animPlayer = undefined

                var index = game.movingAnimations.indexOf(this)

                game.movingAnimations.splice(index, 1)
            } else {
                this.drawAnimation()
            }

        }
    }
}
