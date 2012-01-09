
# Deployd 
## v0.2.0      

Application stack built specifically for UI developers. Everything is available from client JavaScript.
  
Plugin loader, MongoDB Object Document Mapper, and thin JSON server built on express.
  
## Plugins

Plugins are just node modules. If it is in the `/lib/plugins` folder, it will be loaded as a plugin. The following example would live at `/lib/plugins/users/index.js`.
  
     var app = require('../../app')
       , User = require('./user') 
     
     app.get('/users/:id', function(req, res) {
       User
        .spawn()
        .set({_id: req.param('id')})
        .notify(res)
        .fetch()
      ;
     });

## Installation

You will need [Node.js](http://nodejs.org/), [MongoDB](http://www.mongodb.org/display/DOCS/Quickstart), and [npm](http://npmjs.org/).

    $ npm install deployd

## Quick Start

The quickest way to get started with deployd is by using the hosted service at [deploydapp.com](http://deploydapp.com). Currently we are in a very limited alpha preview, if you would like to signup for the beta visit [deployd.com](http://deployd.com).

## Client Lib

Interacting with a deployd app from a javascript client is very simple.

Include a reference to the deployd.js in your html. It is hosted at deploydapp.com for your convenience. 

  <script src="http://deploydapp.com/deployd.js"></script>
  
If you are making cross domain calls, you must tell deployd your host.

    dpd.host('myhost.deploydapp.com');

or

    dpd.host('localhost:3000');

Once deployd is setup to talk to the right host, you can access the REST api with the `dpd` function.

    dpd('/me', function(me) {
      if(me._id) alert('the current user is ' + me.email);
    });

To access models you have created in the dashboard (http://localhost:3000/dashboard) you can call the associated route.

    dpd('/models/widgets', {name: 'my new widget'}, function(widget) {
      if(widget._id) alert('i just created a new widget');
    })
    
The search route lets you search any collection of models.

    dpd('/search/widgets', {name: 'my new widget'}, function(widgets) {
      console.log(widget.results);
    });

## Features

  * User management
  * Extendible by plugins
  * Models (with MongoDB support)
  * Dashboard for model and plugin management
  * JavaScript client library for quickly building apps

Via `express`:

  * Robust routing
  * Redirection helpers
  * View rendering and partials support
  * High test coverage
  * Session support
  * Cache API
  * Cookie support
  * Logging

## Contributors

  * Ritchie Martori
  * Jeff Cross

## License 

(The MIT License)

Copyright (c) 2009-2011 Deployd LLC

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.