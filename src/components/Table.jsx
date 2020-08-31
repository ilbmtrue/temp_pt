import React, { Component } from "react";
// import ReactDOM from "react-dom";
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
                <div className="game-table">
                    <div id="player" className="player">
                        <div className="user-name"></div>
                        <div className="user-field">
                            <div className="rear">
                                <Card classes={"card card-wave rear-wave"}/>
                                <Card classes={"card rear__l"} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card rear__m"} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card rear__r"} value={i++} press={()=> this.handleClick(i)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                            <div className="flank">
                                <Card classes={"card card-wave flank-wave"}/>
                                <Card classes={"card flank__l"} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card flank__m"} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card flank__r"} value={i++} press={()=> this.handleClick(i)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                            <div className="vanguard">
                                <Card classes={"card card-wave vanguard-wave"}/>
                                <Card classes={"card vanguard__l"} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card vanguard__m"} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card vanguard__r"} value={i++} press={()=> this.handleClick(i)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                        </div>
                    </div>
                    <div id="enemy-player" className="player">
                        <div className="user-name"></div>
                        <div className="user-field">
                            <div className="vanguard">              
                                <Card classes={"card card-wave vanguard-wave"}/>
                                <Card classes={"card vanguard__l"} value={j++} press={()=> this.handleClick(j)}/>
                                <Card classes={"card vanguard__m"} value={j++} press={()=> this.handleClick(j)}/>
                                <Card classes={"card vanguard__r"} value={j++} press={()=> this.handleClick(j)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                            <div className="flank">
                                <Card classes={"card card-wave flank-wave"}/>
                                <Card classes={"card flank__l"} value={j++} press={()=> this.handleClick(j)}/>
                                <Card classes={"card flank__m"} value={j++} press={()=> this.handleClick(j)}/>
                                <Card classes={"card flank__r"} value={j++} press={()=> this.handleClick(j)}/>
                                {/* <Card classes={"card empty-card"}/>   */}
                            </div>
                            <div className="rear">
                                <Card classes={"card card-wave rear-wave"}/>
                                <Card classes={"card rear__l"} value={j++} press={()=> this.handleClick(j)}/>
                                <Card classes={"card rear__m"} value={j++} press={()=> this.handleClick(j)}/>
                                <Card classes={"card rear__r"} value={j++} press={()=> this.handleClick(j)}/>
                                {/* <Card classes={"card empty-card"}/>      */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}