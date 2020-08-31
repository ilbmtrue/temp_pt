import React from "react";
import ReactDOM from "react-dom";

import Table from "./components/Table";
import ControlPanel from "./components/ControlPanel";

import './scss/normalize.scss';
import './scss/game.scss';

import './front_index.js';



ReactDOM.render(<Table />, document.querySelector("#gameTable"));
ReactDOM.render(<ControlPanel />, document.querySelector("#control-panel"));

