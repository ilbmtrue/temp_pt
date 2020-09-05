console.log('LALALALALALLALALALALALALLAA');

class PlayerAction 
{   
    constructor() { 
        this.target = null;
        this.chosen = null;
        this.chosenDOM = null;
        this.possibleTarget = null;
    }
    hireHero(tableField){
        if(playerTurn){
            socket.emit('hireHero', {cardId: this.chosen, field: tableField.classList[1]});
            [].forEach.call(this.possibleTarget, el => {
                el.classList.remove('card_posable-target');
            });
        } else {
            messageBoard.innerText = 'Not your turn!';
            messageBoardAnimation();
        }          
    }
    hireLeader(){
        socket.emit('chosen leader', this.chosen);
        let card = cardsCollection.find(c => c.id == this.chosen);
        let a = document.querySelector('#player').querySelector('.flank__m');
        a.style['background-image'] = 'url(\'./img/cards/s-'+ card.img +'.jpg\')';
        this.chosenDOM.remove();
        document.querySelector('.modal').classList.remove("modal__show");
        gameTable.style.opacity = 1;
        modalShow = false;
        rotatedCards = document.getElementsByClassName('hand-card');
        [].forEach.call(rotatedCards, el => {
            el.classList.remove('rotate-card');
        });
    }
    selectField(){
        if(!playerTurn){
            this.chosen = "";
            this.chosenDOM = null;
            messageBoard.innerText = 'Not your turn!';                
            messageBoardAnimation();
        } else {
            document.querySelector('body').style.cursor = "crosshair";         
            switch (wave) {
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
                el.classList.add('card_posable-target');
            });
        }               
        document.querySelector('.modal').classList.remove("modal__show");
        gameTable.style.opacity = 1;
        modalShow = false;
    }

}
let action = new PlayerAction();


class PanelAction {
    constructor(elem) {
      this._elem = elem;
      elem.onclick = this.onClick.bind(this); // (*)
    }
    pickCard(){
        if(playerTurn){
            socket.emit('requestCard');
        } else {
            messageBoard.innerText = 'Not your turn!';
            messageBoardAnimation();
        }
        
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




const cardsCollection = [];
const controlPanel = document.getElementById("control-panel");
const playerHand = document.getElementById('player-hand');  
const messageBoard =  document.getElementById('messageBoard');  
const infoBoard =  document.getElementById('infoBoard');  
const gameTable = document.getElementById('gameTable'); 

let modalShow = false;
let chosenCard = 0;
let chosenCardDOM = {};
let chosenField = "";

let cardInfoBlock = false;
let cardsImage = [];

// random user name
// let userName = Math.random().toString(36).substring(7); //
let userName = localStorage.getItem('user') ? localStorage.getItem('user') : 'anon' ;
let enemyName = "";
let playerTurn = false;

var joinroom;
let table = { vanguard: {l: '', m: '', r: ''},flank: {l: '', m: '', r: ''},rear: {l: '', m: '', r: ''}}
let enemy_table = Object.assign({}, table);
let player_table = Object.assign({}, table);
var players = [];
var pickLeader = null;
const socket = io({
    autoConnect: false
});
let wavePrefere = -1;
let round = 0;
let wave = 0;

const gameTurnArr = [   ['#player .vanguard', '#player .flank', '#player .rear'],
                        ['#enemy-player .vanguard', '#enemy-player .flank', '#enemy-player .rear']];



function messageBoardAnimation(){
    messageBoard.classList.remove('flash--active');
    void messageBoard.offsetWidth;
    messageBoard.classList.add('flash--active');
}


socket.on('join', function(){});
socket.on('user_join', function(roomInfo) {
    console.log('user ' + roomInfo.userId + ' ' + roomInfo.userName + ' join, [' + roomInfo.users + ']');
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
        new_card.setAttribute('data-card-id', data.cards[i]);
        new_card.style['background-image'] = 'url(\'./img/cards/'+ cardsImage[data.cards[i]] +'.jpg\')';
        new_card.classList.add('rotate-card');
        // new_card.addEventListener('click', function(e){
        //     e.preventDefault()
        //     let card = e.currentTarget.getAttribute('data-card-id');
        //     socket.emit('chosen leader', card);
        //     e.currentTarget.style['margin-top'] = '-100px';
        //     pickLeader = e.currentTarget;
        // });
        playerHand.append(new_card);
    } 
});
socket.on('table update', function(data){
    console.log(data);
    players.forEach(player => {
        let a = document.getElementsByClassName(player)[0];
        // let c = a.getElementsByClassName('card');
        // should reduce?
        let d = data.gameTable.find(user => user.name === player).table;
        for(line in d){ 
            for(place in d[line]){
                if(d[line][place] !== ""){       
                    let card = cardsCollection.find(c => c.id == d[line][place]);            
                    e = a.getElementsByClassName(line + '__' + place)[0];
                    e.style['background-image'] = 'url(\'./img/cards/s-'+ card.img +'.jpg\')';
                    e.dataset.cardId = d[line][place];
                    e.querySelector('.characteristic__attack').innerText = card.atk;
                    e.querySelector('.characteristic__defence').innerText = card.def;
                    // console.log(player_table[line][place]);
                }
            }
        }   
        
    });
    if(action.chosenDOM){
        action.chosenDOM.remove();
    }
    // if(chosenCardDOM){
    //     chosenCardDOM.remove();
    // }
    
});

socket.on('pick leader', function(data) {
    if(players[1] === data.player){
        let a = document.querySelector('#enemy-player').querySelector('.flank__m');
        a.style['background-image'] = 'url(./img/shirt-3.jpg)';
    }
});
socket.on('battle begin', function(data) {
    messageBoard.innerText = "battle begin";
    messageBoardAnimation();
    infoBoard.innerText = "Action 2";
    player_table = data.gameTable.find(user => user.name === userName).table;
    enemy_table = data.gameTable.find(user => user.name === enemyName).table;
    
    if(data.firstPlayer === userName){
        document.querySelector('#player').querySelector('.vanguard-wave').style['background-image'] = 'url(./img/firstplayer.jpg)';
        document.querySelector('#enemy-player').querySelector('.vanguard-wave').style['background-image'] = 'url(./img/secondplayer.jpg)';
        messageBoard.innerText += ". Your turn";
        messageBoardAnimation();
        playerTurn = true;
        wavePrefere = 0;
    } else {
        document.querySelector('#player').querySelector('.vanguard-wave').style['background-image'] = 'url(./img/secondplayer.jpg)';
        document.querySelector('#enemy-player').querySelector('.vanguard-wave').style['background-image'] = 'url(./img/firstplayer.jpg)';
        messageBoard.innerText += ". Enemy turn";
        messageBoardAnimation();
        wavePrefere = 1;
    }

    players.forEach(player => {
        let a = document.getElementsByClassName(player)[0];
        let c = a.getElementsByClassName('card');
        
        // should reduce?
        let d = data.gameTable.find(user => user.name === player).table;
        for(line in d){ 
            for(place in d[line]){
                if(d[line][place] !== ""){       
                    let card = cardsCollection.find(c => c.id == d[line][place]);            
                    e = a.getElementsByClassName(line + '__' + place)[0];
                    e.style['background-image'] = 'url(\'./img/cards/s-'+ cardsImage[d[line][place]] +'.jpg\')';
                    e.dataset.cardId = d[line][place];
                    e.querySelector('.characteristic__attack').innerText = card.atk;
                    e.querySelector('.characteristic__defence').innerText = card.def;
                }
            }
        }   
    });

    controlPanel.style.visibility = "visible";
    new PanelAction(controlPanel);
    wave = 1;
    document.querySelectorAll('.action').forEach(e => e.classList.toggle('--show'));
    newTurn(round, wavePrefere);
});
// socket.emit('requestCard', function(){});
socket.on('giveCard', function(data){
    let new_card = document.createElement('div');
    new_card.className = 'hand-card';
    new_card.setAttribute('data-card-id', data.id);
    new_card.setAttribute('data-card-attack', data.atk);
    new_card.setAttribute('data-card-defence', data.def);
    new_card.style['background-image'] = 'url(\'./img/cards/'+ data.img +'.jpg\')';
    playerHand.append(new_card);
});
socket.on('transfer turn', function(data){
    if(data.turnFor === userName){
        infoBoard.innerText = "Action 2";
    }

});
// socket.on('next turn', function(data){

// });
socket.on('flash msg', function(data){
    messageBoard.innerText = data.msgText;  
    messageBoardAnimation();
});
socket.on('reciveCardsInfo', function(data){
    cardsCollection.push(...data.cardsInfo);
});

function newTurn(r,w){
    let wave = document.querySelector(gameTurnArr[w][r]);
    wave.classList.add('wave--active');
}


$(document).ready(function () {
    
    joinroom = window.location.pathname.slice(1);

    $(document).on('click', '.js-ready-game', function(event){      
        socket.open();
        setTimeout(() => {
            socket.emit('ready to game', {userName: userName, room: joinroom});    
        }, 100);
        if(cardsCollection.length == 0){
            socket.emit('requestCardsInfo')
        }       
        event.currentTarget.style.display = 'none';
    });



    document.addEventListener('contextmenu', function(event){
        let elem = event.target;
        if(elem.classList.contains('card')){
            elem = elem.closest('.card-holder');
        }
        if(!elem.classList.contains('card-holder')&&!elem.classList.contains('hand-card')){
            return;
        }
        event.preventDefault();
        event.stopPropagation();
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
        // console.log('event.target'); console.log(event.target);
        // console.log('event.currentTarget'); console.log(event.currentTarget);
        if(event.button == 0){
            let elem = event.target;


            if(action.chosen){
                if(!modalShow && elem.classList.contains('card') ){               
                    let elem = event.target;
                    elem = elem.closest('.card-holder');
                    document.querySelector('body').style.cursor = "inherit";
                    action.hireHero(event.target);               
                    return
                }
            }
            // if(!modalShow && chosenCard && elem.classList.contains('card') ){
            //     let elem = event.target;
            //     elem = elem.closest('.card-holder');
            //     document.querySelector('body').style.cursor = "inherit";
            //     action.hireHero(chosenCard, event.target, chosenCardDOM);               
            //     return
            // }


            if(elem.classList.contains('hand-card') && !modalShow){
                let card = cardsCollection.find(c => c.id == elem.dataset.cardId);
                // chosenCard = card.id;
                action.chosen = card.id;
                action.chosenDOM = elem;
                let img = document.querySelector('.review-img');                
                img.style.backgroundImage = 'url(\'./img/cards/'+ card.img +'.jpg\')';
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
                // chosenCard = 0;
                action.chosen = 0;
                modalShow = false;
                return
            }
            
            if(elem.classList.contains('action__hireLeader')){
                action.hireLeader();
                return
            }
            
            if(elem.classList.contains('action__hire')){
                action.selectField();
            }

            if(elem.classList.contains('review-img')){
                elem.classList.toggle('--rotate');
                return
            }
        }

        if(event.button == 2){
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
                $('#card-info .card-info__name').text(info.name);
                $('#card-info .card-info__atk').text(info.atk);
                $('#card-info .card-info__def').text(info.def);
                $('#card-info .card-info__vanguard').text(info.vanguard);
                $('#card-info .card-info__flank').text(info.flank)
                $('#card-info .card-info__rear').text(info.rear)
                if(event.target.classList.value.indexOf('vanguard') !== -1){
                    $('#card-info .card-info__vanguard').css('opacity', 1);
                } else if(event.target.classList.value.indexOf('flank') !== -1){
                    $('#card-info .card-info__flank').css('opacity', 1);
                } else if(event.target.classList.value.indexOf('rear') !== -1){
                    $('#card-info .card-info__rear').css('opacity', 1);
                }
                $('#card-info .card-info__special').text(info.special);
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
    // must delegate event 
    // let handCard = $('.hand-card');
    
    // $('.card-holder').each(function (i, el) {    
    //     $(el).mousedown(function(e){
    //         e.preventDefault();
    //         if(e.button == 2){
    //             let card = el.firstChild.dataset.cardId;
    //             let info = cardsCollection.find(c => c.id == card);
    //             let left, top;
    //             let x = (this.closest('.player').id === "player") ? 0 : 250;
    //             let y = (this.closest('#player-hand')) ? 200 : 0;
    //             left = e.pageX - x + 10 + 'px'; 
    //             top = e.pageY + y + 10 + 'px';         
    //             $('#card-info .card-info__name').text(info.name);
    //             $('#card-info .card-info__atk').text(info.atk);
    //             $('#card-info .card-info__def').text(info.def);
    //             $('#card-info .card-info__vanguard').text(info.vanguard);
    //             $('#card-info .card-info__flank').text(info.flank);
    //             $('#card-info .card-info__rear').text(info.rear);
    //             $('#card-info .card-info__special').text(info.special);
    //             $('#card-info').css({
    //                 display:"flex",
    //                 top: top,
    //                 left: left
    //             });
    //         }
    //     }).contextmenu(function() {
    //         return false;
    //     });
    //     $(el).mouseup(function(){
    //         $('#card-info').css({
    //             display:"none"
    //         });
    //     });
    // });
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


    // additional bloack width card info on hover
    /*
    $('.card-holder').each(function (i, el) {    
        $(el).mousemove(function(e){
            console.log('on move');
            let left, top;
            let parentOffset = $(this).parent().offset();
            let X = e.pageX - parentOffset.left;
            let Y = e.pageY - parentOffset.top;
            left = e.pageX  + 10 + 'px'; 
            top = e.pageY  + 10 + 'px'; 
            // left = X  + 10 + 'px'; 
            // top = Y  + 10 + 'px'; 
            $('#card-info').css({
                display:"flex",
                top: top,
                left: left
            });
        });
        $(el).mouseout(function(){
            console.log('move off');
            $('#card-info').css({
                display:"none"
            });
        });
    });
    */




    /*
    document.addEventListener("mousedown", function(e){
        if( (e.button == 2) && 
            (e.target.parentNode.classList.contains("card") || 
            e.target.classList.contains("hand-card")) ){
            e.preventDefault();
            e.stopPropagation();

            let card = el.firstChild.dataset.cardId;
            let info = cardsCollection.find(c => c.id == card);
            let left, top;
            let x = (this.closest('.player').id === "player") ? 0 : 250;
            left = e.pageX - x + 10 + 'px'; 
            top = e.pageY  + 10 + 'px';
            
            $('#card-info .card-info__name').text(info.name);
            $('#card-info .card-info__atk').text(info.atk);
            $('#card-info .card-info__def').text(info.def);
            $('#card-info .card-info__vanguard').text(info.vanguard);
            $('#card-info .card-info__flank').text(info.flank);
            $('#card-info .card-info__rear').text(info.rear);
            $('#card-info .card-info__special').text(info.special);
            $('#card-info').css({
                display:"flex",
                top: top,
                left: left
            });
            cardInfoBlock = true;
        }
    });
    document.addEventListener("mouseup", function(e){
        if( (e.button == 2) && (cardInfoBlock) ){
            $('#card-info').css({
                display:"none"
            });
            cardInfoBlock = false;
        }
    });
    */