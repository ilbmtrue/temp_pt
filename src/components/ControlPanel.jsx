import React from 'react';
import ReactDOM from "react-dom";

export default class ControlPanel extends React.Component{ 
    gameWaveInfo(){
        return (
            <div className="game-flow-info">
                <span className="game-round">round: 1</span>
                <span className="game-wave">wave: 1</span>
                <span className="game-turn">turn: 0</span>
            </div>
        )
    }
    icoAction(itemclass, action){
        return (
            <div 
                className={itemclass}
                data-title={action}
                data-action={action}>
            </div>
        );
    };
    render(){
        return(
            <div className="control-panel">HOLLA!!!
                {this.gameWaveInfo()}
                {this.icoAction("player-action ico ico__pick-card", "pickCard")}
                {this.icoAction("player-action ico ico__special", "pass")}
            </div>
        );
    }
}




            /* {this.icoAction("player-action ico ico__pick-card", "pick card")}
            {this.icoAction("player-action ico ico__hire-hero", "hire hero")}
            {this.icoAction("player-action ico ico__attack", "attack")}
            {this.icoAction("player-action ico ico__spell", "spell")}
            {this.icoAction("player-action ico ico__special", "special")}
            {this.icoAction("player-action ico ico__order", "order")}
            {this.icoAction("player-action ico ico__remove-body", "remove corpse")}
            {this.icoAction("player-action ico ico__move", "move")}
            {this.icoAction("player-action ico ico__castling", "castling")} */