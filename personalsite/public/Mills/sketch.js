const MAXCHIPCOUNT = 18
const EASING = 0.15
var idNumber = 0
var ANGLE = 0.0
var SPEED = 0.07
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
var darkDot, lightDot, backgroundImg, cursorImg, bAndwDotImg
var restartButton
var suggestionButton
var autoPlayButton
const defaultWidth = 800
const defaultHeight = 1100
const ASPECTRATIO = defaultHeight / defaultWidth
var DEBUG = false
var AUTOPLAY = true
function getIdNumber() {
	return idNumber++
}
function preload() {
	darkDot = loadImage("./resources/img/darkDotSharp.png")
	lightDot = loadImage("./resources/img/lightDotSharp.png")
	backgroundImg = loadImage("./resources/img/background2.jpg")
	bAndwDotImg = loadImage("./resources/img/blackAndWhiteDot.png")
	// buttonImg = loadImage("./resources/img/woodenButton.png")
	// cursorImg = loadImage("./resources/img/cursor.png")
}
function setup() {
	cnv = createCanvas(defaultWidth, defaultHeight);
	restartButton = createButton("Restart\n(r)")
	restartButton.id("restartButton")
	restartButton.mousePressed(() => restartPress())

	suggestionButton = createButton("Suggestion\n(s)")
	suggestionButton.id("suggestionButton")
	suggestionButton.mousePressed(() => suggestionPress())

	autoPlayButton = createButton("Autoplay\n(a)")
	autoPlayButton.id("autoPlayButton")
	autoPlayButton.mousePressed(() => autoPlayButtonPress())
	start()
	windowResized()
}
function keyPressed(e) {
	if (e.key === "r") {
		restartPress()
	} else if (e.key === "b") {
		game.playRound(game.findBestMove())
	} else if (e.key === "s") {
		suggestionPress()
	} else if (e.key === "d") {
		DEBUG = !DEBUG
		if (DEBUG) {
			console.log("stages",game.playerDark.name, getStage(game.playerDark), game.playerLight.name, getStage(game.playerLight))
			
			console.log("Light Wood")
			console.log(scoreBoard(game.dots, game.playerLight, game.playerDark))
			console.log("Dark Wood")
			console.log(scoreBoard(game.dots, game.playerDark, game.playerLight))
		}
	} else if (e.key === "a") {
		autoPlayButtonPress()
	}
}
function suggestionPress() {
	game.setSuggestion(game.findBestMove())
}
function autoPlayButtonPress() {
	AUTOPLAY = !AUTOPLAY
	if (AUTOPLAY && game.turn === game.playerLight) {
		game.playRound(game.findBestMove())
	}
}
function restartPress() {
	start()
	if (AUTOPLAY && game.turn === game.playerLight) {
		game.playRound(game.findBestMove())
	}
}
function start() {
	game = new Game()
	locked = false
	windowResized()
	suggestionButton.style("visibility", "visible")
	autoPlayButton.style("visibility", "visible")
	//This is to auto play the first move for light wood player when loading the site
	if (AUTOPLAY && game.turn === game.playerLight) {
		game.playRound(game.findBestMove())
	}
}
function windowResized() {
	scaledWidth = min(windowWidth, defaultWidth)
	scaledHeight = min(windowHeight, defaultHeight)
	cnv.resize(scaledWidth, scaledHeight)

	circleSize = floor(min(width, height / ASPECTRATIO) / 30)
	outBoxSize = min(width, height / ASPECTRATIO) - circleSize * 2.5
	distance = min(width, height / ASPECTRATIO) * 0.28

	var buttonWidth = circleSize * 7
	var buttonHeight = buttonWidth / 2.5

	restartButton.position(cnv.position().x, cnv.position().y)
	restartButton.size(buttonWidth, buttonHeight)
	restartButton.style('font-size', circleSize * 0.7 + "px")

	suggestionButton.position(cnv.position().x + restartButton.width, cnv.position().y)
	suggestionButton.size(buttonWidth, buttonHeight)
	suggestionButton.style('font-size', circleSize * 0.7 + "px")

	autoPlayButton.position(cnv.position().x + restartButton.width + suggestionButton.width, cnv.position().y)
	autoPlayButton.size(buttonWidth, buttonHeight)
	autoPlayButton.style('font-size', circleSize * 0.7 + "px")
	// autoPlayButton.style('background', "transparent  url('./resources/img/greenButton.png') no-repeat center top")
	// autoPlayButton.style("background-size", "cover")


}
function touchStarted(e) {
	if (e.target.id !== "restartButton" && e.target.id !== "suggestionButton" && e.target.id !== "autoPlayButton") {
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
	background(backgroundImg)
	if (frameCount === 1) windowResized()
	// background(150)
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
	if (AUTOPLAY) {
		autoPlayButton.style('background', "transparent  url('./resources/img/redButton.png') no-repeat center top")
		autoPlayButton.style("background-size", "cover")
	} else {
		autoPlayButton.style('background', "transparent  url('./resources/img/greenButton.png') no-repeat center top")
		autoPlayButton.style("background-size", "cover")
	}


	push()
	textAlign(CENTER)
	if (AUTOPLAY && !game.winner) {
		fill(0)
		textSize(circleSize * 1.5)
		text("AUTOPLAY", 0, -height * 0.38)
	}
	//Displaying fps
	textSize(circleSize)
	fill(0)

	text(floor(fps) + " fps", width / 2 - circleSize * 2, -height * 0.45)

	if (DEBUG) {
		//Mouse coords
		fill(0)
		text(mX + "," + mY, 0, -height * 0.42)
		// Show mouse / touch location no screen
		stroke(255, 0, 255)
		strokeWeight(circleSize)
		point(mX, mY)
	}

	pop()
}

