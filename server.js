const Cards = require('./cards_data_2012.js');

// Cards.splice(9, 15);
Object.freeze( Cards ); 

Cards.forEach(c => {
  c["blood"] = 0;
  c["isAlive"] = 1;
  c['atkType'] = 'melee';
  c['intercept'] = 0;
  if(!c.hasOwnProperty('ability')){
    c['ability'] = {
      vanguard: {  title:c.vanguard, type: "unknown" },
      flank: { title:c.flank, type: "unknown" },
      rear: {  title:c.rear, type: "unknown"  },
      order: {  title:c.special, type: "unknown" },
      leader: {  title:c.leader_special, type: "unknown" },
    }
  }
});

const gameLog = [];

const cardsImgArray = [];
for (let i = 0; i < Cards.length; i++) {
  cardsImgArray[Cards[i]['id']] = Cards[i]['img']; 
}


// for (let i = 0; i < Cards.length; i++) {
//   console.log(Cards[i].id);
//   console.log('v: ' + Cards[i].vanguard);
//   console.log('f: ' + Cards[i].flank);
//   console.log('r: ' + Cards[i].rear);
//   console.log('s: ' + Cards[i].special);
//   console.log('l: ' + Cards[i].leader_special);
// }

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
  this.deck = [...Cards],
  this.discard = [],
  this.hand = [],
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

  this.cardsProperties = new Map(),
  /*
    1 4 7
    2 5 8
    3 6 9
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
  shuffleDeck: function(){
    let m = this.deck.length, t, i;
    while (m) {
      i = Math.floor(Math.random() * m--);
      t = this.deck[m];
      this.deck[m] = this.deck[i];
      this.deck[i] = t;
    }
    return true;
  },
  pushCardsFromDeckToHand: function(count = 1){
    let arrLength = 0;
    for(let i = 0; i < count; i++){
      arrLength = this.hand.push(this.deck.shift());
    }
    return this.hand[arrLength - 1];
  },
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

  init: (function(){})(),

  removeCardFromHandById: function(card_id){
    this.hand.splice(this.hand.findIndex( card => card.id === card_id), 1);
  },
  addCardOnTable: function(card_id, field_num){
    let line, side = "";
    this.removeCardFromHandById(+card_id);
    [line, side] = getLineSideByFieldNum(field_num);
    let c = Cards[card_id - 1];
    this.fields[+field_num - 1].card = new Object({
      id: c.id, 
      atk: (field_num == 5) ? c.leader_atk : c.atk, 
      def: (field_num == 5) ? c.leader_def : c.def, 
      atkType: c.atkType,
      blood: 0, 
      isAlive: 1, 
      locate: field_num,
      line: line, // not needed in future
      side: side, // not needed in future
      ability: c.ability,
    });

    let t = null;
    if(field_num == 5){
      t = c['ability']['leader'];
    } else {
      t = c['ability'][line];
    }
    
    if(t.type === "passive"){
      this.cardsProperties.set(c.id, {ability: t} );
    }
    

    this.column[side][line] = this.fields[+field_num - 1].card;
    console.log(this.cardsProperties);
  }
}
function Node(num, line, side){
  this.num = num;
  this.card = null;
  this.line = line;
  this.side = side;
  this.aheadNeighbor = null;
  this.behindNeighbor = null;
}

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
  console.log(this.deck);
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
    [line, side] = getLineSideByFieldNum(fieldNum);
    
    this.unit2.set(+fieldNum,  new Object({
      id: c.id, 
      atk: (fieldNum == 5) ? c.leader_atk : c.atk, 
      def: (fieldNum == 5) ? c.leader_def : c.def, 
      atkType: c.atkType,
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
  this.cardsRoadMap.shuffleDeck();
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

  this.perksPreAttack = [];
  this.perksPostAttack = [];

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

    // player.cardsRoadMap.fields[4].card = playerTable.unit2.get(5);
    // player.cardsRoadMap.column["middle"]["flank"] = playerTable.unit2.get(5);
    player.cardsRoadMap.addCardOnTable(cardId, 5);
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
      let playerTable = player.table;
      let f = field;//.split('__');
      let line, side = "";
      [line, side] = getLineSideByFieldNum(field);
      // if(playerTable.unit2.get(+field) === ""){
      if(player.cardsRoadMap.fields[+field-1].card === null){
        // playerTable.hand.splice(playerTable.hand.indexOf(Number(cardId)), 1);
        // playerTable.placeCard(cardId, field);
        player.cardsRoadMap.addCardOnTable(cardId, field);
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


  // todo: need fix calculation of losses on wave change
  isPlayerTurnOver(user){
    if(user.actionPoint === 0){
      let anotherUser = this.users.filter( p => p.name !== user.name)[0];
        if(anotherUser.actionPoint === 0){
          // NEXT WAVE
          this.users.forEach( player => player.actionPoint = 2);
          for(let u of this.users){
            for(let c of u.cardsRoadMap.fields.values()){
              if(c.card){
                c.card.isAlive = (c.card.blood >= c.card.def) ? 0 : 1;
              }             
            }
          }
          if(this.wave === 3){
            // NEXT ROUND
            this.round++;
            this.wave = 1;
            this.roundForPlayer = user.name; 
            io.in(this.roomName).emit("next round", {player: this.roundForPlayer , round: this.round, wave: this.wave});
            io.in(this.roomName).emit('table update B', {
              gameTable: this.getTableB()
            });
            return;
          }
          this.wave++;
          this.playerTurn = anotherUser.name;
          /*
            At the end of each Wave, casualties are checked. 
            Any Hero with damage equal to or exceeding its life is considered defeated.
          */


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
      let obj = [];
      player.cardsRoadMap.fields.forEach(function(item, i) {
        let t = item.card;
        obj[i+1]= !t ? "" : t;
      });
      gameTable.push({name: player.name, actionPoints: player.actionPoint, table: JSON.stringify(Object.assign({}, obj))});
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
      player.cardsRoadMap.pushCardsFromDeckToHand(5);
      rooms[room].sendTo(player, 'prepare new battle', {cards: player.cardsRoadMap.hand });  
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
      // let cardAssaulter = player.table.getCardById(data.cardId)
      // let cardVictim = enemyPlayer.table.getCardById(data.victim)

      let attackerPlace = player.cardsRoadMap.getNodeByCardId(data.cardId);
      let victimPlace = enemyPlayer.cardsRoadMap.getNodeByCardId(data.victim);

      let path = 1;
      let blockedBy = "";
      function findMeleePath(node){
        if(!node.aheadNeighbor){
          return path;
        }
        if(node.aheadNeighbor.card){
          if(node.aheadNeighbor.card.isAlive){
            blockedBy = node.aheadNeighbor.card;
            return 0;
          }
        } else {
          path = findMeleePath(node.aheadNeighbor);
        }
        return path;
      }
      function findRangePath(node){ // node only victim
        let temp = node;
        //roll to vanguard line 
        while(temp.hasOwnProperty('aheadNeighbor')){
          temp = temp.aheadNeighbor;
        }
        while(temp.card.id !== node.card.id){
          if(temp.card.intercept){
            blockedBy = temp.card;
            return 0;
          }
          temp = temp.behindNeighbor;
        }
        return path;
      }




      if(attackerPlace.card.atkType === "melee"){
        //from attacker
        path = findMeleePath(attackerPlace);
        if(path){
          // to victim
          path = findMeleePath(victimPlace);
          if(path){
            // melee path free, attack action

            victimPlace.card.blood += attackerPlace.card.atk;  

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
      } else if(attackerPlace.card.atkType === "range"){
        path = findRangePath(victimPlace);
        if(path){
          victimPlace.card.blood += attackerPlace.card.atk;  
          io.in(this.roomName).emit('table update B', {
            gameTable: this.getTableB()
          });
          return;
        } else {
          let text = 'can\'t get target \n\r' + Cards[blockedBy.id - 1].name + ' stand on the way (' + blockedBy.line + ' ' + blockedBy.side + ')';
          rooms[this.roomName].sendTo(player, 'flash msg', {msgText: text});
        }
        rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'range attack!'});
      } else if(attackerPlace.card.atkType === "spell"){
        rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'cast spell!'});
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
  heroMove: function(playerId, data){
    let player = this.users.find(player => player.socket === playerId);
    if(data.targetField === "5"){
      rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'Can\'t switch with leader!'});
      return;
    }
    let node = player.cardsRoadMap.getNodeByCardId(data.card_id);
    let [line, side] = getLineSideByFieldNum(data.targetField)
    if(player.cardsRoadMap.fields[data.targetField - 1].card){
     // "switch";
      if(player.actionPoint < 2){
        rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'Not enough action points to switch!'});
        return;
      } else {
        //switch heroes
        let temp = Object.assign({}, player.cardsRoadMap.fields[data.targetField - 1].card);
        player.cardsRoadMap.fields[data.targetField - 1].card = node.card;
        player.cardsRoadMap.fields[node.num - 1].card = temp;
        player.actionPoint +=-2;
        console.log('hero switch');
      } 
    } else {
      // "move";
      [node.card.line, node.card.side] = [line, side]; // todo: future remove line side in card
      player.cardsRoadMap.fields[data.targetField - 1].card = node.card;
      player.cardsRoadMap.fields[node.num - 1].card = null;
      player.actionPoint--;
      console.log('heroMove');
    }
    io.in(this.roomName).emit('table update B', {
      gameTable: this.getTableB()
    });
    this.isPlayerTurnOver(player);

    
  },
  bodyRemove: function(playerId, data){
    let player = this.users.find(player => player.socket === playerId);
    let node = player.cardsRoadMap.getNodeByCardId(data.card_id);
    player.cardsRoadMap.discard.push(node.card);
    node.card = null;
    io.in(this.roomName).emit('table update B', {
      gameTable: this.getTableB()
    });
  },
  // get card from players deck and push it to players hand
  requestCard: function(playerId){
    let player = this.users.find(player => player.socket === playerId);
    if(player.actionPoint){

      if(player.cardsRoadMap.deck.length > 0){
        if(player.cardsRoadMap.hand.length < 5){
          let answerData = "";
          answerData = player.cardsRoadMap.pushCardsFromDeckToHand();
          player.actionPoint--;
          answerData.actionPoint = player.actionPoint;
          answerData.actionName = "giveCard";
          rooms[this.roomName].sendTo(player, 'giveCard', answerData);
          gameLog.push(`player ${player.name} [Draw a Card] card id#${answerData.id}`);
          console.log(`player ${player.name} [Draw a Card] card id#${answerData.id}`);
        } else {
          rooms[this.roomName].sendTo(player, 'flash msg', {msgText: `To much cards in hand! (${player.cardsRoadMap.hand.length})`});
        }
      } else {
        rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'No more cards in your deck!'});
      }
      

      // let getRndCard, answerMsg, answerData;
      // let playerDeckCount = player.table.deck.length;
      // console.log('player ' + playerId + ' want card he have: ' + playerDeckCount + 'cards');
      // if(playerDeckCount > 0){
      //   getRndCard = Math.floor(Math.random() * playerDeckCount) + 1;
      //   player.table.deck.splice(player.table.deck.indexOf(getRndCard), 1);
      //   player.table.hand.push(getRndCard);
      //   answerData = Cards.find(card => card.id === getRndCard);
      //   // player.actionPoint--;
      //   answerData.actionPoint = player.actionPoint;
      //   answerData.actionName = "giveCard";
      //   rooms[this.roomName].sendTo(player, 'giveCard', answerData);
      //   gameLog.push(`player ${player} [Draw a Card] card id#${answerData.id}`);
      // } else {
      //   rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'No more cards in your deck!'});
      // }
      
    } else {
      rooms[this.roomName].sendTo(player, 'flash msg', {msgText: 'No action point!'});
    }
    this.isPlayerTurnOver(player);
  },
}



function handleSocket(socket) {
  var user = null;
  var room = null;

  socket.on('chosen leader',  function(card){
    gameLog.push(`player ${socket.id} [chosen leader] ${card}`);
    room.hireLeader(socket.id, card);
  });

  socket.on('Move Hero', function(data){
    room.heroMove(socket.id, data);
  });

  socket.on('Remove body', function(data){
    room.bodyRemove(socket.id, data);
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



