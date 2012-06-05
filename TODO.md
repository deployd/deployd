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
 - config
 - dashboard / dev integration
 - http client
 - auto generated dpd.js
 - integration tests ported from 0.4
 

# medium

 - travis ci
 - repl
 - dates should be sortable
 - dates should be JS date objects in events
 - dates should be transfered as JSON dates over http
 - event io should be wrappable in `set(key, fn)` so it only runs when `key` is selected
 
# low

 - [x] _id should be id
 - /__dashboard should be /dashboard
 - [x] /resources should be /__resources

 