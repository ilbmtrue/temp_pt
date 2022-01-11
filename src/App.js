import React from "react";
import ReactDOM from "react-dom";

import PlayerPanel from "./components/PlayerPanel";
import PlayerPanelEnemy from "./components/PlayerPanelEnemy";
import GameLog from "./components/GameLog";
import Table from "./components/Table";
import ControlPanel from "./components/ControlPanel";

import './scss/normalize.scss';
import './scss/game.scss';

import './front_index.js';





ReactDOM.render(<PlayerPanelEnemy />, document.querySelector("#enemy-player-panel"));
ReactDOM.render(<GameLog />, document.querySelector("#game-log"));
ReactDOM.render(<Table />, document.querySelector("#gameTable"));
// ReactDOM.render(<ControlPanel />, document.querySelector("#control-panel"));
ReactDOM.render(<PlayerPanel />, document.querySelector("#self-player-panel"));
