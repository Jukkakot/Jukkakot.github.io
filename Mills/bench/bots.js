'use strict'
// Benchmark bot names (game kit notation: kind@budget) → the option objects the game sends
// to the worker (OPTIONS in sketch.js). A minimax/iterative name may end in :<set>, which loads
// the evaluation weight set weights/<set>.json into options.evalWeights.

const fs = require('node:fs')
const path = require('node:path')

const MCTS_ITERATIONS = 5000 // the constant in workers/MCTSWorker.js
const MAX_DEPTH = 15

const SUPPORTED = [
    'random',
    'minimax@d<n>          fixed depth n (1-15); in game: Minmax 1/4/6',
    'iterative@d<n>        iterative deepening to depth n (1-15); in game: Iterative D 4/D 6',
    'iterative@<n>ms       iterative deepening with a time limit; in game: Iterative 0.5s-10s',
    `mcts@i${MCTS_ITERATIONS}            MCTS (only ${MCTS_ITERATIONS} iterations: a constant in the bot code)`,
    '<minimax/iterative>:<set>  with the weight set Mills/bench/weights/<set>.json'
].join('\n  ')

// The in-game option of each benchmark name, for the report.
const GAME_NAMES = {
    'random': 'Random',
    'minimax@d1': 'Minmax 1', 'minimax@d4': 'Minmax 4', 'minimax@d6': 'Minmax 6',
    'iterative@500ms': 'Iterative 0.5s', 'iterative@1000ms': 'Iterative 1s',
    'iterative@3000ms': 'Iterative 3s', 'iterative@5000ms': 'Iterative 5s',
    'iterative@10000ms': 'Iterative 10s',
    'iterative@d4': 'Iterative D 4', 'iterative@d6': 'Iterative D 6',
    [`mcts@i${MCTS_ITERATIONS}`]: 'MCTS'
}

const base = { autoPlay: true, delay: true, random: false, iterative: false, mcts: false, maxDepth: MAX_DEPTH }

function refuse(name, why) {
    throw new Error(`Unsupported bot "${name}": ${why}\nSupported:\n  ${SUPPORTED}`)
}

function depthOf(name, budget) {
    const m = /^d(\d+)$/.exec(budget || '')
    if (!m) refuse(name, 'expected a depth budget @d<n>')
    const depth = Number(m[1])
    if (depth < 1 || depth > MAX_DEPTH) refuse(name, `depth must be 1-${MAX_DEPTH}`)
    return depth
}

const WEIGHTS_DIR = path.join(__dirname, 'weights')
let defaultWeights = null

// The worker's built-in EVAL_WEIGHTS, read once from a sandbox.
function defaultEvalWeights() {
    if (!defaultWeights) {
        const vm = require('node:vm')
        const { createSandbox } = require('./sandbox')
        defaultWeights = vm.runInContext('({ ...EVAL_WEIGHTS })', createSandbox(1).context)
    }
    return { ...defaultWeights }
}

// Loads weights/<set>.json, refusing a missing set or a weight the worker does not have.
function loadWeightSet(name, set) {
    if (!/^[\w-]+$/.test(set)) refuse(name, `bad weight set name "${set}"`)
    const file = path.join(WEIGHTS_DIR, `${set}.json`)
    if (!fs.existsSync(file)) refuse(name, `no weight set "${set}" (Mills/bench/weights/${set}.json)`)
    const weights = JSON.parse(fs.readFileSync(file, 'utf8'))
    const known = Object.keys(defaultEvalWeights())
    const unknown = Object.keys(weights).filter(k => !known.includes(k))
    if (unknown.length) refuse(name, `weight set "${set}" has unknown weights: ${unknown.join(', ')}`)
    return weights
}

// Parses a bot name; returns { name, kind, options, timeLimited, gameName }.
function parseBot(name) {
    const [plain, set, extraSet] = name.split(':')
    if (extraSet !== undefined) refuse(name, 'one weight set only')
    const [kind, budget, extra] = plain.split('@')
    if (extra !== undefined) refuse(name, 'one budget only')
    let options
    let timeLimited = false
    switch (kind) {
        case 'random':
            if (budget !== undefined) refuse(name, 'random takes no budget')
            options = { ...base, random: true }
            break
        case 'minimax':
            options = { ...base, difficulty: depthOf(name, budget) }
            break
        case 'iterative': {
            const ms = /^(\d+)ms$/.exec(budget || '')
            if (ms) {
                options = { ...base, iterative: true, time: Number(ms[1]) }
                timeLimited = true
            } else {
                options = { ...base, iterative: true, time: 60000, maxDepth: depthOf(name, budget) }
            }
            break
        }
        case 'mcts':
            if (budget !== `i${MCTS_ITERATIONS}`) refuse(name, `MCTS supports only @i${MCTS_ITERATIONS}`)
            options = { ...base, mcts: true, args: 'visits' }
            break
        default:
            refuse(name, `unknown kind "${kind}"`)
    }
    if (set !== undefined) {
        if (kind !== 'minimax' && kind !== 'iterative') refuse(name, 'only minimax and iterative take a weight set')
        options.evalWeights = loadWeightSet(name, set)
    }
    const gameName = GAME_NAMES[plain] || null
    return { name, kind, options: { ...options, text: gameName || name }, timeLimited, gameName }
}

module.exports = { parseBot, loadWeightSet, defaultEvalWeights, GAME_NAMES, MCTS_ITERATIONS, WEIGHTS_DIR }
