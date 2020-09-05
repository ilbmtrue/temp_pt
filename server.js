const Cards = require('./cards_data_2013.js');
Object.freeze( Cards ); 

const cardsImgArray = [];
for (let i = 0; i < Cards.length; i++) {
  cardsImgArray[Cards[i]['id']] = Cards[i]['img'];
}

var crypto = require('crypto');
const express = require("express");
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
  this.unit = { //alternative option
    vanguard: {l: '', m: '', r: ''},
    flank: {l: '', m: '', r: ''},
    rear: {l: '', m: '', r: ''}
  }
  this.shuffleStartDeck = function() {
    // return shuffled out cards ID
    return shuffle(Array(Cards.length).fill().map((e, i) => i + 1));
  }
  // what cards will be used
  this.deck = this.shuffleStartDeck(); 
}



function User(name = 'anonymous', socket) 
{
  this.userId = ++lastUserId;
  this.name = name;
  this.socket = socket;
  this.table = new PlayerTable();
  this.actionPoint = 0;
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

// function Game(players, room, numGame) 
// {
//   this.numGame = numGame;
//   this.room_name = room;
//   this.players = [players[0], players[1]];
//   this.cardFirstPlayer = 0;
//   this.cardSecondPlayer = 0;
//   this.prepeare = 0;
//   this.wave = 0;
//   this.round = 0;
//   this.playerTurn = "";
// }
// Game.prototype = {

// }



function Room(room_name) {
  this.roomName = room_name;
  this.users = [];
  this.sockets = {};
  // this.game = {};

  this.numGame = numGame;
  // this.room_name = room;
  // this.players = [];
  this.cardFirstPlayer = 0;
  this.cardSecondPlayer = 0;
  this.prepeare = 0;
  this.wave = 0;
  this.round = 0;
  this.playerTurn = "";


}
Room.prototype = {
  getName: function () { return this.roomName; },
  getUsers: function () { return this.users; },
  getUserNames: function () {
    var usersName = '';
    for (var u in this.users) {
      usersName += this.users[u].name + ' ';
    }
    return usersName.trim();
  },
  getUserNamesArray: function () {
    let usersName = [];
    for (let u in this.users) {
      usersName.push(this.users[u].name);
    }
    return usersName;
  },
  numUsers: function () { return this.users.length; },
  isEmpty: function () { return this.users.length === 0; },

  addUser: function (user, socket) {
    this.users.push(user);
    this.sockets[user.getId()] = socket;    
  },
  removeUser: function (id) {
    this.users = this.users.filter( user => user.getId() !== id);
    delete this.sockets[id];
    if(this.users.length == 0){
      delete this;
    }
    // this.room.removeUser(socket.id);
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
  },
  hireLeader: function(playerId, cardId){
    let playerTable = this.users.find(player => player.socket === playerId).table;
    playerTable.field.c = cardId;
    playerTable.unit.flank.m = cardId; //alternative option
    playerTable.hand.splice(playerTable.hand.indexOf(Number(cardId)), 1);
    this.prepeare++;
    if (this.prepeare == 2) {
      // this.users = [users[0], users[1]];
      this.battlebegin();
    } else {
      playerName = this.users.find(player => player.socket === playerId).name;
      io.in(this.roomName).emit('pick leader', { player: playerName});
    }  
  },
  isPlayerTurnOver(user){
    if(user.actionPoint === 0){
      let anotherUser = this.users.filter( p => p.name !== user.name)[0].name;
      if(anotherUser === 0){
        // NEXT WAVE
        user.actionPoint = 2;
        anotherUser.actionPoint = 2;
        io.in(this.roomName).emit('next wave');
        console.log('Next WAVE');
      }
      this.playerTurn = anotherUser;
      io.in(this.roomName).emit('next turn', { player: this.playerTurn});   
    }
    console.log('Next player turn');
  },

  battlebegin: function(){
    [this.cardFirstPlayer, this.cardSecondPlayer] = shuffle(rooms[this.roomName].getUserNamesArray());
    let gameTable = this.getTable();
    this.playerTurn = this.cardFirstPlayer;
    console.log('TURN for ' + this.playerTurn)
    io.in(this.roomName).emit('battle begin', {
      firstPlayer: this.cardFirstPlayer, 
      secondPlayer: this.cardSecondPlayer,
      gameTable: gameTable
    });
    
    console.log('battlebegin');
  },
  // handoverTurn: function(){
  //   this.playerTurn = this.users.filter( p => p.name !== this.users);
  //   io.in(this.roomName).emit('transfer turn', {turnFor: this.playerTurn});
  // },
  isNextWave: function(){
    console.log(this.users[0].actionPoint + ' ' + this.users[1].actionPoint)
    if( (this.users[0].actionPoint == 0) && (this.users[1].actionPoint == 0)){
      this.users[0].actionPoint = 2;
      this.users[1].actionPoint = 2;
      [this.cardFirstPlayer, this.cardSecondPlayer] = [this.cardSecondPlayer, this.cardFirstPlayer];
      if(this.wave < 4){  
        this.wave++;
      } else { 
        this.wave = 0;
        this.round++;
      }
      io.in(this.roomName).emit('next wave');
    }
    
  },
  // getCardFrom: function(arrayCards, cardId){},
  getTable: function(){
    let gameTable = [];
    Array.prototype.forEach.call(this.users, function(player) {
      gameTable.push({name: player.name, table: player.table.unit});
    });
    return gameTable;
  },
  battlePrepare: function(){
    let room = this.roomName;
    //this.users = [users[0], users[1]];
    [this.users[0].actionPoint, this.users[1].actionPoint] = [2,2];

    
    // first cards issued
    Array.prototype.forEach.call(this.users, function(player) {
      player.table.hand = player.table.deck.splice(0, 5);
      rooms[room].sendTo(player, 'prepare new battle', { cards: player.table.hand });  
    });
  },
  
  hireCard: function(playerId, cardId, field){
    let player = this.users.find(player => player.socket === playerId);

    if(player.actionPoint){
      let playerTable = this.users.find(player => player.socket === playerId).table;
      let f = field.split('__');
      if(playerTable.unit[f[0]][f[1]] === ""){
        playerTable.hand.splice(playerTable.hand.indexOf(Number(cardId)), 1);
        playerTable.unit[f[0]][f[1]] = cardId;
        player.actionPoint--;
        io.in(this.roomName).emit('table update', {
          gameTable: this.getTable()
        });
      } else {
        rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'Pick another field!'});
      }
    } else {
      rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'no action point!'});
    }
    this.isPlayerTurnOver(player);
    console.log(player)
  },
  // get card from players deck and push it to players hand
  requestCard: function(playerId){
    let player = this.users.find(player => player.socket === playerId);
    if(player.actionPoint){
      let getRndCard, answerMsg, answerData;
      let player = this.users.find(player => player.socket === playerId);
      let playerDeckCount = player.table.deck.length;
      console.log('player ' + playerId + ' want card he have: ' + playerDeckCount + 'cards');
      if(playerDeckCount > 0){
        getRndCard = Math.floor(Math.random() * playerDeckCount) + 1;
        player.table.deck.splice(player.table.deck.indexOf(getRndCard), 1);
        player.table.hand.push(getRndCard);
        answerMsg = 'giveCard';
        answerData = Cards.find(card => card.id === getRndCard);
      } else {
        answerMsg = 'flash msg';
        answerData = {msgText: 'No more cards in your deck!'};
      }
      rooms[this.roomName].sendTo(player, answerMsg, answerData);
    } else {
      rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'no action point!'});
    }
        
  },
}



function handleSocket(socket) {

  var user = null;
  var room = null;
  var game = null;
  var firstPlayer = null;
  var secondPlayer = null;

  socket.on('chosen leader', pickLeader);
  socket.on('requestCard', playerRequestCard);
  socket.on('hireHero', function(data){
    room.hireCard(socket.id, data.cardId, data.field);
  });
  socket.on('requestCardsInfo', function(){
    socket.emit('reciveCardsInfo', {cardsInfo: Cards});
  });
  socket.on('disconnect', onLeave);

  socket.on('ready to game', function (data) {
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
    socket.broadcast.emit('enemyJoin', {enemy: userName});
    var clients = io.nsps["/"].adapter.rooms[roomName];
    console.log('line~252| in room# ' + roomName + ' sits: ' + clients.length);
    
    if (room.numUsers() == 2) {    
      // room.game = new Game(room.getUsers(), room.getName(), numGame++);
      // game = room.game;
      // games[game];
      room.getUserNames();
      enemy = room.getUserNames().replace(userName, '').trim();
      socket.emit('enemyJoin', {enemy: enemy}); 
      console.log('|||||||||||||||||||||| users ready ||||||||||||||||||||||||||||||');
      room.battlePrepare();
    }
  });

  function onJoin(data) {
    room = getOrCreateRoom(data.roomName);
    room.addUser(user = new User(data.userName, socket.id), socket);
    room.sendTo(user, 'room', { userId: user.getId(), roomName: room.getName(), users: room.getUsers()});
    // if (room.numUsers() == 2) {
    //   console.log('---------------------------');
    // }
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
    console.log('User %d left room %s. Users in room: %d', user.getId(), room.getName(), room.numUsers());
    if (room.isEmpty()) {
      console.log('Room is empty - dropping room %s', room.getName());
      delete rooms[room.getName()];
    }
    room.broadcastFrom(user, 'user_leave', user.getName());
  }
  function pickLeader(card){
    room.hireLeader(socket.id, card);
  }
  function playerRequestCard(){
    room.requestCard(socket.id);
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

