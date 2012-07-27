(function() {

//var undoBtn = require('../view/undo-button-view');

var propertyMapping = {
  include: ['required', 'id', '$renameFrom']
};

var propertyTypes = [
      {
          id: 'string'
        , label: 'string'
        , tooltip: "Add a string property. If the incoming value is not a string it will be rejected."
        , tooltipTitle: "Arbitrary Text"
      }, {
          id: 'number'
        , label: 'number'
        , tooltip: "Add a number property. If the incoming value is not a number it will be rejected. Supports floating point values."
        , tooltipTitle: "JSON Number"
      }, {
          id: 'boolean'
        , label: 'boolean'
        , tooltip: "Add a boolean property. If the incoming value is not 'true' or 'false' it will be rejected."
        , tooltipTitle: "True or false"
      }, {
          id: 'date'
        , label: 'date'
        , tooltip: "Add a date string property. If the incoming value is not a valid date string it will be rejected."
        , tooltipTitle: "A specific point in time"
      }, {
          id: 'object'
        , label: 'object'
        , tooltip: "Add an object property. If the incoming value is not an object it will be rejected."
        , tooltipTitle: "JSON Object"
      }, {
          id: 'array'
        , label: 'array'
        , tooltip: "Add an array property. If the incoming value is not an array it will be rejected."
        , tooltipTitle: "JSON Array"
      }
    ];

function createPropertyViewModel(data, contextToAdd) {
  data = _.defaults(data || {}, {
      name: ""
    , type: "string"
    , typeLabel: "string"
    , required: false
  });

  if (data.name) {
    data.id = data.name;  
  } else {
    data.name = data.id;
  }
  
  

  var self = ko.mapping.fromJS(data, propertyMapping);

  self.name = self.name.extend({variableName: true});
  
  self.editing = ko.observable(false);
  self.nameFocus = ko.observable();

  self.isNew = contextToAdd != null;

  self.tooltipEvent = new ui.Emitter();

  self.editing.subscribe(function(newValue) {
    if (!newValue) {
      self.tooltipEvent.emit('hide');
    }
  });

  self.toggleEditing = function() {
    self.editing(!self.editing());
    if (self.editing()) self.nameFocus(true);

    return false;
  };

  self.onClickHeader = function(data, e) {
    if (!self.editing() || (e.target === e.currentTarget || $(e.target).is('div'))) {
      self.toggleEditing();  
      return false;
    }

    return true;
  };

  self.onNameKeypress = function(data, e) {
    if (e.which == 13) {
      setTimeout(function() {
        if (self.isNew) {
          contextToAdd.addProperty();
        } else {
          self.editing(false);
        }
      }, 1);
    }

    return true;
  };
  
  self.onNameKeyDown = function (data, e) {
    if(commands[e.which]) {
      return execCommand(data, e);
    }
    
    return true;
  };

  self.setType = function(data) {
    if (typeof data === 'string') {
      data = {
          id: data
        , label: data
      }
    }
    self.type(ko.utils.unwrapObservable(data.id));      
    self.typeLabel(ko.utils.unwrapObservable(data.label));
  };

  // var types = {'string': 0, 'number': 1, 'boolean': 2, 'date': 3};
  var types = ['string', 'number', 'boolean', 'date', 'object', 'array'];

  var commands = {
    // cmd + b (boolean)
    66: function (data) {
      data.setType('boolean');
    },
    // cmd + s (string)
    83: function (data) {
      data.setType('string');
    },
    // cmd + m (number)
    77: function (data) {
      data.setType('number');
    },
    // cmd + d (date)
    68: function (data) {
      data.setType('date');
    },
    // up arrow
    38: function (data) {
      var cur = data.type();
      for(var i = 0; i < types.length; i++) {
        if(cur === types[i]) {
          data.setType(types[i + 1] || types[0]);
          return;
        }
      }
    },
    // down arrow
    40: function (data) {
      var cur = data.type();
      for(var i = 0; i < types.length; i++) {
        if(cur === types[i]) {
          data.setType(types[i - 1] || types[types.length - 1]);
          return;
        }
      }
    },
    // cmd + o
    79: function (data) {
      data.required(!data.required());
    }
  };

  var tooltipTimeout;
  
  function execCommand(data, e) {
    if(e.metaKey || e.which === 38 || e.which === 40) {
      commands[e.which] && commands[e.which](data);
      var $textBox = $(e.target)
       , $typeSelector = $textBox.parent().find('.type-selector .dropdown-toggle');

      self.tooltipEvent.emit('show');

     return false;
    }
    return true;
  }

  return self;   
} 

function create() {

  var vm = {
      properties: ko.observableArray()
    , propertyTypes: propertyTypes
    , isUsers: Context.resourceType === "UserCollection"
    , otherItems: ko.observable(false)
  };

  var mapping = {
    'properties': {
        key: function(data) { return ko.utils.unwrapObservable(data.name); }
      , create: _.bind(function(options) { return createPropertyViewModel(options.data) }, this)
    }
  };

  var subscribed = false;

  vm.newProperty = createPropertyViewModel({}, vm);
  vm.newProperty.nameFocus(true);

  vm.addProperty = _.bind(function() {
    if (this.newProperty.name() && this.newProperty.type()) {
      this.properties.push(createPropertyViewModel(
        ko.mapping.toJS(this.newProperty)
      ));

      this.newProperty.name('');

      this.newProperty.tooltipEvent.emit('hide');
    }
    
  }, vm);

  vm.removeProperty = _.bind(function(prop) {
    var self = this;
    var index = this.properties.indexOf(prop);

    var notification = ui.notify("Deleted " + prop.name(), $('<a href="#">Undo</a>').click(function() {
      self.properties.splice(index, 0, prop);
      notification.hide();
      return false;
    }));

    this.properties.remove(prop);
  }, vm);

  vm.onNewNameKeypress = _.bind(function(context, e) {
    if (e.which == 13) {
      setTimeout(function() {
        vm.addProperty();
      }, 1);
    }
    return true;
  }, vm);

  function fetchProperties() {
    dpd('__resources').get(Context.resourceId, function(res, err) {
      var propertiesJson = res.properties
        , propertiesArray;

      propertiesArray = CollectionUtil.propsToArray(propertiesJson);

      ko.mapping.fromJS({
        properties: propertiesArray
      }, mapping, vm);

      subscribe();

      $('#properties').show();

    });
  }

  dpd(Context.resourceId).get({$limit: 1}, function(res) {
    if (res.length) {
      vm.otherItems(true);
    } else {
      vm.otherItems(false);
    }
  })

  function subscribe() {
    if (subscribed) return;
    ko.computed(function() {
      var propertiesArray = ko.mapping.toJS(vm).properties
        , propertiesJson = {}
        , order = 0;

      propertiesArray.forEach(function(p) {
        p.order = order;
        order++;
        if (p.name !== p.id) {
          p.$renameFrom = p.id;
          p.id = p.name;
        }
        propertiesJson[p.id] = p;
      });

      return propertiesJson;
    }, vm).extend({throttle: 500}).subscribe(function(propertiesJson) {
      
      dpd('__resources').put(Context.resourceId, {properties: propertiesJson}, function(res, err) {
        if (err) return ui.error("Error saving properties", err && err.message).sticky();
        if (!$('#notifications li').length) ui.notify("Saved").hide(500); // Only show it if there are no other notifications - too spammy otherwise
      });

    }, vm);
  }
  

  fetchProperties();

  ko.applyBindings(vm);
  
  return vm;
}

create();

})();
