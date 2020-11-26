function User(name = 'anonymous', lastUserId, socket) {
  this.userId = lastUserId;
  this.name = name;
  this.socket = socket;
}
User.prototype = {
  getId: function () {
    return this.userId;
  },
  getName: function () {
    return this.name;
  },
  updateSocket: function(socket){
    this.socket = socket
  }
}

module.exports = User