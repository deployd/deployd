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

## unit tests

	$ cd deployd
	$ mongod &
	$ mocha

## integration tests
	
	cd test-app
	dpd -o
