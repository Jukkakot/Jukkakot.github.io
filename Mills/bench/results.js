'use strict'
// Where runs are kept: every run in results/ (git-ignored, only the newest are kept), and runs
// saved by name in reports/<name>/ (committed).

const fs = require('node:fs')
const path = require('node:path')

const RESULTS_DIR = path.join(__dirname, 'results')
const REPORTS_DIR = path.join(__dirname, 'reports')
const KEEP = 10
const RUN_FILE = /^(strength|speed)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.(json|md|html)$/

function stamp(date = new Date()) {
    return date.toISOString().replace(/[:.]/g, '-')
}

// Writes the run's files and prunes the folder; returns the JSON path.
function writeRun(run, { md, html }, dir = RESULTS_DIR, keep = KEEP) {
    fs.mkdirSync(dir, { recursive: true })
    const stem = `${run.mode}-${stamp(new Date(run.setup.started))}`
    const jsonPath = path.join(dir, `${stem}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(run))
    fs.writeFileSync(path.join(dir, `${stem}.md`), md)
    if (html) fs.writeFileSync(path.join(dir, `${stem}.html`), html)
    prune(dir, keep)
    return jsonPath
}

// Keeps the `keep` newest runs (by the time stamp in the name); other files are left alone.
function prune(dir = RESULTS_DIR, keep = KEEP) {
    const files = fs.readdirSync(dir).map(f => ({ f, m: RUN_FILE.exec(f) })).filter(x => x.m)
    const stems = [...new Set(files.map(x => x.m[2] + ' ' + x.m[1]))].sort().reverse()
    const old = new Set(stems.slice(keep))
    for (const { f, m } of files) if (old.has(m[2] + ' ' + m[1])) fs.unlinkSync(path.join(dir, f))
}

function checkName(name) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name || '')) throw new Error(`Invalid report name "${name}": use lower-case letters, digits and dashes`)
}

// Saves a run under reports/<name>/<mode>.{json,md,html} and rewrites COMMANDS.md.
function saveRun(name, run, { md, html }, { force = false, dir = REPORTS_DIR } = {}) {
    checkName(name)
    const target = path.join(dir, name)
    const jsonPath = path.join(target, `${run.mode}.json`)
    if (fs.existsSync(jsonPath) && !force) {
        throw new Error(`reports/${name} already has a ${run.mode} run; use --force to replace it`)
    }
    fs.mkdirSync(target, { recursive: true })
    fs.writeFileSync(jsonPath, JSON.stringify(run))
    fs.writeFileSync(path.join(target, `${run.mode}.md`), md)
    if (html) fs.writeFileSync(path.join(target, `${run.mode}.html`), html)
    else fs.rmSync(path.join(target, `${run.mode}.html`), { force: true })
    writeCommands(target, name)
    return target
}

function writeCommands(target, name) {
    const lines = [`# Saved run "${name}"`, '']
    for (const mode of ['strength', 'speed']) {
        const p = path.join(target, `${mode}.json`)
        if (!fs.existsSync(p)) continue
        const s = JSON.parse(fs.readFileSync(p, 'utf8')).setup
        lines.push(`## ${mode}`, '', '```', s.command, '```', '',
            `- Code: ${s.commit}${s.dirty ? ' (uncommitted changes)' : ''}`,
            `- Machine: ${s.cpu}, Node ${s.node}`,
            `- Started ${s.started}, took ${(s.seconds / 60).toFixed(1)} min, ${s.jobs} jobs`)
        if (s.notes) lines.push('', s.notes)
        lines.push('')
    }
    fs.writeFileSync(path.join(target, 'COMMANDS.md'), lines.join('\n'))
}

function loadSaved(name, mode, dir = REPORTS_DIR) {
    checkName(name)
    const p = path.join(dir, name, `${mode}.json`)
    if (!fs.existsSync(p)) throw new Error(`No saved ${mode} run "${name}" (${p})`)
    return { ...JSON.parse(fs.readFileSync(p, 'utf8')), name }
}

module.exports = { writeRun, prune, saveRun, loadSaved, RESULTS_DIR, REPORTS_DIR, KEEP }
