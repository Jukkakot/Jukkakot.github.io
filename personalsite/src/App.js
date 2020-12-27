import React from "react"
import mineImg from "./resources/img/minesweeper.png"
import battleImg from "./resources/img/Battleship.png"
import connectImg from "./resources/img/newConnect4.png"
import morrisImg from "./resources/img/morris.png"
import "./resources/css/app.css"
function App() {
  return (
    <div className="App">
      <h1>Welcome!</h1>
      <button 
        className="imgButton" 
        onClick={()=>window.location="/MineSweeper"}>
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
        onClick={()=>window.location="/Morris"}>
        <img src={morrisImg}  alt="Morris" title="Morris"/>
      </button>    
    </div>
  )
}
export default App;