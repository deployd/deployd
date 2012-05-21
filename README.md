# deployd

modern, distributed, resource server.

[documentation](http://deployd.github.com/deployd)

## Features

 - Streaming, Any-Size File Storage
 - Queryable JSON Collections
 - Validation
 - Authentication
 - Events
 
## Installation

    $ [sudo] npm install deployd -g
    
## Start

You can start the server with the `dpd` command line interface. For more commands see `dpd -h`.

    $ dpd listen

## Remote Administration

Deployd servers do not rely on human created passwords, instead deployd can be administered over http using a randomly generated auth key.

Use the CLI to generate a unique key for remote administration.

    $ dpd key

    added key:

    {_id: "...", ...}

Requests to low level APIs such as /types and /resources will require a `x-dssh-header` containing a key generated with `dpd`.

Keys can contain meta data for identifying their owner. This is useful in the case where access should
be granted and revoked on a key by key basis.

    $ dpd addkey '{"user":"joe"}'
  
    added key: {user: 'joe', _id: '...', ...}
    
## Questions

Consult the [documentation](http://deployd.github.com/deployd) or contact `ritchie at deployd com`.

Copyright 2012 deployd, llc

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       [http://www.apache.org/licenses/LICENSE-2.0]

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
