var Resource = require('../resource')
  , util = require('util');


function InternalDeployments(name, options) {
  Resource.apply(this, arguments);
}

util.inherits(InternalDeployments, Resource);

module.exports = InternalDeployments;

