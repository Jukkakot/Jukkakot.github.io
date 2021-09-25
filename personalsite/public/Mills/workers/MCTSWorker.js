const iterations = 5000
const exploration = 1.41

// const MINVISITS = 50
let maxPlayer, minPlayer
// let MCTSCheckedBoards
let randomGameTurns
let mctsNodeCount = 0
let roundCount
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
function MCTSFindBestMove(board, player, oppPlayer, eatMode) {
    maxPlayer = player
    minPlayer = oppPlayer
    // MCTSCheckedBoards = new Map()
    randomGameTurns = []
    mctsNodeCount = 0
    roundCount = 1
    let result
    let bestNode
    const originalState = {
        board: board,
        player: player,
        oppPlayer: oppPlayer,
        eatMode: eatMode,
        isPlayerTurn: true,
        winner: undefined,
    }

    const root = new Node(originalState)
    let movesObj = root.getMovesObj()
    let moves = movesObj.moves
    let type = movesObj.type

    // mctsNodeCount++
    // let iterateCount = 0
    if (moves.length > 1) {
        for (let i = 0; i < iterations; i++) {
            // iterateCount++
            root.setState(originalState)
            let selectedNode = selectNode(root)



            let expandedNode = expandNode(selectedNode)
            let won = playout(expandedNode)
            let reward = won ? 1 : -1
            backprop(expandedNode, reward)
            // if (i == iterations - 1) {
            //     roundCount++
            //     console.log("round", roundCount)
            //     i = 0
            // }
        }
        let maxWins = -Infinity
        for (let child of root.children) {
            if (child.wins >= maxWins) {
                maxWins = child.wins
                bestNode = child
            }
        }
        result = bestNode.move

    }
    else {
        console.log("returning only move available")
        bestNode = root
        result = [moves[0], type]
    }


    let avgTurns = randomGameTurns.reduce((a, b) => a + b, 0) / randomGameTurns.length
    console.log(maxPlayer.name, result,
        "wins", bestNode.wins,
        "visits", bestNode.visits,
        "maxindex", root.children.indexOf(bestNode),
        "childCount", root.children.length,
        "maxturns", Math.max(...randomGameTurns),
        "minturns", Math.min(...randomGameTurns),
        "avgturns", Math.round(avgTurns),
        "playoutCount", randomGameTurns.length,
        "nodeCount", mctsNodeCount,
        "root", root)
    var data = {
        maxTurns: Math.max(...randomGameTurns),
        minTurns: Math.min(...randomGameTurns),
        avgTurns: Math.round(avgTurns),
        playoutCount: randomGameTurns.length,
        nodeCount: mctsNodeCount,
    }
    return { result: result, data: data }
}

function selectNode(root) {
    const c = exploration
    while (root.numUnexpandedMoves == 0) {
        let maxUBC = -Infinity
        let bestChild
        let Ni = root.visits
        for (let child of root.children) {
            const ni = child.visits
            const wi = child.wins
            const ubc = computeUCB(wi, ni, c, Ni)
            // console.log(ubc)
            if (ubc >= maxUBC) {
                maxUBC = ubc
                bestChild = child
            }
        }
        if (bestChild === undefined) console.error("undefined node", bestChild, root)
        //Moving to next best node
        root = bestChild
        if (root.getWinner() != undefined) {
            //Game has ended, so node is leaf node
            return root
        }
    }
    return root
}

function expandNode(node) {
    if (node.getWinner() != undefined) {
        return node
    }
    if (node.numUnexpandedMoves === 0) console.error("No more moves left?", node)
    let movesObj = node.getMovesObj()
    let moves = movesObj.moves
    let type = movesObj.type

    let isUniqueMove = false
    let randIndex
    while (!isUniqueMove) {
        randIndex = Math.floor(Math.random() * moves.length)
        let move = [moves[randIndex], type]
        isUniqueMove = node.children.every(n => JSON.parse(JSON.stringify(n.move) !=
            JSON.parse(JSON.stringify(move))))
    }

    //Creating new children node
    const newState = playMove(node, randIndex)
    const newNode = new Node(newState, [moves[randIndex], type], node)
    mctsNodeCount++
    node.children.push(newNode)
    node.numUnexpandedMoves--

    return newNode
}

function playout(node) {
    let winner
    const clonedState = JSON.parse(JSON.stringify(node.state))
    let roundCount = 0
    while (!winner) {
        roundCount++
        node.setState(playMove(node))
        winner = node.state.winner
    }
    randomGameTurns.push(roundCount)
    node.setState(clonedState)

    return winner.char == maxPlayer.char
}

function backprop(node, reward) {
    while (node != undefined) {
        node.visits++
        node.wins += reward

        let winner = node.getWinner()
        if (winner && winner.char == maxPlayer.char) {
            node.wins = Infinity
            if(node.parent) {
                node.parent.wins = Infinity
            } else {
                console.log("first move is win?")
            }
        }
        // //Node is lost move if all children are lost moves
        // if (node.children.every(c => c.getWinner() && c.getWinner().char == minPlayer.char)) {
        //     node.parent.wins = -Infinity
        // }
        // //Node is win move if any children are win move
        // if (node.children.some(c => c.getWinner() && c.getWinner().char == maxPlayer.char)) {
        //     node.wins = Infinity
        // }
        node = node.parent
    }
}

function computeUCB(wi, ni, c, Ni) {
    return (wi / ni) + c * Math.sqrt(Math.log(Ni) / ni)
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
        debugger
        console.error("invalid move", moves.length, index)
    }

    var args = {
        move: moves[index],
        type: type,
        board: node.state.board,
        depth: 1,
        player: node.state.isPlayerTurn ? node.state.player : node.state.oppPlayer,
        oppPlayer: node.state.isPlayerTurn ? node.state.oppPlayer : node.state.player,
        isMaximizing: node.state.isPlayerTurn,
    }
    let result = fastPlayRound(args)

    if (result.winLose != undefined) {
        let value = result.winLose[1]
        node.state.winner = value == WIN ? node.state.player : node.state.oppPlayer
    }

    let newState = {
        player: node.state.player,
        oppPlayer: node.state.oppPlayer,
        board: result.board,
        eatMode: result.eatMode,
        //Only switching turn if eatmode is false
        isPlayerTurn: result.eatMode ? node.state.isPlayerTurn : !node.state.isPlayerTurn,
        winner: node.state.winner
    }
    newState.winner = node.getWinner(newState)
    return newState
}