const Cards = require('./cards_data_2012.js');
Object.freeze( Cards ); 

Cards.forEach(c => {
  c["blood"] = 0;
  c["isAlive"] = 1;
  c['atkType'] = 'melee';
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

function CardsRoadMap()
{
  this.fields = [
    new Node(1, "rear", "left"),
    new Node(2, "rear", "middle"),
    new Node(3, "rear", "right"),
    new Node(4, "flank", "left"),
    new Node(5, "flank", "middle"),
    new Node(6, "flank", "right"),
    new Node(7, "vanguard", "left"),
    new Node(8, "vanguard", "middle"),
    new Node(9, "vanguard", "right"),
  ];
  this.column = {
    left: { vanguard: null, flank: null, rear: null },
    middle: { vanguard: null, flank: null, rear: null },
    right: { vanguard: null, flank: null, rear: null },
  };
  /*
    147
    258
    369
  */
  this.fields[0].aheadNeighbor = this.fields[3];  // 1->4
  this.fields[1].aheadNeighbor = this.fields[4];  // 2->5
  this.fields[2].aheadNeighbor = this.fields[5];  // 3->6

  this.fields[3].aheadNeighbor = this.fields[6];  // 4->7
  this.fields[3].behindNeighbor = this.fields[0]; // 4->1
  this.fields[4].aheadNeighbor = this.fields[7];  // 5->8
  this.fields[4].behindNeighbor = this.fields[1]; // 5->2
  this.fields[5].aheadNeighbor = this.fields[8];  // 6->9
  this.fields[5].behindNeighbor = this.fields[2]; // 6->3

  this.fields[6].behindNeighbor = this.fields[3]; // 7->4
  this.fields[7].behindNeighbor = this.fields[4]; // 8->5
  this.fields[8].behindNeighbor = this.fields[5]; // 9->6
}
CardsRoadMap.prototype = {
  getNodeByNum: function(num){
    return this.fields.filter(node => node.num === num);
  },
  getNodeByCardId: function(id){
    for(let i = 0; i < this.fields.length; i++){
      if(this.fields[i].card){
        if(this.fields[i].card.id == id){
          return this.fields[i];
        }
      }
    }
    return false;
  },
  init: (function(){

  })(),
}
function Node(num, line, side){
  this.num = num;
  this.card = null;
  this.line = line;
  this.side = side;
  this.aheadNeighbor = null;
  this.behindNeighbor = null;
}

// cardsRoadMap = new CardsRoadMap(); 

// cardsRoadMap.fields[0].aheadNeighbor = cardsRoadMap.fields[3];  // 1->4
// cardsRoadMap.fields[1].aheadNeighbor = cardsRoadMap.fields[4];  // 2->5
// cardsRoadMap.fields[2].aheadNeighbor = cardsRoadMap.fields[5];  // 3->6
// cardsRoadMap.fields[3].aheadNeighbor = cardsRoadMap.fields[6];  // 4->7
// cardsRoadMap.fields[3].behindNeighbor = cardsRoadMap.fields[1]; // 4->1
// cardsRoadMap.fields[4].aheadNeighbor = cardsRoadMap.fields[7];  // 5->8
// cardsRoadMap.fields[4].behindNeighbor = cardsRoadMap.fields[2]; // 5->2
// cardsRoadMap.fields[5].aheadNeighbor = cardsRoadMap.fields[8];  // 6->9
// cardsRoadMap.fields[5].behindNeighbor = cardsRoadMap.fields[3]; // 6->3
// cardsRoadMap.fields[6].behindNeighbor = cardsRoadMap.fields[3]; // 7->4
// cardsRoadMap.fields[7].behindNeighbor = cardsRoadMap.fields[4]; // 8->5
// cardsRoadMap.fields[8].behindNeighbor = cardsRoadMap.fields[5]; // 9->6

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
    let line = "", side = "";
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
    
    this.unit2.set(+fieldNum,  new Object({
      id: c.id, 
      atk: (fieldNum == 5) ? c.leader_atk : c.atk, 
      def: (fieldNum == 5) ? c.leader_def : c.def, 
      atkType: c.atkType,
      // leader_atk: c.leader_atk, 
      // leader_def: c.leader_def, 
      blood: c.blood, 
      isAlive: c.isAlive, 
      locate: fieldNum,
      line: line,
      side: side,
    }));


  },
}

function Game(users){
  this.users = [...users]
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
  this.cardsRoadMap = new CardsRoadMap();
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
    let player = this.users.find(player => player.socket === playerId); 
    let playerTable = player.table;
    playerTable.placeCard(cardId, 5);

    player.cardsRoadMap.fields[4].card = playerTable.unit2.get(5);
    player.cardsRoadMap.column["middle"]["flank"] = playerTable.unit2.get(5);

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
      let line, side = "";
      switch (+field) {
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
      if(playerTable.unit2.get(+field) === ""){
        
        playerTable.hand.splice(playerTable.hand.indexOf(Number(cardId)), 1);
        // playerTable.unit[f[0]][f[1]] = cardId;
        playerTable.placeCard(cardId, field);
        
        player.cardsRoadMap.fields[+field - 1].card = playerTable.unit2.get(+field);
        player.cardsRoadMap.column[side][line] = playerTable.unit2.get(+field);

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
      let cardAssaulter = player.table.getCardById(data.cardId)
      let cardVictim = enemyPlayer.table.getCardById(data.victim)

      let attackerPlace = player.cardsRoadMap.getNodeByCardId(data.cardId);
      let victimPlace = enemyPlayer.cardsRoadMap.getNodeByCardId(data.victim);

      let path = 1;
      let blockedBy = "";
      function findFreePath(node){
        if(!node.aheadNeighbor){
          return path;
        }
        if(node.aheadNeighbor.card){
          if(node.aheadNeighbor.card.isAlive){
            blockedBy = node.aheadNeighbor.card;
            return 0;
          }
        } else {
          path = findFreePath(node.aheadNeighbor);
        }
        return path;
      }
      
      if(cardAssaulter.atkType === "melee"){
        //from attacker
        path = findFreePath(attackerPlace);
        if(path){
          // to victim
          path = findFreePath(victimPlace);
          if(path){
            // melee path free, attack action

            cardVictim.blood += cardAssaulter.atk;  

            io.in(this.roomName).emit('table update B', {
              gameTable: this.getTableB()
            });
            return;
          }          
        } 
        let liveStatus = (blockedBy.isAlive) ? "" : "Труп";
        let text = 'can\'t get target \n\r' + liveStatus + ' ' + Cards[blockedBy.id - 1].name + ' stand on the way (' + blockedBy.line + ' ' + blockedBy.side + ')';
        rooms[this.roomName].sendTo(player, 'flash msg', {msgText: text});
        return;
      }
      // console.log(player.cardsRoadMap.getNodeByCardId(data.cardId))
      // console.log(enemyPlayer.cardsRoadMap.getNodeByCardId(data.victim))

      // preattack
      // attack
      // postattack  
      
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



