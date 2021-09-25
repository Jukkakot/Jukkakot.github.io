importScripts("MinmaxWorker.js", "MCTSWorker.js")
let workerGame
let DEBUG = false
let checkedBoards = new Map()
let skipCount, depthCount, nodeCount, highDepthNum, topCount = 0, elseCount = 0, pruneCount = 0

let iterativeEndTime
let prevBestMove
const WIN = 100000000
const LOST = -100000000
const EMPTYDOT = '0'
//Max depth for iterating (Very high depth because I dont want to do infinite while loop)
const MAXDEPTH = 15
const TOPX = 5
//Turns on a random chance for minmax to choose new bestmove if found move has same score as current best move has
//This basically removes all repeating patterns in the game when doing simulations with autoplay ON
const RANDOMMOVES = true
//The propability that a move with same score as best score is choosen
// const RANDOMCHANCE = 0.1
const millWindows = [
    [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
    [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
    [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
    [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23]
]

self.addEventListener("message", function handleMessageFromGame(e) {
    var data = e.data
    switch (data.cmd) {
        case "close":
            self.close()
            break;
        case "findMove":
            handleGetMove(data)
            break;
        case "suggestion":
            handleGetMove(data)
            break;
        case "debug":
            workerGame = data.game
            workerGame.playerDark.mills = toFastMills(workerGame.playerDark)
            workerGame.playerLight.mills = toFastMills(workerGame.playerLight)
            workerGame.fastDots = data.board
            DEBUG = data.DEBUG
            // workeridNumber = data.idNumber
            console.log("stages", workerGame.playerDark.char, getStage(workerGame.playerDark), workerGame.playerLight.char, getStage(workerGame.playerLight))
            fastEvaluateBoard(workerGame.fastDots, workerGame.playerLight, workerGame.playerDark, -1)
            fastEvaluateBoard(workerGame.fastDots, workerGame.playerDark, workerGame.playerLight, -1)
            self.close()
    };
})

function handleGetMove(data) {
    workerGame = data.game
    workerGame.playerDark.mills = toFastMills(workerGame.playerDark)
    workerGame.playerLight.mills = toFastMills(workerGame.playerLight)
    workerGame.fastDots = stringify(workerGame.dots)
    DEBUG = data.DEBUG
    NODELAY = data.NODELAY

    let options = data.options
    const bestMoveResult = fastFindBestMove(options)
    var data = {
        cmd: data.cmd,
        move: bestMoveResult.move,
        moveData: bestMoveResult.moveData
    }
    if (!options.delay || NODELAY) {
        self.postMessage(data)
    } else {
        setTimeout(() => {
            self.postMessage(data)
        }, 500);
    }
}
function toFastMills(player) {
    var mills = player.mills.map(m => {
        return {
            fastDots: m.fastDots,
            fastId: m.fastId,
            uniqNum: m.uniqNum,
            fastUniqId: m.fastUniqId,
            new: m.new
        }
    })

    return mills
}
function getNeighboursIndexes(i) {
    if (i < 0 || i > 23) {
        console.error("invalid index", i)
        debugger
    }
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
            debugger
            console.error("invalid index", i)

        }
    }
    return neighbours
}
function getLayer(i) {
    return Math.floor(i / 8)
}
function getNeighbours(board, i) {
    var neighbours = ""
    getNeighboursIndexes(i).forEach(i => {
        neighbours += board[i]
    });
    return neighbours
}
function getFastMill(dots, player) {
    var fastId = dots.reduce((a, b) => a.toString() + b.toString())
    return {
        fastDots: dots,
        fastId: fastId,
        new: true,
        uniqNum: player.turns,
        fastUniqId: fastId + player.turns.toString()
    }
}
function fastGetUpdatedMills(board, player) {
    var oldMills = toFastMills(player)
    var allMills = []
    var pMill = player.char + player.char + player.char

    for (var window of millWindows) {
        if (windowToStr(board, window) == pMill) {
            var newMill = getFastMill([window[0], window[1], window[2]], player)

            var oldMill = oldMills.find(m => m.fastId == newMill.fastId)

            if (oldMill && !allMills.some(m => m.fastId == newMill.fastId)) {
                allMills.push(oldMill)
            } else if (!allMills.some(m => m.fastId == newMill.fastId)) {
                allMills.push(newMill)
            }
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
            movableDots.push(d)
        }
    }
    player.movableDots = movableDots
    return movableDots
}
function fastCheckIfCanMove(board, player) {
    if (getStage(player) !== 2) return true
    var movableDots = fastGetMoveableDots(board, player)
    return movableDots.length > 0
}
function fastCheckWin(board, player, oppPlayer, depth = 1, eatMode) {
    //Game cant have a winner if eatmode is on
    if (eatMode) return
    player.chipCount = fastGetPlayerDots(board, player).length
    oppPlayer.chipCount = fastGetPlayerDots(board, oppPlayer).length
    var value
    var boardStr = addInfo(board, player, oppPlayer)
    if (player.chipCount + player.chipsToAdd < 3 || !fastCheckIfCanMove(board, player)) {
        // console.log(player.char, player.chipCount, player.chipsToAdd, !fastCheckIfCanMove(board, player),
        //     board, player.turns)
        value = LOST * depth

        checkedBoards.set(boardStr, value)
    } else if (oppPlayer.chipCount + oppPlayer.chipsToAdd < 3 || !fastCheckIfCanMove(board, oppPlayer)) {
        // console.log("opp", oppPlayer.chipCount, oppPlayer.chipsToAdd, !fastCheckIfCanMove(board, oppPlayer))
        value = WIN * depth
        checkedBoards.set(boardStr, value)
    }
    return value
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
function fastGetUnOrderedMoves(board, player, oppPlayer, eatMode, isMaximizing = false, depth = 1) {
    player.chipCount = fastGetPlayerDots(board, player).length
    oppPlayer.chipCount = fastGetPlayerDots(board, oppPlayer).length
    var stage = eatMode ? 4 : getStage(player)
    var result = { moves: [], type: "" }
    switch (stage) {
        case 1:
            result = {
                moves: fastGetS1UnOrderedMoves(board),
                type: "placing",
            }
            break
        case 2:
            result = {
                moves: fastGetS2UnOrderedMoves(board, player),
                type: "moving",
            }
            break
        case 3:
            result = {
                moves: fastGetS3UnOrderedMoves(board, player),
                type: "moving",
            }
            break
        case 4:
            result = {
                moves: fastGetEatableDots(board, oppPlayer),
                type: "eating",
            }
            break
        default:
            debugger
            console.error("Problem?", stage)
            break
    }
    if (board.length > 24) {
        debugger
        console.error("invalid board", board)
    }
    //Adding previously best move to front of moves array (Iterative search thing)
    if (isMaximizing && depth - highDepthNum === 1) {
        // var prevBestMove = prevBestMoves[depth]
        if (prevBestMove != undefined && prevBestMove.type == result.type) {
            var index = result.moves.indexOf(prevBestMove.move)
            if (index >= 0) {
                index <= TOPX ? topCount++ : elseCount++
                //Deletes duplicated move when its "placing" or "eating" type
                result.moves.splice(index, 1);
            }
            result.moves.unshift(prevBestMove.move)
            // TODO: implement deleting duplicated move when type is "moving" 

        }
    }

    return result
}
function fastGetMoves(board, player, oppPlayer, eatMode, isMaximizing = false, depth = 1) {
    player.chipCount = fastGetPlayerDots(board, player).length
    // oppPlayer.chipCount = fastGetPlayerDots(board, oppPlayer).length
    var stage = eatMode ? 4 : getStage(player)
    var result = { moves: [], type: "" }
    switch (stage) {
        case 1:
            result = {
                moves: fastGetS1Moves(board, player, oppPlayer),
                type: "placing",
            }
            break
        case 2:
            result = {
                moves: fastGetS2Moves(board, player, oppPlayer),
                type: "moving",
            }
            break
        case 3:
            result = {
                moves: fastGetS3Moves(board, player, oppPlayer),
                type: "moving",
            }
            break
        case 4:
            result = {
                moves: fastGetSortedEatableDots(board, oppPlayer),
                type: "eating",
            }
            break
        default:
            debugger
            console.error("Problem?", stage)
            break
    }
    if (board.length > 24) {
        debugger
        console.error("invalid board", board)

    }
    //Adding previously best move to front of moves array (Iterative search thing)
    if (isMaximizing && depth - highDepthNum === 1) {
        // var prevBestMove = prevBestMoves[depth]
        if (prevBestMove != undefined && prevBestMove.type == result.type) {
            var index = result.moves.indexOf(prevBestMove.move)
            if (index >= 0) {
                index <= TOPX ? topCount++ : elseCount++
                //Deletes duplicated move when its "placing" or "eating" type
                result.moves.splice(index, 1);
            }
            result.moves.unshift(prevBestMove.move)
            // TODO: implement deleting duplicated move when type is "moving" 

        }
    }

    return result
}
function fastGetEmptyDots(board) {
    var dots = []
    for (var d = 0; d < board.length; d++) {
        if (board[d] == EMPTYDOT) dots.push(d)
    }
    return dots
}
function fastGetS1Moves(board, player, oppPlayer) {
    var moves = []
    //Adding "better" moves to start of moves to be checked first
    for (var window of millWindows) {
        var oppStage = getStage(oppPlayer)
        var windowStr = windowToStr(board, window)
        var pieceCount = windowStr.split(player.char).length - 1
        var oppCount = windowStr.split(oppPlayer.char).length - 1
        var emptyCount = windowStr.split(EMPTYDOT).length - 1

        var playerDots = getBoardDotsFromWindow(board, window, player.char)
        var oppDots = getBoardDotsFromWindow(board, window, oppPlayer.char)
        var emptyDots = getBoardDotsFromWindow(board, window, EMPTYDOT)
        // Making mill stage 1
        if (oppStage === 1 && pieceCount === 2 && emptyCount === 1) {
            if (!moves.includes(emptyDots[0]))
                moves.push(emptyDots[0])
        }
        //Making almost mills stage 1
        if (oppStage === 1 && pieceCount === 1 && emptyCount === 2) {
            if (!moves.includes(emptyDots[0]))
                moves.push(emptyDots[0])
            if (!moves.includes(emptyDots[1]))
                moves.push(emptyDots[1])
        }
        //blocking opp mill stage 1
        if (oppStage === 1 && oppCount === 2 && emptyCount === 1) {
            if (!moves.includes(emptyDots[0]))
                moves.push(emptyDots[0])
        }
        //blocking opp safe mill stage 2
        if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
            getNeighboursIndexes(emptyDots[0]).some(dot => board[dot] == oppPlayer.char &&
                !oppDots.some(chip => chip == dot))) {

            if (!moves.includes(emptyDots[0]))
                moves.push(emptyDots[0])
        }
    }
    //Adding the rest of the dots into moves
    var emptyDots = fastGetEmptyDots(board).filter(dot => !moves.includes(dot))
    //Sorting the dots by their neighbour count
    emptyDots = emptyDots.sort((a, b) => getNeighboursIndexes(b).length - getNeighboursIndexes(a).length)
    moves.push(...emptyDots)
    return moves
}
function fastGetS2Moves(board, player, oppPlayer) {
    var moves = []
    //Adding "better" moves to start of moves to be checked first
    for (var window of millWindows) {
        var oppStage = getStage(oppPlayer)
        var windowStr = windowToStr(board, window)
        var pieceCount = windowStr.split(player.char).length - 1
        var oppCount = windowStr.split(oppPlayer.char).length - 1
        var emptyCount = windowStr.split(EMPTYDOT).length - 1

        var playerDots = getBoardDotsFromWindow(board, window, player.char)
        var oppDots = getBoardDotsFromWindow(board, window, oppPlayer.char)
        var emptyDots = getBoardDotsFromWindow(board, window, EMPTYDOT)
        // Making mill
        if (pieceCount === 2 && emptyCount === 1) {
            var fromDot = getNeighboursIndexes(emptyDots[0]).find(dot => board[dot] == player.char)
            if (fromDot == undefined) {
                console.error("Invalid dot", fromDot)
                debugger
            }
            if (fromDot != undefined && !fastIsArrayInArray(moves, [fromDot, emptyDots[0]]))
                moves.push([fromDot, emptyDots[0]])
        }
        // Opening mill
        if (pieceCount === 3) {
            for (var dot of playerDots) {
                getNeighboursIndexes(dot).forEach(nDot => {
                    if (board[nDot] == EMPTYDOT && !fastIsArrayInArray(moves, [dot, nDot]))
                        moves.push([dot, nDot])
                })
            }
        }
        //blocking opp mill stage 2
        if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
            getNeighboursIndexes(emptyDots[0]).some(dot => board[dot] == oppPlayer.char &&
                !oppDots.some(chip => chip == dot))) {

            var fromDot = getNeighboursIndexes(emptyDots[0]).find(dot => board[dot] == player.char)

            if (fromDot != undefined && !fastIsArrayInArray(moves, [fromDot, emptyDots[0]]))
                moves.push([fromDot, emptyDots[0]])

        }
    }
    //Adding the rest of the moves
    for (var fromDot of fastGetMoveableDots(board, player)) {
        for (var toDot of getNeighboursIndexes(fromDot)) {
            if (board[toDot] == EMPTYDOT && !fastIsArrayInArray(moves, [fromDot, toDot]))
                moves.push([fromDot, toDot])
        }
    }
    return moves
}
function fastGetS3Moves(board, player, oppPlayer) {
    var moves = []
    var fromDots = fastGetPlayerDots(board, player)
    var toDots = fastGetEmptyDots(board)

    //Adding "better" moves to start of moves to be checked first
    for (var window of millWindows) {
        var windowStr = windowToStr(board, window)
        var pieceCount = windowStr.split(player.char).length - 1
        var oppCount = windowStr.split(oppPlayer.char).length - 1
        var emptyCount = windowStr.split(EMPTYDOT).length - 1

        var playerDots = getBoardDotsFromWindow(board, window, player.char)
        var emptyDots = getBoardDotsFromWindow(board, window, EMPTYDOT)
        // Making mill
        if (pieceCount === 2 && emptyCount === 1) {
            var fromDot = fromDots.find(dot => !playerDots.includes(dot))
            if (fromDot == undefined) {
                console.error("undifined dottt", fromDot)
            }
            if (!fastIsArrayInArray(moves, [fromDot, emptyDots[0]]))
                moves.push([fromDot, emptyDots[0]])
        }
        // Blocking opp mill
        if (oppCount === 2 && emptyCount === 1) {
            fromDots.forEach(dot => {
                if (dot == undefined) {
                    console.error("undifined dottt", dot)
                }
                if (!fastIsArrayInArray(moves, [dot, emptyDots[0]]))
                    moves.push([dot, emptyDots[0]])
            })
        }
    }
    //Adding the rest of the moves
    for (var fromDot of fromDots) {
        for (var toDot of toDots) {
            if (fromDot == undefined) debugger
            if (!fastIsArrayInArray(moves, [fromDot, toDot]))
                moves.push([fromDot, toDot])
        }
    }
    // console.table(moves)
    return moves
}
function fastGetS1UnOrderedMoves(board) {
    return fastGetEmptyDots(board)
}
function fastGetS2UnOrderedMoves(board, player) {
    let moves = []
    //Adding the rest of the moves
    for (var fromDot of fastGetMoveableDots(board, player)) {
        for (var toDot of getNeighboursIndexes(fromDot)) {
            if (board[toDot] == EMPTYDOT)
                moves.push([fromDot, toDot])
        }
    }
    return moves
}
function fastGetS3UnOrderedMoves(board, player) {
    let moves = []
    let fromDots = fastGetPlayerDots(board, player)
    let toDots = fastGetEmptyDots(board)
    //Adding the rest of the moves
    for (let fromDot of fromDots) {
        for (let toDot of toDots) {
            moves.push([fromDot, toDot])
        }
    }
    return moves
}
function fastGetPlayerMillDots(board, player) {
    player.mills = fastGetUpdatedMills(board, player)
    var dots = []
    player.mills.forEach(mill => dots.push(...mill.fastDots))

    //Removing duplicate dots
    return [... new Set(dots)]
}
function fastGetEatableDots(board, player) {
    var dotsInMill = fastGetPlayerMillDots(board, player)
    var allDots = fastGetPlayerDots(board, player)

    //if there is same amount if dots in mills as total player dots, then all of them are eatable
    if (dotsInMill.length === allDots.length) {
        // console.log("All dots in mills", board, player.char, player.mills)
        return allDots
    }


    var eatableDots = []
    //Otherwise have to look for the dots that are not in mills
    eatableDots.push(...allDots.filter(dot => !dotsInMill.includes(dot)))
    return eatableDots
}
function fastGetSortedEatableDots(board, player) {
    var dots = []
    for (var window of millWindows) {
        // var oppStage = getStage(oppPlayer)
        var windowStr = windowToStr(board, window)
        var pieceCount = windowStr.split(player.char).length - 1
        var emptyCount = windowStr.split(EMPTYDOT).length - 1
        var oppCount = window.length - pieceCount - emptyCount

        var playerDots = getBoardDotsFromWindow(board, window, player.char)

        // Eating from almost mill
        if (pieceCount === 2 && emptyCount === 1) {
            if (!dots.includes(playerDots[0]))
                dots.push(playerDots[0])
            if (!dots.includes(playerDots[1]))
                dots.push(playerDots[1])
        }
        // Eating from potentially blocking a mill
        if (oppCount === 2 && pieceCount === 1) {
            if (!dots.includes(playerDots[0]))
                dots.push(playerDots[0])
        }
    }
    //Adding all the rest of the moves
    let allEatableDots = fastGetEatableDots(board, player)
    for (var dot of allEatableDots) {
        if (!dots.includes(dot))
            dots.push(dot)
    }
    return dots
}
function fastIsArrayInArray(arr, item) {
    return arr.some(ele => JSON.stringify(ele) == JSON.stringify(item))
}
function fastHasNewMills(board, player) {
    player.mills = fastGetUpdatedMills(board, player)
    return player.mills.some(m => m.new)
}
function fastMovePlayerTo(args) {
    var board = args.board
    var fromDot = args.move[0]
    var toDot = args.move[1]
    var player = args.player
    if (toDot == undefined || fromDot == undefined ||
        board[toDot] != EMPTYDOT || board[fromDot] != player.char) {
        debugger
    }
    board = setCharAt(board, toDot, player.char)
    board = setCharAt(board, fromDot, EMPTYDOT)
    return board
}
function fastPlaceChip(args) {
    let board = args.board
    var dot = args.move
    var player = args.player

    player.chipsToAdd--
    player.chipCount++
    if (player.chipsToAdd < 0 || board[dot] != EMPTYDOT) debugger

    board = setCharAt(board, dot, player.char)
    return board
}
function fastEatChip(args) {
    let board = args.board
    var dot = args.move
    var oppPlayer = args.oppPlayer
    var player = args.player
    oppPlayer.chipCount--
    if (oppPlayer.chipCount < 0 || board[dot] != oppPlayer.char) debugger

    board = setCharAt(board, dot, EMPTYDOT)
    //Checking mills again incase ate from a mill
    oppPlayer.mills = fastGetUpdatedMills(board, oppPlayer)
    //Making players mills not new
    player.mills.forEach(m => m.new = false)
    if (board.length > 24) {
        debugger
    }
    return board
}

function fastPlayRound(args) {
    var result = {
        eatMode: false,
        board: args.board,
        winLose: undefined
    }
    var move = args.move
    var type = args.type
    var oppPlayer = args.oppPlayer
    var player = args.player
    var isMaximizing = args.isMaximizing
    // var board = args.board
    var depth = args.depth
    player.turns++
    if (getStage(player) === 3) {
        player.stage3Turns++
    }
    switch (args.type) {
        case "moving":
            result.board = fastMovePlayerTo(args)
            result.eatMode = fastHasNewMills(result.board, player)
            break;
        case "placing":
            result.board = fastPlaceChip(args)
            result.eatMode = fastHasNewMills(result.board, player)
            break;
        case "eating":
            //Player wins because opponent was on flying stage when eating
            //Have to check this before actually eating
            if (getStage(oppPlayer) === 3) {
                result.winLose = isMaximizing ? [move, WIN * depth, type] : [move, LOST * depth, type]
            }
            result.board = fastEatChip(args)
            break
        default:
            console.error("Invalid move", args)
            break
    }
    if (result.board.length > 24) console.error("invalid board", result.board)
    // if (result.eatMode) {
    //     //Making players mills not new since player is going to "use them" next
    //     player.mills.forEach(m => m.new = false)
    //     //TODO: EAT NOW BEFORE SCORING THE BOARD
    // }
    if (result.winLose == undefined && (oppPlayer.chipCount + oppPlayer.chipsToAdd < 3 || !fastCheckIfCanMove(result.board, oppPlayer))) {
        //Player wins because opponent can't move
        result.winLose = isMaximizing ? [move, WIN * depth, type] : [move, LOST * depth, type]
    }
    return result
}
function setCharAt(str, index, chr) {
    if (index < 0) console.error("invalid index", str, index, chr)
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
}
function windowToStr(board, window) {
    return window.reduce((a, b) => a + board[b], "")
}
function fastGetWindowFastId(window) {
    return window.reduce((a, b) => a.toString() + b.toString())
}
function indexToDot(index) {
    return {
        l: getLayer(index),
        d: index - getLayer(index) * 8
    }
}
function fastIsSameWindow(window, board) {
    // console.log(board, workerGame.fastDots)
    var isSame = window.every(wDot => workerGame.fastDots[wDot] == board[wDot])
    // console.log(board, "\n" + workerGame.fastDots)
    // console.log(board[window[0]], board[window[1]], board[window[2]])
    // console.log(workerGame.fastDots[window[0]], workerGame.fastDots[window[1]], workerGame.fastDots[window[2]])
    // console.log(isSame)
    return isSame
}
function getCalcedValue(board, player, oppPlayer) {
    var boardStr = addInfo(board, player, oppPlayer)
    var calcedValue = checkedBoards.get(boardStr)
    //Returning already calculated value for the board
    if (calcedValue != undefined) {
        let newMillCount = player.mills.filter(m => m.new).length || 0
        calcedValue += 3500 * newMillCount

        newMillCount = oppPlayer.mills.filter(m => m.new).length || 0
        calcedValue -= 4000 * newMillCount
    }
    return calcedValue
}
function addInfo(board, player, oppPlayer) {
    var str = getStage(player) + player.char + getStage(oppPlayer) + oppPlayer.char + board
    return str
}
function getStage(player) {
    if (player.chipsToAdd > 0) {
        return 1
    } else if (player.chipCount + player.chipsToAdd === 3) {
        return 3
    } else if (player.chipsToAdd === 0) {
        return 2
    } else {
        console.error("returning 0 stage", player)
    }
}
function stringify(board) {
    var str = ""
    for (var layer of board) {
        for (var dot of layer) {
            if (!dot.player) str += '0'
            else if (dot.player.name == workerGame.playerDark.name) str += 'D'
            else if (dot.player.name == workerGame.playerLight.name) str += 'L'
        }
    }
    return str
}
function getBoardDotsFromWindow(board, window, char) {
    //Returns the dots where board[windowIndex] matches char
    var dots = []
    for (var i of window) {
        if (board[i] == char)
            dots.push(i)
    }
    return dots
}
function scaleValue(value, from = [-10000, 10000], to = [-100, 100]) {
    var scale = (to[1] - to[0]) / (from[1] - from[0]);
    var capped = Math.min(from[1], Math.max(from[0], value)) - from[0];
    return capped * scale + to[0]
}