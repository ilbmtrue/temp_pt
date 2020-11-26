const Game = require('../server/game');
const Player = require('../server/player');

function Room(room_name) {
    this.roomName = room_name
    this.users = []
    this.game = null;

    this.playingUsers = [];
    this.sockets = {}
    this.gameId = 0;
    // this.lastUserId = 0;
    
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
        delete this.sockets[id];
        if (this.users.length == 0) {
            delete this;
        }
        // this.room.removeUser(socket.id);
    },
    sendTo: function (user, message, data) {
        if(!user.leaveRoom){
            let socket = this.sockets[user.getId()];
            socket.emit(message, data);
        }
    },
    sendToId: function (userId, message, data) {
        return this.sendTo(this.getUserById(userId), message, data);
    },
    broadcastFrom: function (fromUser, message, data) {
        this.users.forEach(function (user) {
            if (user.getId() !== fromUser.getId()) {
                this.sendTo(user, message, data);
            }
        }, this);
    },
    getUserBySocket: function (socket) {
        return this.users.find(user => user.userId === socket.id);
    },
    getOrCreateGame: function () {
        if (!this.game) {
            let game;
            game = new Game(this.gameId++)
            this.game = game
        }
        return this.game;
    },
    userReady: function (user) {
        if (this.game.players.length < 2) {
            this.game.players.push(new Player(user.getId(), user)); 
            if (this.game.players.length === 2) {
                this.game.preparation()
                return "new game preparation"
            }    
            return "one more"
        }
        return false
    },

}

module.exports = Room