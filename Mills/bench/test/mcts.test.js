'use strict'
// MCTS (about 10 s per search): immediate win, no mill given away, repeatable, for the in-game
// default and the old random playout; the heuristic playout policy and the cutoff reward; and
// the random game state generator still works.
const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const R = require('../referee')
const { createSandbox, toWorkerGame } = require('../sandbox')
const { parseBot, MCTS_ITERATIONS } = require('../bots')

// The game's MCTS and the milestone-1 random playout.
const BOTS = [`mcts@i${MCTS_ITERATIONS}`, 'mcts@i5000:random'].map(parseBot)

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
    for (const bot of [...BOTS, parseBot('mcts@i5000:heurcut12')]) {
        const sandbox = createSandbox(1)
        const r = sandbox.chooseMove(s, bot.options)
        assert.deepEqual(r.move, [3, 2], bot.name)
        assert.equal(sandbox.errors.count, 0, bot.name)
    }
})

// Positions where only one move does not let Dark close a mill with its reply (found by random
// play; the code before the rewrite gave the mill away in each of them).
const NO_MILL = [
    { board: '0L0LDL00LLD0DLDDLLLD00D0', safe: [3, 11] },
    { board: 'LLD0L00LLLDD00DD0DLDL0LD', safe: [4, 3] }
]

test('MCTS does not give away a mill; same seed, same move', () => {
    for (const bot of BOTS) {
        for (const { board, safe } of NO_MILL) {
            const s = position(board)
            const legal = R.legalMoves(s).moves
            const givesMill = m => {
                const after = R.applyMove(s, 'moving', m)
                const replies = R.legalMoves(after)
                return replies.moves.some(r => R.applyMove(after, replies.type, r).eatMode)
            }
            assert.deepEqual(legal.filter(m => !givesMill(m)), [safe], board)
            const a = createSandbox(1).chooseMove(s, bot.options)
            assert.deepEqual(a.move, safe, `${bot.name} ${board}`)
            assert.ok(a.leaves > 0 && a.leaves <= bot.options.mctsIterations, `playoutCount ${a.leaves}`)
            const b = createSandbox(1).chooseMove(s, bot.options)
            assert.deepEqual(b.move, a.move, `${bot.name} ${board}`)
        }
    }
})

// The worker's heuristic playout move for Light, over several seeds.
function policyMoves(board, moves, type, seeds = 8) {
    const picked = new Set()
    for (let seed = 1; seed <= seeds; seed++) {
        const sandbox = createSandbox(seed)
        sandbox.context.__args = { board, moves, type }
        picked.add(JSON.stringify(vm.runInContext(
            'mctsPolicyMove(__args.board, __args.moves, __args.type, "L", "D")', sandbox.context)))
    }
    return [...picked].map(m => JSON.parse(m))
}

test('heuristic playout: closes a mill, else blocks, else random; removal prefers a two-in-a-row', () => {
    // Placing: 2 closes 0-1-2 for Light; 10 blocks Dark's 8-9-10.
    const placing = 'LL000000DD00000000000000'
    assert.deepEqual(policyMoves(placing, [2, 10, 20], 'placing'), [2])
    assert.deepEqual(policyMoves(placing, [10, 20, 21], 'placing'), [10])
    assert.deepEqual(policyMoves(placing, [20, 21, 22], 'placing').sort(), [20, 21, 22])
    // Moving: 3 -> 2 closes 0-1-2; 1 -> 2 does not (it leaves the window), and 16 -> 10 blocks.
    const moving = 'LL0L0000DD000000L0000000'
    assert.deepEqual(policyMoves(moving, [[1, 2], [3, 2], [16, 10]], 'moving'), [[3, 2]])
    assert.deepEqual(policyMoves(moving, [[1, 2], [16, 10]], 'moving'), [[16, 10]])
    // Removal: 8 and 9 make Dark's open two (10 empty); 20 is alone.
    const removal = 'LL000000DD0000000000D000'
    assert.deepEqual(policyMoves(removal, [8, 9, 20], 'eating').sort(), [8, 9])
    assert.deepEqual(policyMoves(removal, [20], 'eating'), [20])
})

test('cutoff reward: in (0, 1), above 0.5 two chips up, below 0.5 two chips down', () => {
    // The search root has 6 chips each; in the scored position Dark has lost two.
    const root = position('L0L0D0D00L0D0L0DL0D0L0D0')
    const now = 'L0L0D0D00L0D0L0DL000L000'
    const sandbox = createSandbox(1)
    sandbox.context.__root = toWorkerGame(root)
    sandbox.context.__now = now
    const reward = (me, opp) => vm.runInContext(`
        workerGame = __root
        workerGame.playerLight.mills = toFastMills(workerGame.playerLight)
        workerGame.playerDark.mills = toFastMills(workerGame.playerDark)
        mctsCutoffReward({ board: __now, me: clonePlayer(workerGame.${me}), opp: clonePlayer(workerGame.${opp}), eatMode: false, rootToMove: true })
    `, sandbox.context)
    const up = reward('playerLight', 'playerDark')
    const down = reward('playerDark', 'playerLight')
    assert.ok(up > 0.5 && up < 1, `up ${up}`)
    assert.ok(down > 0 && down < 0.5, `down ${down}`)
    assert.equal(sandbox.errors.count, 0)
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
