
/*
Не конектит клиента в комнату room
socket.join
а админа коннектит в комнату



ОШИБКА
game конструктор переписан
при подключении 2го игрока вылезает ошибка,

переделать game start!!!


*/





const Cards = require('./data.js');
// console.log(Cards);
// var PORT = 8033;
// var io = require('socket.io')(PORT);
var crypto = require('crypto');
const express = require("express");
const app = express();
app.use(express.json()); // for parsing application/json
// var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

// var io_admin = require('socket.io')(http);

var rooms = {};
var lastUserId = 0;
var lastRoomId = 0;
var numGame = 0;
// middlewares
// app.use('/client', express.static('client/'));
app.use(express.static('dist/'));
app.use('/img', express.static('dist/img'));
app.use('/modal', express.static('client/modal'));
// app.use('/ico', express.static('dist/img/ico'));
//  app.use(express.static(__dirname + '/node_modules'));
// app.use(express.static(path.join(__dirname, 'client')));

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
function Table() {
  this.deck = '';
  this.hand = '';
  this.drop = '';
  this.field = { c: '', n: '', ne: '', e: '', se: '', s: '', sw: '', w: '', nw: '' };
}
function Game(players, room, numGame) {
  // this.users = [players[0], players[1]];
  this.room_name = room;
  this.gameId = numGame;
  this.table = {
    player_one: [players[0], new Table()],
    player_two: [players[1], new Table()]
  }
  this.player_one_deck = shuffle(Array(Cards.length).fill().map((e, i) => i + 1));
  this.player_two_deck = shuffle(Array(Cards.length).fill().map((e, i) => i + 1));
  this.cardFirstPlayer = 0;
  this.cardSecondPlayer = 0;
  this.prepeare = {
    pick_leaders: 0,
  };
}
Game.prototype = {
  hireLeader: function (userId, cardId) {
    console.log('user: ' + userId + ' card: ' + cardId);
    if (userId == 1) {
      if (this.player_one_table['c'] == '') {
        this.player_one_table['c'] = cardId;
        this.prepeare['pick_leaders']++;
      }
    }
    if (userId == 2) {
      if (this.player_two_table['c'] == '') {
        this.player_two_table['c'] = cardId;
        this.prepeare['pick_leaders']++;
      }
    }
    if (this.prepeare['pick_leaders'] == 2) {
      this.battlebegin();
    }
    // console.log(this);
  },
  start: function () {
    this.player_one_hand = this.player_one_deck.splice(1, 5);
    this.player_two_hand = this.player_two_deck.splice(1, 5);
    var one_deck = [];
    var two_deck = [];

    var cards_img = {};

    for (let i = 0; i < Cards.length; i++) {
      cards_img[Cards[i]['num']] = Cards[i]['img'];
    }
    console.log(cards_img);
    for (let i = 0; i < 5; i++) {
      try {
        one_deck.push(Cards[this.player_one_hand[i] - 1]['num']);
        two_deck.push(Cards[this.player_two_hand[i] - 1]['num']);
      } catch (error) {
        console.log('err i:' + i);
        console.dir(this.player_one_hand);
        console.dir(Cards[this.player_one_hand[i]]);
        console.log(error);
        --i;
      }
    }

    rooms[this.room_name].sendTo(this.player_one, 'init_game', { cards_images: cards_img, cards: one_deck });
    rooms[this.room_name].sendTo(this.player_two, 'init_game', { cards_images: cards_img, cards: two_deck });

    // socket.emit('add-card', {img: cards_arr[Math.floor(Math.random() * cards_arr.length)]});
  },
  battlebegin: function () {
    var diceD2 = Math.floor(Math.random() * 2) + 1;
    if (diceD2 == 1) {
      this.cardFirstPlayer = 1;
      this.cardSecondPlayer = 2;
    } else {
      this.cardFirstPlayer = 2;
      this.cardSecondPlayer = 1;
    }

    console.log('leaders in battle!');
    rooms[this.room_name].sendTo(this.player_one, 'leadersingame', { diced2: this.cardFirstPlayer, my: this.player_one_table['c'], enemy: this.player_two_table['c'] });
    rooms[this.room_name].sendTo(this.player_two, 'leadersingame', { diced2: this.cardSecondPlayer, my: this.player_two_table['c'], enemy: this.player_one_table['c'] });
  }
}
function User(name = 'anonymous', socket) {
  this.userId = ++lastUserId;
  let userName = name.slice(1);
  this.userName = userName;
  this.socketId = socket;
}
User.prototype = {
  getId: function () {
    return this.userId;
  },
  getName: function () {
    return this.userName;
  }
};
function Room(room_hash) {
  this.roomName = room_hash;
  this.users = [];
  this.sockets = {};
  this.games = {};
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
    if (this.numUsers() == 2) {
      console.log('||||||||||||||||||||||||||||||||||||||||||||||||||||');
      this.games = new Game(this.getUsers(), this.getName(), numGame++);
      this.games.start();
    }
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

var gameS;
var TESTCOUNT = 0;
function handleSocket(socket) {
  TESTCOUNT++;
  var user = null;
  var room = null;

  // socket.on('join', onJoin);
  // socket.on('disconnect', onLeave);

  socket.on('disconnect', function () { 
    TESTCOUNT--;
    console.log('ws disconnect count: ' + TESTCOUNT);  
  });
  socket.on('ready to game', function (roomName = 'waiting room') {
    socket.join(roomName);
    var clients = io.nsps["/"].adapter.rooms[roomName];
    console.log('in room# ' + roomName + ' sits: ' + Object.keys(clients).length);
    

    io_adm.to("Admin room").emit('someone ready', {room: roomName, user: socket.id});
  });


  function onJoin(joinData) {
    console.log('handleSocket onJoin');
    // Somehow sent join request twice?
    if (user !== null || room !== null) {
      room.sendTo(user, MessageType.ERROR_USER_INITIALIZED);
      return;
    }
    // Let's get a room, or create if none still exists
    room = getOrCreateRoom(joinData.roomName);

    // Add a new user
    room.addUser(user = new User(joinData.userName, socket.id), socket);
    // Send room info to new user
    room.sendTo(user, 'room', {
      userId: user.getId(),
      roomName: room.getName(),
      users: room.getUsers()
    });
    // Notify others of a new user joined
    room.broadcastFrom(user, 'user_join', {
      userId: user.getId(),
      userName: user.getName(),
      users: room.getUserNames()
    });
    console.log('User %s joined room %s. Users in room: %d [%s]',
      user.getId(), room.getName(), room.numUsers(), room.getUserNames());
    if (room.numUsers() == 2) {
      console.log('---------------------------');
    }
  }

  function getOrCreateRoom(name) {
    var room;
    if (!name) {
      name = ++lastRoomId + '_room';
    }
    if (!rooms[name]) {
      room = new Room(name);
      rooms[name] = room;
    }
    return rooms[name];
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

