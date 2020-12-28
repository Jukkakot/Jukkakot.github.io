var outBoxSize
var circleSize
var distance
var cnv
var scaledWidth
var game
var mX, mY
const defaultWidth = 800
function setup() {
	cnv = createCanvas(defaultWidth, defaultWidth);
	start()
	windowResized()
}
function start() {
	game = new Game()
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
	game.click()
}
function draw() {
	background(150)
	translate(width / 2, height / 2)
	game.drawBoard()
	game.hover()
	// textSize(30)
	// fill(0)
	// textAlign(CENTER)
	mX = mouseX - width / 2
	mY = mouseY - height / 2
	// text(mX + "," + mY, -100, height / 2 - 10)
}

