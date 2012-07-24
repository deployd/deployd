var fs = require('fs')
  , path = require('path')
  , Resource = require('./resource')
  , ignore = {
      'public': true,
      'data': true,
      'resources': true,
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
    , error;
    
  function done() {
    if(!remaining) {
      if(error) return fn(error);
      fn(null, resources);
      remaining = -1;
    }
  }
  
  fs.readdir(basepath, function (err, dir) {
    if(dir && dir.length) {
      dir.forEach(function (file) {
        remaining++;
        fs.stat(basepath + '/' + file, function (err, stat) {
          remaining--;
          error = err;
          if(stat && stat.isDirectory()) {
            var spath = basepath + '/' + file + '/' + 'settings.json'
              , resource = file;

            if(!ignore[file]) {
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

                    resources[resource] = settings;
                    done();
                  });
                } else {
                  done();
                }
              });
            }
          } else {  
            done();
          }
        });
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
        , rpath = basepath + r.path;

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
  fn(sh.rm('-r', basepath + path));
}
