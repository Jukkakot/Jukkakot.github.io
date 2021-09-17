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
    prevBestMove = {}

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
    var board = workerGame.fastDots
    if (board.length > 24) console.error("errrorrrr", board)
    let move
    let type
    let score
    let result

    if (options.random) {
        //Random
        let movesObject = fastGetUnOrderedMoves(board, player, oppPlayer, workerGame.eatMode, true)
        let moves = movesObject.moves
        type = movesObject.type
        move = moves[Math.floor(Math.random() * moves.length)]
    } else if (options.iterative) {
        //Iterative
        endTime = new Date().getTime() + options.time
        for (var depth = 1; depth <= MAXDEPTH; depth++) {
            //Resetting counters to not make them cumulative 
            // pruneCount = 0
            // nodeCount = 0
            // skipCount = 0
            
            highDepthNum = depth
            result = fastMinimax(board, player, oppPlayer, depth, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, workerGame.eatMode, true)
            if (new Date().getTime() >= endTime) {
                console.log("Ran out of time at depth", depthCount.pop())
                break
            } else {
                move = result[0]
                type = result[2]
                score = result[1]

                prevBestMove = {
                    move: move,
                    type: type
                }
                // console.log("depth", depth, "node count", nodeCount, "score", score, "boards", checkedBoards.size, "pruned", pruneCount, "skipped", skipCount)
                if (score >= 100000000) {
                    console.log("found win!")
                    break
                }
            }
        }
    } else if (options.mcts) {
        result = MCTSFindBestMove(board, player, oppPlayer, workerGame.eatMode)
        move = result[0]
        type = result[1]
    } else {
        //"Normal" minmax
        var depth = options.difficulty
        result = fastMinimax(board, player, oppPlayer, depth, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, workerGame.eatMode, true)
        move = result[0]
        score = result[1]
        type = result[2]
    }

    if (move === undefined || type === undefined) {
        console.error("Couldn't find a move", move,score,type,result)
        console.timeEnd("time finding a move")
        return
    }

    if (!options.random && !options.mcts) {
        console.log(workerGame.turn.name, type, move, options.text,
            "score", score,
            "depth", depthCount.length - 1,
            "nodecount", nodeCount,
            "boards", checkedBoards.size,
            "skipped", skipCount,
            "pruned", pruneCount,
            "skip %:", Math.floor(100 * skipCount / nodeCount),
            "top" + TOPX, topCount, "else", elseCount, "total", topCount + elseCount,
            "prevbestmoves", prevBestMove
        )
    } else {
        console.log(workerGame.turn.name, type, move, options.text)
    }
    //Formatting the move from fastDot to dot format
    if (type == "placing" || type == "eating") {
        move = indexToDot(move)
    } else if (type == "moving") {
        move = [indexToDot(move[0]), indexToDot(move[1])]
    } else {
        console.log(type, move, "typeless move?")
    }
    console.timeEnd("time finding a move")
    return [move, type]
}
function fastMinimax(board, player, oppPlayer, depth, alpha, beta, eatMode, isMaximizing) {
    //Calcing depth count
    if (!depthCount.includes(depth)) depthCount.push(depth)
    nodeCount++

    //Returning already calculated value for the board
    var calcedValue = getCalcedValue(board, player, oppPlayer, depth)
    if (calcedValue != undefined) {
        skipCount++
        return [undefined, calcedValue]
    }

    //Returning potential winning or losing value
    var winLoseValue = fastCheckWin(board, player, oppPlayer, depth, eatMode)
    if (winLoseValue != undefined) {
        return [undefined, winLoseValue]
    }

    //End node check
    if (depth <= 0 || endTime != undefined && new Date().getTime() >= endTime) {
        return [undefined, fastEvaluateBoard(board, player, oppPlayer, depth)]
    }

    //Building up "the tree" further
    if (isMaximizing) {
        let bestScore = Number.MIN_SAFE_INTEGER
        let bestMove
        var movesObject = fastGetMoves(board, player, oppPlayer, eatMode, isMaximizing)
        var moves = movesObject.moves
        var type = movesObject.type

        if (moves.length === 0) {
            //Player lost because no possible moves to do
            //this should only be the case on stage 2 when player has no more movable dots
            if (getStage(player) !== 2)
                console.error("Couldn't find moves", movesObject)

            return [undefined, -100000000 * depth]
        }
        for (var move of moves) {
            let cBoard = board
            //Cloning players 
            var cPlayer = JSON.parse(JSON.stringify(player))
            var cOppPlayer = JSON.parse(JSON.stringify(oppPlayer))
            var args = {
                move: move,
                type: type,
                board: cBoard,
                depth: depth,
                player: cPlayer,
                oppPlayer: cOppPlayer,
                isMaximizing: isMaximizing,
            }
            if (cBoard.length > 24) console.error("invalid board", cBoard)
            var result = fastPlayRound(args)
            eatMode = result.eatMode
            cBoard = result.board
            let score
            if (result.winLose != undefined) {
                score = result.winLose[1]
            } else {
                score = fastMinimax(cBoard, cPlayer, cOppPlayer, eatMode ? depth : depth - 1, alpha, beta, eatMode, eatMode)[1]
            }
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
        let bestScore = Number.MAX_SAFE_INTEGER;
        let bestMove
        var movesObject = fastGetMoves(board, oppPlayer, player, eatMode, isMaximizing)
        var moves = movesObject.moves
        var type = movesObject.type

        if (moves.length === 0) {
            //Player lost because no possible moves to do
            //this should only be the case on stage 2 when player has no more movable dots
            if (getStage(oppPlayer) !== 2)
                console.error("Couldn't find moves", movesObject)

            return [undefined, 100000000 * depth]
        }
        for (var move of moves) {
            let cBoard = board
            //Cloning players 
            var cPlayer = JSON.parse(JSON.stringify(player))
            var cOppPlayer = JSON.parse(JSON.stringify(oppPlayer))
            var args = {
                move: move,
                type: type,
                board: cBoard,
                depth: depth,
                player: cOppPlayer,
                oppPlayer: cPlayer,
                isMaximizing: isMaximizing,
            }
            if (cBoard.length > 24) console.error("invalid board", cBoard)
            var result = fastPlayRound(args)

            eatMode = result.eatMode
            cBoard = result.board

            let score
            if (result.winLose != undefined) {
                score = result.winLose[1]
            } else {
                score = fastMinimax(cBoard, cPlayer, cOppPlayer, eatMode ? depth : depth - 1, alpha, beta, eatMode, !eatMode)[1]
            }
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
    let playerDots = fastGetPlayerDots(board, player)
    //100 points for each players chip
    boardValue += (playerDots.length + player.chipsToAdd) * 100
    //-100 points for each opponent player chip
    boardValue -= (fastGetPlayerDots(board, oppPlayer).length + oppPlayer.chipsToAdd) * 100
    if (getStage(player) === 1) {
        //Giving points for each neighbour dot of players dots
        for (var dot of playerDots) {
            boardValue += getNeighboursIndexes(dot).length
        }
        scoreObject.neighbours = boardValue
    } else if (getStage(player) === 2) {
        //Adding 25 points for each moveable dot
        var moveableDots = fastGetMoveableDots(board, player).length
        boardValue += moveableDots * 25
        scoreObject.moveableDots = moveableDots
    }

    if (getStage(oppPlayer) === 2) {
        //Adding 25 points for each opponents un moveable dot
        var oppMoveableDots = fastGetMoveableDots(board, oppPlayer).length
        var oppUnmoveableDots = oppPlayer.chipCount - oppMoveableDots

        boardValue += oppUnmoveableDots * 25
        scoreObject.oppUnmoveableDots = oppUnmoveableDots
    }

    for (var window of millWindows) {
        var windowValue = fastEvaluateWindow(board, window, player, oppPlayer, scoreObject)
        boardValue += windowValue
    }

    var boardStr = addInfo(board, player, oppPlayer, depth)
    //Adding the board to checked boards map
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
    //Adding the "bonus points" from new mills to value
    //Because there is no way to see if a mill is new or not from the board string
    //the points dont go do checked boards
    if (scoreObject["newMill"] != undefined)
        boardValue += 3500 * scoreObject["newMill"]

    if (scoreObject["oppNewMill"] != undefined)
        boardValue -= 4000 * scoreObject["opNewMill"]

    return boardValue
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

