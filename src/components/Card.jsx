import React, { Component } from "react";
// import "./Card.css";

const Card = props => {
    return (
        <div className="card-holder">
            <div className={props.classes} data-field-num={props.field} onClick={props.press}>
                <div className="characteristic">
                    <div className="characteristic__attack" data-card-attack="0"></div>
                    <div className="characteristic__defence" data-card-defence="0"></div>
                </div>
                {(props.player) 
                ? <div className="card-action">
                    <div className="ico__body-remove card__action body-remove"></div>
                    <div className="ico__spell card__action spell"></div>
                    <div className="ico__attack card__action attack"></div>
                    {(props.value !== 5) ? 
                    <div className="ico__move card__action move"></div> : '' } 
                </div>
                : '' }
                <div className="blood-token">
                    <div className="token"></div>      
                </div>
                {/* {props.value} */}
            </div>
        </div>
    );
};

export default Card;