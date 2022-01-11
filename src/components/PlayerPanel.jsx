import React, { Component } from "react";


const PlayerPanel = props => {
    return (
        <div>
            <div>
                <div className="player-name"></div>
                <div id="infoBoard"></div> 
            </div>
            
            <div className="player-panel player-panel__self">        
                <div className="player__cards">
                    <div className="hand-cards">
                        <div style={{ textAlign: 'center' }}> hand</div>
                        <div className="hand"></div>
                    </div>
                    <div className="other-cards">
                        <div>
                            <div className="deck-info">deck</div>
                            <div className="deck player-action action-pick-card" data-title="pickCard"></div>  
                        </div>
                        <div>
                            <div className="discard-info">discard</div>
                            <div className="discard"></div>
                        </div>              
                    </div>
                    <div className="player-actions">
                        <div className="player-action action-pass ico-pass ico__pass" data-title="pass"></div>
                    </div>
                </div>
                
            </div>
        </div>
    );    
};


export default PlayerPanel;