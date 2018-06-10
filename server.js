/////////////////////////////
//   Init Express Server   //
/////////////////////////////
var express = require('express');
var app = express();
var serv = require('http').Server(app);
var port = process.env.PORT || 2000;

app.get('/', function(req, res) {
  //res.sendFile(__dirname + '/client/index.html');
  res.redirect('/client');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(port);

console.log('Server Started Listening on Port 2000');


////////////////////////
//   Init Socket.io   //
////////////////////////
var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Player = function (id) {
  var self = {
    x:(1000/2)-(96/2),
    y:(750/2)-(96/2),
    id:id,
    number:"" + Math.floor(10 * Math.random()),
    pressingRight:false,
    pressingLeft:false,
    pressingUp:false,
    pressingDown:false,
    maxSpd:5,
    pDir:1,
  }
  self.updatePosition = function() {
    if(self.pressingRight) {
      self.x += self.maxSpd;
      self.pDir = 10;
    }      
    if(self.pressingLeft){
      self.x -= self.maxSpd;
      self.pDir = 7;
    }
      
    if(self.pressingUp) {
      self.y -= self.maxSpd;
      self.pDir = 1;
    }
      
    if(self.pressingDown) {
      self.y += self.maxSpd;
      self.pDir = 4;
    }
      
  }
  return self;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;
  
  var player = Player(socket.id);
  PLAYER_LIST[socket.id] = player;
  
  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
  });
  
  socket.on('keyPress', function(data){
    if(data.inputId === 'left'){
      player.pressingLeft = data.state;
      //player.pDir = 9;
    }
    else if(data.inputId === 'right'){
      player.pressingRight = data.state;
      //player.pDir = 6;
    }
    else if(data.inputId === 'up'){
      player.pressingUp = data.state;
      //Player.pDir = 3;
    }
    else if(data.inputId === 'down'){
      player.pressingDown = data.state;
      //player.pDir = 1;
    }
  });
  
});


////////////////////////
//   Main Game Loop   //
////////////////////////
setInterval(function(){
  var pack = [];
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    player.updatePosition();
    pack.push({
      x:player.x,
      y:player.y,
      number:player.number,
      pDir:player.pDir
    });
  }
  
  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
    socket.emit('newPositions', pack);
  }
  
},1000/60);