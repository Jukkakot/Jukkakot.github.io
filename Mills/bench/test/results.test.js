'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const results = require('../results')
const { compare } = require('../analyze')
const { markdown } = require('../report')

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'mills-bench-'))

function speedRun(started, medians) {
    const bots = Object.keys(medians)
    const tasks = []
    for (const bot of bots) {
        for (const cls of ['placing-early', 'placing-late', 'moving', 'flying']) {
            tasks.push({ bot, index: tasks.length, cls, eatMode: false, ms: medians[bot], leaves: 10, depth: null, legal: true, error: null, errors: 0 })
        }
    }
    return {
        mode: 'speed',
        setup: { mode: 'speed', bots, jobs: 1, command: 'node Mills/bench/bench.js speed x', commit: 'abc', dirty: false, node: 'v22', cpu: 'cpu',
            started, seconds: 1, timeLimited: [], positionsFile: 'p.json', positionsCount: 4, positionsHash: 'h1' },
        tasks
    }
}

test('the results folder keeps the 10 newest runs and leaves other files alone', () => {
    const dir = tmp()
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'keep me')
    for (let i = 0; i < 12; i++) {
        const started = new Date(Date.UTC(2026, 9, 1, 12, 0, i)).toISOString()
        results.writeRun(speedRun(started, { random: 1 }), { md: '#', html: '<html>' }, dir)
    }
    const files = fs.readdirSync(dir)
    assert.equal(files.filter(f => f.endsWith('.json')).length, 10)
    assert.equal(files.filter(f => f.endsWith('.html')).length, 10)
    assert.ok(files.includes('notes.txt'))
    assert.ok(!files.some(f => f.includes('12-00-00-000Z')), 'oldest removed')
    assert.ok(files.some(f => f.includes('12-00-11-000Z')), 'newest kept')
})

test('saving by name refuses to overwrite without force and writes COMMANDS.md', () => {
    const dir = tmp()
    const run = speedRun('2026-10-01T12:00:00.000Z', { random: 1 })
    results.saveRun('baseline', run, { md: '# md', html: '<html>' }, { dir })
    for (const f of ['speed.json', 'speed.md', 'speed.html', 'COMMANDS.md']) assert.ok(fs.existsSync(path.join(dir, 'baseline', f)), f)
    assert.match(fs.readFileSync(path.join(dir, 'baseline', 'COMMANDS.md'), 'utf8'), /node Mills\/bench\/bench\.js speed x/)
    assert.throws(() => results.saveRun('baseline', run, { md: '', html: null }, { dir }), /--force/)
    results.saveRun('baseline', run, { md: '# again', html: null }, { dir, force: true })
    assert.ok(!fs.existsSync(path.join(dir, 'baseline', 'speed.html')))
    assert.throws(() => results.saveRun('Bad Name', run, { md: '' }, { dir }), /Invalid report name/)
    assert.equal(results.loadSaved('baseline', 'speed', dir).name, 'baseline')
})

test('compare: speed ratio per bot and stage, setup differences listed', () => {
    const before = { ...speedRun('2026-10-01T12:00:00.000Z', { 'minimax@d4': 100, random: 1 }), name: 'baseline' }
    const after = speedRun('2026-10-02T12:00:00.000Z', { 'minimax@d4': 25, 'minimax@d6': 50 })
    after.setup.positionsHash = 'h2'
    const c = compare(after, before)
    assert.deepEqual(c.shared, ['minimax@d4'])
    assert.equal(c.speed[0].stages.moving.ratio, 4)
    assert.ok(c.differences.some(d => d.includes('positionsHash')))
    assert.ok(c.differences.some(d => d.includes('random')))
    assert.match(markdown(after, c), /4\.00×/)
})

test('compare: Elo change per shared bot', () => {
    const game = (i, light, dark, winner) => ({ index: i, pairing: ['random', 'minimax@d1'], light, dark, winner, reason: winner ? 'chips' : 'capped', plies: 10,
        stats: { L: { bot: light, times: [1], leaves: 1, errors: 0, illegal: null }, D: { bot: dark, times: [2], leaves: 1, errors: 0, illegal: null } } })
    const setup = { mode: 'strength', bots: ['random', 'minimax@d1'], games: 2, firstSeed: 1, cap: 200, jobs: 1, started: '2026-10-01T12:00:00.000Z', seconds: 1, timeLimited: [] }
    const before = { mode: 'strength', setup, name: 'baseline', games: [game(0, 'random', 'minimax@d1', null), game(1, 'minimax@d1', 'random', null)] }
    const after = { mode: 'strength', setup, games: [game(0, 'random', 'minimax@d1', 'D'), game(1, 'minimax@d1', 'random', 'L')] }
    const c = compare(after, before)
    const d1 = c.elo.find(e => e.bot === 'minimax@d1')
    assert.equal(Math.round(d1.before), 1000)
    assert.ok(d1.delta > 100)
    assert.deepEqual(c.differences, [])
    assert.throws(() => compare(after, speedRun('2026-10-01T12:00:00.000Z', { random: 1 })), /Cannot compare/)
})
