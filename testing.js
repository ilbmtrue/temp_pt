const Cards = require('./card_revisions/cards_data_2012.js');
const Room = require('./server/room');
const User = require('./server/user');
const Game = require('./server/game');
const Player = require('./server/player');
const { IgnorePlugin } = require('webpack');

// case 1: line = "rear"; side = "left"; break;
// case 2: line = "rear"; side = "middle"; break;
// case 3: line = "rear"; side = "right"; break;
// case 4: line = "flank"; side = "left"; break;
// case 5: line = "flank"; side = "middle"; break;
// case 6: line = "flank"; side = "right"; break;
// case 7: line = "vanguard"; side = "left"; break;
// case 8: line = "vanguard"; side = "middle"; break;
// case 9: line = "vanguard"; side = "right"; break;

let testerA = "playerA"
let testerB = "playerB"
let moves = 0;
let room = null;


function prepa(test_num){
    room = new Room("testing room"+test_num);
    userA = new User(testerA, "testerAid", null)
    userB = new User(testerB, "testerBid", null)
    room.addUser(userA, null);
    room.addUser(userB, null);
    game = room.game = new Game(test_num)
    game.players.push(new Player(userA.getId(), userA));
    game.players.push(new Player(userB.getId(), userB));
    game.preparation()

    sresult = game.hireLeader(userA.getId(), -1)
    sresult = game.hireLeader(userB.getId(), -1)

    game.players[0].action_atk = 0
    game.players[0].action_remove_body = 0
    game.players[0].useless_attacks = 0
    game.players[1].action_atk = 0
    game.players[1].action_remove_body = 0
    game.players[1].useless_attacks = 0
}

// const arrCards = Array(25).fill().map((e, i) => i + 1)
// let playerField = { 7: "", 8: "", 9: "", 4: "", 5: "", 6: "", 1: "", 2: "", 3: "", }





// game.preparation(true)

// let teA = game.getUserByUserId(userA.userId);
// [9,8,7,6,5].forEach( (item) => {
//     teA.board.pushCurrentCardsFromDeckToHand(item)   
// })
// let teB = game.getUserByUserId(userB.userId);
// [1,2,3,4,5].forEach( (item) => {
//     teB.board.pushCurrentCardsFromDeckToHand(item)   
// })


let sresult = "" // server answer
//ready for random test


function promiseThis(action){
    return new Promise( (resolve, reject) => {
        resolve(action)    
    })
}
function fillGameTable(){
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
                sresult = game.pass(playerForWhichTurn.userId)
            }
            action = "pick card"
            sresult = game.requestCard(playerForWhichTurn.userId)
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
                sresult = game.hireCard(playerForWhichTurn.userId, randomCard, randomField)
            }
        }
        let colorParam = (playerForWhichTurn.userName === "playerA") ? '\x1b[32m%s\x1b[0m' : '\x1b[33m%s\x1b[0m'         
        if(sresult.status === 'failure'){
            console.log(`r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${action}: ${randomCard} field: ${randomField} | ${sresult.data.msgText}`)
            if(sresult.data.msgText === "No action point!"){
                console.log(123)
            }
        } else {
            if(action === "pick card"){
                console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${action}`)   
            } 
            if(action === "hire card") {
                console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${action}: ${randomCard} field: ${randomField}`)
            } 
        }
        iters++
        moves++
        if(iters > 100){
            console.log('debug this')
            process.exit(1)
        }
    }
    // console.log(`r${game.round} w${game.wave} t${game.turn}`)
    return 1
}

function playersAction(){
    let simpleAtk = 2000
    let iters = 0
    let useless_attacks = 0
    let startTable = game.showGameTableToConsole()
    while(simpleAtk !== 0 ){
        if(iters > 1000){
            console.log(`iters countdown ***r${game.round} w${game.wave} t${game.turn}***`)
            process.exit(1)
        }

        let playerForWhichTurn = game.getUserByUserId(game.playerIdTurn)
        let colorParam = (playerForWhichTurn.userName === "playerA") ? '\x1b[32m%s\x1b[0m' : '\x1b[33m%s\x1b[0m'    
        
        // attack or remove body
        let bodies = playerForWhichTurn.board.getBodiesArray()
        if(bodies.length){
            let r = Math.floor(Math.random() * bodies.length)
            let cardId = bodies[r].card.id
            sresult = game.bodyRemove(playerForWhichTurn.userId, cardId)
            console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} remove corps, ${cardId}`)
            playerForWhichTurn.useless_attacks = 0
            iters++
            moves++
            continue
        }


        if(playerForWhichTurn.useless_attacks < 5){
            let rndAttackCard = getRndCardFromWave(playerForWhichTurn)
            if(rndAttackCard === -1){
                console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} pass1, no heroes on wave ${game.wave}`)
                game.pass(playerForWhichTurn.userId)
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
                console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} pass2, only bodies on wave ${game.wave}`)
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
                // rndVictimCard = getRndCardFromWave(anotherUser) 
            }
            if(rndVictimCard === -1){
                console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} pass3, only bodies on wave ${game.wave} ${somes}`)
                game.pass(playerForWhichTurn.userId)
                playerForWhichTurn.useless_attacks = 0
                iters++
                moves++
                continue
            }
           
            let sresult = game.heroAttack(playerForWhichTurn.userId, rndAttackCard, rndVictimCard)
            if(sresult.status === "success"){
                simpleAtk--
                playerForWhichTurn.useless_attacks = 0
                if(sresult.data.some( e => e.specialEvent)){
                    console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${rndAttackCard} -> ${anotherUser.userName} ${rndVictimCard} success!! ${somes} LIFELINK`)    
                }
                console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${rndAttackCard} -> ${anotherUser.userName} ${rndVictimCard} success!! ${somes}`)
            } else if(sresult.status === "failure"){
                playerForWhichTurn.useless_attacks++
                console.log(colorParam, `r${game.round} w${game.wave} t${game.turn} ${playerForWhichTurn.userName} ${rndAttackCard} -> ${anotherUser.userName} ${rndVictimCard} ${sresult.data.msgText} useless_attacks #${playerForWhichTurn.useless_attacks}`)
                if(sresult.data.msgText.match(/immune/g)){
                    console.log(colorParam, `${playerForWhichTurn.userName} ${rndAttackCard} -> ${anotherUser.userName} ${rndVictimCard} ${sresult.data.msgText}`)
                }
                if(sresult.data.msgText.match(/can't get target/g)){
                    // useless_attacks++ 
                    // console.log(game.showGameTableToConsole()) 
                }
            } else if(sresult === 'END game') {
                console.log(startTable)
                console.log(game.showGameTableToConsole())
                console.log(`moves ${moves}`)
                console.log( `lose: ${game.lose}, win: ${game.win} `)

                break
            }
            iters++
            moves++
        } else {
            playerForWhichTurn.useless_attacks = 0
            game.pass(playerForWhichTurn.userId)
            console.log(`i: ${iters} ${playerForWhichTurn.userName} pass`)
        }
    }
    console.log(`r${game.round} w${game.wave} t${game.turn}`)
    console.log('test successful')
}

for(let i = 0;i<10;i++){
    console.log(`\n\n\nTEST # ${i}\n`)
    prepa(i)
    fillGameTable()
    playersAction()
}










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

function shuffle(array) {
    var m = array.length, t, i;
    while (m) {
      i = Math.floor(Math.random() * m--);
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  }




  /*
  trash

     t = { 7: 0, 8: 0, 9: 0, 4: 0, 5: 0, 6: 0, 1: 0, 2: 0, 3: 0, }
        for(let i = 0; i < 100 ; i++){
            r = Math.floor(Math.random()*playerForWhichTurn.board.fields.length)
            t[r]++
        }
        console.log(t)


        */