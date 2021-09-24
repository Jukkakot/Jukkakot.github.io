import express from "express"
import cors from "cors"
import path from 'path'
import { LowSync, JSONFileSync } from 'lowdb'

const app = express()
app.use(express.json());
app.use(cors())

const db = new LowSync(new JSONFileSync("db.json"))
db.read()
// drawGraph()
app.get('/', function (req, res) {
  res.sendFile(path.join(path.resolve(), '/index.html'));
});

app.get('/api', function (req, res) {
  res.send(db.data)
})
app.get('/api/chipcount', function (req, res) {
  let data = {
    type: "line",
    title: "Mill chip count",
    xTitle: "Turns",
    yTitle: "Chip count",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }
  for (let game of db.data.game) {
    let winner = game.data.players.winner
    let oppPlayer = game.data.players.oppPlayer
    let playersTurnData = {
      winnerValues: getChipCounts(winner),
      oppValues: getChipCounts(oppPlayer),
      label: winner.options.text + " " + oppPlayer.options.text,
      winnerText: winner.char + " " + winner.options.text,
      oppPlayerText: oppPlayer.char + " " + oppPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValueByKey(groupedGames, "value", "turnNumber")
  }
  res.send(data)
})
app.get('/api/turntimes', function (req, res) {
  let data = {
    type: "line",
    title: "Mill turn times nonCumulative",
    xTitle: "Turns",
    yTitle: "Turn time",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }
  for (let game of db.data.game) {
    let winner = game.data.players.winner
    let oppPlayer = game.data.players.oppPlayer
    let playersTurnData = {
      winnerValues: getMoveTimes(winner),
      oppValues: getMoveTimes(oppPlayer),
      label: winner.options.text + " " + oppPlayer.options.text,
      winnerText: winner.char + " " + winner.options.text,
      oppPlayerText: oppPlayer.char + " " + oppPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValueByKey(groupedGames, "value", "turnNumber")
  }
  res.send(data)
})
app.get('/api/turntimesCumulative', function (req, res) {

  let data = {
    type: "line",
    title: "Mill turn times cumulative",
    xTitle: "Turns",
    yTitle: "Total turn time",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }
  for (let game of db.data.game) {
    let winner = game.data.players.winner
    let oppPlayer = game.data.players.oppPlayer
    let playersTurnData = {
      winnerValues: getCumulativeTimes(winner),
      oppValues: getCumulativeTimes(oppPlayer),
      winnerText: winner.char + " " + winner.options.text,
      oppPlayerText: oppPlayer.char + " " + oppPlayer.options.text,
      label: winner.options.text + " " + oppPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValueByKey(groupedGames, "value", "turnNumber")
  }
  res.send(data)
})
app.get('/api/boardScore', function (req, res) {
  let data = {
    type: "line",
    title: "Mill board scores",
    xTitle: "Turns",
    yTitle: "Score",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }
  for (let game of db.data.game) {
    let winner = game.data.players.winner
    let oppPlayer = game.data.players.oppPlayer
    let playersTurnData = {
      winnerValues: getBoardScores(winner),
      oppValues: getBoardScores(oppPlayer),
      winnerText: winner.char + " " + winner.options.text,
      oppPlayerText: oppPlayer.char + " " + oppPlayer.options.text,
      label: winner.options.text + " " + oppPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValueByKey(groupedGames, "value", "turnNumber")
  }

  res.send(data)
})

app.get('/api/gameLength', function (req, res) {
  let data = {
    type: "bar",
    title: "Average Mill game length",
    xTitle: "Game",
    yTitle: "Turns",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }

  for (let game of db.data.game) {
    let columnData = {
      value: game.data.game.totalTurns,
      label: game.data.players.winner.options.text + " / " + game.data.players.oppPlayer.options.text
    }
    data.data.push(columnData)
  }

  let groupedGames = groupBy(data.data, "label")
  let result = []
  for (let key in groupedGames) {
    let group = groupedGames[key]
    let totalValue = 0
    for (let column of group) {
      totalValue += column.value
    }
    let avgValue = totalValue / group.length
    result.push({ value: avgValue, label: key, gameCount: group.length })
  }
  result.sort((a, b) => a.value - b.value)
  data.data = result
  res.send(data)
})
app.post("/api", function (req, res) {
  const body = req.body
  if (!body || !body.type) {
    res.send("Invalid data, specify data type")
    return
  }

  if (!db.data[body.type]) db.data[body.type] = []

  db.data[body.type].push(body.data)
  db.write()
  console.log("New", body.type, "added")
  res.send("New " + body.type + " added")
})
app.listen(3001)

function getMoveTimes(player) {
  let times = []
  for (let turn of player.turnData) {
    times.push({ value: turn.time, turnNumber: turn.turnNumber })
  }
  return times
}
function getChipCounts(player) {
  let counts = []
  for (let turn of player.turnData) {
    counts.push({ value: turn.player.chipCount, turnNumber: turn.turnNumber })
  }
  return counts
}
function getCumulativeTimes(player) {
  let times = []
  let totalTime = 0
  for (let turn of player.turnData) {
    totalTime += turn.time
    times.push({ value: totalTime, turnNumber: turn.turnNumber })

  }
  return times
}
function getBoardScores(player) {
  let scores = []
  for (let turn of player.turnData) {
    scores.push({ value: turn.boardScore, turnNumber: turn.turnNumber })
  }
  return scores
}
function groupBy(xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};
function avgValuesByKey(arr, val, key) {
  let holder = {}
  let counts = {}
  arr.forEach(t => {
    if (holder.hasOwnProperty(t[key])) {
      holder[t[key]] = holder[t[key]] + t[val]
      counts[t[key]]++
    } else {
      counts[t[key]] = 1
      holder[t[key]] = t[val]
    }
  })
  var result = [];

  for (var prop in holder) {
    let res = {}
    res[key] = Number(prop)
    res[val] = holder[prop] / counts[prop]
    result.push(res)
  }
  return result
}
function getAvgValueByKey(groupedData, val, key) {
  let result = []
  for (let groupKey in groupedData) {
    let group = groupedData[groupKey]
    // consoles.log(group)
    let winnerValues = []
    let oppValues = []
    for (let column of group) {
      winnerValues = winnerValues.concat(column.winnerValues)
      oppValues = oppValues.concat(column.oppValues)
    }
    let newGroup = { ...group[0] }
    newGroup.winnerValues = avgValuesByKey(winnerValues, val, key)
    newGroup.oppValues = avgValuesByKey(oppValues, val, key)
    newGroup.label = groupKey

    result.push(newGroup)
    // console.log(winnerObject)
  }
  return result
}
// function getAvgScoreByKey(groupedData, val, key) {
//   let result = []
//   for (let groupKey in groupedData) {
//     let group = groupedData[groupKey]
//     // consoles.log(group)
//     let winnerValues = []
//     let oppValues = []
//     for (let column of group) {
//       winnerValues = winnerValues.concat(column.winnerTimes)
//       oppValues = oppValues.concat(column.oppPlayerTimes)
//     }
//     let newGroup = {...group[0]}
//     newGroup.winnerValues = avgValuesByKey(winnerValues, val, key)
//     newGroup.oppValues = avgValuesByKey(oppValues, val, key)
//     newGroup.label = groupKey

//     result.push(newGroup)
//     // console.log(winnerObject)
//   }
//   return result
// }