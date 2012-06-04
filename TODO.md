# high

 - server init
  - [x] var server = new Server(config);
  - [x] server.defineResource({path: '/todos', ...})
  - config
  - $ dpd create hello-world
  - $ cd hello-world && dpd
 - [x] session w/ socket.io connection
 - [x] resource crud / resource http api
 - [x] json body parsing
 - [x] root session / isRoot
 - [x] removed ?q={}, now ?{}
 - [x] Context sugar
 - http client
 - auto generated dpd.js
 - dashboard / dev integration
 - integration tests ported from 0.4
 - user collection
 - files resource

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
 - /resources should be /__resources

 