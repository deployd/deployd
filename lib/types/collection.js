function format(name) {
  name = name.toLowerCase().replace(/\W/g, '-').replace(/--+/g, '');
  return '/' + name;
}

module.exports = require('mdoq')
  .use(function (req, res, next) {
    var path = req.resource && req.resource.path;
    this.url = 'localhost/deployd' + (path || this.url);
    next();
  })
  .require('mdoq-mongodb')
;