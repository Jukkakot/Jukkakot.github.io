'use strict'
// Runs the game's bot worker scripts, unchanged, in a Node vm context: the same globals the
// Web Worker has (self, importScripts, console), with Math.random replaced by a seeded source.
// One sandbox = one worker, so like in the browser both players of a game share its globals.

const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { performance } = require('node:perf_hooks')
const { createRng } = require('./rng')
const R = require('./referee')

const WORKERS_DIR = path.join(__dirname, '..', 'workers')
const MAX_ERROR_SAMPLES = 5

// Compiled once per process; each sandbox runs them in its own context.
const scriptCache = new Map()
function script(file) {
    if (!scriptCache.has(file)) {
        const full = path.join(WORKERS_DIR, file)
        scriptCache.set(file, new vm.Script(fs.readFileSync(full, 'utf8'), { filename: full }))
    }
    return scriptCache.get(file)
}

function createSandbox(seed) {
    const errors = { count: 0, samples: [] }
    const quiet = () => {}
    const context = vm.createContext({
        console: {
            log: quiet, info: quiet, warn: quiet, table: quiet, debug: quiet,
            error: (...args) => {
                errors.count++
                if (errors.samples.length < MAX_ERROR_SAMPLES) errors.samples.push(args.map(String).join(' ').slice(0, 200))
            }
        },
        setTimeout, clearTimeout
    })
    context.self = context
    context.self.addEventListener = quiet
    context.self.postMessage = quiet
    context.self.close = quiet
    context.importScripts = (...files) => files.forEach(f => script(f).runInContext(context))
    context.__rng = createRng(seed)
    vm.runInContext('Math.random = __rng', context)
    script('WorkerHelpers.js').runInContext(context)

    // Sets the worker globals as handleGetMove does, then searches.
    const search = new vm.Script(`
        MAXDEPTH = __options.maxDepth || 15
        workerGame = __game
        workerGame.playerDark.mills = toFastMills(workerGame.playerDark)
        workerGame.playerLight.mills = toFastMills(workerGame.playerLight)
        DEBUG = false
        NODELAY = true
        __result = fastFindBestMove(__options)
        __stats = { leaves: leafNodeCount + skipCount, depth: depthCount.length - 1 }
    `)

    // Returns { type, move, ms, leaves, depth, data } or { error } when the bot gave no move.
    function chooseMove(state, options) {
        context.__game = toWorkerGame(state)
        context.__options = JSON.parse(JSON.stringify(options))
        context.__result = undefined
        const errorsBefore = errors.count
        const start = performance.now()
        try {
            search.runInContext(context)
        } catch (e) {
            errors.count++
            if (errors.samples.length < MAX_ERROR_SAMPLES) errors.samples.push(String(e && e.stack || e).slice(0, 300))
            return { error: `threw: ${e && e.message}`, ms: performance.now() - start }
        }
        const ms = performance.now() - start
        const result = context.__result
        if (!result || !result.move) return { error: 'no move', ms, newErrors: errors.count - errorsBefore }
        const [move, type] = result.move
        const data = (result.moveData && result.moveData.data) || {}
        const stats = context.__stats
        return {
            type,
            move: fromDotMove(move),
            ms,
            leaves: options.mcts ? data.playoutCount : options.random ? 0 : stats.leaves,
            depth: options.mcts || options.random ? null : stats.depth,
            newErrors: errors.count - errorsBefore
        }
    }

    return { chooseMove, errors, context }
}

// The game object as the worker receives it (deepClone keeps turn === the player object).
function toWorkerGame(state) {
    const s = R.clone(state)
    const playerLight = s.players.L
    const playerDark = s.players.D
    return {
        playerLight,
        playerDark,
        turn: state.turn === 'L' ? playerLight : playerDark,
        eatMode: state.eatMode,
        winner: undefined,
        turnNum: state.turnNum,
        fastDots: state.board
    }
}

const toIndex = dot => dot.l * 8 + dot.d
function fromDotMove(move) {
    return Array.isArray(move) ? [toIndex(move[0]), toIndex(move[1])] : toIndex(move)
}

module.exports = { createSandbox, toWorkerGame }
