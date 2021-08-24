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
    var mills = []
    var pMill = player === game.playerDark ? "DDD" : "LLL"
    for (var i = 0; i < board.length; i += 2) {
        var str = board[i] + board[i + 1] + board[i + 2]
        if (str == pMill) {
            mills.push([i, i + 1, i + 2])
        }
    }

    for (var i = 1; i < 8; i += 2) {
        var str = board[i] + board[i + 8] + board[i + 2*8]
        if (str == pMill) {
            mills.push([i, i + 8, i + 2*8])
        }
    }
    return mills
}