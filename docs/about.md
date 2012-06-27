# About Deployd

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

## Resources

We call Deployd a **resource server**. A resource server is not a library, but a complete server that works out of the box, and can be customized to fit the needs of your app by adding resources. Resources are ready-made components that live at a URL and provide functionality to your client app.

An example of a resource is a data collection. You only have to define the properties and types of objects, and the server will validate the data. You will also be able to create your own custom resources and install custom resources from other developers. (we’re built on Node.js, so custom resources will take the form of node modules).

## Install

 - [Download](http://deployd.com) the OSX installer (13.8mb).
 - [Download](http://deployd.com) the Windows installer (13.8mb).

