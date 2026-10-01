'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { runTasks } = require('../runner')
const { schedule } = require('../stats')

// Everything but timing must be identical whatever the job count.
const strip = games => games.map(g => ({
    index: g.index, light: g.light, dark: g.dark, winner: g.winner, reason: g.reason, plies: g.plies,
    leaves: [g.stats.L.leaves, g.stats.D.leaves], moves: [g.stats.L.moves, g.stats.D.moves]
}))

test('a strength run gives the same games with 1 and 2 jobs', async () => {
    const tasks = schedule(['random', 'minimax@d1'], 4, 3).map(t => ({ ...t, cap: 30 }))
    const one = await runTasks('game', tasks, 1)
    const two = await runTasks('game', tasks, 2)
    assert.deepEqual(strip(one), strip(two))
    assert.equal(one.length, 4)
})
