var nodeCount
var checkedBoards = new Map()
var skipCount
var depthCount

function getNeighboursIndexes(i) {
    var layer = getLayer(i) * 8
    var neighbours = []
    //All
    neighbours.push(((i + layer + 8 - 1) % 8) + layer)
    neighbours.push(((i + layer + 8 + 1) % 8) + layer)
    if (i % 2 !== 0) {
        if (layer === 0) {
            //1st layer
            neighbours.push(((i + layer) % 8) + layer + 8)
        } else if (layer === 8) {
            //2nd layer
            neighbours.push(((i + layer) % 8) + layer - 8)
            neighbours.push(((i + layer) % 8) + layer + 8)
        } else if (layer === 16) {
            //3rd layer
            neighbours.push(((i + layer) % 8) + layer - 8)
        } else {
            console.log("invalid index", i)
        }
    }
    return neighbours
}
function getLayer(i) {
    return floor(i / 8)
}
function getNeighbours(board, i) {
    var neighbours = ""
    getNeighboursIndexes(i).forEach(i => {
        neighbours += board[i]
    });
    return neighbours
}

function getMills(board, player) {
    var oldMills = player.mills
    var allMills = []
    var pMill = player.char + player.char + player.char
    //d = 0,2,4,6
    //Checking mills on layers (even indexes)
    for (var i = 0; i < board.length; i += 2) {
        var str = board[i] + board[i + 1] + board[i + 2]
        if (str == pMill) {

            var oldMill = oldMills.find(m => m.fastId == mill.fastId)
            if (oldMill && !allMills.some(m => m.fastId == mill.fastId)) {
                allMills.push(oldMill)
            } else if (!allMills.some(m => m.fastId == mill.fastId)) {
                allMills.push(mill)
            }
            allMills.push([i, i + 1, i + 2])
        }
    }
    //d = 1,3,5,7
    //Checking mills between layers (odd indexes)
    for (var i = 1; i < 8; i += 2) {
        var str = board[i] + board[i + 8] + board[i + 2 * 8]
        if (str == pMill) {
            allMills.push([i, i + 8, i + 2 * 8])
        }
    }
    return allMills
}

function fastGetMoveableDots(board, player) {
    var movableDots = []
    for (var d = 0; d < board.length; d++) {
        var dot = board[d]
        //Check if player has 3 chips left or dots neighbours has empty dot
        if (dot == player.char && (getStage(player) === 3 || getNeighbours(board, d).includes(EMPTYDOT))) {
            movableDots.push(dot)
        }
    }
    player.movableDots = movableDots
    return movableDots
}
function fastCheckIfCanMove(board, player) {
    if (getStage(player) !== 2) return true
    var movableDots = getMoveableDots(board, player)
    return movableDots.length > 0
}
function fastCheckWin(board, player, oppPlayer) {
    var boardStr = addInfo(board, player, oppPlayer)
    if (player.chipCount + player.chipsToAdd < 3 || !fastCheckIfCanMove(board, player)) {
        checkedBoards.set(boardStr, -100000000)
        console.log(player.name, oppPlayer.name, "losing")
        return -100000000
    } else if (oppPlayer.chipCount + oppPlayer.chipsToAdd < 3 || !fastCheckIfCanMove(board, oppPlayer)) {
        checkedBoards.set(boardStr, 100000000)
        console.log(player.name, oppPlayer.name, "winning")
        return 100000000
    }
}
function fastGetPlayerDots(board, player) {
    var dots = []
    for (var d = 0; d < board.length; d++) {
        if (board[d] == player.char) {
            dots.push(d)
        }
    }
    return dots
}
function fastGetMoves(board, player, oppPlayer, eatMode) {
    var stage = eatMode ? 4 : getStage(player)
    switch (stage) {
        case 1:
            return {
                moves: fastGetS1Moves(board, player, oppPlayer),
                type: "placing",
            }
        case 2:
            return {
                moves: fastGetS2Moves(board, player, oppPlayer),
                type: "moving",
            }
        case 3:
            return {
                moves: fastGetS3Moves(board, player, oppPlayer),
                type: "moving",
            }
        case 4:
            return {
                moves: getEatableDots(board, oppPlayer),
                type: "eating",
            }
        default:
            console.log("Problem?", stage)
            break;
    }
}
function fastGetEmptyDots(board) {
    var dots = []
    for (var d = 0; d < board.length; d++) {
        if (board[d] == EMPTYDOT) dots.push(d)
    }
    return dots
}
function fastGetS1Moves(board) {
    //Sorting the dots by their neighbour count
    return fastGetEmptyDots(board).sort((a, b) => getNeighboursIndexes(b).length - getNeighboursIndexes(a).length)
}
function fastGetS2Moves(board, player) {
    var moves = []

    for (var fromDot of fastGetMoveableDots(board, player)) {
        for (var toDot of getNeighboursIndexes(fromDot)) {
            if (board[toDot] == EMPTYDOT) {
                // if (!moves.includes([dot, emptyDot]))
                moves.push([fromDot, toDot])
            }
        }
    }
    return moves
}
function fastGetS3Moves(board, player) {
    var moves = []
    var fromDots = fastGetPlayerDots(board, player)
    var toDots = fastGetEmptyDots(board)

    for (var fromDot of fromDots) {
        for (var toDot of toDots) {
            // if (!moves.includes([fromDot, toDot]))
            moves.push([fromDot, toDot])
        }
        return moves
    }
}
function fastGetEatableDots(board, player) {
    var dotsInMill = getPlayerMillDots(board, player)
    var allDots = getPlayerDots(board, player)

    //if there is same amount if dots in mills as total player dots, then all of them are eatable
    if (dotsInMill.length === allDots.length)
        return allDots

    var eatableDots = []
    //Otherwise have to look for the dots that are not in mills
    eatableDots.push(...allDots.filter(chip => !dotsInMill.includes(chip)))
    return eatableDots
}