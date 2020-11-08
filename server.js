// console.log(this)

// const Cards = require('./cards_data_2012.js');

// Cards.splice(9, 15);
// Object.freeze( Cards ); 

// Cards.forEach(c => {
//   c["blood"] = 0;
//   c["isAlive"] = 1;
// });

// const gameLog = [];

// const cardsImgArray = [];
// for (let i = 0; i < Cards.length; i++) {
//   cardsImgArray[Cards[i]['id']] = Cards[i]['img']; 
// }

// for (let i = 0; i < Cards.length; i++) {
//   let a = Cards[i].ability;
//   console.dir(Cards[i].id + ' ' + Cards[i].leader_perk);
  // console.dir(Cards[i].ability.vanguard);
  // console.dir(Cards[i].ability.flank);
  // console.dir(Cards[i].ability.rear);
// }
// process.exit(-1);

var crypto = require('crypto');
const express = require("express");
const { map } = require('./card_revisions/cards_data_2012.js');
const { inflate } = require('zlib');
const app = express();
app.use(express.json()); // for parsing application/json
// var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var rooms = {};
var games = {};
var lastUserId = 0;
var lastRoomId = 0;
var numGame = 0;

app.use(express.static('dist/'));
app.use('/img', express.static('dist/img'));


// routes
require('./route.js')(app);

const Cards = require('./card_revisions/cards_data_2012.js');



var game_token = '';

// let Board = require('./board');
// let Player = require('./player');
let Room = require('./server/room');
let User = require('./server/user');


function getRoomByUserName(userName){
  let user = null;
  for(let room in rooms) {
    user = rooms[room].users.find(user => user.name === userName);
    if(user){
      return rooms[room];
    }
  }
  return room;
}
function getFieldNumByLineSide(line, side){
  let num;
  switch (line){
    case "vanguard": 
      num = (side === "left") ? 7 : (side === "middle") ? 8 : 9;
      break;
    case "flank": 
      num = (side === "left") ? 4 : (side === "middle") ? 5 : 6; 
      break;
    case "rear": 
      num = (side === "left") ? 1 : (side === "middle") ? 2 : 3; 
      break;
    default: break;
  }
  return num;
}
function getLineSideByFieldNum(fieldNum){
  switch (+fieldNum) {
    case 1: line = "rear"; side = "left";break;
    case 2: line = "rear"; side = "middle";break;
    case 3: line = "rear"; side = "right";break;
    case 4: line = "flank"; side = "left";break;
    case 5: line = "flank"; side = "middle";break;
    case 6: line = "flank"; side = "right";break;
    case 7: line = "vanguard"; side = "left";break;
    case 8: line = "vanguard"; side = "middle";break;
    case 9: line = "vanguard"; side = "right";break;
    default:break;
  }
  return [line, side];
}


function handleSocket(socket) {
  var user = null;
  var room = null;
  var game = null;

  socket.on('joined to room', (data) => {
    let userName = data.userName || 'undefined user';
    let roomName = data.room || 'waiting room';
    room = getOrCreateRoom(roomName);
    room.addUser(user = new User(userName, socket.id, socket), socket);
    socket.join(roomName);
  })

  socket.on('ready new game', () => {
    let user = room.getUserBySocket(socket)
    let state
    game = room.getOrCreateGame(user)
    state = room.userReady(user)

    if(state === "new game preparation"){
      
      // let data = { firstPlayer: game.cardFirstPlayer, secondPlayer: game.cardSecondPlayer, gameTable: game.getTable() }
      // debug this
      Array.prototype.forEach.call(game.players, function(player) {    
        let playerSocket = rooms[room.roomName].sockets[player.socketId];
        playerSocket.emit('battle preparation', {cards: player.board.hand })
        
      });

      // io.in(room.roomName).emit('battle begin', data);
    }
    if(state === "one more"){
      console.log(2)
      io.in(room.roomName).emit('flash msg', {msgText: 'one more'});
    }
    if(!state){
      console.log('PROBLEMS');
    }
  })
  socket.on('disconnect', onLeave);
  
  socket.on('chosen leader',  function(card){
    room.getGameBySocketId(socket.id);
    //player - socket id , card - card id
    if(game.hireLeader(player, card)){
      io.in(room).emit('pick leader', {player: playerName});
    } else {
      console.log('PROBLEM! pick leader');
    }
  });
  socket.on('Move Hero', function(data){
    room.heroMove(socket.id, data);
  });
  socket.on('Remove body', function(data){
    room.bodyRemove(socket.id, data);
  });
  socket.on('Draw a Card', () => {
    game.requestCard(socket.id);
  });
  socket.on('Character Attack', function(data){
    room.heroAttack(socket.id, data);
  });
  socket.on('Recruit a Hero', function(data){
    room.hireCard(socket.id, data.cardId, data.field, data.un);
  });
  socket.on('Pass', function(){
    room.pass(socket.id);
  });
  socket.on('requestCardsInfo', function(){
    socket.emit('reciveCardsInfo', {cardsInfo: "Cards"});
  });

  function getOrCreateRoom(roomName) {
    let room;
    if (!rooms[roomName]) {
      room = new Room(roomName);
      rooms[roomName] = room;
    }

    return rooms[roomName];
  }
  function onLeave() {
    if (room === null) {
      return;
    }
    user.inRoom = 0;
    console.log(socket.id + ' - is leave');
    room.removeUser(user.getId());
    let ar = room.users.filter(user => user.inRoom === 1)
    if( ar.length === 0 ){
      console.log('Room is empty - dropping room %s', room.getName());
      delete rooms[room.getName()];
    } else {
      console.log('Users in room: %d', room.numUsers());
    }
    
    room.broadcastFrom(user, 'user_leave', user.getName());
  }

}


http.listen(3000, function () { console.log('HTTP server started on port 3000'); });
io.on('connection', handleSocket);



