import React from 'react';
// import ReactDOM from "react-dom";

export default class JoinForm extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            room: '1339', //default
            name: ''
        };
        this.handleRoomChange = this.handleRoomChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.joinRoom = this.joinRoom.bind(this);
    }
    handleRoomChange(e){
        this.setState({room:e.target.value})
    }
    handleNameChange(e){
        this.setState({name:e.target.value})
    }

    joinRoom(event) {
        console.log('room: ' + this.state.room + ' name: ' + this.state.name);
        event.preventDefault();
        let xhr = new XMLHttpRequest();
        let userName = this.state.name;
        let json = JSON.stringify({ room: this.state.room, name: this.state.name });  
        xhr.open("POST", '/joingame', true)
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.onreadystatechange = function(){
            if(this.readyState == 4 && this.status == 200){
                localStorage.setItem('user', userName);
                window.location = window.location.href + xhr.responseText;
            } else { 
                console.log('status: ' + status + ' - ' + xhr.statusText);
            }
        };
        xhr.send(json);
    }
    render(){
        return(
            <form className="input-form">
                <label>
                    Комната
                    <input type="text" name="room-name" placeholder="Комната" value={this.state.room} onChange={this.handleRoomChange} required />
                </label>
                <label>
                    Имя
                    <input type="text" name="player-name" placeholder="Имя" value={this.state.name}  onChange={this.handleNameChange} required autoFocus />
                </label>
                <div className="button">
                    <div className="button_submit" onClick={this.joinRoom}>GO</div>
                </div>
            </form>
        )
    }   
}