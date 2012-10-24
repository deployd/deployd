# History

## 0.6.7

 - Added new data editor
 - Fixed major bug where calling error() would not always cancel the request
 - Fixed bug where PUT would fail without an error if you provided a query
 - Changed root behavior - no longer ignores cancel() in events
 - Fixed bugs preventing events from being `emit()`ed to users in certain connection states
 - Fixed bug where boolean query values (?bool=true) were not treated as booleans
 - Fixed unnecessary error when parsing JSON body
 - Added more intelegent body parsing
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