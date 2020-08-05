if(!socket){
    console.log('Socket off I WILL MAKE THIS!!');
    
} else {
    socket.disconnect();
    console.log('Socket is already ON');
}
var socket = io('/admin');

$(document).ready(function () {
    socket.emit('iWantInfo');
    setInterval(() => {
        socket.emit('join room');    
    }, 1500);
});



// const playerInfo = document.getElementById('player-list');
const roomInfo = document.getElementById('rooms-list');

socket.on('getInfo', function(data){
    console.log(data);
});
socket.on('reconnect_error', function(){
    socket.disconnect();
});


socket.on('someone ready', function(data){
    // console.log(data);
    var r = document.querySelectorAll("[data-room='"+ data["room"] +"']");

    if(r.length === 0){
        var newRoom = document.createElement('div');
        var userList = document.createElement('div'); 
        newRoom.className = 'room-name';
        newRoom.setAttribute('data-room', data["room"]);
        newRoom.innerHTML = "ROOM: " + data["room"];
        roomInfo.append(newRoom);  
        roomInfo.append(userList);    
        r = document.querySelectorAll("[data-room='"+ data["room"] +"']");
    }

    var newPlayer = document.createElement('div');  
    newPlayer.className = 'player';
    newPlayer.innerHTML = data["user"];
    r[0].append(newPlayer);
      
    
});

