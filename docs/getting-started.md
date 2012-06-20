# Getting Started

Deployd Server is for quickly creating realtime APIs for web and mobile apps. It bundles an **always-up-to-date** browser JavaScript api for easily interacting with data.

		// karen's browser
		dpd.on('new todo', dpd.log);
		> {id: 'j9d8s095s95d7', title: 'hello world', done: true}

		// joe's browser
		var todo = {title: 'hello world', done: true};
		dpd.todos.post(todo, dpd.log);
		> {id: 'j9d8s095s95d7', title: 'hello world', done: true}

		// server on POST /todo
		emit('new todo', this);

For other clients, all data is available over HTTP.

		$ curl http://localhost:2403/todos
		[{id: 'j9d8s095s95d7', title: 'hello world', done: true}]

## Install

 - [Download](http://deployd.com) the OSX installer (13.8mb).
 - [Download](http://deployd.com) the Windows installer (13.8mb).

## Hello World

Create an app by running:

	$ dpd create hello
  $ cd hello
  $ dpd
  dpd>

The `dpd>` you see after starting deployd is a REPL for interacting with the server as its running. It also has a command to open up the dashboard.

	dpd> dashboard

This will open up the dashboard in your default browser.

## Dashboard

The dashboard is a simple ui that lets you manage your deployd server. You create your API by adding resources to a specific URL. An example would be adding a `Collection` resource at the URL `/todos`. You can get to the dashboard by opening `/dashboard` (eg. `http://localhost:2403/dashboard`) in a browser.

## Resources

We call Deployd a **resource server**. A resource server is not a library, but a complete server that works out of the box, and can be customized to fit the needs of your app by adding resources. Resources are ready-made components that live at a URL and provide functionality to your client app.

An example of a resource is a data collection. You should only have to define the properties and types of objects, and the server should validate the data. You should also be able to create your own custom resources and install custom resources from other developers. (we’re built on Node.js, so custom resources will take the form of node modules).

## Files

Deployd serves static files from its `public` folder. This folder is created when you run `dpd create`. These files will be served with the appropriate cache headers (Last-Modified and Etag) so browsers will cache them.