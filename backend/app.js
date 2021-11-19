import express from "express"
import cors from "cors"
import path from 'path'
import { LowSync, JSONFileSync } from 'lowdb'
const AVGTHRESHOLD = 0
const app = express()

app.use(express.json({ limit: '50mb' }));
app.use(cors())
app.listen(3001)

const db = new LowSync(new JSONFileSync("JSON/db_multilookup.json"))

db.read()


app.get('/', function (req, res) {
  res.sendFile(path.join(path.resolve(), '/index.html'));
});

app.get('/api', function (req, res) {
  res.send(db.data)
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
app.get('/api/avglookuptimes', function (req, res) {
  let data = {
    type: "bar",
    title: "Avg move lookup time",
    xTitle: "Algorithm",
    yTitle: "Lookup time",
    yInterval: undefined,
    data: []
  }
  if (!db.data.multiLookup) {
    res.send("no multiLookups available")
    return
  }
  for (let lookup of db.data.multiLookup) {
    for (let result of lookup.data.data.results) {
      // console.log(result)
      let moveData = result.moveData
      let lookupData = {
        label: moveData.options.text,
        value: moveData.time,
        rounds: moveData.uniqTurnNumber,
        stage: Math.max(getStage(moveData.player), getStage(moveData.oppPlayer))
      }
      data.data.push(lookupData)
    }
  }
  let result = getAvgBarValueByKeyObj(groupBy(data.data, "label"), "value")

  result.sort((a, b) => a.value - b.value)
  data.data = result
  res.send(data)
})
app.get('/api/avglookuptimesperstage', function (req, res) {
  let data = {
    type: "multibar",
    title: "Avg move lookup time",
    xTitle: "Algorithm",
    yTitle: "Lookup time",
    yInterval: undefined,
    data: []
  }
  if (!db.data.multiLookup) {
    res.send("no multiLookups available")
    return
  }
  for (let lookup of db.data.multiLookup) {
    for (let result of lookup.data.data.results) {
      // console.log(result)
      let moveData = result.moveData
      let lookupData = {
        label: moveData.options.text,
        value: moveData.time,
        turnNumber: moveData.uniqTurnNumber,
        stage: Math.max(getStage(moveData.player), getStage(moveData.oppPlayer))
      }
      data.data.push(lookupData)
    }
  }

  // let result = getAvgBarValueByKey(groupBy(data.data, "label"), "value")
  let result = []
  let groupedLookups = groupBy(data.data, "label")
  for (let groupStage in groupedLookups) {
    let groupData = {}
    let groupByStageAndLabel = groupBy(groupedLookups[groupStage], "stage")
    for (let stageNum in groupByStageAndLabel) {
      groupData[stageNum] = getAvgBarValueByKeyArr(groupByStageAndLabel[stageNum], "value")
    }
    result.push(groupData)
  }
  result.sort((a, b) => a.value - b.value)
  data.data = result
  res.send(data)
})
app.get('/api/avglookuptimeperturnperstage', function (req, res) {
  let data = {
    type: "multiline",
    isLookupData: true,
    title: "Avg lookup time per stage",
    xTitle: "Turns",
    yTitle: "Lookup time",
    data: []
  }
  if (!db.data.multiLookup) {
    res.send("no multiLookups available")
    return
  }
  for (let lookup of db.data.multiLookup) {
    for (let result of lookup.data.data.results) {
      // console.log(result)
      let moveData = result.moveData
      let lookupData = {
        label: moveData.options.text,
        value: moveData.time,
        turnNumber: moveData.uniqTurnNumber,
        stage: Math.max(getStage(moveData.player), getStage(moveData.oppPlayer))
      }
      data.data.push(lookupData)
    }
  }

  let groupedLookups = groupBy(data.data, "label")
  let result = []

  for (let groupKey in groupedLookups) {
    let aiObject = {
      values: {},
      label: groupKey,
    }
    let groupedByStage = groupBy(groupedLookups[groupKey], "stage")
    for (let aiPerStageKey in groupedByStage) {
      aiObject.values[aiPerStageKey] = avgValuesByKey(groupedByStage[aiPerStageKey], "value", "turnNumber")
    }
    result.push(aiObject)
  }
  data.data = result
  res.send(data)
})

function getAvgBarValueByKeyArr(arr, key) {
  let totalValue = 0
  for (let obj of arr) {
    totalValue += obj[key]
  }
  let obj = arr[0]
  let result = {
    label: obj.label,
    value: totalValue / arr.length,
    gameCount: arr.length
  }
  return result
}
function getAvgBarValueByKeyObj(obj, key) {
  let result = []
  for (let groupKey in obj) {
    let group = obj[groupKey]
    let totalValue = 0
    for (let column of group) {
      totalValue += column[key]
    }

    let avgGroupObj = {
      label: groupKey,
      value: totalValue / group.length,
      gameCount: group.length
    }
    result.push(avgGroupObj)
  }
  return result
}
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
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let playersTurnData = {
      darkValues: getChipCounts(darkPlayer),
      lightValues: getChipCounts(lightPlayer),
      label: lightPlayer.options.text + " " + darkPlayer.options.text,
      darkText: darkPlayer.char + " " + darkPlayer.options.text,
      lightText: lightPlayer.char + " " + lightPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValueByKey(groupedGames, "value", "turnNumber")
  }
  res.send(data)
})

app.get('/api/chipcountPerStage', function (req, res) {
  let data = {
    type: "multiline",
    title: "Mill chip count per stage",
    xTitle: "Turns",
    yTitle: "Chip count",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }
  for (let game of db.data.game) {
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let playersTurnData = {
      darkValues: groupBy(getChipCounts(darkPlayer), "stage"),
      lightValues: groupBy(getChipCounts(lightPlayer), "stage"),
      label: lightPlayer.options.text + " " + darkPlayer.options.text,
      darkText: darkPlayer.char + " " + darkPlayer.options.text,
      lightText: lightPlayer.char + " " + lightPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValuePerStageByKey(groupedGames, "value", "turnNumber")
  }
  res.send(data)
})
app.get('/api/turntimesPerStage', function (req, res) {
  let data = {
    type: "multiline",
    title: "Mill turn times nonCumulative per stage",
    xTitle: "Turns",
    yTitle: "Turn time",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }
  for (let game of db.data.game) {
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let playersTurnData = {
      darkValues: groupBy(getMoveTimes(darkPlayer), "stage"),
      lightValues: groupBy(getMoveTimes(lightPlayer), "stage"),
      label: lightPlayer.options.text + " " + darkPlayer.options.text,
      darkText: darkPlayer.char + " " + darkPlayer.options.text,
      lightText: lightPlayer.char + " " + lightPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValuePerStageByKey(groupedGames, "value", "turnNumber")
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
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let playersTurnData = {
      darkValues: getMoveTimes(darkPlayer),
      lightValues: getMoveTimes(lightPlayer),
      label: lightPlayer.options.text + " " + darkPlayer.options.text,
      darkText: darkPlayer.char + " " + darkPlayer.options.text,
      lightText: lightPlayer.char + " " + lightPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValueByKey(groupedGames, "value", "turnNumber")
  }
  res.send(data)
})
app.get('/api/turntimesCumulativePerStage', function (req, res) {
  let data = {
    type: "multiline",
    title: "Mill turn times cumulative per stage",
    xTitle: "Turns",
    yTitle: "Total turn time",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }
  for (let game of db.data.game) {
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let playersTurnData = {
      darkValues: groupBy(getCumulativeTimes(darkPlayer), "stage"),
      lightValues: groupBy(getCumulativeTimes(lightPlayer), "stage"),
      darkText: darkPlayer.char + " " + darkPlayer.options.text,
      lightText: lightPlayer.char + " " + lightPlayer.options.text,
      label: lightPlayer.options.text + " " + darkPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValuePerStageByKey(groupedGames, "value", "turnNumber")
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
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let playersTurnData = {
      darkValues: getCumulativeTimes(darkPlayer),
      lightValues: getCumulativeTimes(lightPlayer),
      darkText: darkPlayer.char + " " + darkPlayer.options.text,
      lightText: lightPlayer.char + " " + lightPlayer.options.text,
      label: lightPlayer.options.text + " " + darkPlayer.options.text,
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
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let playersTurnData = {
      darkValues: getBoardScores(darkPlayer),
      lightValues: getBoardScores(lightPlayer),
      darkText: darkPlayer.char + " " + darkPlayer.options.text,
      lightText: lightPlayer.char + " " + lightPlayer.options.text,
      label: lightPlayer.options.text + " " + darkPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValueByKey(groupedGames, "value", "turnNumber")
  }

  res.send(data)
})
app.get('/api/boardScorePerStage', function (req, res) {
  let data = {
    type: "multiline",
    title: "Mill board scores per stage",
    xTitle: "Turns",
    yTitle: "Score",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }
  for (let game of db.data.game) {
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let playersTurnData = {
      darkValues: groupBy(getBoardScores(darkPlayer), "stage"),
      lightValues: groupBy(getBoardScores(lightPlayer), "stage"),
      darkText: darkPlayer.char + " " + darkPlayer.options.text,
      lightText: lightPlayer.char + " " + lightPlayer.options.text,
      label: lightPlayer.options.text + " " + darkPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValuePerStageByKey(groupedGames, "value", "turnNumber")
  }

  res.send(data)
})
app.get('/api/boardScoreCumulativePerStage', function (req, res) {
  let data = {
    type: "multiline",
    title: "Cumulative Mill board scores per stage",
    xTitle: "Turns",
    yTitle: "Score",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }
  for (let game of db.data.game) {
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let playersTurnData = {
      darkValues: groupBy(getCumulativeBoardScores(darkPlayer), "stage"),
      lightValues: groupBy(getCumulativeBoardScores(lightPlayer), "stage"),
      darkText: darkPlayer.char + " " + darkPlayer.options.text,
      lightText: lightPlayer.char + " " + lightPlayer.options.text,
      label: lightPlayer.options.text + " " + darkPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValuePerStageByKey(groupedGames, "value", "turnNumber")
  }

  res.send(data)
})
app.get('/api/boardScoreCumulative', function (req, res) {
  let data = {
    type: "line",
    title: "Cumulative Mill board scores",
    xTitle: "Turns",
    yTitle: "Score",
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }
  for (let game of db.data.game) {
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let playersTurnData = {
      darkValues: getCumulativeBoardScores(darkPlayer),
      lightValues: getCumulativeBoardScores(lightPlayer),
      darkText: darkPlayer.char + " " + darkPlayer.options.text,
      lightText: lightPlayer.char + " " + lightPlayer.options.text,
      label: lightPlayer.options.text + " " + darkPlayer.options.text,
    }
    data.data.push(playersTurnData)
  }
  if (req.query.avg == "true") {
    let groupedGames = groupBy(data.data, "label")
    data.data = getAvgValueByKey(groupedGames, "value", "turnNumber")
  }

  res.send(data)
})

app.get('/api/winlose', function (req, res) {
  let data = {
    type: "bar",
    title: "Average win/lose ratio",
    xTitle: "Game",
    yTitle: "Wins/loses",
    yInterval: 0.1,
    data: []
  }
  if (!db.data.game) {
    res.send("no games available")
    return
  }

  for (let game of db.data.game) {
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner
    let winner = players.winner
    let columnData = {
      darkPlayer: {
        name: darkPlayer.name,
        char: darkPlayer.char,
        value: darkPlayer.char == winner.char ? 1 : 0,
        text: darkPlayer.options.text
      },
      lightPlayer: {
        name: lightPlayer.name,
        char: lightPlayer.char,
        value: lightPlayer.char == winner.char ? 1 : 0,
        text: lightPlayer.options.text
      },
      label: lightPlayer.options.text + " / " + darkPlayer.options.text,
    }
    data.data.push(columnData)
  }

  let groupedGames = groupBy(data.data, "label")
  let result = []
  for (let key in groupedGames) {
    let group = groupedGames[key]

    let totalDark = 0
    let totalLight = 0
    for (let column of group) {
      totalDark += column.darkPlayer.value
      totalLight += column.lightPlayer.value
    }
    let newGroup = {}
    if (totalDark >= totalLight) {
      newGroup.value = totalDark / group.length
      newGroup.text = group[0].darkPlayer.text
      newGroup.color = "#a05627"
    } else {
      newGroup.value = totalLight / group.length
      newGroup.text = group[0].lightPlayer.text
      newGroup.color = "#d1b496"
    }
    newGroup.gameCount = group.length
    newGroup.label = key
    result.push(newGroup)
  }
  result.sort((a, b) => a.value - b.value)
  data.data = result
  // console.log(data.data)
  res.send(data)
})

app.get('/api/gameLength', function (req, res) {
  let data = {
    type: "bar",
    title: "Average Mill game length",
    xTitle: "Game",
    yTitle: "Turns",
    yInterval: 10,
    data: []
  }

  if (!db.data.game) {
    res.send("no games available")
    return
  }

  for (let game of db.data.game) {
    let players = game.data.players
    let darkPlayer = players.winner.char == "D" ? players.winner : players.oppPlayer
    let lightPlayer = players.winner.char == "D" ? players.oppPlayer : players.winner

    let columnData = {
      value: game.data.game.totalTurns,
      label: lightPlayer.options.text + " / " + darkPlayer.options.text,
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

function getMoveTimes(player) {
  let times = []
  for (let turn of player.turnData) {
    times.push({ value: turn.time, turnNumber: turn.turnNumber, stage: Math.max(getStage(turn.player), getStage(turn.oppPlayer)) })
  }
  return times
}
function getChipCounts(player) {
  let counts = []
  for (let turn of player.turnData) {
    counts.push({ value: turn.player.chipCount, turnNumber: turn.turnNumber, stage: Math.max(getStage(turn.player), getStage(turn.oppPlayer)) })
  }
  return counts
}
function getCumulativeTimes(player) {
  let times = []
  let totalTime = 0
  for (let turn of player.turnData) {
    totalTime += turn.time
    times.push({ value: totalTime, turnNumber: turn.turnNumber, stage: Math.max(getStage(turn.player), getStage(turn.oppPlayer)) })
  }
  // console.log(player,times)
  return times
}
function getBoardScores(player) {
  let scores = []
  for (let turn of player.turnData) {
    scores.push({ value: turn.boardScore, turnNumber: turn.turnNumber, stage: Math.max(getStage(turn.player), getStage(turn.oppPlayer)) })
  }
  return scores
}
function getCumulativeBoardScores(player) {
  let scores = []
  let totalScore = 0
  for (let turn of player.turnData) {
    totalScore += turn.boardScore
    scores.push({ value: totalScore, turnNumber: turn.turnNumber, stage: Math.max(getStage(turn.player), getStage(turn.oppPlayer)) })
  }
  return scores
}
function groupBy(arr, key) {
  return arr.reduce(function (rv, x) {
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

    //Not adding too rare occurrences of turnNUmbers (key)
    if (counts[prop] / arr.length >= AVGTHRESHOLD) {
      result.push(res)
    }

  }
  return result
}
function getAvgValuePerStageByKey(groupedData, val, key) {
  let result = []
  for (let groupKey in groupedData) {

    let group = groupedData[groupKey]
    // consoles.log(group)
    let darkValuesPerStage = { 1: [], 2: [], 3: [] }
    let lightValuesPerStage = { 1: [], 2: [], 3: [] }
    for (let column of group) {

      for (let stage in column.darkValues) {
        darkValuesPerStage[stage] = darkValuesPerStage[stage].concat(column.darkValues[stage])
      }
      for (let stage in column.lightValues) {
        lightValuesPerStage[stage] = lightValuesPerStage[stage].concat(column.lightValues[stage])
      }
    }
    let newGroup = { ...group[0] }
    for (let stage in darkValuesPerStage) {
      newGroup.darkValues[stage] = avgValuesByKey(darkValuesPerStage[stage], val, key)
      newGroup.lightValues[stage] = avgValuesByKey(lightValuesPerStage[stage], val, key)
    }
    result.push(newGroup)
    // console.log(newGroup)
  }
  return result
}

function getAvgValueByKey(groupedData, val, key) {
  let result = []
  for (let groupKey in groupedData) {
    let group = groupedData[groupKey]
    // consoles.log(group)
    let darkValues = []
    let lightValues = []
    for (let column of group) {
      darkValues = darkValues.concat(column.darkValues)
      lightValues = lightValues.concat(column.lightValues)
    }
    let newGroup = { ...group[0] }
    newGroup.darkValues = avgValuesByKey(darkValues, val, key)
    newGroup.lightValues = avgValuesByKey(lightValues, val, key)
    // newGroup.label = groupKey

    result.push(newGroup)
    // console.log(winnerObject)
  }
  return result
}
function getStage(player) {
  if (player.chipsToAdd > 0) {
    return 1
  } else if (player.chipCount + player.chipsToAdd === 3) {
    return 3
  } else if (player.chipsToAdd === 0) {
    return 2
  } else {
    console.error("returning 0 stage", player)
    return 0
  }
}