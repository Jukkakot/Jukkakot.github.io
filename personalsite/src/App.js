import React from "react"
import mineImg from "./resources/img/minesweeper.png"
import battleImg from "./resources/img/Battleship.png"
import connectImg from "./resources/img/newConnect4.png"
import millsImg from "./resources/img/mills.png"
import "./resources/css/app.css"
function App() {
  return (
    <div className="App">
      <h1>Welcome!</h1>
      <button 
        className="imgButton" 
        onClick={()=>window.location="/Minesweeper"}>
        <img src={mineImg}  alt="Minesweeper" title="Minesweeper"/>
      </button>
      <button 
        className="imgButton" 
        onClick={()=>window.location="/Battleship"}>
        <img src={battleImg}  alt="Battleship" title="Battleship"/>
      </button> 
      <button 
        className="imgButton" 
        onClick={()=>window.location="/Connectfour"}>
        <img src={connectImg}  alt="Connectfour" title="Connectfour"/>
      </button>   
      <button 
        className="imgButton" 
        onClick={()=>window.location="/Mills"}>
        <img src={millsImg}  alt="Mills" title="Mills"/>
      </button>    
    </div>
  )
}
export default App;