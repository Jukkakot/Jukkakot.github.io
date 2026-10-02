'use strict'
// Markdown report of a run (and an optional comparison).

const { analyze, CLASSES } = require('./analyze')
const { GAME_NAMES } = require('./bots')

const f0 = x => (x === null || x === undefined ? '–' : Math.round(x).toString())
const f1 = x => (x === null || x === undefined ? '–' : x.toFixed(1))
const pct = x => `${(x * 100).toFixed(1)} %`
const ms = x => (x === null || x === undefined ? '–' : x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.round(x).toString())
const label = b => (GAME_NAMES[b] ? `${b} (${GAME_NAMES[b]})` : b)

function table(header, rows) {
    return [
        `| ${header.join(' | ')} |`,
        `|${header.map((_, i) => (i === 0 ? '---' : '---:')).join('|')}|`,
        ...rows.map(r => `| ${r.join(' | ')} |`)
    ].join('\n')
}

function setupBlock(run) {
    const s = run.setup
    const lines = [
        `- Bots: ${s.bots.join(', ')}`,
        s.mode === 'strength' || run.mode === 'strength'
            ? `- Games per pairing: ${s.games}, first seed ${s.firstSeed}, move cap ${s.cap} turns per player`
            : `- Positions: ${s.positionsCount} (${s.positionsFile}), hash ${s.positionsHash}`,
        `- Jobs: ${s.jobs}; code: ${s.commit}${s.dirty ? ' (uncommitted changes)' : ''}; Node ${s.node}; ${s.cpu}`,
        `- Started ${s.started}, took ${f1(s.seconds / 60)} min`
    ]
    if (s.timeLimited && s.timeLimited.length) {
        lines.push(`- **Not repeatable:** ${s.timeLimited.join(', ')} use a time limit, so results depend on the machine and its load.`)
    }
    return lines.join('\n')
}

function strengthMarkdown(run, a) {
    const out = [`# Mills bot strength`, '', setupBlock(run), '', '## Standings', '']
    out.push(table(
        ['Bot', 'Elo', '95 % interval', 'Score', 'Median ms/move', 'Max ms', 'Leaves/move'],
        a.order.map(b => {
            const p = a.perBot[b]
            return [label(b), f0(p.rating), `${f0(p.interval[0])}–${f0(p.interval[1])}`, pct(p.score),
                ms(p.median), ms(p.max), f0(p.leavesPerMove)]
        })
    ))
    out.push('', `Elo: Bradley–Terry, draws (capped or repetition) half a point, ${a.anchor} = 1000; interval by bootstrap.`, '', '## Pairings', '')
    out.push(table(
        ['Pairing', 'Share of first', '95 % interval', 'W', 'L', 'Draws (capped / repetition)', 'By chips', 'By blocking', 'Illegal', 'Avg plies'],
        a.summary.pairings.map(p => [`${p.a} vs ${p.b}`, pct(p.share), `${pct(p.interval[0])}–${pct(p.interval[1])}`,
            p.wins, p.losses, `${p.draws} (${p.endings.capped} / ${p.endings.repetition})`, p.endings.chips, p.endings.blocked, p.endings.illegal, f0(p.avgPlies)])
    ))
    out.push('', `Draws: ${a.draws} (capped ${a.capped}, repetition ${a.repetition}). Games lost by an illegal or missing move: ${a.illegal}.`)
    const problems = run.setup.bots.filter(b => a.perBot[b].errors || a.perBot[b].illegal.length)
    if (problems.length) {
        out.push('', '## Bot errors', '')
        for (const b of problems) {
            const p = a.perBot[b]
            out.push(`- ${b}: ${p.errors} console.error calls, ${p.illegal.length} illegal/missing moves` +
                (p.illegal.length ? ` (first: game ${p.illegal[0].game}, ${p.illegal[0].move})` : ''))
        }
    }
    return out
}

function speedMarkdown(run, a) {
    const out = [`# Mills bot speed`, '', setupBlock(run), '', '## Median ms per move', '']
    const bots = run.setup.bots
    out.push(table(['Bot', ...CLASSES, 'all', 'max (all)'],
        bots.map(b => [label(b), ...CLASSES.map(c => ms(a.table[b][c].median)), ms(a.table[b].all.median), ms(a.table[b].all.max)])))
    out.push('', '## Leaves per move (MCTS: playouts)', '')
    out.push(table(['Bot', ...CLASSES, 'all'], bots.map(b => [label(b), ...[...CLASSES, 'all'].map(c => f0(a.table[b][c].leaves))])))
    if (a.timeLimited.length) {
        out.push('', '## Depth reached by time-limited bots (median, min–max)', '')
        out.push(table(['Bot', ...CLASSES, 'all'], a.timeLimited.map(b => [label(b), ...[...CLASSES, 'all'].map(c => {
            const t = a.table[b][c]
            return t.depthMedian === null ? '–' : `${f0(t.depthMedian)} (${t.depthMin}–${t.depthMax})`
        })])))
    }
    const bad = bots.filter(b => a.table[b].all.illegal || a.table[b].all.errors)
    if (bad.length) {
        out.push('', '## Bot errors', '')
        for (const b of bad) out.push(`- ${b}: ${a.table[b].all.illegal} illegal/missing moves, ${a.table[b].all.errors} console.error calls`)
    }
    return out
}

// The identical-games check of a strength comparison, as Markdown lines.
function identicalLines(g) {
    const out = [`Identical games: ${g.identical}/${g.shared}` + (g.skipped ? ` (${g.skipped} with a time-limited bot not compared)` : '')]
    if (g.differing.length) {
        out.push('', `Differing games (first ${g.differing.length} of ${g.differingCount}):`, '')
        for (const d of g.differing) out.push(`- ${d.pairing}, seed ${d.seed}, ${d.light} light / ${d.dark} dark: ${d.what.join('; ')}`)
    }
    return out
}

function compareMarkdown(c) {
    const out = ['', `## Compared with saved run "${c.name}"`, '']
    if (c.differences.length) out.push('Setup differences (not compared):', '', ...c.differences.map(d => `- ${d}`), '')
    if (c.mode === 'strength') {
        out.push(table(['Bot', 'Elo before', 'Elo after', 'Change', 'Median ms before', 'after'],
            c.elo.map(e => [e.bot, f0(e.before), f0(e.after), (e.delta >= 0 ? '+' : '') + f0(e.delta), ms(e.msBefore), ms(e.msAfter)])))
        out.push('', ...identicalLines(c.games))
    } else {
        out.push('Speed ratio = median before / median after (above 1 = faster now).', '')
        out.push(table(['Bot', ...CLASSES, 'all'], c.speed.map(s => [s.bot, ...[...CLASSES, 'all'].map(cls => {
            const r = s.stages[cls].ratio
            return r === null ? '–' : `${r.toFixed(2)}×`
        })])))
    }
    return out
}

function markdown(run, comparison) {
    const a = analyze(run)
    const out = run.mode === 'strength' ? strengthMarkdown(run, a) : speedMarkdown(run, a)
    if (comparison) out.push(...compareMarkdown(comparison))
    return out.join('\n') + '\n'
}

module.exports = { markdown, identicalLines }
