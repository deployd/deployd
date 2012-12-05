# deployd v0.6.10

[![Build Status](https://secure.travis-ci.org/deployd/deployd.png)](http://travis-ci.org/deployd/deployd)

## overview

Deployd is the simplest way to build realtime APIs for web and mobile apps. Ready-made, configurable Resources add common functionality to a Deployd backend, which can be further customized with JavaScript Events.

[Read more about deployd](http://deployd.com)

## install osx

[Download](http://deployd.com/download.html) the installer.

## install win

[Download](http://deployd.com/download.html) the installer.

## quick start

	$ dpd create hello
	$ cd hello
	$ dpd -d
	
## helpful resources

 - [Docs](http://docs.deployd.com/)
 - [Getting Started Guide](http://docs.deployd.com/docs/getting-started/what-is-deployd.md)
 - [Hello World Tutorial](http://docs.deployd.com/docs/getting-started/your-first-api.md)
 - [API Docs](http://docs.deployd.com/api)
 - [Community Discussion Page](http://deployd.com/community.html)
 - [Example Apps](http://docs.deployd.com/examples/)

## install from npm

	npm install deployd -g

## install from source

	git clone https://github.com/deployd/deployd.git
	npm install
	npm link

## unit tests

	cd deployd
	mongod &
	npm test

## integration tests
	
	cd test-app
	dpd -o

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