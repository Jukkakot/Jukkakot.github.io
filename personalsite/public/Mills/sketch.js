const MAXCHIPCOUNT = 18
var outBoxSize
var circleSize
var distance
var cnv
var scaledWidth
var game
var mX, mY, tX, tY
var fps
var locked
var movableDot
var redDot, blueDot
const defaultWidth = 800
function preload() {
	redDot = loadImage("./resources/img/redDot.png")
	blueDot = loadImage("./resources/img/blueDot.png")
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
	circleSize = floor(width / 35)
	distance = width / 4
}
function touchStarted() {
	// console.log(touches[0].x,touches[0].y)
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
	background(150)
	translate(width / 2, height / 2)
	mX = mouseX - width / 2
	mY = mouseY - height / 2
	if (touches[0]) {
		mX = touches[0].x - width / 2
		mY = touches[0].y - height / 2
	}

	game.hover()
	game.drawBoard()

	if (frameCount % 10 == 0) fps = frameRate()
	if (locked && movableDot) {
		movableDot.moving = true
		movableDot.move(mX, mY)
	}
	// textSize(30)
	// fill(0)
	// textAlign(CENTER)

	// text(mX + "," + mY, -100, height / 2 - 10)
	push()


	textSize(circleSize)
	fill(0)
	textAlign(CENTER)
	text(floor(fps), width / 2 - circleSize, -height / 2 + circleSize)
	// text(mX + "," + mY, -200,-height/2+40 )
	//Show mouse / touch location no screen
	stroke(255,0,255)
	strokeWeight(circleSize)
	point(mX,mY)

	pop()
}

