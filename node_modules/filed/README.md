# filed -- Simplified file library.

## Install

<pre>
  npm install filed
</pre>

## Super simple to use

Filed does a lazy stat call so you can actually open a file and begin writing to it and if the file isn't there it will just be created.

```javascript
var filed = require('filed');
var f = filed('/newfile')
f.write('test')
f.end()
```

## Streaming

The returned file object is a stream so you can do standard stream stuff to it. Based on *what* you do the object it will be a read stream, a write stream.

So if you send data to it, it'll be a write stream.

```javascript
fs.createReadStream.pipe(filed('/newfile'))
```

If you pipe it to a destination it'll be a read stream.

```javascript
filed('/myfile').pipe(fs.createWriteStream('/out'))
```

And of course you can pipe a filed object from itself to itself and it'll figure it out.

```javascript
filed('/myfile').pipe(filed('/newfile'))
```

Those familiar with [request](http://github.com/mikeal/request) will be familiar seeing object capability detection when doing HTTP. filed does this as well.

```javascript
http.createServer(function (req, resp) {
  filed('/data.json').pipe(resp)
})
```

Not only does the JSON file get streamed to the HTTP Response it will include an Etag, Last-Modified, Content-Length, and a Content-Type header based on the filed extension.

```javascript
http.createServer(function (req, resp) {
  req.pipe(filed('/newfile')).pipe(resp)
})
```

When accepting a PUT request data will be streamed to the file and a 201 status will be sent on the HTTP Response when the upload is finished.

During a GET request a 404 Response will be sent if the file does not exist.

```javascript
http.createServer(function (req, resp) {
  req.pipe(filed('/data.json')).pipe(resp)
})
```

The Etag and Last-Modified headers filed creates are based solely on the stat() call so if you pipe a request to an existing file the cache control headers will be taken into account; a 304 response will be sent if the cache control headers match a new stat() call. This can be very helpful in avoiding unnecessary disc reads.

```javascript
http.createServer(function (req, resp) {
  req.pipe(filed('/directory')).pipe(resp)
})
```

Just to round out the full feature set and make it full file server if you give filed an existing directory it will actually check for an index.html file in that directory and serve it if it exists.
