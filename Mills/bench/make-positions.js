#!/usr/bin/env node
'use strict'
// Builds the speed mode's fixed test positions from seeded games:
//   node Mills/bench/make-positions.js [out.json]
// 10 positions per class (placing early, placing late, moving, flying), at least 2 of each in
// eat mode, all undecided and with more than one legal move. The committed positions.json is
// what runs use; this script only documents and rebuilds it.

const fs = require('node:fs')
const path = require('node:path')
const R = require('./referee')
const { playGame } = require('./game')
const { createRng } = require('./rng')

const PER_CLASS = 10
const EAT_PER_CLASS = 2
const CLASSES = ['placing-early', 'placing-late', 'moving', 'flying']
const MATCHES = [['minimax@d1', 'random'], ['random', 'minimax@d1'], ['random', 'random'], ['minimax@d1', 'minimax@d1']]

function classOf(state) {
    const mover = state.players[state.turn]
    const stage = R.stageOf(mover)
    if (stage === 1) {
        const placed = 18 - state.players.L.chipsToAdd - state.players.D.chipsToAdd
        return placed <= 8 ? 'placing-early' : 'placing-late'
    }
    return stage === 2 ? 'moving' : 'flying'
}

function collect(games = 40, cap = 60) {
    const candidates = Object.fromEntries(CLASSES.map(c => [c, { eat: [], plain: [] }]))
    const seen = new Set()
    for (let g = 0; g < games; g++) {
        const [L, D] = MATCHES[g % MATCHES.length]
        playGame({
            bots: { L, D }, seed: 1000 + g, cap,
            onMove(before) {
                if (before.winner || R.legalMoves(before).moves.length < 2) return
                const key = before.board + before.turn + before.eatMode
                if (seen.has(key)) return
                seen.add(key)
                candidates[classOf(before)][before.eatMode ? 'eat' : 'plain'].push(before)
            }
        })
    }
    return candidates
}

function pick(list, n, rnd) {
    const pool = [...list]
    const out = []
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0])
    return out
}

function makePositions() {
    const candidates = collect()
    const rnd = createRng(2026)
    const positions = []
    for (const cls of CLASSES) {
        const { eat, plain } = candidates[cls]
        if (eat.length < EAT_PER_CLASS) throw new Error(`Only ${eat.length} eat-mode ${cls} positions; play more games`)
        const chosen = [...pick(eat, EAT_PER_CLASS, rnd), ...pick(plain, PER_CLASS - EAT_PER_CLASS, rnd)]
        if (chosen.length < PER_CLASS) throw new Error(`Only ${chosen.length} ${cls} positions`)
        for (const state of chosen) positions.push({ cls, state })
    }
    return positions
}

if (require.main === module) {
    const out = process.argv[2] || path.join(__dirname, 'positions.json')
    const positions = makePositions()
    fs.writeFileSync(out, '[\n' + positions.map(p => JSON.stringify(p)).join(',\n') + '\n]\n')
    console.log(`${positions.length} positions → ${out}`)
}

module.exports = { makePositions, classOf, CLASSES, PER_CLASS, EAT_PER_CLASS }
