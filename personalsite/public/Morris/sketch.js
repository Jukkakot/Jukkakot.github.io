const MAXCHIPCOUNT = 18
var outBoxSize
var circleSize
var distance
var cnv
var scaledWidth
var game
var mX, mY
var dotImg
var fps
var locked
var movableDot
const defaultWidth = 800
function preload() {
	dotImg = loadImage("./resources/img/dotSquareInvert.png")
}
function setup() {
	cnv = createCanvas(defaultWidth, defaultWidth);
	start()
	windowResized()
}
function start() {
	game = new Game()
	locked = false
}
function windowResized() {
	scaledWidth = min(windowHeight, windowWidth, 800)
	cnv.resize(scaledWidth, scaledWidth)
	outBoxSize = width - 100
	circleSize = width / 35
	distance = width / 4
}
function touchStarted() {
	mousePressed()
}
function mousePressed() {
	movableDot = game.click()
	
}
function touchMoved() {
	mouseDragged()
}
function mouseDragged() {
	if (movableDot && movableDot.player && movableDot.player === game.turn) {
		locked = true
	}
}
function touchEnded() {
	mouseReleased()
}
function mouseReleased() {
	locked = false
	if (movableDot) {
		movableDot.moving = false
		game.prevDot = movableDot
		game.click()
	}
}
function draw() {
	background(150)
	translate(width / 2, height / 2)
	game.drawBoard()
	game.hover()
	if (frameCount % 10 == 0) fps = frameRate()
	if (locked && movableDot) {
		movableDot.moving = true
		movableDot.move(mX, mY)
	}
	// textSize(30)
	// fill(0)
	// textAlign(CENTER)
	mX = mouseX - width / 2
	mY = mouseY - height / 2
	// text(mX + "," + mY, -100, height / 2 - 10)
	// push()
	// textSize(30)
	// fill(0)
	// textAlign(CENTER)
	// text(floor(fps), -100, -height / 2 + 40)
	// // text(mX + "," + mY, -200,-height/2+40 )
	// pop()
}

