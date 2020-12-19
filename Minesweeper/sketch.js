const defaultBoxSize = 30
const defaultCanvasSize = defaultBoxSize * 24
var BOXSIZE = defaultBoxSize
//                0         1         2           3                 4, "flag"
const states = ["hidden", "open", "hiddenMine", "openMine"]
const difficulties = [
  [9, 9, 10],
  [16, 16, 40],
  [24, 24, 99]
]
var difficulty = 0
var W = difficulties[difficulty][0]
var H = difficulties[difficulty][1]
var mineCount = difficulties[difficulty][2]
let cnv
var grid
var mX, mY
var wasRightClick = false
var showMines = false
var firstClick

function scaling() {
  // size >= defaultBoxSize ? BOXSIZE = defaultBoxSize : BOXSIZE = size
  // 
  Math.min(windowWidth, windowHeight) < defaultCanvasSize ?
    BOXSIZE = Math.min(windowWidth, windowHeight) / W :
    BOXSIZE = defaultCanvasSize / W
  // cnv = createCanvas(defaultCanvasSize, defaultCanvasSize + BOXSIZE*0.4*H*0.4)
  cnv = createCanvas(BOXSIZE * W, (BOXSIZE * H) + BOXSIZE * 0.15 * H)
  document.getElementById("defaultCanvas0").oncontextmenu = function () { return false; }

  restartB.style('background-color', color(150, 150, 150))
  showB.style('background-color', color(150, 150, 150))
  easyB.style('background-color', color(0, 250, 0, 50))
  mediumB.style('background-color', color(0, 0, 250, 50))
  hardB.style('background-color', color(250, 0, 0, 50))
  hintB.style('background-color', color(80))

  hintB.position(cnv.position().x + BOXSIZE * W * 0.39, cnv.position().y + BOXSIZE * H + BOXSIZE * 0.4 * H * 0.1)
  hintB.size(W * BOXSIZE * 0.17, BOXSIZE * 0.4 * H * 0.2)
  hintB.style('font-size', BOXSIZE * 0.4 * H * 0.2 * 0.3 + "px")

  showB.position(cnv.position().x + BOXSIZE * W * 0.20, cnv.position().y + BOXSIZE * H + BOXSIZE * 0.4 * H * 0.1)
  showB.size(W * BOXSIZE * 0.17, BOXSIZE * 0.4 * H * 0.2)
  showB.style('font-size', BOXSIZE * 0.4 * H * 0.2 * 0.3 + "px")

  restartB.position(cnv.position().x + BOXSIZE * W * 0.01, cnv.position().y + BOXSIZE * H + BOXSIZE * 0.4 * H * 0.1)
  restartB.size(W * BOXSIZE * 0.17, BOXSIZE * 0.4 * H * 0.2)
  restartB.style('font-size', BOXSIZE * 0.4 * H * 0.2 * 0.3 + "px")

  easyB.position(cnv.position().x + BOXSIZE * W * 0.58, cnv.position().y + BOXSIZE * H + BOXSIZE * 0.4 * H * 0.1)
  easyB.size(W * 0.1 * BOXSIZE, BOXSIZE * 0.4 * H * 0.2)
  easyB.style('font-size', BOXSIZE * 0.4 * H * 0.2 * 0.3 + "px")

  mediumB.position(cnv.position().x + BOXSIZE * W * 0.71, cnv.position().y + BOXSIZE * H + BOXSIZE * 0.4 * H * 0.1)
  mediumB.size(W * 0.1 * BOXSIZE, BOXSIZE * 0.4 * H * 0.2)
  mediumB.style('font-size', BOXSIZE * 0.4 * H * 0.2 * 0.3 + "px")

  hardB.position(cnv.position().x + BOXSIZE * W * 0.84, cnv.position().y + BOXSIZE * H + BOXSIZE * 0.4 * H * 0.1)
  hardB.size(W * 0.1 * BOXSIZE, BOXSIZE * 0.4 * H * 0.2)
  hardB.style('font-size', BOXSIZE * 0.4 * H * 0.2 * 0.3 + "px")

}
function setup() {
  cnv = createCanvas(defaultCanvasSize, defaultCanvasSize + BOXSIZE * 0.4 * H * 0.4)
  cnv.mouseWheel(scrollGame)
  restartB = createButton("Restart\n(r)")
  showB = createButton("Show mines\n(m)")
  easyB = createButton("Easy\n(1)")
  mediumB = createButton("Medium\n(2)")
  hardB = createButton("Hard\n(3)")
  hintB = createButton("Give hint\n(h)")
  restartB.mousePressed(start)

  showB.mousePressed(() => {
    showMines = !showMines
  })
  easyB.mousePressed(() => {
    if (difficulty === 0) return
    difficulty = 0
    start()
  })
  mediumB.mousePressed(() => {
    if (difficulty === 1) return
    difficulty = 1
    start()
  })
  hardB.mousePressed(() => {
    if (difficulty === 2) return
    difficulty = 2
    start()
  })
  hintB.mousePressed(() => {
    if (!grid.gameOver && !grid.gameWon()) {
      grid.getHint(true)
    }
  })
  start()
}
function scrollGame() {
  if (!grid.gameOver && !grid.gameWon()) {
    grid.getHint(true)
  }

}
function start() {
  console.log("Starting..")
  firstClick = true
  W = difficulties[difficulty][0]
  H = difficulties[difficulty][1]
  mineCount = difficulties[difficulty][2]
  grid = new Grid(W, H)
  grid.randomMines(mineCount)
  scaling()
}
function windowResized() {
  scaling()
}

function mousePressed() {
  if (grid.gameWon()) return
  if (mouseButton === RIGHT && !grid.gameOver) {
    grid.rightClick()
  }
}
function mouseClicked() {
  if (grid.gameWon()) return
  if (wasRightClick === RIGHT || grid.gameOver) return
  if (wasInGrid()) {
    grid.click(firstClick)
    if (firstClick) firstClick = false
  }
}
function keyPressed(e) {
  //Spacebar
  if (e.key === "r") {
    start()
  } else if (e.key === "m") {
    showMines = !showMines
  }  else if (e.key === "h") {
      grid.getHint(true)
  } else if (e.key === "1" ) {
    if (difficulty !== 1){
      difficulty = 0
      start()
    } 
  } else if (e.key === "2" ) {
    if (difficulty !== 1){
      difficulty = 1
      start()
    } 
  } else if (e.key === "3" ) {
    if (difficulty !== 2){
      difficulty = 2
      start()
    } 
  }
}
function draw() {
  if (frameCount === 1) scaling()
  background(80)
  mX = Math.floor(mouseX / BOXSIZE)
  mY = Math.floor(mouseY / BOXSIZE)
  grid.draw(grid.getGameOver() || showMines || grid.gameWon())
  // grid.draw(true)

  if (wasInGrid()) {
    // drawText(mX + "," + mY, width / 2, BOXSIZE * H + BOXSIZE*0.4*H*0.01 , BOXSIZE*0.4*H*0.2 *0.5)
    grid.hover()
  }
  // drawText('Player won!', width / 2, height / 4, BOXSIZE)

  if (grid.gameWon()) {
    drawText('Player won!', width / 2, height / 4, BOXSIZE)
  }
  if (grid.gameOver) {
    drawText('Game over!', width / 2, height / 4, BOXSIZE)
  }
}
function drawText(txt, x, y, size) {
  textAlign(CENTER, CENTER);
  fill(0)
  noStroke()
  textSize(size);
  text(txt, x, y);
  noFill()
}



