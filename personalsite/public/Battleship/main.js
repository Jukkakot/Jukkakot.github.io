var BOXSIZE = 40
const states = ["", "miss", "hit", "ship", "hit ship"]
let stats = [0, 0]
let avgRounds = []
var rounds
var clickCounts = [0, 0]
let cnv
var grid1, grid2
var mX, mY
var shipArr = []
var shipsToAddP, shipsToAddO
var infiniteLoop
var showShips = autoplay = false

var smartReturnComputer, smartReturnPlayer
let showB, autoButton, randomShips, restartB

function start() {
  console.log("Starting..")
  if (rounds !== undefined && rounds !== 0 && rounds > 0) {
    avgRounds.push(rounds)
  }
  rounds = 0
  shipsToAddP = [2,3,3,4,5]
  shipsToAddO = [...shipsToAddP]
  infiniteLoop = false
  grid1 = new Grid(0, 0)
  grid2 = new Grid(12, 0)
  if (autoplay) {
    grid1.addRandomShips(shipsToAddP)
  }
  grid2.addRandomShips(shipsToAddO)
  smartReturnPlayer = smartReturnComputer = undefined
}
function windowResized() {
  const size = windowWidth/25
  if(size <= 40){
    BOXSIZE = size
  }
  
  
  cnv = createCanvas(BOXSIZE * 22, BOXSIZE * 20)
  cnv.mouseWheel(autoGame)
  
  randomShips.position(cnv.position().x, cnv.position().y + BOXSIZE * 10)
  autoButton.position(cnv.position().x + BOXSIZE * 10, cnv.position().y + BOXSIZE * 1.1)
  showB.position(cnv.position().x + BOXSIZE * 12, cnv.position().y + BOXSIZE * 10)
  restartB.position(cnv.position().x + BOXSIZE * 10, cnv.position().y)

  autoButton.size(BOXSIZE * 2, BOXSIZE)
  randomShips.size(BOXSIZE * 10, BOXSIZE)
  restartB.size(BOXSIZE * 2, BOXSIZE)
  showB.size(BOXSIZE * 10, BOXSIZE)

  autoButton.style('font-size',BOXSIZE/3+"px")
  randomShips.style('font-size',BOXSIZE/3+"px")
  restartB.style('font-size',BOXSIZE/3+"px")
  showB.style('font-size',BOXSIZE/3+"px")
  
}
function setup() {
  const size = windowWidth/25
  if(size <= 40){
    BOXSIZE = size
  }
  cnv = createCanvas(BOXSIZE * 22, BOXSIZE * 20)
  cnv.mouseWheel(autoGame)
  
  showB = createButton("Show ships")
  restartB = createButton("Restart")
  randomShips = createButton("Add random ships")
  autoButton = createButton("Toggle autoplay")
  
  randomShips.position(cnv.position().x, cnv.position().y + BOXSIZE * 10)
  autoButton.position(cnv.position().x + BOXSIZE * 10, cnv.position().y + BOXSIZE * 1.1)
  showB.position(cnv.position().x + BOXSIZE * 12, cnv.position().y + BOXSIZE * 10)
  restartB.position(cnv.position().x + BOXSIZE * 10, cnv.position().y)

  autoButton.style('font-size',BOXSIZE/3+"px")
  randomShips.style('font-size',BOXSIZE/3+"px")
  restartB.style('font-size',BOXSIZE/3+"px")
  showB.style('font-size',BOXSIZE/3+"px")
  
  autoButton.size(BOXSIZE * 2, BOXSIZE)
  randomShips.size(BOXSIZE * 10, BOXSIZE)
  restartB.size(BOXSIZE * 2, BOXSIZE)
  showB.size(BOXSIZE * 10, BOXSIZE)
  
  autoButton.style('background-color', color(25, 23, 200, 50))
  restartB.style('background-color', color(25, 23, 200, 50))
  showB.style('background-color', color(25, 23, 200, 50))
  randomShips.style('background-color', color(25, 23, 200, 50))
  randomShips.mousePressed(() => { grid1.addRandomShips(shipsToAddP) })
  showB.mousePressed(() => { showShips = !showShips })
  restartB.mousePressed(() => {
    start()
    loop()
  })
 autoButton.mousePressed(() => {
    autoplay = !autoplay
    if (shipsToAddP !== 0) {
      grid1.addRandomShips(shipsToAddP)
    }
    //start()
    loop()
  })
  start()
}

function autoGame() {
  if (shipsToAddO.length === 0 && shipsToAddP.length === 0) {
    if (!grid1.hasWon()) {
      smartReturnPlayer = grid2.clickSmart(smartReturnPlayer)
      clickCounts[0]++
    }
    if (!grid2.hasWon()) {
      smartReturnComputer = grid1.clickSmart(smartReturnComputer)
      clickCounts[1]++
    }
    rounds++
  }
}

function mouseClicked(e) {
  if (autoplay) return
  if (wasInGrid2() && !grid2.hasWon()) {
    if (shipsToAddP.length === 0 && !grid1.hasWon() && grid2.click() && !grid2.hasWon()) {
      smartReturnComputer = grid1.clickSmart(smartReturnComputer)
    }
    rounds++
  }
}

function draw() {
  if (frameCount === 1) windowResized()
  const sum = avgRounds.reduce((a, b) => a + b, 0);
  const avg = Math.floor((sum / avgRounds.length)) || 0;
  background(80);

  mX = Math.floor(mouseX / BOXSIZE)
  mY = Math.floor(mouseY / BOXSIZE)

  grid1.draw(true)
  grid2.draw(showShips)

  if (autoplay) {
    drawText("Autoplay ON", BOXSIZE * 11, BOXSIZE * 12.5, BOXSIZE)
    autoGame()
  }

  drawText("Stats:", BOXSIZE * 11, BOXSIZE * 4, BOXSIZE * 0.6)
  drawText(stats[1] + " / " + stats[0], BOXSIZE * 11, BOXSIZE * 5, BOXSIZE * 0.4)
  drawText("avg rounds:", BOXSIZE * 11, BOXSIZE * 6, BOXSIZE * 0.3)
  drawText(avg, BOXSIZE * 11, BOXSIZE * 7, BOXSIZE * 0.6)

  if (wasInGrid1()) {
    drawText(mX % 12 + "," + mY, width / 2, BOXSIZE*9, BOXSIZE)
    grid1.hover()
  }
  if (wasInGrid2()) {
    drawText(mX % 12 + "," + mY, width / 2, BOXSIZE*9, BOXSIZE)
    grid2.hover()
  }

  if (grid2.hasWon() || grid1.hasWon()) {
    if (grid2.hasWon()) {
      drawText('Player won!', width / 2, height / 4, BOXSIZE * 2)
      stats[1]++
    } else if (grid1.hasWon()) {
      drawText('Opponent won!', width / 2, height / 4, BOXSIZE * 2)
      stats[0]++
    }
    if (autoplay) {
      start()
      return
    }
    noLoop()
  }

  drawShips()

  if (infiniteLoop) {
    drawText("Could not set opponent ships", width / 2, height / 3, BOXSIZE)
    noLoop()
  }

}

function drawText(txt, x, y, size) {
  fill(0)
  noStroke()
  textSize(size);
  textAlign(CENTER, CENTER);
  text(txt, x, y);
  noFill()
}
function touchMoved() {
  // do some stuff
  return false;
}

