var fs = require('fs')
  , path = require('path')
  , Resource = require('./resource')
  , ignore = {
      'public': true,
      'data': true,
      'resources': true,
      'node_modules': true,
      '.dpd': true
    }
  , sh = require('shelljs');

/*!
 * Loads resources from a project folder
 * Callback receives two arguments `(err, resources)`.
 * 
 * @param {String} basepath
 * @param {Function} callback
 */
module.exports.loadConfig = function(basepath, fn) {
  var remaining = 0
    , resources = {}
    , src = {}
    , error;

  function done() {
    if(!remaining) {
      if(error) return fn(error);
      // merge src w/ resources
      Object.keys(src).forEach(function (key) {
        resources[key] = resources[key] || {};
        Object.keys(src[key]).forEach(function (ev) {
          resources[key][ev] = src[key][ev];
        })
      });
      
      fn(null, resources);
      remaining = -1;
    }
  }
  
  fs.readdir(basepath + 'resources', function (err, dir) {
    if(dir && dir.length) {
      dir.forEach(function (file) {
        if(!ignore[file]) {
          remaining++;
          fs.stat(basepath + 'resources/' + file, function (err, stat) {
            remaining--;
            error = err;
            if(stat && stat.isDirectory()) {
              var spath = basepath + 'resources/' + file + '/' + 'settings.json'
                , resource = file;
            
              fs.exists(spath, function (exists) {
                if(exists) {
                  remaining++;
                  fs.readFile(spath, 'utf-8', function(err, data) {
                    remaining--;
                    var settings;
                    if(err) error = err;
                    try {
                      settings = JSON.parse(data);
                    } catch(e) {
                      error = e;
                      return fn(error);
                    }

                    settings.ctime = stat.ctime.getTime();
        
                    resources[resource] = settings;
                    done();
                  });
                } else {
                  done();
                }
              });
              
              remaining++
              fs.readdir(basepath + '/resources/' + file, function (err, dir) {
                remaining--;
                if(err) error = err;
                
                if(dir && dir.length) {
                  dir.forEach(function (f) {
                    if(path.extname(f) == '.js') {
                      remaining++;
                      fs.readFile(basepath + '/resources/' + file + '/' + f, 'utf-8', function(err, data) {
                        remaining--;
                        var ev = f.replace('.js', '');
                        ev = ev.substr(0, 1).toUpperCase() + ev.substr(1);
                        src[file] = src[file] || {};
                        src[file]['on' + ev] = data;
                        done();
                      });
                    }
                  })
                }
                
                done();
              });
              
            } else {  
              done();
            }
          });
        }
      });
    } else {
      fn(err);
    } 
  });
};

/*!
 * Saves resources to a project folder. Callback receives `(err)`.
 * 
 * @param {String} basepath
 * @param {Array of Object} resources (configuration objects)
 * @param {Function} callback
 * @ignore
 */
module.exports.saveConfig = function(resources, basepath, fn) {
  var resourcesPath = path.join(basepath, '/app.dpd')
    , remaining = 0
    , json;

  if(resources) {
    Object.keys(resources).forEach(function (id) {
      var r = resources[id]
        , rpath = basepath + 'resources/' + r.path;

      remaining++;

      function save(err) {
        if(err) return fn(err);
        json = JSON.stringify(r, null, '\t');
        fs.writeFile(rpath + '/settings.json', json, 'utf-8', function(err) {
          if (err) return fn(err);
          if(--remaining == 0) {
            remaining = -1;
            fn();
          }
        });
      }

      fs.exists(rpath, function(exists) { 
        if(exists) {
          save();
        } else {
          fs.mkdir(rpath, save);
        }
      })
    });
  }
  
  if(!remaining) fn();
};

module.exports.remove = function (basepath, path, fn) {
  fn(sh.rm('-r', basepath + 'resources/' + path));
}
