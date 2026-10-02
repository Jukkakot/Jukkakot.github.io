'use strict'
// Benchmark bot names (game kit notation: kind@budget) → the option objects the game sends
// to the worker (OPTIONS in sketch.js). A minimax/iterative name may end in :<set>, which loads
// the evaluation weight set weights/<set>.json into options.evalWeights. An MCTS name may end in
// a playout suffix (:random, :heur, :cut<k>, :heurcut<k>).

const fs = require('node:fs')
const path = require('node:path')

const MAX_DEPTH = 15
const MAX_MCTS_ITERATIONS = 1000000
const MAX_CUTOFF = 200

// Reads a constant of the worker code from a sandbox (no mirrored copies here).
let workerContext = null
function workerConstant(expr) {
    if (!workerContext) workerContext = require('./sandbox').createSandbox(1).context
    return require('node:vm').runInContext(expr, workerContext)
}

const MCTS_ITERATIONS = workerConstant('MCTS_ITERATIONS')
const PLAYOUT_SUFFIXES = ':random, :heur, :cut<k>, :heurcut<k> (k 1-200; a cut may end in s<scale>, e.g. :cut12s1000)'

const SUPPORTED = [
    'random',
    'minimax@d<n>          fixed depth n (1-15); in game: Minmax 1/4/6',
    'iterative@d<n>        iterative deepening to depth n (1-15); in game: Iterative D 4/D 6',
    'iterative@<n>ms       iterative deepening with a time limit; in game: Iterative 0.5s-10s',
    `mcts@i<n>             MCTS with n iterations (1-${MAX_MCTS_ITERATIONS}); in game: MCTS = mcts@i${MCTS_ITERATIONS}`,
    `mcts@i<n>:<playout>   playout ${PLAYOUT_SUFFIXES}; none = the in-game playout`,
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

function iterationsOf(name, budget) {
    const m = /^i(\d+)$/.exec(budget || '')
    if (!m) refuse(name, 'expected an iteration budget @i<n>')
    const iterations = Number(m[1])
    if (iterations < 1 || iterations > MAX_MCTS_ITERATIONS) refuse(name, `iterations must be 1-${MAX_MCTS_ITERATIONS}`)
    return iterations
}

// MCTS playout suffix → { mctsPlayout, mctsEvalScale? }.
function playoutOf(name, suffix) {
    const m = /^(?:(random)|(heur)|(heur)?cut(\d+)(?:s(\d+))?)$/.exec(suffix)
    if (!m) refuse(name, `unknown playout suffix ":${suffix}"; MCTS takes ${PLAYOUT_SUFFIXES} (only minimax and iterative take a weight set)`)
    if (m[1]) return { mctsPlayout: { policy: 'random', cutoff: 0 } }
    if (m[2]) return { mctsPlayout: { policy: 'heuristic', cutoff: 0 } }
    const cutoff = Number(m[4])
    if (cutoff < 1 || cutoff > MAX_CUTOFF) refuse(name, `cutoff must be 1-${MAX_CUTOFF}`)
    const result = { mctsPlayout: { policy: m[3] ? 'heuristic' : 'random', cutoff } }
    if (m[5] !== undefined) {
        if (Number(m[5]) < 1) refuse(name, 'scale must be at least 1')
        result.mctsEvalScale = Number(m[5])
    }
    return result
}

const WEIGHTS_DIR = path.join(__dirname, 'weights')
let defaultWeights = null

// The worker's built-in EVAL_WEIGHTS, read once from a sandbox.
function defaultEvalWeights() {
    if (!defaultWeights) defaultWeights = workerConstant('({ ...EVAL_WEIGHTS })')
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
    const [plain, suffix, extraSuffix] = name.split(':')
    if (extraSuffix !== undefined) refuse(name, 'one suffix only')
    const [kind, budget, extra] = plain.split('@')
    if (extra !== undefined) refuse(name, 'one budget only')
    let options
    let timeLimited = false
    switch (kind) {
        case 'random':
            if (budget !== undefined) refuse(name, 'random takes no budget')
            if (suffix !== undefined) refuse(name, 'random takes no suffix (only minimax and iterative take a weight set)')
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
            options = { ...base, mcts: true, args: 'visits', mctsIterations: iterationsOf(name, budget) }
            if (suffix !== undefined) Object.assign(options, playoutOf(name, suffix))
            break
        default:
            refuse(name, `unknown kind "${kind}"`)
    }
    if (suffix !== undefined && (kind === 'minimax' || kind === 'iterative')) {
        options.evalWeights = loadWeightSet(name, suffix)
    }
    // An MCTS playout suffix makes it a benchmark-only variant, not the in-game option.
    const gameName = (kind === 'mcts' && suffix !== undefined) ? null : GAME_NAMES[plain] || null
    return { name, kind, options: { ...options, text: gameName || name }, timeLimited, gameName }
}

module.exports = { parseBot, loadWeightSet, defaultEvalWeights, GAME_NAMES, MCTS_ITERATIONS, WEIGHTS_DIR }
