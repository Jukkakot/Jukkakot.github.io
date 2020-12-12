import React from "react"
import mineImg from "./resources/img/minesweeper.png"
import battleImg from "./resources/img/Battleship.png"
import "./resources/css/app.css"
function App() {
  return (
    <div className="App">
      <h1>Welcome to my website</h1>
      <button 
        className="imgButton" 
        onClick={()=>window.location="/Minesweeper/index.html"}>
        <img src={mineImg}  alt="Minesweeper" title="Minesweeper"/>
      </button>
      <button 
        className="imgButton" 
        onClick={()=>window.location="/Battleship/index.html"}>
        <img src={battleImg}  alt="Battleship" title="Battleship"/>
      </button>    
    </div>
  )
}
export default App;