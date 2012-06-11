var path = require('path');

exports.build = function(server, session) {
  var baseMethods
    , dpd = {};

  baseMethods = {
    request: function(method, options, fn) {
      var req
        , res;

      req = {
          url: path.join('/', options.path)
        , method: method
        , query: options.query
        , body: options.body
        , session: session
      };

      res = {
        setHeader: function() {},
        end: function(data) {
          if (res.statusCode === 200 || res.statusCode === 204) {
            fn(null, JSON.parse(data));
          }
        }
      };

      server.router.route(req, res);
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
      var jsName = r.settings.path.replace(/[^A-Za-z0-9]/g, '');
      dpd[jsName] = createResourceClient(r, baseMethods);
    });  
  }
  
  return dpd;
};

function createResourceClient(resource, baseMethods) {

  var r = {
    get: function(func, p, query, fn) {

      var settings = parseGetSignature(arguments);

      settings.path = path.join(resource.settings.path, settings.path);

      return baseMethods.get(settings, settings.fn);
    }
    , post: function(p, query, body, fn) {
      var settings = parsePostSignature(arguments);
      settings.path = path.join(resource, settings.path);

      return baseMethods.post(settings, settings.fn);
    }
    , put: function(p, query, body, fn) {
      var settings = parsePostSignature(arguments);
      settings.path = path.join(resource, settings.path);

      return baseMethods.put(settings, settings.fn);
    }
    , del: function(p, query, fn) {
      var settings = parseGetSignature(arguments);
      settings.path = path.join(resource, settings.path);

      return baseMethods.del(settings, settings.fn);
    }
  };

  r.do = function(func, path, body, fn) {
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

    settings.path = path.join(resource, settings.func, settings.path);
    return baseMethods.post(settings, fn);
  };

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
    settings.path = path.join(settings.path, args[i]);
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