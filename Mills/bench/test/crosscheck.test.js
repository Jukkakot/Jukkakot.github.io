'use strict'
// The referee against the worker's own helpers: for every move of a few real games, the
// worker's fastPlayRound must give the same board and eat mode, and its fastCheckWin must
// agree on whether the game is over.
const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { playGame } = require('../game')
const { toWorkerGame } = require('../sandbox')

function workerApply(sandbox, before, choice) {
    const ctx = sandbox.context
    const wg = toWorkerGame(before)
    const player = wg.turn
    const opp = before.turn === 'L' ? wg.playerDark : wg.playerLight
    ctx.__args = { board: before.board, move: choice.move, type: choice.type, player, oppPlayer: opp }
    // isNewMill and friends read workerGame; give them the position before the move.
    ctx.__game = wg
    return vm.runInContext(`
        workerGame = __game
        var __r = fastPlayRound(__args)
        var __win = __r.eatMode ? undefined : fastCheckWin(__r.board, __args.player, __args.oppPlayer, 1, false)
        ;({ board: __r.board, eatMode: __r.eatMode, win: __win })
    `, ctx)
}

for (let seed = 1; seed <= 5; seed++) {
    test(`referee matches the worker helpers, game seed ${seed}`, () => {
        let checked = 0
        const swapped = seed % 2 === 0
        const result = playGame({
            bots: swapped ? { L: 'random', D: 'minimax@d1' } : { L: 'minimax@d1', D: 'random' },
            seed,
            onMove(before, choice, after, sandbox) {
                const w = workerApply(sandbox, before, choice)
                const where = `seed ${seed} ply ${after.plies} ${choice.type} ${JSON.stringify(choice.move)}`
                assert.equal(w.board, after.board, where)
                assert.equal(w.eatMode, after.eatMode, where)
                assert.equal(w.win !== undefined, after.winner !== null, `${where}: worker win ${w.win}, referee ${after.winner}`)
                checked++
            }
        })
        assert.notEqual(result.reason, 'illegal')
        assert.ok(checked > 10)
    })
}
