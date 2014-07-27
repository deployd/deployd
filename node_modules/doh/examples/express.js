var upgrade = require('../').upgrade
  , express = require('express');

var app = express();

app.get('/', function () {
  setTimeout(function () {
    process.nextTick(function () {
      throw 'an express error example';
    });
  });
});

var server = app.listen(3000);

console.log('listening at http://localhost:3000');

upgrade(server).on('error', function (err, req, res) {
  console.error(err);
  process.exit();
});




