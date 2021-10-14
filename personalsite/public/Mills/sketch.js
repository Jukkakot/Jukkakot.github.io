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
let audioIsOn = true
const defaultOption = {
	autoPlay: true,
	delay: true,
	autoPlay: true,
	random: false,
	iterative: false,
	mcts: false,
}
const OPTIONS = [
	{
		...defaultOption,
		text: "Manual",
		autoPlay: false
	},
	{
		...defaultOption,
		text: "Random",
		random: true,
	},
	{
		...defaultOption,
		text: "Minmax 1",
		difficulty: 1,
	},
	{
		...defaultOption,
		text: "Minmax 4",
		difficulty: 4,
	},
	{
		...defaultOption,
		text: "Minmax 6",
		difficulty: 6,
	},
	{
		...defaultOption,
		text: "Iterative 0.5s",
		iterative: true,
		time: 500,
	},
	{
		...defaultOption,
		text: "Iterative 1s",
		iterative: true,
		time: 1000,
	},
	{
		...defaultOption,
		text: "Iterative 3s",
		iterative: true,
		time: 3000,
	},
	{
		...defaultOption,
		text: "Iterative 5s",
		iterative: true,
		time: 5000,
	},
	{
		...defaultOption,
		text: "Iterative 10s",
		iterative: true,
		time: 10000,
	},
	{
		...defaultOption,
		text: "MCTS",
		mcts: true,
	},
]
let gameSettings = {
	lightOption: 7,
	darkOption: 0,
}

let outBoxSize, circleSize, distance
let cnv
let scaledWidth, scaledHeight
let game
let mX, mY
let fps
let locked
let movableDot
let darkDot, lightDot, backgroundImg, cursorImg, bAndwDotImg, loadingGif, spinnerGif, darkButton, audioOffImg, audioOnImg
let restartButton, suggestionButton, pDarkButton, pLightButton, autoPlayButton, audioButton
let chipPlacingSound, chipEatingSound, chipMovingSound

function preload() {
	//Images
	darkDot = loadImage("./resources/img/darkDotSharp.png")
	lightDot = loadImage("./resources/img/lightDotSharp.png")
	backgroundImg = loadImage("./resources/img/background2.jpg")
	bAndwDotImg = loadImage("./resources/img/blackAndWhiteDot.png")
	darkButton = loadImage("./resources/img/darkButton.png")
	audioOffImg = loadImage("./resources/img/audioOffButton.png")
	audioOnImg = loadImage("./resources/img/audioOnButton.png")

	loadingGif = createImg("./resources/img/loading.gif")
	loadingGif.hide()

	//Audio
	chipPlacingSound = loadSound("./resources/audio/chipPlacing.mp3")
	chipEatingSound = loadSound("./resources/audio/chipEating.mp3")
	chipMovingSound = loadSound("./resources/audio/chipMoving.mp3")
}
function playAudio(key) {
	//Not playing audio if muted
	if(!audioIsOn) return

	switch (key) {
		case "placing":
			chipPlacingSound.play()
			break;
		case "moving":
			chipMovingSound.play()
			break;
		case "eating":
			chipEatingSound.play()
			break;
		default:
			console.error("invalid audio key", key)
			break;
	}
}
function setupButton(txt, id, func) {
	let btn = createButton(txt)
	btn.id(id)
	btn.mousePressed(() => func())
	return btn
}
function setup() {
	cnv = createCanvas(defaultWidth, defaultHeight);
	textFont('Holtwood One SC')
	restartButton = setupButton("Restart", "restartButton", restartPress)
	suggestionButton = setupButton("Suggestion", "suggestionButton", suggestionPress)
	autoPlayButton = setupButton("Autoplay", "autoPlayButton", autoPlayButtonPress)
	pDarkButton = setupButton(" ", "pDarkButton", togglePlayerDark)
	pLightButton = setupButton(" ", "pLightButton", togglePlayerLight)
	audioButton = setupButton(" ", "audioButton", toggleAudio)
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
			let data = {
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
			"m: mute audio\n",
			"1: toggle light player button\n",
			"2: toggle dark player button\n",
			"h: help"
		)
	} else if (e.key === "m") {
		toggleAudio()
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
function toggleAudio() {
	audioIsOn = !audioIsOn
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

	let buttonWidth = circleSize * 7
	let buttonHeight = buttonWidth / 2.5

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

	pLightButton.position(cnv.position().x + circleSize / 3, cnv.position().y + cnv.height - buttonHeight)
	pLightButton.size(buttonWidth, buttonHeight)
	pLightButton.style('font-size', circleSize * 1 + "px")

	pDarkButton.position(pLightButton.position().x + buttonWidth, cnv.position().y + cnv.height - buttonHeight)
	pDarkButton.size(buttonWidth, buttonHeight)
	pDarkButton.style('font-size', circleSize * 1 + "px")

	audioButton.position(cnv.position().x + cnv.width - buttonHeight * 0.8, 0)
	audioButton.size(buttonHeight * 0.8, buttonHeight * 0.8)
	audioButton.style('font-size', circleSize * 1 + "px")

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
		let r = movableDot.player ? movableDot.r * 0.6 : movableDot.r * 2
		let size = movableDot.size()
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
	text(floor(fps) + " fps", width / 2 - circleSize * 4, -height * 0.48)
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
	if (audioIsOn) {
		audioButton.style('background', "transparent  url('./resources/img/audioOnButton.png') no-repeat center top")
		audioButton.style("background-size", "cover")
	} else {
		audioButton.style('background', "transparent  url('./resources/img/audioOffButton.png') no-repeat center top")
		audioButton.style("background-size", "cover")
	}
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