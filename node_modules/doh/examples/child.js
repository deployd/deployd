/**
 * see stable.js for more...
 */
 
var server = require('http').createServer()
  , upgrade = require('../').upgrade;
  
server.on('request', function () {
  throw new Error('a nasty error');
});

upgrade(server).on('error', function (err, req) {
  console.error(req.method, req.url, err);
  process.exit();
});

server.listen(3000);

console.log('listening at http://localhost:3000');

/**
 * After several requests to / you should see:
 *  
 *  GET / { [Error: a nasty error]
 *    domain_thrown: true,
 *    domain: { members: [], _events: { error: [Function] } } }
 *  listening at http://localhost:3000
 *  GET / { [Error: a nasty error]
 *    domain_thrown: true,
 *    domain: { members: [], _events: { error: [Function] } } }
 *  listening at http://localhost:3000
 *  GET / { [Error: a nasty error]
 *    domain_thrown: true,
 *    domain: { members: [], _events: { error: [Function] } } }
 *  listening at http://localhost:3000
 *  
 */