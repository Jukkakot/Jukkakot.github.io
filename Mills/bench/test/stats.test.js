'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const S = require('../stats')

test('schedule: each seed from both sides, every pairing the same seeds', () => {
    const list = S.schedule(['a', 'b', 'c'], 4, 10)
    assert.equal(list.length, 12)
    const ab = list.filter(g => g.pairing.join() === 'a,b')
    assert.deepEqual(ab.map(g => [g.seed, g.light]), [[10, 'a'], [10, 'b'], [11, 'a'], [11, 'b']])
    assert.deepEqual(list.map(g => g.index), [...list.keys()])
    assert.throws(() => S.schedule(['a', 'b'], 3, 1), /even/)
    assert.throws(() => S.schedule(['a', 'a'], 2, 1), /twice/)
})

test('rate: a 75 % share is about +191 Elo, anchor 1000', () => {
    const summary = { bots: ['random', 'x'], pairings: [{ a: 'random', b: 'x', games: 1000, points: 250 }] }
    const { ratings, anchor } = S.rate(summary)
    assert.equal(anchor, 'random')
    assert.equal(ratings.random, 1000)
    assert.ok(Math.abs(ratings.x - 1191) < 3, String(ratings.x))
})

test('wilson interval bounds', () => {
    const [lo, hi] = S.wilson(0.5, 100)
    assert.ok(lo > 0.39 && lo < 0.41 && hi > 0.59 && hi < 0.61)
    assert.equal(S.wilson(1, 10)[1], 1)
    assert.ok(S.wilson(1, 10)[0] > 0.6)
})

test('summary counts wins, losses, capped and endings; bootstrap intervals are ordered', () => {
    const games = [
        { pairing: ['a', 'b'], light: 'a', dark: 'b', winner: 'L', reason: 'chips', plies: 10 },
        { pairing: ['a', 'b'], light: 'b', dark: 'a', winner: 'L', reason: 'blocked', plies: 20 },
        { pairing: ['a', 'b'], light: 'a', dark: 'b', winner: null, reason: 'capped', plies: 30 }
    ]
    const [p] = S.summarize(['a', 'b'], games).pairings
    assert.deepEqual([p.wins, p.losses, p.capped, p.points, p.avgPlies], [1, 1, 1, 1.5, 20])
    assert.deepEqual(p.endings, { chips: 1, blocked: 1, illegal: 0 })
    const iv = S.ratingIntervals(['a', 'b'], games, 'a', 50)
    assert.ok(iv.b[0] <= iv.b[1])
    assert.deepEqual(iv, S.ratingIntervals(['a', 'b'], games, 'a', 50))
})
