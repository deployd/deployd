# deployd

> the simplest way to build an api.

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/deployd/deployd)  [![Current Version](https://img.shields.io/npm/v/deployd.svg?style=flat-square)](https://www.npmjs.org/package/deployd) [![Build Status](https://img.shields.io/travis/deployd/deployd.svg?style=flat-square)](http://travis-ci.org/deployd/deployd)

## overview

Deployd is the simplest way to build realtime APIs for web and mobile apps. Ready-made, configurable Resources add common functionality to a Deployd backend, which can be further customized with JavaScript Events.

## features

 - secure access to database APIs directly from untrusted clients (browser js, mobile apps, etc)
 - notify clients in realtime of events occurring within the database
 - user and session management
 - all APIs exposed over REST / HTTP
 - bundled browser JavaScript client
 - web socket authentication and session management
 - can be hosted by modern cloud platforms
 - support extension through node modules and npm

[Read more about deployd](http://deployd.com)

⚠️ Deployd v1.0.0 has been released. [Read the migration guide](#migration-guide-to-v1.0.0) below.

## Requirements

Deployd is built using node and published using npm.  
To install and use it, you need to install **[Node.JS](https://nodejs.org/en/download/)**.

## quick start

	$ npm install deployd-cli -g
	$ dpd create hello
	$ cd hello
	$ dpd -d

## Best Practices

 1. Once you start writing anything serious, you should start your project using a node script instead of the `dpd` command. [Read more here](http://docs.deployd.com/docs/server/run-script.html). `Dpd` is only meant to be used as a quick prototyping tool.
 2. You are encouraged to structure your resources in a hierarchy based on what they belong to. Since deployd 1.1.0 you can name your resources like the following example:

    1. Assume your user collection is named `users`
    2. Their associated photos could be in a collection named `users/photos`.
    3. A potential [dpd-event](https://www.npmjs.org/package/dpd-event) script associated to photos could go in `users/photos/resize`.

 3. Once your project grows, you may find yourself writing code in one place that you need elsewhere. Take a look at [dpd-codemodule](https://www.npmjs.org/package/dpd-codemodule) for this purpose.
 4. Keep in mind that `deployd` comes with **absolutely no built-in access control checking**. Anyone can delete, read, or update any information from any collection unless you close this down. We recommend plugging in your permission checks in `On BeforeRequest` events, and/or other appropriate places.
 5. The [dpd-clientlib](https://www.npmjs.org/package/dpd-clientlib) package is provided mostly as a convenience and should probably not be used directly in production. Once your project outgrows it, feel free to replace it with something else. You may use any HTTP library and/or [socket.io](https://www.npmjs.org/package/socket.io) client implementation to interact with deployd. Please see the documentation for more information.
 6. You will find plugins for various sorts of tasks on [npm](https://www.npmjs.org/) if you search for `dpd`. Deployd plugins start with dpd-*name*
 7. You can use `deployd` in a cluster configuration. In order for the socket.io adapter to be able to emit to clients on other cluster nodes, you will need to use Redis as a pub/sub server. See [here](https://github.com/deployd/deployd/pull/698) for more information.
 8. Try not to run `dpd.somecollection.get()` type queries inside `On GET` handlers. 
    1. These can have severe performance implications especially when running queries that return multiple results, because each subquery will execute at least once for every document returned. 
    2. Instead you should put your logic in [dpd-event](https://www.npmjs.org/package/dpd-event) scripts that run as fewer queries as possible, and which concatenate the results using code. [lodash](https://www.npmjs.org/package/lodash) can be a good library to help with merging results.
 
 ## Other notes:
 
 - *emit to users* type calls that return multiple results (eg: `emit(dpd.users, {active: true}, 'postModified', this);`) are inefficient and should be avoided. Instead you should join sessions to rooms and emit to rooms instead. See PR [698](https://github.com/deployd/deployd/pull/698) for more info.
 - if you do not use [dpd-clientlib](https://www.npmjs.org/package/dpd-clientlib), keep in mind that you will need to associate the connected websocket with the session id after authenticating. You can do this by emitting a `server:setsession` message on the socket, with a payload of `{sid: 'sessionid'}`. You can get the session id by calling the `login` method of the user collection resource. See the documentation for more information.

## Helpful Resources

 - [Docs](http://docs.deployd.com/)
 - [Getting Started Guide](http://docs.deployd.com/docs/getting-started/what-is-deployd.html)
 - [Hello World Tutorial](http://docs.deployd.com/docs/getting-started/your-first-api.html)
 - [API Docs](http://docs.deployd.com/api)
 - [Community Discussion Page](https://groups.google.com/forum/?fromgroups#!forum/deployd-users)
 - [Gitter Chat Page](https://gitter.im/deployd/deployd)
 - [Example Apps](http://docs.deployd.com/examples/)


## Migration guide to v1.0.0

v1.0.0 contains a big refactoring: the CLI, dashboard and client-lib has been extracted from the core to allow easier contributions and maintainability.  
Here's a guide to help you migrate to v.1.0.0.

If you start your application [using a node script (recommended)](http://docs.deployd.com/docs/server/run-script.html), you just need to update the `deployd` dependency and add the missing ones (client-lib and dashboard).

```bash
$ npm install deployd@latest --save
$ npm install dpd-dashboard dpd-clientlib --save-dev
```

If you use the CLI to start your app (using `dpd` inside your app folder), you will need to uninstall the old global version of `deployd` and install `deployd-cli`.
`npm uninstall deployd -g && npm install deployd-cli -g`

If you have trouble making it work, feel free to ask for help on [the chat](https://gitter.im/deployd/deployd).

## install from npm

Once Node.JS is installed, open your terminal and type the following command:

```bash
npm install deployd-cli -g
```

the `dpd` command should be available. Type `dpd -V` and the current version should appear.

## install on windows

The windows installer is deprecated. The recommended way is now npm (`npm install deployd-cli -g`) and [install mongodb](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/) separately.

## install on macosx

The macosx installer is deprecated. The recommended way is now npm (`npm install deployd-cli -g`) and [install mongodb](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/) separately.

## install from source

	git clone https://github.com/deployd/deployd.git
	npm install

## unit & integration tests

	cd deployd
	mongod &
	npm test

## license

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

    Copyright 2017 deployd llc
