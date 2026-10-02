'use strict'
// Plays one benchmark game, or one speed task, in a fresh sandbox.

const R = require('./referee')
const { createSandbox } = require('./sandbox')
const { parseBot } = require('./bots')

const DEFAULT_CAP = 200

// bots: { L: name, D: name }. Returns the game result with per-bot move stats.
// openingPlies: the first plies are played by the random bot (not counted in the stats).
// evalWeights: optional { L, D } weight objects that override the bots' evaluation weights.
function playGame({ bots, seed, cap = DEFAULT_CAP, onMove, openingPlies = 0, evalWeights }) {
    const sandbox = createSandbox(seed)
    const parsed = { L: parseBot(bots.L), D: parseBot(bots.D) }
    const randomOptions = parseBot('random').options
    const options = {}
    for (const c of ['L', 'D']) {
        options[c] = evalWeights && evalWeights[c] ? { ...parsed[c].options, evalWeights: evalWeights[c] } : parsed[c].options
    }
    const stats = {}
    for (const c of ['L', 'D']) stats[c] = { bot: bots[c], moves: 0, times: [], leaves: 0, errors: 0, illegal: null }
    let state = R.newGame()
    let result = null
    while (!result) {
        const c = state.turn
        const opening = state.plies < openingPlies
        const choice = sandbox.chooseMove(state, opening ? randomOptions : options[c])
        const st = stats[c]
        st.errors += choice.newErrors || 0
        if (choice.error || !R.isLegal(state, choice.type, choice.move)) {
            st.illegal = choice.error || `${choice.type} ${JSON.stringify(choice.move)}`
            result = { winner: R.other(c), reason: 'illegal' }
            break
        }
        if (!opening) {
            st.moves++
            st.times.push(Math.round(choice.ms * 100) / 100)
            st.leaves += choice.leaves || 0
        }
        const before = state
        state = R.applyMove(state, choice.type, choice.move)
        if (onMove) onMove(before, choice, state, sandbox)
        if (state.winner) result = { winner: state.winner, reason: state.winReason }
        else if (state.draw) result = { winner: null, reason: state.draw }
        else if (R.isCapped(state, cap)) result = { winner: null, reason: 'capped' }
    }
    return {
        ...result,
        plies: state.plies,
        turns: { L: state.players.L.turns, D: state.players.D.turns },
        chips: { L: state.players.L.chipCount, D: state.players.D.chipCount },
        stats
    }
}

// One bot on one position. Fresh sandbox seeded with the position index.
function runSpeedTask({ bot, position, index }) {
    const sandbox = createSandbox(index + 1)
    const choice = sandbox.chooseMove(position.state, parseBot(bot).options)
    const legal = !choice.error && R.isLegal(position.state, choice.type, choice.move)
    return {
        bot, index, cls: position.cls, eatMode: position.state.eatMode,
        ms: Math.round(choice.ms * 100) / 100,
        leaves: choice.leaves ?? null, depth: choice.depth ?? null,
        legal, error: choice.error || null, errors: sandbox.errors.count
    }
}

module.exports = { playGame, runSpeedTask, DEFAULT_CAP }
