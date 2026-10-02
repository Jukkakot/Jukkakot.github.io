#!/usr/bin/env node
'use strict'
// Mills bot benchmark. See Mills/OVERVIEW.md → Benchmark.
//   node Mills/bench/bench.js strength <bot> <bot> ... [--games 20] [--seed 1] [--cap 200] [--jobs N]
//   node Mills/bench/bench.js speed <bot> ... [--positions <file>] [--jobs 1]
//     common: [--save <name> [--force]] [--compare <name>] [--no-html] [--notes "<text>"]
//   node Mills/bench/bench.js report <run.json> [--compare <name>]
//   node Mills/bench/bench.js tune --iterations <n> [--from h1] [--depth 3] [--pairs 4] [--seed 1] [--cap 200]
//     [--jobs N] [--resume] [--force] [--save <set>]   (see tune.js)

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { execSync } = require('node:child_process')
const { parseBot } = require('./bots')
const { schedule } = require('./stats')
const { runTasks } = require('./runner')
const { markdown } = require('./report')
const { compare } = require('./analyze')
const results = require('./results')
const { DEFAULT_CAP } = require('./game')

const DEFAULT_POSITIONS = path.join(__dirname, 'positions.json')
const REPO = path.join(__dirname, '..', '..')

function parseArgs(argv) {
    const args = { _: [] }
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        if (!a.startsWith('--')) { args._.push(a); continue }
        const key = a.slice(2)
        if (['no-html', 'force', 'resume'].includes(key)) args[key] = true
        else args[key] = argv[++i]
    }
    return args
}

// Quotes an argument for the recorded command line so it can be pasted back into a shell.
function shellQuote(a) {
    return /^[\w@.\/:=,+-]+$/.test(a) ? a : `'${a.replace(/'/g, `'\\''`)}'`
}

function git(cmd) {
    try { return execSync(`git ${cmd}`, { cwd: REPO, env: { ...process.env, GIT_PAGER: 'cat' } }).toString().trim() } catch { return '' }
}

function baseSetup(mode, bots, jobs, argv) {
    return {
        mode, bots, jobs,
        command: `node Mills/bench/bench.js ${argv.map(shellQuote).join(' ')}`,
        commit: git('rev-parse --short HEAD') || 'unknown',
        dirty: git('status --porcelain -- Mills/workers') !== '',
        node: process.version,
        cpu: `${os.cpus()[0].model.trim()} (${os.availableParallelism()} threads)`,
        started: new Date().toISOString(),
        timeLimited: bots.filter(b => parseBot(b).timeLimited)
    }
}

function progress(label) {
    let last = 0
    return (done, total) => {
        const now = Date.now()
        if (done === total || now - last > 2000) {
            last = now
            process.stderr.write(`\r${label}: ${done}/${total}   ${done === total ? '\n' : ''}`)
        }
    }
}

async function strength(args, argv) {
    const bots = args._
    bots.forEach(parseBot)
    const games = Number(args.games || 20)
    const firstSeed = Number(args.seed || 1)
    const cap = Number(args.cap || DEFAULT_CAP)
    const jobs = Number(args.jobs || Math.max(1, os.availableParallelism() - 1))
    const setup = { ...baseSetup('strength', bots, jobs, argv), games, firstSeed, cap }
    const tasks = schedule(bots, games, firstSeed).map(t => ({ ...t, cap }))
    const t0 = Date.now()
    const played = await runTasks('game', tasks, jobs, progress('games'))
    setup.seconds = (Date.now() - t0) / 1000
    return { mode: 'strength', setup, games: played }
}

function loadPositions(file) {
    const text = fs.readFileSync(file, 'utf8')
    return { positions: JSON.parse(text), hash: crypto.createHash('sha1').update(text.replace(/\r\n/g, '\n')).digest('hex').slice(0, 10) }
}

async function speed(args, argv) {
    const bots = args._
    bots.forEach(parseBot)
    const file = args.positions || DEFAULT_POSITIONS
    const { positions, hash } = loadPositions(file)
    const jobs = Number(args.jobs || 1)
    const setup = {
        ...baseSetup('speed', bots, jobs, argv),
        positionsFile: path.relative(REPO, file).replace(/\\/g, '/'), positionsCount: positions.length, positionsHash: hash
    }
    const tasks = bots.flatMap(bot => positions.map((position, index) => ({ bot, position, index })))
    const t0 = Date.now()
    const done = await runTasks('speed', tasks, jobs, progress('positions'))
    setup.seconds = (Date.now() - t0) / 1000
    return { mode: 'speed', setup, tasks: done }
}

function render(run, args) {
    const comparison = args.compare ? compare(run, results.loadSaved(args.compare, run.mode)) : null
    const md = markdown(run, comparison)
    const html = args['no-html'] ? null : require('./html').html(run, comparison)
    return { md, html }
}

async function main() {
    const argv = process.argv.slice(2)
    const args = parseArgs(argv)
    const mode = args._.shift()
    if (mode === 'report') {
        const file = args._[0]
        if (!file) throw new Error('report needs a run JSON file')
        const run = JSON.parse(fs.readFileSync(file, 'utf8'))
        const { md, html } = render(run, args)
        const out = file.replace(/\.json$/, '') + (args.compare ? `-vs-${args.compare}` : '') + '.html'
        fs.writeFileSync(out, html)
        process.stdout.write(md)
        process.stderr.write(`HTML: ${out}\n`)
        return
    }
    if (mode === 'tune') return require('./tune').tuneCli(args)
    if (!['strength', 'speed'].includes(mode) || args._.length === 0) {
        throw new Error('Usage: bench.js strength|speed <bot> ... | report <run.json> | tune ...  (see the header of bench.js)')
    }
    if (mode === 'strength' && args._.length < 2) throw new Error('strength needs at least two bots')
    if (args.save) {
        // Fail before a long run, not after it.
        const existing = path.join(results.REPORTS_DIR, args.save, `${mode}.json`)
        if (fs.existsSync(existing) && !args.force) throw new Error(`reports/${args.save} already has a ${mode} run; use --force to replace it`)
    }
    const run = mode === 'strength' ? await strength(args, argv) : await speed(args, argv)
    if (args.notes) run.setup.notes = args.notes
    const files = render(run, args)
    const jsonPath = results.writeRun(run, files)
    process.stdout.write(files.md)
    process.stderr.write(`Run: ${path.relative(REPO, jsonPath)}\n`)
    if (args.save) process.stderr.write(`Saved: ${path.relative(REPO, results.saveRun(args.save, run, files, { force: args.force }))}\n`)
}

main().catch(e => {
    process.stderr.write(`${e.message}\n`)
    process.exit(1)
})
