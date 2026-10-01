'use strict'
// Derived numbers of a run (from its JSON), shared by the Markdown and HTML reports.

const S = require('./stats')
const { parseBot } = require('./bots')

const CLASSES = ['placing-early', 'placing-late', 'moving', 'flying']

function timingOf(values) {
    return {
        median: S.median(values),
        mean: S.mean(values),
        max: values.length ? Math.max(...values) : null
    }
}

function analyzeStrength(run) {
    const { bots } = run.setup
    const games = run.games
    const summary = S.summarize(bots, games)
    const { ratings, anchor } = S.rate(summary)
    const intervals = S.ratingIntervals(bots, games, anchor)
    const perBot = {}
    for (const b of bots) {
        const times = [], illegal = []
        let leaves = 0, errors = 0, points = 0, played = 0
        for (const g of games) {
            for (const c of ['L', 'D']) {
                const st = g.stats[c]
                if (st.bot !== b) continue
                times.push(...st.times)
                leaves += st.leaves
                errors += st.errors
                if (st.illegal) illegal.push({ game: g.index, move: st.illegal })
            }
            if (g.light === b || g.dark === b) { played++; points += S.pointsOf(g, b) }
        }
        perBot[b] = {
            rating: ratings[b], interval: intervals[b], games: played, score: played ? points / played : 0,
            moves: times.length, ...timingOf(times), leavesPerMove: times.length ? leaves / times.length : 0,
            errors, illegal, kind: parseBot(b).kind, timeLimited: parseBot(b).timeLimited
        }
    }
    const order = [...bots].sort((x, y) => ratings[y] - ratings[x])
    return {
        summary, anchor, perBot, order,
        capped: games.filter(g => g.winner === null).length,
        illegal: games.filter(g => g.reason === 'illegal').length
    }
}

function analyzeSpeed(run) {
    const { bots } = run.setup
    const table = {}
    for (const b of bots) {
        table[b] = {}
        for (const cls of [...CLASSES, 'all']) {
            const ts = run.tasks.filter(t => t.bot === b && (cls === 'all' || t.cls === cls))
            const depths = ts.map(t => t.depth).filter(d => d !== null && d !== undefined)
            const leaves = ts.map(t => t.leaves).filter(x => x !== null && x !== undefined)
            table[b][cls] = {
                n: ts.length,
                ...timingOf(ts.map(t => t.ms)),
                leaves: leaves.length ? S.mean(leaves) : null,
                depthMedian: depths.length ? S.median(depths) : null,
                depthMin: depths.length ? Math.min(...depths) : null,
                depthMax: depths.length ? Math.max(...depths) : null,
                illegal: ts.filter(t => !t.legal).length,
                errors: ts.reduce((s, t) => s + t.errors, 0)
            }
        }
    }
    return { table, timeLimited: bots.filter(b => parseBot(b).timeLimited) }
}

function analyze(run) {
    return run.mode === 'strength' ? analyzeStrength(run) : analyzeSpeed(run)
}

// Setup fields that must match for a fair comparison.
function setupDifferences(after, before) {
    const keys = after.mode === 'strength' ? ['games', 'firstSeed', 'cap'] : ['positionsHash']
    const diffs = keys.filter(k => after.setup[k] !== before.setup[k])
        .map(k => `${k}: ${before.setup[k]} → ${after.setup[k]}`)
    const onlyBefore = before.setup.bots.filter(b => !after.setup.bots.includes(b))
    const onlyAfter = after.setup.bots.filter(b => !before.setup.bots.includes(b))
    if (onlyBefore.length) diffs.push(`only in ${before.name || 'before'}: ${onlyBefore.join(', ')}`)
    if (onlyAfter.length) diffs.push(`only in this run: ${onlyAfter.join(', ')}`)
    return diffs
}

// after vs before (a saved run). Speed ratio > 1 = this run is faster.
function compare(after, before) {
    if (after.mode !== before.mode) throw new Error(`Cannot compare a ${after.mode} run with a ${before.mode} run`)
    const shared = after.setup.bots.filter(b => before.setup.bots.includes(b))
    const a = analyze(after), b = analyze(before)
    const result = { name: before.name, mode: after.mode, shared, differences: setupDifferences(after, before) }
    if (after.mode === 'strength') {
        result.elo = shared.map(bot => ({
            bot, before: b.perBot[bot].rating, after: a.perBot[bot].rating,
            delta: a.perBot[bot].rating - b.perBot[bot].rating,
            msBefore: b.perBot[bot].median, msAfter: a.perBot[bot].median
        }))
    } else {
        result.speed = shared.map(bot => ({
            bot,
            stages: Object.fromEntries([...CLASSES, 'all'].map(cls => {
                const x = b.table[bot][cls], y = a.table[bot][cls]
                return [cls, { before: x.median, after: y.median, ratio: x.median && y.median ? x.median / y.median : null }]
            }))
        }))
    }
    return result
}

module.exports = { analyze, compare, CLASSES }
