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
    if(info.depth === 2 && info.parent.basename === '.dpd') {
      if(info.basename === 'keys.json') {
        return true;
      } else {
        return false;
      }
    }
    
    if(
           info.type     === 'Directory'  
        && info.depth    === 1
        && info.basename === 'data' 
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
  
  var deployment = this;

  fs
    .createReadStream(tar)
    .pipe(request.post({
      url: url,
      headers: {
        'X-Remote-Key': key,
        'X-App-User': this.user,
        'X-App-Session': this.sid,
        'X-App-Subdomain': this.subdomain
      }
    }, function (err, res, body) {
      if(err) return console.error(err);
      if(res.statusCode !== 200) {
        deployment.setConfig('sid', undefined);
        deployment.setConfig('user', undefined);
        delete deployment.sid;
        delete deployment.user;
      }
      
      deployment.setConfig(deployment.subdomain + '.' + deployment.remote, deployment);
      done.apply(this, arguments);
    }));
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
  
  fs.writeFileSync(this.path + '/.dpd/deployments.json', JSON.stringify(cur, null, '  '));
};

Deployment.prototype.authenticate = function (credentials, fn) {
  var deployment = this;
  
  if(typeof credentials == 'function') {
    fn = credentials;
    credentials = undefined;
  }
  
  if(credentials) {
    var options = {
      url: 'http://api.deploydapp.com:3000/users/login',
      json: credentials,
      method: 'POST'
    };
    request(options, function (err, res, session) {
      if(err) return fn(err);
      var sid = session && session.id;
      
      if(sid) {
        deployment.setConfig('sid', sid);
        deployment.setConfig('user', credentials.username);
        deployment.sid = sid;
        deployment.user = credentials.username;
        fn(true);
      } else {
        fn(false);
      }
    });
  } else {
    var sid = deployment.getConfig('sid');
    var user = deployment.getConfig('user');
    deployment.sid = sid;
    deployment.user = user;
    if(sid) {
      fn(true);
    } else {
      fn(false);
    }
  }
};