const Board = require("./board")
const Cards = require('../card_revisions/cards_data_2012.js');

Cards.forEach(c => {
    c["blood"] = 0;
    c["isAlive"] = 1;
});

function Player(userId, user) {
    this.userId = userId;
    this.socketId = userId
    // 
    this.userName = user.name
    // 
    this.board = new Board(user.name, Cards);
    this.board.shuffleDeck();  
    this.defaultActionPoint = 2;
    this.actionPoint = 0;
    this.inRoom = 1;
}
Player.prototype ={
    getUserId: function(){
        return this.userId
    },
    getBoard: function(){
        return this.board
    },
    getActionPoints: function(){
        return this.actionPoint
    },
    getTable: function(){
        let obj = []
        this.board.fields.forEach( (item, i) => {
            obj[i + 1] = !item.card ? "" : item.card
        })
        return JSON.stringify(Object.assign({}, obj))
    }
}

module.exports = Player