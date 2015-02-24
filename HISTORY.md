# History

## 0.8.0

### Bug Fixes
- **typeload:** load custom resources from package.json if exists
  ([f1f0738](https://github.com/deployd/deployd/commit/f1f0738942941b16075fde42ef62dfde6f77bc51))
- **attach.js:** mkdir resourcesPath if not exists
  ([55cf4b36](https://github.com/deployd/deployd/commit/55cf4b366ce951512dac0f06b8fbbcc297c6486a))
- **collection:**
  - $push should work with arrays when inserting new records
  ([077c2b97](https://github.com/deployd/deployd/commit/077c2b97cffee6c14f4f10391c3f78b7055aae8d))
  - allow changed() function to work properly with collection properties of type object.
  ([46f518dc](https://github.com/deployd/deployd/commit/46f518dc876e723c6c87c70a87b6ef7278b6dab4))
- **config-loader:** improve the 'resources' dir reading
  ([67218018](https://github.com/deployd/deployd/commit/672180182306eb305df09e7242af691cdc62235c))
- **db:**
  - update/delete should return count of records affected
  ([6a8caad8](https://github.com/deployd/deployd/commit/6a8caad83e571bf82fdaab3c7bff58cab6d25d42))
  - Should not crash process when an invalid $fields query is passed.
  ([ca68e153](https://github.com/deployd/deployd/commit/ca68e1531e5f692e29b9f67f35540faeb7b60a45))
- **internal-client:** exec resource.path is missing
  ([c1acee8e](https://github.com/deployd/deployd/commit/c1acee8e6ff8de4b5ad1da3bf2dd1f726db0e68c))
- **script:** null values in domain were changed to {}
  ([26311eea](https://github.com/deployd/deployd/commit/26311eea7b0d47bec66f113fca1b1f13bd89ae86))
- **session:** correct usages of an emit queue.
  ([53b226ad](https://github.com/deployd/deployd/commit/53b226ad09b56006ff15edb783a6b5bf5b3f6301))
- **session.js:** Refactor session creation code to use promises in order to fix a possible race condition while inserting a session to the database.
  ([3080de2f](https://github.com/deployd/deployd/commit/3080de2faaeee6dc2d22e6e8f201b60cbf26bff2))
- **tests:** call done() properly from async function
  ([061f16de](https://github.com/deployd/deployd/commit/061f16de29e1ad81e35b817ce72ff604e61d3a77))
- correctly delete cookies, update cookies-dependency


### Features

- **collection:** $addUnique for MongoDB $addToSet support (from yoneal PR #252)
  ([730e980e](https://github.com/deployd/deployd/commit/730e980ec4c1ccaa9b9fc894fba6ee98c2bbcc27))
- **config-loader server:** customize server and public dirs through options
  ([f17d296d](https://github.com/deployd/deployd/commit/f17d296dd879c99222756610fe5604490289d5df))
- **core:** wait for promises in events
  ([964ec452](https://github.com/deployd/deployd/commit/964ec452619e7da7a7f5ce0f87fb6d334dbc21cd))
- **dashboard:** sort sidebar resources in alphabetical order
  ([4cf89a63](https://github.com/deployd/deployd/commit/4cf89a63436179fe26d5af5d9b6e204b43cda606))
- **events:** Expose ctx object to the event scripts
  ([c0b39d3a](https://github.com/deployd/deployd/commit/c0b39d3ae6247a4631647bdf865534931981bf1f))
- **server:** add deployd.attach to extend http/expressjs/connect server and provide a middleware
  ([29cf94b4](https://github.com/deployd/deployd/commit/29cf94b48bd01ec805ab156f7a33ac426ca598a0))
- **session:** get session by uid
  ([ffb33bf5](https://github.com/deployd/deployd/commit/ffb33bf58ba60378de6e30104a4fd54351285175))
- **dpd.js** add promises to client library

## 0.7.0

 - Add ability to query by subproperty within GET event
 - Add X-Requested-With header for AngularJS support
 - Add auto https support to dpd.js client lib
 - Removed Forever Monitor support from CLI
 - Fix bug with repl causing typed characters to be printed twice and not executed correctly
 - Fix bug where dashboard would not load if a config had not yet been created
 - Fix issue where number query params for string type properties were not being converted to strings on server
 - Fix MongoDB startup and settings
 - Add check for $inc operands to ensure numbers before attempting to increment
 - Add more core tests, and features to make mocking
 easier within tests



## 0.6.11

 - Fixed bug where missing content-type header when updating a user threw an error.

## 0.6.10

 - Fixed bug where query strings were not properly parsed.
 - Fixed certain errors returned as HTML rather than JSON.
 - Fixed bug where changing a property type from "number" to "string" made existing properties uneditable.
 - Fixed bug where `changed()` was returning true for values that had not changed.
 - Fixed certain error's returned as HTML rather than JSON.
 - Data editor
   - Fixed bug where data editor would expand as the page scrolls
   - Fixed bug where the cursor would randomly move around while editing text
   - Removed overlay for inline editing

## 0.6.9

 - Fixed bug where `internal-client` was not accessible from modules
 - Fixed restarts caused by 404s of unexpected http verbs

## 0.6.8

 - Fixed CORS incorrectly requiring a referer header
 - Added `dpd.once(name, fn)` function to execute a realtime handler exactly once
 - Added `dpd.off(name, [fn])` function to remove a realtime handler
 - Added `dpd.socketReady(fn)` function to listen for the built-in `connect` event
 - Added `dpd.socket` property to provide direct access to socket.io.
 - Fixed bug where username and password could be updated by an unauthenticated put.
  - Usernames and passwords can be updated only by that user's session, a root session, or an internal request.
 - Made `data` folder smaller by default in `development` environment
 - Added `cancelIf()`, `cancelUnless()`, `errorIf()`, and `errorUnless()` functions to event API for more declarative events
 - Added `hasErrors()` function to event API
 - Added `isMe()` function to event API
 - Fixed external prototype bug causing custom external prototypes to fail
 - Removed docs from repository. They are now available at http://docs.deployd.com or https://github.com/deployd/docs.


## 0.6.7

 - Added new data editor
 - Fixed major bug where calling error() would not always cancel the request
 - Fixed bug where PUT would fail without an error if you provided a query
 - Changed root behavior - no longer ignores cancel() in events
 - Fixed bugs preventing events from being `emit()`ed to users in certain connection states
 - Fixed bug where boolean query values (?bool=true) were not treated as booleans
 - Fixed unnecessary error when parsing JSON body
 - Added more intelligent body parsing
 - Added `changed()` method in collection events
 - Added `previous` object in collection events
 - Fixed `dpd showkey` prompt for missing keys.json

## 0.6.6

 - Added CORS support
 - Exposed the server object to modules as `process.server`
 - Fixed a rare bug where the first request after a login would not be authenticated
 - Fixed minor bug when loading only node modules

## 0.6.5

 - Fixed `process.send` bug
 - Remote DB Authentication

## 0.6.4

 - Fixed incorrect Content-Length response header.

## 0.6.3

 - Removed dependency on jQuery for dpd.js
 - JSON-formatted "bad credentials" login error
 - Improved error reporting on CLI when port is in use
 - If in development mode, and no port has been specifically requested, CLI will retry with up to 5 different ports
 - Fixed "no open connections" bug on startup
 - Renamed `Db.connect()` to `Db.create()`
 - Db connections are now lazy and only occur once a request is made
 - Added 500 and 404 error pages
 - Added module domain error handling for better module errors
 - Added automatic reloading on error
 - Dropped support for node 0.6

## 0.6.2

 - Fixed rare but annoying bug where server would crash for no good reason ("Cannot set headers") on a request

## 0.6.1

 - Bumped the default recursion limit to 2 levels
 - Fixed rare case where a resource's dashboard would not load
 - Fixed user events
 - Fixed several validation bugs
 - In a UserCollection /users/me will return 204 instead of 401

## 0.6.0

### Breaking Changes
 - Restructured Deployd app folder structure. Let us know if you need to migrate any 0.5 apps.
 - Changed the "email" property of a UserCollection to "username", in order to be less opinionated about user logic.

### New Features
 - Rebuilt the dashboard
  - You can now manage resources from any page on the dashboard. Navigation has also been improved
  - You can now reorder properties in a collection
 - Added custom resource API. You can now write your own resources and include them in your app. See the [docs] for examples and reference.

### Major Bugfixes
 - Fixed bug where your session could get elevated to root after using the Dashboard (causing cancel() in events to be ignored)
