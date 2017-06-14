var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var users = [];
var connections = [];

var apiai = require('apiai');

var appai = apiai('e07fa0eb248d45c2aa25642e10e89838');

server.listen(process.env.PORT || 3000);
console.log('server running....');

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);

  socket.on('disconnect', function (data) {
    users.splice(users.indexOf(socket.username), 1);
    updateUsernames();
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected: %s sockets connected', connections.length);
  });

  socket.on('send message', function (data) {
    console.log(data);
    io.sockets.emit('new message', { msg: data, username: socket.username });
    if (~data.indexOf("@A")){
      passMessageToAI(data);
    }
  });

  socket.on('new user', function (data, callback) {
    callback(true);
    socket.username = data;
    users.push(socket.username);
    updateUsernames();
  });

  function updateUsernames() {
    console.log('' + users);
    io.sockets.emit('get users', users);
  }

  function passMessageToAI(msg) {
    var request = appai.textRequest(msg, {
      sessionId: 'SESSION_ID_AI'
    }).on('response', function (response) {
      console.log('response :',response.result.fulfillment.speech);
      io.sockets.emit('new message', { msg: response.result.fulfillment.speech, username: 'API.AI' });
    }).on('error', function (error) {
      console.log('error:',error);
    });

    request.end();
  }

});
