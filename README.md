# deployd

realtime resource server

## install osx

[Download](http://deployd.com) the installer (13.8mb).

## install win

[Download](http://deployd.com) the installer (13.8mb).

## install npm

_currently requires [mongodb](http://www.mongodb.org/downloads)_

	[sudo] npm install deployd -g

## quick start

	$ dpd create hello
	$ cd hello
	$ dpd
	dpd> dashboard

## docs

 - Getting Started
 - Examples
 - Collections
 - Users
 - CLI

## tests

	$ npm install deployd -dg

or

	$ git clone git@github.com:deployd/deployd.git
	$ npm link

then

	$ cd deployd
	$ mongod
	$ mocha