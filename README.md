# deployd

realtime resource server

## quick start

    [sudo] npm install deployd -g
    dpd create my-app

## features

 - secure access to database APIs directly from untrusted clients (browser js, mobile apps, etc)
 - automatic properties and relationships for complex queries without joins (or sql)
 - notify clients in realtime of events occurring within the database
 - simple security specific language for scripting access control based on context
 - run as a stand-alone server or as a library in your existing node app
 - user and session management
 - all APIs exposed over REST / HTTP
 - web socket authentication and session management

## goals

 - be database agnostic
 - be client agnostic (usable from browser, servers, mobile apps, etc)
 - be a good web citizen / support native web best practices
 - be a good node citizen / use node best practices
 - can be hosted by modern cloud platforms
 - support extension through node modules and npm
 - follow the [ways of node](http://www.mikealrogers.com/posts/the-way-of-node.html)
 - follow the [12 factor methodology](http://www.12factor.net/)

## microscript

...

## resources

You can write completely custom resources in deployd as simple, familiar node modules. All you have to do is extend the base `Resource` and implement a single function. Here is a simple `hello world` resource that emits `'hello'` to everyone when they connect and `'hello, bob'` if they are logged in as a user named bob.

		function HelloWorldResource() {
			// init
		}
		util.inherits(HelloWorldResource, require('deployd').Resource);
		module.exports = HelloWorldResource;

		HelloWorldResource.prototype.handle(ctx) {
			ctx.end('hello world');
		}

		HelloWorldResource.prototype.middleware = function(ctx, next) {
			if(req.url == '/foobar') ctx.end('foobar!');
		}

		HelloWorldResource.prototype.handleConnection(ctx) {
			if(ctx.me) {
				ctx.socket.emit('hello ' + me.name);
			} else {
				ctx.socket.emit('hello');
			}
		}

## questions

Consult the [documentation](http://deployd.github.com/deployd) or contact `ritchie at deployd com`.

## changelog

### 0.5

  - removed `property.optional` in favor of `property.required`
  - changed `object._id` to `object.id` on all stored objects

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