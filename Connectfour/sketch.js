const { Engine, World, Bodies, Body, Events, Vector } = Matter;
// const defaultCanvasSize = 800
let engine
let world
let chipRadius
let game
let gridImg, chipImg
let bopSound
let cnv
let restartButton
// let windowScale
function preload() {
  gridImg = loadImage("./resources/spiralGrid.png")
  chipImg = loadImage("./resources/chip.png")
  bopSound = loadSound("./resources/bop.mp3")
}
function windowResized() {
  // Math.min(windowWidth, windowHeight) < defaultCanvasSize ?
  //   chipRadius = Math.min(windowWidth, windowHeight) / 14.5 :
  //   chipRadius = 55


  // start()
  // windowScale = min(map(windowWidth, 0, 800, 0, 1), 1)
  // chipRadius = windowScale * 55
  // cnv.resize(chipRadius * 14.5, chipRadius * 14.5)
  restartButton.position(cnv.position().x, cnv.position().y + height)
  // scale(windowScale)
}
function setup() {
  chipRadius = 55
  cnv = createCanvas(chipRadius * 14.5, chipRadius * 14.5);
  // windowScale = min(map(windowWidth, 0, 800, 0, 1), 1)
  // chipRadius = windowScale * 55
  
  // cnv.resize(chipRadius * 14.5, chipRadius * 14.5)
  // restartButton.position(cnv.position().x, cnv.position().y + height)
  // scale(windowScale)
  restartButton = createButton("Restart\n(r)")
  restartButton.position(cnv.position().x, cnv.position().y + height)
  restartButton.size(chipRadius * 3, chipRadius)
  restartButton.style('font-size', chipRadius * 0.4 + "px")
  restartButton.style('background-color', color(200, 100))
  restartButton.mousePressed(() => start())
  start()

}
function start() {
  chipRadius = 55
  engine = Engine.create()
  world = engine.world
  game = new Game()
}
function mousePressed() {
  if (mouseX > 0 && mouseX < width && mouseY < height && !game.isOver) {
    var column = Math.floor(mouseX / (chipRadius * 2.07))
    column = min(column, 6)
    game.playRound(column)
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
  if (frameCount === 10) {
    windowResized()
  }
  background(100);
  Engine.update(engine)
  game.show()
}
