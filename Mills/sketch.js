const MAXCHIPCOUNT = 8
const EASING = 0.1
var ANGLE = 0.0
var SPEED =0.07
var outBoxSize
var circleSize
var distance
var cnv
var scaledWidth, scaledHeight
var game
var mX, mY
var fps
var locked
var movableDot
var redDot, blueDot
var restartButton
const defaultWidth = 800
const defaultHeight = 1000
var CircularJSON = window.CircularJSON
function preload() {
	redDot = loadImage("./resources/img/redDot.png")
	blueDot = loadImage("./resources/img/blueDot.png")
}
function setup() {
	cnv = createCanvas(defaultWidth, defaultHeight);
	restartButton = createButton("Restart\n(r)")
	restartButton.id("restartButton")
	restartButton.mousePressed(() => start())
	start()
	windowResized()
}
function keyPressed(e) {
	if (e.key === "r") {
		start()
	}
}
function start() {
	game = new Game()
	locked = false

	restartButton.position(cnv.position().x, cnv.position().y + height)
	restartButton.size(circleSize * 5, circleSize * 2)
	restartButton.style('font-size', circleSize * 0.7 + "px")
	restartButton.style('background-color', color(200, 200))
}
function windowResized() {
	scaledWidth = min(windowWidth, defaultWidth)
	scaledHeight = min(windowHeight, defaultHeight)
	cnv.resize(scaledWidth, scaledHeight)

	circleSize = floor(min(width, height) / 30)
	outBoxSize = min(width, height) - circleSize * 2
	distance = min(width, height) * 0.28

	restartButton.position(cnv.position().x, cnv.position().y + height)
	restartButton.size(circleSize * 5, circleSize * 2)
	restartButton.style('font-size', circleSize * 0.7 + "px")
	restartButton.style('background-color', color(200, 200))


}
function touchStarted(e) {
	if (e.target.id !== "restartButton") {
		//Disables double clicking issues when placing chips
		e.preventDefault()
	}
	mouseClicked()
}
function mousePressed() {
	return false
}
function mouseClicked() {
	if (touches[0]) {
		mX = touches[0].x - width / 2
		mY = touches[0].y - height / 2
	}
	game.click()
}
function touchMoved(e) {
	//Disables scrolling that made chip moving difficult
	e.preventDefault();
	mouseDragged()
}
function mouseDragged() {
	if (!game.gameStarted) return
	if (!movableDot) {
		movableDot = game.click()
	}

	if (movableDot && movableDot.player && movableDot.player === game.turn) {
		var r = movableDot.player ? movableDot.r * 0.6 : movableDot.r * 2
		var size = movableDot.size()
		if (pointInCircle(mX, mY, movableDot.x * size, movableDot.y * size, r)) {
			locked = true
		}
	} else {
		movableDot = undefined
	}
}
function touchEnded() {
	mouseReleased()
}
function mouseReleased() {
	if (!game.gameStarted) return
	if (movableDot && locked) {
		movableDot.moving = false
		game.prevDot = movableDot
		movableDot = undefined
		game.click()
	}
	locked = false
}
function draw() {
	if (frameCount === 1) windowResized()
	background(150)
	translate(width / 2, height / 2)
	mX = mouseX - width / 2
	mY = mouseY - height / 2
	if (touches[0]) {
		mX = touches[0].x - width / 2
		mY = touches[0].y - height / 2
	}
	game.draw()
	game.hover()
	game.updateAnimations()

	if (frameCount % 10 == 0) fps = frameRate()

	if (locked && movableDot) {
		movableDot.moving = true
		movableDot.move(mX, mY)
	}
	// textSize(30)
	// fill(0)
	// textAlign(CENTER)

	// text(mX + "," + mY, -100, height / 2 - 10)
	//Displaying fps
	push()
	textSize(circleSize)
	fill(0)
	textAlign(CENTER)
	text(floor(fps) + " fps", 0, -height * 0.45)
	// text(mX + "," + mY, -200,-height/2+40 )
	// // Show mouse / touch location no screen
	// stroke(255,0,255)
	// strokeWeight(circleSize)
	// point(mX,mY)
	pop()
}

