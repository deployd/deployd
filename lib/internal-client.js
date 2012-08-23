var debug = require('debug')('internal-client');

function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

normalizePath = function(path) {
  var isAbsolute = path.charAt(0) === '/',
      trailingSlash = path.slice(-1) === '/';

  // Normalize the path
  path = normalizeArray(path.split('/').filter(function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};


function joinPath() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return normalizePath(paths.filter(function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};



exports.build = function(server, session, stack) {
  var baseMethods
    , dpd = {};

  baseMethods = {
    request: function(method, options, fn) {
      var req
        , res
        , urlKey
        , recursions
        , recursionLimit;

      req = {
          url: joinPath('/', options.path)
        , method: method
        , query: options.query
        , body: options.body
        , session: session
        , isRoot: session.isRoot
        , internal: true
      };

      urlKey = req.method + ' ' + req.url;

      req.stack = stack || [];
      debug("Stack: %j", stack);

      recursions = req.stack.filter(function(s) { return s === urlKey; }).length;

      recursionLimit = (stack && stack.recursionLimit) || 2;

      if (recursions < recursionLimit) {
        req.stack.push(urlKey);
        debug("Putting %s on stack", urlKey);

        res = {
          setHeader: function() {},
          end: function(data) {
            if (res.statusCode === 200 || res.statusCode === 204) {
              try {
                fn(JSON.parse(data), null);
              } catch (ex) {
                fn(data, null);
              }
            } else {
              fn(null, data);
            }
          },
          internal: true
        };

        server.router.route(req, res);
      } else {
        debug("Recursive call detected - aborting");
        fn(null, "Recursive call to " + urlKey + " detected");
      }
    }
  };

  baseMethods.get = function(options, fn) {
    return baseMethods.request("GET", options, fn);
  }

  baseMethods.post = function(options, fn) {
    return baseMethods.request("POST", options, fn);
  };

  baseMethods.put = function(options, fn) {
    return baseMethods.request("PUT", options, fn);
  };

  baseMethods.del = function(options, fn) {
    return baseMethods.request("DELETE", options, fn);
  };

  if (server.resources) {
    server.resources.forEach(function(r) {
      if (r.clientGeneration) {
        var jsName = r.path.replace(/[^A-Za-z0-9]/g, '');
        dpd[jsName] = createResourceClient(r, baseMethods);  
      }
    });  
  }
  
  return dpd;
};

function createResourceClient(resource, baseMethods) {

  var r = {
    get: function(func, p, query, fn) {

      var settings = parseGetSignature(arguments);

      settings.path = joinPath(resource.path, settings.path);

      return baseMethods.get(settings, settings.fn);
    }
    , post: function(p, query, body, fn) {
      var settings = parsePostSignature(arguments);
      settings.path = joinPath(resource.path, settings.path);

      return baseMethods.post(settings, settings.fn);
    }
    , put: function(p, query, body, fn) {
      var settings = parsePostSignature(arguments);
      settings.path = joinPath(resource.path, settings.path);

      return baseMethods.put(settings, settings.fn);
    }
    , del: function(p, query, fn) {
      var settings = parseGetSignature(arguments);
      settings.path = joinPath(resource.path, settings.path);

      return baseMethods.del(settings, settings.fn);
    }
  };

  r.exec = function(func, path, body, fn) {
    var settings = {}
      , i = 0;

    settings.func = arguments[i];
    i++;

    // path
    if (typeof arguments[i] === 'string') {
      settings.path = arguments[i];
      i++;
    }

    // body
    if (typeof arguments[i] === 'object') {
      settings.body = arguments[i];
      i++;
    }

    fn = arguments[i];

    settings.path = joinPath(resource, settings.func, settings.path);
    return baseMethods.post(settings, fn);
  };

  resource.clientGenerationGet.forEach(function(func) {
    r[func] = function(path, query, fn) {
      r.get(func, path, query, fn);
    };
  });

  resource.clientGenerationExec.forEach(function(func) {
    r[func] = function(path, query, fn) {
      r.exec(func, path, query, fn);
    };
  });

  return r;
}


function parseGetSignature(args) {
  var settings = {}
    , i = 0;

  // path/func
  if (typeof args[i] === 'string') {
    settings.path = args[i];
    i++;
  }

  // join path to func
  if (typeof args[i] === 'string') {
    settings.path = joinPath(settings.path, args[i]);
    i++;
  }

  // query
  if (typeof args[i] === 'object') {
    settings.query = args[i];
    i++;
  }

  settings.fn = args[i];

  return settings;
}

function parsePostSignature(args) {
  var settings = {}
    , i = 0;

  //path
  if (typeof args[i] === 'string') {
    settings.path = args[i];
    i++;
  }

  // body (required)
  settings.body = args[i];
  i++;

  // query - if this exists the LAST obj was query and the new one is body
  if (typeof args[i] === 'object') {
    settings.query = settings.body;
    settings.body = args[i];
    i++;
  }

  settings.fn = args[i];

  return settings;
}