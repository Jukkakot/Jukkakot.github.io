'use strict'
// The benchmark's referee: the game state and rules as Game.js / Player.js apply them,
// including their turn and mill bookkeeping (a turn is counted once per move plus any removal,
// and a new mill's uniqNum is its owner's turn count), so bots see the positions they would
// see in the browser. Plain data, no p5, no worker code.

const EMPTY = '0'
const CHIPS_PER_PLAYER = 9
const NAMES = { L: 'Light wood', D: 'Dark wood' }
const MILL_WINDOWS = [
    [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
    [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
    [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
    [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23]
]
const NEIGHBOURS = Array.from({ length: 24 }, (_, i) => {
    const layer = Math.floor(i / 8) * 8
    const d = i % 8
    const n = [layer + (d + 7) % 8, layer + (d + 1) % 8]
    if (d % 2 === 1) {
        if (layer > 0) n.push(i - 8)
        if (layer < 16) n.push(i + 8)
    }
    return n
})

function newPlayer(char) {
    return {
        name: NAMES[char], char, chipCount: 0, chipsToAdd: CHIPS_PER_PLAYER,
        turns: 0, stage3Turns: 0, mills: []
    }
}

function newGame() {
    return {
        board: EMPTY.repeat(24),
        players: { L: newPlayer('L'), D: newPlayer('D') },
        turn: 'L',
        eatMode: false,
        winner: null,
        winReason: null,
        turnNum: 0,
        plies: 0
    }
}

const other = char => (char === 'L' ? 'D' : 'L')

function clone(state) {
    return JSON.parse(JSON.stringify(state))
}

// Same as getStage in the game and the worker.
function stageOf(player) {
    if (player.chipsToAdd > 0) return 1
    if (player.chipCount + player.chipsToAdd === 3) return 3
    return 2
}

function playerDots(board, char) {
    const dots = []
    for (let i = 0; i < 24; i++) if (board[i] === char) dots.push(i)
    return dots
}

function emptyDots(board) {
    return playerDots(board, EMPTY)
}

function canMove(board, player) {
    if (stageOf(player) !== 2) return true
    return playerDots(board, player.char).some(d => NEIGHBOURS[d].some(n => board[n] === EMPTY))
}

// Player.checkIfLost
function hasLost(board, player) {
    return player.chipCount + player.chipsToAdd < 3 || !canMove(board, player)
}

// Player.getUpdatedMills: mills still standing keep their old object (and uniqNum);
// mills that appeared since get uniqNum = owner's turns and are new.
function updatedMills(board, player) {
    const mills = []
    for (const w of MILL_WINDOWS) {
        if (w.every(i => board[i] === player.char)) {
            const fastId = w.join('')
            const old = player.mills.find(m => m.fastId === fastId)
            mills.push(old || {
                player: player.char,
                fastDots: [...w],
                fastId,
                uniqNum: player.turns,
                fastUniqId: fastId + player.turns,
                new: true
            })
        }
    }
    return mills
}

// Player.canEat: an opponent chip that is not in a mill, unless all of them are.
function eatableDots(state) {
    const victim = state.players[other(state.turn)]
    const all = playerDots(state.board, victim.char)
    const inMill = new Set(victim.mills.flatMap(m => m.fastDots))
    const allInMill = all.every(d => inMill.has(d))
    return allInMill ? all : all.filter(d => !inMill.has(d))
}

// Legal moves of the player to move: { type, moves }. Moves are a dot index (placing,
// eating) or [from, to] (moving).
function legalMoves(state) {
    if (state.winner) return { type: null, moves: [] }
    const player = state.players[state.turn]
    const board = state.board
    if (state.eatMode) return { type: 'eating', moves: eatableDots(state) }
    const stage = stageOf(player)
    if (stage === 1) return { type: 'placing', moves: emptyDots(board) }
    const moves = []
    const empties = emptyDots(board)
    for (const from of playerDots(board, player.char)) {
        const targets = stage === 3 ? empties : NEIGHBOURS[from].filter(n => board[n] === EMPTY)
        for (const to of targets) moves.push([from, to])
    }
    return { type: 'moving', moves }
}

function sameMove(a, b) {
    return Array.isArray(a) ? Array.isArray(b) && a[0] === b[0] && a[1] === b[1] : a === b
}

function isLegal(state, type, move) {
    const legal = legalMoves(state)
    return legal.type === type && legal.moves.some(m => sameMove(m, move))
}

function setAt(board, i, ch) {
    return board.slice(0, i) + ch + board.slice(i + 1)
}

// Game.switchTurn
function switchTurn(s) {
    const player = s.players[s.turn]
    const opp = s.players[other(s.turn)]
    player.mills = updatedMills(s.board, player)
    if (player.mills.some(m => m.new)) {
        if (eatableDots(s).length > 0) {
            s.eatMode = true
            return
        }
        // The game would wait forever here (a mill with no chip to take); the referee lets
        // the turn pass instead. Only possible while the opponent has no chip on the board.
        player.mills.forEach(m => { m.new = false })
    }
    player.turns++
    s.turnNum++
    if (stageOf(player) === 3) player.stage3Turns++
    if (hasLost(s.board, player)) return setWinner(s, opp.char, player)
    s.turn = opp.char
    if (hasLost(s.board, opp)) return setWinner(s, player.char, opp)
}

function setWinner(s, char, loser) {
    s.winner = char
    s.winReason = loser.chipCount + loser.chipsToAdd < 3 ? 'chips' : 'blocked'
}

// Applies a legal move and returns the new state; throws on an illegal one.
function applyMove(state, type, move) {
    if (!isLegal(state, type, move)) {
        throw new Error(`Illegal ${type} move ${JSON.stringify(move)}`)
    }
    const s = clone(state)
    const player = s.players[s.turn]
    const opp = s.players[other(s.turn)]
    s.plies++
    if (type === 'placing') {
        s.board = setAt(s.board, move, player.char)
        player.chipCount++
        player.chipsToAdd--
        switchTurn(s)
    } else if (type === 'moving') {
        s.board = setAt(setAt(s.board, move[1], player.char), move[0], EMPTY)
        switchTurn(s)
    } else {
        // Game.eatChip
        s.board = setAt(s.board, move, EMPTY)
        opp.chipCount--
        s.eatMode = false
        player.mills.forEach(m => { m.new = false })
        switchTurn(s)
        const turnPlayer = s.players[s.turn]
        turnPlayer.mills = updatedMills(s.board, turnPlayer)
    }
    return s
}

// The move cap: both players have played `cap` turns without a winner.
function isCapped(state, cap) {
    return !state.winner && state.players.L.turns >= cap && state.players.D.turns >= cap
}

module.exports = {
    EMPTY, MILL_WINDOWS, NEIGHBOURS, NAMES,
    newGame, clone, other, stageOf, playerDots, legalMoves, isLegal, applyMove, isCapped,
    updatedMills, hasLost
}
