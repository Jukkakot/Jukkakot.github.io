// let workerGame
// let nodeCount
// let checkedBoards = new Map()
// let skipCount
// let depthCount
// self.addEventListener("message", function handleMessageFromGame(e) {
//     let data = e.data
//     switch (data.cmd) {
//         case "close":
//             self.close()
//             break;
//         case "findMove":
//             handleGetMove(data)
//             break;
//         case "suggestion":
//             handleGetMove(data)
//             break;
//         case "debug":
//             workerGame = data.game
//             DEBUG = data.DEBUG
//             // workeridNumber = data.idNumber
//             console.log("stages", workerGame.playerDark.name, getStage(workerGame.playerDark), workerGame.playerLight.name, getStage(workerGame.playerLight))
//             console.log("Light Wood", evaluateBoard(workerGame.dots, workerGame.playerLight, workerGame.playerDark))
//             console.log("Dark Wood", evaluateBoard(workerGame.dots, workerGame.playerDark, workerGame.playerLight))
//             self.close()
//     };
// })
// function handleGetMove(data) {
//     workerGame = data.game
//     DEBUG = data.DEBUG
//     // console.log("Starting",data.cmd)
//     let data = {
//         cmd: data.cmd,
//         move: findBestMove()
//     }
//     //Add 1 sec delay if easy mode/eatMode/flying
//     //Because thats when we use depth 2 and it would go too fast otherwise
//     let delay = workerGame.difficulty === 2 ||
//         workerGame.eatMode ||
//         getStage(workerGame.playerLight) === 3 ||
//         getStage(workerGame.playerDark) === 3
//     //Adding 1 second delay to sending the move if easy mode to slow it down a bit
//     setTimeout(() => {
//         self.postMessage(data)
//     }, (delay ? 1000 : 200));

// }

// function findBestMove() {
//     if (workerGame.winner) {
//         console.log(this.winner.name, "won the workerGame")
//         return
//     }
//     console.time("time finding a move")
//     nodeCount = 0
//     checkedBoards.clear()
//     skipCount = 0
//     depthCount = []
//     let player = workerGame.turn
//     let oppPlayer = workerGame.turn.name == workerGame.playerDark.name ? workerGame.playerLight : workerGame.playerDark
//     let board = workerGame.dots

//     // let depth = workerGame.difficulty
//     let depth
//     if (workerGame.difficulty === 2) {
//         depth = 2
//     } else {
//         depth = workerGame.eatMode || getStage(player) === 3 || getStage(oppPlayer) === 3 ? 2 : 4
//     }

//     let result = minimax(board, player, oppPlayer, depth, -Infinity, Infinity, workerGame.eatMode, true)

//     let move = result[0]
//     let score = result[1]
//     let type = result[2]

//     if (!move) {
//         console.log("Couldn't find a move")
//         console.timeEnd("time finding a move")
//         return
//     }

//     //Play the best move
//     if (type == "placing") {
//         console.log(workerGame.turn.name, type, "l", move.l, "d", move.d, "score", score, "depth", depthCount.length - 1)
//     } else if (type == "moving") {
//         let fromDot = move[0]
//         let toDot = move[1]
//         console.log(workerGame.turn.name, type, "from", [fromDot.l, fromDot.d], "to", [toDot.l, toDot.d], "score", score, "depth", depthCount.length - 1)
//     } else if (type == "eating") {
//         console.log(workerGame.turn.name, type, "l", move.l, "d", move.d, "score", score, "depth", depthCount.length - 1)
//     } else {
//         console.log(type, move, "typeless move?")
//     }
//     console.log("node count", nodeCount, "uniq boards",
//         checkedBoards.size, "skipped", skipCount, "skip %:", Math.floor(100 * skipCount / nodeCount))
//     console.timeEnd("time finding a move")
//     return [move, type]
// }

// function evaluateWindow(board, window, player, oppPlayer, scoreObject) {
//     let value = 0
//     let pieceCount = window.filter(chip => chip.player && chip.player.name == player.name).length
//     let emptyCount = window.filter(chip => !chip.player).length
//     let oppCount = window.filter(chip => chip.player && chip.player.name == oppPlayer.name).length

//     //New mill
//     if (pieceCount === 3) {
//         //Getting the non deepCopied player
//         let workerGamePlayer = player.name == workerGame.playerLight.name ? workerGame.playerLight : workerGame.playerDark
//         let clonePlayerMill = player.mills.find(m => m.id == getWindowId(window))
//         let workerGamerMill = workerGamePlayer.mills.find(m => m.id == getWindowId(window))
//         if (!clonePlayerMill) console.log(player.mills)
//         //First checking if this mill is in the workerGame.dots board, if it isnt, then its a new mill
//         //Second check is to check if the mill is in the workerGame.dots board but it has been formed another time
//         //This has to be checked with unique number given to every mill formed in the workerGame
//         //So that two mills that are in same place but formed at different times can be differentiated
//         if ((clonePlayerMill && !isSameWindow(window) || (workerGamerMill && clonePlayerMill.uniqId != workerGamerMill.uniqId))) {
//             // if(workerGamerMill && clonePlayerMill.uniqId != workerGamerMill.uniqId) console.log("toka@@@")
//             // if(clonePlayerMill && !isSameWindow(window)) console.log("eka@@@@")
//             scoreObject.update("newMill")
//             value += 3500
//             //Win
//             // if (getStage(oppPlayer) === 3) {
//             //     console.log(oppPlayer.name, "stage on 3 joten voitto")
//             //     return 100000000
//             // }
//         }
//     }
//     //opp new mill
//     if (oppCount === 3) {
//         //Getting the non deepCopied player
//         let workerGamePlayer = oppPlayer.name == workerGame.playerLight.name ? workerGame.playerLight : workerGame.playerDark
//         let clonePlayerMill = oppPlayer.mills.find(m => m.id == getWindowId(window))
//         let workerGamerMill = workerGamePlayer.mills.find(m => m.id == getWindowId(window))
//         //First checking if this mill is in the workerGame.dots board, if it isnt, then its a new mill
//         //Second check is to check if the mill is in the workerGame.dots board but it has been formed another time
//         //This has to be checked with unique number given to every mill formed in the workerGame
//         //So that two mills that are in same place but formed at different times can be differentiated
//         if ((clonePlayerMill && !isSameWindow(window)) || (workerGamerMill && clonePlayerMill.uniqId != workerGamerMill.uniqId)) {
//             scoreObject.update("oppNewMill")
//             value -= 4000
//             //Win
//             // if (getStage(player) === 3) {
//             //     console.log(player.name, "stage is 3 so lose")
//             //     return -100000000
//             // }
//         }
//     }

//     switch (getStage(player)) {
//         case (1):
//             return stage1Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) + value
//         case (2):
//             return stage2Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) + value
//         case (3):
//             return stage3Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) + value
//         default:
//             console.log("Player has won or lost?", player)
//     }
// }
// function stage1Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) {
//     let value = 0
//     let oppStage = getStage(oppPlayer)
//     let playerDots = window.filter(chip => chip.player && chip.player.name == player.name)
//     let oppDots = window.filter(chip => chip.player && chip.player.name == oppPlayer.name)
//     let emptyDot = window.filter(chip => !chip.player)[0]

//     //blocking opp mill stage 1
//     if (oppStage === 1 && oppCount === 2 && pieceCount === 1) {
//         scoreObject.update("blockOppMill")
//         value += 300
//     }
//     //blocking opp mill stage 2
//     if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
//         playerDots[0].neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
//             !oppDots.some(chip => chip.id == dot.id))) {
//         scoreObject.update("blockOppMillStage2")
//         value += 300
//     }
//     //almost mill
//     if (oppStage == 1 && pieceCount === 2 && emptyCount === 1) {
//         scoreObject.update("almostMill")
//         value += 250
//     }
//     //mill
//     if (pieceCount === 3) {
//         scoreObject.update("mill")
//         value += 100
//     }
//     //making safe open mill with last chip
//     //opponent being stage 2 means that player is placing its last chip
//     if (oppStage === 2 && pieceCount === 2 && emptyCount === 1 && !emptyDot.neighbours.some(chip => chip.player && chip.player.name == oppPlayer.name) &&
//         emptyDot.neighbours.some(chip => chip.player && chip.player.name == player.name &&
//             !playerDots.some(dot => dot.id == chip.id))) {
//         //"safe" Open mill as in opponent player cant block it on next move 
//         scoreObject.update("safeOpenMill")
//         value += 200

//     }

//     //opp mill
//     if (oppCount === 3) {
//         scoreObject.update("oppMill")
//         value -= 100
//     }
//     //opp almost mill stage 1
//     if (oppStage === 1 && oppCount === 2 && emptyCount === 1) {
//         scoreObject.update("oppAlmostMillStage1")
//         value -= 200
//     }
//     //opp blocking mill stage 1
//     if (oppStage === 1 && pieceCount === 2 && oppCount === 1) {
//         scoreObject.update("oppBlockingMillStage1")
//         value -= 200
//     }
//     //opponent safe open mill stage2
//     if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
//         emptyDot.neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
//             !oppDots.some(chip => chip.id == dot.id))) {
//         scoreObject.update("oppSafeOpenMillStage2")
//         value -= 300
//     }


//     return value
// }
// function stage2Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) {
//     let value = 0
//     let emptyDot
//     let playerDots = window.filter(chip => chip.player && chip.player.name == player.name)
//     if (emptyCount === 1) {
//         emptyDot = window.filter(chip => !chip.player)[0]
//     }
//     let oppDots = window.filter(chip => chip.player && chip.player.name == oppPlayer.name)
//     let oppStage = getStage(oppPlayer)
//     //Syhky miilu is finnish and means double mill
//     //which happens when you have 2 mills next to eachother and can get a mill every turn
//     //also only limiting this to 1 because multiple double mills was encouraging not making a mill
//     //which would break one of the double mills also.
//     if (pieceCount === 2 && emptyCount === 1 && !scoreObject["doubleMill"] &&
//         emptyDot.neighbours.some(dot => dot.player && dot.player.name == player.name &&
//             !playerDots.some(pDot => pDot.id == dot.id) &&
//             player.mills.some(mill => mill.dots.some(chip => chip.id == dot.id)))) {
//         scoreObject.update("doubleMill")
//         value += 2000
//     }
//     //Blocking opp double mill
//     if (oppCount === 2 && pieceCount === 1 &&
//         playerDots[0].neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
//             !oppDots.some(pDot => pDot.id == dot.id) &&
//             oppPlayer.mills.some(mill => mill.dots.some(chip => chip.id == dot.id)))) {
//         scoreObject.update("blockingOppDoubleMill")
//         value += 3500
//     }
//     //"safe" Open mill as in opponent player cant block it on next move 
//     if (pieceCount === 2 && emptyCount === 1 && !emptyDot.neighbours.some(chip => chip.player && chip.player.name == oppPlayer.name) &&
//         emptyDot.neighbours.some(chip => chip.player && chip.player.name == player.name &&
//             !playerDots.some(dot => dot.id == chip.id))) {
//         scoreObject.update("safeOpenMill")
//         value += 900
//     }
//     //mill
//     if (pieceCount === 3) {
//         scoreObject.update("mill")
//         value += 700
//     }
//     //Opponent mill is blocked from opening
//     if (oppStage === 2 && oppCount === 3 &&
//         oppDots.every(dot => dot.neighbours.every(chip => chip.player))) {
//         scoreObject.update("blockOppMillStuck")
//         value += 400
//     }
//     //blocking opp mill stage 3
//     if (oppStage === 3 && oppCount === 2 && pieceCount === 1) {
//         scoreObject.update("blockOppMillStage3")
//         value += 400
//     }
//     //blocking opp mill stage 2
//     if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
//         playerDots[0].neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
//             !oppDots.some(chip => chip.id == dot.id))) {
//         scoreObject.update("blockOppMillStage2")
//         value += 400
//     }
//     //opponent safe open mill stage2
//     if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
//         emptyDot.neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
//             !oppDots.some(chip => chip.id == dot.id))) {
//         scoreObject.update("oppSafeOpenMillStage2")
//         value -= 300
//     }
//     //opponent open mill stage 3
//     if (oppStage === 3 && oppCount === 2 && emptyCount === 1) {
//         scoreObject.update("oppOpenMillStage3")
//         value -= 300
//     }
//     //Syhky miilu is finnish and means double mill
//     //which happens when you have 2 mills next to eachother and can get a mill every turn
//     //Opp double mill
//     if (oppCount === 2 && emptyCount === 1 && !scoreObject["oppDoubleMill"] &&
//         emptyDot.neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
//             !oppDots.some(pDot => pDot.id == dot.id) &&
//             oppPlayer.mills.some(mill => mill.dots.some(chip => chip.id == dot.id)))) {
//         scoreObject.update("oppDoubleMill")
//         value -= 2500
//     }
//     return value
// }
// function stage3Score(pieceCount, emptyCount, oppCount, window, player, oppPlayer, board, scoreObject) {
//     let value = 0
//     let emptyDot
//     let oppStage = getStage(oppPlayer)
//     let oppDots = window.filter(chip => chip.player && chip.player.name == oppPlayer.name)
//     if (emptyCount === 1) {
//         emptyDot = window.filter(chip => !chip.player)[0]
//     }
//     let playerDot
//     if (pieceCount === 1) {
//         playerDot = window.filter(chip => chip.player && chip.player.name == player.name)[0]
//     }
//     //blocking opp mill when opp is on stage 2
//     //this is important because player will lose on next move otherwise
//     if (oppStage === 2 && oppCount === 2 && pieceCount === 1 &&
//         playerDot.neighbours.some(chip => chip.player && chip.player.name == oppPlayer.name &&
//             !oppDots.some(dot => dot.id == chip.id))) {
//         scoreObject.update("blockOppMillStage2")
//         value += 3000
//     }
//     //Blocking opp double mill
//     if (oppCount === 2 && pieceCount === 1 &&
//         playerDot.neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
//             !oppDots.some(pDot => pDot.id == dot.id) &&
//             oppPlayer.mills.some(mill => mill.dots.some(chip => chip.id == dot.id)))) {
//         scoreObject.update("blockingOppDoubleMill")
//         value += 10000
//     }
//     //blocking opp mill when opp is on stage 3
//     //this is also important because player will lose on next move otherwise
//     if (oppStage === 3 && oppCount === 2 && pieceCount === 1) {
//         scoreObject.update("blockOppMillStage3")
//         value += 2000
//     }
//     //almost mill
//     if (pieceCount === 2 && emptyCount === 1) {
//         scoreObject.update("almostMill")
//         value += 800
//     }
//     //mill
//     if (pieceCount === 3) {
//         scoreObject.update("mill")
//         value += 500
//     }
//     //opponent safe open mill
//     if (oppStage === 2 && oppCount === 2 && emptyCount === 1 &&
//         emptyDot.neighbours.some(chip => chip.player && chip.player.name == oppPlayer.name &&
//             !oppDots.some(dot => dot.id == chip.id))) {
//         scoreObject.update("oppOpenMillStage2")
//         value -= 2000
//     }
//     //opponent open mill
//     if (oppStage === 3 && oppCount === 2 && emptyCount === 1) {
//         scoreObject.update("oppOpenMillStage3")
//         value -= 2000
//     }
//     return value
// }
// function getStage(player) {
//     if (player.chipsToAdd > 0) {
//         return 1
//     } else if (player.chipCount + player.chipsToAdd === 3) {
//         return 3
//     } else if (player.chipsToAdd === 0) {
//         return 2
//     } else {
//         console.log("returning 0 stage", player)
//         return 0
//     }
// }
// function evaluateBoard(board, player, oppPlayer) {
//     if (DEBUG) console.time("scoreBoard")
//     let boardValue = 0
//     //Object to store info about where the different points for each board is coming from
//     //Helpful for debugging
//     let scoreObject = {
//         update: function (property) {
//             this[property] ? this[property]++ : this[property] = 1
//         }
//     }

//     if (getStage(player) === 1) {
//         //Giving points for each neighbour dot of players dots
//         for (let dot of getPlayerDots(board, player)) {
//             boardValue += dot.neighbours.length
//         }
//         scoreObject.neighbours = boardValue
//     } else if (getStage(player) === 2) {
//         //Adding 25 points for each moveable dot
//         let moveableDots = getMoveableDots(board, player).length
//         boardValue += moveableDots * 25
//         scoreObject.moveablepDots = moveableDots
//     }
//     if (getStage(oppPlayer) === 2) {
//         let oppMoveableDots = getMoveableDots(board, oppPlayer).length
//         let oppUnmoveableDots = oppPlayer.chipCount - oppMoveableDots

//         boardValue += oppUnmoveableDots * 25
//         scoreObject.oppUnmoveableDots = oppUnmoveableDots
//     }
//     // else if (getStage(player) === 3) {
//     //     //Giving 10000 points for each turn during stage 3 to encourage delaying losing a workerGame
//     //     scoreObject.s3Turns = player.stage3Turns
//     //     value += player.stage3Turns * 10000
//     // }
//     // if (getStage(oppPlayer) === 3) {

//     //     scoreObject.oppS3Turns = oppPlayer.stage3Turns
//     //     value -= oppPlayer.stage3Turns * 10000
//     // }

//     for (let layer of board) {
//         for (let d = 0; d < 8; d++) {
//             let window
//             if (d % 2 === 0) {
//                 //d = 0,2,4,6
//                 //Checking window on layers (even indexes)
//                 window = [layer[d], layer[(d + 1) % 8], layer[(d + 2) % 8]]
//             } else if (layer[d].l === 0) {
//                 //This only needs to be checked once and not on every layer (it caused duplicated mills otherwise)
//                 //d = 1,3,5,7
//                 //Checking window between layers (odd indexes)
//                 window = [board[0][d], board[1][d], board[2][d]]
//             } else {
//                 continue
//             }
//             let windowValue = evaluateWindow(board, window, player, oppPlayer, scoreObject)
//             if (windowValue >= 100000000 || windowValue <= -100000000) {
//                 return windowValue
//             } else {
//                 boardValue += windowValue
//             }
//         }
//     }
//     let boardStr = addInfo(stringify(board), player, oppPlayer)
//     if (!scoreObject["mill"] || !scoreObject["oppMill"])
//         checkedBoards.set(boardStr, boardValue)

//     if (DEBUG) {
//         console.timeEnd("scoreBoard")
//         //This is helpful when looking at where the score comes from for a board
//         console.log("scoreObject", scoreObject)
//     }
//     return boardValue
// }
// function getEatableDots(board, player) {
//     let dotsInMill = getPlayerMillDots(board, player)
//     let allDots = getPlayerDots(board, player)

//     //if there is same amount if dots in mills as total player dots, then all of them are eatable
//     if (dotsInMill.length === allDots.length)
//         return allDots

//     let eatableDots = []
//     //Otherwise have to look for the dots that are not in mills
//     eatableDots.push(...allDots.filter(chip => !dotsInMill.includes(chip)))
//     return eatableDots
// }
// function getS1Moves(board, player, oppPlayer) {
//     let allEmptydots = getEmptyDots(board)
//     // putting boards empty dots in better order to check (More likely to find good move early)
//     let emptyDotsInOrder = board[1].filter(dot => !dot.player)

//     let playerDots = getPlayerDots(board, player)
//     playerDots.push(...getPlayerDots(board, oppPlayer))
//     let dupeDots = []
//     playerDots.forEach(dot => dupeDots.push(...dot.neighbours.filter(dn => !dn.player)))
//     dupeDots.forEach(dot => {
//         if (!emptyDotsInOrder.includes(dot)) emptyDotsInOrder.push(dot)
//     })
//     //Finally adding all the rest of the empty dots in board
//     emptyDotsInOrder.push(...allEmptydots.filter(dot => !emptyDotsInOrder.includes(dot)))
//     return emptyDotsInOrder
// }
// function getS2Moves(board, player, oppPlayer) {
//     let moves = []
//     for (let layer of board) {
//         for (let d = 0; d < 8; d++) {
//             let window
//             if (d % 2 === 0) {
//                 //d = 0,2,4,6
//                 //Checking window on layers (even indexes)
//                 window = [layer[d], layer[(d + 1) % 8], layer[(d + 2) % 8]]

//             } else if (layer[d].l === 0) {
//                 //This only needs to be checked once and not on every layer (it caused duplicated mills otherwise)
//                 //d = 1,3,5,7
//                 //Checking window between layers (odd indexes)
//                 window = [board[0][d], board[1][d], board[2][d]]
//             }
//             let pieceCount = window.filter(chip => chip.player && chip.player.name == player.name).length
//             let oppCount = window.filter(chip => chip.player && chip.player.name == oppPlayer.name).length
//             let oppDots = window.filter(chip => chip.player && chip.player.name == oppPlayer.name)
//             let playerPieces = window.filter(chip => chip.player && chip.player.name == player.name)
//             let emptyDots = window.filter(chip => !chip.player)
//             let emptyCount = window.filter(chip => !chip.player).length

//             // Making mill
//             if (pieceCount === 2 && emptyCount === 1) {
//                 let fromDot = emptyDots[0].neighbours.find(dot => dot.player && dot.player.name == player.name)
//                 if (fromDot) {
//                     if (!isArrayInArray(moves, [fromDot, emptyDots[0]]))
//                         moves.push([fromDot, emptyDots[0]])
//                 }
//             }
//             // Opening mill
//             if (pieceCount === 3) {
//                 for (let dot of playerPieces) {
//                     dot.neighbours.forEach(nDot => {
//                         if (!nDot.player && !isArrayInArray(moves, [dot, nDot]))
//                             moves.push([dot, nDot])
//                     })
//                 }
//             }
//             //blocking opp mill stage 2
//             if (getStage(oppPlayer) === 2 && oppCount === 2 && emptyCount === 1 &&
//                 emptyDots[0].neighbours.some(dot => dot.player && dot.player.name == oppPlayer.name &&
//                     !oppDots.some(chip => chip.id == dot.id) &&
//                     emptyDots[0].neighbours.some(dot => dot.player && dot.player.name == player.name))) {
//                 let fromDot = emptyDots[0].neighbours.find(dot => dot.player && dot.player.name == player.name)
//                 if (fromDot) {
//                     if (!isArrayInArray(moves, [fromDot, emptyDots[0]]))
//                         moves.push([fromDot, emptyDots[0]])
//                 }
//             }
//         }
//     }
//     //Adding the rest of the possible moves
//     for (let dot of getMoveableDots(board, player)) {
//         dot.neighbours.filter(nDot => !nDot.player).forEach(emptyDot => {
//             if (!isArrayInArray(moves, [dot, emptyDot]))
//                 moves.push([dot, emptyDot])
//         })
//     }
//     return moves
// }
// function getS3Moves(board, player, oppPlayer) {
//     let moves = []
//     let fromDots = getPlayerDots(board, player)
//     for (let layer of board) {
//         for (let d = 0; d < 8; d++) {
//             let window
//             if (d % 2 === 0) {
//                 //d = 0,2,4,6
//                 //Checking window on layers (even indexes)
//                 window = [layer[d], layer[(d + 1) % 8], layer[(d + 2) % 8]]

//             } else if (layer[d].l === 0) {
//                 //This only needs to be checked once and not on every layer (it caused duplicated mills otherwise)
//                 //d = 1,3,5,7
//                 //Checking window between layers (odd indexes)
//                 window = [board[0][d], board[1][d], board[2][d]]
//             }
//             let pieceCount = window.filter(chip => chip.player && chip.player.name == player.name).length
//             let oppCount = window.filter(chip => chip.player && chip.player.name == oppPlayer.name).length
//             let oppDots = window.filter(chip => chip.player && chip.player.name == oppPlayer.name)
//             let playerPieces = window.filter(chip => chip.player && chip.player.name == player.name)
//             let emptyDots = window.filter(chip => !chip.player)
//             let emptyCount = window.filter(chip => !chip.player).length

//             // Making mill
//             if (pieceCount === 2 && emptyCount === 1) {
//                 let fromDot = fromDots.find(dot => !playerPieces.includes(dot))
//                 if (!isArrayInArray(moves, [fromDot, emptyDots[0]]))
//                     moves.push([fromDot, emptyDots[0]])
//             }
//             // Blocking opp mill
//             if (oppCount === 2 && emptyCount === 1) {
//                 fromDots.forEach(dot => {
//                     if (!isArrayInArray(moves, [dot, emptyDots[0]]))
//                         moves.push([dot, emptyDots[0]])
//                 })
//             }
//         }
//     }
//     let toDots = getEmptyDots(board)
//     for (let fromDot of fromDots) {
//         toDots.forEach(toDot => {
//             if (!isArrayInArray(moves, [fromDot, toDot]))
//                 moves.push([fromDot, toDot])
//         })
//     }
//     return moves
// }

// function minimax(board, player, oppPlayer, depth, alpha, beta, eatMode, isMaximizing) {
//     //Calcing depth count
//     if (!depthCount.includes(depth)) depthCount.push(depth)
//     nodeCount++

//     let boardStr
//     let winLoseValue
//     if (isMaximizing) {
//         boardStr = addInfo(stringify(board), player, oppPlayer)
//         winLoseValue = checkWin(board, player, oppPlayer)
//     } else {
//         boardStr = addInfo(stringify(board), oppPlayer, player)
//         winLoseValue = checkWin(board, oppPlayer, player)
//     }
//     //Returning potential winning or losing value
//     if (winLoseValue)
//         //Depth +1 just to make sure we never divide by zero
//         return [undefined, winLoseValue / (depth + 1)]

//     //End node check
//     if (depth <= 0) {
//         //Checking if current board value has been calced already and if so, we return that value
//         let checkedValue = checkedBoards.get(boardStr)
//         if (checkedValue) {
//             skipCount++
//             return [undefined, checkedValue]
//         }
//         let value = isMaximizing ? evaluateBoard(board, player, oppPlayer) : evaluateBoard(board, oppPlayer, player)
//         return [undefined, value]
//     }

//     //Building up "the tree" further
//     if (isMaximizing) {
//         let bestScore = -Infinity
//         let bestMove
//         let movesObject = getMoves(board, player, oppPlayer, eatMode)
//         let moves = movesObject.moves
//         let type = movesObject.type

//         if (moves.length === 0) {
//             //Player lost because no possible moves to do
//             //this should only be the case on stage 2 when player has no more movable dots
//             if (getStage(player) !== 2)
//                 console.log("Problem", movesObject)

//             return [undefined, -100000000 / (depth + 1)]
//         }
//         for (let move of moves) {
//             //Cloning board and players 
//             let cBoard = deepClone(board)
//             let cPlayer = deepClone(player)
//             let cOppPlayer = deepClone(oppPlayer)
//             let args = {
//                 move: move,
//                 type: type,
//                 board: cBoard,
//                 player: cPlayer,
//                 oppPlayer: cOppPlayer,
//                 depth: depth
//             }

//             let result = playRound(args)

//             eatMode = result.eatMode

//             let winLose = result.return
//             if (winLose)
//                 return winLose

//             let score = minimax(cBoard, cPlayer, cOppPlayer, eatMode ? depth : depth - 1, alpha, beta, eatMode, eatMode)[1]

//             if (score > bestScore || (score === bestScore && Math.random() < 0.5)) {
//                 bestScore = score
//                 bestMove = move
//             }
//             alpha = Math.max(bestScore, alpha)
//             if (alpha >= beta)
//                 break
//         }
//         return [bestMove, bestScore, type]
//     } else {
//         let bestScore = Infinity;
//         let bestMove
//         let movesObject = getMoves(board, oppPlayer, player, eatMode)
//         let moves = movesObject.moves
//         let type = movesObject.type

//         if (moves.length === 0) {
//             //Player lost because no possible moves to do
//             //this should only be the case on stage 2 when player has no more movable dots
//             if (getStage(oppPlayer) !== 2)
//                 console.log("Couldn't find moves, possible problem?", movesObject)

//             return [undefined, -100000000 / (depth + 1)]
//         }
//         for (let move of moves) {
//             //Cloning board and players 
//             let cBoard = deepClone(board)
//             let cPlayer = deepClone(player)
//             let cOppPlayer = deepClone(oppPlayer)
//             let args = {
//                 move: move,
//                 type: type,
//                 board: cBoard,
//                 player: cOppPlayer,
//                 oppPlayer: cPlayer,
//                 depth: depth
//             }

//             let result = playRound(args)

//             eatMode = result.eatMode

//             let winLose = result.return
//             if (winLose)
//                 return winLose

//             let score = minimax(cBoard, cPlayer, cOppPlayer, eatMode ? depth : depth - 1, alpha, beta, eatMode, !eatMode)[1]

//             if (score < bestScore || (score === bestScore && Math.random() < 0.5)) {
//                 bestScore = score
//                 bestMove = move
//             }

//             beta = Math.min(bestScore, beta)
//             if (alpha >= beta)
//                 break
//         }
//         return [bestMove, bestScore, type]
//     }
// }
// function checkWin(board, player, oppPlayer) {
//     let boardStr = addInfo(stringify(board), player, oppPlayer)
//     if (player.chipCount + player.chipsToAdd < 3 || !checkIfCanMove(player, board)) {
//         checkedBoards.set(boardStr, -100000000)
//         console.log(player.name, oppPlayer.name, "losing")
//         return -100000000
//     } else if (oppPlayer.chipCount + oppPlayer.chipsToAdd < 3 || !checkIfCanMove(oppPlayer, board)) {
//         checkedBoards.set(boardStr, 100000000)
//         console.log(player.name, oppPlayer.name, "winning")
//         return 100000000
//     }
// }
// function movePlayerTo(args) {
//     let player = args.player
//     let board = args.board
//     let fromDot = args.move[0]
//     let toDot = args.move[1]

//     board[toDot.l][toDot.d].player = player
//     board[fromDot.l][fromDot.d].player = undefined
// }
// function placeChip(args) {
//     let player = args.player
//     let board = args.board
//     let dot = args.move

//     board[dot.l][dot.d].player = player
//     player.chipsToAdd--
//     player.chipCount++
// }
// function eatChip(args) {
//     let oppPlayer = args.oppPlayer
//     let board = args.board
//     let dot = args.move

//     oppPlayer.chipCount--
//     board[dot.l][dot.d].player = undefined

//     //Checking mills again incase ate from a mill
//     oppPlayer.mills = getUpdatedMills(board, oppPlayer)
// }
// function playRound(args) {
//     let result = {
//         eatMode: false
//     }
//     let move = args.move
//     let type = args.type
//     let oppPlayer = args.oppPlayer
//     let player = args.player
//     let board = args.board
//     let depth = args.depth
//     player.turns++
//     if (getStage(player) === 3) {
//         player.stage3Turns++
//     }
//     switch (args.type) {
//         case "moving":
//             movePlayerTo(args)
//             result.eatMode = hasNewMills(board, player)
//             break;
//         case "placing":
//             placeChip(args)
//             result.eatMode = hasNewMills(board, player)
//             break;
//         case "eating":
//             if (getStage(oppPlayer) === 3) {
//                 result.return = [move, 100000000 / (depth + 1), type]
//                 return result
//             } else {
//                 eatChip(args)
//             }
//             break;
//         default:
//             console.log("Invalid move", args)
//     }

//     if (result.eatMode) {
//         //Making players mills not new since player is going to "use them" next
//         player.mills.forEach(m => m.new = false)

//         //Player wins because opponent is on flying stage
//         // if (getStage(oppPlayer) === 3) {
//         //     console.log("ihme tilanne toka")
//         //     result.return = [move, 100000000, type]
//         // }

//         //TODO: EAT NOW BEFORE SCORING THE BOARD
//     }
//     if (!checkIfCanMove(oppPlayer, board)) {
//         //Player wins because opponent can't move
//         result.return = [move, 100000000 / (depth + 1), type]
//     }

//     return result
// }
// function getMoves(board, player, oppPlayer, eatMode) {
//     let stage = eatMode ? 4 : getStage(player)
//     switch (stage) {
//         case 1:
//             return {
//                 moves: getS1Moves(board, player, oppPlayer),
//                 type: "placing",
//             }
//         case 2:
//             return {
//                 moves: getS2Moves(board, player, oppPlayer),
//                 type: "moving",
//             }
//         case 3:
//             return {
//                 moves: getS3Moves(board, player, oppPlayer),
//                 type: "moving",
//             }
//         case 4:
//             return {
//                 moves: getEatableDots(board, oppPlayer),
//                 type: "eating",
//             }
//         default:
//             console.log("Problem?", stage)
//             break;
//     }
// }
// function isMill(player, d1, d2, d3) {
//     //All dots must have a player
//     if (!d1.player || !d2.player || !d3.player) return undefined

//     //All dots must be unique
//     if (d1 === d2 || d2 === d3 || d1 === d3) return undefined

//     //All dots must have same player
//     //Have to compare player names cause players are deepcloned so player objects might not match
//     if (d1.player.name != player.name || d2.player.name != player.name || d3.player.name != player.name) return undefined

//     //Checking that one of the dots contains 2 of the other dots in its neighbours
//     //Aka, all dots are next to eachother
//     //d2 neighbours should always include d1/d3 cause its the middle dot?
//     if (!d2.neighbours.includes(d1) || !d2.neighbours.includes(d3)) return undefined
//     return new Mill(d1, d2, d3)
// }
// function isNewMill(player, mill) {
//     return !player.mills.some(pMill => pMill.id == mill.id)
// }
// function getWindowId(window) {
//     let d1 = window[0]
//     let d2 = window[1]
//     let d3 = window[2]

//     return d1.l.toString() + d1.d.toString() +
//         d2.l.toString() + d2.d.toString() +
//         d3.l.toString() + d3.d.toString()
// }


// function getPlayerDots(board, player) {
//     let allDots = []
//     for (let layer of board) {
//         for (let dot of layer) {
//             if (dot.player && dot.player.name == player.name) {
//                 allDots.push(dot)
//             }
//         }
//     }
//     return allDots
// }
// function getPlayerMillDots(board, player) {
//     player.mills = getUpdatedMills(board, player)
//     let dots = []
//     player.mills.forEach(mill => dots.push(...mill.dots))

//     //Removing duplicate dots
//     return [... new Set(dots)]
// }
// function hasNewMills(board, player) {
//     player.mills = getUpdatedMills(board, player)
//     return player.mills.some(m => m.new)
// }
// function checkIfCanMove(player, board) {
//     if (getStage(player) !== 2) return true
//     let movableDots = getMoveableDots(board, player)
//     return movableDots.length > 0
// }
// function getMoveableDots(board, player) {
//     let movableDots = []
//     for (let layer of board) {
//         for (let dot of layer) {
//             //Check if player has 3 chips left or dots neighbours has empty dot
//             if (dot.player && dot.player.name == player.name && (player.chipCount + player.chipsToAdd === 3 || dot.neighbours.some(nDot => !nDot.player))) {
//                 movableDots.push(dot)
//             }
//         }
//     }
//     player.movableDots = movableDots
//     return movableDots
// }
// function getUpdatedMills(board, player) {
//     let oldMills = player.mills
//     let allMills = []
//     for (let layer of board) {
//         for (let d = 0; d < 8; d++) {
//             let mill
//             if (d % 2 === 0) {
//                 //d = 0,2,4,6
//                 //Checking mills on layers (even indexes)
//                 mill = isMill(player, layer[d], layer[(d + 1) % 8], layer[(d + 2) % 8])
//             } else if (layer[d].l === 0) {
//                 //This only needs to be checked once and not on every layer (it caused duplicated mills otherwise)
//                 //d = 1,3,5,7
//                 //Checking mills between layers (odd indexes)
//                 mill = isMill(player, board[0][d], board[1][d], board[2][d])
//             }
//             if (mill) {
//                 let oldMill = oldMills.find(m => m.id == mill.id)
//                 if (oldMill && !allMills.some(m => m.id == mill.id)) {
//                     allMills.push(oldMill)
//                 } else if (!allMills.some(m => m.id == mill.id)) {
//                     allMills.push(mill)
//                 }

//             }
//         }
//     }
//     //Now mills that are returned are mostly the same, just new ones are added and non excistant removed
//     //instead of replacing them all which is helpful in future because we can then compare then mills unique id's
//     return allMills
// }
// function getEmptyDots(board) {
//     let dots = []
//     for (let layer of board) {
//         for (let dot of layer) {
//             if (!dot.player) {
//                 dots.push(dot)
//             }
//         }
//     }
//     return dots
// }
// //Checks if given window is the same in this.dots board
// //Used when looking for new mills
// function isSameWindow(window) {
//     return window.every(wDot => workerGame.dots[wDot.l][wDot.d].player && workerGame.dots[wDot.l][wDot.d].player.name === wDot.player.name)
// }
// function deepClone(obj) {
//     let visitedNodes = [];
//     let clonedCopy = [];
//     function clone(item) {
//         if (typeof item === "object" && !Array.isArray(item)) {
//             if (visitedNodes.indexOf(item) === -1) {
//                 visitedNodes.push(item);
//                 let cloneObject = {};
//                 clonedCopy.push(cloneObject);
//                 for (let i in item) {
//                     if (item.hasOwnProperty(i)) {
//                         cloneObject[i] = clone(item[i]);
//                     }
//                 }
//                 return cloneObject;
//             } else {
//                 return clonedCopy[visitedNodes.indexOf(item)];
//             }
//         }
//         else if (typeof item === "object" && Array.isArray(item)) {
//             if (visitedNodes.indexOf(item) === -1) {
//                 let cloneArray = [];
//                 visitedNodes.push(item);
//                 clonedCopy.push(cloneArray);
//                 for (let j = 0; j < item.length; j++) {
//                     cloneArray.push(clone(item[j]));
//                 }
//                 return cloneArray;
//             } else {
//                 return clonedCopy[visitedNodes.indexOf(item)];
//             }
//         }

//         return item; // not object, not array, therefore primitive
//     }
//     return clone(obj);
// }
// function stringify(board) {
//     let str = ""
//     for (let layer of board) {
//         for (let dot of layer) {
//             if (!dot.player) str += '0'
//             else if (dot.player.name == workerGame.playerDark.name) str += 'D'
//             else if (dot.player.name == workerGame.playerLight.name) str += 'L'
//         }
//     }
//     return str
// }
// function addInfo(boardStr, player, oppPlayer) {
//     return getStage(player).toString() + player.char +
//         getStage(oppPlayer).toString() + oppPlayer.char + boardStr
// }
// function isArrayInArray(arr, item) {
//     let item_as_string = JSON.stringify([item[0].id, item[1].id]);

//     let contains = arr.some(function (ele) {
//         return  JSON.stringify([ele[0].id, ele[1].id]) == item_as_string;
//     });
//     return contains;
// }
// // class Mill {
// //     constructor(d1, d2, d3) {
// //         this.dots = [d1, d2, d3]
// //         this.fastDots = [toFastDot(d1), toFastDot(d2), toFastDot(d3)]
// //         this.fastId = this.fastDots.reduce((a, b) => a.toString() + b.toString())
// //         this.player = d1.player
// //         this.id = d1.l.toString() + d1.d.toString() +
// //             d2.l.toString() + d2.d.toString() +
// //             d3.l.toString() + d3.d.toString()
// //         this.uniqNum = this.player.turns

// //         this.uniqId = this.id + this.uniqNum.toString()
// //         this.fastUniqId = this.fastId + this.uniqNum.toString()
// //         this.new = true
// //     }
// //     toFastMill() {
// //         return {
// //             fastDots: this.fastDots,
// //             fastId: this.fastId,
// //             uniqNum: this.uniqNum,
// //             new: this.new,
// //         }
// //     }
// //     draw() {
// //         push()
// //         this.new ? stroke(color(255, 0, 0)) : stroke(this.player.color)
// //         strokeWeight(circleSize / 3)
// //         let d1 = this.dots[0]
// //         let d2 = this.dots[2]
// //         line(d1.x * d1.size(), d1.y * d1.size(), d2.x * d2.size(), d2.y * d2.size())

// //         pop()
// //     }
// //     contain(dot) {
// //         return this.dots.includes(dot)
// //     }
// // }