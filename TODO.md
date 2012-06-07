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
  - eg. microscripts
 - auto generated dpd.js
  - server and client version
 - integration tests ported from 0.4
 - add key check back to dashboard
 - cli
  - mongodb manager
  - [x] repl should start when you start server
  - [x] should have commands for 'dashboard', 'resources'
  - [x] scriptable with access to server object
  - dpd deploy
 - [x] resources settings changed hook
  - [x] for updating resource instance on change
 - [x] collection
  - [x] rename properties
  - [x] drop collection when resourced removed
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

 