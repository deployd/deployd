module.exports = function (req, res, next) {
  res.data = require('../property-types');
  next();
};