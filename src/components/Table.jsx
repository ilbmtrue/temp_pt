import React, { Component } from "react";
// import ReactDOM from "react-dom";
import Card from "./Card";

// import "./Table.css";

export default class Table extends Component{
    handleClick() {
       // console.log('значение this:', this);
    }
    // press = (i) => {
    //     console.log('card#' + i);
    // };
    render(){
        let i = 1;
        let j = 1;
        let fieldNum = 9;
        return(
            <div>
                <div className="game-table">
                    <div id="player" className="player">
                        <div className="user-name"></div>
                        <div className="user-field">
                            <div className="c-wave rear">
                                <div className={"card-wave rear-wave"}/>
                                <Card classes={"card rear left"} player={true} field="1" value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card rear middle"} player={true} field="2" value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card rear right"} player={true} field="3" value={i++} press={()=> this.handleClick(i)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                            <div className="c-wave flank">
                                <div className={"card-wave flank-wave"}/>
                                <Card classes={"card flank left"} player={true} field="4" value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card flank middle"} player={true} field="5" value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card flank right"} player={true} field="6" value={i++} press={()=> this.handleClick(i)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                            <div className="c-wave vanguard">
                                <div className={"card-wave vanguard-wave"}/>
                                <Card classes={"card vanguard left"} player={true} field="7" value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card vanguard middle"} player={true} field="8" value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card vanguard right"} player={true} field="9" value={i++} press={()=> this.handleClick(i)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                        </div>
                    </div>
                    <div id="enemy-player" className="player">
                        <div className="user-name"></div>
                        <div className="user-field">
                            <div className="c-wave vanguard">              
                                <div className={"card-wave vanguard-wave"}/>
                                <Card classes={"card vanguard right"} value={j++} field="9" press={()=> this.handleClick(j)}/>
                                <Card classes={"card vanguard middle "} value={j++} field="8" press={()=> this.handleClick(j)}/>
                                <Card classes={"card vanguard left"} value={j++} field="7" press={()=> this.handleClick(j)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                            <div className="c-wave flank">
                                <div className={"card-wave flank-wave"}/>
                                <Card classes={"card flank right"} value={j++} field="6" press={()=> this.handleClick(j)}/>
                                <Card classes={"card flank middle"} value={j++} field="5" press={()=> this.handleClick(j)}/>
                                <Card classes={"card flank left"} value={j++} field="4" press={()=> this.handleClick(j)}/>
                                {/* <Card classes={"card empty-card"}/>   */}
                            </div>
                            <div className="c-wave rear">
                                <div className={"card-wave rear-wave"}/>
                                <Card classes={"card rear right"} value={j++} field="3" press={()=> this.handleClick(j)}/>
                                <Card classes={"card rear middle"} value={j++} field="2" press={()=> this.handleClick(j)}/>
                                <Card classes={"card rear left"} value={j++} field="1" press={()=> this.handleClick(j)}/>
                                {/* <Card classes={"card empty-card"}/>      */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}