# deployd

realtime resource server

<!-- ## install from npm

_currently requires [mongodb](http://www.mongodb.org/downloads)_

	[sudo] npm install deployd -g -->

## install from github

	git clone https://github.com/deployd/deployd.git
	npm install
	npm link

## quick start

	$ dpd create hello
	$ cd hello
	$ dpd
	dpd> dashboard

## tests

	$ npm install deployd -dg

or

	$ git clone git@github.com:deployd/deployd.git
	$ npm link

then

	$ cd deployd
	$ mongod
	$ mocha