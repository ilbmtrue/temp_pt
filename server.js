const Cards = require('./cards_data_2012.js');
Object.freeze( Cards ); 

Cards.forEach(c => {
  c["blood"] = 0;
  c["isAlive"] = 1;
});



const cardsImgArray = [];
for (let i = 0; i < Cards.length; i++) {
  cardsImgArray[Cards[i]['id']] = Cards[i]['img']; 
}

var crypto = require('crypto');
const express = require("express");
const { map } = require('./cards_data_2012.js');
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
  this.unit2 = new Map([[1, ""], [2, ""], [3, ""], [4, ""], [5, ""], [6, ""], [7, ""], [8, ""], [9, ""]]);
  this.shuffleStartDeck = function() {
    return shuffle(Array(Cards.length).fill().map((e, i) => i + 1));
  }
  // what cards will be used
  this.deck = this.shuffleStartDeck(); 
}
PlayerTable.prototype = {

  getCardById: function(id){ 
    let cards = this.unit2
    let card_id = ([...cards].find(([, v]) => v.id == id) || [])[0]; 
    return cards.get(card_id);
  },
  placeCard: function(id, fieldNum){
    let c = Cards[id - 1];
    this.unit2.set(+fieldNum,  {id: c.id, atk: c.atk, def: c.def, leader_atk: c.leader_atk, leader_def: c.leader_def, blood: c.blood, isAlive: c.isAlive});
  },
}

function Game(users){
  this.users = [{users}]
  this.turn = 1
  this.wave = 1
  this.round = 1
}
Game.prototype = {

  getTable: function(){},

}

function User(name = 'anonymous', socket) 
{
  this.userId = ++lastUserId;
  this.name = name;
  this.socket = socket;
  this.table = new PlayerTable();
  this.actionPoint = 0;
  this.inRoom = 1;
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

function Room(room_name) {
  this.roomName = room_name
  this.users = []
  this.sockets = {}
  this.numGame = numGame
  
  this.cardsOnTable = new Map()

  this.cardFirstPlayer = 0
  this.cardSecondPlayer = 0
  this.battleBegin = 0
  this.turn = 1
  this.wave = 1
  this.round = 1
  this.playerTurn = ""
  this.roundForPlayer = ""

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
    // this.users = this.users.filter( user => user.getId() !== id);
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
    
    playerTable.placeCard(cardId, 5);
    playerTable.hand.splice(playerTable.hand.indexOf(Number(cardId)), 1);
    this.battleBegin++;
    if (this.battleBegin == 2) {
      this.battlebegin();
    } else {
      playerName = this.users.find(player => player.socket === playerId).name;
      io.in(this.roomName).emit('pick leader', {player: playerName});
    }  
  },
  hireCard: function(playerId, cardId, field){
    let player = this.users.find(player => player.socket === playerId); 
   
    if(player.actionPoint){
      // let playerTable = this.users.find(player => player.socket === playerId).table;
      let playerTable = player.table;
      let f = field;//.split('__');
      
      if(playerTable.unit2.get(+field) === ""){
        
        playerTable.hand.splice(playerTable.hand.indexOf(Number(cardId)), 1);
        // playerTable.unit[f[0]][f[1]] = cardId;
        playerTable.placeCard(cardId, field);
        
        player.actionPoint--;
        io.in(this.roomName).emit('table update B', {
          gameTable: this.getTableB()
        });

      } else {
        rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'Pick another field!'});
      }
    } else {
      rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'no action point!'});
    }
    this.isPlayerTurnOver(player);
  },
  pass: function(playerId){
    let player = this.users.find(player => player.socket === playerId);
    player.actionPoint = 0;
    this.isPlayerTurnOver(player);
  },

  isPlayerTurnOver(user){
    if(user.actionPoint === 0){
      let anotherUser = this.users.filter( p => p.name !== user.name)[0];
        if(anotherUser.actionPoint === 0){
          // NEXT WAVE
          this.users.forEach( player => player.actionPoint = 2);
          if(this.wave === 3){
            // NEXT ROUND
            this.round++;
            this.wave = 1;
            this.roundForPlayer = user.name; 
            io.in(this.roomName).emit("next round", {player: this.roundForPlayer , round: this.round, wave: this.wave});
            return;
          }
          this.wave++;
          this.playerTurn = anotherUser.name;
          /*
            At the end of each Wave, casualties are checked. 
            Any Hero with damage equal to or exceeding its life is considered defeated.
          */

          for(let u of this.users){
            for(let c of u.table.unit2.values()){
              if(c){
                c.isAlive = (c.blood >= c.def) ? 0 : 1;
              }
              
            }
          }
          io.in(this.roomName).emit('next wave', {player: this.playerTurn, wave: this.wave});
          io.in(this.roomName).emit('table update B', {
            gameTable: this.getTableB()
          });
          console.log('Next WAVE');
          return
        }  
      this.playerTurn = anotherUser.name;
      io.in(this.roomName).emit('next turn', {player: this.playerTurn});   
      console.log('Next player turn');
    }
    
  },

  battlebegin: function(){
    [this.cardFirstPlayer, this.cardSecondPlayer] = shuffle(rooms[this.roomName].getUserNamesArray());
    // let gameTable = this.getTableB();
    // let gameTable = this.getTable();
    this.playerTurn = this.cardFirstPlayer;
    this.roundForPlayer = this.cardFirstPlayer;
    console.log(this.roundForPlayer)
    console.log(this.cardFirstPlayer)
    console.log(this.cardSecondPlayer)
    io.in(this.roomName).emit('battle begin', {
      firstPlayer: this.cardFirstPlayer, 
      secondPlayer: this.cardSecondPlayer,
      gameTable: this.getTableB()
    });

  },

  getTable: function(){
    let gameTable = [];
    Array.prototype.forEach.call(this.users, function(player) {
      gameTable.push({name: player.name, actionPoints: player.actionPoint, table: player.table.unit});
    });
    return gameTable;
  },
  getTableB: function(){
    let gameTable = [];
    Array.prototype.forEach.call(this.users, function(player) {
      let obj = Object.fromEntries(player.table.unit2);
      // [].forEach( (v, i))
      gameTable.push({name: player.name, actionPoints: player.actionPoint, table: JSON.stringify(obj)});
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
      rooms[room].sendTo(player, 'prepare new battle', {cards: player.table.hand });  
    });
  },
  
  
  /*
      When you select the Attack Action, you will choose a
      Hero in your current Wave to make the Attack, as well
      as a target on the opposing Unit.
      All Heroes can perform a Melee Attack, but both the
      attacker and the target must be “in Melee” to do so.
      Only the foremost Hero or Leader in each column is
      considered “in Melee”.
  */
  updateTablePerks: function(){
    for(let u in this.users){
      for(let c in u.table.unit2){
        console.log(u);
      }
    }
    
  },
  heroAttack: function(playerId, data){
    let player = this.users.find(player => player.socket === playerId);
    let enemyPlayer = this.users.find(player => player.socket !== playerId);
    if(player.actionPoint){
      console.log(data)
      let card = player.table.getCardById(data.cardId)
      let cardVictim = enemyPlayer.table.getCardById(data.victim)

      
      // preattack
      // attack
      // postattack  

      cardVictim.blood += card.atk;
      

      io.in(this.roomName).emit('table update B', {
        gameTable: this.getTableB()
      });
    } else {
      rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'no action point!'});
    }

    
    
    this.isPlayerTurnOver(player);
  },
  // get card from players deck and push it to players hand
  requestCard: function(playerId){
    let player = this.users.find(player => player.socket === playerId);
    if(player.actionPoint){
      let getRndCard, answerMsg, answerData;
      //let player = this.users.find(player => player.socket === playerId);
      let playerDeckCount = player.table.deck.length;
      console.log('player ' + playerId + ' want card he have: ' + playerDeckCount + 'cards');
      if(playerDeckCount > 0){
        getRndCard = Math.floor(Math.random() * playerDeckCount) + 1;
        player.table.deck.splice(player.table.deck.indexOf(getRndCard), 1);
        player.table.hand.push(getRndCard);
        answerData = Cards.find(card => card.id === getRndCard);
        player.actionPoint--;
        answerData.actionPoint = player.actionPoint;
        answerData.actionName = "giveCard";
        rooms[this.roomName].sendTo(player, 'giveCard', answerData);
      } else {
        rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'No more cards in your deck!'});
      }
      
    } else {
      rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'no action point!'});
    }
    this.isPlayerTurnOver(player);
  },
}



function handleSocket(socket) {
  var user = null;
  var room = null;

  socket.on('chosen leader',  function(card){
    room.hireLeader(socket.id, card);
  });
  socket.on('Draw a Card', function(data){
    room.requestCard(socket.id);
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
    socket.emit('reciveCardsInfo', {cardsInfo: Cards});
  });
  socket.on('disconnect', onLeave);

    /*
    function User(name = 'anonymous', socket) 
    {
      this.userId = ++lastUserId;
      this.name = name;
      this.socket = socket;
      this.table = new PlayerTable();
      this.actionPoint = 0;
      this.inRoom = 1;
    }
    */
  
  socket.on('ready to game', function (data) {
    console.log('socket ready: ' + socket.id);
    let userName = data.userName || 'undefined user';
    let roomName = data.room || 'waiting room';
    room = getOrCreateRoom(data.room);
    let userB = room.getUsers().find(user => user.name === data.userName);
    if(userB){
      console.log('user exist');
      userB.socket = socket.id;
      userB.inRoom = 1;
      user = userB;
      room.sockets[user.getId()] = socket;  
      socket.join(roomName);
      socket.emit('rejoin', {
        player: user.name,
        enemy: room.getUsers().find(user => user.name !== data.userName).name,
        cards: cardsImgArray,
        gameTable: room.getTableB(),
        hand: user.table.hand,
        actionPoint: user.actionPoint,
        playerTurn: room.playerTurn,
        roundForPlayer: room.roundForPlayer, 
        round: room.round, 
        wave: room.wave
      });
      return;
    } else {
      room.addUser(user = new User(data.userName, socket.id), socket);
    }
    socket.join(roomName); // ~~~~~
    io.to(roomName).emit("someone join", {user: userName}); 
    socket.emit('selfJoin', {myname: userName, cards: cardsImgArray});
    socket.broadcast.emit('enemyJoin', {enemy: userName});
    var clients = io.nsps["/"].adapter.rooms[roomName];
    console.log('line~252| in room# ' + roomName + ' sits: ' + clients.length);
    
    if(room.numUsers() == 2) {    
      room.getUserNames();
      enemy = room.getUserNames().replace(userName, '').trim();
      socket.emit('enemyJoin', {enemy: enemy}); 
      console.log('| users ready |');
      room.battlePrepare();
    }

  });

  // function onJoin(data) {
  //   console.log('DELETE IT');
  //   room = getOrCreateRoom(data.roomName);
  //   room.addUser(user = new User(data.userName, socket.id), socket);
  //   room.sendTo(user, 'room', { userId: user.getId(), roomName: room.getName(), users: room.getUsers()});
    // if (room.numUsers() == 2) {
    //   console.log('---------------------------');
    // }
  // }
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
    user.inRoom = 0;
    console.log(socket.id + ' - is leave');
    room.removeUser(user.getId());
    // console.log('User %d left room %s. Users in room: %d', user.getId(), room.getName(), room.numUsers());
    let ar = room.users.filter(user => user.inRoom === 1)
    if( ar.length === 0 ){
      console.log('Room is empty - dropping room %s', room.getName());
      delete rooms[room.getName()];
    } else {
      console.log('Users in room: %d', room.numUsers());
    }
    


    // if (room.isEmpty()) {
    //   console.log('Room is empty - dropping room %s', room.getName());
    //   delete rooms[room.getName()];
    // }
    room.broadcastFrom(user, 'user_leave', user.getName());
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

