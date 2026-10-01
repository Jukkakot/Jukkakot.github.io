'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { execSync } = require('node:child_process')
const path = require('node:path')
const { parseBot, GAME_NAMES } = require('../bots')
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
    const sandbox = createSandbox(1)
    const state = R.newGame()
    const result = sandbox.chooseMove(state, parseBot('minimax@d1').options)
    assert.equal(result.type, 'placing')
    assert.ok(R.isLegal(state, result.type, result.move))
    assert.ok(result.leaves > 0)
    assert.equal(sandbox.errors.count, 0)
    const repo = path.join(__dirname, '..', '..', '..')
    assert.equal(execSync('git diff --stat -- Mills/workers', { cwd: repo }).toString(), '')
})

test('same seed, same choice', () => {
    const state = R.newGame()
    const opts = parseBot('minimax@d1').options
    const a = createSandbox(7).chooseMove(state, opts).move
    const b = createSandbox(7).chooseMove(state, opts).move
    assert.equal(a, b)
})
