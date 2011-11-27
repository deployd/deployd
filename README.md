# Deployd
## Core

**Currently under development.**
See [site](http://deployd.com) for more information.

## Core Setup

Deployd requires Node 0.4.0 or greater, Node Package Manager, and MongoDB to run. The core is tested with MongoDB 1.6.3, but should work with other versions.

* http://nodejs.org/#download
* http://npmjs.org/
* http://www.mongodb.org/downloads

Once you're all set, clone the project and get Node package dependencies from npm.

  > $ git clone git@github.com:Deployd/Deployd.git  
  > $ cd Deployd  
  > $ npm install .  

To start the server, start Mongo then start the Node server.

  > $ mongod  
  > ...  
  > $ cd Deployd  
  > $ node index.js (may require `sudo node index.js`)  