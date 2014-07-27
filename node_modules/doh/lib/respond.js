/**
 * Dependencies
 */

var fs = require('fs')
  , ejs = require('ejs')
  , DEFAULT_TEMPLATE = __dirname + '/../assets/error.html'
  , template;

/**
 * Create a responder function based on the given `options`.
 *
 * Options:
 *
 *    `template` - path to an ejs template. Passed `req`, `res`, and `err`.
 *
 */

module.exports = function (options) {
  options = options || {};
  return function (err, req, res, fn) {
    // only respond if a response
    // has not been sent
    if(writeable(res)) {
      var accepts = req.headers['accept'] || '*/*';

      if(~accepts.indexOf('html')) {
        readTemplate(options.template || DEFAULT_TEMPLATE, function () {
          var rendered = ejs.render(template, {err: err, res: res, req: req});

          if(writeable(res)) {
            try {
              res.setHeader('Content-Type', 'text/html');
              res.end(rendered);
            } catch(e) {
              return fn && fn(e);
            }  

            fn && fn();
          }
        });
      } else {
        try {
          res.setHeader('Content-Type', 'application/json');
          var body = {};

          if(Object.prototype.toString.call(err) === '[object Error]') {
            body.message = err.message;
          } else if(typeof err == 'object') {
            body = err;
          } else {
            body.message = err;
          }

          body.status = res.statusCode;
          if(writeable(res)) res.end(JSON.stringify(body));
        } catch(e) {
          return fn && fn(e);
        }

        fn && fn();
      }
    } else {
      fn && fn();
    }
  }
}

/**
 * Read the template from disk and store it in a local variable.
 */

function readTemplate(path, fn) {
  if(template) return fn(template);
  
  fs.readFile(path, function (err, data) {
    template = data.toString();
    fn(template);
  });
}

/**
 * Is the response writeable
 */
 
function writeable(res) {
  return !res.finished;
}