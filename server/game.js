const Player = require("./player")

function Game(gameId) {
    this.gameId = gameId
    this.players = []
}

Game.prototype = {
    getUserBySocketId: function (id) {
        return this.players.find(player => player.socketId === id);
    },
    preparation: function () {
        this.playersReady = 0
        this.firstPlayer
        this.secondPlayer
        this.turn = 1
        this.wave = 1
        this.round = 1
        this.ceasefire = true
        this.finish = false
        this.win = ""
        this.lose = ""
        this.perksPreAttack = []
        this.perksPostAttack = []
        this.perks = []
        this.perksBeforeCheckloss = []
        this.roundForPlayer = ""

        let room = this.roomName;
        // rework this moment
        [this.players[0].actionPoint, this.players[1].actionPoint] = [2, 2];
        Array.prototype.forEach.call(this.players, function (player) {
            player.board.pushCardsFromDeckToHand(5);
            // rooms[room].sendTo(player, 'battle preparation', {cards: player.cardsRoadMap.hand });  
        });
    },
    hireLeader: function (playerId, cardId) {
        let player = this.getUserBySocketId(playerId);
        let sideEffects = player.board.addCardOnTable(+cardId, +5);
        if (sideEffects) {
            if (sideEffects.gameEvent === "perksBeforeCheckloss") {
                this.perksBeforeCheckloss.push({ user: sideEffects.perk.user, cardId: sideEffects.perk.cardId, action: sideEffects.perk.action });
            }
            // gameEvent: "perksBeforeCheckloss", action: { user: this.userName, card_id: c.id, action: lineAbil }
        }
        this.playersReady++;
        if (this.playersReady == 2) {
            return this.battleBegin();
        } else {
            playerName = this.players.find(player => player.socketId === playerId).userName;
            return { msg: 'pick leader', data: { player: playerName } }
            //io.in(this.roomName).emit('pick leader', { player: playerName });
        }
    },

    hireCard: function (playerId, cardId, field) {
        let player = this.getUserBySocketId(playerId);
        if (player.actionPoint) {
            let result
            let turn
            if (player.board.fields[+field - 1].card === null) {
                player.board.addCardOnTable(+cardId, +field);
                player.actionPoint--;
                result = { status: "success" }
            } else {
                return { status: "failure", msg: "flash msg", data: { msgText: 'Pick another field!' } }
            }
            this.isPlayerTurnOver(player)
            return result
            
        } else {
            return { status: "failure", msg: "flash msg", data: { msgText: 'no action point!' } }
        }
    },
    pass: function (playerId) {
        let player = this.getUserBySocketId(playerId);
        player.actionPoint = 0;
        let turn = this.isPlayerTurnOver(player)

        return {status: "success" }
        // return this.isPlayerTurnOver(player)
    },
    perksBefore: function () {
        if (this.perksBeforeCheckloss.length) {
            this.perksBeforeCheckloss.forEach(perk => {
                // todo: must be rafactor, after all cards implempen..
                if (perk["action"] === "#alchemist") {
                    let enemyUser = this.players.filter(p => p.userName !== perk.user)[0];
                    enemyUser.board.fields.forEach(item => {
                        if (item.card && item.card.isAlive) {
                            if (item.num !== 5) {
                                item.card.blood += 1;
                            }

                        }
                    });
                }
                if (perk["action"] === "#healer") {
                    let currentUser = this.players.filter(p => p.userName === perk.user)[0];
                    for (let item of currentUser.board.row[wave - 1]) {
                        if (item.card && item.card.isAlive) {
                            if (item.card.blood) {
                                if (item.card.blood < 2) {
                                    item.card.blood -= 1;
                                } else {
                                    item.card.blood -= 2;
                                }
                            }
                        }
                    }
                }

            });
        }
        return
    },
    checkLoss: function () {
        for (let u of this.players) {
            for (let c of u.board.fields.values()) {
                if (c.card) {
                    c.card.isAlive = (c.card.blood >= c.card.def) ? 0 : 1;
                }
            }
        }
    },
    afterCheckLoss: function () {
        for (let u of this.players) {
            if (!u.board.fields[4].card.isAlive) {
                let anotherUser = this.players.filter(p => p.userName !== u.userName)[0];
                this.win = anotherUser.userName;
                this.lose = u.userName;
                this.finish = true;
                io.in(this.roomName).emit('END game', { lose: u.userName, win: anotherUser.userName });
                console.log('END');
                return
            }
        }
    },
    isPlayerTurnOver: function (user) {
        if (user.actionPoint === 0) {
            let anotherUser = this.players.filter(p => p.userName !== user.userName)[0];
            // NEXT WAVE?
            if (anotherUser.actionPoint === 0) {
                this.players.forEach(player => player.actionPoint = 2);
                if (!this.ceasefire) {
                    this.perksBefore();
                    this.checkLoss();
                    this.afterCheckLoss();
                }
                // NEXT ROUND?
                if (this.wave === 3) {   
                    this.round++
                    this.wave = 1
                    this.roundForPlayer = user.userName
                    [this.firstPlayer, this.secondPlayer] = [this.secondPlayer, this.firstPlayer]
                    if (this.ceasefire) {
                        this.ceasefire = false
                    }

                    // return {msg: "next round", data: {player: this.roundForPlayer , round: this.round, wave: this.wave} } // + return table
                    return true //{msg: "next game step", data: {player: this.roundForPlayer , round: this.round, wave: this.wave} } // + return table
                }
                this.wave++;
                this.turn = 1;
                this.playerTurn = anotherUser.userName;

                return true // {msg: "next game step", data: {player: this.roundForPlayer , round: this.round, wave: this.wave} } // + return table
                // return {msg: "next wave", data: {player: this.playerTurn, wave: this.wave} } // + return table
            }
            this.turn++
            this.playerTurn = anotherUser.userName;

            return true // {msg: "next game step", data: {player: this.roundForPlayer , round: this.round, wave: this.wave}}
            // return {msg: "next turn", data: {player: this.playerTurn}}
        }
        return false
    },
    getTable: function () {
        let gameTable = [];
        Array.prototype.forEach.call(this.players, function (player) {
            let obj = [];
            player.board.fields.forEach(function (item, i) {
                let t = item.card;
                obj[i + 1] = !t ? "" : t;
            });
            gameTable.push({ name: player.userName, actionPoints: player.actionPoint, table: JSON.stringify(Object.assign({}, obj)) });
        });
        return gameTable;
    },
    getPlayerTable: function(playerId){
        let player = this.getUserBySocketId(playerId)
        let playerGameTable
        let obj = []
        player.board.fields.forEach( (item, i) => {
            obj[i + 1] = !item.card ? "" : item.card
        })
        playerGameTable = { table: JSON.stringify(Object.assign({}, obj)) }
        
        return playerGameTable;
    },
    battleBegin: function () {

        // get players name 
        let arr = []
        this.players.forEach(player => arr.push(player.userName))

        let m = arr.length, t, i;
        while (m) {
            i = Math.floor(Math.random() * m--);
            t = arr[m];
            arr[m] = arr[i];
            arr[i] = t;
        }

        [this.firstPlayer, this.secondPlayer] = [...arr]

        this.playerTurn = this.firstPlayer;
        this.roundForPlayer = this.firstPlayer;

        console.log("battlebegin")

        // return 
        //io.in(this.roomName).emit('battle begin', );
        return { msg: 'battle begin', data: { firstPlayer: this.firstPlayer, secondPlayer: this.secondPlayer, gameTable: this.getTable() } }
    },
    // battlePrepare: function () {
    //     let room = this.roomName;
    //     //this.users = [users[0], users[1]];
    //     [this.players[0].actionPoint, this.players[1].actionPoint] = [2, 2];
    //     // first cards issued
    //     Array.prototype.forEach.call(this.players, function (player) {
    //         player.board.pushCardsFromDeckToHand(5);
    //         rooms[room].sendTo(player, 'prepare new battle', { cards: player.board.hand });
    //     });
    // },
    heroAttack: function (playerId, data) {
        if (this.finish) {
            io.in(this.roomName).emit('END game', { lose: this.lose, win: this.win });
            return;
        }
        let text = "";
        let player = this.getUserBySocketId(playerId);
        let enemyPlayer = this.players.find(player => player.socketId !== playerId);
        if (player.actionPoint) {
            let attackerPlace = player.board.getNodeByCardId(data.cardId);
            let victimPlace = enemyPlayer.board.getNodeByCardId(data.victim);
            let path = 1;
            let blockedBy = "";
            let atkModif = 0;
            let defModif = 0;
            let reflectDmg = 0;
            atkType = "melee";

            if (attackerPlace.buffs.length > 0) {
                attackerPlace.buffs.forEach(buff => {
                    if (buff[1] === "ranged") {
                        atkType = "ranged";
                    }
                    // witch vanguard perk 
                    if (buff[1] === "moreDmgFromBodies") {
                        let mod;

                        mod = this.players.reduce((sum, user) => {
                            user.board.fields
                                .filter(field => field.card !== null)
                                .reduce((corpsCount, field) => {
                                    !field.card.isAlive ? corpsCount + 1 : 0;
                                }, 0);
                        }, 0);
                    }
                    if (buff[1].match(/moreDmg:/g)) {
                        let mod = buff[1].split(':');
                        atkModif += mod[1];
                    }
                });
            }
            if (victimPlace.buffs.length > 0) {
                victimPlace.buffs.forEach(buff => {
                    if (buff[1].match(/lessDmg:/g)) {
                        let mod = buff[1].split(':');
                        defModif += mod[1];
                    }
                    if (buff[1] === "immuneFromRange") {
                        defModif = "immuneFromRange";
                    }
                    if (buff[1].match(/reflectOnMeleeAttack/g)) {
                        let mod = buff[1].split(':');
                        reflectDmg = mod[1];
                    }
                });
            }
            function findMeleePath(node) {
                if (!node.aheadNeighbor) {
                    return path;
                }
                if (node.aheadNeighbor.card) {
                    if (node.aheadNeighbor.card.isAlive) {
                        blockedBy = node.aheadNeighbor.card;
                        return 0;
                    }
                } else {
                    path = findMeleePath(node.aheadNeighbor);
                }
                return path;
            }
            function findRangePath(node) { // node only victim
                let temp = node;
                //roll to vanguard line 
                while (temp.aheadNeighbor !== null) {
                    temp = temp.aheadNeighbor;
                }
                while (temp.card === null) {
                    temp = temp.behindNeighbor;
                    if (temp.card.isAlive) break;
                }
                while (temp.card.id !== node.card.id) {
                    if (temp.card.isAlive && temp.buffs.length > 0) {
                        for (let i = 0; i < temp.buffs.length; i++) {
                            if (temp.buffs[i][1] === "intercept") {
                                blockedBy = temp.card;
                                return 0;
                            }
                        }
                    }
                    temp = temp.behindNeighbor;
                }
                return path;
            }

            let dmg;
            if (defModif === "immuneFromRange" || defModif === "immuneFromMelee") {
                dmg = 0;
                return { status: "failure", msg: "flash msg", data: { msgText: 'immune' } }
                rooms[this.roomName].sendTo(player, 'flash msg', { msgText: "immune" });
                return

            } else {
                dmg = attackerPlace.card.atk + (atkModif - defModif);
            }


            if (atkType === "melee") {
                //from attacker
                path = findMeleePath(attackerPlace);
                if (path) {
                    // to victim
                    path = findMeleePath(victimPlace);
                    if (path) {
                        // melee path free, attack action
                        if (dmg > 0) {
                            victimPlace.card.blood += dmg;
                            if (reflectDmg) {
                                attackerPlace.card.blood += reflectDmg;
                            }
                        }

                        return { status: "success" };
                    }
                }
                let liveStatus = (blockedBy.isAlive) ? "" : "Труп";
                text = 'can\'t get target \n\r' + liveStatus + ' ' + Cards[blockedBy.id - 1].name + ' stand on the way (' + blockedBy.line + ' ' + blockedBy.side + ')';
                return { status: "failure", msg: "flash msg", data: { msgText: text } }
                rooms[this.roomName].sendTo(player, 'flash msg', { msgText: text });
                return;

            } else if (atkType === "ranged") {

                try {
                    path = findRangePath(victimPlace);
                } catch (error) {
                    console.log(error);
                    console.log("fix me!!!");
                    path = 1;
                }

                if (path) {
                    if (dmg > 0) {  victimPlace.card.blood += dmg;  }
                    return { status: "success" };
                } else {
                    victimPlace = enemyPlayer.board.getNodeByCardId(blockedBy.id);
                    if (dmg > 0) {  victimPlace.card.blood += dmg;  }

                    text = Cards[blockedBy.id - 1].name + ' (' + blockedBy.line + ' ' + blockedBy.side + ') intercept ranged attack!';
                    
                    return { status: "success" }
                    io.in(this.roomName).emit('table update B', {
                        gameTable: this.getTable()
                    });
                    // rooms[this.roomName].sendTo(player, 'flash msg', {msgText: text}) 
                }
                // rooms[this.roomName].sendTo(player, 'flash msg', { msgText: text });
            }

            // preattack
            // attack
            // postattack  

        } else {
            return { status: "failure", msg: "flash msg", data: { msgText: 'no action point!' } }
            rooms[this.roomName].sendTo(player, 'flash msg', { msgText: 'no action point!' });
        }

        // this.isPlayerTurnOver(player);
    },
    heroMove: function (playerId, data) {
        //data {card_id: card id, targetField: field num}
        let player = this.getUserBySocketId(playerId);
        if (data.targetField === "5") {
            return { status: "failure", data: { msgText: 'Can\'t switch with leader!'} }
        }
        let node = player.board.getNodeByCardId(data.card_id);
        let [line, side] = getLineSideByFieldNum(data.targetField)
        if (player.board.fields[data.targetField - 1].card) {
            // "switch";
            let switchCard = player.board.fields[data.targetField - 1];
            if (player.actionPoint < 2) {
                return { status: "failure", data: { msgText: 'Not enough action points to switch!'} }
            } else {
                //switch heroes
                player.board.removeAbility(Number(switchCard.card.id), Number(switchCard.num));
                player.board.removeAbility(Number(data.card_id), Number(node.num));
                let temp = Object.assign({}, player.board.fields[data.targetField - 1].card);
                player.board.fields[data.targetField - 1].card = node.card;
                player.board.fields[node.num - 1].card = temp;
                player.board.addAbility(Number(switchCard.card.id), Number(switchCard.num));
                player.board.addAbility(Number(node.card.id), Number(node.num));
                player.actionPoint += -2;
            }
        } else {
            // "move";

            //remove buffs
            player.board.removeAbility(Number(node.card.id), Number(node.num));
            [node.card.line, node.card.side] = [line, side]; // todo: future remove line side in card
            player.board.fields[data.targetField - 1].card = node.card;
            player.board.addAbility(Number(data.card_id), Number(data.targetField));
            player.board.fields[node.num - 1].card = null;
            player.actionPoint--;
        }
        let ans = []
        let turn = this.isPlayerTurnOver(player)
        if(turn){
            ans.push(turn)
        }
        return {status: "success", data: ans }
    },
    bodyRemove: function (playerId, data) {
        let player = this.getUserBySocketId(playerId)
        let node = player.board.getNodeByCardId(data.card_id)
        player.board.discard.push(node.card)
        node.card = null
        let ans = []
        player.actionPoint--
        let turn = this.isPlayerTurnOver(player)
        if(turn){
            ans.push(turn)
        }
        return {status: "success", data: ans }
        
    },
    requestCard: function (playerId) {
        let player = this.getUserBySocketId(playerId);
        if (player.actionPoint) {
            if (player.board.deck.length > 0) {
                if (player.board.hand.length < 5) {
                    let result = null
                    let getedCard = player.board.pushCardsFromDeckToHand()
                    result = {reciver: "socket", msg: 'giveCard', cardId: getedCard.id }
                    player.actionPoint--
                    let turn = this.isPlayerTurnOver(player)
                    if(turn){
                        return {status: "success", data: turn }
                    }
                    return {status: "success", data: result }
                } else {
                    return { status: "failure", data: { msgText: `To much cards in hand! (${player.board.hand.length})` } }
                }
            } else {
                return { status: "failure", data: { msgText: "No more cards in your deck!" } }
            }
        } else {
            return { status: "failure", data: { msgText: "No action point!" } }
        }
    },
}


function shuffleArray(array) {
    var m = array.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}
module.exports = Game