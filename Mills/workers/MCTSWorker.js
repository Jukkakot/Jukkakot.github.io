const iterations = 5000
const exploration = 1.41
const WIN = 100000000
const LOST = -100000000
let maxPlayer, minPlayer
let MCTSCheckedBoards
let randomGameTurns
let mctsNodeCount = 0
class Node {
    constructor(state, move, parent) {
        this.move = move
        this.parent = parent
        this.state = state
        this.visits = 0
        this.wins = 0
        this.numUnexpandedMoves = this.getMovesObj().moves.length
        // this.children = new Array(this.numUnexpandedMoves).fill(null) //temporary store move for debugging purposes
        this.children = []
    }
    setState(state) {
        this.state = {
            board: state.board,
            player: JSON.parse(JSON.stringify(state.player)),
            oppPlayer: JSON.parse(JSON.stringify(state.oppPlayer)),
            eatMode: state.eatMode,
            isPlayerTurn: state.isPlayerTurn,
            winner: this.getWinner(state)
        }
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
            if (moves.length === 0) return state.isPlayerTurn ? state.oppPlayer : state.player
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
    MCTSCheckedBoards = new Map()
    randomGameTurns = []
    mctsNodeCount = 0
    const originalState = {
        board: board,
        player: player,
        oppPlayer: oppPlayer,
        eatMode: eatMode,
        isPlayerTurn: true,
        winner: undefined,
    }
    const root = new Node(originalState, undefined, undefined)
    mctsNodeCount++
    for (let i = 0; i < iterations; i++) {
        root.setState(JSON.parse(JSON.stringify(originalState)))
        // root.setState(JSON.parse(JSON.stringify(originalState)))
        let selectedNode = selectNode(root)

        //if selected node is terminal and player lost, make sure we never choose that move
        let winner = selectedNode.getWinner()
        if (winner != undefined && winner.char == minPlayer.char) {
            selectedNode.parent.wins = Number.MIN_SAFE_INTEGER
        }

        let expandedNode = expandNode(selectedNode)
        // let won
        // if (selectedNode.visits == 0) {
        //     let boardStr = addInfo(expandedNode.state.board, expandedNode.state.player, expandedNode.state.oppPlayer)
        //     let checkedValue = MCTSCheckedBoards.get(boardStr)
        //     if( checkedValue != undefined) {
        //         won = checkedValue
        //     } else {
        //         won = playout(expandedNode)
        //         MCTSCheckedBoards.set(boardStr, won)
        //     }

        // } else {
        //     won = playout(expandedNode)
        // }
        let won = playout(expandedNode)
        let reward = won ? 1 : -1
        backprop(expandedNode, reward)
        // if (i === iterations - 1 && randomGameTurns.length / mctsNodeCount > 0.95) {
        //     console.log(i, randomGameTurns.length, mctsNodeCount, randomGameTurns.length / mctsNodeCount)
        //     i = 0
        // } 
    }
    // root.setState(originalState)
    //choose move with most wins
    let maxWins = Number.MIN_SAFE_INTEGER
    //Giving the bestnode some initial value because if every possible move from root is loss
    //Then bestnode would be undefined (So AI didn't find any move that wouldnt lead into loss)
    let bestNode = root.children[0]
    for (let child of root.children) {
        if (child.wins >= maxWins) {
            maxWins = child.wins
            bestNode = child
        }
    }
    let result = bestNode.move
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
    return result
}

function selectNode(root) {
    const c = exploration
    while (root.numUnexpandedMoves == 0) {
        let maxUBC = Number.MIN_SAFE_INTEGER
        let maxIndex = -1
        let Ni = root.visits
        for (let i in root.children) {
            const child = root.children[i]
            const ni = child.visits
            const wi = child.wins
            const ubc = computeUCB(wi, ni, c, Ni)
            // console.log(ubc)
            if (ubc > maxUBC) {
                maxUBC = ubc
                maxIndex = i
            }
        }
        // //Leaf node check
        if (maxIndex == -1) {
            console.error("erroria", root.children)
        }
        //Moving to next best node
        root = root.children[maxIndex]
        if (root.getWinner() != undefined) {
            return root
        }

    }
    return root
}

function expandNode(node) {
    if (node.getWinner() != undefined) {
        return node
    }
    const movesObj = node.getMovesObj()
    const moves = movesObj.moves
    const type = movesObj.type
    let isUniqueMove = false
    let randIndex
    while (!isUniqueMove) {
        randIndex = Math.floor(Math.random() * moves.length)
        let move = [moves[randIndex], type]
        isUniqueMove = node.children.every(n => JSON.parse(JSON.stringify(n.move) !=
            JSON.parse(JSON.stringify(move))))

    }
    const newState = playMove(node, randIndex)
    const newNode = new Node(newState, [moves[randIndex], type], node)
    mctsNodeCount++
    node.children.push(newNode)
    node.numUnexpandedMoves--

    return newNode
}

function playout(node) {
    let roundCount = 0

    let winner = node.getWinner()
    if (winner != undefined) return winner.char == maxPlayer.char
    const clonedState = JSON.parse(JSON.stringify(node.state))

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
        node = node.parent
    }
}

// returns index of a random unexpanded child of node
// function selectRandomUnexpandedChild(node) {
//     //expand random nth unexpanded node
//     const choice = Math.floor(Math.random() * node.numUnexpandedMoves)
//     let count = -1
//     for (let i in node.children) {
//         const child = node.children[i]
//         if (child == null) {
//             count += 1
//         }
//         if (count == choice) {
//             return i
//         }
//     }
// }

function computeUCB(wi, ni, c, Ni) {
    return (wi / ni) + c * Math.sqrt(Math.log(Ni) / ni)
}


function playMove(node, index) {
    const movesObject = node.getMovesObj()
    const moves = movesObject.moves
    const type = movesObject.type
    if (index == undefined) {
        index = Math.floor(Math.random() * moves.length)
    }
    if (moves.length == 0) {
        // console.log(node.state.board)
        node.state.winner = node.state.isPlayerTurn ? node.state.oppPlayer : node.state.player
        return node.state
    }
    if (moves[index] == undefined) {
        debugger
        console.error("invalid index", moves.length, index)
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
        board: result.board,
        player: node.state.player,
        oppPlayer: node.state.oppPlayer,
        eatMode: result.eatMode,
        isPlayerTurn: result.eatMode ? node.state.isPlayerTurn : !node.state.isPlayerTurn,
        winner: node.state.winner
    }
    newState.winner = node.getWinner(newState)
    // if (result.eatMode) {
    //     node.setState(newState)
    //     return playMove(node)
    // } else {
    //     return newState
    // }
    return newState
}
