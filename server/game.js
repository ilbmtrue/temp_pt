const Player = require("./player")
const Cards = require('../card_revisions/cards_data_2012.js');
function Game(gameId) {
    this.gameId = gameId
    this.players = []
}

Game.prototype = {
    getUserBySocketId: function (id) {
        return this.players.find(player => player.socketId === id);
    },
    getUserByUserId: function(userId){
        return this.players.find(player => player.userId === userId);
    },
    preparation: function (test = false) {
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
        this.playerTurn = ""
        this.playerIdTurn = ""
        let room = this.roomName;
        // rework this moment
        [this.players[0].actionPoint, this.players[1].actionPoint] = [2, 2];
        if(!test){
            Array.prototype.forEach.call(this.players, function(player) {
                player.board.pushCardsFromDeckToHand(5)
            });
        }
    },
    hireLeader: function (playerId, cardId) {
        let player = this.getUserBySocketId(playerId);
        // -1 - random
        if(cardId === -1){
            let hand_cards = player.board.hand.filter( c => c.id)
            let random = Math.floor(Math.random() * hand_cards.length)
            cardId = player.board.hand[random].id
        }
        if(player.board.fields[4].card){
            return { status: "failure", msg: "flash msg", data: { msgText: 'You already pick a leader!' } } 
        }
        if(player.board.hand.filter(c => c.id === Number(cardId)).length === 0){
            return { status: "failure", msg: "flash msg", data: { msgText: 'this card is not in hand' } } 
        }

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
                // return "END game"
                return {status: "failure", msg: "flash msg", data: { msgText: 'END game' } };

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
                    this.roundForPlayer = user.userName;
                    [this.firstPlayer, this.secondPlayer] = [this.secondPlayer, this.firstPlayer]
                    if (this.ceasefire) {
                        this.ceasefire = false
                    }

                    return true
                }
                this.wave++;
                this.turn = 1;
                this.playerTurn = anotherUser.userName;
                this.playerIdTurn = anotherUser.userId;
                
                return true 
            }
            this.turn++
            this.playerTurn = anotherUser.userName;
            this.playerIdTurn = anotherUser.userId;

            return true
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
        let arr = []
        this.players.forEach(player => arr.push(player))       
        let m = arr.length, t, i;
        while (m) {
            i = Math.floor(Math.random() * m--);
            t = arr[m];
            arr[m] = arr[i];
            arr[i] = t;
        }
        [this.firstPlayer, this.secondPlayer] = [arr[0].userName, arr[1].userName]

        this.playerTurn = this.firstPlayer;
        this.playerIdTurn = arr[0].userId;
        this.roundForPlayer = this.firstPlayer;

        return { msg: 'battle begin', data: { firstPlayer: this.firstPlayer, secondPlayer: this.secondPlayer, gameTable: this.getTable() } }
    },

    heroAttack: function (playerId, cardId, victim) {
        if (this.finish) {
            return {status: "failure", msg: "flash msg", data: { msgText: 'END game' } };
        }
        let text = "";
        let player = this.getUserBySocketId(playerId);
        let enemyPlayer = this.players.find(player => player.socketId !== playerId);
        if (player.actionPoint) {
            let ans = [];
            let attackerPlace = player.board.getNodeByCardId(cardId);
            let victimPlace = enemyPlayer.board.getNodeByCardId(victim);
            let path = 1;
            let blockedBy = "";
            let atkModif = 0;
            let defModif = 0;
            let reflectDmg = 0;
            atkType = "melee";
            let lifelink = false;
            if (attackerPlace.buffs.length > 0) {
                let attacker = attackerPlace
                attackerPlace.buffs.forEach(buff => {
                    if (buff[1] === "ranged") {
                        atkType = "ranged";
                    }
                    // hero witch vanguard perk 
                    if (buff[1] === "moreDmgFromBodies") {
                        let mod;
                        mod = this.players.reduce((sum, user) => {
                            user.board.fields
                                .filter(field => field.card !== null)
                                .reduce((corpsCount, field) => {
                                    !field.card.isAlive ? corpsCount + 1 : 0;
                                }, 0);
                        }, 0);
                        if(mod){
                            atkModif += mod
                        }
                        // atkModif = (mod > 0)? atkModif + mod : atkModif;
                    }
                    if(buff[1] === "moreDmgIfForerunnerDead"){     
                        if(attacker.aheadNeighbor){
                            if(attacker.aheadNeighbor.card){
                                if(!attacker.aheadNeighbor.card.isAlive){
                                    atkModif += 4 //which flank
                                }
                            }
                        }
                    }
                    // hero vampire vanguard perk
                    if(buff[1].match(/lifelink/g)) {
                        lifelink = true
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
                    if(temp.card){
                        if (temp.card.isAlive) break;
                    } 
                }
                
                while (1) {
                    if(temp.card){
                        if(temp.card.id !== node.card.id){
                            if (temp.card.isAlive && temp.buffs.length > 0) {
                                for (let i = 0; i < temp.buffs.length; i++) {
                                    if (temp.buffs[i][1] === "intercept") {
                                        blockedBy = temp.card;
                                        return 0;
                                    }
                                }
                            }
                        } else {
                            return path
                        }
                    }
                    temp = temp.behindNeighbor;
                }
            }

            let dmg;
            // if (defModif === "immuneFromRange" || defModif === "immuneFromMelee") {
            //     dmg = 0;
            //     return { status: "failure", msg: "flash msg", data: { msgText: 'immune' } }
            // } else {
                dmg = attackerPlace.card.atk + (atkModif - defModif);
            // }


            if (atkType === "melee") {
                if (defModif === "immuneFromMelee"){
                    return { status: "failure", msg: "flash msg", data: { msgText: 'immune for melee' } }
                }

                //from attacker
                path = findMeleePath(attackerPlace);
                if (path) {
                    // to victim
                    path = findMeleePath(victimPlace);
                    if (path) {
                        // melee path free, attack action
                        if (dmg > 0) {
                            victimPlace.card.blood += Number(dmg);
                            if (reflectDmg) {
                                attackerPlace.card.blood += reflectDmg;
                                ans.push({specialEvent: "reflectDmg"})
                            }
                            // hero vampire vanguard perk
                            if(lifelink){
                                if(attackerPlace.card.blood > 0){
                                    attackerPlace.card.blood = (attackerPlace.card.blood > Number(dmg)) ? attackerPlace.card.blood - Number(dmg) : 0;
                                }
                                ans.push({specialEvent: "lifelink"})
                            }
                        }
                        player.actionPoint--
                        
                        let turn = this.isPlayerTurnOver(player)
                        if(turn){
                            ans.push(turn)
                        }
                        return {status: "success", data: ans }
                        return { status: "success" };
                    }
                }
                let liveStatus = (blockedBy.isAlive) ? "" : "Труп";
                text = 'can\'t get target ' + liveStatus + ' ' + Cards[blockedBy.id - 1].name + '(' + blockedBy.id + ') ' + ' stand on the way (' + blockedBy.line + ' ' + blockedBy.side + ')';
                return { status: "failure", msg: "flash msg", data: { msgText: text } }
                rooms[this.roomName].sendTo(player, 'flash msg', { msgText: text });
                return;

            } else if (atkType === "ranged") {
                if (defModif === "immuneFromRange"){
                    return { status: "failure", msg: "flash msg", data: { msgText: 'immune for range' } }
                }
                try {
                    path = findRangePath(victimPlace);
                } catch (error) {
                    console.log(this.showGameTableToConsole())
                    console.log(error);
                    path = findRangePath(victimPlace);
                    console.log("fix me!!!");
                    path = 1;
                }

                if (path) {
                    if (dmg > 0) {  victimPlace.card.blood += Number(dmg);  }
                    if (reflectDmg) {
                        attackerPlace.card.blood += reflectDmg;
                        ans.push({specialEvent: "reflectDmg"})
                    }
                    player.actionPoint--
                    let turn = this.isPlayerTurnOver(player)
                    if(turn){
                        ans.push(turn)
                    }

                    return {status: "success", data: ans }
                } else {
                    victimPlace = enemyPlayer.board.getNodeByCardId(blockedBy.id);
                    if (Number(dmg) > 0) {  victimPlace.card.blood += Number(dmg);  }

                    text = Cards[blockedBy.id - 1].name + ' (' + blockedBy.line + ' ' + blockedBy.side + ') intercept ranged attack!';
                    
                    return { status: "failure", msg: "flash msg", data: { specialMsg: text } }
                   
                }
            }

            // preattack
            // attack
            // postattack  

        } else {
            return { status: "failure", msg: "flash msg", data: { msgText: 'no action point!' } }
        }

        // this.isPlayerTurnOver(player);
    },
    heroMove: function (playerId, card_id, target_field) {
        //data {card_id: card id, targetField: field num}
        let player = this.getUserBySocketId(playerId);
        if (target_field === "5") {
            return { status: "failure", data: { msgText: 'Can\'t switch with leader!'} }
        }
        let node = player.board.getNodeByCardId(card_id);
        let [line, side] = player.board.getLineSideByFieldNum(target_field)
        if (player.board.fields[target_field - 1].card) {
            // "switch";
            let switchCard = player.board.fields[target_field - 1];
            if (player.actionPoint < 2) {
                return { status: "failure", data: { msgText: 'Not enough action points to switch!'} }
            } else {
                //switch heroes
                player.board.removeAbility(Cards, Number(switchCard.card.id), Number(switchCard.num));
                player.board.removeAbility(Cards, Number(card_id), Number(node.num));
                let temp = Object.assign({}, player.board.fields[target_field - 1].card);
                player.board.fields[target_field - 1].card = node.card;
                player.board.fields[node.num - 1].card = temp;
                player.board.addAbility(Number(switchCard.card.id), Number(switchCard.num));
                player.board.addAbility(Number(node.card.id), Number(node.num));
                player.actionPoint += -2;
            }
        } else {
            // "move";

            //remove buffs
            player.board.removeAbility(Cards, Number(node.card.id), Number(node.num));
            [node.card.line, node.card.side] = [line, side]; // todo: future remove line side in card
            player.board.fields[target_field - 1].card = node.card;
            player.board.addAbility(Number(card_id), Number(target_field));
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
    bodyRemove: function (playerId, card_id) {
        let player = this.getUserBySocketId(playerId)
        let node = player.board.getNodeByCardId(card_id)
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

    // for testing
    showGameTableToConsole: function (){
        let str = "" 
        this.players.forEach( p => {
            p.board.fields.forEach( f => {
                if(f.card !== null){
                    if(f.card.isAlive){
                        if(f.card.id.length > 2){
                            str += '+' + f.card.id + ' ;'
                        } else {
                            str += ' +' + f.card.id + ';'
                        }
                    } else {
                        if(f.card.id.length > 2){
                            str += '-' + f.card.id+ ' ;'
                        } else {
                            str += ' -' + f.card.id+ ';'
                        }
                    }
                } else {
                    str += '  x;'
                }
            })
            str += '$'
        })
        let f_arr = str.split('$')
        let gameTable = "" 
        let f1 = f_arr[0].split(';')
        let f2 = f_arr[1].split(';')
        gameTable += `${f1[0]} ${f1[3]} ${f1[6]}  ${f2[8]} ${f2[5]} ${f2[2]}   \r\n`;
        gameTable += `${f1[1]} ${f1[4]} ${f1[7]}  ${f2[7]} ${f2[4]} ${f2[1]}   \r\n`;
        gameTable += `${f1[2]} ${f1[5]} ${f1[8]}  ${f2[6]} ${f2[3]} ${f2[0]}   \n`;

        return gameTable
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