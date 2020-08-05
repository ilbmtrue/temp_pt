console.log('LALALALALALLALALALALALALLAA');

var cards_images = new Map();
var joinroom;
var enemy_table = {c: '', n: '', ne: '', e: '', se: '', s: '', sw: '', w: '', nw: '' }
var player_table = {c: '', n: '', ne: '', e: '', se: '', s: '', sw: '', w: '', nw: '' }

const socket = io({
    autoConnect: false
});
socket.on('join', function(){});
socket.on('user_join', function(roomInfo) {
    console.log('user ' + roomInfo.userId + ' ' + roomInfo.userName + ' join, [' + roomInfo.users + ']');
});
socket.on('serverHello', function(data) {
   console.log('server: hello ' + data);
});
    

$(document).ready(function () {
    joinroom = window.location.pathname.slice(1);

    $(document).on('click', '.js-ready-game', function(event){      
        socket.open();
        setTimeout(() => {
            socket.emit('ready to game', joinroom);    
        }, 1000);
        
        event.currentTarget.style.display = 'none';
    });

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