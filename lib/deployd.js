/**
 * Module dependencies.
 */

var express = require('express')
  , storage = require('./storage')
;

/**
 * Export the deployd constructor.
 */
 
module.exports = function (name) {
  return require('./server')(name);
}