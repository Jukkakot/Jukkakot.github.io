import React from "react"
import mineImg from "./resources/img/minesweeper.png"
import battleImg from "./resources/img/Battleship.png"
import connectImg from "./resources/img/newConnect4.png"
import "./resources/css/app.css"
function App() {
  return (
    <div className="App">
      <h1>Welcome!</h1>
      <button 
        className="imgButton" 
        onClick={()=>window.location="/MineSweeper/index.html"}>
        <img src={mineImg}  alt="Minesweeper" title="Minesweeper"/>
      </button>
      <button 
        className="imgButton" 
        onClick={()=>window.location="/Battleship/index.html"}>
        <img src={battleImg}  alt="Battleship" title="Battleship"/>
      </button> 
      <button 
        className="imgButton" 
        onClick={()=>window.location="/Connectfour/index.html"}>
        <img src={connectImg}  alt="Connectfour" title="Connectfour"/>
      </button>     
    </div>
  )
}
export default App;