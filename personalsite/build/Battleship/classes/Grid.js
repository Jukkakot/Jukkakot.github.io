class Grid {
  constructor(x, y) {
    this.blocks = createBlocks(x, y)

    this.randomShips = (sCount) => {
      for (var row of this.blocks) {
        for (var block of row) {
          if (random() < sCount) {
            block.state = states[3]
          }
        }
      }
    }

    this.click = () => {
      return this.getBlock(mX, mY).click()
    }

    this.clickRandom = () => {
      while (true) {
        const rX = Math.floor(random(0, 10))
        const rY = Math.floor(random(0, 10))
        var rBlock = this.getBlock(rX, rY)
        if (rBlock.isState(0) || rBlock.isState(3)) {
          rBlock.click()
          break
        }
      }
    }

    this.draw = (drawShips) => {
      for (var row of this.blocks) {
        for (var block of row) {
          block.draw(drawShips)
        }
      }
    }

    this.hover = () => {
      this.getBlock(mX, mY).hover()
    }

    this.getBlock = (x, y) => {
      x = x % 12
      if (x >= 0 && x <= 9 && y >= 0 && y <= 9) {
        return this.blocks[y][x]
      } else {
        return false
      }
    }

    this.hasWon = () => {
      return hasState(states[4], this.blocks) && !hasState(states[3], this.blocks)
    }

    this.addRandomShips = (shipsToAdd) => {
      for (var size of shipsToAdd) {
        for (var block of buildRandomShip(size, this.blocks)) {
          block.state = states[3]
        }
      }
      shipsToAdd.splice(0)
    }

    this.clickSmart = (args) => {
      if (args === undefined) return [giveRandBlock(this.blocks), []]

      const currBlock = args[0]
      const hitBlocks = args[1]

      currBlock.click()
      if (currBlock.isState(4)) hitBlocks.push(currBlock)

      if (hitBlocks.length > 0) {
        for (var block of hitBlocks) {
          for (var nei of block.neighbours) {
            if (nei.isState(0) || nei.isState(3)) return [nei, hitBlocks]
          }
        }
      }
      return [giveRandBlock(this.blocks), []]
    }
  }
}

function giveRandBlock(blocks) {
  var loopCount = 0
  while (loopCount++ < 400) {
    var rX = Math.floor(random(0, 10))
    var rY = Math.floor(random(0, 10))
    if (loopCount < 200) {
      if (!isEven(rX) && !isEven(rY)) continue
      if (isEven(rX) && isEven(rY)) continue
      if (rX === rY) continue
    }
    const block = blocks[rY][rX]
    if (block !== undefined && (block.isState(0) || block.isState(3))) return block
  }

  console.log("Could not find random empty block in 400 tries")
  
  //If looped over 400 times, just find next empty block
  for (var row of blocks) {
    for (var block of row) {
      if (block.isState(0) || block.isState(3)) return block
    }
  }
  //Couldn't find available block (Should never be the case though)
  return false
}

function buildRandomShip(size, blocks) {
  var loopCounter = 0
  var ship = []
  while (ship.length != size || !isValidShip(ship)) {
    var prevBlock

    if (ship.length === 0) {
      //Find random block to start building new ship from
      while (ship.length === 0) {
        var rX = Math.floor(random(0, 10))
        var rY = Math.floor(random(0, 10))
        prevBlock = blocks[rY][rX]
        if (prevBlock.isState(0)) {
          ship.push(prevBlock)
        }
      }
    }

    prevBlock = lastBlockOf(ship)

    var addedBlock = false
    for (var n of prevBlock.neighbours) {
      if (!n.isState(0)) continue
      if (!isDiagNeighbour(prevBlock, n) && isValidShip([...ship, n])) {
        ship.push(n)
        addedBlock = true
        break
      }
    }
    //If didin't add new block, means that it wasnt possible -> restart making ship
    if (!addedBlock) ship = []

    if (loopCounter++ > 1000) {
      infiniteLoop = true
      return ship
    }
  }
  return ship
}

function hasState(state, ship) {
  for (var block of ship) {
    if (block.find(b => b.state === state)) return true
  }
  return false
}

function createBlocks(x, y) {
  var blocks = []
  for (var i = y; i < y + 10; i++) {
    const row = []
    for (var j = x; j < x + 10; j++) {
      row.push(new Block(j, i))
    }
    blocks.push(row)
  }

  for (var row of blocks) {
    for (var block of row) {
      block.neighbours = giveNeighbours(block.x, block.y, blocks)
    }
  }
  return blocks
}

function giveNeighbours(x, y, blocks) {
  var neighbours = []
  x = x % 12

  //Top
  if (y - 1 >= 0) {
    neighbours.push(blocks[y - 1][x])
    //Top left
    if (x - 1 >= 0) {
      neighbours.push(blocks[y - 1][x - 1])
    }
    //Top right
    if (x + 1 <= 9) {
      neighbours.push(blocks[y - 1][x + 1])
    }
  }

  //Bottom
  if (y + 1 <= 9) {
    neighbours.push(blocks[y + 1][x])
    //Bottom left
    if (x - 1 >= 0) {
      neighbours.push(blocks[y + 1][x - 1])
    }
    //Bottom right
    if (x + 1 <= 9) {
      neighbours.push(blocks[y + 1][x + 1])
    }
  }

  //Left
  if (x - 1 >= 0) {
    neighbours.push(blocks[y][x - 1])
  }
  //Right
  if (x + 1 <= 9) {
    neighbours.push(blocks[y][x + 1])
  }
  //Shuffle neighbour array to randomize game stuff more
  return shuffle(neighbours)
}

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

function wasInGrid1() {
  return mX >= 0 && mX <= 9 && mY >= 0 && mY <= 9
}

function wasInGrid2() {
  return mX >= 12 && mX <= 21 && mY >= 0 && mY <= 9
}

function lastBlockOf(arr) {
  if (arr.length === 0) return
  return arr[arr.length - 1]
}

function isEven(num) {
  return num % 2 == 0
}