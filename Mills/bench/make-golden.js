#!/usr/bin/env node
'use strict'
// Records test/golden-search.json from the current worker code (see golden.js).
const fs = require('node:fs')
const { goldenRecords, GOLDEN_FILE } = require('./golden')

const records = goldenRecords()
fs.writeFileSync(GOLDEN_FILE, '[\n' + records.map(r => JSON.stringify(r)).join(',\n') + '\n]\n')
console.log(`${records.length} records → ${GOLDEN_FILE}`)
