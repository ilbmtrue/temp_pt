import React, { Component } from "react";
import ReactDOM from "react-dom";
import Card from "./Card";

// import "./Table.css";


export default class Table extends Component{
    handleClick() {
        console.log('значение this:', this);
    }
    // press = (i) => {
    //     console.log('card#' + i);
    // };
    render(){
        let i = 1;
        let j = 1;
        return(
            <div>
                <div id="console"></div>
                <div class="js-ready-game btn-ready"><h1>READY</h1></div>
                <div className="game-table">
                    <div id="enemy-player" className="player field-row">
                        <div className="rear">
                            <Card classes={"card card-wave rear-wave"}/>
                            <Card classes={"card rear__left"} value={i++} press={()=> this.handleClick(i)}/>
                            <Card classes={"card rear__middle"} value={i++} press={()=> this.handleClick(i)}/>
                            <Card classes={"card rear__right"} value={i++} press={()=> this.handleClick(i)}/>
                            <Card classes={"card empty-card"}/>
                        </div>
                        <div className="flank">
                            <Card classes={"card card-wave flank-wave"}/>
                            <Card classes={"card flank__left"} value={i++} press={()=> this.handleClick(i)}/>
                            <Card classes={"card flank__middle"} value={i++} press={()=> this.handleClick(i)}/>
                            <Card classes={"card flank__right"} value={i++} press={()=> this.handleClick(i)}/>
                            <Card classes={"card empty-card"}/>
                        </div>
                        <div className="vanguard">
                            <Card classes={"card card-wave vanguard-wave"}/>
                            <Card classes={"card vanguard__left"} value={i++} press={()=> this.handleClick(i)}/>
                            <Card classes={"card vanguard__middle"} value={i++} press={()=> this.handleClick(i)}/>
                            <Card classes={"card vanguard__right"} value={i++} press={()=> this.handleClick(i)}/>
                            <Card classes={"card empty-card"}/>
                        </div>
                    </div>
                    <div id="player" className="player field-row">
                        <div className="vanguard">              
                            <Card classes={"card empty-card"}/>
                            <Card classes={"card vanguard__left"} value={j++} press={()=> this.handleClick(j)}/>
                            <Card classes={"card vanguard__middle"} value={j++} press={()=> this.handleClick(j)}/>
                            <Card classes={"card vanguard__right"} value={j++} press={()=> this.handleClick(j)}/>
                            <Card classes={"card card-wave vanguard-wave"}/>
                        </div>
                        <div className="flank">
                            <Card classes={"card empty-card"}/>  
                            <Card classes={"card flank__left"} value={j++} press={()=> this.handleClick(j)}/>
                            <Card classes={"card flank__middle"} value={j++} press={()=> this.handleClick(j)}/>
                            <Card classes={"card flank__right"} value={j++} press={()=> this.handleClick(j)}/>
                            <Card classes={"card card-wave flank-wave"}/>
                        </div>
                        <div className="rear">
                            <Card classes={"card empty-card"}/>     
                            <Card classes={"card rear__left"} value={j++} press={()=> this.handleClick(j)}/>
                            <Card classes={"card rear__middle"} value={j++} press={()=> this.handleClick(j)}/>
                            <Card classes={"card rear__right"} value={j++} press={()=> this.handleClick(j)}/>
                            <Card classes={"card card-wave rear-wave"}/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}