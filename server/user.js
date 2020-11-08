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
}

module.exports = User