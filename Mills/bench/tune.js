'use strict'
// Tune mode: searches the evaluation weights by self-play (SPSA). See Mills/OVERVIEW.md → Benchmark.
//   node Mills/bench/bench.js tune --from h1 --depth 3 --iterations <n> --pairs 4 --seed 1 --cap 200
//     --jobs 5 [--resume] [--force] [--save <set>]
// Every iteration plays `pairs` seeds, each once from each side, between minimax@d<depth> with
// θ + c·Δ·R and θ − c·Δ·R, and moves θ toward the side that scored better. All random choices
// come from (seed, iteration, pair), and results come back in task order, so the job count
// never changes the weights.

const fs = require('node:fs')
const path = require('node:path')
const { createRng } = require('./rng')
const { runTasks } = require('./runner')
const { loadWeightSet, WEIGHTS_DIR } = require('./bots')
const { RESULTS_DIR } = require('./results')

const OPENING_PLIES = 4
const A_OFFSET = 50 // SPSA stability offset in a_k
const MOVING_AVERAGE = 20

// Ranges and steps come from the hand-fixed set h1 (v0 plus the new terms), so they do not
// move when the defaults change.
function tunable() {
    const h1 = { ...loadWeightSet('h1', 'v0'), ...loadWeightSet('h1', 'h1') }
    const out = {}
    for (const [name, v] of Object.entries(h1)) {
        out[name] = { min: 0, max: Math.max(4 * v, 4000), step: Math.max(20, 0.1 * v) }
    }
    return out
}
const TUNABLE = tunable()

// Mixes integers into one 32-bit seed.
function mix(...ints) {
    let h = 0x811c9dc5
    for (const n of ints) {
        h = Math.imul(h ^ (n >>> 0), 0x01000193) >>> 0
        h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0
    }
    return h || 1
}

const clamp = (v, { min, max }) => Math.min(max, Math.max(min, v))
const rounded = theta => Object.fromEntries(Object.entries(theta).map(([k, v]) => [k, Math.round(v)]))

function outFile(seed, dir = RESULTS_DIR) {
    return path.join(dir, `tune-${seed}.json`)
}

// The arguments that define a run (a resume must match them; --iterations may grow).
function runArgs({ from, depth, pairs, seed, cap }) {
    return { from, depth, pairs, seed, cap, openingPlies: OPENING_PLIES }
}

// One iteration's games: θ+ vs θ−, each seed once from each side.
function iterationTasks(args, k, plus, minus) {
    const bot = `minimax@d${args.depth}`
    const tasks = []
    for (let p = 0; p < args.pairs; p++) {
        const seed = mix(args.seed, k, p + 1)
        for (const plusIsLight of [true, false]) {
            tasks.push({
                light: bot, dark: bot, seed, cap: args.cap, openingPlies: OPENING_PLIES, plusIsLight,
                evalWeights: plusIsLight ? { L: plus, D: minus } : { L: minus, D: plus }
            })
        }
    }
    return tasks
}

// opts: from, depth, iterations, pairs, seed, cap, jobs, resume, force, dir, stopAfter (tests),
// tunable (names to tune; default all of TUNABLE), log (progress line sink).
async function runTune(opts) {
    const args = runArgs(opts)
    const names = opts.tunable || Object.keys(TUNABLE)
    for (const n of names) if (!TUNABLE[n]) throw new Error(`"${n}" is not a tunable weight`)
    const file = outFile(args.seed, opts.dir)
    const log = opts.log || (line => process.stderr.write(line + '\n'))
    let state
    if (opts.resume) {
        if (!fs.existsSync(file)) throw new Error(`--resume: no ${file}`)
        state = JSON.parse(fs.readFileSync(file, 'utf8'))
        const want = JSON.stringify({ ...args, tunable: names })
        const have = JSON.stringify({ ...state.args, tunable: state.tunable })
        if (want !== have) throw new Error(`--resume: the arguments differ from the saved run\n  saved: ${have}\n  now:   ${want}`)
    } else {
        if (fs.existsSync(file) && !opts.force) throw new Error(`${file} exists; use --resume to continue it or --force to start over`)
        const start = { ...loadWeightSet(`:${args.from}`, 'v0'), ...loadWeightSet(`:${args.from}`, args.from) }
        state = { args, tunable: names, k: -1, start, theta: { ...start }, history: [], seconds: 0 }
    }
    const t0 = Date.now() - state.seconds * 1000
    let ran = 0
    for (let k = state.k + 1; k < opts.iterations; k++) {
        if (opts.stopAfter !== undefined && ran >= opts.stopAfter) break
        const rng = createRng(mix(args.seed, k, 0))
        const delta = {}
        for (const n of names) delta[n] = rng() < 0.5 ? -1 : 1
        const c = 1 / Math.pow(k + 1, 0.101)
        const plus = rounded(state.theta), minus = rounded(state.theta)
        for (const n of names) {
            const t = TUNABLE[n]
            plus[n] = Math.round(clamp(state.theta[n] + c * delta[n] * t.step, t))
            minus[n] = Math.round(clamp(state.theta[n] - c * delta[n] * t.step, t))
        }
        const games = await runTasks('game', iterationTasks(args, k, plus, minus), opts.jobs || 1)
        let diff = 0
        for (const g of games) {
            if (!g.winner) continue
            diff += (g.winner === 'L') === g.plusIsLight ? 1 : -1
        }
        const r = diff / games.length
        const a = 2 / Math.pow(k + 1 + A_OFFSET, 0.602)
        for (const n of names) state.theta[n] = clamp(state.theta[n] + a * r * delta[n] * TUNABLE[n].step, TUNABLE[n])
        state.k = k
        state.seconds = (Date.now() - t0) / 1000
        state.history.push({ k, r, theta: rounded(state.theta) })
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, JSON.stringify(state))
        ran++
        const recent = state.history.slice(-MOVING_AVERAGE)
        const avg = recent.reduce((s, h) => s + h.r, 0) / recent.length
        log(`tune k=${k + 1}/${opts.iterations} r=${r.toFixed(3)} avg${recent.length}=${avg.toFixed(3)} elapsed ${Math.round(state.seconds)}s`)
    }
    return { ...state, weights: rounded(state.theta), file }
}

function saveWeightSet(set, weights, { force = false, dir = WEIGHTS_DIR } = {}) {
    if (!/^[\w-]+$/.test(set)) throw new Error(`bad weight set name "${set}"`)
    const file = path.join(dir, `${set}.json`)
    if (fs.existsSync(file) && !force) throw new Error(`weights/${set}.json exists; use --force to replace it`)
    fs.writeFileSync(file, JSON.stringify(weights, null, 4) + '\n')
    return file
}

async function tuneCli(args) {
    const need = ['iterations']
    for (const n of need) if (args[n] === undefined) throw new Error(`tune needs --${n}`)
    if (args.save && !args.force && fs.existsSync(path.join(WEIGHTS_DIR, `${args.save}.json`))) {
        throw new Error(`weights/${args.save}.json exists; use --force to replace it`) // before a long run
    }
    const result = await runTune({
        from: args.from || 'h1',
        depth: Number(args.depth || 3),
        iterations: Number(args.iterations),
        pairs: Number(args.pairs || 4),
        seed: Number(args.seed || 1),
        cap: Number(args.cap || 200),
        jobs: Number(args.jobs || 1),
        resume: !!args.resume,
        force: !!args.force
    })
    process.stdout.write(JSON.stringify(result.weights, null, 4) + '\n')
    process.stderr.write(`Run: ${path.relative(process.cwd(), result.file)}\n`)
    if (args.save) process.stderr.write(`Saved: ${saveWeightSet(args.save, result.weights, { force: args.force })}\n`)
}

module.exports = { runTune, tuneCli, saveWeightSet, TUNABLE, OPENING_PLIES, mix }
