var upgrade = require('../').upgrade
  , server = require('http').createServer();
  
server.on('request', function () {
  thisFunctionClearlyDoesNotExist();
});

server.listen(3000);

upgrade(server);

console.log('listening at http://localhost:3000');