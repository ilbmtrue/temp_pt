/* important note 

All the responses so far are correct. To clarify, recruit, restructure, and attack are all considered exclusive actions - any given hero may only perform a maximum of 1 of these actions per wave (and yes, recruiting a hero is considered an action taken by that hero - which isn't super intuitive, but oh well). Actions taken via other abilities (if an attack power or order allows another hero to attack or restructure) do not count towards this maximum. However, for Vanaah, she does not provide an additional ability that can restructure heroes. Instead, she simply makes it a free action (meaning it does not count toward your 2 actions per wave). So while restructuring does not cost you an action, you may not restructure a single hero multiple times, you may not restructure a hero who was recruited or who attacked that wave, and you may not attack with a hero you restructured that wave.
*/




const Cards = require('./card_revisions/cards_data_2012.js');
const Room = require('./server/room');
const User = require('./server/user');
const Game = require('./server/game');
const Player = require('./server/player');
const { IgnorePlugin } = require('webpack');

let testerA = "playerA"
let testerB = "playerB"
let moves = 0;
let room = null;
let game_logs = []
const logger = {
    get(target, prop, receiver) {    
        if (typeof target[prop] === 'function') {
            return function() {
                if((prop === 'hireLeader')||(prop ==='bodyRemove')){
                    game_logs.push({prop, playerId: arguments[0], card_id: arguments[1]})
                }
                if(prop ==='hireCard'){
                    game_logs.push({prop, playerId: arguments[0], cardId: arguments[1], field: arguments[2]})
                }
                if(prop ==='heroAttack'){
                    game_logs.push({prop, playerId: arguments[0], cardId: arguments[1], victim: arguments[2]})
                }
                if(prop ==='heroMove'){
                    game_logs.push({prop, playerId: arguments[0], card_id: arguments[1], target_field: arguments[2]})
                }
                if((prop ==='requestCard')||(prop ==='pass')){
                    game_logs.push({prop, playerId: arguments[0]})
                }
                // console.log(`Called ${prop} method with`, arguments);
                return target[prop].apply(receiver, arguments);
            }
        }
   
      return target[prop];
    }
}

let proxy = null;
function prepa(test_num){
    room = new Room("testing room"+test_num);
    userA = new User(testerA, "testerAid", null)
    userB = new User(testerB, "testerBid", null)
    room.addUser(userA, null);
    room.addUser(userB, null);
    game = room.game = new Game(test_num)

    proxy = new Proxy(game, logger);

    proxy.players.push(new Player(userA.getId(), userA));
    proxy.players.push(new Player(userB.getId(), userB));
    
    proxy.preparation()
    /*
        proxy.preparation(true)
        let teA = game.getUserByUserId(userA.userId);
        [17,8,7,6,5].forEach( (item) => {
            teA.board.pushCurrentCardsFromDeckToHand(item)   
        })
        let teB = game.getUserByUserId(userB.userId);
        [17,2,3,4,5].forEach( (item) => {
            teB.board.pushCurrentCardsFromDeckToHand(item)   
        })
        sresult = proxy.hireLeader(userA.getId(), 17) 
        sresult = proxy.hireLeader(userB.getId(), 17)
    */
    sresult = proxy.hireLeader(userA.getId(), -1) // -1 random
    sresult = proxy.hireLeader(userB.getId(), -1)

    game.players[0].action_atk = 0
    game.players[0].action_remove_body = 0
    game.players[0].useless_attacks = 0
    game.players[1].action_atk = 0
    game.players[1].action_remove_body = 0
    game.players[1].useless_attacks = 0
    
    game.players[0].remove_body = 1
    game.players[1].remove_body = 1

}

let sresult = "" 

function promiseThis(action){
    return new Promise( (resolve, reject) => {
        resolve(action)    
    })
}
function fillGameTable(cons_log = false){
    sresult = ""
    let action = ""
    let playersHaveCards = 2
    let iters = 0
    while(playersHaveCards !== 0){
        let playerForWhichTurn = game.getUserByUserId(game.playerIdTurn)
        let randomCard = 999
        let randomField = 999
        if(playerForWhichTurn.board.hand.length === 0){
            if(playerForWhichTurn.board.deck.length === 0) {
                action = "pass turn"
                sresult = proxy.pass(playerForWhichTurn.userId)
            }
            action = "pick card"
            sresult = proxy.requestCard(playerForWhichTurn.userId)
        } else {
            randomCard = playerForWhichTurn.board.hand[Math.floor( Math.random()*(Object.keys(playerForWhichTurn.board.hand).length))].id          
            possibleFields = playerForWhichTurn.board.fields.filter( f => f.card === null)
            if(possibleFields.length === 0){
                playersHaveCards--
                action = "game field is fulled"
            } else {
                r = Math.floor(Math.random()*possibleFields.length)
                randomField = possibleFields[r].num
                if(randomField == 999){
                    console.log(12131)
                }
                action = "hire card"
                sresult = proxy.hireCard(playerForWhichTurn.userId, randomCard, randomField)
            }
        }
        if(cons_log){
            let colorParam = (playerForWhichTurn.userName === "playerA") ? '\x1b[32m%s\x1b[0m' : '\x1b[33m%s\x1b[0m'         
            if(sresult.status === 'failure'){
                console.log(`r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${action}: ${randomCard} field: ${randomField} | ${sresult.data.msgText}`)        
            } else {
                if(action === "pick card"){
                    console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${action}`)   
                } 
                if(action === "hire card") {
                    console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${action}: ${randomCard} field: ${randomField}`)
                } 
            }
        }      

        iters++
        moves++
        if(iters > 100){
            console.log('debug this')
            process.exit(1)
        }
    }
    return 1
}

function playersAction(cons_log = false){
    let simpleAtk = 20000
    let iters = 0
    // let useless_attacks = 0
    let startTable = game.showGameTableToConsole()
    while(simpleAtk !== 0 ){
        if(iters > 20000){
            console.log(startTable)
            console.log(game.showGameTableToConsole())
            return "iters(10000) countdown"
            break
        }
        if(game.finish){
            if(cons_log){
                console.log(startTable)
                console.log(game.showGameTableToConsole())
                console.log(`moves ${moves}`)
                console.log( `lose: ${game.lose}, win: ${game.win} `)
            }
            return `END GAME lose: ${game.lose}, win: ${game.win}`
        }
        let playerForWhichTurn = game.getUserByUserId(game.playerIdTurn)
        let colorParam = (playerForWhichTurn.userName === "playerA") ? '\x1b[32m%s\x1b[0m' : '\x1b[33m%s\x1b[0m'    
        
        // attack or remove body
        if(playerForWhichTurn.remove_body){
            let bodies = playerForWhichTurn.board.getBodiesArray()
            if(bodies.length){
                let r = Math.floor(Math.random() * bodies.length)
                let cardId = bodies[r].card.id
                sresult = proxy.bodyRemove(playerForWhichTurn.userId, cardId)
                if(sresult.status === 'failure'){
                    if(sresult.data.msgText.match(/prohibits removing bodies/g)){
                        playerForWhichTurn.remove_body = 0
                    }
                }
                if(cons_log){
                    console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} remove corps, ${cardId}`)
                }
                playerForWhichTurn.useless_attacks = 0
                iters++
                moves++
                continue
            }
        }
        


        if(playerForWhichTurn.useless_attacks < 5){
            let rndAttackCard = getRndCardFromWave(playerForWhichTurn)
            if(rndAttackCard === -1){
                if(cons_log){
                    console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} pass1, no heroes on wave ${game.wave}`)
                }
                proxy.pass(playerForWhichTurn.userId)
                playerForWhichTurn.useless_attacks = 0
                iters++
                moves++
                continue
            }
            let temp_f = playerForWhichTurn.board.getNodeByCardId(rndAttackCard);
            let anotherUser = game.players.filter(p => p.userName !== playerForWhichTurn.userName)[0];
            let somes = ""
            let rndVictimCard = null
            if(temp_f === false){
                if(cons_log){
                    console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} pass2, only bodies on wave ${game.wave}`)
                }
                game.pass(playerForWhichTurn.userId)
                playerForWhichTurn.useless_attacks = 0
                iters++
                moves++
                continue
            }
            if(playerForWhichTurn.board.canRangeAtk(temp_f)){
                somes = "RANGED ATACK"    
                rndVictimCard = getRndCardFromTable(anotherUser) 
            } else {
                rndVictimCard = getRndVictimCardFromWave(anotherUser) 
            }
            if(rndVictimCard === -1){
                if(cons_log){
                    console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} pass3, only bodies on wave ${game.wave} ${somes}`)
                }
                proxy.pass(playerForWhichTurn.userId)
                playerForWhichTurn.useless_attacks = 0
                iters++
                moves++
                continue
            }
                
            let sresult = proxy.heroAttack(playerForWhichTurn.userId, rndAttackCard, rndVictimCard)
            if(sresult.status === "success"){
                simpleAtk--
                playerForWhichTurn.useless_attacks = 0
                if(cons_log){
                    if(sresult.data.some( e => e.specialEvent)){
                        console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${rndAttackCard} -> ${anotherUser.userName} ${rndVictimCard} success!! ${somes} LIFELINK`)    
                    }
                    console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${rndAttackCard} -> ${anotherUser.userName} ${rndVictimCard} success!! ${somes}`)
                }
            } else if(sresult.status === "failure"){
                if(sresult.msg === 'critical'){
                    console.log('bug')
                }
                if(sresult.data.msgText === 'END game'){
                    if(cons_log){
                        console.log(startTable)
                        console.log(game.showGameTableToConsole())
                        console.log(`moves ${moves}`)
                        console.log( `lose: ${game.lose}, win: ${game.win} `)
                    }
                    return `END GAME lose: ${game.lose}, win: ${game.win}`
                    break
                }

                playerForWhichTurn.useless_attacks++
                if(cons_log){
                    console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${rndAttackCard} -> ${anotherUser.userName} ${rndVictimCard} ${sresult.data.msgText} useless_attacks #${playerForWhichTurn.useless_attacks}`)
                    if(sresult.data.msgText.match(/immune/g)){
                        console.log(colorParam, `${playerForWhichTurn.userName} ${rndAttackCard} -> ${anotherUser.userName} ${rndVictimCard} ${sresult.data.msgText}`)
                    }
                    if(sresult.data.msgText.match(/can't get target/g)){
                        // useless_attacks++ 
                        // console.log(game.showGameTableToConsole()) 
                    }
                }
            } 
            iters++
            moves++
        } else {
            playerForWhichTurn.useless_attacks = 0
            game.pass(playerForWhichTurn.userId)
            if(cons_log){
                console.log(`i: ${iters} ${playerForWhichTurn.userName} pass`)
            }
        }
    }
    console.log(startTable)
    console.log(game.showGameTableToConsole())
    game_logs;
    return "unexpected return --- possibly stalemate"
}


for(let i = 0;i<1000;i++){
    moves = 0;
    prepa(i)
    fillGameTable()
    let test_result = playersAction()    
    console.log(`TEST #${i} ${test_result}`)
    game_logs = [];
}
console.log('all random test successful')









function getRndVictimCardFromWave(player){
    function findFirstInColumn(side){
        let column_field_num = player.board.getFieldNumByLineSide("vanguard", side)
        let column_field = player.board.fields[column_field_num - 1];
        if(column_field.card){
            if(column_field.card.isAlive){
                return column_field.card.id
            }
        } 
        column_field = column_field.behindNeighbor
        if(column_field.card){
            if(column_field.card.isAlive){
                return column_field.card.id
            }
        }
        column_field = column_field.behindNeighbor
        if(column_field.card){
            if(column_field.card.isAlive){
                return column_field.card.id
            }
        }       
        return false
    }
    let possibleTargetCards = [];
    ["left","middle","right"].forEach( side => {
        let card = findFirstInColumn(side)
        if(card){
            possibleTargetCards.push(card)
        }
    })
    let r = Math.floor(Math.random() * possibleTargetCards.length)

    return possibleTargetCards[r]
}
function getRndCardFromWave(player){
    let temppossibleAtkCards = (game.wave === 1) ? [7,8,9] : (game.wave === 2) ? [4,5,6] : [1,2,3];
    let possibleAtkCards = []
    temppossibleAtkCards.forEach( f => {
        if(player.board.fields[f-1].card !== null){
            if(player.board.fields[f-1].card.isAlive){
                possibleAtkCards.push(player.board.fields[f-1].card.id)
            }
        }
    })
    if(possibleAtkCards.length === 0){
        return -1
    } else {
        let r = Math.floor(Math.random() * possibleAtkCards.length)
        return possibleAtkCards[r]
    }
}
function getRndCardFromTable(player){
    let temppossibleAtkCards = [1,2,3,4,5,6,7,8,9];
    let possibleAtkCards = []
    temppossibleAtkCards.forEach( f => {
        if(player.board.fields[f-1].card !== null){
            if(player.board.fields[f-1].card.isAlive){
                possibleAtkCards.push(player.board.fields[f-1].card.id)
            }
        }
    })
    let r = Math.floor(Math.random() * possibleAtkCards.length)
    return possibleAtkCards[r]
}
