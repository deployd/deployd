var Module = require('../module')
  , Files = require('../internal-resources/files')
  , ClientLib = require('../internal-resources/client-lib')
  , InternalResources = require('../internal-resources/internal-resources')
  , InternalModules = require('../internal-resources/internal-modules')
  , InternalDeployments = require('../internal-resources/internal-deployments')
  , Dashboard = require('../internal-resources/dashboard')
  , GlobalEvents = require('../internal-resources/global-events')
  , q = require('q');

module.exports = Module.extend({

  init: function() {

  },

  load: function(fn) {

    var self = this
      , server = this.server

    var loadDefaultResource = function(resource) {
      return q.ninvoke(resource, 'load').then(function() {
        return resource;
      });
    };

    var defaultResourcesQ = [
      loadDefaultResource(new Files('', {server: server})),
      loadDefaultResource(new ClientLib('dpd.js', { server: server })),
      loadDefaultResource(new InternalResources('__resources', { server: server })),
      loadDefaultResource(new InternalModules('__modules', {server: server})),
      loadDefaultResource(new InternalDeployments('__deployments', {server: server})),
      loadDefaultResource(new Dashboard('dashboard', {server: server})),
      loadDefaultResource(new GlobalEvents({server: server}))
    ];

    q.all(defaultResourcesQ).then(function(defaultResources) {
      defaultResources.forEach(function(r) {
        self.addResource(r);
      });
      fn();
    }, function(err) {
      fn(err);
    });
  }



});
