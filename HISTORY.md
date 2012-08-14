# History

## 0.6

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