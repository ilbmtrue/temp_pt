const Player = require("./player")

function Game(gameId) {
    this.gameId = gameId
    this.players = []
    /*
        this.cardFirstPlayer = 0
        this.cardSecondPlayer = 0
        this.battleBegin = 0
        this.turn = 1
        this.wave = 1
        this.round = 1
        this.ceasefire = true
        this.finish = false
        this.win = ""
        this.lose = ""
        this.playerTurn = ""
        this.roundForPlayer = ""
        this.perksPreAttack = []
        this.perksPostAttack = []
        this.perks = []
        this.perksBeforeCheckloss = []
    */
}

Game.prototype = {
    getUserBySocketId: function(id){
        return this.players.find(player => player.socket === id);
    },
    preparation: function () {
        this.battleBegin = 0
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
        

        let room = this.roomName;
    
        // rework this moment
        [this.players[0].actionPoint, this.players[1].actionPoint] = [2,2];
       
        Array.prototype.forEach.call(this.players, function(player) {
            player.board.pushCardsFromDeckToHand(5);

            // rooms[room].sendTo(player, 'battle preparation', {cards: player.cardsRoadMap.hand });  
        });


        
    },
    
    start: function () {
        if (this.players.length == 2) {
            room.getUserNames();
            enemy = room.getUserNames().replace(userName, '').trim();
            socket.emit('enemyJoin', { enemy: enemy });
            room.battlePrepare();
            [this.cardFirstPlayer, this.cardSecondPlayer] = shuffle(rooms[this.roomName].getUserNamesArray());
            this.playerTurn = this.cardFirstPlayer;
            this.roundForPlayer = this.cardFirstPlayer;
            io.in(this.roomName).emit('battle begin', {
                firstPlayer: this.cardFirstPlayer,
                secondPlayer: this.cardSecondPlayer,
                gameTable: this.getTable()
            });
        }

        let playersNames = [];
        for (let u in this.players) {
            playersNames.push(this.players[u].userName);
        }
        [this.cardFirstPlayer, this.cardSecondPlayer] = shuffleArray(playersNames);
        this.playerTurn = this.cardFirstPlayer;
        this.roundForPlayer = this.cardFirstPlayer;
        return true
    },
    hireLeader: function (playerId, cardId) {
        let player = this.getUserBySocketId(playerId);
        player.board.addCardOnTable(+cardId, +5);
        this.battleBegin++;
        if (this.battleBegin == 2) {
            this.battlebegin();
        } else {
            playerName = this.players.find(player => player.socket === playerId).name;
            io.in(this.roomName).emit('pick leader', { player: playerName });
        }
    },
    hireCard: function (playerId, cardId, field) {
        if (this.finish) {
            io.in(this.roomName).emit('END game', { lose: this.lose, win: this.win });
            return;
        }
        let player = this.getUserBySocketId(playerId);
        if (player.actionPoint) {
            let playerTable = player.table;
            let f = field;
            let line, side = "";
            [line, side] = getLineSideByFieldNum(field);
            if (player.board.fields[+field - 1].card === null) {
                player.board.addCardOnTable(+cardId, +field);
                player.actionPoint--;
                io.in(this.roomName).emit('table update B', {
                    gameTable: this.getTable()
                });

            } else {
                rooms[this.roomName].sendTo(player, 'flash msg', { msgText: 'Pick another field!' });
            }
        } else {
            rooms[this.roomName].sendTo(player, 'flash msg', { msgText: 'no action point!' });
        }
        this.isPlayerTurnOver(player);
    },
    pass: function (playerId) {
        if (this.finish) {
            io.in(this.roomName).emit('END game', { lose: this.lose, win: this.win });
            return;
        }
        let player = this.getUserBySocketId(playerId);
        player.actionPoint = 0;
        this.isPlayerTurnOver(player);
    },
    perksBefore: function () {
        if (this.perksBeforeCheckloss.length) {
            this.perksBeforeCheckloss.forEach(perk => {
                // todo: must be rafactor, after all cards implempen..
                if (perk["action"] === "#alchemist") {
                    let enemyUser = this.players.filter(p => p.name !== perk.user)[0];
                    enemyUser.board.fields.forEach(item => {
                        if (item.card && item.card.isAlive) {
                            if (item.num !== 5) {
                                item.card.blood += 1;
                            }

                        }
                    });
                }
                if (perk["action"] === "#healer") {
                    let currentUser = this.players.filter(p => p.name === perk.user)[0];
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
                let anotherUser = this.players.filter(p => p.name !== u.name)[0];
                this.win = anotherUser.name;
                this.lose = u.name;
                this.finish = true;
                io.in(this.roomName).emit('END game', { lose: u.name, win: anotherUser.name });
                console.log('END');
                return
            }
        }
    },
    isPlayerTurnOver: function (user) {
        if (user.actionPoint === 0) {
            let anotherUser = this.players.filter(p => p.name !== user.name)[0];

            if (anotherUser.actionPoint === 0) {
                // NEXT WAVE
                this.players.forEach(player => player.actionPoint = 2);
                if (!this.ceasefire) {
                    this.perksBefore();
                    this.checkLoss();
                    this.afterCheckLoss();
                }

                if (this.wave === 3) {
                    // NEXT ROUND
                    this.round++;
                    this.wave = 1;
                    this.roundForPlayer = user.name;
                    if (this.ceasefire) {
                        this.ceasefire = false;
                    }
                    io.in(this.roomName).emit("next round", { player: this.roundForPlayer, round: this.round, wave: this.wave });
                    io.in(this.roomName).emit('table update B', {
                        gameTable: this.getTable()
                    });
                    return;
                }
                this.wave++;
                this.playerTurn = anotherUser.name;
                /*
                At the end of each Wave, casualties are checked. 
                Any Hero with damage equal to or exceeding its life is considered defeated.
                */

                io.in(this.roomName).emit('next wave', { player: this.playerTurn, wave: this.wave });
                io.in(this.roomName).emit('table update B', {
                    gameTable: this.getTable()
                });
                return
            }
            this.playerTurn = anotherUser.name;
            io.in(this.roomName).emit('next turn', { player: this.playerTurn });
        }

    },
    getTable: function () {
        let gameTable = [];
        Array.prototype.forEach.call(this.players, function (player) {
            let obj = [];
            player.board.fields.forEach(function (item, i) {
                let t = item.card;
                obj[i + 1] = !t ? "" : t;
            });
            gameTable.push({ name: player.name, actionPoints: player.actionPoint, table: JSON.stringify(Object.assign({}, obj)) });
        });
        return gameTable;
    },
    battlebegin: function () {
        console.log("battlebegin")
    },
    battlePrepare: function () {
        let room = this.roomName;
        //this.users = [users[0], users[1]];
        [this.players[0].actionPoint, this.players[1].actionPoint] = [2, 2];
        // first cards issued
        Array.prototype.forEach.call(this.players, function (player) {
            player.board.pushCardsFromDeckToHand(5);
            rooms[room].sendTo(player, 'prepare new battle', { cards: player.board.hand });
        });
    },
    heroAttack: function (playerId, data) {
        if (this.finish) {
            io.in(this.roomName).emit('END game', { lose: this.lose, win: this.win });
            return;
        }
        let text = "";
        let player = this.getUserBySocketId(playerId);
        let enemyPlayer = this.players.find(player => player.socket !== playerId);
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

                        io.in(this.roomName).emit('table update B', {
                            gameTable: this.getTable()
                        });
                        return;
                    }
                }
                let liveStatus = (blockedBy.isAlive) ? "" : "Труп";
                text = 'can\'t get target \n\r' + liveStatus + ' ' + Cards[blockedBy.id - 1].name + ' stand on the way (' + blockedBy.line + ' ' + blockedBy.side + ')';
                rooms[this.roomName].sendTo(player, 'flash msg', { msgText: text });
                return;

            } else if (atkType === "ranged") {

                try {
                    path = findRangePath(victimPlace);
                } catch (error) {
                    console.log(error);
                    path = 1;
                }

                if (path) {
                    if (dmg > 0) {
                        victimPlace.card.blood += dmg;
                    }
                    io.in(this.roomName).emit('table update B', {
                        gameTable: this.getTable()
                    });
                    return;
                } else {
                    victimPlace = enemyPlayer.board.getNodeByCardId(blockedBy.id);

                    if (dmg > 0) {
                        victimPlace.card.blood += dmg;
                    }

                    text = Cards[blockedBy.id - 1].name + ' (' + blockedBy.line + ' ' + blockedBy.side + ') intercept ranged attack!';

                    io.in(this.roomName).emit('table update B', {
                        gameTable: this.getTable()
                    });

                    // rooms[this.roomName].sendTo(player, 'flash msg', {msgText: text}) 

                }
                rooms[this.roomName].sendTo(player, 'flash msg', { msgText: text });
            }

            // preattack
            // attack
            // postattack  

        } else {
            rooms[this.roomName].sendTo(player, 'flash msg', { msgText: 'no action point!' });
        }

        this.isPlayerTurnOver(player);
    },
    heroMove: function (playerId, data) {
        //data {card_id: card id, targetField: field num}
        if (this.finish) { io.in(this.roomName).emit('END game', { lose: this.lose, win: this.win }); return; }
        let player = this.getUserBySocketId(playerId);
        if (data.targetField === "5") {
            rooms[this.roomName].sendTo(player, 'flash msg', { msgText: 'Can\'t switch with leader!' });
            return;
        }
        let node = player.board.getNodeByCardId(data.card_id);
        let [line, side] = getLineSideByFieldNum(data.targetField)
        if (player.board.fields[data.targetField - 1].card) {
            // "switch";
            let switchCard = player.board.fields[data.targetField - 1];
            if (player.actionPoint < 2) {
                rooms[this.roomName].sendTo(player, 'flash msg', { msgText: 'Not enough action points to switch!' });
                return;
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

        io.in(this.roomName).emit('table update B', {
            gameTable: this.getTable()
        });
        this.isPlayerTurnOver(player);
    },
    bodyRemove: function (playerId, data) {
        if (this.finish) {
            io.in(this.roomName).emit('END game', { lose: this.lose, win: this.win });
            return;
        }
        let player = this.getUserBySocketId(playerId);
        let node = player.board.getNodeByCardId(data.card_id);
        player.board.discard.push(node.card);
        node.card = null;
        io.in(this.roomName).emit('table update B', {
            gameTable: this.getTable()
        });
    },
    giveCard: function (player) {
        if (this.finish) {
            return "end game";
            io.in(this.roomName).emit('END game', { lose: this.lose, win: this.win });
            return;
        }

        // let player = this.getUserBySocketId(playerId);
        if (player.actionPoint) {
            if (player.board.deck.length > 0) {
                if (player.board.hand.length < 5) {
                    let answerData = "";
                    answerData = player.board.pushCardsFromDeckToHand();
                    player.actionPoint--;

                    answerData.actionPoint = player.actionPoint; answerData.actionName = "giveCard";
                    rooms[this.roomName].sendTo(player, 'giveCard', answerData);
                    //   gameLog.push(`player ${player.name} [Draw a Card] card id#${answerData.id}`);
                    //   console.log(`player ${player.name} [Draw a Card] card id#${answerData.id}`);
                    return true;
                } else {
                    return "To much cards in hand!"
                    rooms[this.roomName].sendTo(player, 'flash msg', { msgText: `To much cards in hand! (${player.board.hand.length})` });
                }
            } else {
                return "No more cards in your deck!"
                rooms[this.roomName].sendTo(player, 'flash msg', { msgText: 'No more cards in your deck!' });
            }
        } else {
            return "No action point!"
            rooms[this.roomName].sendTo(player, 'flash msg', { msgText: 'No action point!' });
        }
        this.isPlayerTurnOver(player);
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