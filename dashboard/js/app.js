var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/backbone-utils.js", function (require, module, exports, __dirname, __filename) {
var app = require('./app');
var saveStatus = require('./view/save-status-view');

Backbone.Model.prototype.idAttribute = "_id";
Backbone.View.prototype.close = function () {
  this.remove();
  this.unbind();
};

var oldSync = Backbone.sync;
Backbone.sync = function(method, model, options) {
  var url = _.isFunction(model['url']) ? model['url']() : model['url'];
  url = app.get('appUrl') + url;

  if (method === 'create' || method === 'update' || method === 'delete') {
    saveStatus.saving();
    var lastSuccess = options.success;
    var success = function() {
      saveStatus.saved();
      if (lastSuccess) {
        lastSuccess.apply(this, arguments);
      }
    }
    options.success = success;
  }

  if (method === 'create' || method === 'update') {
    var data = options.data || model.toJSON();
    if(typeof data != 'string') {
      Backbone.Utils.removeClientValues(data);
      options.contentType = 'application/json';
      options.data = JSON.stringify(data);
    }
  }

  options.headers = {
    'x-dssh-key': app.get('authKey')
  };

  options.url = options.url || url;
  return oldSync(method, model, options);
};

var oldCheckUrl = Backbone.History.prototype.checkUrl;
Backbone.History.prototype.checkUrl = function(e) {
  this._lastFragment = this.fragment;
  
  if (this.getFragment() !== this.fragment) {
    var loadEvent = {cancel: false};
    this.trigger('load', loadEvent);
    if (loadEvent.cancel) {
      this.navigate(this.fragment, {trigger: true, replace: true});
      e.preventDefault();
      window.location.hash = this.fragment;
      return false;
    }
  }
  

  oldCheckUrl.apply(this, arguments);  
}

// var oldLoadUrl = Backbone.History.prototype.loadUrl;
// Backbone.History.prototype.loadUrl = function(fragmentOverride) {
//   var fragment = this.getFragment(fragmentOverride);
  
//   if (this.fragment !== this._lastFragment) {
//     var e = {cancel: false};
//     this.trigger('load', e);
//     if (e.cancel) {
//       console.log('Going to', this._lastFragment);
//       this.navigate(this._lastFragment, {trigger: true, replace: true});
//       return;
//     }  

//     oldLoadUrl.apply(this, arguments);  
//   }
  
  
// };



Backbone.Utils = Backbone.Utils || {};
Backbone.Utils.removeClientValues = function(json) {
  if (isArray(json)) {
    _.each(json, function(val, index) {
      if (typeof val === 'object') {
        Backbone.Utils.removeClientValues(val);
      }
    });
  } else {
    _.each(json, function(val, key) {
      if (_.str.startsWith(key, 'c_')) {
        delete json[key];
      } else if (typeof val === 'object') { //Will also catch arrays
        Backbone.Utils.removeClientValues(val);
      }
    });
   }
   return json;
};
Backbone.Utils.parseDictionary = function(resp, options) {
  var defaults = {
    keyProperty: 'label'
  }
  options = _.defaults(options || {}, defaults);

  var keys = Object.keys(resp);
  var result = [];

  _.each(keys, function(key) {
    var model = resp[key];
    model._id = key;
    model[options.keyProperty] = model[options.keyProperty] || key;
    result.push(model);
  });

  return result;
};

Backbone.Utils.toJSONDictionary = function(json, options) {
 var defaults = {
    keyProperty: 'label'
  }
  _.defaults(options, defaults);

  var result = {};

  _.each(json, function(model) {
    var key = model[options.keyProperty];
    delete model[options.keyProperty];

    result[key] = model;
  });

  return result;
};

function isArray(o) {
  return Object.prototype.toString.call(o) === '[object Array]';
}
});

require.define("/app.js", function (require, module, exports, __dirname, __filename) {
var App = Backbone.Model.extend({
  defaults: {
    appName: 'My App',
    appUrl: 'https://myapp.deploydapp.com'
  }
});

module.exports = new App();
});

require.define("/view/save-status-view.js", function (require, module, exports, __dirname, __filename) {
var $span;
var currentText = "Up to date";

function init(preventReset) {
  $span = $('#save-status');
  if (preventReset) {
    $span.text(currentText);
  } else {
    set("Up to date");
  }
}

function saving() {
  set("Saving...");
}

function saved() {
  var now = new Date();

  set("Last saved " + now.toLocaleTimeString());
}

function set(text) {
  currentText = text;
  $span.text(text);
}

module.exports = {
  init: init,
  saving: saving,
  saved: saved
};

init();
});

require.define("/view/undo-button-view.js", function (require, module, exports, __dirname, __filename) {
var $button, $actionLabel, reverseFunc;

function init() {
  $button = $('#undo-btn');
  $actionLabel = $('.action-label', $button);

  hide();

  $button.click(function() {
    reverseFunc();
    $button.hide();
  });
}

function show(label, reverse) {
	$button.show();
	$actionLabel.text(label);
	reverseFunc = reverse;		
}

function hide() {
  $button.hide();
  reverseFunc = null;
  $actionLabel.text('');
}


module.exports = {
  init: init,
	show: show,
  hide: hide
};

init();
});

require.define("/view/divider-drag.js", function (require, module, exports, __dirname, __filename) {
module.exports = function() {

	var DIVIDER_PADDING = 10;
	var MIN_AREA = 50;

	var $area = $('.main-area');
	var $top = $('.top-panel', $area);
	var $bottom = $('.bottom-panel', $area);
	var $divider = $('.divider', $area);

	var dividerHeight = $divider.outerHeight();
	var totalHeight = $area.innerHeight();

	var dividerPoint = 0;

	// setInterval(function() {
	// 	var time = new Date();
	// 	var perc = (Math.sin(time / 1000) + 1) / 2;

	// 	setDividerPoint(perc * totalHeight);
	// }, 100);

	setDividerPoint(totalHeight / 2);

	$divider.mousedown(function() {

		var drag = function(e) {
			var y = e.pageY - $area.offset().top;

			

			setDividerPoint(y);

			return false;
		}

		$(window).mousemove(drag);

		$(window).mouseup(function() {
			$(window).unbind('mousemove', drag);

			return false;
		});

		return false;
	});

	$(window).resize(function() {
		var percent = dividerPoint / totalHeight;
		totalHeight = $area.innerHeight();
		setDividerPoint(totalHeight*percent);
	});

	function setDividerPoint(y) {
			if (y > totalHeight - MIN_AREA) {
				y = totalHeight - MIN_AREA;
			} else if (y < MIN_AREA) {
				y = MIN_AREA;
			}
			dividerPoint = y;
			$top.height(y - dividerHeight/2);
			$bottom.height(totalHeight - y - dividerHeight);
			$divider.css('top', y);
	}
		

};
});

require.define("/view/app-view.js", function (require, module, exports, __dirname, __filename) {
var CollectionSettings = require('../model/collection-settings');

var ResourcesView = require('./resources-view');
var ModelEditorView = require('./model-editor-view');
var StaticView = require('./static-view');
var HeaderView = require('./header-view');

var undoBtn = require('./undo-button-view');
var saveStatus = require('./save-status-view');

var app = require('../app');
var router = require('../router');

var AppView = module.exports = Backbone.View.extend({

  headerTemplate: _.template($('#header-template').html()),

  resourcesTemplate: _.template($('#resources-template').html()),
  collectionTemplate: _.template($('#collection-template').html()),
  staticTemplate: _.template($('#static-template').html()),

  events: {
    'click #authModal .save': 'authenticate'
  },

  initialize: function() {
    this.model = this.model || app;
    this.model.on('change:resourceId', this.loadResource, this);
    this.model.on('change:resource', this.render, this);

    this.headerView = new HeaderView({model: app});

    this.$modal = $('#authModal').modal();

    var appUrl = $.cookie('DPDAppUrl');
    if (appUrl && appUrl.lastIndexOf('/') === appUrl.length - 1) {
      appUrl = appUrl.slice(0,-1);
    }

    app.set({
      appUrl: appUrl,
      authKey: $.cookie('DPDAuthKey')
    })

    if (app.get('appUrl') && app.get('authKey')) {
      this.$modal.modal('hide');
    } else {
      this.$modal.on('click', '.save', _.bind(this.authenticate, this));
    }

  },

  authenticate: function() {
    app.set({
      authKey: this.$modal.find('[name=key]').val()
    });

    this.$modal.modal('hide');
    this.render();

    return false;
  },

  loadResource: function() {
    var self = this;
    if (this.model.get('resourceId')) {
      var resource = new Backbone.Model({_id: self.model.get('resourceId')});
      resource.url = '/resources/' + resource.id;
      resource.fetch({success: function() {
        var newResource = new CollectionSettings();
        app.set({
          resourceName: resource.get('path'),
          resourceType: resource.get('typeLabel'),
          resourceTypeId: resource.get('type')
        })
        newResource.set(newResource.parse(resource.attributes));
        self.model.set({resource: newResource});
      }});
    } else {
      self.model.set({resource: null});
    }
  },

  render: function() {
    var model = this.model.toJSON();
    var template, bodyViewClass;
    var resourceId = this.model && this.model.get('resourceId');
    var type = this.model && resourceId && this.model.get('resourceTypeId');

    if (type === 'Collection' || type === 'UserCollection') {
      template = this.collectionTemplate;
      bodyViewClass = ModelEditorView;
    } else if(type === 'Static') {
      template = this.staticTemplate;
      bodyViewClass = StaticView;
    } else {
      app.set({resourceType: ''});
      app.set({resourceName: ''});
      template = this.resourcesTemplate;
      bodyViewClass = ResourcesView;
    }

    var body = $('<div id="body">').html(template(model));
    $('#body').replaceWith(body);
    require('./divider-drag')();

    if (this.bodyView) {
      this.bodyView.close();
    }

    this.bodyView = new bodyViewClass({el: body, model: this.model.get('resource')});  
    this.bodyView.render();

    undoBtn.init();
    saveStatus.init();
  },

});

});

require.define("/model/collection-settings.js", function (require, module, exports, __dirname, __filename) {
var PropertyCollection = require('./property-collection');

var CollectionSettings = module.exports = Backbone.Model.extend({
  url: function() {
    return '/resources/' + this.id
  },

  defaults: {
    properties: null,
    onGet: '',
    onPost: '',
    onPut: '',
    onDelete: ''
  },

  initialize: function() {
    this.set({properties: new PropertyCollection()});

    this.get('properties').on('add', this.triggerChanged, this);
    this.get('properties').on('remove', this.triggerChanged, this);
    this.get('properties').on('change:name', this.triggerChanged, this);
    this.get('properties').on('change:required', this.triggerChanged, this);
    this.get('properties').on('change:order', this.triggerChanged, this);
  },

  parse: function(json) {
    var properties = json.properties;
    delete json.properties;

    //Copy over c_ values
    this.get('properties').each(function(prop) {
      var newProp = properties[prop.get('name')];
      if (newProp) {
        _.each(prop.attributes, function(value, key) {
          if (_.str.startsWith(key, 'c_')) {
            newProp[key] = value;
          }
        });
      } 
    });

    if (properties) {
      this.get('properties').reset(Backbone.Utils.parseDictionary(properties, {keyProperty: 'name'}), {parse: true});;
    }

    return json;
  },

  triggerChanged: function() {
    this.trigger('change');
  },

  toJSON: function() {
    var json = Backbone.Model.prototype.toJSON.call(this);
    json.properties = Backbone.Utils.toJSONDictionary(json.properties.toJSON(), {keyProperty: 'name'});


    return json;
  }
});
});

require.define("/model/property-collection.js", function (require, module, exports, __dirname, __filename) {
var Property = require('./property');

var PropertyCollection = module.exports = Backbone.Collection.extend({
  model: Property,

  comparator: function(prop) {
    return prop.get('order');
  }
});
});

require.define("/model/property.js", function (require, module, exports, __dirname, __filename) {
var Property = module.exports = Backbone.Model.extend({

  defaults: {
    required: true
  },

  initialize: function() {
    this.on('change:optional', function() {
      this.set({required: !this.get('optional')})
    }, this);
  },

  parse: function(json) {
    json.$renameFrom = json.name;

    return json;
  },

  toJSON: function() {
    var json = Backbone.Model.prototype.toJSON.call(this);
    if (json.$renameFrom == json.name) {
      delete json.$renameFrom;
    }
    return json;
  }

});
});

require.define("/view/resources-view.js", function (require, module, exports, __dirname, __filename) {
var ComponentTypeSidebarView = require('./component-type-sidebar-view');
var ResourceListView = require('./resource-list-view');

var ResourceCollection = require('../model/resource-collection');
var ResourceTypeCollection = require('../model/resource-type-collection');

var ResourcesView = module.exports = Backbone.View.extend({
  el: 'body',

  initialize: function() {
    this.resourceTypes = new ResourceTypeCollection();
    this.resources = new ResourceCollection();

    this.resourceListView = new ResourceListView({
      collection: this.resources,
      parentView: this
    });
    this.resourceSidebarView = new ComponentTypeSidebarView({
      collection: this.resourceTypes, 
      listView: this.resourceListView, 
      parentView: this,
      template: _.template($('#resource-sidebar-template').html()),
      el: '#resource-sidebar'
    });

    this.resourceTypes.fetch();
    this.resources.fetch();
  }
});
});

require.define("/view/component-type-sidebar-view.js", function (require, module, exports, __dirname, __filename) {
var ComponentTypeSidebarView = module.exports = Backbone.View.extend({

  events: {
    'dblclick li': 'onAddItem'
  },

  initialize: function() {
    this.collection = this.collection || this.options.collection;
    this.template = this.template || this.options.template;
    this.listView = this.listView || this.options.listView

    this.collection.on('reset', this.render, this);
  },

  render: function() {
    var self = this;
    $(this.el).html(this.template({
      types: this.collection
    }));

    self.$('li').each(function() {
      $(this).draggable({
        connectToSortable: $(self.listView.el),
        helper: 'clone',
        revert: 'invalid',
        revertDuration: 100,
        appendTo: 'body'
      });
    })
  },

  onAddItem: function(e) {
    var typeCid = $(e.currentTarget).attr('data-cid');
    var type = this.collection.getByCid(typeCid);
    this.listView.addItem(type); 
  },

});
});

require.define("/view/resource-list-view.js", function (require, module, exports, __dirname, __filename) {
var Resource = require('../model/resource');
var ResourceView = require('./resource-view');

var ResourceListView = module.exports = Backbone.View.extend({
  el: '#resource-list',
  emptyEl: '#resource-list-empty',

  subViews: [],

  initialize: function() {
    this.parentView = this.options.parentView;
    this.collection = this.options.collection;
    this.collection.on('reset', this.render, this);
    this.collection.on('add', this.render, this);
    this.collection.on('remove', this.render, this);

    this.initializeDom();
  },

  initializeDom: function() {
    $(this.el).sortable({
      revert: false,
      placeholder: 'placeholder',
      cancel: '.placeholder, .well',
      distance: 10,

      receive: _.bind(function() {
        var $newItem = $($(this.el).data().sortable.currentItem);
        var index = $(this.el).children(':not(.placeholder)').index($newItem);
        this.onReceiveComponent($newItem, index);
      }, this),
      update: _.bind(this.onReorder, this)
    });

    $('.placeholder', this.emptyEl).droppable({
      hoverClass: 'highlight',

      drop: _.bind(function(event, ui) {
        var $newItem = $(ui.helper);
        this.onReceiveComponent($newItem);
      }, this)
    });
  },

  addItem: function(type, index) {
    if (isNaN(index)) {
      index = this.collection.length;
    }
    
    var resource = new Resource({
      path: type.get('defaultPath'),
      typeLabel: type.get('label'),
      type: type.get('_id'),
      order: index + 1,
      c_active: true
    });
    
    this.collection.add(resource, {at: index});
    this.updateOrder();

    process.nextTick(function() {
      this.$('#' + resource.cid).find('input[name="path"]').focus();
    });
  },

  updateOrder: function() {
    var self = this;
    var items = [];
    
    $(this.el).children().each(function() {
      var item = self.collection.getByCid($(this).attr('id'));
      if (item) {
        items.push(item);  
      }
    });

    var order = 0;
    
    _.each(items, function(item) {
      order += 1;
      if (!item.isNew()) {
        item.save({order: order}, {silent: true});
      } else {
        item.set({order: order}, {silent: true});
      }
    });
  },

  onReceiveComponent: function($newItem, index) {
    var typeCid = $newItem.attr('data-cid');
    var type = this.parentView.resourceTypes.getByCid(typeCid);

    $newItem.remove();

    this.addItem(type, index);
  },

  onReorder: function() {
    this.updateOrder();    
  },

  render: function(e) {
    var self = this;
    _.each(self.subViews, function(subView) {
      subView.destroy();
    });
    $(self.el).empty();
    if (self.collection.length) {
      $(self.el).show();
      $(self.emptyEl).hide();
      self.subViews = self.collection.map(function(resource) {
        var view = new ResourceView({model: resource, parentView: self});
        $(self.el).append(view.el);
        view.render();
        return view;
      });
    } else {
      $(self.el).hide();
      $(self.emptyEl).show();
    }
  }
});
});

require.define("/model/resource.js", function (require, module, exports, __dirname, __filename) {
var Resource = module.exports = Backbone.Model.extend({ 
  defaults: {
    path: '',
    order: 0
  },

  initialize: function() {
  	this.on('change:path', this.sanitizePath, this);
  },

  sanitizePath: function() {
  	var path = this.get('path');
  	path = Resource.sanitizePath(path);
  	if (path !== this.get('path')) {
  		this.set({path: path});	
  	}
  }
});

Resource.sanitizePath = function(path) {
  path = path.toLowerCase().replace(/[ _]/g, '-').replace(/[^a-z0-9\/\-]/g, '');
  if (!_.str.startsWith(path, '/')) {
    path = '/' + path;
  }
  return path;
}

});

require.define("/view/resource-view.js", function (require, module, exports, __dirname, __filename) {
var undo = require('./undo-button-view');

var router = require('../router');

var template = _.template($('#resource-template').html());

var ResourceView = module.exports = Backbone.View.extend({
  tagName: 'li',
  className: 'component-item',
  
  events: {
    'click .delete-btn': 'delete',
    'click .edit-btn': 'gotoDetail',
    'dblclick .header': 'gotoDetail',
    'dblclick .path': 'activate',
    'click .rename-btn': 'activate',
    'click .cancel-btn': 'deactivate',
    'click .save-btn': 'save',
    'click input[name="path"]': 'onFocus',
    'keypress input[name="path"]': 'onKeypress',
    'keyup input[name="path"]': 'onKeyup'
  },
  
  initialize: function(){
    this.parentView = this.options.parentView;

    this.model.on('change:c_active', this.render, this);
    this.model.on('change:_id', this.render, this);
    this.model.on('change:path', this.render, this);

  },
  
  render: function(){
    var $el = $(this.el);
    $el.attr('id', this.model.cid).html(template({
      resource: this.model.toJSON()
    }));

    if (this.model.isNew()) {
      $el.addClass('unsaved');
    } else {
      $el.removeClass('unsaved');
    }
    return this;
  },

  gotoDetail: function() {
    if (!this.model.isNew()) {
      router.navigate(this.model.get('_id'), {trigger: true});
    }

    return false;
  },


  delete: function() {
    var self = this; 
    if (self.model.isNew()) {
      self.model.destroy();
    } else {
      if (confirm('Do you wish to delete this resource? All associated data and configuration will be permanently removed.')) {
        self.model.destroy({wait: true});
      }
    }

    return false;
  },

  activate: function() {

    this.model.set({c_active: true});
    this.$('input[name="path"]').focus();

    return false;
  },

  deactivate: function() {

    if (this.model.isNew()) {
      this.delete();
    } else {
      this.model.set({c_active: false});
    }

    return false;
    
  },

  save: function() {
    this.model.save({path: this.$('input[name="path"]').val()});
    this.model.set({c_active: false});

    return false;
  },

  onFocus: function(e) {
    $(e.currentTarget).focus();
  },

  onKeypress: function(e) {
    var val = $(e.currentTarget).val();

    if (!_.str.startsWith(val, '/')) {
      val = '/' + val;
      $(e.currentTarget).val(val);
    }
    
  },

  onKeyup: function(e) {
    if (e.which == 13) {
      this.save();
    }

    if (e.which == 27) {
      this.deactivate();
    }
  },

  destroy: function() {
    this.model.off('change:c_active', this.render);
    this.model.off('change:_id', this.render);
    this.model.off('change:path', this.render);
  }
});

});

require.define("/router.js", function (require, module, exports, __dirname, __filename) {
var app = require('./app');

var Router = Backbone.Router.extend({
  routes: {
    '': 'home',
    ':id': 'resource'
  },

  home: function() {
    app.set({
      resourceId: '',
      resourceName: undefined,
      resourceType: undefined
    });
  },

  resource: function(id) {
    app.set({
      resourceId: id
    });
  }
});

module.exports = new Router();
});

require.define("/model/resource-collection.js", function (require, module, exports, __dirname, __filename) {
var Resource = require('../model/resource');

var ResourceCollection = module.exports = Backbone.Collection.extend({
  model: Resource,
  url: '/resources',

  comparator: function(resource) {
    return resource.get('order');
  }
});
});

require.define("/model/resource-type-collection.js", function (require, module, exports, __dirname, __filename) {
var ResourceTypeCollection = module.exports = Backbone.Collection.extend({
  url: '/types',

  sort: function(model) {
    return model.get('label');
  },

  parse: Backbone.Utils.parseDictionary
});
});

require.define("/view/model-editor-view.js", function (require, module, exports, __dirname, __filename) {
var PropertyTypeCollection = require('../model/property-type-collection');
var CollectionSettings = require('../model/collection-settings');

var ComponentTypeSidebarView = require('./component-type-sidebar-view');
var PropertyListView = require('./property-list-view');
var CollectionDataView = require('./collection-data-view');
var CollectionEventView = require('./collection-event-view');

var app = require('../app');
var router = require('../router');
var undoBtn = require ('./undo-button-view');

var ModelEditorView = module.exports = Backbone.View.extend({

  initialize: function() {
    this.propertyTypes = new PropertyTypeCollection();
    // this.model.resourcePath = '/todos';

    this.dataCollection = new Backbone.Collection([]);
    this.dataCollection.url = this.model.get('path');
    this.dataCollection.fetch();

    this.model.on('change:path', function() {
      this.dataCollection.url = this.model.get('path');
    }, this);

    this.propertyListView = new PropertyListView({
      collection: this.model.get('properties'),
      parentView: this
    });

    this.propertySidebarView = new ComponentTypeSidebarView({
      collection: this.propertyTypes, 
      listView: this.propertyListView, 
      parentView: this,
      template: _.template($('#property-sidebar-template').html()),
      el: '#property-sidebar'
    });

    this.dataView = new CollectionDataView({
      properties: this.model.get('properties'),
      collection: this.dataCollection
    });

    this.eventsView = new CollectionEventView({
      el: this.$('#events-panel'),
      model: this.model
    }).render();

    this.model.on('change', this.save, this);

    // this.dataCollection.on('change:c_save', this.enableSave, this);
    // this.dataCollection.on('change:c_delete', this.enableSave, this);
    // this.dataCollection.on('add', this.enableSave, this);
    // this.dataCollection.on('remove', this.enableSave, this);

    this.propertyTypes.fetch();

    // Backbone.history.on('load', this.onNavigate, this);

    this.initializeDom();
  },

  initializeDom: function() {
    this.onKeypress = _.bind(this.onKeypress, this);
    // this.onPageNavigate = _.bind(this.onPageNavigate, this);
    // $(window).keydown(this.onKeypress);
    // $(window).on('beforeunload', this.onPageNavigate);

    // this.$('#save-btn').button();
    // this.disableSave();
  },

  // enableSave: function() {
  //   this.$('#save-btn').removeAttr('disabled');
  // },

  // disableSave: function() {  
  //   var $btn = this.$('#save-btn');
  //   $btn.button('reset');
  //   setTimeout(function() {
  //    $btn.attr('disabled', true);
  //   }, 0);  
  // },

  save: function() {
    var self = this;
   
    this.model.save();
  },

  onKeypress: function(e) {

    if ((e.ctrlKey || e.metaKey) && e.which == '83') { //Ctrl-S
      this.save();
      e.preventDefault();
      return false;
    }   
  },

  // onNavigate: function(e) {

  //   if (!(this.$('#save-btn').is('[disabled]') || confirm('You have unsaved changes, are you sure you wish to navigate away from this page?'))) {      
  //     e.cancel = true;
  //     return false;
  //   }
    
  // },

  // onPageNavigate: function(e) {
  //   if (!this.$('#save-btn').is('[disabled]')) {
  //     return 'You have unsaved changes.';  
  //   }
  // },

  render: function() {
    this.propertyListView.render();
    return this;
  },

  close: function() {
    // $(window).off('keydown', this.onKeypress);
    // $(window).off('unload', this.onNavigate);
    // Backbone.history.off('load', this.onNavigate);
    Backbone.View.prototype.close.call(this);
  }


});

});

require.define("/model/property-type-collection.js", function (require, module, exports, __dirname, __filename) {
var PropertyTypeCollection = module.exports = Backbone.Collection.extend({
  url: '/property-types',

  sort: function(model) {
    return model.get('label');
  },

  parse: Backbone.Utils.parseDictionary
});
});

require.define("/view/property-list-view.js", function (require, module, exports, __dirname, __filename) {
var Property = require('../model/property');

var PropertyView = require('./property-view');


var PropertyListView = module.exports = Backbone.View.extend({
  el: '#property-list',

  initialize: function() {
    this.parentView = this.options.parentView;
    this.collection = this.options.collection;
    this.collection.on('reset', this.render, this);
    this.collection.on('add', this.render, this);
    this.collection.on('remove', this.render, this);

    this.initializeDom();  
  },

  initializeDom: function() {
    $(this.el).sortable({
      revert: false,
      placeholder: 'placeholder',
      cancel: '.placeholder, .locked',
      items: '> li:not(.locked)',
      distance: 10,

      receive: _.bind(this.onReceiveItem, this),
      update: _.bind(this.updateOrder, this)
    });
  },

  addItem: function(type, index) {
    if (isNaN(index)) {
      index = this.collection.length;
    }
    
    var resource = new Property({
      name: type.get('defaultName'),
      typeId: type.id,
      typeLabel: type.get('label'),
      type: type.get('label'),
      order: index + 1,

      c_active: true
    });
    this.collection.add(resource, {at: index});

    process.nextTick(function() {
      this.$('#' + resource.cid).find('input[name="name"]').focus();
    });
  },

  render: function() {
    var self = this;

    var $focus = $(self.el).find('input[name="name"]:focus');
    if ($focus) {
      var focusName = $focus.val();
    }

    _.each(self.subViews, function(subView) {
      subView.destroy();
    });
    $(self.el).children(':not(.locked)').remove();
    self.subViews = self.collection.map(function(property) {
      var view = new PropertyView({model: property, parentView: self});
      $(self.el).append(view.el);
      view.render();
      return view;
    });    

    if ($focus) {
      self.$('input[name="name"][value="' + focusName + '"]').focus();
    }
  },

  onReceiveItem: function() {
    var $newItem = $($(this.el).data().sortable.currentItem);
    var index = $(this.el).children(':not(.placeholder, .locked)').index($newItem);  
    var typeCid = $newItem.attr('data-cid');
    var type = this.parentView.propertyTypes.getByCid(typeCid);

    $newItem.remove();

    this.addItem(type, index);
  },

  updateOrder: function() {
    var self = this;
    var items = [];
    
    $(this.el).children().each(function() {
      var item = self.collection.getByCid($(this).attr('id'));
      if (item) {
        items.push(item);  
      }
    });

    var order = 0;
    
    _.each(items, function(item) {
      order += 1;
      item.set({order: order});
    });

    self.collection.sort();
  }
});
});

require.define("/view/property-view.js", function (require, module, exports, __dirname, __filename) {
var undoBtn = require('./undo-button-view');

var PropertyView = module.exports = Backbone.View.extend({
  tagName: 'li',
  className: 'component-item',

  template: _.template($('#property-template').html()),

  events: {
    'click input[name="name"]': 'focusInput',
    'click .header': 'toggleActive',
    'click .delete-btn': 'delete',
    'change input[name="name"]': 'updateName',
    'keydown input[name="name"]': 'onNameKeydown',
    'change input[name="optional"]': 'updateOptional'
  },

  initialize: function() {
    this.parentView = this.options.parentView;

    this.model.on('change', this.render, this);
  },

  render: function() {
    $(this.el).html(this.template({
      propertyModel: this.model,
      property: this.model.toJSON()
    })).attr('id', this.model.cid);

    if (this.model.get('c_active')) {
      $(this.el).addClass('active');
      if (this.model.hasChanged('c_active')) {
        this.focusInput();
      }
    } else {
      $(this.el).removeClass('active');
    }

  },

  focusInput: function() {
    this.$('input[name="name"]').focus();

    return false;
  },

  toggleActive: function() {
    this.model.set({c_active: !this.model.get('c_active')});  

    return false;
  },

  updateName: function() {
    this.model.set({name: this.$('input[name="name"]').val()});
  },

  updateOptional: function() {
    this.model.set({optional: this.$('input[name="optional"]').is(':checked')});
  },

  delete: function() {
    var self = this;
    var collection = self.parentView.collection; 

    collection.remove(self.model);

    undoBtn.show('Delete ' + self.model.get('name'), function() {
      collection.add(self.model, {at: self.model.get('order') - 1});
    });

    return false;
  },

  onNameKeydown: function(e) {
    if (e.which == 13) {
      this.updateName();
      this.model.set({c_active: false});
      return false;
    }

    if (e.which == 27) {
      this.model.set({c_active: false});
      return false;
    }
  },

  destroy: function() {
    this.model.off('change', this.render);
  }
  
});
});

require.define("/view/collection-data-view.js", function (require, module, exports, __dirname, __filename) {
var undoBtn = require('./undo-button-view');

var app = require('../app');

var CollectionDataView = module.exports = Backbone.View.extend({

  el: '#current-data',

  template: _.template($('#model-table-template').html()),

  events: {
    'click .add-btn': 'addRow',
    'click .delete-btn': 'deleteRow',
    'click .edit-btn': 'editRow',
    'dblclick td': 'editRow',
    'click .done-btn': 'commitRow',
    'keyup input': 'onFieldKeypress',
    'dblclick input': 'cancelEvent',
  },

  initialize: function() {
    this.properties = this.options.properties;
    this.collection = this.options.collection;

    
    this.properties.on('reset', this.render, this);
    this.properties.on('add', this.render, this);
    this.properties.on('remove', this.render, this);
    this.properties.on('change:name', this.render, this);

    this.collection.on('reset', this.render, this);
    this.collection.on('add', this.render, this);
    this.collection.on('remove', this.render, this);
    this.collection.on('change', this.render, this);

    this.properties.on('reset', function() {
      this.collection.fetch();
    }, this);

    $(this.el).on('focus', 'input', _.bind(function(e) {
      this._lastFocusedInput = e.currentTarget;
    }, this));
  },

  save: function(callback) {

    this.collection.each(function(model) {
      var dfd = new jQuery.Deferred();
      if (model.get('c_delete')) {
        model.destroy({success: dfd.resolve, error: dfd.reject});
      } else if (model.get('c_save')) {
        model.save({}, {success: dfd.resolve, error: dfd.reject});
      }
    });

    jQuery.when.call(jQuery, deferreds).done(callback);
  },

  addRow: function() {
    var row = new Backbone.Model({c_active: true, c_save: true});
    this.collection.add(row);
    setTimeout(function() {
      this.$('tr[data-cid="' + row.cid + '"] input').first().focus();
    }, 0);
    return false;
  },

  deleteRow: function(e) {
    var row = this._getRow(e);
    var index = this.collection.indexOf(row);
    row.destroy();

    undoBtn.show('Delete row', _.bind(function() {
      this.collection.create(row.toJSON());
    }, this));

    return false;
  },

  editRow: function(e) {
    var row = this._getRow(e);
    row.set({c_active: true});

    if ($(e.currentTarget).is('td')) {
      var prop = $(e.currentTarget).attr('data-prop');
      setTimeout(function() {
        this.$('tr[data-cid="' + row.cid + '"] td[data-prop="' + prop + '"] input').first().focus();
      }, 0);
    } else {
      setTimeout(function() {
        this.$('tr[data-cid="' + row.cid + '"] input').first().focus();
      }, 0);
    }

    

    return false;
  },

  commitRow: function(e) {
    var row = this._getRow(e);

    var changes = {
      c_active: false
    };

    if (app.get('resourceTypeId') === 'UserCollection') {
      changes.email = $(e.currentTarget).parents('tr').find('input[name="email"]').val();
      var newPass = $(e.currentTarget).parents('tr').find('input[name="password"]').val();
      if (newPass) {
        changes.password = newPass;
      }
    }

    this.properties.each(function(prop) {
      var propName = prop.get('name');
      var type = prop.get('type');
      var $input = $(e.currentTarget).parents('tr').find('input[name="' + propName + '"]');
      var val = $input.val();

      if (type === 'number') {
        val = parseInt(val);
      } else if ( type === 'boolean' ) {
        val = $input.is(':checked');
      } else if (type === 'date') {
        val = new Date(val);
      }

      changes[propName] = val;

    });

    row.save(changes);

    return false;
  },

  updateField: function(e) {
    var row = this._getRow(e);
    var name = $(e.currentTarget).attr('name');
    var val = $(e.currentTarget).val();
    var change = {};
    change[name] = val;
    row.set(change);

    return false;
  },

  cancelEvent: function() {
    return false;
  },

  onFieldKeypress: function(e) {
    if (e.which == '13' || e.which == '27') { //enter or esc
      this.commitRow(e);
    }
  },

  render: function() {

    $(this.el).html(this.template({
      properties: this.properties.toJSON(),
      collectionModel: this.collection,
      resourceType: app.get('resourceTypeId')
    }));

  },

  _getRow: function(e) {
    var $target = $(e.currentTarget);
    if (!$target.is('tr')) {
      var $target = $target.parents('tr');
    }

    return this.collection.getByCid($target.attr('data-cid'));
  }

});
});

require.define("/view/collection-event-view.js", function (require, module, exports, __dirname, __filename) {
var CodeEditorView = require('./code-editor-view.js');

var CollectionEventView = module.exports = Backbone.View.extend({

  template: _.template($('#events-template').html()),

  initialize: function() {
    this._editors = {
      onGet: null,
      onPost: null,
      onPut: null,
      onDelete: null
    };
  },

  update: function(e) {
    var values = {};

    _.each(this._editors, function(editor, name) {
      if (editor) {
        values[name] = editor.getText();
      }
    });

    console.log("Updating");

    this.model.set(values);
  },

  render: function() {
    var self = this;

    $(this.el).html(this.template(this.model.toJSON()));

    _.each(this._editors, function(editor, name) {
      if (editor) {
        editor.off();  
      }

      editor = new CodeEditorView({ el: self.$('#' + name) }).render();
      editor.on('change', self.update, self);
      self._editors[name] = editor;
    });

    return this;
  },

  close: function() {
    _.each(this._editors, function(editor, name) {
      if (editor) {
        editor.off();  
      }    
    });
  }

});
});

require.define("/view/code-editor-view.js", function (require, module, exports, __dirname, __filename) {
var JavaScriptMode = ace.require("ace/mode/javascript").Mode;

var CodeEditorView = module.exports = Backbone.View.extend(Backbone.Events).extend({

  initialize: function() {
    _.bindAll(this, 'noteUpdate', 'update', 'render');
  },

  noteUpdate: function() {
    console.log("Change event");
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    this._timeout = setTimeout(this.update, 1000);
  },

  update: function() {
    console.log("Triggering change");
    this.trigger('change');
  },

  getText: function() {
    return this.editor.getSession().getValue()
  },

  render: function() {
    var editor = ace.edit(this.el);
    editor.getSession().setMode(new JavaScriptMode());
    editor.getSession().on('change', this.noteUpdate);

    this.editor = editor;

    return this;
  }
});
});

require.define("/view/static-view.js", function (require, module, exports, __dirname, __filename) {
var app = require('../app')
  , File = require('../model/file')
  , template = _.template($('#file-template').html())
;

var ModelEditorView = module.exports = Backbone.View.extend({
  
  events: {
    'change #file-upload input': 'onChange',
    'click a.delete': 'delete'
  },
  
  initialize: function () {
    this.list = this.$('#files tbody');
    this.files = new Backbone.Model();
    this.files.parse = function (data) {
      return {all: data}
    };
    this.files.url = this.model.get('path');
    this.files.on('change:all', this.render, this);
    this.files.fetch();
  },
  
  render: function (model, data, options) {
    var list = this.list
      , html = ''
      , model = this.model
      , path = model.get('path')
    ;
    
    if(path === '/') path = '';
    
    if(data) {
      _.each(data.reverse(), function (filename) {
        html += template({
          filename: filename,
          url: app.get('appUrl') + path + '/' + filename,
          isEditable: isEditable(filename)
        });
      })
    }
    
    list.html(html);
    
    return this;
  },
  
  onChange: function (e) {
    var files = e.target.files && e.target.files
      , path = this.model.get('path')
      , self = this
    ;
    
    _.each(files, function (file) {
      var f = new File({info: file, path: path});

      f.save(null, {
        complete: function () {
          self.files.fetch();
        }
      });
    });
  },
  
  delete: function (e) {
    var filename = $(e.target).attr('filename')
      , file = new File({path: this.model.get('path'), info: {fileName: filename}, _id: filename});
    
    var files = this.files;
    
    file.destroy({success: function () {
      files.fetch();
    }});
    
    return false;
  }
  
});

var editables = {
  // txt:1,
  // js:1,
  // html:1,
  // css:1,
  // ejs:1,
  // less:1
}

function isEditable(filename) {
  return editables[extension(filename)];
}

function extension(filename) {
  if(!filename) return;
  
  var lastDot = -1, i = 0;
  
  while(i < (filename ? filename.length : 0)) {
    if(filename[i++] === '.') lastDot = i;
  }
  
  return filename.substr(lastDot, filename.length);
}

});

require.define("/model/file.js", function (require, module, exports, __dirname, __filename) {
var File = module.exports = Backbone.Model.extend({ 
  
  url: function () {
    var info = this.get('info')
      , path = this.get('path')
    ;
    
    if(info) {
      return path + '/' + info.fileName;
    } else {
      return path;
    }
  },
  
  sync: function (method, model, options) {
    var self = this
      , args = arguments
    ;
      
    function next() {
      Backbone.sync.apply(model, args);
    }
    
    var info = model.get('info');
    
    if(method === 'create' && info) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = e.target.result;
        options.data = data.split(',')[1];
        next();
      };
      
      reader.readAsDataURL(info);
    } else {
      next();
    }
  }
  
});

});

require.define("/view/header-view.js", function (require, module, exports, __dirname, __filename) {
var Resource = require('../model/resource');

var saveStatus = require('./save-status-view');

var HeaderView = module.exports = Backbone.View.extend({
  el: '#header',

  template: _.template($('#header-template').html()),

  events: {
    'dblclick .resourceName': 'rename'
  },

  initialize: function() {
    this.model.on('change', this.render, this);
  },

  rename: function() {
    var resource = this.model.get('resource');
    var newName = prompt('Enter a new name for this ' + resource.get('type'), resource.get('path'));
    if (newName) {
      newName = Resource.sanitizePath(newName);
      resource.save({path: newName});
      this.model.set('resourceName', newName);
    }
    return false;
  },

  render: function() {
    $(this.el).html(this.template(this.model.toJSON()));
    saveStatus.init(true);

    return this;
  }
});
});

require.define("/entry.js", function (require, module, exports, __dirname, __filename) {
    // require('./view/divider-drag.js');
// require('./view/schema-edit-view.js');
// require('./view/sample-data-view.js');

// new require('./view/resources-view')();

require('./backbone-utils.js');

require('./view/undo-button-view');
require('./view/divider-drag');

var AppView = require('./view/app-view');
var router = require('./router');

var appView = new AppView();

Backbone.history.start();
});
require("/entry.js");
