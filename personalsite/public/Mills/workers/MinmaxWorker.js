function fastFindBestMove(options) {
    if (workerGame.winner) {
        console.log(this.winner.name, "won the workerGame")
        return
    }
    let startTime = new Date().getTime()
    let moveEndTime
    //Resetting counters 
    nodeCount = 0
    checkedBoards.clear()
    skipCount = 0
    depthCount = []
    pruneCount = 0
    iterativeEndTime = undefined
    prevBestMove = {}
    let moveData = {
        options: options,
    }
    let player = {
        name: workerGame.turn.name,
        char: workerGame.turn.char,
        chipCount: workerGame.turn.chipCount,
        chipsToAdd: workerGame.turn.chipsToAdd,
        mills: workerGame.turn.mills,
        turns: workerGame.turn.turns,
        stage3Turns: workerGame.turn.stage3Turns,
    }
    let oppPlay = workerGame.turn.name == workerGame.playerDark.name ? workerGame.playerLight : workerGame.playerDark
    let oppPlayer = {
        name: oppPlay.name,
        char: oppPlay.char,
        chipCount: oppPlay.chipCount,
        chipsToAdd: oppPlay.chipsToAdd,
        mills: oppPlay.mills,
        turns: oppPlay.turns,
        stage3Turns: oppPlay.stage3Turns,
    }
    let board = workerGame.fastDots
    if (board.length > 24) console.error("Invalid board", board)
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

        moveEndTime = new Date().getTime()
        moveData = {
            ...moveData,
            time: moveEndTime - startTime,
            data: {
                move: move,
                type: type,
            }
        }

    } else if (options.iterative) {
        //Iterative
        iterativeEndTime = new Date().getTime() + options.time
        for (let depth = 1; depth <= MAXDEPTH; depth++) {
            //Resetting counters to not make them cumulative 
            // pruneCount = 0
            // nodeCount = 0
            // skipCount = 0


            highDepthNum = depth
            result = fastMinimax(board,
                JSON.parse(JSON.stringify(player)),
                JSON.parse(JSON.stringify(oppPlayer)),
                depth, -Infinity, Infinity, workerGame.eatMode, true)
            if (new Date().getTime() >= iterativeEndTime) {
                console.log("Ran out of time at depth", depthCount.pop())
                break
            } else {
                move = result[0]
                score = result[1]
                type = result[2]

                prevBestMove = {
                    move: move,
                    type: type
                }
                // console.log("depth", depth, "node count", nodeCount, "score", score, "boards", checkedBoards.size, "pruned", pruneCount, "skipped", skipCount)
                if (score >= WIN) {
                    console.log("found win!")
                    break
                }
            }
        }
    } else if (options.mcts) {
        let mctsResult = MCTSFindBestMove(board, player, oppPlayer, workerGame.eatMode)
        result = mctsResult.result
        let mctsData = mctsResult.data

        move = result[0]
        type = result[1]

        moveEndTime = new Date().getTime()
        moveData = {
            ...moveData,
            time: moveEndTime - startTime,
            data: {
                ...mctsData,
                move: move,
                type: type,
            }
        }
    } else {
        //"Normal" minmax
        let depth = options.difficulty
        result = fastMinimax(board, player, oppPlayer, depth, -Infinity, Infinity, workerGame.eatMode, true)
        move = result[0]
        score = result[1]
        type = result[2]
    }

    if (move === undefined || type === undefined) {
        console.error("Couldn't find a move", move, score, type, result)
        moveEndTime = new Date().getTime()
        console.log("Time finding a move", moveEndTime - startTime)
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
            "prevbestmove", prevBestMove
        )
        moveEndTime = new Date().getTime()
        moveData = {
            ...moveData,
            time: moveEndTime - startTime,
            data: {
                move: move,
                type: type,
                score: score,
                depth: depthCount.length - 1,
                nodeCount: nodeCount,
                boards: checkedBoards.length,
                skipped: skipCount,
                pruned: pruneCount,
                skipPercent: Math.floor(100 * skipCount / nodeCount),
            }
        }
    } else {
        console.log(workerGame.turn.name, type, move, options.text)
    }
    //Formatting the move from fastDot to dot format
    if (type == "placing" || type == "eating") {
        move = indexToDot(move)
    } else if (type == "moving") {
        move = [indexToDot(move[0]), indexToDot(move[1])]
    } else {
        console.error("typeless move?", type, move)
    }
    moveData = {
        ...moveData,
        eatMode: workerGame.eatMode,
        boardScore: fastNewEvaluateBoard(board, player, oppPlayer),
        player: player,
        oppPlayer: oppPlayer,
        turnNumber: player.turns,
        uniqTurnNumber: workerGame.turnNum
    }
    console.log("Time finding the move", moveData.time, "ms")
    return { move: [move, type], moveData: moveData }
}
function fastMinimax(board, player, oppPlayer, depth, alpha, beta, eatMode, isMaximizing) {
    //Calcing depth count
    if (!depthCount.includes(depth)) depthCount.push(depth)
    nodeCount++

    //Returning potential winning or losing value
    let winLoseValue = fastCheckWin(board, player, oppPlayer, depth, eatMode)
    if (winLoseValue != undefined) {
        return [undefined, winLoseValue]
    }

    //End node check
    if (depth <= 0 || iterativeEndTime != undefined && new Date().getTime() >= iterativeEndTime) {
        //Returning already calculated value for the board
        let calcedValue = getCalcedValue(board, player, oppPlayer)
        if (calcedValue != undefined) {
            skipCount++
            return [undefined, calcedValue]
        }
        return [undefined, fastNewEvaluateBoard(board, player, oppPlayer)]
    }

    //Building up "the tree" further
    if (isMaximizing) {
        let bestScore = -Infinity
        let bestMove
        let movesObject = fastGetMoves(board, player, oppPlayer, eatMode, isMaximizing)
        let moves = movesObject.moves
        let type = movesObject.type

        if (moves.length === 0) {
            //Player lost because no possible moves to do
            //this should only be the case on stage 2 when player has no more movable dots
            if (getStage(player) !== 2)
                console.error("Couldn't find moves", movesObject)

            return [undefined, LOST * depth]
        }
        for (let move of moves) {
            let cBoard = board
            //Cloning players 
            let cPlayer = JSON.parse(JSON.stringify(player))
            let cOppPlayer = JSON.parse(JSON.stringify(oppPlayer))
            let args = {
                move: move,
                type: type,
                board: cBoard,
                depth: depth,
                player: cPlayer,
                oppPlayer: cOppPlayer,
                isMaximizing: isMaximizing,
            }
            if (cBoard.length > 24) console.error("invalid board", cBoard)
            let result = fastPlayRound(args)
            eatMode = result.eatMode
            cBoard = result.board
            let score
            if (result.winLose != undefined) {
                score = result.winLose[1]
            } else {
                score = fastMinimax(cBoard, cPlayer, cOppPlayer, eatMode ? depth : depth - 1, alpha, beta, eatMode, eatMode)[1]
            }
            if (score > bestScore || (RANDOMMOVES && score == bestScore && Math.random() < 1 / moves.length)) {
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
        let movesObject = fastGetMoves(board, oppPlayer, player, eatMode, isMaximizing)
        let moves = movesObject.moves
        let type = movesObject.type

        if (moves.length === 0) {
            //Player lost because no possible moves to do
            //this should only be the case on stage 2 when player has no more movable dots
            if (getStage(oppPlayer) !== 2)
                console.error("Couldn't find moves", movesObject)

            return [undefined, WIN * depth]
        }
        for (let move of moves) {
            let cBoard = board
            //Cloning players 
            let cPlayer = JSON.parse(JSON.stringify(player))
            let cOppPlayer = JSON.parse(JSON.stringify(oppPlayer))
            let args = {
                move: move,
                type: type,
                board: cBoard,
                depth: depth,
                player: cOppPlayer,
                oppPlayer: cPlayer,
                isMaximizing: isMaximizing,
            }
            if (cBoard.length > 24) console.error("invalid board", cBoard)
            let result = fastPlayRound(args)

            eatMode = result.eatMode
            cBoard = result.board

            let score
            if (result.winLose != undefined) {
                score = result.winLose[1]
            } else {
                score = fastMinimax(cBoard, cPlayer, cOppPlayer, eatMode ? depth : depth - 1, alpha, beta, eatMode, !eatMode)[1]
            }
            if (score < bestScore || (RANDOMMOVES && score == bestScore && Math.random() < 1 / moves.length)) {
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
function printScoreObject(scoreObject) {
    let output = "";
    for (let property in scoreObject) {
        if (property.toString() == "update") continue
        output += property + ': ' + scoreObject[property] + "\n"
    }
    console.log(output)
}
function fastNewEvaluateBoard(board, player, oppPlayer) {
    const playerEval = fastEvaluateBoard(board, player, oppPlayer)
    let playerVal = playerEval.value
    const playerNewMillCount = playerEval.scoreObject["newMill"] || 0
    playerVal += 3500 * playerNewMillCount

    const oppEval = fastEvaluateBoard(board, oppPlayer, player)
    let oppVal = oppEval.value
    const oppNewMillCount = oppEval.scoreObject["newMill"] || 0
    oppVal += 4000 * oppNewMillCount

    const checkBoardVal = playerEval.value - oppEval.value
    const boardStr = addInfo(board, player, oppPlayer)
    //Adding the board to checked boards map
    checkedBoards.set(boardStr, checkBoardVal)
    //Board total value is the players board values before adding new mill "bonus points"
    const boardValue = playerVal - oppVal

    if (DEBUG) {
        //This is helpful when looking at where the score comes from for a board
        console.log("Player")
        printScoreObject(playerEval.scoreObject)
        console.log("OppPlayer")
        printScoreObject(oppEval.scoreObject)

    }

    return boardValue
}
function fastEvaluateBoard(board, player, oppPlayer) {
    let boardValue = 0
    //Object to store info about where the different points for each board is coming from
    //Helpful for debugging
    let scoreObject = {
        update: function (prop) {
            this[prop] ? this[prop]++ : this[prop] = 1
        }
    }

    if (getStage(player) === 1) {
        //Giving points for each neighbour dot of players dots
        for (let dot of fastGetPlayerDots(board, player)) {
            boardValue += getNeighboursIndexes(dot).length
        }
        scoreObject.neighbours = boardValue
    } else if (getStage(player) === 2) {
        //Adding 25 points for each moveable dot
        let moveableDots = fastGetMoveableDots(board, player).length
        boardValue += moveableDots * 50
        scoreObject.moveableDots = moveableDots
    }

    if (getStage(player) !== 1) {
        // 300 points for each players chip when on stage 2 or 3
        boardValue += (player.chipCount - oppPlayer.chipCount) * 100
    }

    for (let window of millWindows) {
        let windowValue = fastEvaluateWindow(board, window, player, oppPlayer, scoreObject)
        boardValue += windowValue
    }

    return { value: boardValue, scoreObject: scoreObject }
}

function fastEvaluateWindow(board, window, player, oppPlayer, scoreObject) {
    let value = 0
    let windowStr = windowToStr(board, window)
    let playerMill = player.char + player.char + player.char

    //New mill
    if (windowStr == playerMill) {
        //Getting the non deepCopied player
        let workerGamePlayer = player.name == workerGame.playerLight.name ? workerGame.playerLight : workerGame.playerDark
        let clonePlayerMill = player.mills.find(m => m.fastId == fastGetWindowFastId(window))
        let workerGamerMill = workerGamePlayer.mills.find(m => m.fastId == fastGetWindowFastId(window))
        if (!clonePlayerMill) console.log(clonePlayerMill, "shouldnt happen", player.mills)
        //First checking if this mill is in the workerGame.dots board, if it isnt, then its a new mill

        //Second check is to check if the mill is in the workerGame.dots board but it has been formed another time
        //This has to be checked with unique number given to every mill formed in the workerGame
        //So that two mills that are in same place but formed at different times can be differentiated
        if ((clonePlayerMill && !fastIsSameWindow(window, board)) || (workerGamerMill && clonePlayerMill.fastUniqId != workerGamerMill.fastUniqId)) {
            scoreObject.update("newMill")
        }
    }

    switch (getStage(player)) {
        case (1):
            return fastStage1Score(board, window, player, oppPlayer, scoreObject) + value
        case (2):
            return fastStage2Score(board, window, player, oppPlayer, scoreObject) + value
        case (3):
            //Trying out just using the stage 2 scoring for stage 3 aswel
            return fastStage2Score(board, window, player, oppPlayer, scoreObject) + value
        default:
            console.error("Player has won or lost?", player)
    }
}
function fastStage1Score(board, window, player, oppPlayer, scoreObject) {
    let value = 0
    let oppStage = getStage(oppPlayer)

    let playerDots = getBoardDotsFromWindow(board, window, player.char)
    let oppDots = getBoardDotsFromWindow(board, window, oppPlayer.char)
    let emptyDots = getBoardDotsFromWindow(board, window, EMPTYDOT)

    let pieceCount = playerDots.length
    let oppCount = oppDots.length
    let emptyCount = emptyDots.length

    if (pieceCount + oppCount + emptyCount !== 3) console.error("Error calcing dot counts")

    //blocking opp mill stage 1
    if (oppStage === 1 && oppCount === 2 && pieceCount === 1) {
        scoreObject.update("blockOppMill")
        value += 400
    }
    //blocking opp mill stage 2
    if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
        getNeighboursIndexes(playerDots[0]).some(dot => board[dot] == oppPlayer.char &&
            !oppDots.some(chip => chip == dot))) {
        scoreObject.update("blockOppMillStage2")
        value += 400
    }
    //almost mill
    if (oppStage == 1 && pieceCount === 2 && emptyCount === 1) {
        scoreObject.update("almostMill")
        value += 150
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
        value += 300
    }

    return value
}
function fastStage2Score(board, window, player, oppPlayer, scoreObject) {
    let value = 0
    let oppStage = getStage(oppPlayer)

    let playerDots = getBoardDotsFromWindow(board, window, player.char)
    let oppDots = getBoardDotsFromWindow(board, window, oppPlayer.char)
    let emptyDots = getBoardDotsFromWindow(board, window, EMPTYDOT)

    let pieceCount = playerDots.length
    let oppCount = oppDots.length
    let emptyCount = emptyDots.length

    if (pieceCount + oppCount + emptyCount !== 3) console.error("Error calcing dot counts")

    //Syhky miilu is finnish and means double mill
    //which happens when you have 2 mills next to eachother and can get a mill every turn
    //also only limiting this to 1 because multiple double mills was encouraging not making a mill
    //which would break one of the double mills also.
    if (pieceCount === 2 && emptyCount === 1 && !scoreObject["doubleMill"] &&
        getNeighboursIndexes(emptyDots[0]).some(dot => board[dot] == player.char &&
            !playerDots.some(pDot => pDot == dot) &&
            player.mills.some(mill => mill.fastDots.some(chip => chip == dot)))) {
        scoreObject.update("doubleMill")
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

    return value
}
function fastStage3Score(board, window, player, oppPlayer, scoreObject) {
    let value = 0
    let oppStage = getStage(oppPlayer)

    let playerDots = getBoardDotsFromWindow(board, window, player.char)
    let oppDots = getBoardDotsFromWindow(board, window, oppPlayer.char)
    let emptyDots = getBoardDotsFromWindow(board, window, EMPTYDOT)

    let pieceCount = playerDots.length
    let oppCount = oppDots.length
    let emptyCount = emptyDots.length

    if (pieceCount + oppCount + emptyCount !== 3) console.error("Error calcing dot counts")

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

    return value
}