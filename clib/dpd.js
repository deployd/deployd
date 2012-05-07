(function ($) {
  if(!$) throw 'dpd.js depends on jQuery.ajax - you must include it before loading dpd.js';
  
  // global namespace
  window.dpd = {};
  
  var r
    , resources = /*resources*/
    , contentType = 'application/json';
  
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
              url: r.path + q,
              type: 'GET',
              contentType: contentType,
              success: function (res) {
                fn && fn(res);
              },
              error: function (err) {
                fn && fn(null, JSON.parse(err));
              }
            });
          }
        })(r),
        first: (function (r) {
          return function (query, fn) {
            if(!fn) {
              fn = query;
              query = undefined;
            }

            var q = (query && ('?q=' + JSON.stringify(query))) || '';

            return $.ajax({
              url: r.path + q,
              type: 'GET',
              contentType: contentType,
              success: function (res) {
                if(res && res.length) {
                  fn && fn(res[0]);
                } else {
                  fn && fn(null, {message: 'not found', status: 404});
                }
              },
              error: function (err) {
                fn && fn(JSON.parse(err));
              }
            });
          }
        })(r),
        save: (function (r) {
          return function (obj, fn) {
            return $.ajax({
              url: r.path + (obj._id ? ('/' + obj._id) : ''),
              type: 'POST',
              contentType: contentType,
              data: JSON.stringify(obj),
              success: function (res) {
                fn && fn(res);
              },
              error: function (err) {
                fn && fn(null, err);
              }
            });
          }
        })(r),
        del: (function (r) {
          return function (query, fn) {
            if(!fn) fn = query;

            var q = query && ('?q=' + JSON.stringify(query));

            return $.ajax({
              url: r.path + q,
              type: 'DELETE',
              contentType: contentType,
              success: function (res) {
                fn && fn(res);
              },
              error: function (err) {
                fn && fn(null, err);
              }
            });
          }
        })(r)
      };
    
    
      if(r.type === 'UserCollection') {
        resource.login = (function (r) {
          return function (credentials, fn) {
            return $.ajax({
              url: r.path + '/login',
              type: 'POST',
              contentType: contentType,
              data: JSON.stringify(credentials),
              success: function (res) {
                fn && fn(res);
              },
              error: function (err) {
                fn && fn(null, err);
              }
            });
          }
        })(r);
      
        resource.logout = (function (r) {
          return function (fn) {
            return $.ajax({
              url: r.path + '/logout',
              type: 'POST',
              contentType: contentType,
              success: function (res) {
                fn && fn(res);
              },
              error: function (err) {
                fn && fn(null, err);
              }
            });
          }
        })(r);
      
        resource.me = (function (r) {
          return function (fn) {
            return $.ajax({
              url: r.path + '/me',
              type: 'GET',
              contentType: contentType,
              success: function (res) {
                fn && fn(res);
              },
              error: function (err) {
                fn && fn(null, err);
              }
            });
          }
        })(r);
      }
    }
  }
})(window.jQuery);