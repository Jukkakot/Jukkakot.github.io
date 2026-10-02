'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { goldenRecords, GOLDEN_FILE } = require('../golden')

test('fixed-budget searches without the transposition table match the golden fixture exactly', () => {
    const golden = require(GOLDEN_FILE)
    const now = goldenRecords()
    assert.equal(now.length, golden.length)
    for (let i = 0; i < golden.length; i++) assert.deepEqual(now[i], golden[i], `position ${golden[i].position}, ${golden[i].bot}`)
})

test('with the transposition table every search keeps the fixture score', () => {
    const golden = require(GOLDEN_FILE)
    const now = goldenRecords(undefined, undefined, { tt: true })
    assert.equal(now.length, golden.length)
    for (let i = 0; i < golden.length; i++) assert.equal(now[i].score, golden[i].score, `position ${golden[i].position}, ${golden[i].bot}`)
})
