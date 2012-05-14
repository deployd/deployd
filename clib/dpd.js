(function ($) {
  if(!$) throw Error('dpd.js depends on jQuery.ajax - you must include it before loading dpd.js');
  
  // global namespace
  window.dpd = {};
  
  var r
    , resources = /*resources*/
    , contentType = 'application/json'
    , rootUrl = /*rootUrl*/;

  function errorCallback(fn) {
    return function (err) {
      fn && fn(null, JSON.parse(err.responseText));  
    }
  }

  function successCallback(fn) {
    return function (res) {
      fn && fn(res);
    }
  }
  
  while(r = resources.shift()){
    if(~r.type.indexOf('Collection')) { 
    
      var resource = dpd[r.path.replace('/', '')] = {
        get: (function (r) {
          return function (query, fn) {
            if(!fn) {
              fn = query;
              query = undefined;
            }

            var q = (query && ('?q=' + JSON.stringify(query))) || '';

            return $.ajax({
              url: rootUrl + r.path + q,
              type: 'GET',
              contentType: contentType,
              success: function (res) {
                fn && fn(res || []);
              },
              error: errorCallback(fn)
            });
          }
        })(r),
        getOne: (function (r) {
          return function (query, fn) {
            if(!fn) {
              fn = query;
              query = undefined;
            }

            var q = '';

            if (typeof query === 'string') {
              q = '/' + query; //Id
            } else if (query) {
              q = '?q=' + JSON.stringify(query);
            }

            return $.ajax({
              url: rootUrl + r.path + q,
              type: 'GET',
              contentType: contentType,
              success: function (res) {
                if(res && res.length) {
                  fn && fn(res[0]);
                } else if (typeof res.length !== 'undefined') {
                  fn && fn(null, {message: 'not found', status: 404});
                } else {
                  fn && fn(res);
                }
              },
              error: errorCallback(res)
            });
          }
        })(r),
        save: (function (r) {
          return function (obj, fn) {
            if (typeof obj === 'string') { throw Error("save() does not take an id. Did you mean to use put()?"); }
            return $.ajax({
              url: rootUrl + r.path + (obj._id ? ('/' + obj._id) : ''),
              type: 'POST',
              contentType: contentType,
              data: JSON.stringify(obj),
              success: successCallback(fn),
              error: errorCallback(fn)
            });
          }
        })(r),
        post: (function(r) {
          return function (obj, fn) {
            if (obj && obj._id) { throw Error("Cannot post() an object with an _id. Did you mean to use save() or put()?"); }
            return $.ajax({
              url: rootUrl + r.path,
              type: 'POST',
              contentType: contentType,
              data: JSON.stringify(obj),
              success: successCallback(fn),
              error: errorCallback(fn)
            });
          }
        })(r),
        put: (function(r) {
          return function (id, obj, fn) {
            if (typeof id !== 'string') { 
              obj = arguments[0]; //reorder parameters 
              fn = arguments[1]; 
              id = obj && obj._id;
            }
            if (!id) { throw Error("id must be provided!"); }
            return $.ajax({
              url: rootUrl + r.path + '/' + id,
              type: 'PUT',
              contentType: contentType,
              data: JSON.stringify(obj),
              success: successCallback(fn),
              error: errorCallback(fn)
            });
          }
        })(r),
        del: (function (r) {
          return function (id, fn) {
            if (typeof id !== 'string') {throw Error("id must be provided!");}

            var q = '/' + id;

            return $.ajax({
              url: rootUrl + r.path + q,
              type: 'DELETE',
              contentType: contentType,
              success: function(res) {
                fn && fn(true);
              },
              error: errorCallback(fn)
            });
          }
        })(r)
      };
    
    
      if(r.type === 'UserCollection') {
        resource.login = (function (r) {
          return function (credentials, fn) {
            return $.ajax({
              url: rootUrl + r.path + '/login',
              type: 'POST',
              contentType: contentType,
              data: JSON.stringify(credentials),
              success: successCallback(fn),
              error: errorCallback(fn)
            });
          }
        })(r);
      
        resource.logout = (function (r) {
          return function (fn) {
            return $.ajax({
              url: rootUrl + r.path + '/logout',
              type: 'POST',
              contentType: contentType,
              success: function(res) {
                fn && fn(true);
              },
              error: errorCallback(fn)
            });
          }
        })(r);
      
        resource.me = (function (r) {
          return function (fn) {
            return $.ajax({
              url: rootUrl + r.path + '/me',
              type: 'GET',
              contentType: contentType,
              success: successCallback(fn),
              error: errorCallback(fn)
            });
          }
        })(r);
      }
    }
  }
})(window.jQuery);