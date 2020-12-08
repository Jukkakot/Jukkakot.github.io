function isValidShip(ship) {
  if (ship.includes(undefined)) return false
  if (ship.length < 2) return false
  if (!(isAllSameX(ship) || isAllSameY(ship))) return false

  //Checks if ship contains dublicate blocks
  if (new Set(ship).size !== ship.length) return false

  //Check if there is ships next to this ship
  for (var block of ship) {
    for (var n of block.neighbours) {
      if (!ship.includes(n) && n.isState(3)) return false
    }
  }
  return true
}

function isAllSameY(ship) {
  const y = ship[0].y
  for (var block of ship) {
    if (block.y !== y) {
      return false
    }
  }
  return true
}

function isAllSameX(ship) {
  const x = ship[0].x
  for (var block of ship) {
    if (block.x !== x) {
      return false
    }
  }
  return true
}

function mouseDragged() {
  if (!wasInGrid1() || shipsToAddP.length === 0) return

  const block = grid1.getBlock(mX, mY)
  if (block.isState(3)) return
  if (shipArr.length === 0 || (!shipArr.includes(block) && lastBlockOf(shipArr).neighbours.includes(block))) {
    shipArr.push(block)
    block.state = states[3]
  }
}

function mouseReleased() {
  if (!isValidShip(shipArr) || !shipsToAddP.includes(shipArr.length)) {
    for (var block of shipArr) {
      block.state = states[0]
    }
  } else {
    shipsToAddP.splice(shipsToAddP.indexOf(shipArr.length), 1)
  }
  shipArr = []
}

function isDiagNeighbour(b1, b2) {
  if (!b1.neighbours.includes(b2) || !b2.neighbours.includes(b1)) return false
  if (isAllSameX([b1, b2]) || isAllSameY([b1, b2])) return false
  return true
}

function drawShips() {
  if (shipsToAddP.length > 0) {
    drawText("Players ships to add:", BOXSIZE * 5, BOXSIZE * 11.7, BOXSIZE)
    for (var i = Math.min(...shipsToAddP); i < Math.max(...shipsToAddP) + 1; i++) {
      drawToAddShip(0, BOXSIZE * 10 + i * (BOXSIZE + BOXSIZE / 4), i, [...shipsToAddP])
    }
  } else if (!autoplay) {
    drawText("Player can start firing!", BOXSIZE * 5, BOXSIZE * 11.5, BOXSIZE)
  }

  if (shipsToAddO.length > 0) {
    drawText("Opponents ships to add:", BOXSIZE * 16, BOXSIZE * 11.7, BOXSIZE)
    for (var i = Math.min(...shipsToAddO); i < Math.max(...shipsToAddO) + 1; i++) {
      drawToAddShip(BOXSIZE * 12, BOXSIZE * 10 + i * (BOXSIZE + 10), i, [...shipsToAddO])
    }
  }
}

function drawToAddShip(x, y, size, ships) {
  var count = ships.filter(shipSize => shipSize === size).length
  if (count === 0) return

  for (var i = 1; i < size + 1; i++) {
    for (var j = 0; j < count; j++) {
      const sX = x + i * BOXSIZE - 20
      drawS(sX + (j * (BOXSIZE + BOXSIZE / 4) * size), y, BOXSIZE, BOXSIZE)
    }
  }
}