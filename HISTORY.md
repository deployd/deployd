# History

This document records all notable changes to [Deployd](http://deployd.com/). This project adheres to [Semantic Versioning](http://semver.org/).

<a name="v0.8.9"></a>
# v0.8.9 (2016-08-29)


## Bug Fixes

- **db:** convert skip/limit arg to integer
  ([86e6f5f6](https://github.com/deployd/deployd/commit/86e6f5f6a06d1c338974735d237fc9d8f33c8ec9))
- **package:**
  - pin mongodb to 2.1.18 (upstream bug) (#740)
  ([79ed7b77](https://github.com/deployd/deployd/commit/79ed7b779be53ec2b45c8b62a972e8e74eb064af))
  - pin mongodb to 2.1.x (#739)
  ([d07f3ca4](https://github.com/deployd/deployd/commit/d07f3ca49640b90401b30ae7383870c50b9b44be))
- **user-collection:** ensure password is a string
  ([e81c6c7b](https://github.com/deployd/deployd/commit/e81c6c7bc3b28c1c2fddee8c85014724356ca8bb),
   [#735](https://github.com/deployd/deployd/issues/735))


<a name="v0.8.8"></a>
# v0.8.8 (2016-01-18)

## Refactor

- **session:** use socket.io rooms for emitToUsers ([ff5f840c95](https://github.com/deployd/deployd/commit/ff5f840c9514679f9161af146266d83f3a4f16af))

## Bug Fixes

- **dpd.js:** use encodeURIComponent
  ([8d58a12e](https://github.com/deployd/deployd/commit/8d58a12e9e0031da73970d6079c4dd2d525b3838))
- **repl:** update outdated property name
  ([05f731c8](https://github.com/deployd/deployd/commit/05f731c88cd6bbbfedf79b2fb2b4d17c9860ed21),
   [#680](https://github.com/deployd/deployd/issues/680))
- **session:**
  - memory leak
  ([a5e572a2](https://github.com/deployd/deployd/commit/a5e572a2504bc7f8230565be574d2107883fe1b1))
  - use update for updating sessions, not remove and insert
  ([3965ed3b](https://github.com/deployd/deployd/commit/3965ed3b59ffb05130a2c7f986e3296a6df22a83))
- **test:** allow some time for sessions to be cleaned up
  ([ca0ca85e](https://github.com/deployd/deployd/commit/ca0ca85eed723436ebcfc2674e420c79d1fe1d96))


## Performance Improvements

- **script:** memoize dynamic function
  ([ff6a4dce](https://github.com/deployd/deployd/commit/ff6a4dceee02401d67d4ba1348648cc55ebc13fb))


<a name="v0.8.7"></a>
# v0.8.7 (2015-10-30)


## Bug Fixes

- **dpd:**: dpd CLI was crashing (shelljs global missing)
  ([e1729f2d88](https://github.com/deployd/deployd/commit/e1729f2d887ed28d1bf7cdde123471a2b200e91f))


<a name="v0.8.6"></a>
# v0.8.6 (2015-10-29)


## Bug Fixes

- **User-collection:**
  - prevent crash on invalid user for session (thx @nicholasareed)
  ([4183b7c9](https://github.com/deployd/deployd/commit/4183b7c904889b70b703ac7324f40bb1cc457ca0))
  - Server crashes if password is number (thx @docnoe)
  ([52212427](https://github.com/deployd/deployd/commit/52212427bb80a46ac1a1afdf46316308c9ca9a4c))
- **collection:** can't rename or delete new, empty collection (thx @docnoe)
  ([49f769600](https://github.com/deployd/deployd/commit/49f7696006461c2f4c07ec8bd6b04c277b405669))
- **Dashboard:** Property types in dashboard are sortable (thx @docnoe)
  ([ab7cec630](https://github.com/deployd/deployd/commit/ab7cec6302a901c6f73612b610ac6b559ad1081f))

## Chore

  - **Dependency Update:**
    - qs to version 5.2.0
    - shelljs to version 0.5.3
    - grunt-contrib-jshint to version 0.11.3
    - sinon to version 1.17.1
    - request to version 2.65.0
  - **Cleanup**: request to version 2.65.0
  ([0adf309a5](https://github.com/deployd/deployd/commit/0adf309a5325949144a1f617f2fd5673ab4b7060))
  - **Build**: Our tests now run on NodeJS 4.2
  ([a5687dc352](https://github.com/deployd/deployd/commit/a5687dc352819a6278d01364bbf97ed003d7cecf))



<a name="v0.8.5"></a>
# v0.8.5 (2015-08-05)


## Bug Fixes

- **bin/dpd:** prevent process quit when latestversion is not writable
  ([d8a507d5](https://github.com/deployd/deployd/commit/d8a507d560d0c013ee32f501d3137579b682498d))
- **collection:** object queries on booleans would be converted to false
  ([84a1d039](https://github.com/deployd/deployd/commit/84a1d039833a023e22b98d5f4707f131d2f4f8d9))
- **internal-client:** add null check for ctx
  ([d3ccf38f](https://github.com/deployd/deployd/commit/d3ccf38ffd3c79afc8d6cb5c4a100ee0a2ba4472))
- **session:** improve how socket.io connection to finds session
  ([bb05ce4a](https://github.com/deployd/deployd/commit/bb05ce4a9f076d0c2b3c23c2438a8a70ee2dab56))
- **user-collection:** null check to prevent crash
  ([36c4ec2d](https://github.com/deployd/deployd/commit/36c4ec2df705278cdb7de16c774bd3b938b35a1d))


## Features

- **collection:**
  - add BeforeRequest event
  ([4960d07f](https://github.com/deployd/deployd/commit/4960d07fbade755470ee6d7ff29b9ccc7645c941))
  - Add Collection.extendDomain()
  ([450b8ada](https://github.com/deployd/deployd/commit/450b8adae23770ff7899fe8dceef971cdcb539c9))
  - Add `previous` to AfterCommit event
  ([fd8c9750](https://github.com/deployd/deployd/commit/fd8c9750922ebfeb35ab9b9c31ba9056c3687bf5))
- **http:**
  - option to allow dpd-ssh-key via CORS
  ([2f795565](https://github.com/deployd/deployd/commit/2f795565036a20b731bfd0d0d3bdaa8fea3f5140))
  - cache OPTIONS request for 5 minutes
  ([89cd1f02](https://github.com/deployd/deployd/commit/89cd1f023fddee118162d4efc055d8409fd9e899))
- **internal-client:**
  - allow access to underlying resource from dpd internal client
  ([d478b348](https://github.com/deployd/deployd/commit/d478b348d62be16fa2801aaff5f40d376fb9f193))
  - pass through headers and connection from caller
  ([9a1cefc0](https://github.com/deployd/deployd/commit/9a1cefc0865412fedc14bf158b07ea595ca4a3e4))
- **script:**
  - improve cancel()
  ([ea2bb011](https://github.com/deployd/deployd/commit/ea2bb0110a2aa55e9127a5547d943577eb79fb22))
  - $addCallback $finishCallback
  ([d8dbf3b0](https://github.com/deployd/deployd/commit/d8dbf3b0f3b0dfc6d0e0b18913c67f84814cafc1))


<a name="v0.8.4"></a>
## v0.8.4 (2015-05-26)

- **chore:** update mongo and socket.io


<a name="v0.8.3"></a>
## v0.8.3 (2015-05-26)


### Bug Fixes

- **UserCollection:** `onGet` event can break session handling
  ([74f23631](https://github.com/deployd/deployd/commit/74f2363141defd66b969a8ad84e2a0932f5c57ff))
- **db:** Properly report database connection issues
  ([25308f89](https://github.com/deployd/deployd/commit/25308f8941bd63b91d0174015d0d58a3fa3dddeb))
- **http:**
  - allow X-Session-* headers through CORS response
  ([e8aa28b3](https://github.com/deployd/deployd/commit/e8aa28b34ba801d77347d1f5967e705957d83aad))
  - Allow CORS authorization header (for non-cookie auth)
  ([f6c13c96](https://github.com/deployd/deployd/commit/f6c13c964c021840a15936c2bca1d1933e273cf3))
- **internal-resource:** handle errors in type events
  ([7cec886c](https://github.com/deployd/deployd/commit/7cec886c7adde990b332f1c004d1b761e14d9274))
- **session:** socket disconnection after login
  ([56fe4d83](https://github.com/deployd/deployd/commit/56fe4d835d20026c1a46ae12a0a8f7e4f5562700))
- **store:** add error handling in callbacks
  ([0bbce4e7](https://github.com/deployd/deployd/commit/0bbce4e7940b84e96050a7cccbe304fc80656e02))
- **user-collection:** do not allow empty passwords on PUT/POST
  ([fa076553](https://github.com/deployd/deployd/commit/fa07655318f89e1793a0d12772f1e165421cada9))

  **NB:** There's a breaking change for an undocumented feature: due to the CORS improvements, all unknown origins will be rejected for CORS requests.
For more info, please refer to [this message](https://github.com/deployd/deployd/pull/572#issuecomment-103904502)

### Features

- **collection:** add AfterCommit event
  ([1d6bec51](https://github.com/deployd/deployd/commit/1d6bec51e791b894c6dfa8286401045be709c93f))
- **dashboard:** height of code editor should fill window
  ([7ed76106](https://github.com/deployd/deployd/commit/7ed761069596bef0e7572b977be8196b1d54f15a))
- **session:** allow multiple sockets per sessions And add options.origins
  ([f67ee1ec](https://github.com/deployd/deployd/commit/f67ee1ecc59fd8825059793462fab40fc89d2faf))

## 0.8.2 (2015-04-23)

### Bug Fixes

- **collection:** should not crash on deleting non existent id
  ([1b85c2127c](https://github.com/deployd/deployd/commit/1b85c2127c0badda706e34e10522e20dbd7bd879))

## 0.8.1 (2015-04-22)

### Bug Fixes

- **UserCollection:** res.cookies not available from internal client
  ([5717c4d1](https://github.com/deployd/deployd/commit/5717c4d124060bcb41a794ceeec1a84ed4ca1597))
- **cli:**
  - dpd keygen fails when .dpd folder doesn't exist
  ([b5a6fd5b](https://github.com/deployd/deployd/commit/b5a6fd5b5eebdbc755153cc58234459aeabef908))
  - bug515 correct wrong error message when deployd crashes
  ([59af175c](https://github.com/deployd/deployd/commit/59af175c5c40e210828a2aa6ea71cad459d0f8c2))
- **dashboard:** use ejs delimiter instead of open and close tag
  ([776e17cf](https://github.com/deployd/deployd/commit/776e17cfa8b1263373ddf9ef6c1336d8af37315c))
- **delete:** call Delete event for every record matched
  ([462c6766](https://github.com/deployd/deployd/commit/462c6766351a1bbac86d730d58f272ca98869527))
- **dpd.js:** dpd.socket null
  ([5331ac39](https://github.com/deployd/deployd/commit/5331ac397400e0c6c11a6caee3ea1d1d3cefa58b))
- **script:** memory leak and performance improvement
  ([578bd28d](https://github.com/deployd/deployd/commit/578bd28d0feee81caa1bcb7045c259b8e0d44797))
- **server:** allow request.rawBody for middlewares
  ([59fbdbab](https://github.com/deployd/deployd/commit/59fbdbab1760bafe043a4f4e4dfef851ac02c7c8),
   [#519](https://github.com/deployd/deployd/issues/519))
- **user-collection:** crash when password is not specified in login
  ([65f4170b](https://github.com/deployd/deployd/commit/65f4170b7881ebb01ba50c4ee47fae22f3fe001e))

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
