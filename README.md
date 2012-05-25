# deployd

realtime bridge

## quick start

    [sudo] npm install deployd -g
    dpd create my-app

## features

 - secure access to database APIs directly from untrusted clients (browser js, mobile apps, etc)
 - automatic properties and relationships for complex queries without joins (or sql)
 - notify clients in realtime of events occurring within the database
 - simple security specific language for scripting access control based on context
 - useable in your existing node app or as a stand-alone server
 - user and session management
 - all APIs exposed over REST / HTTP

## goals

 - be database agnostic
 - be client agnostic (usable from browser, servers, mobile apps, etc)
 - be a good web citizen / support native web best practices
 - be a good node citizen / use node best practices
 - can be hosted by modern cloud platforms
 - support extension through node modules and npm
 - follow the [ways of node](http://www.mikealrogers.com/posts/the-way-of-node.html)
 - follow the [12 factor methodology](http://www.12factor.net/)

## modules

**core**

 - resource - base module, mountable at a URL
 - collection - allows users to query, save, and delete JSON objects
 - users collection - allows users to register / login / logout
 - ??? - allow users to listen and emit events 
 - file system - allows users to upload / download / stream files
 - router - determines a resource based on a URL
 - emitter - global message bus / event emitter
 - sessions - manage authentication of users
 - resources - internal access to mounted resources
 - db - used by all modules to persist data
 - http server - exposes APIs over HTTP

**external**

 - client - simple client for remote access from node and browsers (more comming soon)

**third party**

  coming soon

## questions

Consult the [documentation](http://deployd.github.com/deployd) or contact `ritchie at deployd com`.

## changelog

### 0.5

  - removed `property.optional` in favor of `property.required`

## license

Copyright 2012 deployd, llc

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.