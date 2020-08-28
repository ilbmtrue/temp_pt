import React, { Component } from "react";
// import "./Card.css";

const Card = props => {
    return (
        <div
            className={props.classes}
            onClick={props.press}
        >
            {props.value}
        </div>
    );
};

export default Card;