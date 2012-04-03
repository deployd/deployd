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