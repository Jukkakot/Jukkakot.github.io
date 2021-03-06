class Chip {
    constructor(row, col) {
        var x = row * chipRadius * 2 + chipRadius + row * 5 + 2.5
        const options = {
            frictionAir: 0,
            friction: 0,
            restitution:0,
        }
        this.color = col
        this.name = this.color.levels[1] === 220 ? "yellow" : "red"
        // this.color = color(255)
        this.r = chipRadius
        this.body = Bodies.circle(x, chipRadius, this.r, options)
        // Matter.Body.setMass(this.body,this.body.mass *0.1)
        // this.body.setDensity(this.body, this.body.density*5)
        World.add(world, this.body)
    }
    isOffScreen() {
        var x = this.body.position.x;
        var y = this.body.position.y;
        return (x < -this.r || x > width + this.r || y > height);
    }
    show() {
        const pos = this.body.position;
        // const angle = this.body.angle;
        push();
        // ellipseMode(RADIUS);
        translate(pos.x, pos.y);
        // rotate(angle)
        // rectMode(CENTER)
        // tint(this.color)
        imageMode(CENTER);
        if(this.name ==="yellow"){
            image(yellowChip, 0, 0, this.r*2,this.r*2);
        } else {
            image(redChip, 0, 0, this.r*2,this.r*2);
        }
        
        // noStroke()
        // fill(this.color)
        // circle(0, 0, this.r)
        // // Drawing coordinates of the chip, good for debugging
        // fill(0)
        // textAlign(CENTER)
        // textSize(35)
        // text(Math.floor((pos.x / (chipRadius * 2))) + "," + Math.floor(7-(pos.y / (chipRadius * 2)) ), 0, 0)
        pop();
    }
    isMoving() {
        return this.body.velocity.y > 1
    }
}