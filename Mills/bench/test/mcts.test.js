'use strict'
// MCTS (5000 iterations, about 10 s per search): immediate win, no mill given away,
// repeatable, and the random game state generator still works.
const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const R = require('../referee')
const { createSandbox } = require('../sandbox')
const { parseBot } = require('../bots')

const MCTS = parseBot('mcts@i5000').options

// A moving-stage position with Light to move from a board string ('L', 'D', '0').
function position(board, turns = 20) {
    const s = R.newGame()
    s.board = board
    for (const char of ['L', 'D']) {
        const p = s.players[char]
        p.chipCount = R.playerDots(board, char).length
        p.chipsToAdd = 0
        p.turns = turns
        p.mills = R.updatedMills(board, p).map(m => ({ ...m, new: false }))
    }
    s.turnNum = 2 * turns
    return R.resetPositions(s)
}

test('MCTS takes an immediate win', () => {
    // Light moves 3 -> 2 to close 0-1-2; Dark has 3 chips, so the removal wins.
    const s = position('LL0L0000D000D000L000L0D0')
    const win = R.applyMove(R.applyMove(s, 'moving', [3, 2]), 'eating', 8)
    assert.equal(win.winner, 'L')
    const sandbox = createSandbox(1)
    const r = sandbox.chooseMove(s, MCTS)
    assert.deepEqual(r.move, [3, 2])
    assert.equal(sandbox.errors.count, 0)
})

// Positions where only one move does not let Dark close a mill with its reply (found by random
// play; the code before the rewrite gave the mill away in each of them).
const NO_MILL = [
    { board: '0L0LDL00LLD0DLDDLLLD00D0', safe: [3, 11] },
    { board: 'LLD0L00LLLDD00DD0DLDL0LD', safe: [4, 3] }
]

test('MCTS does not give away a mill; same seed, same move', () => {
    for (const { board, safe } of NO_MILL) {
        const s = position(board)
        const legal = R.legalMoves(s).moves
        const givesMill = m => {
            const after = R.applyMove(s, 'moving', m)
            const replies = R.legalMoves(after)
            return replies.moves.some(r => R.applyMove(after, replies.type, r).eatMode)
        }
        assert.deepEqual(legal.filter(m => !givesMill(m)), [safe], board)
        const a = createSandbox(1).chooseMove(s, MCTS)
        assert.deepEqual(a.move, safe, board)
        assert.ok(a.leaves > 0 && a.leaves <= 5000, `playoutCount ${a.leaves}`)
        const b = createSandbox(1).chooseMove(s, MCTS)
        assert.deepEqual(b.move, a.move, board)
    }
})

test('the random game state generator returns a valid state', () => {
    const sandbox = createSandbox(3)
    const s = R.newGame()
    sandbox.context.__args = { player: s.players.L, oppPlayer: s.players.D, board: s.board, eatMode: false, rounds: 60 }
    const state = vm.runInContext('getRandomGameState(__args)', sandbox.context)
    assert.equal(typeof state.board, 'string')
    assert.equal(state.board.length, 24)
    assert.match(state.board, /^[LD0]{24}$/)
    assert.notEqual(state.board, s.board)
    assert.equal(sandbox.errors.count, 0)
})
