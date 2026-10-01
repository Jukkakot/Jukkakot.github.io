'use strict'
// Golden search fixture: what the fixed-budget bots decide on the 40 speed positions, down to
// scores, counters and random draws. A rewrite of the worker code that keeps behaviour must
// reproduce it exactly (test/golden.test.js); `node Mills/bench/make-golden.js` records it.

const vm = require('node:vm')
const path = require('node:path')
const { createSandbox } = require('./sandbox')
const { parseBot } = require('./bots')

const GOLDEN_BOTS = ['minimax@d1', 'minimax@d2', 'minimax@d3', 'minimax@d4', 'iterative@d3']
const GOLDEN_FILE = path.join(__dirname, 'test', 'golden-search.json')

// One fresh sandbox (seed = position number) per position and bot.
function searchRecord(position, index, bot) {
    const sb = createSandbox(index + 1)
    vm.runInContext('__randomCalls = 0; { const r = Math.random; Math.random = () => { __randomCalls++; return r() } }', sb.context)
    const r = sb.chooseMove(position.state, parseBot(bot).options)
    const data = vm.runInContext('({ score: String(__result.moveData.data.score), leaves: leafNodeCount, skipped: skipCount, pruned: pruneCount, depth: depthCount.length - 1 })', sb.context)
    return { position: index, bot, type: r.type, move: r.move, ...data, random: sb.context.__randomCalls, errors: sb.errors.count }
}

function goldenRecords(positions = require('./positions.json'), bots = GOLDEN_BOTS) {
    return positions.flatMap((p, i) => bots.map(b => searchRecord(p, i, b)))
}

module.exports = { goldenRecords, searchRecord, GOLDEN_BOTS, GOLDEN_FILE }
