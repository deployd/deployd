var sh = require('shelljs')
  , debug = require('debug')('open');

module.exports = function(url) {
  var command = 'open';

  url = url || '';

  if (process.platform === 'win32') {
    command = 'start'; 
  }
  command += ' ' + url;
  debug(command);
  sh.exec(command, {async: true});
}