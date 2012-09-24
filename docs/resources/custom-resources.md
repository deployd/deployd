# Custom Resources

A resource is a node module that deployd mounts at a given url and handles HTTP requests. Deployd comes bundled with two resources: [Collection](collection.html) and [UserCollection](user-collection.html). You can create your own custom resources by extending the `Resource` constructor and implementing a `handle()` method. Here is an example of a simple custom resource:

    var Resource = require('deployd/lib/resource')
      , util = require('util');

    function Hello(options) {
      Resource.apply(this, arguments);
    }
    util.inherits(Hello, Resource);
    module.exports = Hello;

    Hello.prototype.handle = function (ctx, next) {
      if(ctx.req && ctx.req.method !== 'GET') return next();

      ctx.done(null, {hello: 'world'});
    }
    
This resource will respond to every GET request with: `{"hello": "world"}`.

## Loading / File Structure

Deployd looks for custom resources in your project's `node_modules` folder. Any node module that exports a constructor that inherits from `Resource` will be loaded and made available in the dashboard.

Heres an example project structure:

    - my-project
      - app.dpd
      - resources
      - data
      - node_modules
        - hello.js
        - my-module
          - index.js
          - README.md
          - package.json
          - node_modules
           - foo-module
            - foo.js
          
Resources can be a single file (eg. hello.js) or a folder with a `package.json` and its own `node_modules` folder. Resources are just regular node modules.

## Dashboard

If your custom resource type is properly installed in your app, you should see it in the Create Resource menu in the dashboard. To customize its appearance in this menu, use the following properties:

    // The resource type's name as it appears in the dashboard. 
    // If this is not set, it will appear with its constructor
    // name ('Hello' in this case)
    Hello.label = 'Hello World'; 
    
    // The default path suggested to users creating a resource.
    // If this is not set, it will use the constructor's name
    // in lowercase. ('/hello' in this case).
    Hello.defaultPath = '/hello-world'; 

By default, the dashboard will provide a JSON editor to configure this resource. For a more customized experience, you can set specific properties to be edited:

    Hello.basicDashboard = {
      settings: [{
          name: 'propertyName',
          type: 'text',
          description: "This description appears below the text field"
      }, {
          name: 'longTextProperty',
          type: 'textarea'
      }, {
          name: 'numericProperty',
          type: 'number'
      }, {
          name: 'booleanProperty',
          type: 'checkbox'
      }]
    };

![Basic Dashboard](/img/docs/basic-dashboard.png)

## Context

Resources must implement a `handle(ctx, next)` method. This method is passed a `Context` during HTTP requests. The resource can either handle this context and call `ctx.done(err, obj)` with an error or result JSON object or call `next()` to give the context back to the router. If a resource calls `next()` the router might find another match for the resource, or respond with a `404`.

A context comes with several useful properties to make HTTP easy.

 - **query**   the requests query as an object
 - **body**    the requests body as JSON if it exists
 - **session** the current user's session if one exists
 - **dpd**     the internal interface for interacting with other resources

## Script

To make your `Resource` reusable, you can expose hooks to execute scripts when a resource is handling a request. A `Script` runs JavaScript in an isolated context. It interfaces with the current request through a `domain` which is passed to a `Script` to run.

For example, in the `Collection` resource, custom logic is injected through hooks called **event scripts**. These are short scripts that are executed in their own context. They do not share a scope or state with any other scripts. In an **event script** the global object contains a set of **domain functions**. These functions, such as `hide()`, `error()`, and `protect()` operate on the context. In the case of a `Collection` they interact with the item that is being retrieved or saved, the `ctx.body`.

A common type of `Script` is an event.  The following example resource loads an event.

my-resource.js:

    var Resource = require('deployd/lib/resource');
    var Script = require('deployd/lib/script');
    var fs = require('fs');
    var util = require('util');

    var MyResource = function () {
      Resource.apply(this, arguments);
    }
    util.inherits(MyResource, Resource);

    MyResource.events = ["get"]; // Registers events to be loaded. Also makes them editable in the dashboard

    MyResource.prototype.handle = function (ctx) {
      var value;

      var domain = {
        send: function(msg) {
          value = msg;
        }, 
      };
    
      this.events.get.run(ctx, domain, function() {
        ctx.done(null, value);
      });
    }

get.js:

    send({hello: 'world'});

GET /my-resource response:

    {
      "hello": "world"
    }

## Custom Dashboard

To create a fully customized editor for your resource, set the "dashboard" property:

    Hello.dashboard = {
      path: __dirname + '/dashboard', //The absolute path to your front-end files
      pages: ["Credentials", "Events", "API"], // Optional; these pages will appear on the sidebar.
      scripts: [ 
        '/js/lib/backbone.js', //relative paths to extra JavaScript files you would like to load
        '/js/lib/jquery-ui.js'
      ]
    };

This will load your resources' editor from the dashboard path. It will load the following files:

 - `[current-page].html`
 - `js/[current-page].js`
 - `style.css`

The default page is `index`; the `config` page will also redirect to `index`. 

The `config` or `index` page will load the basic dashboard if no `index.html` file is provided.
The `events` page will load the default event editor if no `events.html` file is provided.

To embed the event editor in your dashboard, include this empty div:
  
    <div id="event-editor" class="default-editor"></div>

For styling, the dashboard uses a reskinned version of [Twitter Bootstrap 2.0.2](http://twitter.github.com/bootstrap/).

The dashboard provides several JavaScript libraries by default:

- [jQuery 1.7.2](http://jquery.com/)
- [jquery.cookie](https://github.com/carhartl/jquery-cookie/)
- [Underscore 1.3.3](http://underscorejs.org/)
- [Twitter Bootstrap 2.0.2](http://twitter.github.com/bootstrap/javascript.html)
- [UIKit](http://visionmedia.github.com/uikit/)
- [Ace Editor](https://github.com/ajaxorg/ace) (noconflict version)
    - JavaScript mode
    - JSON mode
    - Custom theme for the Dashboard (`ace/theme/deployd`)
- [Google Code Prettify](http://code.google.com/p/google-code-prettify/)
- dpd.js
    - *Note:* all dpd.js requests will be sent as root, which gives special priveleges, such as ignoring `cancel()` in events.

Within the dashboard, a `Context` object is available:

    //Automatically generated by Deployd:
    window.Context = {
      resourceId: '/hello', // The id of the current resource
      resourceType: 'Hello', // The type of the current resource
      page: 'properties', // The current page, in multi page editors
      basicDashboard: {} // The configuration of the basic dashboard - not ordinarily useful
    };

You can use this to query the current resource:

    dpd(Context.resourceId).get(function(result, err) {
      //Do something
    });

In the dashboard, you also have access to the special `__resources` resource, which lets you update your app's configuration files:

    // Get the config for the current resource
    dpd('__resources').get(Context.resourceId, function(result, err) {
      //Do something
    });
    
    // Set a property for the current resource
    dpd('__resources').put(Context.resourceId, {someProperty: true}, function(result, err) {
      //Do something
    });
    
    // Set all properties for the current resource, deleting any that are not provided
    dpd('__resources').put(Context.resourceId, {someProperty: true, $setAll: true}, function(result, err) {
      //Do something
    });
    
    // Save another file, which will be loaded by the resource
    dpd('__resources').post(Context.resourceId + '/content.md', {value: "# Hello World!"}, function(result, err)) {
      //Do something
    });