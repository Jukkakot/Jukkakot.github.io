const MAXCHIPCOUNT = 8
var outBoxSize
var circleSize
var distance
var cnv
var scaledWidth
var game
var mX, mY
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
	function noScroll() {
		window.scrollTo(0, 0);
	  }
	  
	  // add listener to disable scroll
	  window.addEventListener('scroll', noScroll);
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
	mouseClicked()
}
function mousePressed() {
	return false
}
function mouseClicked() {
	movableDot = game.click()
}
function touchMoved() {
	mouseDragged()
}
function mouseDragged() {
	if (!movableDot && game.gameStarted) {
		movableDot = game.click()
	}
	
	if (movableDot && movableDot.player && movableDot.player === game.turn ) {
		var r = movableDot.player ? movableDot.r * 0.6 : movableDot.r * 2
		var size = movableDot.size()
		if(pointInCircle(mX, mY, movableDot.x * size, movableDot.y * size, r)) {
			locked = true
		}
	}
}
function touchEnded() {
	mouseReleased()
}
function mouseReleased() {

	if (movableDot && locked) {
		movableDot.moving = false
		game.prevDot = movableDot
		game.click()
	}
	locked = false
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
	push()
	textSize(circleSize)
	fill(0)
	textAlign(CENTER)
	text(floor(fps), width / 2 - circleSize, -height / 2 + circleSize)
	// text(mX + "," + mY, -200,-height/2+40 )
	pop()
}

