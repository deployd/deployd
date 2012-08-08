# Resource

Resources provide a way to handle `Context`s requesting a specific URL. A `Resource` must implement a `handle(ctx, next)` method that either handles a `Context` or calls `next()`.

Resources can also be attributed with meta-data that describes their configuration and dependencies. These can be used to dynamically render a dashboard editor gui for configuring a resource instance.

## Events

A `Resource` also provides a mechanism for executing event `Script`s during the handling of an http request. This allows instances to inject logic during their execution, keeping `Resource`s generic and reusable.

For example, the `Collection` resource executes the *get.js* event script when it retrieves each object from its store. If a *get.js* file exists in the instance folder of a resource (eg. `/my-project/resources/my-collection/get.js`), it will be pulled in by the resource and exposed as `myResource.events.get`.

## Class: Resource

A `Resource` inherits from `EventEmitter`. The following events are available.

 - `changed`      after a resource config has changed
 - `deleted`      after a resource config has been deleted

Example:

    var Resource = require('deployd/lib/resource');
    var resource = new Resource(name, options);

* `name` {String}

The name of the resource.

* `options` {Object}

 - `path`         the base path a resource should handle
 - `db`           the database a resource will use for persistence
 - `config`       the instance configuration

The following resource would respond with a file at the url `/my-file.html`.

    function MyFileResource(name, options) {
      Resource.apply(this, arguments);

      this.on('changed', function(config) {
        console.log('MyFileResource changed', config);
      });
    }
    util.inherits(MyFileResource, Resource);

    FileResource.prototype.handle = function (ctx, next) {
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

Override the handle method to return a string:

    function MyResource(settings) {
      Resource.apply(this, arguments);
    }
    util.inherits(MyResource, Resource);

    MyResource.prototype.handle = function (ctx, next) {
      // respond with the file contents (or an error if one occurs)
      fs.readFile('myfile.txt', ctx.done);
    }
    
## Reserved Methods

## resource.load(fn)

Load any dependencies and call `fn(err)` with any errors that occur.

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

`/my-project/public/hello.js`

    dpd.example.hello({msg: 'hello world'});
    
`/my-project/resources/other-resource/get.js`

    dpd.example.hello({msg: 'hello world'});

## Events

If a `Resource` constructor includes an array of events, it will try to load the scripts in its instance folder (eg. `/my-project/resources/my-resource/get.js`).

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
    
## Basic Dashboard

In cases where a custom ui is not practical, a resource can describe the setting to render for a basic dashboard. The following example would render a single textbox.

    Proxy.basicDashboard = {
      settings: [{
        name: "remote"
        , type: "text" //"textarea", "number", and "checkbox" work as well
        , description: "The remote server to proxy to."
      }]
    }

