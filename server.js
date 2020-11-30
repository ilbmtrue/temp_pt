const crypto = require('crypto');
const express = require("express");
const { map } = require('./card_revisions/cards_data_2012.js');
const { inflate } = require('zlib');
const app = express();
app.use(express.json());
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require("fs");
const { data } = require('jquery');

const Cards = require('./card_revisions/cards_data_2012.js');

let rooms = {};

app.use(express.static('dist/'));
app.use('/img', express.static('dist/img'));

require('./route.js')(app);

const Room = require('./server/room');
const User = require('./server/user');


function getRoomByUserName(userName) {
  let user = null;
  for (let room in rooms) {
    user = rooms[room].users.find(user => user.name === userName);
    if (user) {
      return rooms[room];
    }
  }
  return room;
}
function getFieldNumByLineSide(line, side) {
  let num;
  switch (line) {
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

function getDateTime() {
  let date = new Date();
  let hour = date.getHours();
  let min = date.getMinutes();
  let sec = date.getSeconds();

  min = (min < 10 ? "0" : "") + min;
  hour = (hour < 10 ? "0" : "") + hour;
  sec = (sec < 10 ? "0" : "") + sec;

  return hour + ":" + min + ":" + sec;
}

let logCount = 0

fs.writeFile('loglast.txt', "", (err) => {
  if (err) throw err;
});

function handleSocket(socket) {
  let user = null;
  let room = null;
  let game = null;

  let onevent = socket.onevent;
  socket.onevent = function (packet) {
    let args = packet.data || [];
    let logPacket = Object.assign({}, packet)
    logPacket.data = ["*"].concat(args)
    onevent.call(this, logPacket) 
    onevent.call(this, packet);
  };
  socket.on("*", function (event, data) {
    data = (typeof data === "undefined") ? "" : JSON.stringify(data)
    let log = `${getDateTime()} ${logCount++} ${socket.id}  ${event}  ${data} \n\r`
    fs.appendFile("loglast.txt", log, (err) => {
      if (err) {
        throw err;
      }
    })
  });

  socket.on('joined to room', (data) => {
    let userName = data.userName || 'undefined user';
    let roomName = data.room || 'waiting room';
    room = getOrCreateRoom(roomName);
    let returnedUser = room.getUsers().find(user => user.name === data.userName);
    
    if(returnedUser){
      returnedUser.updateSocket(socket)
      console.log(`User ${userName} reconnect ${socket.id}`)
      returnedUser.leaveRoom = 0
      returnedUser.socket.id = socket.id
      returnedUser.socket = socket

      game = room.getOrCreateGame()

      let player = game.players.find( user => user.userName === data.userName)
      player.userId = socket.id
      player.socketId = socket.id

      room.sockets[returnedUser.getId()] = socket
      room.sockets
      user = returnedUser
      socket.join(roomName)

      let currentPlayer = game.getUserBySocketId(socket.id);
      let enemyUser = game.players.filter(p => p.socketId !== socket.id)[0];
      
      socket.emit("reconnect", {
        turnFor: game.playerTurn,
        roundFor: game.roundForPlayer,
        round: game.round,
        wave: game.wave,
        turn: game.turn,
        msg: 'reconnect',
        self: {
          name: currentPlayer.userName,
          actionPoint: currentPlayer.actionPoint,
          hand: currentPlayer.board.hand.map(c => c.id),
          deck: currentPlayer.board.deck.length,
          discard: currentPlayer.board.discard,
          table: currentPlayer.getTable(),
        },
        enemy: {
          name: enemyUser.userName,
          hand: enemyUser.board.hand.length,
          deck: enemyUser.board.deck.length,
          discard: enemyUser.board.discard,
          table: enemyUser.getTable(),
        },     
      });
      
      return 
    }

    room.addUser(user = new User(userName, socket.id, socket), socket);
    socket.join(roomName);

    if (room.users.length <= 2) {
      let arr = []
      room.users.forEach(player => arr.push(player.name))
      try {
        io.in(room.roomName).emit('player join room', { players: arr });
      } catch (error) {
        console.log(error)
      }

    }

  })
  socket.on('ready new game', () => {
    let user = room.getUserBySocket(socket)
    let state
    game = room.getOrCreateGame()
    state = room.userReady(user)
    if (state === "new game preparation") {
      Array.prototype.forEach.call(game.players, function (player) {
        let enemyUser = game.players.filter(p => p.socketId !== socket.id)[0];
        let playerSocket = rooms[room.roomName].sockets[player.socketId];
        playerSocket.emit('battle preparation', { selfCards: player.board.hand.map(c => c.id), enemyCards: enemyUser.board.hand.length  })
      });
      io.in(room.roomName).emit('flash msg', { msgText: 'pick leader!!' });
    }
    if (state === "one more") {
      io.in(room.roomName).emit('flash msg', { msgText: 'one more' });
    }
    if (!state) {
      console.log('PROBLEMS');
    }
  })
  socket.on('disconnect', onLeave);

  socket.on('chosen leader', function (card) {
    let call = game.hireLeader(socket.id, card)
    if (call) {
      if(call.msg === 'battle begin'){
        sendAnswer({status: 'success', data:{specialMsg: 'battle begin'}})
      } else {
        io.in(room.roomName).emit(call.msg, call.data);
      }
    } else {
      console.log('PROBLEMS')
    }
  });
  socket.on('Move Hero', function (data) {
    sendAnswer(game.heroMove(socket.id, data.card_id, data.targetField))
  });
  socket.on('Remove body', function (data) {
    sendAnswer(game.bodyRemove(socket.id, data.card_id))
  });
  socket.on('Draw a Card', function () {
    sendAnswer(game.requestCard(socket.id));
  });
  socket.on('Character Attack', function (data) {
    sendAnswer(game.heroAttack(socket.id, data.cardId, data.victim));
  });
  socket.on('Recruit a Hero', function (data) {
    sendAnswer(game.hireCard(socket.id, data.cardId, data.field, data.un));
  });
  socket.on('Pass', function () {
    sendAnswer(game.pass(socket.id))
  });
  socket.on('requestCardsInfo', function () {
    socket.emit('reciveCardsInfo', { cardsInfo: Cards });
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
    user.leaveRoom = 1;
    console.log(`${socket.id} : ${user.name} - is leave`);

    room.removeUser(user.getId());
    let ar = room.users.filter(user => user.leaveRoom === 1)
    if (ar.length === room.users.length) {
      console.log('Room is empty - dropping room %s', room.getName());
      delete rooms[room.getName()];
    } 
    room.broadcastFrom(user, 'user_leave', user.getName());
  }


  function sendAnswer(messages) {
    if (messages.status === "failure") {
      socket.emit("flash msg", messages.data)
    } else if (messages.status === "success") {
      // let gameTable = game.getTable()
      let currentPlayer = game.getUserBySocketId(socket.id);
      let enemyUser = game.players.filter(p => p.socketId !== socket.id)[0];
      let currentPlayerTable = currentPlayer.getTable()
      let enemyPlayerTable = enemyUser.getTable()
      let enemySocket = room.sockets[enemyUser.socketId]
      let specialMsg = ""
      let specialAction = []
      if(messages.data){
        if(messages.data.specialMsg){
          specialMsg = messages.data.specialMsg
        }
      }
      if((currentPlayer.board.deadBodiesCanAttack) || enemyUser.board.deadBodiesCanAttack){
        specialAction.push([currentPlayer.userName, "deadBodiesCanAttack"]) 
      }
      socket.emit("update", {
        turnFor: game.playerTurn,
        roundFor: game.roundForPlayer,
        round: game.round,
        wave: game.wave,
        turn: game.turn,
        msg: specialMsg,
        specialAction: specialAction,
        self: {
          name: currentPlayer.userName,
          actionPoint: currentPlayer.actionPoint,
          hand: currentPlayer.board.hand.map(c => c.id),
          deck: currentPlayer.board.deck.length,
          discard: currentPlayer.board.discard,
          table: currentPlayerTable,
        },
        enemy: {
          name: enemyUser.userName,
          hand: enemyUser.board.hand.length,
          deck: enemyUser.board.deck.length,
          discard: enemyUser.board.discard,
          table: enemyPlayerTable,
        },     
      });
      enemySocket.emit("update", {
        turnFor: game.playerTurn,
        roundFor: game.roundForPlayer,
        round: game.round,
        wave: game.wave,
        turn: game.turn,
        msg: specialMsg,
        specialAction: specialAction,
        self: {
          name: enemyUser.userName,
          actionPoint: enemyUser.actionPoint,
          hand: enemyUser.board.hand.map(c => c.id),
          deck: enemyUser.board.deck.length,
          discard: enemyUser.board.discard,
          table: enemyPlayerTable,          
        },
        enemy: {
          name: currentPlayer.userName,
          hand: currentPlayer.board.hand.length,
          deck: currentPlayer.board.deck.length,
          discard: currentPlayer.board.discard,
          table: currentPlayerTable,
        }
      });
      
    }
  }
}


  http.listen(3000, function () { console.log('HTTP server started on port 3000'); });
  io.on('connection', handleSocket);
