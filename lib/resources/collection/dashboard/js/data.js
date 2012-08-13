(function() {

var resource = Context.resourceId;

var createRow = function(data, props, vm) {

  var self = {};

  function map(data, props) {
    var defaults = {id: null};
    props.forEach(function(prop) {
      defaults[prop.id] = undefined;
    });

    data = _.defaults(data, defaults);

    ko.mapping.fromJS(data, {}, self);
  }

  map(data, props);

  self.c_editing = ko.observable(false);
  self.c_focus = ko.observable();
  self.c_errors = ko.observable({});

  self.c_formatted = function(name, type) {
    var name = ko.utils.unwrapObservable(name);
    var type = ko.utils.unwrapObservable(type);
    var value = ko.utils.unwrapObservable(self[name]);
    if (type === 'password' || typeof value === 'undefined') {
      return '...';
    } else {
      return value;
    }
  }

  self.c_toggleEditing = function() {
    if (self.c_editing() && !self.isNew) {
      vm.revertRow(self);
    } else {
      self.c_editing(true);  
    }
  };

  self.c_remapProps = function(props) {
    var data = ko.mapping.toJS(self);
    map(data, props);
  };

  self._onKeypress = function(data, e) {
    if (e.which == 13) {
      setTimeout(function() {
        vm.saveRow(self);
      }, 1);
    } else if (e.which == 27 && !self.isNew) {
      setTimeout(function() {
        vm.revertRow(self);
      }, 1);
    }

    return true;
  };

  self._onDoubleclick = function(data, e) {
    if (!self.c_editing()) {
      self.c_editing(true);
      self.c_focus(data.id);
    } else {
      return true;
    }
  };

  return self;
};

var create = function() {

  var self = {
      properties: ko.observableArray()
    , collection: ko.observableArray()
    , queryString: ko.observable()
    , queryError: ko.observable("")
    , queryObj: ko.observable({})
    , isUser: Context.resourceType === "UserCollection"
    , propertiesLoaded: ko.observable(false)
    , collectionLoaded: ko.observable(false)
  };

  var collectionMapping = {
    'collection': {
      key: function(data) {
        return ko.utils.unwrapObservable(data.id);
      }
      , create: function(options) {
        return createRow(options.data, ko.mapping.toJS(self.properties), self)
      }
      , update: function(options) {
        if (!options.target.c_editing()) {
          return options.target;
        } else {
          return options.data;  
        }
      }
    } 
  };

  self.newRow = createRow({}, [], self);
  self.newRow.isNew = true;

  self.deleteRow = function(data) {
    var row = data.id();
    dpd(resource).del(row, function(res, err) {
      if (err) return ui.error("Could not save", err.message).sticky().effect('slide');
      var undo = ui.notify("Deleted row", $('<a href="#">Undo</a>').click(function() {
        delete data.id;
        self.saveRow(data);
        undo.hide();
      })).effect('slide');
    });
  };

  self.saveRow = function(data) {
    var rowData = ko.mapping.toJS(data);
    dpd(resource).post(rowData, function(res, err) {
      if (err) {
        if (err.errors) {
          data.c_errors(err.errors);
        } else {
          ui.error("Could not save", err.message).sticky().effect('slide');
        }
      } else {
        if (!data.id()) {
          self.properties().forEach(function(prop) {
            if (data[prop.id]) {
              data[prop.id](null);
            }
          });
        } else {
          data.c_editing(false);
        }
      }
    });
  };

  self.revertRow = function(data) {
    var row = data.id();
    dpd(resource).get(row, function(res, err) {
      if (err) return;
      ko.mapping.fromJS(res, {}, data);
      data.c_editing(false);
    });
  };

  function loadProperties() {
    dpd('__resources').get(resource, function(res, err) {
      var props = CollectionUtil.propsToArray(res.properties);

      if (self.isUser) {
        props.unshift({
            id: 'username'
          , type: 'string'
          , typeLabel: 'string'
        }, {
            id: 'password'
          , type: 'password'
          , typeLabel: 'password'
        });
      }

      self.collection().forEach(function(row) {
        row.c_remapProps(props);
      });
      self.newRow.c_remapProps(props);

      self.properties(props);
      self.propertiesLoaded(true);
    });
  }

  function loadCollection() {
    dpd(resource).get(self.queryObj(), function(res, err) {
      if (err) {
        var errorNotification = ui.notify("Error loading resources", $('<p>' + err.message + '</p><p><a href="#">Retry</a><p>').click(function() {
          errorNotification.hide();
          setTimeout(loadCollection, 500);
          return false;
        })).effect('slide').sticky();
        return;
      }


      ko.mapping.fromJS({
          collection: res
        }
        , collectionMapping, self
      );

      self.collectionLoaded(true);
    });
  }

  dpd.on(resource + ':changed', loadCollection);

  loadProperties();
  
  ko.computed(function() {
    var queryString = self.queryString() || ''
      , queryObj = {};

    self.queryError("");

    if (queryString.indexOf('?') === 0) queryString = queryString.slice(1);

    if (queryString.indexOf('{') === 0) {
      try {
        queryObj = JSON.parse(queryString);
      } catch (ex) {
        self.queryError(ex);
        return;
      }
    } else {
      var vars = queryString.split("&");
      for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split("=");
          queryObj[pair[0]] = unescape(pair[1]);
      }
    }

    self.queryObj(queryObj);
  }, self).extend({throttle: 500});

  //Hack - this would take a fairly complex custom binding to do the right way
  setTimeout(function() {
    ko.computed(function() {
      var error = self.queryError();
      var $field = $('#current-data-querystring');
      if (error) {
        $field.attr('data-original-title', error).tooltip('fixTitle')
          .tooltip('show');
      } else {
        $field.attr('data-original-title', '').tooltip('fixTitle')
          .tooltip('hide');
      }
    }, self);
  }, 1);
 

  loadCollection();

  self.queryObj.subscribe(function() {
    loadCollection();
  });

  ko.applyBindings(self);

  return self;
};

create();

})();