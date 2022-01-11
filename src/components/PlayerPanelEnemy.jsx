import React, { Component } from "react";


const PlayerPanelEnemy = props => {
    return (
        <div>
            
            <div className="player-panel player-panel__enemy">        
                <div className="player__cards">
                    <div className="hand-cards">
                        <div className="hand"></div>
                        <div style={{ textAlign: 'center' }}> hand</div>
                    </div>
                    <div className="other-cards">
                        <div>
                            <div className="deck"></div>
                            <div className="deck-info">deck</div>
                        </div>
                        <div>
                            <div className="discard"></div>
                            <div className="discard-info">discard</div>
                        </div>
                    </div>       
                </div>
            </div>
            <div>
                <div className="player-name-enemy"></div>
                <div></div>
            </div>
        </div>
    );    
};


export default PlayerPanelEnemy;