# History

## 0.7.0

### New Features
- New utilities for extending Resource Types.
  - Added `Resource.extend("ResourceName", { /* members */ })` syntax for extending Resources. The `init()` function is used as a constructor. The old `util.inherits()` syntax will continue to work.
  - Moved `Resource` base class to the exports of the deployd module. You can now use `require('deployd').Resource` instead of `require('deployd/lib/resource')`.
  - Added `get(ctx, next)`, `post(ctx, next)`, `put(ctx, next)`, and `del(ctx, next)` utility functions on `Resource`. You can now override those instead of `handle()`. 
- New `Module` type in extension API
  - Modules can define multiple Resource Types with `this.addResourceType()`
  - [TODO] Modules can register their own dashboards.

### Breaking Changes
- Most configuration properties on the `Resource` class have been moved to the prototype: `external`, `events`, `basicDashboard`, and `dashboard`.
  - The `label` and `defaultType` properties will remain on the constructor, as they shouldn't be inherited.
- The configuration option `Resource.events` has been renamed `Resource.eventNames`.


- resources now support custom events by default
- new collection permission api

### Major Bugfixes