module.exports = require('mdoq')
  .require('mdoq-http')
  .use(function (req, res, next) {
    if(res.statusCode >= 400) {
      var err = res.data.error || res.data;
      res.data = undefined;
      next(err);
    } else {
      next();
    }
  })
;