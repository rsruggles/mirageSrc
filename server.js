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
    number:"" + Math.floor(14 * Math.random()),
    pressingRight:false,
    pressingLeft:false,
    pressingUp:false,
    pressingDown:false,
    maxSpd:4,
    pDir:4,
    pAnim:-1,
    isMoving:false
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
  self.updateAnimation = function () {
    if (self.pAnim === 0) {
      self.pAnim = -1;
    } else if (self.pAnim === -1) {
      self.pAnim = 1;
    } else if (self.pAnim === 1) {
      self.pAnim = 0;
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
      player.isMoving = data.state;
    }
    else if(data.inputId === 'right'){
      player.pressingRight = data.state;
      player.isMoving = data.state;
    }
    else if(data.inputId === 'up'){
      player.pressingUp = data.state;
      player.isMoving = data.state;
    }
    else if(data.inputId === 'down'){
      player.pressingDown = data.state;
      player.isMoving = data.state;
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
      pDir:player.pDir,
      pAnim:player.pAnim
    });
  }
  
  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
    socket.emit('newPositions', pack);
  }
  
},1000/60);

////////////////////////
//   Main Anim Loop   //
////////////////////////
setInterval(function(){
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    if (player.isMoving) {
      player.updateAnimation();
    } else {
      player.pAnim = 0;
    }
  }  
},1000/10);