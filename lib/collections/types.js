module.exports = function (req, res, next) {
  res.data = require('../types');
  next();
};