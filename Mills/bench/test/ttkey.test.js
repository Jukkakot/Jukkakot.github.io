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
    return code => vm.runInContext(code, sb.context)
}

const SETUP = `
    p = clonePlayer(workerGame.turn); o = clonePlayer(workerGame.turn === workerGame.playerLight ? workerGame.playerDark : workerGame.playerLight)
    place = (b, pl, opp, dot) => fastPlayRound({ move: dot, type: 'placing', board: b, player: pl, oppPlayer: opp }).board
`

test('ttKey: two move orders reaching the same position give the same key', () => {
    const run = sandboxAt(3) // placing-early, light to move, no eat mode, board 00000000D000000L00000LD0
    const [a, b] = run(SETUP + `
        const pa = clonePlayer(p), oa = clonePlayer(o), pb = clonePlayer(p), ob = clonePlayer(o)
        let ba = place(workerGame.fastDots, pa, oa, 2); ba = place(ba, oa, pa, 12); ba = place(ba, pa, oa, 4)
        let bb = place(workerGame.fastDots, pb, ob, 4); bb = place(bb, ob, pb, 12); bb = place(bb, pb, ob, 2)
        ;[ttKey(ba, pa, oa, false, false), ttKey(bb, pb, ob, false, false)]`)
    assert.equal(a, b)
    assert.notEqual(run(SETUP + 'ttKey(workerGame.fastDots, p, o, false, true)'), run(SETUP + 'ttKey(workerGame.fastDots, p, o, false, false)'))
    assert.notEqual(run(SETUP + 'ttKey(workerGame.fastDots, p, o, true, true)'), run(SETUP + 'ttKey(workerGame.fastDots, p, o, false, true)'))
})

test('ttKey: a mill re-formed in the search differs from the root mill in the same window', () => {
    const run = sandboxAt(0) // light has the mill 0-1-2 at the root
    const [root, reformed] = run(SETUP + `
        const q = clonePlayer(p); q.mills[0].fastUniqId = q.mills[0].fastId + (q.turns + 7)
        ;[ttKey(workerGame.fastDots, p, o, true, true), ttKey(workerGame.fastDots, q, o, true, true)]`)
    assert.ok(run(SETUP + 'p.mills.length') > 0)
    assert.notEqual(root, reformed)
})
