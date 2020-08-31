import React, { Component } from "react";
// import "./Card.css";

const Card = props => {
    return (
        <div
            className={props.classes}
            onClick={props.press}
        >
            <div className="characteristic">
                <div className="characteristic__attack" data-card-attack="0"></div>
                <div className="characteristic__defence" data-card-defence="0"></div>
            </div>
            {props.value}
        </div>
    );
};

export default Card;