import React from 'react';
import ReactDOM from "react-dom";

export default class ControlPanel extends React.Component{ 
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
            <div className="control-panel">
                {this.icoAction("player-action ico ico__pick-card", "pickCard")}
                {this.icoAction("player-action ico ico__special", "pass")}
                <div id="infoBoard"></div>
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