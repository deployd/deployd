var fs = require('fs')
  , util = require('util')
  , crypto = require('crypto')
  , stream = require('stream')
  , path = require('path')
  , mime = require('mime')
  , rfc822 = require('./rfc822')
  ;

function File (options) {
  stream.Stream.call(this)

  this.writable = true
  this.readable = true
  this.buffers = []

  var self = this

  if (typeof options === 'string') options = {path:options}
  if (!options.index) options.index = 'index.html'
  self.writable = (typeof options.writable === "undefined") ? true : options.writable
  self.readable = (typeof options.readable === "undefined") ? true : options.readable

  self.path = options.path
  self.index = options.index

  self.on('pipe', function (src) {
    this.src = src
  })

  this.buffering = true

  this.mimetype = options.mimetype || mime.lookup(this.path.slice(this.path.lastIndexOf('.')+1))

  var stopBuffering = function () {
    self.buffering = false
    while (self.buffers.length) {
      self.emit('data', self.buffers.shift())
    }
    if (self.ended) self.emit('end')
  }

  fs.stat(options.path, function (err, stats) {

    var finish = function (err, stats) {
      self.stat = stats
      if (err && err.code === 'ENOENT' && !self.dest && !self.src) self.src = self.path
      if (err && !self.dest && !self.src) return self.emit('error', err)
      if (err && self.dest && !self.dest.writeHead) return self.emit('error', err)

      // See if writes are disabled
      if (self.src && self.src.method &&
          !self.writable && self.dest.writeHead &&
          (self.src.method === 'PUT' || self.src.method === 'POST')) {
        self.dest.writeHead(405, {'content-type':'text/plain'})
        self.dest.end(self.src.method+' Not Allowed')
        return
      }

      if (!err) {
        self.etag = crypto.createHash('md5').update(stats.ino+'/'+stats.mtime+'/'+stats.size).digest("hex")
        self.lastmodified = rfc822.getRFC822Date(stats.mtime)
      }

      process.nextTick(function () {
        stopBuffering()
      })

      // 404 and 500
      if ( err && self.dest && self.dest.writeHead && // We have an error object and dest is an HTTP response
           ( // Either we have a source and it's a GET/HEAD or we don't have a src
             (self.src && (self.src.method == 'GET' || self.src.method === 'HEAD')) || (!self.src)
           )
         ) {
        if (err.code === 'ENOENT') {
          self.dest.statusCode = 404
          self.dest.end('Not Found')
        } else {
          self.dest.statusCode = 500
          self.dest.end(err.message)
        }
        return
      }

      // Source is an HTTP Server Request
      if (self.src && (self.src.method === 'GET' || self.src.method === 'HEAD') && self.dest) {
        if (self.dest.setHeader) {
          self.dest.setHeader('content-type', self.mimetype)
          self.dest.setHeader('etag', self.etag)
          self.dest.setHeader('last-modified', self.lastmodified)
        }

        if (self.dest.writeHead) {
          if (self.src && self.src.headers) {
            if (self.src.headers['if-none-match'] === self.etag ||
                // Lazy last-modifed matching but it's faster than parsing Datetime
                self.src.headers['if-modified-since'] === self.lastmodified) {
              self.dest.statusCode = 304
              self.dest.end()
              return
            }
          }
          // We're going to return the whole file
          self.dest.statusCode = 200
          self.dest.setHeader('content-length', stats.size)
        } else {
          // Destination is not an HTTP response, GET and HEAD method are not allowed
          return
        }
        
        if (self.src.method !== 'HEAD') {
          fs.createReadStream(self.path).pipe(self.dest)
        }
        return
      }
      
      if (self.src && (self.src.method === 'PUT' || self.src.method === 'POST')) {
        if (!err) {
          // TODO handle overwrite case
          return
        }
        stream.Stream.prototype.pipe.call(self, fs.createWriteStream(self.path))
        if (self.dest && self.dest.writeHead) {
          self.on('end', function () {
            self.dest.statusCode = 201
            self.dest.setHeader('content-length', 0)
            self.dest.end()
          })
        }
        return
      }
      
      // Desination is an HTTP response, we already handled 404 and 500
      if (self.dest && self.dest.writeHead) {
        self.dest.statusCode = 200
        self.dest.setHeader('content-type', self.mimetype)
        self.dest.setHeader('etag', self.etag)
        self.dest.setHeader('last-modified', self.lastmodified)
        self.dest.setHeader('content-length', stats.size)
        fs.createReadStream(self.path).pipe(self.dest)
        return
      }

      // Destination is not an HTTP request

      if (self.src && !self.dest) {
        stream.Stream.prototype.pipe.call(self, fs.createWriteStream(self.path))
      } else if (self.dest && !self.src) {
        fs.createReadStream(self.path).pipe(self.dest)
      }
    }

    if (!err && stats.isDirectory()) {
      self.path = path.join(self.path, self.index)
      self.mimetype = mime.lookup(self.path.slice(self.path.lastIndexOf('.')+1))
      fs.stat(self.path, finish)
      return
    } else {
      finish(err, stats)
    }
    
    if (!self.src && !self.dest) {
      if (self.buffers.length > 0) {
        stream.Stream.prototype.pipe.call(self, fs.createWriteStream(self.path))
      } else if (self.listeners('data').length > 0) {
        fs.createReadStream(self.path).pipe(self.dest)
      } else {
        fs.createReadStream(self.path).pipe(self)
      }
    }

  })

}
util.inherits(File, stream.Stream)
File.prototype.pipe = function (dest, options) {
  this.dest = dest
  this.destOptions = options
  dest.emit('pipe', this)
  // stream.Stream.prototype.pipe.call(this, dest, options)
  return dest
}
File.prototype.write = function (chunk, encoding) {
  if (encoding) chunk = chunk.toString(encoding)
  if (this.buffering) {
    this.buffers.push(chunk)
  } else {
    this.emit('data', chunk)
  }
}
File.prototype.end = function (chunk) {
  if (chunk) this.write(chunk)
  if (this.buffering) {
    this.ended = true
  } else {
    this.emit('end')
  }
}

module.exports = function (options) {
  return new File(options)
}
module.exports.File = File
