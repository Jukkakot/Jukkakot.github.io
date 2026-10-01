'use strict'
// The visual report: one self-contained HTML page per run (inline SVG, no scripts, fonts or
// network), light and dark. Colours from the dataviz reference palette; a single hue where the
// bot is named on the axis, categorical slots only for outcome segments. The Markdown report
// is rendered below the charts as the table view.

const { analyze, CLASSES } = require('./analyze')
const { markdown } = require('./report')

const W = 720
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const r1 = x => Math.round(x * 10) / 10
const fmtMs = x => (x === null || x === undefined ? '–' : x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.round(x).toString())
const pct = x => `${Math.round(x * 100)} %`

const CSS = `
:root { color-scheme: light;
  --page: #f9f9f7; --surface: #fcfcfb; --ink: #0b0b0b; --ink2: #52514e; --muted: #898781;
  --grid: #e1e0d9; --axis: #c3c2b7; --border: rgba(11,11,11,0.10);
  --s1: #2a78d6; --s2: #eb6834; --neutral: #c3c2b7; --mid: #f0efec; --pos: #2a78d6; --neg: #e34948; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark;
  --page: #0d0d0d; --surface: #1a1a19; --ink: #ffffff; --ink2: #c3c2b7; --muted: #898781;
  --grid: #2c2c2a; --axis: #383835; --border: rgba(255,255,255,0.10);
  --s1: #3987e5; --s2: #d95926; --neutral: #5f5e5a; --mid: #383835; --pos: #3987e5; --neg: #e66767; } }
:root[data-theme="dark"] { color-scheme: dark;
  --page: #0d0d0d; --surface: #1a1a19; --ink: #ffffff; --ink2: #c3c2b7; --muted: #898781;
  --grid: #2c2c2a; --axis: #383835; --border: rgba(255,255,255,0.10);
  --s1: #3987e5; --s2: #d95926; --neutral: #5f5e5a; --mid: #383835; --pos: #3987e5; --neg: #e66767; }
body { margin: 0; background: var(--page); color: var(--ink); font: 15px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { font-size: 24px; margin: 0 0 4px; } h2 { font-size: 18px; margin: 32px 0 4px; } h3 { font-size: 15px; margin: 20px 0 6px; }
p.sub, .note { color: var(--ink2); margin: 0 0 12px; } .note { font-size: 13px; }
figure { margin: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
svg { width: 100%; height: auto; display: block; }
svg text { fill: var(--ink2); font-size: 12px; font-family: inherit; } svg .ink { fill: var(--ink); } svg .muted { fill: var(--muted); }
.legend { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 13px; color: var(--ink2); margin: 8px 0 0; }
.legend span::before { content: ""; display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; background: var(--c); vertical-align: -1px; }
.tables { overflow-x: auto; } table { border-collapse: collapse; font-size: 13px; margin: 8px 0 16px; font-variant-numeric: tabular-nums; }
th, td { padding: 4px 8px; border-bottom: 1px solid var(--grid); text-align: right; white-space: nowrap; } th:first-child, td:first-child { text-align: left; }
th { color: var(--ink2); font-weight: 600; } details { margin-top: 32px; } summary { cursor: pointer; font-weight: 600; }
`

// Log-scale x mapping for times; ticks at powers of ten.
function logScale(values, x0, x1) {
    const v = values.filter(x => x > 0)
    const lo = Math.pow(10, Math.floor(Math.log10(Math.max(Math.min(...v), 0.01))))
    const hi = Math.pow(10, Math.ceil(Math.log10(Math.max(...v, lo * 10))))
    const f = x => x0 + (Math.log10(Math.max(x, lo)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) * (x1 - x0)
    const ticks = []
    for (let t = lo; t <= hi * 1.0001; t *= 10) ticks.push(t)
    return { f, ticks }
}
const tickLabel = t => (t >= 1000 ? `${t / 1000} s` : `${t} ms`)

function svg(h, body, label) {
    return `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`
}
const grid = (x, y0, y1) => `<line x1="${r1(x)}" x2="${r1(x)}" y1="${y0}" y2="${y1}" stroke="var(--grid)"/>`

// Elo ladder: one row per bot, interval whisker, point, the anchor line at 1000.
function eloLadder(a) {
    const L = 170, R = W - 60, rowH = 30, top = 10
    const all = a.order.flatMap(b => [...a.perBot[b].interval, a.perBot[b].rating])
    const lo = Math.floor((Math.min(...all, 1000) - 50) / 100) * 100
    const hi = Math.ceil((Math.max(...all, 1000) + 50) / 100) * 100
    const x = v => L + (v - lo) / (hi - lo) * (R - L)
    const h = top + a.order.length * rowH + 30
    let body = ''
    for (let t = lo; t <= hi; t += 100) body += grid(x(t), top, h - 24) + `<text x="${r1(x(t))}" y="${h - 8}" text-anchor="middle" class="muted">${t}</text>`
    body += `<line x1="${r1(x(1000))}" x2="${r1(x(1000))}" y1="${top}" y2="${h - 24}" stroke="var(--axis)" stroke-width="2"/>`
    a.order.forEach((b, i) => {
        const p = a.perBot[b], y = top + i * rowH + rowH / 2
        const tip = `${b}: Elo ${Math.round(p.rating)} (${Math.round(p.interval[0])}–${Math.round(p.interval[1])}), score ${pct(p.score)}`
        body += `<g><title>${esc(tip)}</title><rect x="0" y="${y - rowH / 2}" width="${W}" height="${rowH}" fill="transparent"/>` +
            `<text x="${L - 10}" y="${y + 4}" text-anchor="end" class="ink">${esc(b)}</text>` +
            `<line x1="${r1(x(p.interval[0]))}" x2="${r1(x(p.interval[1]))}" y1="${y}" y2="${y}" stroke="var(--s1)" stroke-width="2" stroke-linecap="round"/>` +
            `<circle cx="${r1(x(p.rating))}" cy="${y}" r="5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>` +
            `<text x="${r1(x(p.interval[1])) + 8}" y="${y + 4}">${Math.round(p.rating)}</text></g>`
    })
    return svg(h, body, 'Elo ladder')
}

// Head-to-head matrix: cell = the row bot's score share against the column bot.
function matrix(a) {
    const bots = a.order, n = bots.length
    const L = 170, top = 70, cell = Math.min(80, (W - L) / n)
    const share = new Map()
    for (const p of a.summary.pairings) {
        share.set(`${p.a}|${p.b}`, p)
        share.set(`${p.b}|${p.a}`, { ...p, share: 1 - p.share, wins: p.losses, losses: p.wins })
    }
    let body = ''
    bots.forEach((b, j) => {
        const cx = L + j * cell + cell / 2
        body += `<text transform="translate(${r1(cx)},${top - 8}) rotate(-35)" class="ink">${esc(b)}</text>`
    })
    bots.forEach((rowBot, i) => {
        const y = top + i * cell
        body += `<text x="${L - 10}" y="${r1(y + cell / 2 + 4)}" text-anchor="end" class="ink">${esc(rowBot)}</text>`
        bots.forEach((colBot, j) => {
            const x = L + j * cell
            if (i === j) {
                body += `<rect x="${r1(x + 1)}" y="${r1(y + 1)}" width="${r1(cell - 2)}" height="${r1(cell - 2)}" rx="4" fill="var(--surface)" stroke="var(--grid)"/>`
                return
            }
            const p = share.get(`${rowBot}|${colBot}`)
            if (!p || !p.games) return
            const s = p.share
            const strength = Math.min(1, Math.abs(s - 0.5) * 2)
            const fill = s >= 0.5 ? 'var(--pos)' : 'var(--neg)'
            const tip = `${rowBot} vs ${colBot}: ${pct(s)} (${p.wins} W, ${p.losses} L, ${p.capped} capped of ${p.games})`
            body += `<g><title>${esc(tip)}</title>` +
                `<rect x="${r1(x + 1)}" y="${r1(y + 1)}" width="${r1(cell - 2)}" height="${r1(cell - 2)}" rx="4" fill="var(--mid)"/>` +
                `<rect x="${r1(x + 1)}" y="${r1(y + 1)}" width="${r1(cell - 2)}" height="${r1(cell - 2)}" rx="4" fill="${fill}" fill-opacity="${(0.15 + 0.7 * strength).toFixed(2)}"/>` +
                `<text x="${r1(x + cell / 2)}" y="${r1(y + cell / 2 + 4)}" text-anchor="middle" class="ink">${pct(s)}</text></g>`
        })
    })
    return svg(top + n * cell + 10, body, 'Head-to-head score shares')
}

// Outcome bars: per pairing, first bot's wins | capped | second bot's wins (100 % stacked).
function outcomes(run, a) {
    const L = 230, R = W - 10, rowH = 28, top = 6
    const rows = a.summary.pairings.filter(p => p.games)
    let body = ''
    rows.forEach((p, i) => {
        const y = top + i * rowH
        const games = run.games.filter(g => g.pairing[0] === p.a && g.pairing[1] === p.b)
        const ended = (bot, reason) => games.filter(g => g.winner !== null && (g.winner === 'L' ? g.light : g.dark) === bot && g.reason === reason).length
        const tipFor = bot => `${bot} wins ${games.filter(g => g.winner !== null && (g.winner === 'L' ? g.light : g.dark) === bot).length}: ` +
            `by chips ${ended(bot, 'chips')}, by blocking ${ended(bot, 'blocked')}, opponent illegal ${ended(bot, 'illegal')}`
        const segs = [
            { n: p.wins, c: 'var(--s1)', tip: tipFor(p.a) },
            { n: p.capped, c: 'var(--neutral)', tip: `capped ${p.capped}` },
            { n: p.losses, c: 'var(--s2)', tip: tipFor(p.b) }
        ]
        body += `<text x="${L - 10}" y="${y + rowH / 2 + 3}" text-anchor="end" class="ink">${esc(p.a)} <tspan class="muted">vs</tspan> ${esc(p.b)}</text>`
        let x = L
        for (const s of segs) {
            if (!s.n) continue
            const w = s.n / p.games * (R - L)
            body += `<g><title>${esc(s.tip)}</title><rect x="${r1(x)}" y="${y + 4}" width="${r1(Math.max(w - 2, 1))}" height="${rowH - 10}" rx="3" fill="${s.c}"/>` +
                (w > 26 ? `<text x="${r1(x + w / 2 - 1)}" y="${y + rowH / 2 + 3}" text-anchor="middle" class="ink">${s.n}</text>` : '') + '</g>'
            x += w
        }
    })
    const legend = `<div class="legend"><span style="--c:var(--s1)">first bot wins</span><span style="--c:var(--neutral)">capped (draw)</span><span style="--c:var(--s2)">second bot wins</span></div>`
    return svg(top + rows.length * rowH + 6, body, 'Game outcomes per pairing') + legend
}

// Strength against thinking time: Elo vs median ms per move (log x), points named directly.
function eloVsTime(a) {
    const L = 50, R = W - 120, top = 14, h = 280, bottom = h - 30
    const bots = a.order.filter(b => a.perBot[b].median !== null)
    const { f, ticks } = logScale(bots.map(b => a.perBot[b].median), L, R)
    const elos = bots.map(b => a.perBot[b].rating)
    const lo = Math.floor((Math.min(...elos) - 50) / 100) * 100, hi = Math.ceil((Math.max(...elos) + 50) / 100) * 100
    const y = v => bottom - (v - lo) / (hi - lo) * (bottom - top)
    let body = ''
    for (const t of ticks) body += grid(f(t), top, bottom) + `<text x="${r1(f(t))}" y="${h - 10}" text-anchor="middle" class="muted">${tickLabel(t)}</text>`
    for (let t = lo; t <= hi; t += 100) body += `<line x1="${L}" x2="${R}" y1="${r1(y(t))}" y2="${r1(y(t))}" stroke="var(--grid)"/><text x="${L - 6}" y="${r1(y(t)) + 4}" text-anchor="end" class="muted">${t}</text>`
    for (const b of bots) {
        const p = a.perBot[b]
        body += `<g><title>${esc(`${b}: Elo ${Math.round(p.rating)}, median ${fmtMs(p.median)} ms per move`)}</title>` +
            `<circle cx="${r1(f(p.median))}" cy="${r1(y(p.rating))}" r="5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>` +
            `<text x="${r1(f(p.median)) + 9}" y="${r1(y(p.rating)) + 4}" class="ink">${esc(b)}</text></g>`
    }
    return svg(h, body, 'Elo against median thinking time')
}

// Speed: small multiples per stage, one bar per bot (median), tick for the maximum; shared log x.
function speedBars(run, a) {
    const bots = run.setup.bots
    const all = bots.flatMap(b => CLASSES.flatMap(c => [a.table[b][c].median, a.table[b][c].max])).filter(x => x !== null)
    const L = 170, R = W - 60, rowH = 22
    const { f, ticks } = logScale(all, L, R)
    return CLASSES.map(cls => {
        const top = 4, h = top + bots.length * rowH + 26
        let body = ''
        for (const t of ticks) body += grid(f(t), top, h - 22) + `<text x="${r1(f(t))}" y="${h - 6}" text-anchor="middle" class="muted">${tickLabel(t)}</text>`
        bots.forEach((b, i) => {
            const t = a.table[b][cls], yy = top + i * rowH
            if (t.median === null) return
            const tip = `${b}, ${cls}: median ${fmtMs(t.median)} ms, mean ${fmtMs(t.mean)}, max ${fmtMs(t.max)}` +
                (t.depthMedian !== null ? `, depth ${t.depthMedian} (${t.depthMin}–${t.depthMax})` : '')
            body += `<g><title>${esc(tip)}</title><text x="${L - 10}" y="${yy + 15}" text-anchor="end" class="ink">${esc(b)}</text>` +
                `<rect x="${L}" y="${yy + 5}" width="${r1(Math.max(f(t.median) - L, 2))}" height="12" rx="3" fill="var(--s1)"/>` +
                `<line x1="${r1(f(t.max))}" x2="${r1(f(t.max))}" y1="${yy + 3}" y2="${yy + 19}" stroke="var(--ink2)" stroke-width="2"/>` +
                `<text x="${r1(Math.max(f(t.median), f(t.max))) + 6}" y="${yy + 15}">${fmtMs(t.median)}</text></g>`
        })
        return `<h3>${esc(cls)}</h3>` + svg(h, body, `Time per move, ${cls}`)
    }).join('')
}

// Compare (strength): Elo before → after per bot.
function eloSlope(c) {
    const L = 200, R = W - 200, top = 20, h = 60 + c.elo.length * 26
    const vals = c.elo.flatMap(e => [e.before, e.after])
    const lo = Math.min(...vals) - 30, hi = Math.max(...vals) + 30
    const y = v => h - 24 - (v - lo) / (hi - lo) * (h - 24 - top)
    let body = `<text x="${L}" y="12" text-anchor="middle" class="muted">${esc(c.name)}</text><text x="${R}" y="12" text-anchor="middle" class="muted">this run</text>` +
        `<line x1="${L}" x2="${L}" y1="${top}" y2="${h - 24}" stroke="var(--axis)"/><line x1="${R}" x2="${R}" y1="${top}" y2="${h - 24}" stroke="var(--axis)"/>`
    for (const e of c.elo) {
        const tip = `${e.bot}: ${Math.round(e.before)} → ${Math.round(e.after)} (${e.delta >= 0 ? '+' : ''}${Math.round(e.delta)})`
        body += `<g><title>${esc(tip)}</title><line x1="${L}" x2="${R}" y1="${r1(y(e.before))}" y2="${r1(y(e.after))}" stroke="var(--s1)" stroke-width="2"/>` +
            `<circle cx="${L}" cy="${r1(y(e.before))}" r="4" fill="var(--s1)"/><circle cx="${R}" cy="${r1(y(e.after))}" r="4" fill="var(--s1)"/>` +
            `<text x="${L - 8}" y="${r1(y(e.before)) + 4}" text-anchor="end" class="ink">${esc(e.bot)} ${Math.round(e.before)}</text>` +
            `<text x="${R + 8}" y="${r1(y(e.after)) + 4}" class="ink">${Math.round(e.after)} (${e.delta >= 0 ? '+' : ''}${Math.round(e.delta)})</text></g>`
    }
    return svg(h, body, 'Elo before and after')
}

// Compare (speed): ratio of medians per bot, all positions; log scale around 1×.
function speedRatio(c) {
    const L = 170, R = W - 60, rowH = 24, top = 6
    const rows = c.speed.filter(s => s.stages.all.ratio)
    const m = Math.max(2, ...rows.map(s => Math.max(s.stages.all.ratio, 1 / s.stages.all.ratio)))
    const lim = Math.pow(10, Math.ceil(Math.log10(m) * 2) / 2)
    const x = r => L + (Math.log10(r) + Math.log10(lim)) / (2 * Math.log10(lim)) * (R - L)
    const h = top + rows.length * rowH + 26
    let body = ''
    for (const t of [1 / lim, 1 / Math.sqrt(lim), 1, Math.sqrt(lim), lim]) {
        body += grid(x(t), top, h - 22) + `<text x="${r1(x(t))}" y="${h - 6}" text-anchor="middle" class="muted">${t >= 1 ? `${+t.toFixed(1)}×` : `1/${+(1 / t).toFixed(1)}`}</text>`
    }
    rows.forEach((s, i) => {
        const r = s.stages.all.ratio, yy = top + i * rowH, x1 = x(1), x2 = x(r)
        const tip = `${s.bot}: median ${fmtMs(s.stages.all.before)} → ${fmtMs(s.stages.all.after)} ms (${r.toFixed(2)}× ${r >= 1 ? 'faster' : 'slower'})`
        body += `<g><title>${esc(tip)}</title><text x="${L - 10}" y="${yy + 16}" text-anchor="end" class="ink">${esc(s.bot)}</text>` +
            `<rect x="${r1(Math.min(x1, x2))}" y="${yy + 6}" width="${r1(Math.max(Math.abs(x2 - x1), 2))}" height="12" rx="3" fill="${r >= 1 ? 'var(--pos)' : 'var(--neg)'}"/>` +
            `<text x="${r1(r >= 1 ? x2 + 6 : x2 - 6)}" y="${yy + 16}" text-anchor="${r >= 1 ? 'start' : 'end'}">${r.toFixed(2)}×</text></g>`
    })
    return svg(h, body, 'Speed ratio against the saved run') +
        `<div class="legend"><span style="--c:var(--pos)">faster now</span><span style="--c:var(--neg)">slower now</span></div>`
}

// Minimal Markdown → HTML for the report text (headings, lists, tables, bold).
function mdToHtml(md) {
    const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    const out = []
    const lines = md.split('\n')
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i]
        if (l.startsWith('|')) {
            const rows = []
            while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++])
            i--
            const cells = r => r.slice(1, -1).split('|').map(c => c.trim())
            out.push('<table><thead><tr>' + cells(rows[0]).map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
                rows.slice(2).map(r => '<tr>' + cells(r).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>')
        } else if (l.startsWith('- ')) {
            const items = []
            while (i < lines.length && lines[i].startsWith('- ')) items.push(lines[i++].slice(2))
            i--
            out.push('<ul>' + items.map(t => `<li>${inline(t)}</li>`).join('') + '</ul>')
        } else if (/^#{1,3} /.test(l)) {
            const level = Math.min(l.indexOf(' ') + 1, 4)
            out.push(`<h${level}>${inline(l.slice(l.indexOf(' ') + 1))}</h${level}>`)
        } else if (l.trim()) out.push(`<p>${inline(l)}</p>`)
    }
    return out.join('\n')
}

function section(title, sub, content) {
    return `<h2>${esc(title)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}<figure>${content}</figure>`
}

function html(run, comparison) {
    const a = analyze(run)
    const s = run.setup
    const parts = []
    if (run.mode === 'strength') {
        parts.push(section('Elo ladder', `Bradley–Terry ratings, ${a.anchor} = 1000, 95 % bootstrap intervals.`, eloLadder(a)))
        parts.push(section('Head to head', 'Row bot\'s score share against the column bot (capped games count half).', matrix(a)))
        parts.push(section('Outcomes', 'Per pairing; hover a segment for how the games ended.', outcomes(run, a)))
        parts.push(section('Strength against thinking time', 'Median time per move measured during the tournament (log scale).', eloVsTime(a)))
    } else {
        parts.push(section('Time per move by game stage', `Median bar, maximum tick; log scale. ${s.positionsCount} fixed positions.`, speedBars(run, a)))
    }
    if (comparison) {
        if (comparison.differences.length) parts.push(`<p class="note">Setup differences with "${esc(comparison.name)}" (not compared): ${esc(comparison.differences.join('; '))}</p>`)
        parts.push(comparison.mode === 'strength'
            ? section(`Compared with "${comparison.name}"`, 'Elo of the shared bots, before and after.', eloSlope(comparison))
            : section(`Compared with "${comparison.name}"`, 'Median time per move over all positions, before / after.', speedRatio(comparison)))
    }
    const title = run.mode === 'strength' ? 'Mills bot strength' : 'Mills bot speed'
    const repeat = s.timeLimited && s.timeLimited.length ? ` Time-limited bots (${s.timeLimited.join(', ')}) are not repeatable.` : ''
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title><style>${CSS}</style></head>
<body><main>
<h1>${title}</h1>
<p class="sub">${esc(s.bots.join(' · '))}<br>${esc(s.started.slice(0, 16).replace('T', ' '))} · code ${esc(s.commit)}${s.dirty ? ' (uncommitted)' : ''} · ${esc(s.cpu)}.${esc(repeat)}</p>
${parts.join('\n')}
<details open><summary>Tables</summary><div class="tables">${mdToHtml(markdown(run, comparison))}</div></details>
</main></body></html>
`
}

module.exports = { html }
