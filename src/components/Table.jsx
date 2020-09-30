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
        return(
            <div>
                <div className="game-table">
                    <div id="player" className="player">
                        <div className="user-name"></div>
                        <div className="user-field">
                            <div className="c-wave rear">
                                <div className={"card-wave rear-wave"}/>
                                <Card classes={"card rear__l"} player={true} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card rear__m"} player={true} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card rear__r"} player={true} value={i++} press={()=> this.handleClick(i)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                            <div className="c-wave flank">
                                <div className={"card-wave flank-wave"}/>
                                <Card classes={"card flank__l"} player={true} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card flank__m"} player={true} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card flank__r"} player={true} value={i++} press={()=> this.handleClick(i)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                            <div className="c-wave vanguard">
                                <div className={"card-wave vanguard-wave"}/>
                                <Card classes={"card vanguard__l"} player={true} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card vanguard__m"} player={true} value={i++} press={()=> this.handleClick(i)}/>
                                <Card classes={"card vanguard__r"} player={true} value={i++} press={()=> this.handleClick(i)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                        </div>
                    </div>
                    <div id="enemy-player" className="player">
                        <div className="user-name"></div>
                        <div className="user-field">
                            <div className="c-wave vanguard">              
                                <div className={"card-wave vanguard-wave"}/>
                                <Card classes={"card vanguard__l"} value={j++} press={()=> this.handleClick(j)}/>
                                <Card classes={"card vanguard__m"} value={j++} press={()=> this.handleClick(j)}/>
                                <Card classes={"card vanguard__r"} value={j++} press={()=> this.handleClick(j)}/>
                                {/* <Card classes={"card empty-card"}/> */}
                            </div>
                            <div className="c-wave flank">
                                <div className={"card-wave flank-wave"}/>
                                <Card classes={"card flank__l"} value={j++} press={()=> this.handleClick(j)}/>
                                <Card classes={"card flank__m"} value={j++} press={()=> this.handleClick(j)}/>
                                <Card classes={"card flank__r"} value={j++} press={()=> this.handleClick(j)}/>
                                {/* <Card classes={"card empty-card"}/>   */}
                            </div>
                            <div className="c-wave rear">
                                <div className={"card-wave rear-wave"}/>
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