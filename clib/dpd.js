(function (undefined) {

  if (!window._dpd) window._dpd = {};

  var root = null;

  var consoleLog = (typeof console !== 'undefined') && console.log;

  var socket;

  var BASE_URL = '/';

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

    // if the path is allowed to go above the root, restore leading ..
    if (allowAboveRoot) {
      for (; up--; up) {
        parts.unshift('..');
      }
    }

    return parts;
  }

  function filterArray(list, fn) {
    if (Array.prototype.filter) return Array.prototype.filter.call(list, fn);
    var newList = [];
    for (var i = 0; i < list.length; i++) {
      if (fn(list[i])) {
        newList.push(list[i]);
      }
    }
    return newList;
  }

  function joinPath() {
    var paths = Array.prototype.slice.call(arguments, 0);
    paths = paths.join('/').split('/');
    return '/' + filterArray(paths, function(p, index) {
      return p && typeof p === 'string';
    }).join('/');
  }

  function isComplex(obj) {
    if (obj) {
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
          if (typeof obj[k] !== 'string') {
            return true;
          }
        }
      }
    }
    return false;
  }

  function createQueryString(query) {
    var parts = [];
    for (var k in query) {
      if (query.hasOwnProperty(k)) {
        parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(query[k]));
      }
    }
    return parts.join('&');
  }

  function encodeIfComplex(query) {
    if (isComplex(query)) {
      return encodeURIComponent(JSON.stringify(query));
    } else if (query) {
      return createQueryString(query);
    }
  }

  function returnSuccess(fn) {
    return function(data) {
      if (fn === consoleLog) return console.log(data);
      if (typeof fn === 'function') fn(data);
    };
  }

  function returnError(fn) {
    return function(data) {
      if (fn === consoleLog) return console.error(data);
      if (typeof fn === 'function') fn(null, data);
    };
  }

  function unwrapPromise(promise, fn) {
    return promise
    .then(function (res) {
      var sessionId = res.raw.getResponseHeader("X-Session-Token");
      if (sessionId) {
        window.dpd.setSessionId(sessionId);
      }
      return res;
    })
    .then(function (res) {
      returnSuccess(fn)(res.data);
      return res.data;
    })
    .fail(function (err) {
      returnError(fn)(err.data);
      throw err.data;
    });
  }

  var baseMethods = {
    get: function(options, fn) {
      var query = encodeIfComplex(options.query);

      return unwrapPromise(_dpd.ajax(root + joinPath(BASE_URL, options.path), {
          method: "GET"
        , query: query
      }), fn);
    }
    , del: function(options, fn) {
      var query = encodeIfComplex(options.query);

      return unwrapPromise(_dpd.ajax(root + joinPath(BASE_URL, options.path), {
          method: "DELETE"
        , query: query
      }), fn);
    }
    , requestWithBody: function(method, options, fn) {
      var query = encodeIfComplex(options.query);
      if (query) query = '?' + query;
      else query = '';

      return unwrapPromise(_dpd.ajax(root + joinPath(BASE_URL, options.path) + query, {
          method: method
        , contentType: options.body && "application/json"
        , data: JSON.stringify(options.body || {}) || "{}" })
      , fn);
    }
  };

  baseMethods.post = function(options, fn) {
    return baseMethods.requestWithBody("POST", options, fn);
  };

  baseMethods.put = function(options, fn) {
    return baseMethods.requestWithBody("PUT", options, fn);
  };

  function isString(arg) {
    return typeof arg === 'string' || typeof arg === 'number';
  }

  function toString(arg) {
    return arg ? arg.toString() : null;
  }

  function parseGetSignature(args) {
    var settings = {}
      , i = 0;

    // path/func
    if (isString(args[i]) || !args[i]) {
      settings.path = toString(args[i]);
      i++;
    }

    // join path to func
    if (isString(args[i]) || !args[i]) {
      settings.path = joinPath(settings.path, toString(args[i]));
      i++;
    }

    // query
    if (args[i] !== consoleLog && typeof args[i] === 'object' || !args[i]) { // IE considers console.log to be an object.
      settings.query = args[i];
      i++;
    }

    if (typeof args[i] === 'function' || args[i] === consoleLog) {
      settings.fn = args[i];
    }

    return settings;
  }

  function parsePostSignature(args) {
    var settings = {}
      , i = 0;

    //path
    if (isString(args[i]) || !args[i]) {
      settings.path = toString(args[i]);
      i++;
    }

    // body
    if (args[i] !== consoleLog && typeof args[i] === 'object' || !args[i]) {
      settings.body = args[i];
      i++;
    }

    // query - if this exists the LAST obj was query and the new one is body
    if (args[i] !== consoleLog && typeof args[i] === 'object') {
      settings.query = settings.body;
      settings.body = args[i];
      i++;
    }

    if (typeof args[i] === 'function' || args[i] === consoleLog) {
      settings.fn = args[i];
    }

    return settings;
  }

  window.dpd = function(resource) {

    var r = {
      get: function(func, path, query, fn) {
        var settings = parseGetSignature(arguments);
        settings.path = joinPath(resource, settings.path);

        return baseMethods.get(settings, settings.fn);
      }
      , post: function(path, query, body, fn) {
        var settings = parsePostSignature(arguments);
        settings.path = joinPath(resource, settings.path);

        return baseMethods.post(settings, settings.fn);
      }
      , put: function(path, query, body, fn) {
        var settings = parsePostSignature(arguments);
        settings.path = joinPath(resource, settings.path);

        return baseMethods.put(settings, settings.fn);
      }, del: function(path, query, fn) {
        var settings = parseGetSignature(arguments);
        settings.path = joinPath(resource, settings.path);

        return baseMethods.del(settings, settings.fn);
      }
    };

    r.exec = function(func, path, body, fn) {
      var settings = {}
        , i = 0;

      settings.func = arguments[i];
      i++;

      // path
      if (isString(arguments[i])) {
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

    return r;
  };

  function getBaseUrl(){
    return root + BASE_URL;
  }

  function setBaseUrl(options) {
    var oldRoot = root;

    options = options || {};
    if (typeof options === "string") {
      // TODO: may need to parse the url to get the domain for socket
      root = options;
    } else {
      if (options.hostname) {
        root = (options.protocol||location.protocol) + '//' + options.hostname;
        var port = options.port || location.port;
        if (port) {
          root += ':' + port;
        }
      } else {
        var element = document.currentScript;
        if (!element) {
          element = document.querySelector('script[src$="dpd.js"]');
        }
        if (element) {
          var src = element.src || '';
          var m = /((\w+:)?\/\/(.+):?(\d+)?)\//.exec(src);
          if (m) {
            root = m[1];
          }
        }
      }
    }

    if (!root && location.hostname) {
      root = location.protocol + '//' + location.hostname;
      if (location.port) {
        root += ':' + location.port;
      }
    }
    if (root !== oldRoot) {
      if (socket && socket.io) {
        // disconnect socket if we're changing url
        socket.io.disconnect();
      }
      socket = null;
      window.dpd.socket = null;
    }
  }

  var _sessionId;

  function checkAndConnectSocketIO() {
    if (!socket) {
      socket = io.connect(root);
      window.dpd.socket = socket;
      window.dpd.once('connect', function() {
        isSocketReady = true;
      });
      window.dpd.on('reconnect', function(){
        if (_sessionId) window.dpd.setSessionId(_sessionId, true);
      });
    }
  }

  window.dpd.setBaseUrl = setBaseUrl;
  window.dpd.getBaseUrl = getBaseUrl;

  window.dpd.setSessionId = function (sessionId, force) {
    if (force || (sessionId != _sessionId)) {
      window.dpd.socketReady(function (){
        window.dpd.socket.emit('server:setSession', { sid: sessionId });
        _sessionId = sessionId;
      });
    }
  };

  window.dpd.on = function() {
    checkAndConnectSocketIO();
    socket.on.apply(socket, arguments);
  };

  window.dpd.once = function(name, fn) {
    checkAndConnectSocketIO();
    var _fn = function() {
      socket.removeListener(name, _fn);
      fn.apply(this, arguments);
    };
    socket.on(name, _fn);
  };

  window.dpd.off = function(name, fn) {
    checkAndConnectSocketIO();
    if (fn == null) {
      socket.removeAllListeners(name);
    } else {
      socket.removeListener(name, fn);
    }
  };

  var isSocketReady = false;

  window.dpd.socketReady = function(fn) {
    checkAndConnectSocketIO();
    if (isSocketReady) {
      setTimeout(fn, 0);
    } else {
      window.dpd.once('connect', fn);
    }
  };

  setBaseUrl();
})();
