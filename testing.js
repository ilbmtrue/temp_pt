// node --inspect testing.js
// node --inspect-brk testing.js
const Cards = require('./data.js');

const express = require("express");
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

let actions = []
for(var card in Cards){
    actions.push(Cards[card]['vanguard'], 
                Cards[card]['flank'], 
                Cards[card]['rear'], 
                Cards[card]['special'])
}


function Game(playerOne, playerTwo, gameMode = 'default'){
    this.playerOne = playerOne
    this.playerTwo = playerTwo
    this.gameMode = gameMode
    this.gameState = ["ход игрока#"]
    this.gameWave = [1,2,3]
    this.gameRound = ["even", "odd"]
}
Game.prototype = {
    startGame: function(){
        const arr = Array.from({ length: 9 }, (v, i) =>  Cards[Math.floor(Math.random() * Cards.length)]['name']).reduce(function(result, value, index, array) {
            if (index % 3 === 0)
              result.push(array.slice(index, index + 3));
            return result;
        }, []);
        return this.table = [arr, arr]
    }
}

function Room(room_hash = "room name"){
    this.roomName = room_hash;
    this.users = [];
}

Room.prototype = {
    // addUser: function(user, socket) {
    //     this.users.push(user)
    //     this.sockets[user.getId()] = socket
    //     return this.users.length     
    // },
    // removeUser: function(id) {
    //     this.users = this.users.filter(function(user) {
    //         return user.getId() !== id;
    //     });
    //     delete this.sockets[id];
    // },
    // sendTo: function(user, message, data) {
    //     var socket = this.sockets[user.getId()];
    //     socket.emit(message, data);
    // },
    // sendToId: function(userId, message, data) {
    //     return this.sendTo(this.getUserById(userId), message, data);
    // },
    // broadcastFrom: function(fromUser, message, data) {
    //     this.users.forEach(function(user) {
    //       if (user.getId() !== fromUser.getId()) {
    //         this.sendTo(user, message, data);
    //       } else {//   console.log('asdffdsa ' + user.getId() + ' ' + fromUser.getId());
    //       }
    //     }, this);
    // }
}

var newGame = new Game('user1', 'user2')
newGame.startGame();
newGame['table'][0][1][1] = 'leader1'
newGame['table'][1][1][1] = 'leader2'
console.log(newGame);
console.log(JSON.stringify(newGame));
// console.log(actions[5]);
/*
игрок1 использует карту uniq# (далее что с фронта пришло)
проверка может ли карта это (если нет то сообщение в фронт) если да:
действие влияет на (себя(таргет) или врага(таргет))
игрок1 использует....
игрок1 закончил ждем действия от игрока2
...
игрок2 закончил, следующий раунд
*/