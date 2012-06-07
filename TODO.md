# high

 - server init
  - [x] var server = new Server(config);
  - [x] server.defineResource({path: '/todos', ...})
  - [x] $ dpd create hello-world
  - [x] $ cd hello-world && dpd
 - [x] session w/ socket.io connection
 - [x] resource crud / resource http api
 - [x] json body parsing
 - [x] root session / isRoot
 - [x] removed ?q={}, now ?{}
 - [x] Context sugar
 - [x] user collection
 - [x] files resource
 - [x] config
 - [x] dashboard / dev integration
 - auto generated dpd.js
  - server and client version
 - integration tests ported from 0.4
 - add key check back to dashboard
 - cli
  - repl should start when you start server
  - should have commands for 'dashboard', 'resources'
  - scriptable with access to server object
  - dpd deploy
 - resources settings changed hook
  - for updating resource instance on change
 - collection
  - rename properties
  - drop collection when resourced removed
 - installer
  - dpd project file
 

# medium

 - travis ci
 - dates should be sortable
 - dates should be JS date objects in events
 - dates should be transfered as JSON dates over http
 
# low

 - [x] _id should be id
 - [x] /__dashboard should be /dashboard
 - [x] /resources should be /__resources

 