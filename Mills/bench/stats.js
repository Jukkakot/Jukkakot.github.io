'use strict'
// Tournament schedule, standings and ratings, following the game kit's conventions.

const { createRng } = require('./rng')

// Every two bots (in the order named) play `games` games; game k of a pairing uses seed
// firstSeed + floor(k / 2) and odd k swaps sides, so each seed is played from both sides.
function schedule(bots, games, firstSeed) {
    if (bots.length < 2) throw new RangeError('A tournament needs at least two bots')
    if (new Set(bots).size !== bots.length) throw new RangeError(`A bot is named twice: ${bots.join(', ')}`)
    if (!Number.isInteger(games) || games < 2 || games % 2 !== 0) {
        throw new RangeError(`Games per pairing must be an even number of at least 2, got ${games}`)
    }
    const list = []
    for (let i = 0; i < bots.length; i++) {
        for (let j = i + 1; j < bots.length; j++) {
            for (let k = 0; k < games; k++) {
                const swapped = k % 2 === 1
                list.push({
                    index: list.length,
                    pairing: [bots[i], bots[j]],
                    seed: firstSeed + Math.floor(k / 2),
                    swapped,
                    // Light moves first.
                    light: swapped ? bots[j] : bots[i],
                    dark: swapped ? bots[i] : bots[j]
                })
            }
        }
    }
    return list
}

// Points of `bot` in a played game: 1 win, 0.5 capped, 0 loss.
function pointsOf(game, bot) {
    if (game.winner === null) return 0.5
    const winnerBot = game.winner === 'L' ? game.light : game.dark
    return winnerBot === bot ? 1 : 0
}

// 95 % Wilson score interval for a share p over n comparisons.
function wilson(p, n, z = 1.96) {
    if (n === 0) return [0, 1]
    const d = 1 + z * z / n
    const centre = (p + z * z / (2 * n)) / d
    const half = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d
    return [Math.max(0, centre - half), Math.min(1, centre + half)]
}

function summarize(bots, games) {
    const pairings = []
    for (let i = 0; i < bots.length; i++) {
        for (let j = i + 1; j < bots.length; j++) {
            const a = bots[i], b = bots[j]
            const gs = games.filter(g => g.pairing[0] === a && g.pairing[1] === b)
            const p = { a, b, games: gs.length, points: 0, wins: 0, losses: 0, capped: 0, plies: 0, endings: { chips: 0, blocked: 0, illegal: 0 } }
            for (const g of gs) {
                const pts = pointsOf(g, a)
                p.points += pts
                if (g.winner === null) p.capped++
                else if (pts === 1) p.wins++
                else p.losses++
                if (g.winner !== null) p.endings[g.reason]++
                p.plies += g.plies
            }
            p.share = gs.length ? p.points / gs.length : 0
            p.interval = wilson(p.share, gs.length)
            p.avgPlies = gs.length ? p.plies / gs.length : 0
            pairings.push(p)
        }
    }
    return { bots, pairings }
}

// Bradley–Terry maximum likelihood ratings (draws half a win each), minorization–maximization,
// one virtual draw per played pairing so a clean sweep stays finite. Anchor rated 1000.
function rate(summary, anchor) {
    const bots = summary.bots
    if (!anchor) anchor = bots.includes('random') ? 'random' : bots[0]
    const index = new Map(bots.map((b, i) => [b, i]))
    const n = bots.length
    const wins = new Array(n).fill(0)
    const games = bots.map(() => new Array(n).fill(0))
    for (const p of summary.pairings) {
        if (p.games === 0) continue
        const i = index.get(p.a), j = index.get(p.b)
        wins[i] += p.points + 0.5
        wins[j] += p.games - p.points + 0.5
        games[i][j] += p.games + 1
        games[j][i] += p.games + 1
    }
    let gamma = new Array(n).fill(1)
    for (let it = 0; it < 10000; it++) {
        const next = gamma.map((g, i) => {
            let den = 0
            for (let j = 0; j < n; j++) if (games[i][j] > 0) den += games[i][j] / (g + gamma[j])
            return den === 0 ? g : wins[i] / den
        })
        const logMean = next.reduce((s, g) => s + Math.log(g), 0) / n
        const scaled = next.map(g => g / Math.exp(logMean))
        const change = Math.max(...scaled.map((g, i) => Math.abs(g - gamma[i]) / gamma[i]))
        gamma = scaled
        if (change < 1e-12) break
    }
    const a = index.get(anchor)
    const ratings = {}
    bots.forEach((b, i) => { ratings[b] = 1000 + 400 * Math.log10(gamma[i] / gamma[a]) })
    return { anchor, ratings }
}

// Elo difference implied by a score share, for intervals on the ladder.
function eloOfShare(share) {
    const s = Math.min(Math.max(share, 0.001), 0.999)
    return -400 * Math.log10(1 / s - 1)
}

function median(values) {
    if (!values.length) return null
    const s = [...values].sort((x, y) => x - y)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const mean = values => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)

// Per-bot 95 % rating intervals by bootstrap: each pairing's game points are resampled with
// replacement (seeded, so reports are repeatable) and the ratings refitted.
function ratingIntervals(bots, games, anchor, rounds = 200, seed = 1) {
    const rnd = createRng(seed)
    const byPairing = summarize(bots, games).pairings.map(p => ({
        p, points: games.filter(g => g.pairing[0] === p.a && g.pairing[1] === p.b).map(g => pointsOf(g, p.a))
    }))
    const samples = Object.fromEntries(bots.map(b => [b, []]))
    for (let r = 0; r < rounds; r++) {
        const pairings = byPairing.map(({ p, points }) => {
            let pts = 0
            for (let k = 0; k < points.length; k++) pts += points[Math.floor(rnd() * points.length)]
            return { ...p, points: pts }
        })
        const { ratings } = rate({ bots, pairings }, anchor)
        for (const b of bots) samples[b].push(ratings[b])
    }
    const out = {}
    for (const b of bots) {
        const s = samples[b].sort((x, y) => x - y)
        out[b] = [s[Math.floor(0.025 * (s.length - 1))], s[Math.ceil(0.975 * (s.length - 1))]]
    }
    return out
}

module.exports = { schedule, pointsOf, wilson, summarize, rate, ratingIntervals, eloOfShare, median, mean }
