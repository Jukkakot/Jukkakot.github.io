var workerGame
var DEBUG
var nodeCount
var checkedBoards = new Map()
var skipCount
var depthCount
var pruneCount = 0
let endTime
const EMPTYDOT = '0'
const MAXDEPTH = 10

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
    let options = data.options
    var data = {
        cmd: data.cmd,
        move: fastFindBestMove(options)
    }
    if (options.iterative) {
        self.postMessage(data)
    } else {
        //Add 1000 ms delay if easy mode
        //Because thats when we use depth 4 and it would go too fast for user
        //Otherwise 200 ms delay
        var delay = options.difficulty === 4
        setTimeout(() => {
            self.postMessage(data)
            // }, (delay ? 1000 : 200));
        }, 200);
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
    if (i < 0 || i > 23) console.log("invalid index", i)
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
function fastCheckWin(board, player, oppPlayer, depth) {
    var boardStr = addInfo(board, player, oppPlayer, depth)
    if (player.chipCount + player.chipsToAdd < 3 || !fastCheckIfCanMove(board, player)) {
        checkedBoards.set(boardStr, -100000000 * depth)
        // console.log(player.name, oppPlayer.name, "losing")
        return -100000000 * depth
    } else if (oppPlayer.chipCount + oppPlayer.chipsToAdd < 3 || !fastCheckIfCanMove(board, oppPlayer)) {
        checkedBoards.set(boardStr, 100000000 * depth)
        // console.log(player.name, oppPlayer.name, "winning")
        return 100000000 * depth
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
                moves: fastGetEatableDots(board, oppPlayer),
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
            if (!fastIsArrayInArray(moves, [fromDot, emptyDots[0]]))
                moves.push([fromDot, emptyDots[0]])
        }
        // Blocking opp mill
        if (oppCount === 2 && emptyCount === 1) {
            fromDots.forEach(dot => {
                if (!fastIsArrayInArray(moves, [dot, emptyDots[0]]))
                    moves.push([dot, emptyDots[0]])
            })
        }
    }
    //Adding the rest of the moves
    for (var fromDot of fromDots) {
        for (var toDot of toDots) {
            if (!fastIsArrayInArray(moves, [fromDot, toDot]))
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
    if (dotsInMill.length === allDots.length)
        return allDots

    var eatableDots = []
    //Otherwise have to look for the dots that are not in mills
    eatableDots.push(...allDots.filter(dot => !dotsInMill.includes(dot)))
    return eatableDots
}
function fastIsArrayInArray(arr, item) {
    var item_as_string = JSON.stringify(item);

    var contains = arr.some(function (ele) {
        return JSON.stringify(ele) === item_as_string;
    });
    return contains;
}
function fastMovePlayerTo(args, player) {
    var board = args.board
    var fromDot = args.move[0]
    var toDot = args.move[1]

    board = setCharAt(board, toDot, player.char)
    board = setCharAt(board, fromDot, EMPTYDOT)
    return board
}
function fastPlaceChip(args, player) {
    var board = args.board
    var dot = args.move

    board = setCharAt(board, dot, player.char)
    player.chipsToAdd--
    player.chipCount++
    return board
}
function fastEatChip(args, oppPlayer) {
    var board = args.board
    var dot = args.move

    oppPlayer.chipCount--
    board = setCharAt(board, dot, EMPTYDOT)

    //Checking mills again incase ate from a mill
    oppPlayer.mills = fastGetUpdatedMills(board, oppPlayer)
    return board
}
function fastHasNewMills(board, player) {
    player.mills = fastGetUpdatedMills(board, player)
    return player.mills.some(m => m.new)
}
function fastPlayRound(args, player, oppPlayer, isMaximizing) {
    var result = {
        eatMode: false,
        board: args.board,
        return: undefined
    }
    var move = args.move
    var type = args.type
    // var oppPlayer = args.oppPlayer
    // var player = args.player
    var board = args.board
    var depth = args.depth
    player.turns++
    if (getStage(player) === 3) {
        player.stage3Turns++
    }
    switch (args.type) {
        case "moving":
            result.board = fastMovePlayerTo(args, player)
            result.eatMode = fastHasNewMills(result.board, player)
            break;
        case "placing":
            result.board = fastPlaceChip(args, player)
            result.eatMode = fastHasNewMills(result.board, player)
            break;
        case "eating":
            //Player wins because opponent was on flying stage when eating
            if (getStage(oppPlayer) === 3) {
                result.board = fastEatChip(args, oppPlayer)
                result.return = isMaximizing ? [move, 100000000 * depth, type] : [move, -100000000 * depth, type]
                return result
            }
            result.board = fastEatChip(args, oppPlayer)
            player.mills.forEach(m => m.new = false)
            break;
        default:
            console.log("Invalid move", args)
    }

    if (result.eatMode) {
        //Making players mills not new since player is going to "use them" next
        player.mills.forEach(m => m.new = false)
        //TODO: EAT NOW BEFORE SCORING THE BOARD
    }
    if (!fastCheckIfCanMove(result.board, oppPlayer)) {
        //Player wins because opponent can't move
        result.return = isMaximizing ? [move, 100000000 * depth, type] : [move, -100000000 * depth, type]
    }
    return result
}
function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
}
function fastEvaluateBoard(board, player, oppPlayer, depth) {
    if (DEBUG) console.time("fastScoreBoard")
    var boardValue = 0
    //Object to store info about where the different points for each board is coming from
    //Helpful for debugging
    var scoreObject = {
        update: function (property) {
            this[property] ? this[property]++ : this[property] = 1
        }
    }

    if (getStage(player) === 1) {
        //Giving points for each neighbour dot of players dots
        for (var dot of fastGetPlayerDots(board, player)) {
            boardValue += getNeighboursIndexes(dot).length
        }
        scoreObject.neighbours = boardValue
    } else if (getStage(player) === 2) {
        //Adding 25 points for each moveable dot
        var moveableDots = fastGetMoveableDots(board, player).length
        boardValue += moveableDots * 25
        scoreObject.moveablepDots = moveableDots
    }
    if (getStage(oppPlayer) === 2) {
        var oppMoveableDots = fastGetMoveableDots(board, oppPlayer).length
        var oppUnmoveableDots = oppPlayer.chipCount - oppMoveableDots

        boardValue += oppUnmoveableDots * 25
        scoreObject.oppUnmoveableDots = oppUnmoveableDots
    }
    // else if (getStage(player) === 3) {
    //     //Giving 10000 points for each turn during stage 3 to encourage delaying losing a workerGame
    //     scoreObject.s3Turns = player.stage3Turns
    //     value += player.stage3Turns * 10000
    // }
    // if (getStage(oppPlayer) === 3) {

    //     scoreObject.oppS3Turns = oppPlayer.stage3Turns
    //     value -= oppPlayer.stage3Turns * 10000
    // }

    for (var window of millWindows) {
        var windowValue = fastEvaluateWindow(board, window, player, oppPlayer, scoreObject)
        boardValue += windowValue
    }

    var boardStr = addInfo(board, player, oppPlayer, depth)
    //For now, we dont add any boards with mills in them to checkedBoards map
    if (!scoreObject["mill"] || !scoreObject["oppMill"])
        checkedBoards.set(boardStr, boardValue)

    if (DEBUG) {
        console.timeEnd("fastScoreBoard")
        //This is helpful when looking at where the score comes from for a board
        var output = player.name + "\n";
        for (var property in scoreObject) {
            if (property.toString() == "update") continue
            output += property + ': ' + scoreObject[property] + "\n"
        }
        output += "Board value: " + boardValue + "\n"
        console.log(output)

    }
    return boardValue
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
function fastEvaluateWindow(board, window, player, oppPlayer, scoreObject) {
    var value = 0
    var windowStr = windowToStr(board, window)
    var playerMill = player.char + player.char + player.char
    var oppMill = oppPlayer.char + oppPlayer.char + oppPlayer.char
    //New mill
    if (windowStr == playerMill) {

        //Getting the non deepCopied player
        var workerGamePlayer = player.name == workerGame.playerLight.name ? workerGame.playerLight : workerGame.playerDark
        var clonePlayerMill = player.mills.find(m => m.fastId == fastGetWindowFastId(window))
        var workerGamerMill = workerGamePlayer.mills.find(m => m.fastId == fastGetWindowFastId(window))
        if (!clonePlayerMill) console.log(clonePlayerMill, "shouldnt happen", player.mills)
        //First checking if this mill is in the workerGame.dots board, if it isnt, then its a new mill
        //Second check is to check if the mill is in the workerGame.dots board but it has been formed another time
        //This has to be checked with unique number given to every mill formed in the workerGame
        //So that two mills that are in same place but formed at different times can be differentiated
        if ((clonePlayerMill && !fastIsSameWindow(window, board)) || (workerGamerMill && clonePlayerMill.fastUniqId != workerGamerMill.fastUniqId)) {
            // if (clonePlayerMill && !fastIsSameWindow(window, board)) console.log("eka@@@@", clonePlayerMill != undefined, !fastIsSameWindow(window, board))
            // if (workerGamerMill && clonePlayerMill.fastUniqId != workerGamerMill.fastUniqId) console.log("toka@@@")

            scoreObject.update("newMill")
            value += 3500
            //Win
            // if (getStage(oppPlayer) === 3) {
            //     console.log(oppPlayer.name, "stage on 3 joten voitto")
            //     return 100000000
            // }
        }
    }
    //opp new mill
    if (windowStr == oppMill) {

        //Getting the non deepCopied player
        var workerGamePlayer = oppPlayer.name == workerGame.playerLight.name ? workerGame.playerLight : workerGame.playerDark
        var clonePlayerMill = oppPlayer.mills.find(m => m.fastId == fastGetWindowFastId(window))
        var workerGamerMill = workerGamePlayer.mills.find(m => m.fastId == fastGetWindowFastId(window))
        if (!clonePlayerMill) console.log(clonePlayerMill, "shouldnt happen", oppPlayer.mills)
        //First checking if this mill is in the workerGame.dots board, if it isnt, then its a new mill
        //Second check is to check if the mill is in the workerGame.dots board but it has been formed another time
        //This has to be checked with unique number given to every mill formed in the workerGame
        //So that two mills that are in same place but formed at different times can be differentiated
        if ((clonePlayerMill && !fastIsSameWindow(window, board)) || (workerGamerMill && clonePlayerMill.fastUniqId != workerGamerMill.fastUniqId)) {
            scoreObject.update("oppNewMill")
            value -= 4000
            //Win
            // if (getStage(player) === 3) {
            //     console.log(player.name, "stage is 3 so lose")
            //     return -100000000
            // }
        }
    }

    switch (getStage(player)) {
        case (1):
            return fastStage1Score(board, window, player, oppPlayer, scoreObject) + value
        case (2):
            return fastStage2Score(board, window, player, oppPlayer, scoreObject) + value
        case (3):
            return fastStage3Score(board, window, player, oppPlayer, scoreObject) + value
        default:
            console.log("Player has won or lost?", player)
    }
}
function getBoardDotsFromWindow(board, window, char) {
    var dots = []
    for (var i of window) {
        if (board[i] == char)
            dots.push(i)
    }
    return dots
}
function fastStage1Score(board, window, player, oppPlayer, scoreObject) {
    var value = 0
    var oppStage = getStage(oppPlayer)
    var windowStr = windowToStr(board, window)
    var pieceCount = windowStr.split(player.char).length - 1
    var oppCount = windowStr.split(oppPlayer.char).length - 1
    var emptyCount = windowStr.split(EMPTYDOT).length - 1

    var playerDots = getBoardDotsFromWindow(board, window, player.char)
    var oppDots = getBoardDotsFromWindow(board, window, oppPlayer.char)
    var emptyDots = getBoardDotsFromWindow(board, window, EMPTYDOT)

    //blocking opp mill stage 1
    if (oppStage === 1 && oppCount === 2 && pieceCount === 1) {
        scoreObject.update("blockOppMill")
        value += 300
    }
    //blocking opp mill stage 2
    if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
        getNeighboursIndexes(playerDots[0]).some(dot => board[dot] == oppPlayer.char &&
            !oppDots.some(chip => chip == dot))) {
        scoreObject.update("blockOppMillStage2")
        value += 300
    }
    //almost mill
    if (oppStage == 1 && pieceCount === 2 && emptyCount === 1) {
        scoreObject.update("almostMill")
        value += 250
    }
    //mill
    if (pieceCount === 3) {
        scoreObject.update("mill")
        value += 100
    }
    //making safe open mill with last chip
    //opponent being stage 2 means that player is placing its last chip
    if (player.chipsToAdd === 1 && pieceCount === 2 && emptyCount === 1 && !getNeighboursIndexes(emptyDots[0]).some(dot => board[dot] == oppPlayer.char) &&
        getNeighboursIndexes(emptyDots[0]).some(chip => board[chip] == player.char &&
            !playerDots.some(dot => dot == chip))) {
        //"safe" Open mill as in opponent player cant block it on next move 
        scoreObject.update("safeOpenMill")
        value += 200
    }

    //opp mill
    if (oppCount === 3) {
        scoreObject.update("oppMill")
        value -= 100
    }
    //opp almost mill stage 1
    if (oppStage === 1 && oppCount === 2 && emptyCount === 1) {
        scoreObject.update("oppAlmostMillStage1")
        value -= 200
    }
    //opp blocking mill stage 1
    if (oppStage === 1 && pieceCount === 2 && oppCount === 1) {
        scoreObject.update("oppBlockingMillStage1")
        value -= 200
    }

    //opponent safe open mill stage2
    if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
        getNeighboursIndexes(emptyDots[0]).some(dot => board[dot] == oppPlayer.char &&
            !oppDots.some(chip => chip == dot))) {
        scoreObject.update("oppSafeOpenMillStage2")
        value -= 300
    }
    return value
}
function fastStage2Score(board, window, player, oppPlayer, scoreObject) {
    var value = 0
    var oppStage = getStage(oppPlayer)
    var windowStr = windowToStr(board, window)
    var pieceCount = windowStr.split(player.char).length - 1
    var oppCount = windowStr.split(oppPlayer.char).length - 1
    var emptyCount = windowStr.split(EMPTYDOT).length - 1

    var playerDots = getBoardDotsFromWindow(board, window, player.char)
    var oppDots = getBoardDotsFromWindow(board, window, oppPlayer.char)
    var emptyDots = getBoardDotsFromWindow(board, window, EMPTYDOT)
    //Syhky miilu is finnish and means double mill
    //which happens when you have 2 mills next to eachother and can get a mill every turn
    //also only limiting this to 1 because multiple double mills was encouraging not making a mill
    //which would break one of the double mills also.
    if (pieceCount === 2 && emptyCount === 1 && !scoreObject["doubleMill"] &&
        getNeighboursIndexes(emptyDots[0]).some(dot => board[dot] == player.char &&
            !playerDots.some(pDot => pDot == dot) &&
            player.mills.some(mill => mill.fastDots.some(chip => chip == dot)))) {
        scoreObject.update("doubleMill")
        value += 2000
    }
    //Blocking opp double mill
    if (oppCount === 2 && pieceCount === 1 &&
        getNeighboursIndexes(playerDots[0]).some(dot => board[dot] == oppPlayer.char &&
            !oppDots.some(pDot => pDot == dot) &&
            oppPlayer.mills.some(mill => mill.fastDots.some(chip => chip == dot)))) {
        scoreObject.update("blockingOppDoubleMill")
        value += 3500
    }
    //"safe" Open mill as in opponent player cant block it on next move 
    if (pieceCount === 2 && emptyCount === 1 &&
        !getNeighboursIndexes(emptyDots[0]).some(chip => board[chip] == oppPlayer.char) &&
        getNeighboursIndexes(emptyDots[0]).some(chip => board[chip] == player.char &&
            !playerDots.some(dot => dot == chip))) {
        scoreObject.update("safeOpenMill")
        value += 900
    }
    //mill
    if (pieceCount === 3) {
        scoreObject.update("mill")
        value += 700
    }
    //Opponent mill is blocked from opening
    if (oppStage === 2 && oppCount === 3 &&
        oppDots.every(dot => getNeighboursIndexes(dot).every(chip => board[chip] != EMPTYDOT))) {
        scoreObject.update("blockOppMillStuck")
        value += 400
    }
    //blocking opp mill stage 3
    if (oppStage === 3 && oppCount === 2 && pieceCount === 1) {
        scoreObject.update("blockOppMillStage3")
        value += 400
    }
    //blocking opp mill stage 2
    if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
        getNeighboursIndexes(playerDots[0]).some(dot => board[dot] == oppPlayer.char &&
            !oppDots.some(chip => chip == dot))) {
        scoreObject.update("blockOppMillStage2")
        value += 400
    }
    //opponent safe open mill stage2
    if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
        getNeighboursIndexes(emptyDots[0]).some(dot => board[dot] == oppPlayer.char &&
            !oppDots.some(chip => chip == dot))) {
        scoreObject.update("oppSafeOpenMillStage2")
        value -= 300
    }
    //opponent open mill stage 3
    if (oppStage === 3 && oppCount === 2 && emptyCount === 1) {
        scoreObject.update("oppOpenMillStage3")
        value -= 300
    }
    //Syhky miilu is finnish and means double mill
    //which happens when you have 2 mills next to eachother and can get a mill every turn
    //Opp double mill
    if (oppCount === 2 && emptyCount === 1 && !scoreObject["oppDoubleMill"] &&
        getNeighboursIndexes(emptyDots[0]).some(dot => board[dot] == oppPlayer.char &&
            !oppDots.some(pDot => pDot == dot) &&
            oppPlayer.mills.some(mill => mill.fastDots.some(chip => chip == dot)))) {
        scoreObject.update("oppDoubleMill")
        value -= 2500
    }

    return value
}
function fastStage3Score(board, window, player, oppPlayer, scoreObject) {
    var value = 0
    var oppStage = getStage(oppPlayer)
    var windowStr = windowToStr(board, window)
    var pieceCount = windowStr.split(player.char).length - 1
    var oppCount = windowStr.split(oppPlayer.char).length - 1
    var emptyCount = windowStr.split(EMPTYDOT).length - 1

    var playerDots = getBoardDotsFromWindow(board, window, player.char)
    var oppDots = getBoardDotsFromWindow(board, window, oppPlayer.char)
    var emptyDots = getBoardDotsFromWindow(board, window, EMPTYDOT)

    //blocking opp mill when opp is on stage 2
    //this is important because player will lose on next move otherwise
    if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
        getNeighboursIndexes(playerDots[0]).some(chip => board[chip] == oppPlayer.char &&
            !oppDots.some(dot => dot == chip))) {
        scoreObject.update("blockOppMillStage2")
        value += 3000
    }
    //Blocking opp double mill
    if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
        getNeighboursIndexes(playerDots[0]).some(dot => board[dot] == oppPlayer.char &&
            !oppDots.some(pDot => pDot == dot) &&
            oppPlayer.mills.some(mill => mill.fastDots.some(chip => chip == dot)))) {
        scoreObject.update("blockingOppDoubleMill")
        value += 10000
    }
    //blocking opp mill when opp is on stage 3
    //this is also important because player will lose on next move otherwise
    if (oppStage === 3 && oppCount === 2 && pieceCount === 1) {
        scoreObject.update("blockOppMillStage3")
        value += 2000
    }
    //almost mill
    if (pieceCount === 2 && emptyCount === 1) {
        scoreObject.update("almostMill")
        value += 800
    }
    //mill
    if (pieceCount === 3) {
        scoreObject.update("mill")
        value += 500
    }
    //opponent safe open mill stage 2
    if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
        getNeighboursIndexes(emptyDots[0]).some(chip => board[chip] == oppPlayer.char &&
            !oppDots.some(dot => dot == chip))) {
        scoreObject.update("oppOpenMillStage2")
        value -= 2000
    }
    //opponent open mill stage 3
    if (oppStage === 3 && oppCount === 2 && emptyCount === 1) {
        scoreObject.update("oppOpenMillStage3")
        value -= 2000
    }
    return value
}
function fastMinimax(board, player, oppPlayer, depth, alpha, beta, eatMode, isMaximizing) {
    //Calcing depth count
    if (!depthCount.includes(depth)) depthCount.push(depth)
    nodeCount++
    // var boardStr = isMaximizing ? addInfo(board, player, oppPlayer) : addInfo(board, oppPlayer, player)
    var boardStr = addInfo(board, player, oppPlayer, depth)
    var calcedValue = checkedBoards.get(boardStr)
    //Returning already calculated value for the board
    if (calcedValue != undefined) {
        skipCount++
        return [undefined, calcedValue]
    }
    var winLoseValue = fastCheckWin(board, player, oppPlayer, depth)
    //Returning potential winning or losing value
    if (winLoseValue != undefined) {
        return [undefined, winLoseValue]
    }
    //End node check
    if (depth <= 0 || endTime != undefined && new Date().getTime() >= endTime) {
        var calcedValue = checkedBoards.get(boardStr)
        //Returning already calculated value for the board
        if (calcedValue != undefined) {
            skipCount++
            return [undefined, calcedValue]
        }
        // var value = isMaximizing ? fastEvaluateBoard(board, player, oppPlayer) : fastEvaluateBoard(board, oppPlayer, player)
        return [undefined, fastEvaluateBoard(board, player, oppPlayer, depth)]
    }

    //Building up "the tree" further
    if (isMaximizing) {
        let bestScore = -Infinity
        let bestMove
        var movesObject = fastGetMoves(board, player, oppPlayer, eatMode)
        var moves = movesObject.moves
        var type = movesObject.type

        if (moves.length === 0) {
            //Player lost because no possible moves to do
            //this should only be the case on stage 2 when player has no more movable dots
            if (getStage(player) !== 2)
                console.log("Problem", movesObject)

            return [undefined, -100000000 * depth]
        }
        for (var move of moves) {
            //Cloning players 
            var cBoard = board
            var cPlayer = JSON.parse(JSON.stringify(player))
            var cOppPlayer = JSON.parse(JSON.stringify(oppPlayer))
            var args = {
                move: move,
                type: type,
                board: cBoard,
                depth: depth
            }

            var result = fastPlayRound(args, cPlayer, cOppPlayer, isMaximizing)
            cBoard = result.board
            eatMode = result.eatMode
            var winLose = result.return
            if (winLose != undefined)
                return winLose

            var score = fastMinimax(cBoard, cPlayer, cOppPlayer, eatMode ? depth : depth - 1, alpha, beta, eatMode, eatMode)[1]
            //|| (score === bestScore && Math.random() < 0.5)
            if (score > bestScore) {
                bestScore = score
                bestMove = move
            }
            alpha = Math.max(bestScore, alpha)
            if (alpha >= beta) {
                pruneCount++
                break
            }

        }
        return [bestMove, bestScore, type]
    } else {
        let bestScore = Infinity;
        let bestMove
        var movesObject = fastGetMoves(board, oppPlayer, player, eatMode)
        var moves = movesObject.moves
        var type = movesObject.type

        if (moves.length === 0) {
            //Player lost because no possible moves to do
            //this should only be the case on stage 2 when player has no more movable dots
            if (getStage(oppPlayer) !== 2)
                console.log("Couldn't find moves, possible problem?", movesObject)

            return [undefined, 100000000 * depth]
        }
        for (var move of moves) {
            //Cloning board and players 
            var cBoard = board
            var cPlayer = JSON.parse(JSON.stringify(player))
            var cOppPlayer = JSON.parse(JSON.stringify(oppPlayer))
            var args = {
                move: move,
                type: type,
                board: cBoard,
                depth: depth
            }

            var result = fastPlayRound(args, cOppPlayer, cPlayer, isMaximizing)
            cBoard = result.board
            eatMode = result.eatMode

            var winLose = result.return
            if (winLose)
                return winLose

            var score = fastMinimax(cBoard, cPlayer, cOppPlayer, eatMode ? depth : depth - 1, alpha, beta, eatMode, !eatMode)[1]
            //|| (score === bestScore && Math.random() < 0.5)
            if (score < bestScore) {
                bestScore = score
                bestMove = move
            }

            beta = Math.min(bestScore, beta)
            if (alpha >= beta) {
                pruneCount++
                break
            }
        }
        return [bestMove, bestScore, type]
    }
}
function fastFindBestMove(options) {
    if (workerGame.winner) {
        console.log(this.winner.name, "won the workerGame")
        return
    }
    console.time("time finding a move")
    //Resetting counters 
    nodeCount = 0
    checkedBoards.clear()
    skipCount = 0
    depthCount = []
    pruneCount = 0
    endTime = undefined

    var player = {
        name: workerGame.turn.name,
        char: workerGame.turn.char,
        chipCount: workerGame.turn.chipCount,
        chipsToAdd: workerGame.turn.chipsToAdd,
        mills: workerGame.turn.mills,
        turns: workerGame.turn.turns,
        stage3Turns: workerGame.turn.stage3Turns,
    }
    var oppPlay = workerGame.turn.name == workerGame.playerDark.name ? workerGame.playerLight : workerGame.playerDark
    var oppPlayer = {
        name: oppPlay.name,
        char: oppPlay.char,
        chipCount: oppPlay.chipCount,
        chipsToAdd: oppPlay.chipsToAdd,
        mills: oppPlay.mills,
        turns: oppPlay.turns,
        stage3Turns: oppPlay.stage3Turns,
    }
    var board = stringify(workerGame.dots)

    let move
    let type
    let score

    if (options.iterative) {
        // let bestScore = -Infinity
        //TESTING
        // var time = 1000
        endTime = new Date().getTime() + options.time
        for (var depth = 1; depth <= MAXDEPTH; depth++) {
            //Resetting counters to not make them cumulative 
            pruneCount = 0
            nodeCount = 0
            skipCount = 0
            let result = fastMinimax(board, player, oppPlayer, depth, -Infinity, Infinity, workerGame.eatMode, true)
            if (new Date().getTime() >= endTime) {
                console.log("Ran out of time at depth", depthCount.pop())
                break
            }
            //Setting new move only if time has not ran out yet
            score = result[1]
            move = result[0]
            type = result[2]

            // console.log("depth", depth, "node count", nodeCount, "score", score, "boards", checkedBoards.size, "pruned", pruneCount, "skipped", skipCount)
            if (score >= 100000000) {
                console.log("found win!")
                break
            }
        }
    } else {
        var depth = options.difficulty
        let result = fastMinimax(board, player, oppPlayer, depth, -Infinity, Infinity, workerGame.eatMode, true)
        move = result[0]
        score = result[1]
        type = result[2]
    }


    if (move == undefined) {
        console.log("Couldn't find a move", result)
        console.timeEnd("time finding a move")
        return
    }

    //Play the best move
    if (type == "placing") {
        console.log(workerGame.turn.name, type, "to", move, "score", score, "depth", depthCount.length - 1)
        move = indexToDot(move)
    } else if (type == "moving") {
        console.log(workerGame.turn.name, type, "from/to", move, "score", score, "depth", depthCount.length - 1)
        move = [indexToDot(move[0]), indexToDot(move[1])]
    } else if (type == "eating") {

        console.log(workerGame.turn.name, type, "to", move, "score", score, "depth", depthCount.length - 1)
        move = indexToDot(move)
    } else {
        console.log(type, move, "typeless move?")
    }
    console.log("node count", nodeCount, "uniq boards",
        checkedBoards.size, "skipped", skipCount, "pruned", pruneCount, "skip %:", Math.floor(100 * skipCount / nodeCount))
    console.timeEnd("time finding a move")
    return [move, type]
}
function addInfo(board, player, oppPlayer, depth) {
    var str = depth.toString() + getStage(player) + player.char + getStage(oppPlayer) + oppPlayer.char + board
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
        console.log("returning 0 stage", player)
        return 0
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

// function deepClone(obj) {
//     var visitedNodes = [];
//     var clonedCopy = [];
//     function clone(item) {
//         if (typeof item === "object" && !Array.isArray(item)) {
//             if (visitedNodes.indexOf(item) === -1) {
//                 visitedNodes.push(item);
//                 var cloneObject = {};
//                 clonedCopy.push(cloneObject);
//                 for (var i in item) {
//                     if (item.hasOwnProperty(i)) {
//                         cloneObject[i] = clone(item[i]);
//                     }
//                 }
//                 return cloneObject;
//             } else {
//                 return clonedCopy[visitedNodes.indexOf(item)];
//             }
//         }
//         else if (typeof item === "object" && Array.isArray(item)) {
//             if (visitedNodes.indexOf(item) === -1) {
//                 var cloneArray = [];
//                 visitedNodes.push(item);
//                 clonedCopy.push(cloneArray);
//                 for (var j = 0; j < item.length; j++) {
//                     cloneArray.push(clone(item[j]));
//                 }
//                 return cloneArray;
//             } else {
//                 return clonedCopy[visitedNodes.indexOf(item)];
//             }
//         }

//         return item; // not object, not array, therefore primitive
//     }
//     return clone(obj);
// }