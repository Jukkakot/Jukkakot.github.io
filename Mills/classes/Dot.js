class Dot {
    constructor(x, y, l, d, extraChip) {
        this.x = x
        this.y = y
        this.l = l
        this.d = d
        this.id = this.l.toString() + this.d.toString()
        this.suggested = false
        this.animLocX
        this.animLocY
        this.animTargetX
        this.animTargetY
        //Animation player is needed if game is going really fast so that it dosent matter if dots
        //Player is changed in the middle of animation again
        this.animPlayer
        this.player
        this.r = this.player ? circleSize * 2 : circleSize
        this.highlight = false
        this.hlColor = color(0, 255, 0)
        this.hover = false
        this.neighbours = []
        this.moving = false
        this.extraChip = extraChip
        this.visible = true
    }
    //Returns dots where this dot can move to
    getNeighbours() {
        if (this.player.chipCount > 3) {
            return this.neighbours
        } else {
            return game.getEmptyDots(game.dots)
        }
    }
    size() {
        if (this.extraChip) return (outBoxSize - distance) / 2
        return (outBoxSize - distance * this.l) / 2
    }

    draw(eatMode) {
        //visibility is used for eaten chips
        if (!this.visible) return

        // this.player = game.playerLight
        // var size = (outBoxSize - distance * game.getLayer(this)) / 2
        push()
        if (this.player && !this.moving) {
            //Drawing player chip
            if (this.hover) this.r *= 1.3
            this.r = circleSize * 2
            strokeWeight(this.r / 10)

            if (eatMode && this.player.canEat(this)) {
                if (game.eatableAnimations.indexOf(this) === -1) {
                    this.setEatableDot()
                }
            } else if (this.canMove()) {
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
            text("L" + l + "," + "D" + d, this.x * this.size(), this.y * this.size() - circleSize * 0.7)
            text(this.x + "," + this.y, this.x * this.size(), this.y * this.size() + circleSize * 1.2)
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
                var emptyDots = getEmptyDots(game.dots)
                emptyDots.forEach(dot => {
                    dot.highlight = true
                    dot.hlColor = color(0, 255, 0)
                })

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
    setEatableDot() {
        game.eatableAnimations.push(this)
    }
    updateEatableAnimation() {
        var value = map(sin(ANGLE), -1, 1, 0.8, 1.4)
        this.r = this.r * value
        if (this.canMove()) {
            this.drawMoveable()
        } else {
            this.drawDefault()
        }
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
        var index = game.movingAnimations.indexOf(this)
        if (index >= 0) {
            this.drawEmpty()
            return
        }
        push()
        strokeWeight(this.r / 15)
        stroke(color(0, 200, 40))
        circle(this.x * this.size(), this.y * this.size(), this.r * 1.1)
        imageMode(CENTER);
        image(this.player.img, this.x * this.size(), this.y * this.size(), this.r, this.r);
        pop()
    }
    drawDefault() {
        //This is to not make the chip appear at the final position untill the animation has finished
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
        if (this.extraChip) return
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
        // Making sure to remove the dot from moving animations if its already there
        //This helps during fast pace autoplay graphical glitches
        var index = game.movingAnimations.indexOf(this)
        if (index >= 0) {
            this.visible = true
            this.animLocX = undefined
            this.animLocY = undefined

            this.animTargetX = undefined
            this.animTargetY = undefined
            game.movingAnimations.splice(index, 1)
        }
        game.movingAnimations.push(this)
    }
    updateMovingAnimation() {
        if (this.animTargetX !== this.animLocX || this.animTargetY !== this.animLocY) {

            let dx = this.animTargetX - this.animLocX;
            if (abs(dx) < 5) {
                this.animLocX = this.animTargetX
            } else {
                this.animLocX += dx * EASING;
            }

            let dy = this.animTargetY - this.animLocY;
            if (abs(dy) < 5) {
                this.animLocY = this.animTargetY
            } else {
                this.animLocY += dy * EASING;
            }
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
                //This is just to wait for all animations to finish before letting autoplay play another round
                // if (AUTOPLAY && game.movingAnimations.length === 0 && game.turn === game.playerLight) {

                //     game.playRound(game.findBestMove())
                // }
            } else {
                this.drawAnimation()
            }

        }
    }
}
