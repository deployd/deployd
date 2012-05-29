/**
 * Dependencies
 */
 
var resources = require('./collections/resources')
  , collection = require('./types/collection');


exports.build = function (fn) {
  resources.get(function (err, result) {
    if(err) return fn(err);
    
    var dpd = {executing: 0}
      , r;

    function done() {
      if(!dpd.executing && dpd._done) {
        dpd._done();
      }
    };

    while(r = result.shift()){
      if(~r.type.indexOf('Collection')) { 
        r.col = collection.use(r.path);
        
        var resource = dpd[r.path.replace('/', '')] = {
          get: (function (r) {
            return function (query, fn) {
              dpd.executing++;
              
              if(!fn) {
                fn = query;
                query = undefined;
              }
              
              r.col.get(function (err, result) {
                fn(result, err);
                done();
              });
            }
          })(r),
          getOne: (function (r) {
            return function (query, fn) {
              dpd.executing++;
              
              if(!fn) {
                fn = query;
                query = undefined;
              }

              var q = {};

              if (typeof query === 'string') {
                q._id = query;
              } else if (query) {
                q = query;
              }
              
              r.col.get(q).first(function (err, result) {
                fn(result, err);
                done();
              });
            }
          })(r),
          save: (function (r) {
            return function (obj, fn) {
              if (typeof obj === 'string') { throw Error("save() does not take an id. Did you mean to use put()?"); }
              dpd.executing++;
              r.col.post(obj, function (err, result) {
                fn(result, err);
                done();
              });
            }
          })(r),
          post: (function(r) {
            return function (obj, fn) {
              if (obj && obj._id) { throw Error("Cannot post() an object with an _id. Did you mean to use save() or put()?"); }
              dpd.executing++;
              r.col.post(obj, function (err, result) {
                fn(result, err);
                done();
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
              dpd.executing++;
              r.col.put(obj, function (err, result) {
                fn(result, err);
                done();
              });
            }
          })(r),
          del: (function (r) {
            return function (id, fn) {
              if (typeof id !== 'string') {throw Error("id must be provided!");}
              dpd.executing++;
              r.col.del({_id: id}, function (err, result) {
                fn(result, err);
                done();
              });
            }
          })(r)
        };

        //Aliases
        resource.first = resource.getOne;
      }
    }
    
    fn(null, dpd);
  })
}