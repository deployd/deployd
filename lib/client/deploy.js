var path = require('path')
  , EventEmitter = require('events').EventEmitter
  , tar = require('tar')
  , fstream = require('fstream')
  , tar = require('tar')
  , zlib = require('zlib')
  , request = require('request')
  , fs = require('fs');

/**
 * deploy all files to a remote testing instance
 */

function Deployment(appPath, user) {
  this.path = path.resolve(appPath);
  this.name = this.sanitize(path.basename(this.path));
  this.subdomain = this.name;
  this.user = user;
}
exports.Deployment = Deployment;

/**
 * sanitize an app name as a proper subdomain, throwing an err if not possible
 */

Deployment.prototype.sanitize = function (name) {
  function error() {
    throw new Error('invalid name: ' + name);
  }
  
  if(name && typeof name == 'string' && name.length) {
    name = name.trim().toLowerCase();
    name = name.replace(/ +/g, '-');
    name = name.replace(/\.+/g, '-');
    name = name.replace(/[^0-9a-z-]/g, '');
    
    if(name.length <= 18) {
      return name;
    } else {
      throw new Error("Name must not be more than 18 characters");
    }
  } else {
    error();
  }
}

Deployment.prototype.package = function (tarball, callback) {
  function filter(info) {
    if(
           info.type     === 'Directory'  
        && info.depth    === 1
        && info.basename === 'data' 
        || info.basename === '.dpd'
    ) {
      return false;
    }
    return true;
  }

  fstream.Reader({ path: this.path, type: 'Directory', filter: filter })
    .on('error', callback)
    .pipe(tar.Pack())
    .on('error', callback)
    .pipe(zlib.Gzip())
    .on('error', callback)
    .pipe(fstream.Writer({ type: "File", path: tarball }))
    .on('close', callback);
}

Deployment.prototype.publish = function (url, tar, key, callback) {
  function done(err, res, body) {
    if(err) return callback(err);
    if(res.statusCode >= 400) return callback(new Error(body));
    callback();
  }

  fs
    .createReadStream(tar)
    .pipe(request.post({
      url: url,
      headers: {
        'X-Remote-Key': key,
        'X-App-User': this.user,
        'X-App-Subdomain': this.subdomain
      }
    }, done))
}