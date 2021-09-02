class Dot {
    constructor(x, y, l, d, extraChip) {
        //x and y are indexes used to calculate exacty position of the dot
        this.x = x
        this.y = y

        //Layer of the board
        this.l = l

        //Index on the layer
        this.d = d

        //Radius
        this.r = this.player ? circleSize * 2 : circleSize

        this.id = this.l.toString() + this.d.toString()

        //Dots player
        this.player

        //Array storing this dots neighbour dots
        this.neighbours = []

        //Animation current x and y
        this.animLocX
        this.animLocY

        //Animation target x and y
        this.animTargetX
        this.animTargetY

        //Animation player is needed if game is going really fast so that it dosent matter if
        //Dots player is changed in the middle of animation again
        this.animPlayer

        this.extraChip = extraChip
        this.visible = true
        this.moving = false
        this.hover = false
        this.suggested = false
        this.highlight = false
        this.hlColor = color(0, 255, 0)
    }
    //Returns dots where this dot can move to
    getNeighbours() {
        if (getStage(this.player) !== 3) {
            return this.neighbours
        } else {
            return getEmptyDots(game.dots)
        }
    }
    size() {
        if (this.extraChip) return (outBoxSize - distance) / 2
        return (outBoxSize - distance * this.l) / 2
    }

    draw(eatMode) {
        //visibility is used for eaten chips
        if (!this.visible) return

        push()
        if (this.player && !this.moving) {
            //Drawing player chip
            if (this.hover) this.r *= 1.3
            this.r = circleSize * 2
            strokeWeight(this.r / 10)

            if (eatMode && this.player.canEat(this)) {
                var value = map(sin(ANGLE), -1, 1, 0.8, 1.4)
                this.r = this.r * value
            }
            if (this.canMove()) {
                this.drawMoveable()
            } else {
                this.drawDefault()
            }
            //Highlighting circle around the chip
            if (this.highlight) {
                stroke(this.hlColor)
                noFill()
                circle(this.x * this.size(), this.y * this.size(), this.r * 1.1)
            }
        } else {
            //Drawing empty dot
            if (getStage(game.turn) === 1 && this.hover && !eatMode) {
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
        if (this.suggested) {
            this.drawSuggested()
        }
        //Text labels to help debugging
        if (!this.extraChip && DEBUG) {
            var l = this.l
            var d = this.d
            fill(0, 0, 255)
            textAlign(CENTER)
            textSize(circleSize * 0.75)
            text(l + "," + d, this.x * this.size(), this.y * this.size() - circleSize * 0.7)
            text(this.x + "," + this.y, this.x * this.size(), this.y * this.size() + circleSize * 1.2)
            fill(255, 0, 0)
            text(toFastDot(this), this.x * this.size(), this.y * this.size() + circleSize / 3)

        }

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
    moveTo(dot) {
        dot.player = this.player
        this.player = undefined
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

            //Highlighting dots where player can move
            for (var n of this.getNeighbours()) {
                if (!n.player) {
                    n.highlight = !n.highlight
                    n.hlColor = color(0, 255, 0)
                }
            }
        }
        return false
    }
    canMove() {
        if (this.extraChip) return false
        //Always moveable if player is on stage 3 (flying)
        if (this.player && getStage(this.player) === 3) return true
        //Checking for empty dot in neighbour dots
        return this.neighbours.some(dot => !dot.player)
    }
    drawSuggested() {
        push()
        if (!this.player) this.r = circleSize * 2
        // this.r = circleSize * 2.5
        strokeWeight(this.r / 10)
        stroke(game.turn.color)
        circle(this.x * this.size(), this.y * this.size(), this.r * 1.5)
        pop()
    }
    drawMoveable() {
        //This is to not make the chip appear at the final position untill the animation has finished
        if (game.movingAnimations.includes(this)) {
            this.drawEmpty()
            return
        }
        push()
        strokeWeight(this.r / 10)
        stroke(color(0, 200, 40))
        circle(this.x * this.size(), this.y * this.size(), this.r * 1.05)
        imageMode(CENTER);
        image(this.player.img, this.x * this.size(), this.y * this.size(), this.r, this.r);
        pop()
    }
    drawDefault() {
        //This is to not make the chip appear at the final position untill the animation has finished
        if (game.movingAnimations.includes(this)) {
            this.drawEmpty()
            return
        }
        push()
        imageMode(CENTER);
        image(this.player.img, this.x * this.size(), this.y * this.size(), this.r, this.r);
        pop()
    }
    drawEmpty() {
        if (this.extraChip) return
        push()
        this.r = circleSize
        noStroke()
        if (this.hover) this.r *= 1.3
        this.highlight ? fill(this.hlColor) : fill(0)
        circle(this.x * this.size(), this.y * this.size(), this.r)
        pop()
    }
    drawMovingAnimation() {
        push()
        imageMode(CENTER);
        image(this.animPlayer.img, this.animLocX, this.animLocY, circleSize * 2, circleSize * 2);
        pop()
    }
    setTargetDot(prevDot) {
        this.player = prevDot.player
        this.animPlayer = prevDot.player

        this.animLocX = prevDot.x * prevDot.size();
        this.animLocY = prevDot.y * prevDot.size();

        this.animTargetX = this.x * this.size()
        this.animTargetY = this.y * this.size()
        // console.log("From", this.animLocX, this.animLocY, "To", this.animTargetX, this.animTargetY)
        prevDot.player = undefined

        //This helps during fast pace autoplay graphical glitches
        //Since the chip might be moved again before the animation has finished
        if (!game.movingAnimations.includes(this)) {
            game.movingAnimations.push(this)
        }

    }
    updateMovingAnimation() {
        let dx = this.animTargetX - this.animLocX;
        this.animLocX = abs(dx) > 5 ? this.animLocX + dx * EASING : this.animTargetX

        let dy = this.animTargetY - this.animLocY;
        this.animLocY = abs(dy) > 5 ? this.animLocY + dy * EASING : this.animTargetY

        //Animation has been finished
        if (this.animTargetX === this.animLocX && this.animLocY === this.animTargetY) {
            // this.player = this.animPlayer
            this.visible = true
            this.animLocX = undefined
            this.animLocY = undefined

            this.animTargetX = undefined
            this.animTargetY = undefined

            var index = game.movingAnimations.indexOf(this)

            game.movingAnimations.splice(index, 1)
        } else {
            this.drawMovingAnimation()
        }
    }
}
