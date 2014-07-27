#!/usr/bin/env node

var assert = require( "assert" )
  , http = require( "http" )
  , keys = require( "keygrip" )(['a', 'b'])
  , Cookies = require( "../" )
  , options = { host: "localhost", port: 8000, path: "/set" }
  , server

server = http.createServer( function( req, res ) {
  var cookies = new Cookies( req, res, keys )
    , unsigned, signed, tampered, overwrite

  if ( req.url == "/set" ) {
    cookies
      // set a regular cookie
      .set( "unsigned", "foo", { signed:false, httpOnly: false } )

      // set a signed cookie
      .set( "signed", "bar", { signed: true } )

      // mimic a signed cookie, but with a bogus signature
      .set( "tampered", "baz" )
      .set( "tampered.sig", "bogus" )

      // set a cookie that will be overwritten
      .set( "overwrite", "old-value", { signed: true } )
      .set( "overwrite", "new-value", { overwrite: true, signed: true } )

    res.writeHead( 302, { "Location": "/" } )
    return res.end( "Now let's check." )
  }

  unsigned = cookies.get( "unsigned" )
  signed = cookies.get( "signed", { signed: true } )
  tampered = cookies.get( "tampered", { signed: true } )
  overwrite = cookies.get( "overwrite", { signed: true } )

  assert.equal( unsigned, "foo" )
  assert.equal( cookies.get( "unsigned.sig", { signed:false } ), undefined)
  assert.equal( signed, "bar" )
  assert.equal( cookies.get( "signed.sig", { signed: false } ), keys.sign('signed=bar') )
  assert.notEqual( tampered, "baz" )
  assert.equal( tampered, undefined )
  assert.equal( overwrite, "new-value" )
  assert.equal( cookies.get( "overwrite.sig", { signed:false } ), keys.sign('overwrite=new-value') )

  assert.equal(res.getHeader('Set-Cookie'), 'tampered.sig=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly')

  res.writeHead( 200, { "Content-Type": "text/plain" } )
  res.end(
    "unsigned expected: foo\n" +
    "unsigned actual: " + unsigned + "\n\n" +
    "signed expected: bar\n" +
    "signed actual: " + signed + "\n\n" +
    "tampered expected: undefined\n"+
    "tampered: " + tampered + "\n"
  )
})

server.listen( 8000 )

http.get( options, function( res ) {
  var cookies = res.headers[ "set-cookie" ]
    , body = ""

  console.log( "\ncookies set:", cookies )
  console.log( "\n============\n" )
  assert.equal(cookies.length, 7)

  options.path = res.headers[ "location" ]
  options.headers = { "Cookie": cookies.join(";") }

  http.get( options, function( res ) {
    res.on( "data", function( chunk ){ body += chunk } )
    res.on( "end", function(){ console.log( body ) })
    server.close()
  })
})