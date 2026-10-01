'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const R = require('../referee')
const { classOf, CLASSES, PER_CLASS, EAT_PER_CLASS } = require('../make-positions')
const positions = require('../positions.json')

test('committed speed positions: classes, eat mode, undecided, more than one move', () => {
    assert.equal(positions.length, CLASSES.length * PER_CLASS)
    for (const cls of CLASSES) {
        const of = positions.filter(p => p.cls === cls)
        assert.equal(of.length, PER_CLASS, cls)
        assert.ok(of.filter(p => p.state.eatMode).length >= EAT_PER_CLASS, `${cls} eat mode`)
    }
    for (const { cls, state } of positions) {
        assert.equal(classOf(state), cls)
        assert.equal(state.winner, null)
        assert.ok(R.legalMoves(state).moves.length > 1)
    }
})
