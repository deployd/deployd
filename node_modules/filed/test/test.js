var filed = require('../main')
  , server = require('./server')
  , fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , request = require('request')
  , test1buffer = ''
  , testfile = path.join(__dirname, 'test.js')
  , writefile = path.join(__dirname, 'testdump-')
  , cleanup = []
  , validations = []
  , port = 9090
  , i = 0
  , url = 'http://localhost:'+port
  ;

while (i < 50) {
  try {fs.unlinkSync(writefile+i)}
  catch (e) {}
  i += 1
}

function FileValidator (path) {
  this.path = path
  this.buffers = []
  this.len = 0
  this.writable = true
}
FileValidator.prototype.write = function (chunk) {
  this.buffers.push(chunk)
  this.len += chunk.length
}
FileValidator.prototype.end = function () {
  var body = new Buffer(this.len)
  var i = 0
  this.buffers.forEach(function (chunk) {
    chunk.copy(body, i, 0, chunk.length)
    i += chunk.length
  })
  var f = fs.readFileSync(this.path)
  assert.equal(body.length, f.length)
  assert.deepEqual(body, f)
}
FileValidator.prototype.on = function () {}
FileValidator.prototype.removeListener = function () {}
FileValidator.prototype.emit = function () {}

function equalSync (f1, f2) {
  f1 = fs.readFileSync(f1)
  f2 = fs.readFileSync(f2)
  assert.equal(f1.length, f2.length)
  assert.deepEqual(f1, f2)
}

// Test reading
filed(testfile).pipe(new FileValidator(testfile))

// Test writing

function testwrites () {
  var x = filed(writefile+1)
    , y = fs.createReadStream(testfile)
    ;
  y.pipe(x)
  x.on('end', function () {
    setTimeout(function () {
      equalSync(writefile+1, testfile)
      console.log("Passed writing files")
    }, 1000)
  })
}
testwrites()

function testhttp () {
  // Test HTTP use cases
  var s = server()
  s.on('/test-req', function (req, resp) {
    // Take a request and write it, do not send filed to the response
    req.pipe(filed(writefile+2))
    req.on('end', function () {
      resp.writeHead(201)
      resp.end()
      setTimeout(function () {
        equalSync(writefile+2, testfile)
        console.log("Passed PUT file with pipe req only")
      }, 1000)
    })
  })

  s.on('/test-req-resp', function (req, resp) {
    // Take a request and write it and pipe filed to the response
    var x = filed(writefile+3)
    req.pipe(x)
    x.pipe(resp)
    req.on('end', function () {
      setTimeout(function () {
        equalSync(writefile+3, testfile)
        console.log("Passed PUT file with pipe req and resp")
      }, 1000)
    })
  })

  s.on('/test-resp', function (req, resp) {
    // Send a file to an HTTP response
    filed(testfile).pipe(resp)
  })

  var fullpipe = function (req, resp) {
    var x = filed(testfile)
    req.pipe(x)
    x.pipe(resp)
  }

  s.on('/test-etags-wo', function (req, resp) {
    fullpipe(req, resp)
  })
  s.on('/test-etags-with', function (req, resp) {
    fullpipe(req, resp)
  })

  s.on('/test-lastmodified-wo', function (req, resp) {
    fullpipe(req, resp)
  })
  s.on('/test-lastmodified-with', function (req, resp) {
    fullpipe(req, resp)
  })

  s.on('/test-index', function (req, resp) {
    var x = filed(__dirname)
    x.pipe(resp)
  })

  s.on('/test-index-full', function (req, resp) {
    var x = filed(__dirname)
    req.pipe(x)
    x.pipe(resp)
  })

  s.on('/test-not-found', function (req, resp) {
    var x = filed(__dirname + "/there-is-no-such-file-here.no-extension")
    req.pipe(x)
    x.pipe(resp)
  })

  s.listen(port, function () {

    fs.createReadStream(testfile).pipe(request.put(url+'/test-req'))

    fs.createReadStream(testfile).pipe(request.put(url+'/test-req-resp', function (e, resp) {
      assert.equal(resp.statusCode, 201)
      assert.equal(resp.headers['content-length'], '0')
    }))

    var x = request.get(url+'/test-resp', function (e, resp) {
      if (e) throw e
      assert.equal(resp.statusCode, 200)
      assert.equal(resp.headers['content-type'], 'application/javascript')
      console.log("Passed GET file without piping request")
    })
    x.pipe(new FileValidator(testfile))

    request.get(url+'/test-etags-wo', function (e, resp, body) {
      if (e) throw e
      if (resp.statusCode !== 200) throw new Error('Status code is not 200 it is '+resp.statusCode)
      request.get({url:url+'/test-etags-with', headers:{'if-none-match':resp.headers.etag}}, function (e, resp) {
        if (e) throw e
        if (resp.statusCode !== 304) throw new Error('Status code is not 304 it is '+resp.statusCode)
        console.log("Passed GET with etag")
      })
    })

    request.get(url+'/test-lastmodified-wo', function (e, resp, body) {
      if (e) throw e
      if (resp.statusCode !== 200) throw new Error('Status code is not 200 it is '+resp.statusCode)
      request.get({url:url+'/test-lastmodified-with', headers:{'if-modified-since':resp.headers['last-modified']}}, function (e, resp) {
        if (e) throw e
        if (resp.statusCode !== 304) throw new Error('Status code is not 304 it is '+resp.statusCode)
        console.log("Passed GET with if-modified-since")
      })
    })

    request.get(url+'/test-index', function (e, resp, body) {
      if (e) throw e
      if (resp.statusCode !== 200) throw new Error('Status code is not 200 it is '+resp.statusCode)
      assert.equal(resp.headers['content-type'], 'text/html')
      assert.equal(body, fs.readFileSync(path.join(__dirname, 'index.html')).toString())
      console.log("Passed GET of directory index")
    })

    request.get(url+'/test-index-full', function (e, resp, body) {
      if (e) throw e
      if (resp.statusCode !== 200) throw new Error('Status code is not 200 it is '+resp.statusCode)
      assert.equal(resp.headers['content-type'], 'text/html')
      assert.equal(body, fs.readFileSync(path.join(__dirname, 'index.html')).toString())
      console.log("Passed GET of directory index, full pipe")
    })

    request.get(url+'/test-not-found', function (e, resp, body) {
      if (e) throw e
      if (resp.statusCode !== 404) throw new Error('Status code is not 404 it is '+resp.statusCode)
      console.log("Passed Not Found produces 404")
    })

  })

}
testhttp()

process.on('exit', function () {console.log('All tests passed.')})
