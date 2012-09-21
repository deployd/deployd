# Deployd Guide

Deployd is a new way of building data-driven backends for web apps. Ready-made, configurable *Resources* add common functionality to a Deployd backend, which can be further customized with JavaScript *Events*. 

# Getting Started

Create an app by running:

	$ dpd create hello
	$ cd hello
	$ dpd
	dpd>

The `dpd>` you see after starting Deployd is a REPL for interacting with the server as it's running. 

You will probably use the following commands frequently:

- `open` - Opens your app (`http://localhost:2403` by default) in your default browser
- `dashboard` - Opens your app's Deployd dashboard (`http://localhost:2403/dashboard` by default) in your default browser

To open your app or dashboard immediately after creating an app, put a `--open`/`-o` or `--dashboard`/`-d` flag on `dpd create`: 

	dpd create hello -d
	dpd>

# dpd Command

The `dpd` command line tool has some options that you can specify when you run it:

- `dpd -p [port]` - Runs the Deployd server on a specific port. Default is `2403`.
- `dpd -d` - Runs the Deployd server and immediately runs the `dashboard` command
- `dpd -o` - Runs the Deployd server and immediately runs the `open` command
- `dpd -V` - Outputs the current version of the Deployd server.
- `dpd -h` - Lists the available options in more detail

If you used the Mac or Windows installer, double-clicking on an `app.dpd` file will have the same effect as `dpd -d` - it will start your app and open the dashboard.

# Dashboard

The dashboard is a simple UI that you'll use to create and manage your Deployd backend. You can get to the dashboard by opening `/dashboard` (eg. `http://localhost:2403/dashboard`) in a browser.

The sidebar of the Dashboard lists the Resources that you have in your app. A resource is a feature that you can add to your app's backend.

![Dashboard](/img/docs/dashboard.png)

## Managing Resources

Click on the "+" button on the sidebar to add a resource.

The following resource types are available:

- [Collection](/docs/resources/collection.html)
- [User Collection](/docs/resources/user-collection.html)

From the main view of the dashboard, you can delete and rename resources by clicking on the arrow next to it.'

![Dashboard](/img/docs/dashboard-detail.png)

# Files

Deployd serves static files from its `public` folder. This folder is created when you run `dpd create`. These files will be served with the appropriate cache headers (`Last-Modified` and `Etag`) so browsers will cache them. 

Deployd will automatically serve an `index.html` file as the default file in a directory. 

# Dpd.js

The Deployd client library (`dpd.js`) can optionally be included in your web app to simplify backend requests. Include it with this script tag in your `<head>` or `<body>`:

		<script type="text/javascript" src="/dpd.js" />

This will include a `dpd` object that can be used to make HTTP requests:

		dpd.mycollection.post({some: 'value'}, function(result, error) {
			//Makes a POST request to /my-collection
		});

		dpd.mycollection.get({some: 'query'}, function(result, error) {
			//Makes a GET request to /my-collection?some=query
		});

See the [Dpd.js Reference](/docs/reference/dpdjs.html) for more details.

# More Information

- [Community discussion](/community.html)
- [Github project](https://github.com/deployd/deployd)
- [Issue tracker](https://github.com/deployd/deployd/issues)
- [Deployd blog](http://deployd.tumblr.com/)
- [@deploydapp](https://twitter.com/#!/deploydapp)


