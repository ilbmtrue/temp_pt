
/*

ОШИБКА


*/





const Cards = require('./cards_data_2013.js');
Object.freeze( Cards ); 

const cardsImgArray = [];
for (let i = 0; i < Cards.length; i++) {
  cardsImgArray[Cards[i]['num']] = Cards[i]['img'];
}

var crypto = require('crypto');
const express = require("express");
const app = express();
app.use(express.json()); // for parsing application/json
// var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);


var rooms = {};
var lastUserId = 0;
var lastRoomId = 0;
var numGame = 0;

app.use(express.static('dist/'));
app.use('/img', express.static('dist/img'));


// routes
require('./route.js')(app);

var game_token = '';


// shuffle array
function shuffle(array) {
  var m = array.length, t, i;
  while (m) {// While there remain elements to shuffle…
    i = Math.floor(Math.random() * m--);// Pick a remaining element…
    t = array[m];// And swap it with the current element.
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}


function PlayerTable() 
{
  this.hand = '';
  this.drop = '';
  this.field = { c: '', n: '', ne: '', e: '', se: '', s: '', sw: '', w: '', nw: '' };
  this.shuffleStartDeck = function() {
    // return shuffled out cards ID
    return shuffle(Array(Cards.length).fill().map((e, i) => i + 1));
  }
  this.deck = this.shuffleStartDeck(); // what cards will be used
}



function User(name = 'anonymous', socket) 
{
  this.userId = ++lastUserId;
  this.name = name;
  this.socket = socket;
  this.table = new PlayerTable();
}
User.prototype = {
  getId: function () {
    return this.userId;
  },
  getName: function () {
    return this.name;
  },
  getSocket: function () {
    return this.socket;
  }
}

// new Game(room.getUsers(), room.getName(), numGame++);
function Game(players, room, numGame) 
{
  this.numGame = numGame;
  this.room_name = room;
  this.players = [players[0], players[1]];
  this.player_one = [players[0], new PlayerTable()];
  this.player_two = [players[1], new PlayerTable()];
  this.cardFirstPlayer = 0;
  this.cardSecondPlayer = 0;
  this.prepeare = 0;
}
Game.prototype = {
  getGameId: function(){},
  getCardFrom: function(arrayCards, cardId){

  },
  battlePrepare: function(){
    // first cards issued
    let room = this.room_name;
    Array.prototype.forEach.call(this.players, function(player) {
      player.table.hand = player.table.deck.splice(0, 5);
      rooms[room].sendTo(player, 'prepare new battle', { cards: player.table.hand });  
    });

  },
  hireLeader: function(playerId, cardId){
    let playerTable = this.players.find(player => player.socket === playerId).table;
    playerTable.field.c = cardId;
    playerTable.hand.splice(playerTable.hand.indexOf(Number(cardId)), 1);
    this.prepeare++;
    if (this.prepeare == 2) {this.battlebegin();}  
  },
  battlebegin: function(){
    console.log(this.players);
    console.log('battlebegin');
  }
  // battlebegin: function () {
  //   var diceD2 = Math.floor(Math.random() * 2) + 1;
  //   if (diceD2 == 1) {
  //     this.cardFirstPlayer = 1;
  //     this.cardSecondPlayer = 2;
  //   } else {
  //     this.cardFirstPlayer = 2;
  //     this.cardSecondPlayer = 1;
  //   }

  //   console.log('leaders in battle!');
  //   rooms[this.room_name].sendTo(this.player_one, 'leadersingame', { diced2: this.cardFirstPlayer, my: this.player_one_table['c'], enemy: this.player_two_table['c'] });
  //   rooms[this.room_name].sendTo(this.player_two, 'leadersingame', { diced2: this.cardSecondPlayer, my: this.player_two_table['c'], enemy: this.player_one_table['c'] });
  // }

}



function Room(room_name) {
  this.roomName = room_name;
  this.users = [];
  this.sockets = {};
  this.game = {};
}
Room.prototype = {
  getName: function () { return this.roomName; },
  getUsers: function () { return this.users; },
  getUserNames: function () {
    var usersName = '';
    for (var u in this.users) {
      usersName += this.users[u].userName + ' ';
    }
    return usersName.trim();
  },
  numUsers: function () { return this.users.length; },
  isEmpty: function () { return this.users.length === 0; },

  addUser: function (user, socket) {
    this.users.push(user);
    this.sockets[user.getId()] = socket;    
  },
  removeUser: function (id) {
    this.users = this.users.filter(function (user) {
      return user.getId() !== id;
    });
    delete this.sockets[id];
  },
  sendTo: function (user, message, data) {
    var socket = this.sockets[user.getId()];
    socket.emit(message, data);
  },
  sendToId: function (userId, message, data) {
    return this.sendTo(this.getUserById(userId), message, data);
  },
  broadcastFrom: function (fromUser, message, data) {
    this.users.forEach(function (user) {
      if (user.getId() !== fromUser.getId()) {
        this.sendTo(user, message, data);
      } else {//   console.log('asdffdsa ' + user.getId() + ' ' + fromUser.getId());
      }
    }, this);
  }
}


var TESTCOUNT = 0;
function handleSocket(socket) {
  TESTCOUNT++;
  var user = null;
  var room = null;
  var game = null;
  var firstPlayer = null;
  var secondPlayer = null;
  // console.log(socket);
  // socket.on('join', onJoin);
  // socket.on('disconnect', onLeave);
  socket.on('choosen leader', pickLeader);


  socket.on('disconnect', function (data) { 
    TESTCOUNT--;
    console.log('ws disconnect count: ' + TESTCOUNT); 
  });
  socket.on('ready to game', function (data) { // user name, room name
    let userName = data.userName || 'undefined user';
    let roomName = data.room || 'waiting room';

    room = getOrCreateRoom(data.room);

    if(room.getUsers().find(user => user.name === data.userName)){
      console.log('user exist');
    } else {
      room.addUser(user = new User(data.userName, socket.id), socket);
    }

    socket.join(roomName);
    io.to(roomName).emit("someone join", {user: userName});
    io_adm.to("Admin room").emit('someone ready', {room: roomName, user: userName, s: socket.id});
    
    socket.emit('selfJoin', {myname: userName, cards: cardsImgArray});

    var clients = io.nsps["/"].adapter.rooms[roomName];
    console.log('line~252| in room# ' + roomName + ' sits: ' + clients.length);

    if (room.numUsers() == 2) {
      room.game = new Game(room.getUsers(), room.getName(), numGame++);
      game = getOrCreateRoom(data.room);
      game = room.game;
      console.log('|||||||||||||||||||||| players ready ||||||||||||||||||||||||||||||');
      room.game.battlePrepare();
    }
  });

  function onJoin(data) {
    room = getOrCreateRoom(data.roomName);
    // Add a new user
    room.addUser(user = new User(data.userName, socket.id), socket);
    // Send room info to new user
    room.sendTo(user, 'room', { userId: user.getId(), roomName: room.getName(), users: room.getUsers()});
    // Notify others of a new user joined
    // room.broadcastFrom(user, 'user_join', { userId: user.getId(), userName: user.getName(), users: room.getUserNames() });
    // console.log('User %s joined room %s. Users in room: %d [%s]', user.getId(), room.getName(), room.numUsers(), room.getUserNames());
    if (room.numUsers() == 2) {
      console.log('---------------------------');
    }
  }
  function getOrCreateRoom(roomName) {
    let room;
    // if (!name) { name = ++lastRoomId + '_room'; }
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
    room.removeUser(user.getId());
    console.log('User %d left room %s. Users in room: %d',
      user.getId(), room.getName(), room.numUsers());
    if (room.isEmpty()) {
      console.log('Room is empty - dropping room %s', room.getName());
      delete rooms[room.getName()];
    }
    room.broadcastFrom(user, 'user_leave', user.getName());
  }
  function pickLeader(card){ // socket.emit('choosen leader', card);

    room.game.hireLeader(socket.id, card);
  }
  
}


http.listen(3000, function () { console.log('HTTP server started on port 3000'); });

const io_adm = io.of('/admin');

io.of('/admin').on('connect', (socket) => {
  socket.join("Admin room");
});
io_adm.on('connection', (socket) => {
  socket.on('iWantInfo', function () {
    socket.emit('getInfo', { data: 'sending data', rooms: rooms });
  });
});

io.on('connection', handleSocket);

