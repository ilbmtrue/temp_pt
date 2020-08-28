import React from "react";
import ReactDOM from "react-dom";

import Table from "./components/Table";
import ControlPanel from "./components/ControlPanel";




ReactDOM.render(<Table />, document.querySelector("#gameTable"));
ReactDOM.render(<ControlPanel />, document.querySelector("#controlPanel"));

