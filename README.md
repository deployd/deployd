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

## License

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