import React from 'react';



export default class GameLog extends React.Component{
    render(){
        return (
            <div className="game-log-holder" readOnly>
                <div className="game-log-btn">X</div>
                <textarea className="window-game-log"></textarea>
            </div>
        );
    }
}