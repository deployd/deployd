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

function Deployment(appPath, user, subdomain) { 
  var remote = this.remote = 'deploydapp.com';
  this.path = path.resolve(appPath);
  
  if(!subdomain) {
    var config = this.getConfig();
    Object.keys(config).forEach(function (key) {
      if(~key.indexOf(remote)) {
        subdomain = config[key].subdomain;
      }
    });
  }
  
  this.name = this.sanitize(subdomain || path.basename(this.path));
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
    name = name.replace(/[^0-9a-z\-]/g, '');
    
    if(name.length === 0) error();
    if(name === '-') error();
    
    if(name.length <= 18) {
      return name;
    } else {
      throw new Error("Name must not be more than 18 characters");
    }
  } else {
    error();
  }
};

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
};

Deployment.prototype.publish = function (url, tar, key, callback) {
  function done(err, res, body) {
    if(err) return callback(err);
    if(res.statusCode >= 400) return callback(new Error(body));
    callback();
  }

  // persist deployment data
  this.setConfig(this.subdomain + '.' + this.remote, this);

  fs
    .createReadStream(tar)
    .pipe(request.post({
      url: url,
      headers: {
        'X-Remote-Key': key,
        'X-App-User': this.user,
        'X-App-Subdomain': this.subdomain
      }
    }, done));
};

Deployment.prototype.getConfig = function(key) {
  var cur;
  
  try {
    cur = require(this.path + '/.dpd/deployments.json');
  } catch(e) {
    cur = {};
  }
  
  return key ? cur[key] : cur;
};


Deployment.prototype.setConfig = function(key, val) {
  var cur = this.getConfig() || {};
  
  cur[key] = val;
  
  fs.writeFileSync(this.path + '/.dpd/deployments.json', JSON.stringify(cur));
};