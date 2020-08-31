console.log('LALALALALALLALALALALALALLAA');

class PanelAction {
    constructor(elem) {
      this._elem = elem;
      elem.onclick = this.onClick.bind(this); // (*)
    }
    pickCard(){
        console.log('pickCard')
        socket.emit('requestCard');
    }
    hireHero() {
      console.log('hire hero');
    }
    attack() {
      console.log('attack');
    }
    spell() {
        console.log('spell');
    }
    special() {
        console.log('special');
    }
    order() {
        console.log('order');
    }
    removeCorps() {
        console.log('removeCorps');
    }
    move() {
        console.log('move');
    }
    castling() {
        console.log('castling');
    }

    onClick(event) {
      let action = event.target.dataset.action;
      if (action) {
        this[action]();
      }
    };
}





const controlPanel = document.getElementById("control-panel");
const playerHand = document.getElementById('player-hand');  
const messageBoard =  document.getElementById('console');  

let cardsImage = [];
// random user name
// let userName = Math.random().toString(36).substring(7); //
let userName = localStorage.getItem('user') ? localStorage.getItem('user') : 'anon' ;

let enemyName = "";

// var cards_images = new Map();
var joinroom;
let table = { vanguard: {l: '', m: '', r: ''},flank: {l: '', m: '', r: ''},rear: {l: '', m: '', r: ''}}
let enemy_table = Object.assign({}, table);
let player_table = Object.assign({}, table);
var players = [];
var pickLeader = null;
const socket = io({
    autoConnect: false
});




socket.on('join', function(){});

socket.on('user_join', function(roomInfo) {
    console.log('user ' + roomInfo.userId + ' ' + roomInfo.userName + ' join, [' + roomInfo.users + ']');
});

socket.on('battle begin', function(data) {
    console.log('battle begin');
    player_table = data.gameTable.find(user => user.name === userName).table;
    enemy_table = data.gameTable.find(user => user.name === enemyName).table;

    players.forEach(player => {
        let a = document.getElementsByClassName(player)[0];
        let b = a.getElementsByClassName("vanguard-wave")[0];
        if(data.firstPlayer === player){
            b.style['background-image'] = 'url(./img/firstplayer.jpg)';
        } else {
            b.style['background-image'] = 'url(./img/secondplayer.jpg)';
        }
        let c = a.getElementsByClassName('card');

        // should reduce?
        let d = data.gameTable.find(user => user.name === player).table;
        for(line in d){ 
            for(place in d[line]){
                if(d[line][place] !== ""){                   
                    e = a.getElementsByClassName(line + '__' + place)[0];
                    e.style['background-image'] = 'url(\'./img/cards/s-'+ cardsImage[d[line][place]] +'.jpg\')';
                    // console.log(player_table[line][place]);
                }
            }
        }
        
        
    });

    pickLeader.remove();
    rotatedCards = document.getElementsByClassName('hand-card');
    [].forEach.call(rotatedCards, el => {
        el.classList.remove('rotate-card');
    });
    controlPanel.style.visibility = "visible";
    new PanelAction(controlPanel);
    // if(data.gameTable.find(user => user.name === userName)){ 
    console.log(data.gameTable);

});

socket.on('selfJoin', function(data) { // data.myname data.cards
    const fieldPlayer = document.getElementById('player');
    fieldPlayer.classList.add(data.myname);
    let fieldPlayerName = fieldPlayer.getElementsByClassName("user-name")[0];
    fieldPlayerName.innerHTML = data.myname;
    cardsImage = data.cards;
    players.push(data.myname);
});

socket.on('enemyJoin', function(data) { 
    const fieldPlayer = document.getElementById('enemy-player');
    fieldPlayer.classList.add(data.enemy);
    let fieldPlayerName = fieldPlayer.getElementsByClassName("user-name")[0];
    fieldPlayerName.innerHTML = data.enemy;
    enemyName = data.enemy;
    players.push(data.enemy);
});
socket.on('prepare new battle', function(data) { // { cards: this.player hand });
    // let container = document.getElementById('player-hand');    
    for (let i = 0; i < data.cards.length; i++) {
        var new_card = document.createElement('div');
        new_card.className = 'hand-card';
        new_card.setAttribute('data-hand-card', data.cards[i]);
        new_card.style['background-image'] = 'url(\'./img/cards/'+ cardsImage[data.cards[i]] +'.jpg\')';
        new_card.classList.add('rotate-card');
        new_card.addEventListener('click', function(e){
            e.preventDefault()
            let card = e.currentTarget.getAttribute('data-hand-card');
            socket.emit('choosen leader', card);
            e.currentTarget.style['margin-top'] = '-100px';
            pickLeader = e.currentTarget;
        });
        playerHand.append(new_card);
    } 
});

// socket.emit('requestCard', function(){});
socket.on('giveCard', function(data){
    let new_card = document.createElement('div');
    new_card.className = 'hand-card';
    new_card.setAttribute('data-data-hand-card', data.id);
    new_card.setAttribute('data-card-attack', data.atk);
    new_card.setAttribute('data-card-defence', data.def);
    new_card.style['background-image'] = 'url(\'./img/cards/'+ data.img +'.jpg\')';

    //must be delegate event
    new_card.addEventListener('click', function(e){
        e.preventDefault()
        let card = e.currentTarget.getAttribute('data-hand-card');
        console.log(card);
    });
    playerHand.append(new_card);
});

socket.on('flash msg', function(data){
    messageBoard.innerText = data.msgText;
});

$(document).ready(function () {
    joinroom = window.location.pathname.slice(1);
    
    $(document).on('click', '.js-ready-game', function(event){      
        socket.open();
        setTimeout(() => {
            // send server request to join with user & room names data
            socket.emit('ready to game', {userName: userName, room: joinroom});    
        }, 1000);
        
        event.currentTarget.style.display = 'none';
    });



    // $(document).on('click', '.player-action', function(){

    // });
});

  /*  
    socket.on('leadersingame', function(data){
        $('#enemy-player').find('.flank__middle').css('background-image', 'url(\'./img/'+ cards_images[data.enemy] +'.jpg\')');
        $('#player').find('.flank__middle').css('background-image', 'url(\'./img/'+ cards_images[data.my] +'.jpg\')');
        if(data.diced2 == 1){ 
            $('#enemy-player').find('.vanguard-wave').css('background-image', 'url(\'./img/firstplayer.jpg\')');
            $('#player').find('.vanguard-wave').css('background-image', 'url(\'./img/secondplayer.jpg\')');
        } else {
            $('#player').find('.vanguard-wave').css('background-image', 'url(\'./img/firstplayer.jpg\')');
            $('#enemy-player').find('.vanguard-wave').css('background-image', 'url(\'./img/secondplayer.jpg\')');
        }
        $('#player-hand').find('.pl-h').removeClass('rotate-card')
    });
    socket.on('add-card', function(data){
        var container = document.getElementById('player-hand');
        var new_card = document.createElement('div');
        new_card.className = 'pl-h';
        new_card.style['background-image'] = 'url(\'./img/'+ data.img +'.jpg\')';
        new_card.addEventListener('click', function(){
            console.log(this);
        });
        container.append(new_card);
    });
    socket.on('init_game', function(data){
        console.log(data);
        cards_images = data.cards_images;
        var container = document.getElementById('player-hand');
        for (let i = 0; i < data.cards.length; i++) {
            var new_card = document.createElement('div');
            new_card.className = 'pl-h md-trigger';
            new_card.setAttribute('data-modal', "modal-16");
            new_card.setAttribute('data-hand-card', data.cards[i]);
            new_card.style['background-image'] = 'url(\'./img/'+ cards_images[data.cards[i]] +'.jpg\')';
            new_card.classList.add('rotate-card');
            new_card.addEventListener('click', function(){
                document.getElementById('cardimgmodal').style['background-image'] = 'url(\'./img/'+ cards_images[data.cards[i]] +'.jpg\')';
                document.getElementById('cardimgmodal').setAttribute('data-card', data.cards[i]);
            });
            container.append(new_card);
        }
        
    });

*/