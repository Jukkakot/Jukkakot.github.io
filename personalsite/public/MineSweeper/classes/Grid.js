class Grid {
  constructor() {
    this.blocks = createBlocks()
    this.gameOver = false
    this.getGameOver = () => {
      for (var row of this.blocks) {
        for (var block of row) {
          if (block.isState(3)) {
            this.gameOver = true
            return this.gameOver
          }
        }
      }
      return this.gameOver
    }
    this.gameWon = () => {
      for (var row of this.blocks) {
        for (var block of row) {
          if (block.isState(0)) return false
          if (block.isMine && !block.isFlag) return false
          if (!block.isMine && block.isFlag) return false
        }
      }
      return true
    }
    this.click = (firstClick) => {
      const block = this.getBlock(mX, mY)
      if (firstClick && block.isMine) {
        block.isMine = false
        block.state = states[0]
        for (var n of block.neighbours) {
          if (n.value === 0) continue
          n.value--
        }
        this.randomMines(1)
      }
      this.gameOver = !block.click()
      return this.gameOver
    }
    this.rightClick = () => {
      if (wasInGrid()) {
        this.getBlock(mX, mY).rightClick()
      }
    }
    this.centerClick = (doClick) => {
        this.resetShown()
         if (wasInGrid()) {
            this.getBlock(mX, mY).centerClick(doClick)
        }
    }
    //Flags any 100% certain mines it can find according to the open block values
    this.getHint = (isAutoPlay) => {
      for (var row of this.blocks) {
        for (var block of row) {
          //isnt open or value is 0 -> skip
          if (!block.isState(1) || block.value === 0) continue

          var hiddenCount = 0
          var flagCount = 0
          for (var n of block.neighbours) {
            if ((n.isState(0) || n.isState(2))) {
              hiddenCount++
            }
            if (n.isFlag) {
              flagCount++
            }
          }
          if (hiddenCount === block.value) {
            //Found possible moves
            for (var n of block.neighbours) {
              if ((n.isState(0) || n.isState(2)) && !n.isFlag) {
                n.rightClick()
                if (isAutoPlay) {
                  return true
                }
              }
            }
            continue
          }
          if (flagCount === block.value) {
            //Found possible moves
            for (var n of block.neighbours) {
              if ((n.isState(0) || n.isState(2)) && !n.isFlag) {
                n.click()
                if (isAutoPlay) {
                  return true
                }
              }
            }
          }
        }
      }
      return false
    }
    this.randomMines = (num) => {
      var mCount = num
      while (mCount > 0) {
        const rX = Math.floor(random(0, W))
        const rY = Math.floor(random(0, H))
        var block = this.getBlock(rX, rY)
        if (block === undefined || block.isMine) continue
        mCount--
        block.isMine = true
        block.state = states[2]
        for (var n of block.neighbours) {
          n.value++
        }
      }
    }
    this.resetShown = () => {
      for (var row of this.blocks) {
         for (var block of row) {
          block.isShown = false
         }
       }
    }
    this.draw = (drawMines) => {
        if(!mouseIsPressed) {
            grid.resetShown()
        }
      for (var row of this.blocks) {
        for (var block of row) {
          block.draw(drawMines)
        }
      }
    }

    this.hover = () => {
      if (wasInGrid()) {
        this.getBlock(mX, mY).hover()
      }
    }

    this.getBlock = (x, y) => {
      if (x >= 0 && x < W && y >= 0 && y < H) {
        return this.blocks[y][x]
      }
    }
  }
}
function createBlocks() {
  var blocks = []
  for (var i = 0; i < H; i++) {
    const row = []
    for (var j = 0; j < W; j++) {
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

  for (var i = y - 1; i < y + 2; i++) {
    for (var j = x - 1; j < x + 2; j++) {
      if (blocks[i] !== undefined && blocks[i][j] !== undefined) {
        neighbours.push(blocks[i][j])
      }
    }
  }
  return neighbours
}
function wasInGrid() {
  return mX >= 0 && mX < W && mY >= 0 && mY < H
}
