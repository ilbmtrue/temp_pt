var crypto = require('crypto');
module.exports = function(app) {
    app.get('/{8}*', (req,res) => {
        if(req.url.length === 10){
            console.log(req.url);
        } else {
            console.log('asdasd');
        }
    });
    app.get('/admin', (req,res) => {
        res.sendFile(__dirname + '/dist/admin/adminPage.html');
    });
    app.get('/', (req,res) => {
        res.sendFile(__dirname + '/dist/join-page.html');
    });
    
    app.post('/joingame', (req,res) => {
        if((req.body.room !== undefined) || (req.body.name !== undefined)){
            let username = req.body.name;
            let roomnum = req.body.room;
            game_token = crypto.createHmac('sha256', roomnum).update('salty').digest('hex').slice(55);          
            app.get('/'+game_token, (req,res) => {
                console.log('route.js | http connect to room: ' + game_token + ' room#' + roomnum + ' user: ' + username);
                res.sendFile(__dirname + '/dist/battle.html');
                // res.sendFile(__dirname + '/dist/game.html');
            });
            res.status(200).send(game_token);
        }
    });


  }