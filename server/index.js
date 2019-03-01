const app = require('express')();
// const http = require('http').Server(app);
const io = require('socket.io')();

let mean = null, variance = null, signalFaker = null

// Standard Normal variate using Box-Muller transform.
const randn = () => {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  mean = randn() * 1000;
  variance = randn() * 50;
  clearInterval(signalFaker);
  signalFaker = setInterval(() => {
    io.emit('signal', randn() * variance + mean);
  }, 50);
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});
//
// http.listen(5000, function(){
//   console.log('listening on *:5000');
// });

io.listen(8000)
