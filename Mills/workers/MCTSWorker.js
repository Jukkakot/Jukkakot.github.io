const iterations = 5000
const exploration = 1.41
//A random playout longer than this many plies counts as a draw
const MCTS_PLAYOUT_CAP = 200

let randomGameTurns
let mctsNodeCount = 0
class Node {
    constructor(state, move, parent) {
        this.move = move
        this.parent = parent
        this.setState(state)
        // this.value
        // this.movesObject = this.getMovesObj()
        // this.moves = this.movesObject.moves
        // this.type = this.movesObject.type
        this.numUnexpandedMoves = this.getMovesObj().moves.length
        this.visits = 0
        this.wins = 0

        // this.numUnexpandedMoves = this.getMovesObj().moves.length
        // this.children = new Array(this.numUnexpandedMoves).fill(null) //temporary store move for debugging purposes
        this.children = []
    }
    setState(state) {
        this.state = JSON.parse(JSON.stringify(state))
        // this.state = { ...state }
        this.state.winner = this.getWinner()
        // this.state = {
        //     board: state.board,
        //     player: JSON.parse(JSON.stringify(state.player)),
        //     oppPlayer: JSON.parse(JSON.stringify(state.oppPlayer)),
        //     eatMode: state.eatMode,
        //     isPlayerTurn: state.isPlayerTurn,
        //     winner: this.getWinner(state)
        // }
        // this.numUnexpandedMoves = this.getMovesObj().moves.length
    }
    getMovesObj(state = this.state) {
        if (state.isPlayerTurn) {
            return fastGetUnOrderedMoves(state.board, state.player, state.oppPlayer, state.eatMode)
        } else {
            return fastGetUnOrderedMoves(state.board, state.oppPlayer, state.player, state.eatMode)
        }
    }
    // getMove(index) {
    //     let movesObj = this.getMovesObj(this.state)
    //     return [movesObj.moves[index], movesObj.type]
    // }
    getWinner(state = this.state) {
        if (state.winner != undefined) return state.winner
        let value = fastCheckWin(state.board, state.player, state.oppPlayer, 1, state.eatMode)
        if (value == WIN) {
            return state.player
        } else if (value == LOST) {
            return state.oppPlayer
        } else {
            let moves = this.getMovesObj(state).moves
            if (moves.length === 0) {
                return state.isPlayerTurn ? state.oppPlayer : state.player
            }
        }
    }
    // gameOver() {
    //     let moves = fastGetMoves(state.board, state.player, state.oppPlayer, state.eatMode).moves
    //     return getWinner() != undefined || moves.length == 0
    // }
}
function getRandomGameState(args) {
    let player = {
        name: args.player.name,
        char: args.player.char,
        chipCount: args.player.chipCount,
        chipsToAdd: args.player.chipsToAdd,
        mills: toFastMills(args.player.mills),
        turns: args.player.turns,
        stage3Turns: args.player.stage3Turns,
    }
    let oppPlayer = {
        name: args.oppPlayer.name,
        char: args.oppPlayer.char,
        chipCount: args.oppPlayer.chipCount,
        chipsToAdd: args.oppPlayer.chipsToAdd,
        mills: toFastMills(args.oppPlayer.mills),
        turns: args.oppPlayer.turns,
        stage3Turns: args.oppPlayer.stage3Turns,
    }
    const originalState = {
        board: args.board,
        player: player,
        oppPlayer: oppPlayer,
        eatMode: args.eatMode,
        isPlayerTurn: true,
        winner: undefined,
    }

    const root = new Node(originalState)

    return generateRandomState(root, args.rounds)
}
function generateRandomState(root, rounds) {
    while (rounds-- > 0) {
        let oldState = JSON.parse(JSON.stringify(root.state))
        let newState = playMove(root)
        //Returning the state right before winning the game
        if (newState.winner != undefined)
            return oldState
            
        root.setState(newState)
    }
    console.log(rounds)
    return root.state
}
function playMove(node, index) {
    //Checking if game has ended
    if (node.getWinner() != undefined) {
        return node.state
    }
    const movesObject = node.getMovesObj()
    const moves = movesObject.moves
    const type = movesObject.type
    if (index == undefined) {
        index = Math.floor(Math.random() * moves.length)
    }
    if (moves.length == 0) {
        node.state.winner = node.state.isPlayerTurn ? node.state.oppPlayer : node.state.player
        return node.state
    }
    if (moves[index] == undefined) {
        console.error("invalid move", moves.length, index)
    }

    let args = {
        move: moves[index],
        type: type,
        board: node.state.board,
        depth: 1,
        player: node.state.isPlayerTurn ? node.state.player : node.state.oppPlayer,
        oppPlayer: node.state.isPlayerTurn ? node.state.oppPlayer : node.state.player,
        isMaximizing: node.state.isPlayerTurn,
    }
    let result = fastPlayRound(args)

    // if (result.winLose != undefined) {
    //     let value = result.winLose[1]
    //     node.state.winner = value == WIN ? node.state.player : node.state.oppPlayer
    // }

    let newState = {
        player: node.state.player,
        oppPlayer: node.state.oppPlayer,
        // player: args.player,
        // oppPlayer: args.oppPlayer,
        board: result.board,
        eatMode: result.eatMode,
        //Only switching turn if eatmode is false
        isPlayerTurn: result.eatMode === true ? node.state.isPlayerTurn : !node.state.isPlayerTurn,
        winner: node.state.winner
    }
    newState.winner = node.getWinner(newState)
    return newState
}
//Monte Carlo tree search (UCT). A node's value sums rewards from the view of the player who made
//the move into it; rewards are from the root player's view: 1 win, 0 loss, 0.5 draw.
function MCTSFindBestMove(board, player, oppPlayer, eatMode, args = "visits") {
    randomGameTurns = []
    mctsNodeCount = 0
    const root = mctsNode(undefined, undefined, {
        board: board, me: clonePlayer(player), opp: clonePlayer(oppPlayer), eatMode: eatMode, rootToMove: true
    }, undefined)
    let result
    let bestNode = root
    let iterationCount = 0
    if (root.terminal === undefined && root.untried.length > 1) {
        for (let i = 0; i < iterations; i++) {
            let node = root
            //Selection
            while (node.terminal === undefined && node.untried.length === 0) {
                node = mctsBestChild(node)
            }
            //Expansion
            if (node.terminal === undefined) {
                let index = Math.floor(Math.random() * node.untried.length)
                let move = node.untried.splice(index, 1)[0]
                let child = mctsNode(move, node.moveType, mctsPlay(node, move, node.moveType), node)
                node.children.push(child)
                mctsNodeCount++
                node = child
            }
            //Playout and backpropagation
            let reward = node.terminal !== undefined ? node.terminal : mctsPlayout(node)
            for (let n = node; n !== undefined; n = n.parent) {
                n.visits++
                if (n.parent !== undefined) n.value += n.parent.rootToMove ? reward : 1 - reward
            }
            iterationCount++
        }
        //Final move: most visits, then the better value
        for (let child of root.children) {
            if (bestNode === root || child.visits > bestNode.visits ||
                (child.visits === bestNode.visits && child.value / child.visits > bestNode.value / bestNode.visits)) {
                bestNode = child
            }
        }
        result = [bestNode.move, bestNode.type]
    } else {
        let moves = root.untried || []
        result = [moves[0], root.moveType]
    }

    let avgTurns = randomGameTurns.reduce((a, b) => a + b, 0) / randomGameTurns.length
    console.log(player.name, result,
        "value", bestNode.value,
        "visits", bestNode.visits,
        "childCount", root.children.length,
        "playoutCount", iterationCount,
        "nodeCount", mctsNodeCount)
    let data = {
        maxTurns: Math.max(...randomGameTurns),
        minTurns: Math.min(...randomGameTurns),
        avgTurns: Math.round(avgTurns),
        playoutCount: iterationCount,
        nodeCount: mctsNodeCount,
    }
    return { result: result, data: data }
}
function mctsNode(move, type, state, parent) {
    let node = {
        move: move,
        type: type,
        board: state.board,
        me: state.me,
        opp: state.opp,
        eatMode: state.eatMode,
        rootToMove: state.rootToMove,
        parent: parent,
        children: [],
        untried: undefined,
        moveType: undefined,
        visits: 0,
        value: 0,
        terminal: mctsTerminal(state, parent === undefined)
    }
    if (node.terminal === undefined) {
        let movesObj = mctsMoves(state)
        node.untried = movesObj.moves.slice()
        node.moveType = movesObj.type
        //No legal move: the side to move loses
        if (node.untried.length === 0) node.terminal = state.rootToMove ? 0 : 1
    }
    return node
}
function mctsMoves(state) {
    let mover = state.rootToMove ? state.me : state.opp
    let other = state.rootToMove ? state.opp : state.me
    return fastGetUnOrderedMoves(state.board, mover, other, state.eatMode)
}
//Exact reward of a finished position, or undefined. The root is never a repetition draw (its
//occurrence is the current one).
function mctsTerminal(state, isRoot) {
    if (state.eatMode) return undefined
    let value = fastCheckWin(state.board, state.me, state.opp, 1, false)
    if (value === WIN) return 1
    if (value === LOST) return 0
    if (!isRoot && state.me.chipsToAdd === 0 && state.opp.chipsToAdd === 0 &&
        (gameHistory.get(repKey(state.board, state.me, state.opp, state.rootToMove)) || 0) >= 2) {
        return 0.5
    }
    return undefined
}
//New state after a move (the players are copied, the given state is not changed)
function mctsPlay(state, move, type) {
    let next = { me: clonePlayer(state.me), opp: clonePlayer(state.opp) }
    return mctsApply(next, state, move, type)
}
function mctsApply(next, state, move, type) {
    let mover = state.rootToMove ? next.me : next.opp
    let other = state.rootToMove ? next.opp : next.me
    let result = fastPlayRound({
        move: move, type: type, board: state.board, depth: 1,
        player: mover, oppPlayer: other, isMaximizing: state.rootToMove
    })
    next.board = result.board
    next.eatMode = result.eatMode
    next.rootToMove = result.eatMode ? state.rootToMove : !state.rootToMove
    return next
}
function mctsBestChild(node) {
    let best
    let bestUcb = -Infinity
    let logVisits = Math.log(node.visits)
    for (let child of node.children) {
        let ucb = child.value / child.visits + exploration * Math.sqrt(logVisits / child.visits)
        if (ucb > bestUcb) {
            bestUcb = ucb
            best = child
        }
    }
    return best
}
//Random moves from the node's position until it is decided or the cap is reached (draw)
function mctsPlayout(node) {
    let state = { board: node.board, me: clonePlayer(node.me), opp: clonePlayer(node.opp), eatMode: node.eatMode, rootToMove: node.rootToMove }
    for (let ply = 0; ply < MCTS_PLAYOUT_CAP; ply++) {
        let terminal = mctsTerminal(state, false)
        if (terminal !== undefined) {
            randomGameTurns.push(ply)
            return terminal
        }
        let movesObj = mctsMoves(state)
        if (movesObj.moves.length === 0) {
            randomGameTurns.push(ply)
            return state.rootToMove ? 0 : 1
        }
        let move = movesObj.moves[Math.floor(Math.random() * movesObj.moves.length)]
        mctsApply(state, state, move, movesObj.type)
    }
    randomGameTurns.push(MCTS_PLAYOUT_CAP)
    return 0.5
}
