# deployd

> the simplest way to build an api.

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/deployd/deployd)  [![Current Version](https://img.shields.io/npm/v/deployd.svg?style=flat-square)](https://www.npmjs.org/package/deployd) [![Build Status](https://img.shields.io/travis/deployd/deployd.svg?style=flat-square)](http://travis-ci.org/deployd/deployd)

## overview

Deployd is the simplest way to build realtime APIs for web and mobile apps. Ready-made, configurable Resources add common functionality to a Deployd backend, which can be further customized with JavaScript Events.

[Read more about deployd](http://deployd.com)

## quick start

	$ dpd create hello
	$ cd hello
	$ dpd -d

## helpful resources

 - [Docs](http://docs.deployd.com/)
 - [Getting Started Guide](http://docs.deployd.com/docs/getting-started/what-is-deployd.html)
 - [Hello World Tutorial](http://docs.deployd.com/docs/getting-started/your-first-api.html)
 - [API Docs](http://docs.deployd.com/api)
 - [Community Discussion Page](https://groups.google.com/forum/?fromgroups#!forum/deployd-users)
 - [Gitter Chat Page](https://gitter.im/deployd/deployd)
 - [Example Apps](http://docs.deployd.com/examples/)


## install from npm

	npm install deployd -g

## install on windows

[Download](https://bintray.com/artifact/download/deployd/dpd-win-installer/deployd-win-0.8.0.exe) the installer.

## install on macosx

The macosx installer is deprecated. The recommended way is now npm (`npm install deployd -g`) and [install mongodb](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/) separately.

## install from source

	git clone https://github.com/deployd/deployd.git
	npm install
	npm link

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

    Copyright 2012 deployd llc
