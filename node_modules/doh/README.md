# node-doh

upgrade any http(s) server with error handling via domains

![Hoomer](http://www.wallpaperpimper.com/wallpaper/Shows/The_Simpsons/Doh-1-PV1LXGX876-1024x768.jpg)

## features

 - guarantees a request will receive a response when errors occur
 - handles any error during a request callback (no need for fn(err, res))
 - sends 500 with error message by default
 - default and custom error pages

## install

    npm install doh

## usage

### upgrade(server, options)

Add error handling to an existing server.

    var upgrade = require('doh').upgrade
      , server = require('http').createServer();
  
    server.on('request', function () {
      process.nextTick(function() {
        thisFunctionClearlyDoesNotExist(); // errors, ends the response, returns an error page
      });
    });
  
    server.listen(3000);
  
    // call upgrade when you want
    // to start handling errors
    upgrade(server);

### createHandler(options)

Create an adhoc error handler that will capture errors in a domain and respond to with the correct error.

    var options = {template: 'my-err-template.html'}
      , server = require('http').createServer()
      , doh = require('doh');
  
    server.on('request', function(req, res) { 
      var handler = doh.createHandler(options);
      handler.run(function() {
        process.nextTick(function() {
          throw 'anything'; // will be sent to the response
        });
      });
    });

### createResponder(options)

Return an error page based on an `Error` object. 

    var options = {template: 'my-err-template.html'}
      , server = require('http').createServer()
      , doh = require('doh')
      , respond = doh.createResponder({template: 'my-err-template.html'}) // template - optional

    server.on('request', function(req, res) { 
      var err = new Error('my custom error');
      respond(err, req, res); // sends an error page
    });

## error page

![Error Screen](http://images.deploydapp.com/img/doh.png)

## crash only

By default `doh` handles errors on a domain and responds with an error page. Since node is crash only by design, you'll usually want to `process.exit()` when an error occurs.

    upgrade(server).on('request:error', function(err, req, res) {
      // at this point the response has been sent
      // but we can still log out everything before we
      // restart the server
      
      console.error(err, req, res);
      process.exit();
    });

## options

You can pass an options object to `doh.upgrade(server, options)` to override default behavior.

 - `template` - path to an ejs error template. Passed `req`, `res`, and `err`. See `assets/error.html`.
 
## tests

    npm test

**note** - Since `doh` is entirely concerned with error handling, it requires a custom test runner that does not rely on `throw` for failures (see `test.js` for more).

## license

MIT
 
 