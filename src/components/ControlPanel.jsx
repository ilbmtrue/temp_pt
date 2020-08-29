import React from 'react';
import ReactDOM from "react-dom";
// import "./scss/ControlPanel.scss";


// function ControlPanel () {
    // icoAction(itemclass, action){
    //     // return (
    //     <div 
    //         className={itemclass}
    //         data-title={action}>
    //     </div>
    //     // );
    // };
//     return (
//         <div className="control-panel">HOLLA!!!
//             <div className="player-action ico ico__pick-card" data-title="pick card"></div>
//             <div className="player-action ico ico__hire-hero" data-title="hire hero"></div>
//             <div className="player-action ico ico__attack" data-title="attack"></div>
//             <div className="player-action ico ico__spell" data-title="spell"></div>
//             <div className="player-action ico ico__special" data-title="special"></div>
//             <div className="player-action ico ico__order" data-title="order"></div>
//             <div className="player-action ico ico__remove-body" data-title="remove corpse"></div>
//             <div className="player-action ico ico__move" data-title="move"></div>
//             <div className="player-action ico ico__castling" data-title="castling"></div>

//         </div>
//     )
// }
// export default  ControlPanel;
export default class ControlPanel extends React.Component{ 
    icoAction(itemclass, action){
        return (
            <div 
                className={itemclass}
                data-title={action}>
            </div>
        );
    };
    render(){
        return(
            <div className="control-panel">HOLLA!!!
                {this.icoAction("player-action ico ico__pick-card", "pick card")}
                {this.icoAction("player-action ico ico__hire-hero", "hire hero")}
                {this.icoAction("player-action ico ico__attack", "attack")}
                {this.icoAction("player-action ico ico__spell", "spell")}
                {this.icoAction("player-action ico ico__special", "special")}
                {this.icoAction("player-action ico ico__order", "order")}
                {this.icoAction("player-action ico ico__remove-body", "remove corpse")}
                {this.icoAction("player-action ico ico__move", "move")}
                {this.icoAction("player-action ico ico__castling", "castling")}
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