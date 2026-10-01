'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { createRng } = require('../rng')
const R = require('../referee')

// Builds a state from a board string and per-player counters.
function position(board, { turn = 'L', L = {}, D = {}, eatMode = false } = {}) {
    const s = R.newGame()
    s.board = board
    s.turn = turn
    s.eatMode = eatMode
    for (const c of ['L', 'D']) {
        const p = s.players[c]
        p.chipCount = R.playerDots(board, c).length
        p.chipsToAdd = 0
        Object.assign(p, { L, D }[c])
        p.mills = R.updatedMills(board, p).map(m => ({ ...m, new: false }))
    }
    return s
}

function play(s, ...moves) {
    for (const [type, move] of moves) s = R.applyMove(s, type, move)
    return s
}

test('placing switches to moving after the ninth chip', () => {
    let s = R.newGame()
    // Light on even points of rings 1-2 plus 16, Dark on odd points plus 18: no mills.
    const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18]
    for (const i of order) {
        assert.equal(R.legalMoves(s).type, 'placing')
        s = R.applyMove(s, R.legalMoves(s).type, i)
    }
    assert.equal(s.players.L.chipsToAdd, 0)
    assert.equal(R.stageOf(s.players.L), 2)
    assert.equal(R.legalMoves(s).type, 'moving')
    assert.equal(s.players.L.turns, 9)
    assert.equal(s.players.D.turns, 9)
})

test('flying: with three chips any empty point is a target', () => {
    const board = 'LL0L0000' + 'DD0D0000' + 'D0D00000'
    const s = position(board, { turn: 'L' })
    assert.equal(R.stageOf(s.players.L), 3)
    const { moves } = R.legalMoves(s)
    assert.equal(moves.length, 3 * 16)
})

test('a new mill gives eat mode without counting a turn', () => {
    let s = R.newGame()
    s = play(s, ['placing', 0], ['placing', 8], ['placing', 1], ['placing', 9])
    const turns = s.players.L.turns
    s = play(s, ['placing', 2])
    assert.equal(s.eatMode, true)
    assert.equal(s.turn, 'L')
    assert.equal(s.players.L.turns, turns)
    assert.equal(R.legalMoves(s).type, 'eating')
    s = play(s, ['eating', 8])
    assert.equal(s.eatMode, false)
    assert.equal(s.turn, 'D')
    assert.equal(s.players.L.turns, turns + 1)
    assert.equal(s.players.D.chipCount, 1)
    assert.ok(s.players.L.mills.every(m => !m.new))
})

test('a mill gets uniqNum = owner turns at the time it formed', () => {
    let s = R.newGame()
    s = play(s, ['placing', 0], ['placing', 8], ['placing', 1], ['placing', 9], ['placing', 2])
    const mill = s.players.L.mills[0]
    assert.equal(mill.fastId, '012')
    assert.equal(mill.uniqNum, 2)
    assert.equal(mill.fastUniqId, '0122')
})

test('removal is not from a mill unless all chips are in mills', () => {
    const board = 'DDD00000' + '0D000000' + 'LL000000'
    let s = position(board, { turn: 'L', eatMode: true })
    s.players.L.mills = [{ player: 'L', fastDots: [16, 17, 18], fastId: '161718', uniqNum: 0, fastUniqId: '1617180', new: true }]
    assert.deepEqual(R.legalMoves(s).moves, [9])
    const allInMill = position('DDD00000' + '00000000' + 'LL000000', { turn: 'L', eatMode: true })
    assert.deepEqual(R.legalMoves(allInMill).moves, [0, 1, 2])
})

test('a mill opened and closed again is new and can remove', () => {
    // Light mill 0-1-2, Light opens 2→3 and closes 3→2.
    const board = 'LLL00000' + 'DDD00000' + 'D0D0D000'
    let s = position(board, { turn: 'L' })
    s = play(s, ['moving', [2, 3]], ['moving', [20, 21]])
    assert.equal(s.players.L.mills.length, 0)
    s = play(s, ['moving', [3, 2]])
    assert.equal(s.eatMode, true)
    assert.equal(s.players.L.mills[0].new, true)
})

test('loss by two chips ends the game for the remover', () => {
    const board = 'LL000000' + 'L0000000' + 'DDD00000'
    let s = position(board, { turn: 'L' })
    s = play(s, ['moving', [8, 2]])
    assert.equal(s.eatMode, true)
    s = play(s, ['eating', 16])
    assert.equal(s.winner, 'L')
    assert.equal(s.winReason, 'chips')
    assert.deepEqual(R.legalMoves(s).moves, [])
})

test('loss by blocking: the opponent cannot move after the move', () => {
    // Dark 0,1,2,8 (stage 2); Light 3,7,9,14 closes the last gap with 14→15.
    const s = position('DDDL000L' + 'DL0000L0' + '00000000', { turn: 'L' })
    const after = R.applyMove(s, 'moving', [14, 15])
    assert.equal(after.winner, 'L')
    assert.equal(after.winReason, 'blocked')
})

test('loss by blocking: the mover blocks itself with its last placement', () => {
    // Light places its ninth chip at 2 and has no move in stage 2; Dark can still move.
    const s = position('LD0D000D' + 'LDLD000D' + '00000000', { turn: 'L', L: { chipsToAdd: 1 } })
    const after = R.applyMove(s, 'placing', 2)
    assert.equal(R.stageOf(after.players.L), 2)
    assert.equal(after.winner, 'D')
    assert.equal(after.winReason, 'blocked')
})

test('an illegal move is rejected', () => {
    const s = R.newGame()
    assert.throws(() => R.applyMove(s, 'moving', [0, 1]), /Illegal/)
    const s2 = R.applyMove(s, 'placing', 0)
    assert.throws(() => R.applyMove(s2, 'placing', 0), /Illegal/)
})

test('move cap: both players reached the cap', () => {
    const s = R.newGame()
    s.players.L.turns = 200
    assert.equal(R.isCapped(s, 200), false)
    s.players.D.turns = 200
    assert.equal(R.isCapped(s, 200), true)
})

test('same seed gives the same sequence', () => {
    const a = createRng(42), b = createRng(42), c = createRng(43)
    const sa = Array.from({ length: 5 }, a), sb = Array.from({ length: 5 }, b)
    assert.deepEqual(sa, sb)
    assert.notDeepEqual(sa, Array.from({ length: 5 }, c))
    assert.ok(sa.every(x => x >= 0 && x < 1))
})
