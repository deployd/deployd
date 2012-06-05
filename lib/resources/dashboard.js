var util = require('util')
  , filed = require('filed')
  , Resource = require('../resource')
  , path = require('path');

function Dashboard() {
	Resource.apply(this, arguments);
}
util.inherits(Dashboard, Resource);
module.exports = Dashboard;

Dashboard.prototype.handle = function(ctx) {
	// TODO pathmane might need /
  filed(path.join(path.join(__dirname, 'dashboard'), ctx.url)).pipe(ctx.res);
}