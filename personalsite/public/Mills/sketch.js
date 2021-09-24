const MAXCHIPCOUNT = 18
const EASING = 0.10
let ANGLE = 0.0
let SPEED = 0.07
const EMPTYDOT = '0'
const defaultWidth = 800
const defaultHeight = 1100
const ASPECTRATIO = defaultHeight / defaultWidth
const isMobileDevice = /Mobi/i.test(window.navigator.userAgent)
let LOADING = false
let DEBUG = false
let AUTOPLAY = false
let NODELAY = false
let SENDDATA = false
const OPTIONS = [
	{
		text: "Manual",
		autoPlay: false
	},
	{
		text: "Random",
		random: true,
		autoPlay: true,
		delay: true
	},
	{
		text: "Minmax 4",
		iterative: false,
		difficulty: 4,
		autoPlay: true,
		delay: true
	},
	{
		text: "Minmax 6",
		iterative: false,
		difficulty: 6,
		autoPlay: true,
		delay: true
	},
	{
		text: "Iterative 0.5s",
		iterative: true,
		time: 500,
		autoPlay: true,
		delay: false
	},
	{
		text: "Iterative 1s",
		iterative: true,
		time: 1000,
		autoPlay: true,
		delay: false
	},
	{
		text: "Iterative 3s",
		iterative: true,
		time: 3000,
		autoPlay: true,
		delay: false
	},
	{
		text: "Iterative 5s",
		iterative: true,
		time: 5000,
		autoPlay: true,
		delay: false
	},
	{
		text: "Iterative 10s",
		iterative: true,
		time: 10000,
		autoPlay: true,
		delay: false
	},
	{
		text: "MCTS",
		mcts: true,
		autoPlay: true,
		delay: false
	},
]
var gameSettings = {
	lightOption: 4,
	darkOption: 0,
}

var outBoxSize, circleSize, distance
var cnv
var scaledWidth, scaledHeight
var game
var mX, mY
var fps
var locked
var movableDot
var darkDot, lightDot, backgroundImg, cursorImg, bAndwDotImg, loadingGif, spinnerGif, darkButton
var restartButton, suggestionButton, pDarkButton, pLightButton, autoPlayButton

function preload() {
	darkDot = loadImage("./resources/img/darkDotSharp.png")
	lightDot = loadImage("./resources/img/lightDotSharp.png")
	backgroundImg = loadImage("./resources/img/background2.jpg")
	bAndwDotImg = loadImage("./resources/img/blackAndWhiteDot.png")
	loadingGif = createImg("./resources/img/loading.gif")
	darkButton = loadImage("./resources/img/darkButton.png")
	// spinnerGif = createImg("./resources/img/spinner.gif")
	loadingGif.hide()
	// buttonImg = loadImage("./resources/img/woodenButton.png")
	// cursorImg = loadImage("./resources/img/cursor.png")
}
function setup() {
	cnv = createCanvas(defaultWidth, defaultHeight);

	textFont('Holtwood One SC')

	restartButton = createButton("Restart")
	restartButton.id("restartButton")
	restartButton.mousePressed(() => restartPress())

	suggestionButton = createButton("Suggestion")
	suggestionButton.id("suggestionButton")
	suggestionButton.mousePressed(() => suggestionPress())

	autoPlayButton = createButton("Autoplay")
	autoPlayButton.id("autoPlayButton")
	autoPlayButton.mousePressed(() => autoPlayButtonPress())

	pDarkButton = createButton("P")
	pDarkButton.id("pDarkButton")
	pDarkButton.mousePressed(() => togglePlayerDark())

	pLightButton = createButton("P")
	pLightButton.id("pLightButton")
	pLightButton.mousePressed(() => togglePlayerLight())

	// difficultyButton = createButton("Difficulty")
	// difficultyButton.id("difficultyButton")
	// difficultyButton.mousePressed(() => toggleDifficulty())
	start()
	windowResized()
}
function keyPressed(e) {
	if (e.key === "r") {
		restartPress()
	} else if (e.key === "e") {
		NODELAY = !NODELAY
		console.log("NODELAY:", NODELAY)

	} else if (e.key === "t") {
		SENDDATA = !SENDDATA
		console.log("SENDDATA:", SENDDATA)
	} else if (e.key === "s") {
		suggestionPress()
	} else if (e.key === "d") {
		DEBUG = !DEBUG
		if (DEBUG) {
			const worker = new Worker("workers/WorkerHelpers.js")
			var data = {
				game: deepClone(game),
				board: game.stringify(),
				cmd: "debug",
				DEBUG: DEBUG,
			}
			worker.postMessage(deepClone(data))
		}
	} else if (e.key === "1") {
		togglePlayerLight()
	} else if (e.key === "2") {
		togglePlayerDark()
	} else if (e.key === "h") {
		console.log("r: restart\n",
			"e: no delay\n",
			"t: send data\n",
			"s: suggestion\n",
			"d: debug\n",
			"1: toggle light player button\n",
			"2: toggle dark player button\n",
			"h: help"
		)
	}
}
function suggestionPress() {
	// game.findBestMove("findMove").then(function (value) {
	// 	game.setSuggestion(value.data.move)
	// }).catch((error) => {
	// 	console.error(error);
	// });
	if (!game.turn.options.autoPlay) {
		game.findBestMove("suggestion")
	}
}
function autoPlayButtonPress() {
	AUTOPLAY = !AUTOPLAY

	game.playerLight.updateOptions(0)
	game.playerDark.updateOptions(0)

	game.initWorker()
}
function restartPress() {
	start()
}
function togglePlayerLight() {
	// game.settings.lightAutoplay = !game.settings.lightAutoplay
	// game.playerLight.autoPlay = game.settings.lightAutoplay

	game.playerLight.updateOptions()
	game.initWorker()
	if (game.turn.options.autoPlay) {
		game.findBestMove("findMove")
	}
}
function togglePlayerDark() {
	// game.settings.darkAutoplay = !game.settings.darkAutoplay
	// game.playerDark.autoPlay = game.settings.darkAutoplay
	game.playerDark.updateOptions()
	game.initWorker()
	if (game.turn.options.autoPlay) {
		game.findBestMove("findMove")
	}
}
function toggleDifficulty() {
	// game.settings.difficulty = game.settings.difficulty === 4 ? 6 : 4
	// game.difficulty = game.settings.difficulty
	// game.initWorker()
}
function start() {
	if (game && game.worker) {
		game.initWorker()
		gameSettings = {
			lightOption: game.playerLight.optionIndex,
			darkOption: game.playerDark.optionIndex,
		}
	}
	game = new Game(gameSettings)
	locked = false
	windowResized()
	suggestionButton.style("visibility", "visible")
	// autoPlayButton.style("visibility", "visible")
	pDarkButton.style("visibility", "visible")
	pLightButton.style("visibility", "visible")
	// difficultyButton.style("visibility", "visible")
	//This is to auto play the first move for light wood player when loading the site
	// && game.turn === game.playerLight
	if (game.turn.options.autoPlay) {
		game.findBestMove("findMove")
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

	loadingGif.size(circleSize * 3, circleSize)
	loadingGif.position(cnv.position().x + cnv.width / 2 - loadingGif.position().width / 2, cnv.position().y + cnv.height / 2 - circleSize * 3)
	if (!game.winner) {
		restartButton.position(cnv.position().x, cnv.position().y)
		restartButton.size(buttonWidth, buttonHeight)
		restartButton.style('font-size', circleSize * 0.6 + "px")
	}


	suggestionButton.position(cnv.position().x + restartButton.width, cnv.position().y)
	suggestionButton.size(buttonWidth, buttonHeight)
	suggestionButton.style('font-size', circleSize * 0.6 + "px")

	autoPlayButton.position(cnv.position().x + restartButton.width + suggestionButton.width, cnv.position().y)
	autoPlayButton.size(buttonWidth, buttonHeight)
	autoPlayButton.style('font-size', circleSize * 0.6 + "px")

	// pLightButton.position(cnv.position().x + restartButton.width + suggestionButton.width + autoPlayButton.width, cnv.position().y)
	// pLightButton.size(buttonHeight, buttonHeight)
	// pLightButton.style('font-size', circleSize * 1.5 + "px")

	// pDarkButton.position(cnv.position().x + restartButton.width + suggestionButton.width + autoPlayButton.width + pLightButton.width, cnv.position().y)
	// pDarkButton.size(buttonHeight, buttonHeight)
	// pDarkButton.style('font-size', circleSize * 1.5 + "px")

	pLightButton.position(cnv.position().x + circleSize / 3, cnv.position().y + cnv.height - buttonHeight)
	pLightButton.size(buttonWidth, buttonHeight)
	pLightButton.style('font-size', circleSize * 1 + "px")

	pDarkButton.position(pLightButton.position().x + buttonWidth, cnv.position().y + cnv.height - buttonHeight)
	pDarkButton.size(buttonWidth, buttonHeight)
	pDarkButton.style('font-size', circleSize * 1 + "px")

	// loadingGif.position(cnv.position(). , cnv.position().y)
	// loadingGif.size(buttonWidth*1000, buttonWidth*1000)
	// autoPlayButton.style('background', "transparent  url('./resources/img/greenButton.png') no-repeat center top")
	// autoPlayButton.style("background-size", "cover")


}
function touchStarted(e) {
	if (e.target.id !== "restartButton" &&
		e.target.id !== "suggestionButton" &&
		e.target.id !== "pDarkButton" &&
		e.target.id !== "pLightButton") {
		//Disables double clicking issues when placing chips
		//And other unwanted actions on mobile like selecting text on buttons
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
	if (getStage(game.turn) === 1) return
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
	if (getStage(game.turn) === 1) return
	if (movableDot && locked) {
		movableDot.moving = false
		game.prevDot = movableDot
		movableDot = undefined
		game.click()
	}
	locked = false
}
function draw() {
	drawUI()
	//Disabling hover effect for mobile
	if (!isMobileDevice)
		game.hover()
	game.draw()
	game.updateAnimations()

	updateButtons()
	drawFps()
	if (DEBUG) drawDebug()

	//Have to draw this after game.draw or else game dots will be drawn on top of moving chip
	if (locked && movableDot) {
		movableDot.moving = true
		movableDot.move(mX, mY)
	}
}
function drawFps() {
	if (frameCount % 10 == 0) fps = frameRate()
	push()
	textAlign(CENTER)
	textSize(circleSize * 0.8)
	fill(0)
	text(floor(fps) + " fps", width / 2 - circleSize * 2, -height * 0.48)
	pop()
}
function drawDebug() {
	push()
	textAlign(CENTER)
	textSize(circleSize * 0.8)
	//Mouse coords
	fill(0)
	text(mX + "," + mY, 0, -height * 0.42)
	// Show mouse / touch location no screen
	stroke(255, 0, 255)
	strokeWeight(circleSize)
	point(mX, mY)
	pop()
}
function updateButtons() {
	pDarkButton.html(game.playerDark.options.text)
	pLightButton.html(game.playerLight.options.text)
	// game.settings.difficulty === 4 ? difficultyButton.html("Difficulty: Easy") : difficultyButton.html("Difficulty: Hard")
	AUTOPLAY = game.playerLight.options.autoPlay && game.playerDark.options.autoPlay
	if (AUTOPLAY && game.winner == undefined) {
		autoPlayButton.style("visibility", "visible")
		autoPlayButton.style('background', "transparent  url('./resources/img/redButton.png') no-repeat center top")
		autoPlayButton.style("background-size", "cover")
	} else {
		autoPlayButton.style("visibility", "hidden")
	}
	// else {
	// 	autoPlayButton.style('background', "transparent  url('./resources/img/greenButton.png') no-repeat center top")
	// 	autoPlayButton.style("background-size", "cover")
	// }
}
function drawUI() {
	if (frameCount === 1) windowResized()
	background(backgroundImg)

	translate(width / 2, height / 2)

	if (touches[0]) {
		mX = touches[0].x - width / 2
		mY = touches[0].y - height / 2
	} else {
		mX = mouseX - width / 2
		mY = mouseY - height / 2
	}

}
function sendData(data = "test data", type = "test") {
	axios.defaults.baseURL = 'http://localhost:3001';
	let body = {
		type: type,
		data: {
			time: Date(),
			data: data
		}
	}
	axios.post("/api", body).then(res => {
		console.log(res.data)
	}).catch(err => {
		console.error("Error sending data", err)
	})
}