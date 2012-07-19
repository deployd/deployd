# deployd

realtime resource server

## install osx

[Download](http://deployd.com/download.html) the installer.

## install win

[Download](http://deployd.com/download.html) the installer.

## quick start

	$ dpd create hello
	$ cd hello
	$ dpd -d
	
## helpful resources

 - [Docs](http://deployd.com/docs/)
 - [Getting Started Guide](http://deployd.com/docs/)
 - [Hello World Tutorial](http://deployd.com/docs/tutorials/hello-world.html)
 - [Community Discussion Page](http://deployd.com/community.html)
 - [Example Apps](http://deployd.com/docs/examples.html)


## install from source

	git clone https://github.com/deployd/deployd.git
	npm install
	npm link


## unit tests

	$ cd deployd
	$ mongod &
	$ mocha

## integration tests
	
	cd test-app
	dpd -o
