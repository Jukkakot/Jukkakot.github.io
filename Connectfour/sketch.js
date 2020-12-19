const { Engine, World, Bodies, Body, Events, Vector } = Matter;
let engine
let world
let chipRadius
let game
let gridImg
let bopSound

function preload() {
  gridImg = loadImage("./resources/grid.png")
  bopSound = loadSound("./resources/bop.mp3")
}
function setup() {
  createCanvas(800, 800);
  start()
  
}
function start() {
  chipRadius = 55
  engine = Engine.create()
  world = engine.world
  Events.on(engine, 'collisionStart', collision);
  function collision(event) {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
      var bodyA = pairs[i].bodyA;
      var bodyB = pairs[i].bodyB;
      if (Math.abs(bodyA.velocity.y) > 1 || Math.abs(bodyB.velocity.y) > 1) {
        if (bodyA.label == 'Circle Body' && bodyB.label == 'Circle Body') {
          bopSound.play()
        } else if (bodyA.label == 'Circle Body' && bodyB.label == 'floor') {
          bopSound.play()
        } else if (bodyA.label == 'floor' && bodyB.label == 'Circle Body') {
          bopSound.play()
        }
      }
    }
  }
  game = new Game()
}
function mousePressed() {
  if (mouseX > 0 && mouseX < width) {
    game.playRound()
  }

}
function keyPressed(e) {
  if (e.key === "r") {
    start()
  } else if (e.key === "b") {
    // bopSound.rate(100)
    bopSound.play()
  }
}
function draw() {
  background(80);
  Engine.update(engine)
  game.show()
  // console.log(mouseX)
}
