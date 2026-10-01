'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { html } = require('../html')
const { compare } = require('../analyze')
const { runTasks } = require('../runner')
const { schedule } = require('../stats')

async function smallStrength() {
    const bots = ['random', 'minimax@d1']
    const games = await runTasks('game', schedule(bots, 2, 1).map(t => ({ ...t, cap: 20 })), 1)
    return { mode: 'strength', setup: { mode: 'strength', bots, games: 2, firstSeed: 1, cap: 20, jobs: 1, commit: 'abc', cpu: 'cpu', node: 'v22', started: '2026-10-01T12:00:00.000Z', seconds: 1, timeLimited: [] }, games }
}

const svgCount = page => (page.match(/<svg /g) || []).length

test('strength page: four charts, tables, no network', async () => {
    const page = html(await smallStrength())
    assert.equal(svgCount(page), 4)
    assert.match(page, /<table>/)
    assert.doesNotMatch(page, /https?:\/\//)
    assert.match(page, /prefers-color-scheme: dark/)
})

test('speed page: one chart per stage; compare adds one', async () => {
    const tasks = await runTasks('speed', ['random', 'minimax@d1'].flatMap(bot =>
        require('../positions.json').slice(0, 40).filter((_, i) => i % 5 === 0).map((position, index) => ({ bot, position, index }))), 1)
    const run = { mode: 'speed', setup: { mode: 'speed', bots: ['random', 'minimax@d1'], jobs: 1, commit: 'abc', cpu: 'cpu', node: 'v22', started: '2026-10-01T12:00:00.000Z', seconds: 1, timeLimited: [], positionsFile: 'p', positionsCount: 8, positionsHash: 'h' }, tasks }
    const page = html(run)
    assert.equal(svgCount(page), 4)
    assert.doesNotMatch(page, /https?:\/\//)
    const withCompare = html(run, compare(run, { ...run, name: 'baseline' }))
    assert.equal(svgCount(withCompare), 5)
})

test('strength compare page shows the identical-games line', async () => {
    const run = await smallStrength()
    const page = html(run, compare(run, { ...run, name: 'baseline' }))
    assert.match(page, /Identical games with &quot;baseline&quot;: 2\/2|Identical games with "baseline": 2\/2/)
})
