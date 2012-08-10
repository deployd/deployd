# Resource

Resources provide a way to handle http requests at a root url. They must implement a `handle(ctx, next)` method that either handles a request or calls `next()` to give the request back to the router.

Resources can also be attributed with meta-data to allow the dashboard to dynamically render an editor gui for configuring a resource instance.

## Events / Scripts

A `Resource` can execute `Script`s during the handling of an http request when certain events occur. This allows users of the resource to inject logic during specific events during an http request without having to extend the resource or create their own.

For example, the `Collection` resource executes the *get.js* event script when it retrieves each object from its store. If a *get.js* file exists in the instance folder of a resource (eg. `/my-project/resources/my-collection/get.js`), it will be pulled in by the resource and exposed as `myResource.scripts.get`.

## Class: Resource

A `Resource` inherits from `EventEmitter`. The following events are available.

 - `changed`      after a resource config has changed
 - `deleted`      after a resource config has been deleted

Inheriting from Resource:

    var Resource = require('deployd/lib/resource')
      , util = require('util');
      
    function MyResource(name, options) {
      // run the parent constructor
      // before using any properties/methods
      Resource.apply(this, arguments);
    }
    util.inherits(MyResource, Resource);
    module.exports = MyResource;

* `name` {String}

The name of the resource.

* `options` {Object}

 - `configPath`        the project relative path to the resource instance
 - `path`              the base path a resource should handle
 - `db` *(optional)*   the database a resource will use for persistence
 - `config`            the instance configuration object
 - `server`            the server object

The following resource would respond with a file at the url `/my-file.html`.

    function MyFileResource(name, options) {
      Resource.apply(this, arguments);

      this.on('changed', function(config) {
        console.log('MyFileResource changed', config);
      });
    }
    util.inherits(MyFileResource, Resource);

    MyFileResource.prototype.handle = function (ctx, next) {
      if (ctx.url === '/my-file.html') {
        fs.createReadStream('my-file.html').pipe(ctx.res);
      } else {
        next();
      }
    }
    
## Overriding Behavior

Certain method's on a `Resource` prototype are called by the runtime. Their default behavior should be overriden to define an inherited `Resources` behavior.

## resource.handle(ctx, next)

Handle an incoming request. This gets called by the router.
Call `next()` if the resource cannot handle the request.
Otherwise call `cxt.done(err, res)` when the resource
is ready to respond.

* ctx {Context}

The http context created by the `Router`. This provides an abstraction between the actual request and response. A `Resource` should call `ctx.done` or pipe to `ctx.res` if it can handle a request. Otherwise it should call `next()`.

Override the handle method to return a string:

    function MyResource(settings) {
      Resource.apply(this, arguments);
    }
    util.inherits(MyResource, Resource);

    MyResource.prototype.handle = function (ctx, next) {
      // respond with the file contents (or an error if one occurs)
      fs.readFile('myfile.txt', ctx.done);
    }
    
## resource.load(fn)

Load any dependencies and call `fn(err)` with any errors that occur. This is automatically called by the runtime to support asynchronous construction of a resource (such as loading files). If this method is overridden the super method must be called to support loading of the `MyResource.events` array.

## External Prototype

This is a special type of prototype object that is used to build the `dpd` object. Each function on the `Resource.external` prototype `Object` are exposed externally in two places

 1. To the generated `dpd.js` browser JavaScript client
 2. To the `Context.dpd` object generated for inter-resource calls
    
Here is an example of a simple resource that exposes a method on the external prototype.

`/my-project/node_modules/example.js`

    var util = require('util');
    var Resource = require('deployd/lib/resource');
    function Example(name, options) {
      Resource.apply(this, arguments);
    }
    util.inherits(Example, Resource);

    Example.external = {};

    Example.external.hello = function(options, ctx, fn) {
      console.log(options.msg); // 'hello world'
    }

When the `hello()` method is called a context does not need to be provided as the `dpd` object is built with a context. A callback may be provided which will be executed with results of `fn(err, result)`.

`/my-project/public/hello.js`

    dpd.example.hello({msg: 'hello world'});
    
`/my-project/resources/other-resource/get.js`

    dpd.example.hello({msg: 'hello world'});

## Resource.events

* {Array}

If a `Resource` constructor includes an array of events, it will try to load the scripts in its instance folder (eg. `/my-project/resources/my-resource/get.js`) using `resource.loadScripts(eventNames, fn)`.

    MyResource.events = ['get'];
    
This will be available to each instance of this resource. 

`/my-project/node_modules/my-resource.js`

    MyResource.prototype.handle = function(ctx, next) {
      if(this.events && this.events.get) {
        var domain = {
          say: function(msg) {
            console.log(msg); // 'hello world'
          }
        }
        this.events.get.run(ctx, domain, ctx.done);
      }
    }

`/my-project/resources/my-resource/get.js`

    say('hello world');

## Custom Dashboard

A resource can describe the dependencies of a fully custom dashboard editor ui. This will be passed to the dashboard during rendering to create a custom ui.

This example creates a custom dashboard for the `Collection` resource. It automatically includes pages, and separate scripts.

    Collection.dashboard = {
        path: path.join(__dirname, 'dashboard')
      , pages: ['Properties', 'Data', 'Events', 'API']
      , scripts: [
          '/js/ui.js'
        , '/js/util.js'
      ]
    }

* `path` {String}

The absolute path to this resource's dashboard

* `pages` {Array} *(optional)*

An array of pages to appear in the sidebar. If this is not provided, the only page available will be "Config" (and "Events", if `MyResource.events` is set).

The dashboard will load content from `[current-page].html` and `js/[current-page].js`.

*Note: The "Config" page will load from `index.html` and `js/index.js`.*

*Note: `events.html` is optional - if not provided, the dashboard will load a default event editor.*

* `scripts` {Array} *(optional)*

An array of extra JavaScript files to load with the dashboard pages.
    
## Basic Dashboard

In cases where a custom ui is not practical, a resource can describe the setting to render for a basic dashboard. The following example would render a single textbox.

    Proxy.basicDashboard = {
      settings: [{
        name: "remote"
        , type: "text"
        , description: "The remote server to proxy to."
      }]
    }

The `settings` object is an array of objects with these properties:

* `name` {String}

The name of the property in your config object. Make sure this is something easily accessible through JavaScript, i.e. `maxItems` rather than "Maximum Amount of Items".

* `type` {String}

The type of field to render in the dashboard. Supported options are `text`, `textarea`, `number`, and `checkbox`.

* `description` {String}

Text to appear beneath the property in the dashboard.
