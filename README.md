# deployd

distributed resource server

[documentation](http://deployd.github.com/deployd)

## Features

**Users**

  - Register, Login, and Logout Users
  - Restrict access to data
  
**Data** 

  - Query, Insert, Update, and Remove JSON Objects over HTTP
  - JSON Schema Validation
  - Scriptable Validation
  
**Files**

  - Upload using the dashboard web ui or CLI
  - Fully structured distributed file system built on GridFS
  - Fast file streaming
  - Optimized for serving from ec2, heroku, nodejitsu, and other similar clouds

## Dependencies

Currently deployd requires mongodb to be installed. You can download it [here](http://www.mongodb.org/downloads).

Deployd also requires `node.js` >= v0.6.0. You can download it [here](http://nodejs.org/#download).

## Installation

    $ [sudo] npm install deployd -g
    
## Start

You can start the server with the `dpd` command line interface. For more commands see `dpd -h`.

    $ dpd -d
    
Including the `-d` flag will open the dashboard in your default browser.

## Questions

Consult the [documentation](http://deployd.github.com/deployd) or contact `ritchie at deployd com`.