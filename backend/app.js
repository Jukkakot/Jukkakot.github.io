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
app.get('/api/turntimes', function (req, res) {
  let data = {
    title: "Mill turn times nonCumulative",
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
      winnerTimes: getMoveTimes(winner),
      oppPlayerTimes: getMoveTimes(oppPlayer),
      winnerText: winner.char + " " + winner.options.text,
      oppPlayerText: oppPlayer.char + " " + oppPlayer.options.text
    }
    data.data.push(playersTurnData)
  }
  res.send(data)
})
app.get('/api/turntimesCumulative', function (req, res) {
  let data = {
    title: "Mill turn times cumulative",
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
      winnerTimes: getCumulativeTimes(winner),
      oppPlayerTimes: getCumulativeTimes(oppPlayer),
      winnerText: winner.char + " " + winner.options.text,
      oppPlayerText: oppPlayer.char + " " + oppPlayer.options.text
    }
    data.data.push(playersTurnData)
  }
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
    times.push({ time: turn.time, turnNumber: turn.turnNumber })
  }
  return times
}
function getCumulativeTimes(player) {
  let times = []
  let totalTime = 0
  for (let turn of player.turnData) {
    totalTime += turn.time
    times.push({ time: totalTime, turnNumber: turn.turnNumber })

  }
  return times
}