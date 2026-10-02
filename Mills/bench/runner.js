'use strict'
// Runs benchmark tasks (games or speed positions) in worker threads. Results come back in task
// order whatever order they finish in, so the job count never changes the output.

const { Worker, isMainThread, parentPort } = require('node:worker_threads')

function runTask(kind, task) {
    const { playGame, runSpeedTask } = require('./game')
    if (kind === 'game') {
        return { ...task, ...playGame({
            bots: { L: task.light, D: task.dark }, seed: task.seed, cap: task.cap,
            openingPlies: task.openingPlies, evalWeights: task.evalWeights
        }) }
    }
    return runSpeedTask(task)
}

function runTasks(kind, tasks, jobs, onProgress = () => {}) {
    const results = new Array(tasks.length)
    if (jobs <= 1) {
        tasks.forEach((t, i) => { results[i] = runTask(kind, t); onProgress(i + 1, tasks.length) })
        return Promise.resolve(results)
    }
    return new Promise((resolve, reject) => {
        let next = 0, done = 0
        const workers = []
        const feed = w => {
            if (next >= tasks.length) return w.terminate()
            const i = next++
            w.postMessage({ i, kind, task: tasks[i] })
        }
        for (let j = 0; j < Math.min(jobs, tasks.length); j++) {
            const w = new Worker(__filename)
            w.on('message', ({ i, result }) => {
                results[i] = result
                onProgress(++done, tasks.length)
                if (done === tasks.length) {
                    workers.forEach(x => x.terminate())
                    resolve(results)
                } else feed(w)
            })
            w.on('error', reject)
            workers.push(w)
            feed(w)
        }
    })
}

if (!isMainThread) {
    parentPort.on('message', ({ i, kind, task }) => parentPort.postMessage({ i, result: runTask(kind, task) }))
}

module.exports = { runTasks, runTask }
