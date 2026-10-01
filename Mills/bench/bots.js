'use strict'
// Benchmark bot names (game kit notation: kind@budget) → the option objects the game sends
// to the worker (OPTIONS in sketch.js).

const MCTS_ITERATIONS = 5000 // the constant in workers/MCTSWorker.js
const MAX_DEPTH = 15

const SUPPORTED = [
    'random',
    'minimax@d<n>          fixed depth n (1-15); in game: Minmax 1/4/6',
    'iterative@d<n>        iterative deepening to depth n (1-15); in game: Iterative D 4/D 6',
    'iterative@<n>ms       iterative deepening with a time limit; in game: Iterative 0.5s-10s',
    `mcts@i${MCTS_ITERATIONS}            MCTS (only ${MCTS_ITERATIONS} iterations: a constant in the bot code)`
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

// Parses a bot name; returns { name, kind, options, timeLimited, gameName }.
function parseBot(name) {
    const [kind, budget, extra] = name.split('@')
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
    const gameName = GAME_NAMES[name] || null
    return { name, kind, options: { ...options, text: gameName || name }, timeLimited, gameName }
}

module.exports = { parseBot, GAME_NAMES, MCTS_ITERATIONS }
