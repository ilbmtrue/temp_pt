const  Cards  = require("../card_revisions/cards_data_2012");

let imageFormat = '.webp';
const cardsCollection = [...Cards];
const controlPanel = document.getElementById("control-panel");
const playerHand = document.querySelector('.player-panel__self').querySelector('.hand');
const enemyHand = document.querySelector('.player-panel__enemy').querySelector('.hand');
const messageBoard =  document.getElementById('messageBoard');  
let infoBoard = null  
const gameTable = document.getElementById('gameTable'); 


let gameRoundEl = null;
let gameWaveEl = null;
let gameTurnEl = null;


class ActionController 
{   
    constructor() { 
        this.select = null; // выбрана карта
        this.target = null;
        this.chosen = null; // card ID
        this.chosenField = null; // field num
        this.chosenDOMElem = null;
        this.possibleTarget = null;
        this.playerAction = null; // имя действия
    }

    getPossibleField(player_action){
        if(!playerTurn){
            messageBoard.innerText = 'Not your turn!';                
            messageBoardAnimation();
            this.chosen = "";
            this.chosenDOMElem = null;
        } else {
            switch (player_action) {
                case 'attack':
                    this.select = true;
                    document.querySelector('body').style.cursor = "crosshair"; 
                    this.possibleTarget = document.querySelector('#enemy-player').querySelectorAll('.card-holder');
                    [].forEach.call(this.possibleTarget, el => {
                        if(el.children[0].getAttribute('data-card-id')){
                            el.classList.add('card_posable-target');
                        }  
                    });
                    break;
                case 'move':
                    this.select = true;
                    document.querySelector('body').style.cursor = "crosshair"; 
                    this.possibleTarget = document.querySelector('#player').querySelectorAll('.card-holder');
                    [].forEach.call(this.possibleTarget, el => {
                        if(el.children[0].getAttribute('data-field-num') !== 5){
                            el.classList.add('card_posable-target');
                        }  
                    });
                    break;
                case 'hire_hero':
                    this.select = true;
                    document.querySelector('body').style.cursor = "crosshair";         
                    switch (gameWave) {
                        case 1:
                            this.possibleTarget = gameTable.querySelector('.vanguard').querySelectorAll('.card-holder');
                            break;
                        case 2:
                            this.possibleTarget = gameTable.querySelector('.flank').querySelectorAll('.card-holder');
                            break;
                        case 3:
                            this.possibleTarget = gameTable.querySelector('.rear').querySelectorAll('.card-holder');
                            break;
                        default:break;
                    }
                    [].forEach.call(this.possibleTarget, el => {
                        if(!el.children[0].getAttribute('data-card-id')){
                            el.classList.add('card_posable-target');
                        }  
                    });
                    document.querySelector('.modal').classList.remove("modal__show");
                    gameTable.style.opacity = 1;
                    modalShow = false;
                    break;
                case 'body-remove':


                    break;
                default:
                    break;
            }
        }
    }
    removeBody(){
        socket.emit('Remove body', {card_id: this.chosen, field_num: this.chosenField});
        this.chosen = "";
        this.chosenField = "";
        this.playerAction = null;       
    }
    hireHero(tableField){
            socket.emit('Recruit a Hero', {cardId: this.chosen, field: tableField.getAttribute('data-field-num')});
            console.log(`HIRE HERO id:${this.chosen} on field: ${tableField.getAttribute('data-field-num')}`);
            
            [].forEach.call(this.possibleTarget, el => {
                el.classList.remove('card_posable-target');
            });
            this.chosen = "";
            this.chosenDOMElem.remove();     
            
    }
    hireLeader(){
        socket.emit('chosen leader', this.chosen);
        let card = cardsCollection.find(c => c.id == this.chosen);
        let a = document.querySelector('#player').querySelector('.flank.middle');

        //  TODO debug this
        a.style['background-image'] = 'url(\'./img/cards/s-'+ actionController.chosen + imageFormat + '\')';
        this.chosenDOMElem.remove();
        document.querySelector('.modal').classList.remove("modal__show");
        gameTable.style.opacity = 1;
        modalShow = false;
        rotatedCards = document.getElementsByClassName('hand-card');
        [].forEach.call(rotatedCards, el => {
            el.classList.remove('rotate-card');
        });
        actionController.chosen = "";
        actionController.chosenDOMElem = "";
 
    }
    characterAttack(){
        socket.emit('Character Attack', {cardId: this.chosen, victim: this.target});
        [].forEach.call(this.possibleTarget, el => {
            el.classList.remove('card_posable-target');
        });
        this.chosen = "";
        this.playerAction = "";
        this.chosenDOMElem = "";
    }
    moveHero(){
        socket.emit('Move Hero', {card_id: this.chosen, targetField: this.target});
        [].forEach.call(this.possibleTarget, el => {
            el.classList.remove('card_posable-target');
        });

        this.chosen = "";
        this.playerAction = "";
        this.chosenDOMElem = "";    
    }
}
let actionController = new ActionController();


class PanelAction {
    constructor(elem) {
      this._elem = elem;
      elem.onclick = this.onClick.bind(this); // (*)
    }
    pickCard(){
        if(playerTurn){
            socket.emit('Draw a Card');
        } else {
            messageBoard.innerText = 'Not your turn!';
            messageBoardAnimation();
        }     
    }
    // attack() {console.log('attack');}
    pass() {
        if(playerTurn){
            socket.emit('Pass');
        } else {
            messageBoard.innerText = 'Not your turn!';
            messageBoardAnimation();
        }
    }
    special() {console.log('special');}
    order() {console.log('order');}
    move() {console.log('move');}
    castling() {console.log('castling');}

    onClick(event) {
      let action = event.target.dataset.action;
      if (action) {
        this[action]();
      }
    };
}







let modalShow = false;
// let chosenCard = 0;
// let chosenCardDOM = {};
// let chosenField = "";

let cardInfoBlock = false;
let cardsImage = [];

// random user name
// let userName = Math.random().toString(36).substring(7); //
let userName = localStorage.getItem('user') ? localStorage.getItem('user') : 'anon' ;
let enemyName = "";
let playerTurn = false;

var joinroom;
let table = { vanguard: {l: '', m: '', r: ''},flank: {l: '', m: '', r: ''},rear: {l: '', m: '', r: ''}}
// let enemy_table = Object.assign({}, table);
// let player_table = Object.assign({}, table);
var players = [];
// var pickLeader = null;
const socket = io({
    autoConnect: true,
    reconnectionAttempts: 20

});
let gameWaveDic = new Map([[1, 'vanguard'], [2, 'flank'], [3, 'rear']]);
// let gameFieldDic = new Map([[1, "vanguard__l"], [2, "vanguard__m"], [3, "vanguard__r"], 
//                             [4, "flank__l"], [5, "flank__m"], [6, "flank__r"], 
//                             [7, "rear__l"], [8, "rear__m"], [9, "rear__r"]]);
let wavePrefere = -1;
let gameRound = 1;
let gameTurn = 1;
let gameWave = 1;
let roundForPlayer = ""
const gameTurnArr = [   ['#player .vanguard', '#player .flank', '#player .rear'],
                        ['#enemy-player .vanguard', '#enemy-player .flank', '#enemy-player .rear']];


function getLineSideByFieldNum(fieldNum){
    switch (+fieldNum) {
        case 1: line = "rear"; side = "left";break;
        case 2: line = "rear"; side = "middle";break;
        case 3: line = "rear"; side = "right";break;
        case 4: line = "flank"; side = "left";break;
        case 5: line = "flank"; side = "middle";break;
        case 6: line = "flank"; side = "right";break;
        case 7: line = "vanguard"; side = "left";break;
        case 8: line = "vanguard"; side = "middle";break;
        case 9: line = "vanguard"; side = "right";break;
        default:break;
    }
    return [line, side];
}
function messageBoardAnimation(){
    messageBoard.classList.remove('flash--active');
    void messageBoard.offsetWidth;
    messageBoard.classList.add('flash--active');
}
           
function getMapKeyByValue(map, searchValue) {
    for (let [key, value] of map.entries()) {
        if (value === searchValue)
        return key;
    }
}
function fillGameTableB(player, data){
    let playerUnitElem = document.getElementsByClassName(player)[0];
    let playerTable = data.gameTable.find(user => user.name === player).table;
    playerTable = JSON.parse(playerTable);
    // let e = a.querySelectorAll('.table__field');
    for(f in playerTable){
        if(playerTable[f]){
            let line, side = "";
            [line, side] = getLineSideByFieldNum(f);
            let card = cardsCollection.find(c => c.id == playerTable[f].id);
            let cardElem = playerUnitElem.querySelectorAll(`[data-field-num=\"${f}\"`)[0];
            
            let cardAbility = card['ability'][line];

            if(playerTable[f].isAlive){
                if(cardElem.classList.contains('corps')){
                    cardElem.classList.remove('corps')
                }
                cardElem.style['background-image'] = 'url(\'./img/cards/s-'+ card.img + imageFormat + '\')';
                cardElem.dataset.cardId = playerTable[f].id;
                if(player === userName){
                    cardElem.querySelector('.card-action').style.display = 'flex';
                    cardElem.querySelector('.card-action').querySelector('.body-remove').style.display = 'none';
                    cardElem.querySelector('.card-action').querySelector('.attack').style.display = 'flex';
                    if(f !== "5"){
                        cardElem.querySelector('.card-action').querySelector('.move').style.display = 'flex';
                    }
                    if(cardAbility.type === "spell"){
                        cardElem.querySelector('.spell').style.display = 'flex';
                    }
                }
                
                cardElem.querySelector('.characteristic').style.display = 'flex';
                cardElem.querySelector('.characteristic__attack').innerText = (f == 5) ? card.leader_atk : card.atk;
                cardElem.querySelector('.characteristic__defence').innerText = (f == 5) ? card.leader_def : card.def;
                if(playerTable[f].blood){
                    cardElem.querySelector('.blood-token').style.display = 'flex';
                    cardElem.querySelector('.token').innerText = playerTable[f].blood;
                }
                
            } else {
                cardElem.dataset.cardId = playerTable[f].id;
                if(!cardElem.classList.contains('corps')){
                    cardElem.classList.add('corps')
                }
             
                cardElem.style['background-image'] = 'url(\'./img/shirt-3.jpg\')';
                if(player === userName){
                    cardElem.querySelector('.attack').style.display = 'none';
                    cardElem.querySelector('.move').style.display = 'none';
                    cardElem.querySelector('.body-remove').style.display = 'flex';                   
                }
                cardElem.querySelector('.blood-token').style.display = 'none';
                cardElem.querySelector('.characteristic').style.display = 'none';
            }
        } else {
            let cardElem = playerUnitElem.querySelectorAll(`[data-field-num=\"${f}\"`)[0];
            if(cardElem.hasAttribute('data-card-id')){
                cardElem.removeAttribute('data-card-id');
                cardElem.style.removeProperty('background-image');
                cardElem.querySelector('.characteristic').style.removeProperty('display');
                if(player === userName){
                    cardElem.querySelector('.card-action').style.removeProperty('display');
                }
            }
            
        }
    }
    console.log('fillGameTableB');
}

socket.on('rejoin', function(data){

    console.log('rejoined');
    console.log(data);
    cardsImage = data.cards;
    enemyName = data.enemy;
    gameRoundEl = document.querySelector('.game-round');
    gameWaveEl = document.querySelector('.game-wave');
    gameTurnEl = document.querySelector('.game-turn');
    let fieldPlayer = document.getElementById('player');
    let fieldPlayerName = fieldPlayer.getElementsByClassName("user-name")[0];
    let fieldEnemyPlayer = document.getElementById('enemy-player');
    let fieldEnemyPlayerName = fieldEnemyPlayer.getElementsByClassName("user-name")[0];
    
    

    fieldPlayer.classList.add(data.player);
    fieldPlayerName.innerHTML = data.player;      
    fieldEnemyPlayer.classList.add(data.enemy);
    fieldEnemyPlayerName.innerHTML = data.enemy;  
    players.push(data.player, data.enemy);
    players.forEach(player => {
        fillGameTableB(player, data)
    });

    roundForPlayer = data.roundForPlayer;
    gameRound = data.round;
    gameWave = data.wave;
    moveWaveCard(roundForPlayer);
    
    for (let i = 0; i < data.hand.length; i++) {
        var new_card = document.createElement('div');
        new_card.className = 'hand-card';
        new_card.setAttribute('data-card-id', data.hand[i].id);
        new_card.style['background-image'] = 'url(\'./img/cards/'+ cardsImage[data.hand[i].img] + imageFormat + '\')';
        // new_card.classList.add('rotate-card');
        playerHand.append(new_card);
    }

    infoBoard.innerText = `Action point: ${data.actionPoint}`;
    controlPanel.style.visibility = "visible";
    new PanelAction(controlPanel);
    document.querySelectorAll('.action').forEach(e => e.classList.toggle('--show'));
    if(data.playerTurn === userName){   
        messageBoard.innerText += ". Your turn";messageBoardAnimation();
        playerTurn = true;
    } else {
        messageBoard.innerText += ". Enemy turn";messageBoardAnimation();
        playerTurn = false;
    }
});
socket.on('table update B', function(data){
    console.log("from server action: 'table update B'");
    data.gameTable.forEach(player => {
        fillGameTableB(player.name, data)
    });
    infoBoard.innerText = `Action point: ${data.gameTable.find(player => player.name === userName).actionPoints}`;
});

socket.on("giveCard", function(data){
    let card = cardsCollection.find(c => c.id == data.cardId);
    let new_card = document.createElement('div');
    new_card.className = 'hand-card';
    new_card.setAttribute('data-card-id', card.id);
    new_card.setAttribute('data-card-attack', card.atk);
    new_card.setAttribute('data-card-defence', card.def);
    new_card.style['background-image'] = 'url(\'./img/cards/'+ card.img + imageFormat + '\')';
    playerHand.append(new_card);
   
    // infoBoard.innerText = `Action points: fix it`;
});



// Once the Second Player has finished their Rear Wave Turn, they become First Player and a new Round starts,
// beginning with the NEW First Player’s Vanguard Wave Turn. If decks run out, continue play until a player wins.
function moveWaveCard(p){ // p - which players turn
    console.log(p)
    let playerField = document.querySelector('#player');
    let enemyPlayerField = document.querySelector('#enemy-player');
    if(document.querySelector('.firstplayer')) document.querySelector('.firstplayer').classList.remove('firstplayer')
    if(document.querySelector('.secondplayer')) document.querySelector('.secondplayer').classList.remove('secondplayer')
    
    let [cl, ecl] = (userName === p) ? ['firstplayer', 'secondplayer'] : ['secondplayer', 'firstplayer'];
    // let ecl = (userName === p) ? 'secondplayer' : 'firstplayer';
    switch (gameWave) {
        case 1: // Vanguard
                playerField.querySelector('.vanguard-wave').classList.add(cl);
                enemyPlayerField.querySelector('.vanguard-wave').classList.add(ecl);
            break;
        case 2: // Flank
                playerField.querySelector('.flank-wave').classList.add(cl);
                enemyPlayerField.querySelector('.flank-wave').classList.add(ecl);
            break;
        case 3: // Rear
                playerField.querySelector('.rear-wave').classList.add(cl);
                enemyPlayerField.querySelector('.rear-wave').classList.add(ecl);
            break;
        // default:break;
    }


}
socket.on("reciveCardsInfo", function(data){
    cardsCollection.push(...data.cardsInfo);
});
socket.on("flash msg", function(data){
    messageBoard.innerText = data.msgText;  
    messageBoardAnimation();
});
socket.on("battle begin", function(data){
    messageBoard.innerText = "battle begin";
    messageBoardAnimation();
    infoBoard.innerText = "Action 2";
    player_table = data.gameTable.find(user => user.name === userName).table;
    enemy_table = data.gameTable.find(user => user.name === enemyName).table;

    roundForPlayer = data.firstPlayer;

    if(data.firstPlayer === userName){   
        messageBoard.innerText += ". Your turn";messageBoardAnimation();
        playerTurn = true;
        wavePrefere = 0;
    } 
    if(data.secondPlayer === userName){
        messageBoard.innerText += ". Enemy turn";messageBoardAnimation();
        wavePrefere = 1;
        playerTurn = false;
    }
    console.log('round for: ' + roundForPlayer)
    moveWaveCard(roundForPlayer)

    players.forEach(player => {
        fillGameTableB(player, data);
    });

    controlPanel.style.visibility = "visible";
    new PanelAction(controlPanel);
    gameRoundEl = document.querySelector('.game-round');
    gameWaveEl = document.querySelector('.game-wave');
    gameTurnEl = document.querySelector('.game-turn');
    document.querySelectorAll('.action').forEach(e => e.classList.toggle('--show'));
});

socket.on("battle preparation", function(data){
    updateHand(playerHand, data.selfCards)
    updateHand(enemyHand, data.enemyCards)

    // for (let i = 0; i < data.cards.length; i++) {
    //     var new_card = document.createElement('div');
    //     new_card.className = 'hand-card';
    //     new_card.setAttribute('data-card-id', data.cards[i].id);
    //     new_card.style['background-image'] = 'url(\'./img/cards/'+ data.cards[i].img + imageFormat + '\')';
    //     new_card.classList.add('rotate-card');
    //     playerHand.append(new_card);
    // } 
});
socket.on("pick leader", function(data){
    if(userName !== data.player){
        let a = document.querySelector('#enemy-player').querySelector('.flank.middle');
        a.style['background-image'] = 'url(./img/shirt-3.jpg)';
    }
});

socket.on("next round", function(data){
    if(data.player === userName){
        messageBoard.innerText = "Your turn";
        messageBoardAnimation();
        playerTurn = true;
    } else {
        messageBoard.innerText = "Enemy turn";
        messageBoardAnimation();
        playerTurn = false;
    }
    infoBoard.innerText = "Action points: 2";
    roundForPlayer = data.player;
    gameRound = data.round;
    gameWave = data.wave;
    gameRoundEl.innerHTML = 'round: ' + data.round;
    gameWaveEl.innerHTML = 'wave: ' + data.wave;
    gameTurnEl.innerHTML = 'turn: ' + data.player;
    moveWaveCard(roundForPlayer);
});
socket.on("next wave", function(data){
    gameWave = data.wave;
    if(data.player === userName){
        messageBoard.innerText = "Your turn";
        messageBoardAnimation();
        playerTurn = true;
    } else {
        messageBoard.innerText = "Enemy turn";
        messageBoardAnimation();
        playerTurn = false;
    }
    gameWaveEl.innerHTML = 'wave: ' + data.wave;
    gameTurnEl.innerHTML = 'turn: ' + data.player;
    infoBoard.innerText = "Action points: 2";
    moveWaveCard(roundForPlayer);
});
socket.on("next turn", function(data){
    if(data.player === userName){
        messageBoard.innerText = "Your turn";
        messageBoardAnimation();
        playerTurn = true;
    } else {
        messageBoard.innerText = "Enemy turn";
        messageBoardAnimation();
        playerTurn = false;
    }
        
    gameTurnEl.innerHTML = 'turn: ' + data.player;
    infoBoard.innerText = "Action points: 2";
    // moveWaveCard(roundForPlayer);
});
socket.on("next game step", function(data){
    if(data.player === userName){
        messageBoard.innerText = "Your turn";
        messageBoardAnimation();
        playerTurn = true;
    } else {
        messageBoard.innerText = "Enemy turn";
        messageBoardAnimation();
        playerTurn = false;
    }
    infoBoard.innerText = "Action points: 2";
    roundForPlayer = data.player;
    gameRound = data.round;
    gameWave = data.wave;
    gameRoundEl.innerHTML = 'round: ' + data.round;
    gameWaveEl.innerHTML = 'wave: ' + data.wave;
    gameTurnEl.innerHTML = 'turn: ' + data.player;
    moveWaveCard(roundForPlayer);
});

socket.on("update", function(data){
    if(data.turnFor === userName){
        messageBoard.innerText = "Your turn";
        messageBoardAnimation();
        playerTurn = true;
    } else {
        messageBoard.innerText = "Enemy turn";
        messageBoardAnimation();
        playerTurn = false;
    }
    infoBoard.innerText = `Action points: ${data.self.actionPoint}`;
    roundForPlayer = data.roundFor;
    gameRound = data.round;
    gameWave = data.wave;
    gameTurn = data.turn;
    gameRoundEl.innerHTML = 'round: ' + data.round;
    gameWaveEl.innerHTML = 'wave: ' + data.wave;
    gameTurnEl.innerHTML = 'turn: ' + data.turn;
    moveWaveCard(roundForPlayer);

    updateSelf(data.self)
    updateEnemy(data.enemy)
    
});


function updateHand(userHand, hand){
    userHand.innerHTML = "";
    if(typeof hand === "number"){
        for (let i = 0; i < hand; i++) {
            let new_card = document.createElement('div');
            new_card.className = 'hand-card';
            new_card.style['background-image'] = 'url(./img/shirt-3.jpg)';
            userHand.append(new_card);
        }
    } else {
        for (let i = 0; i < hand.length; i++) {
            let new_card = document.createElement('div');
            new_card.className = 'hand-card';
            new_card.setAttribute('data-card-id', hand[i]);
            new_card.style['background-image'] = 'url(\'./img/cards/'+ hand[i] + imageFormat + '\')';
            // new_card.classList.add('rotate-card');
            userHand.append(new_card);
        }
    }
}

function updateTable(user, table){
    //table
    playerTable = JSON.parse(table);
    let playerUnitElem = document.getElementsByClassName(user)[0];
    for(f in playerTable){
        if(playerTable[f]){
            let line, side = "";
            [line, side] = getLineSideByFieldNum(f);
            let card = cardsCollection.find(c => c.id == playerTable[f].id);
            let cardElem = playerUnitElem.querySelectorAll(`[data-field-num=\"${f}\"`)[0];
            let cardAbility = card['ability'][line];
            if(playerTable[f].isAlive){
                if(cardElem.classList.contains('corps')){
                    cardElem.classList.remove('corps')
                }
                cardElem.style['background-image'] = 'url(\'./img/cards/s-'+ card.img + imageFormat + '\')';
                cardElem.dataset.cardId = playerTable[f].id;
                if(user === userName){
                    cardElem.querySelector('.card-action').style.display = 'flex';
                    cardElem.querySelector('.card-action').querySelector('.body-remove').style.display = 'none';
                    cardElem.querySelector('.card-action').querySelector('.attack').style.display = 'flex';
                    if(f !== "5"){
                        cardElem.querySelector('.card-action').querySelector('.move').style.display = 'flex';
                    }
                    if(cardAbility.type === "spell"){
                        cardElem.querySelector('.spell').style.display = 'flex';
                    }
                }
                
                cardElem.querySelector('.characteristic').style.display = 'flex';
                cardElem.querySelector('.characteristic__attack').innerText = (f == 5) ? card.leader_atk : card.atk;
                cardElem.querySelector('.characteristic__defence').innerText = (f == 5) ? card.leader_def : card.def;
                if(playerTable[f].blood){
                    cardElem.querySelector('.blood-token').style.display = 'flex';
                    cardElem.querySelector('.token').innerText = playerTable[f].blood;
                }
                
            } else {
                cardElem.dataset.cardId = playerTable[f].id;
                if(!cardElem.classList.contains('corps')){
                    cardElem.classList.add('corps')
                }
             
                cardElem.style['background-image'] = 'url(\'./img/shirt-3.jpg\')';
                if(user === userName){
                    cardElem.querySelector('.attack').style.display = 'none';
                    cardElem.querySelector('.move').style.display = 'none';
                    cardElem.querySelector('.body-remove').style.display = 'flex';                   
                }
                cardElem.querySelector('.blood-token').style.display = 'none';
                cardElem.querySelector('.characteristic').style.display = 'none';
            }
        } else {
            let cardElem = playerUnitElem.querySelectorAll(`[data-field-num=\"${f}\"`)[0];
            if(cardElem.hasAttribute('data-card-id')){
                cardElem.removeAttribute('data-card-id');
                cardElem.style.removeProperty('background-image');
                cardElem.querySelector('.characteristic').style.removeProperty('display');
                if(user === userName){
                    cardElem.querySelector('.card-action').style.removeProperty('display');
                }
            }
            
        }
    }
    console.log('updateSelf');
}
function updateEnemy(data){
    
    let enemyDeck = document.querySelector('.player-panel__enemy').querySelector('.deck')
    let enemyDiscard = document.querySelector('.player-panel__enemy').querySelector('.discard')
    updateHand(enemyHand, data.hand)
    // enemyHand.innerHTML = "";
    // for (let i = 0; i < data.hand; i++) {
    //     let new_card = document.createElement('div');
    //     new_card.className = 'hand-card';
    //     new_card.style['background-image'] = 'url(./img/shirt-3.jpg)';
    //     enemyHand.append(new_card);
    // }
    enemyDeck.innerText = `deck: ${data.deck}`
    enemyDiscard.innerText = `discard: ${data.discard}`
    // temp.innerText = `hand: ${data.hand} |  deck: ${data.deck} |  discard: ${data.discard}`
    updateTable(data.name, data.table)
}
function updateSelf(data){
    // hand
    updateHand(playerHand, data.hand)
    // playerHand.innerHTML = "";
    // for (let i = 0; i < data.hand.length; i++) {
    //     let new_card = document.createElement('div');
    //     new_card.className = 'hand-card';
    //     new_card.setAttribute('data-card-id', data.hand[i]);
    //     new_card.style['background-image'] = 'url(\'./img/cards/'+ data.hand[i] + imageFormat + '\')';
    //     new_card.classList.add('rotate-card');
    //     playerHand.append(new_card);
    // }
    
    // discard
    let playerDiscardEl = document.querySelector('.player-panel__self').querySelector('.discard');
    playerDiscardEl.innerText = 'discard ' + data.discard;
    
    // deck
    let playerDeckEl = document.querySelector('.player-panel__self').querySelector('.deck');
    playerDeckEl.innerText = 'deck ' +  data.deck;
    
    //table
    updateTable(data.name, data.table)
    // playerTable = JSON.parse(data.table);
   
}


socket.on("END game", function(data){
    messageBoard.innerText = 'battle is over: ' + data.win + " win! " + data.lose + " lose";
    messageBoardAnimation();
    document.querySelectorAll('.user-field').forEach(u => {
        u.style.opacity = '0.3';
    });
    

})
socket.on("player join room", function(data){
    let fieldPlayer = document.querySelector('#player');
    let fieldPlayerName = fieldPlayer.querySelector(".user-name");
    let enemyFieldPlayer = document.querySelector('#enemy-player');
    let enemyFieldPlayerName = enemyFieldPlayer.querySelector(".user-name");
    
    data.players.forEach( player => {
        if(player === userName){
            if(!fieldPlayer.classList.contains(player)){
                fieldPlayer.classList.add(player);
            }           
            fieldPlayerName.innerHTML = player
        } else {
            enemyFieldPlayer.classList.add(player);
            enemyFieldPlayerName.innerHTML = player
            enemyName =  player
        }    
    });
    players = data.players.slice()
});

$(document).ready(function () {
    joinroom = window.location.pathname.slice(1);
    infoBoard = document.querySelector('#infoBoard');  
    socket.open();
    if(cardsCollection.length == 0){
        socket.emit('requestCardsInfo');
    }  
    setTimeout(() => {
        socket.emit('joined to room', {userName: userName, room: joinroom});    
    }, 100);
    
    document.addEventListener('contextmenu', function(event){
        event.preventDefault();
        event.stopPropagation();
        return;
    });
    document.addEventListener('mouseup', function(event){
        if( (event.button ==2) && (cardInfoBlock) ){
            $('#card-info').css({
                display:"none"
            });
            cardInfoBlock = false;
        }
    });
    document.addEventListener('mousedown', function(event){
        if(event.button == 0){        
            let elem = event.target;

            if(elem.classList.contains("btn-ready")){
                console.log("btn-ready");
                socket.emit('ready new game')
                let r = document.querySelector('.ready-window')
                r.style.display = 'none';
                return
            }

            if(playerTurn){
                if(actionController.chosen){
                    if(actionController.playerAction === 'attack'){
                        if(elem.closest('#enemy-player')){
                            if(elem.classList.contains('card') && elem.getAttribute('data-card-id')){
                                if(!elem.classList.contains('corps')){
                                    console.log(event.target);
                                    actionController.target = elem.getAttribute('data-card-id');
                                    actionController.characterAttack();
                                    document.querySelector('body').style.cursor = "inherit";
                                    return;
                                } else {
                                    messageBoard.innerText = 'Select something alive!';
                                    messageBoardAnimation();
                                    return;
                                }

                            } else {
                                messageBoard.innerText = 'Select correct field!';
                                messageBoardAnimation();
                                return;
                            }       
                        } else {
                            messageBoard.innerText = 'Select enemy field!';
                            messageBoardAnimation(); 
                        }
                    } 

                    if(actionController.playerAction === 'move'){
                        if(elem.closest('#player')){
                            if(elem.classList.contains('card') && elem.getAttribute('data-field-num')){
                                actionController.target = elem.getAttribute('data-field-num');
                                actionController.moveHero();
                                document.querySelector('body').style.cursor = "inherit";
                                return;
                            } else {
                                messageBoard.innerText = 'Select correct field!';
                                messageBoardAnimation();
                            }   
                            return;  
                        } else {
                            messageBoard.innerText = 'Select your field!';
                            messageBoardAnimation();
                        }
                          
                    } 
                    // hire hero to field
                    if(!modalShow && elem.classList.contains('card')){    
                        if(elem.closest('#player')){
                            if(elem.parentNode.classList.contains("card_posable-target")){
                                actionController.hireHero(event.target);
                                document.querySelector('body').style.cursor = "inherit";
                                return;
                            } else {
                                messageBoard.innerText = 'Select correct field!';
                                messageBoardAnimation();
                            }
                        } else {
                            messageBoard.innerText = 'Select your field!';
                            messageBoardAnimation();
                            return;
                        }
                        
                    } 
                }
            }

            // if(elem.classList.contains('hand-card') && !modalShow){
            if(elem.classList.contains('hand-card')){
                // let card = cardsCollection.find(c => c.id == elem.dataset.cardId);

                // TODO: change data card
                let card_id = elem.getAttribute('data-card-id');
                actionController.chosen = card_id; //card.id;
                actionController.chosenDOMElem = elem;
                let img = document.querySelector('.review-img');                
                img.style.backgroundImage = 'url(\'./img/cards/'+ card_id + imageFormat + '\')';
                if(img.classList.contains('--rotate') && (wavePrefere !== -1)){ 
                    img.classList.toggle('--rotate');
                }
                gameTable.style.opacity = 0.3;
                document.querySelector('.modal').classList.add("modal__show");
                modalShow = true;
                return
            }

            if(modalShow && elem.classList.contains('modal')){
                document.querySelector('.modal').classList.remove("modal__show");
                gameTable.style.opacity = 1;
                actionController.chosen = 0;
                actionController.chosenDOMElem = "";
                modalShow = false;
                return
            }
            
            if(elem.classList.contains('action__hireLeader')){
                actionController.hireLeader();
                return
            }
            
            if(elem.classList.contains('action__hire')){
                actionController.getPossibleField('hire_hero');
                return
            }

            /*
                When you select the Attack Action, you will choose a
                Hero in your current Wave to make the Attack, as well
                as a target on the opposing Unit.
            */
            if(!actionController.playerAction && elem.classList.contains('attack')){
                // check current wave
                let card = elem.closest('.card');
                let wave = card.closest('.c-wave').classList[1];
                if(gameWaveDic.get(gameWave) === wave){
                    actionController.chosen = card.getAttribute('data-card-id');
                    actionController.chosenDOMElem = card;
                    actionController.playerAction = 'attack';
                    actionController.getPossibleField('attack');
                } else {
                    messageBoard.innerText = "hero attack only from current wave";
                    messageBoardAnimation();
                }
                return
            }
            if(!actionController.playerAction && elem.classList.contains('body-remove')){
                let card = elem.closest('.card');
                actionController.chosen = card.getAttribute('data-card-id');
                actionController.chosenField = card.getAttribute('data-field-num');
                actionController.chosenDOMElem = card;
                actionController.playerAction = 'body-remove';
                actionController.removeBody();
                return;
            }
            if(elem.classList.contains('move')){
                let card = elem.closest('.card')
                actionController.chosen = card.getAttribute('data-card-id');
                actionController.chosenDOMElem = card;
                actionController.playerAction = 'move';
                actionController.getPossibleField('move');
                return
            }
            if(modalShow && elem.classList.contains('review-img')){
                elem.classList.toggle('--rotate');
                return
            } 
            /*
                клик если
            */     
            //  была выбрана карта 
            if(actionController.playerAction){
                // тут выбор одной или нескольких из возможных целей ( в зависимости от действия)


            }
        }

        if(event.button == 2){
            if(actionController.select){
                [].forEach.call(actionController.possibleTarget, el => {
                    el.classList.remove('card_posable-target');
                });
                document.querySelector('body').style.cursor = "inherit";
                actionController.select = false;
                actionController.action = null;
                actionController.playerAction = "";
                actionController.chosenDOMElem = null;
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            let elem = event.target;
            if(elem.classList.contains('card')){
                elem = elem.closest('.card-holder');
            }
            if(!elem.classList.contains('card-holder')&&!elem.classList.contains('hand-card')){
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            let card;  
            let left, top, x, y;
            if(event.target.closest('#player-hand')){
                x = 0;
                y = 330;
                card = elem.dataset.cardId;
                left = "40%";
                top = "60%";
            } else {
                y = 0;
                x = (event.target.closest('.player').id === "player") ? 0 : 250;
                card = elem.firstChild.dataset.cardId;
                left = event.pageX - x + 10 + 'px'; 
                top = event.pageY - y + 10 + 'px';
            }
            if(card){
                let info = cardsCollection.find(c => c.id == card);

                if(event.target.classList.contains("flank") && event.target.classList.contains("middle")){
                    $('#card-info .card-info__special').css('opacity', 1);
                    $('#card-info .card-info__special').text(info.leader_special);
                    $('#card-info .card-info__name').text(info.leader);
                    $('#card-info .card-info__atk').text(info.leader_atk);
                    $('#card-info .card-info__def').text(info.leader_def);
                    $('#card-info .card-info__vanguard').text("");
                    $('#card-info .card-info__flank').text("");
                    $('#card-info .card-info__rear').text("");
                } else {
                    $('#card-info .card-info__name').text(info.name);
                    $('#card-info .card-info__atk').text(info.atk);
                    $('#card-info .card-info__def').text(info.def);
                    $('#card-info .card-info__vanguard').text(info.vanguard);
                    $('#card-info .card-info__flank').text(info.flank);
                    $('#card-info .card-info__rear').text(info.rear);

                    if(event.target.classList.value.indexOf('flank') !== -1){
                        $('#card-info .card-info__flank').css('opacity', 1);
                    } else {
                        $('#card-info .card-info__flank').css('opacity', 0.2);
                    } 
    
                    if(event.target.classList.value.indexOf('vanguard') !== -1){
                        $('#card-info .card-info__vanguard').css('opacity', 1);
                    } else {
                        $('#card-info .card-info__vanguard').css('opacity', 0.2);
                    } 
                    
                    if(event.target.classList.value.indexOf('rear') !== -1){
                        $('#card-info .card-info__rear').css('opacity', 1);
                    } else {
                        $('#card-info .card-info__rear').css('opacity', 0.2);
                    }

                    $('#card-info .card-info__special').text(info.special);
                    $('#card-info .card-info__special').css('opacity', 0.2);

                }               

                $('#card-info').css({
                    display:"flex",
                    top: top,
                    left: left
                });
                cardInfoBlock = true;
            }
        }
    });
});
