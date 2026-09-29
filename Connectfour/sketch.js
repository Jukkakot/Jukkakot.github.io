const { Engine, World, Bodies, Body, Events, Vector } = Matter;
// const defaultCanvasSize = 800
let engine
let world
let chipRadius
let game
let gridImg, chipImg
let redChip,yellowChip
let bopSound
let cnv
let restartButton
let fps
const isMobileDevice = /Mobi/i.test(window.navigator.userAgent)
// let windowScale
function preload() {
  gridImg = loadImage("./resources/spiralGrid.png")
  // chipImg = loadImage("./resources/smallChip.png")
  redChip = loadImage("./resources/redChip.png")
  yellowChip = loadImage("./resources/yellowChip.png")
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
  restartButton.position(cnv.position().x - restartButton.width, cnv.position().y + height - gridImg.height)
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
  restartButton.position(cnv.position().x - restartButton.width, cnv.position().y + height - gridImg.height)
  restartButton.size(chipRadius * 3, chipRadius*2)
  restartButton.style('font-size', chipRadius * 0.5 + "px")
  restartButton.style('background-color', color(200, 100))
  restartButton.mousePressed(() => start())
  
  if(isMobileDevice) {
    frameRate(30)
  }
  start()

}
function start() {
  chipRadius = 55
  engine = Engine.create()
  world = engine.world
  game = new Game()
  fps = 0

}
function touchStarted() {
  mousePressed()
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
  if (frameCount === 1) windowResized()
  background(100);
  if(isMobileDevice) {
    Engine.update(engine,50)
  } else {
    Engine.update(engine,25)
  }
  
  game.show()
  //Displaying fps
  if (frameCount % 60 == 0) fps = frameRate()
  push()
	textSize(chipRadius/2)
	fill(0)
	textAlign(CENTER)
	text(floor(fps), width-chipRadius/2, chipRadius/2)
	pop()
}
