'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const R = require('../referee')
const { createSandbox } = require('../sandbox')
const { parseBot } = require('../bots')
const { createRng } = require('../rng')

// Moving-stage positions (not in eat mode): the speed positions plus seeded random play.
function randomPositions(count) {
    const out = []
    for (let seed = 1; out.length < count && seed < 500; seed++) {
        const rng = createRng(seed)
        let s = R.newGame()
        const plies = 24 + Math.floor(rng() * 40)
        for (let i = 0; i < plies && !s.winner && !s.draw; i++) {
            const { type, moves } = R.legalMoves(s)
            s = R.applyMove(s, type, moves[Math.floor(rng() * moves.length)])
        }
        if (!s.winner && !s.draw && !s.eatMode && R.legalMoves(s).type === 'moving') out.push(s)
    }
    return out
}
const positions = [...require('../positions.json').map(p => p.state), ...randomPositions(60)]
    .filter(s => !s.eatMode && R.legalMoves(s).type === 'moving')

// minimax@d2 on the state with the given position counts: { move, score }.
function search(state, counts) {
    const sb = createSandbox(1)
    const r = sb.chooseMove({ ...state, positions: counts }, parseBot('minimax@d2').options)
    return { move: JSON.stringify(r.move), score: vm.runInContext('__result.moveData.data.score', sb.context) }
}
const after = (state, move) => R.applyMove(R.resetPositions(R.clone(state)), 'moving', move)
const rootCounts = state => ({ [R.positionKey(state)]: 1 })

test('a bot that is ahead avoids the move into a third occurrence', () => {
    let checked = 0
    for (const s of positions) {
        const plain = search(s, rootCounts(s))
        if (!(plain.score > 0)) continue
        const next = after(s, JSON.parse(plain.move))
        if (next.eatMode || next.winner) continue
        const marked = search(s, { ...rootCounts(s), [R.positionKey(next)]: 2 })
        if (!(marked.score > 0)) continue // no other move better than a draw: taking it is right
        assert.notEqual(marked.move, plain.move, `position ${s.board}`)
        checked++
    }
    assert.ok(checked > 0, 'no position qualified')
})

test('a bot that is behind takes the move into a third occurrence', () => {
    let checked = 0
    for (const s of positions) {
        const plain = search(s, rootCounts(s))
        if (!(plain.score < 0)) continue
        const other = R.legalMoves(s).moves.find(m => {
            if (JSON.stringify(m) === plain.move) return false
            const next = after(s, m)
            return !next.eatMode && !next.winner
        })
        if (!other) continue
        const marked = search(s, { ...rootCounts(s), [R.positionKey(after(s, other))]: 2 })
        // The draw is now the best the bot can get (another move may tie with it)
        assert.ok(marked.score === 0, `position ${s.board}: score ${marked.score}`)
        checked++
    }
    assert.ok(checked > 0, 'no position qualified')
})
