'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { runTune, TUNABLE } = require('../tune')

// Depth 2 with a short cap: at depth 1 every game is a capped draw and the weights never move.
const BASE = { from: 'h1', depth: 2, iterations: 3, pairs: 1, seed: 1, cap: 100, log: () => {} }
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'mills-tune-'))

test('same arguments give the same weights with one job and with two', async () => {
    const a = await runTune({ ...BASE, jobs: 1, dir: tmp() })
    const b = await runTune({ ...BASE, jobs: 2, dir: tmp() })
    assert.ok(a.history.some(h => h.r !== 0), 'some iteration must move the weights')
    assert.notDeepEqual(a.weights, a.start)
    assert.deepEqual(b.weights, a.weights)
    assert.deepEqual(b.history, a.history)
})

test('a run stopped after 2 iterations and resumed ends like an unbroken run', async () => {
    const whole = await runTune({ ...BASE, jobs: 1, dir: tmp() })
    const dir = tmp()
    const first = await runTune({ ...BASE, jobs: 1, dir, stopAfter: 2 })
    assert.equal(first.k, 1)
    const resumed = await runTune({ ...BASE, jobs: 1, dir, resume: true })
    assert.deepEqual(resumed.weights, whole.weights)
    assert.deepEqual(resumed.history, whole.history)
    await assert.rejects(runTune({ ...BASE, cap: 90, jobs: 1, dir, resume: true }), /arguments differ/)
    await assert.rejects(runTune({ ...BASE, jobs: 1, dir }), /use --resume/)
})

test('weights are integers within range, and weights not tuned are unchanged', async () => {
    const names = ['mill', 'safeOpenMill', 'chipTaken', 'placingMill']
    const r = await runTune({ ...BASE, jobs: 1, dir: tmp(), tunable: names })
    for (const [name, v] of Object.entries(r.weights)) {
        assert.ok(Number.isInteger(v), name)
        if (names.includes(name)) assert.ok(v >= TUNABLE[name].min && v <= TUNABLE[name].max, name)
        else assert.equal(v, r.start[name], name)
    }
    assert.ok(names.some(n => r.weights[n] !== r.start[n]))
})
