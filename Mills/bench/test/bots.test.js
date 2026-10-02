'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { parseBot, defaultEvalWeights, GAME_NAMES, WEIGHTS_DIR } = require('../bots')
const { createSandbox } = require('../sandbox')
const R = require('../referee')

test('every in-game option has a benchmark name that parses', () => {
    assert.equal(Object.keys(GAME_NAMES).length, 12)
    for (const [name, gameName] of Object.entries(GAME_NAMES)) {
        const bot = parseBot(name)
        assert.equal(bot.gameName, gameName)
        assert.equal(bot.options.text, gameName)
    }
    assert.equal(parseBot('minimax@d4').options.difficulty, 4)
    assert.equal(parseBot('iterative@d6').options.maxDepth, 6)
    assert.equal(parseBot('iterative@500ms').options.time, 500)
    assert.equal(parseBot('iterative@500ms').timeLimited, true)
    assert.equal(parseBot('iterative@d4').timeLimited, false)
    assert.equal(parseBot('minimax@d3').gameName, null)
})

test('unsupported budgets are refused with the supported list', () => {
    assert.throws(() => parseBot('mcts@i800'), /Unsupported bot "mcts@i800": MCTS supports only @i5000[\s\S]*Supported:/)
    assert.throws(() => parseBot('minimax@d16'), /depth must be 1-15/)
    assert.throws(() => parseBot('minimax'), /depth budget/)
    assert.throws(() => parseBot('alphazero@d1'), /unknown kind/)
})

test('the sandbox runs the unchanged worker code: minimax@d1 places a legal chip', () => {
    // The worker files are only read, never changed (compared before and after the run).
    const dir = path.join(__dirname, '..', '..', 'workers')
    const snapshot = () => fs.readdirSync(dir).map(f => f + ':' + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
    const before = snapshot()
    const sandbox = createSandbox(1)
    const state = R.newGame()
    const result = sandbox.chooseMove(state, parseBot('minimax@d1').options)
    assert.equal(result.type, 'placing')
    assert.ok(R.isLegal(state, result.type, result.move))
    assert.ok(result.leaves > 0)
    assert.equal(sandbox.errors.count, 0)
    assert.equal(snapshot(), before)
})

test('same seed, same choice', () => {
    const state = R.newGame()
    const opts = parseBot('minimax@d1').options
    const a = createSandbox(7).chooseMove(state, opts).move
    const b = createSandbox(7).chooseMove(state, opts).move
    assert.equal(a, b)
})

test('a weight set suffix loads weights/<set>.json; bad suffixes are refused', () => {
    const bot = parseBot('minimax@d4:v0')
    assert.equal(bot.name, 'minimax@d4:v0')
    assert.equal(bot.gameName, 'Minmax 4')
    assert.equal(bot.options.difficulty, 4)
    assert.equal(bot.options.evalWeights.newMillOpp, 4500)
    assert.equal(parseBot('minimax@d4').options.evalWeights, undefined)
    assert.throws(() => parseBot('minimax@d4:nosuch'), /no weight set "nosuch"/)
    assert.throws(() => parseBot('mcts@i5000:v0'), /only minimax and iterative/)
    assert.throws(() => parseBot('random:v0'), /only minimax and iterative/)
    const file = path.join(WEIGHTS_DIR, 'zz-test-unknown.json')
    fs.writeFileSync(file, JSON.stringify({ mill: 1, notAWeight: 2 }))
    try {
        assert.throws(() => parseBot('minimax@d2:zz-test-unknown'), /unknown weights: notAWeight/)
    } finally {
        fs.unlinkSync(file)
    }
})

test('weights in the move options apply to that search only, the rest keep their defaults', () => {
    const sandbox = createSandbox(1)
    const state = R.newGame()
    const weights = () => vm.runInContext('({ w: { ...evalWeights }, same: evalWeights === EVAL_WEIGHTS })', sandbox.context)
    sandbox.chooseMove(state, { ...parseBot('minimax@d1').options, evalWeights: { movableChip: 7 } })
    const partial = weights()
    assert.equal(partial.same, false)
    assert.equal(partial.w.movableChip, 7)
    assert.deepEqual({ ...partial.w, movableChip: defaultEvalWeights().movableChip }, defaultEvalWeights())
    sandbox.chooseMove(state, parseBot('minimax@d1').options)
    assert.equal(weights().same, true)
})
