'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { createSandbox } = require('../sandbox')
const { parseBot } = require('../bots')
const positions = require('../positions.json')

// A sandbox whose worker globals (workerGame, root mills) are set up for the position.
function sandboxAt(index) {
    const sb = createSandbox(1)
    sb.chooseMove(positions[index].state, parseBot('minimax@d1').options)
    return code => vm.runInContext(`{ ${code} }`, sb.context) // a block: runs may reuse names
}

const SETUP = `
    p = clonePlayer(workerGame.turn); o = clonePlayer(workerGame.turn === workerGame.playerLight ? workerGame.playerDark : workerGame.playerLight)
    place = (b, pl, opp, dot) => fastPlayRound({ move: dot, type: 'placing', board: b, player: pl, oppPlayer: opp }).board
    withWeights = w => { evalWeights = { ...EVAL_WEIGHTS, ...w } }
`

test('a chip taken while placing counts with chipTakenPlacing, and not at all when it is 0', () => {
    const run = sandboxAt(3) // placing-early, light to move, board 00000000D000000L00000LD0
    const score = w => run(SETUP + `withWeights(${JSON.stringify(w)})
        const taken = clonePlayer(o); taken.chipsToAdd--
        ;[fastEvaluateBoard(workerGame.fastDots, p, o).value, fastEvaluateBoard(workerGame.fastDots, p, taken).value]`)
    const [same, oneTaken] = score({ chipTakenPlacing: 700 })
    assert.equal(oneTaken - same, 700)
    const [same0, oneTaken0] = score({ chipTakenPlacing: 0 })
    assert.equal(oneTaken0, same0)
})

test('a cached leaf with new mills for both players equals a fresh evaluation', () => {
    const run = sandboxAt(3)
    const [fresh, cached, pMills, oMills] = run(SETUP + `withWeights({})
        checkedBoards.clear()
        let b = place(workerGame.fastDots, p, o, 7); b = place(b, o, p, 9); b = place(b, p, o, 23); b = place(b, o, p, 10)
        const fresh = fastNewEvaluateBoard(b, p, o)
        ;[fresh, getCalcedValue(b, p, o), p.mills.length, o.mills.length]`)
    assert.equal(pMills, 1)
    assert.equal(oMills, 1)
    assert.equal(cached, fresh)
})

test('a flying player gains flyingThreat per line with two own chips and one empty point', () => {
    const run = sandboxAt(3)
    // Light flies (3 chips): lines 0-1-2 and 1-9-17 are threats; dark has 5 chips.
    const evalFlying = w => run(SETUP + `withWeights(${JSON.stringify(w)})
        const f = { ...p, char: 'L', name: workerGame.playerLight.name, chipCount: 3, chipsToAdd: 0, mills: [] }
        const d = { ...o, char: 'D', name: workerGame.playerDark.name, chipCount: 5, chipsToAdd: 0, mills: [] }
        const r = fastEvaluateBoard('LL00DD000L00DD000000D000', f, d)
        ;[r.value, r.scoreObject.flyingThreat]`)
    const [base, none] = evalFlying({ flyingThreat: 0 })
    const [withThreat, count] = evalFlying({ flyingThreat: 500 })
    assert.equal(none, undefined)
    assert.equal(count, 2)
    assert.equal(withThreat - base, 1000)
})
