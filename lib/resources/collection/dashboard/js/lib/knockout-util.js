(function() {

var unwrap = ko.utils.unwrapObservable;

ko.bindingHandlers.cssNamed = {
  update: function(element, valueAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
    var lastClass = $(element).data('knockoutCssNamed');

    $(element).removeClass(lastClass || " ").addClass(value).data('knockoutCssNamed', value);
  }
};

ko.bindingHandlers.enter = {
  init: function(element, valueAccessor, allBindings, viewModel) {
    var handler = ko.utils.unwrapObservable(valueAccessor());
    $(element).keypress(function(e) {
      if (e.which === 13) {
        handler.call(viewModel, viewModel, e);
      }
    });
  }
};

ko.bindingHandlers.escape = {
  init: function(element, valueAccessor, allBindings, viewModel) {
    var handler = ko.utils.unwrapObservable(valueAccessor());
    $(element).keypress(function(e) {
      if (e.which === 23) {
        handler.call(viewModel, viewModel, e);
      }
    });
  }
};

ko.bindingHandlers.tooltip = {
  init: function(element, valueAccessor) {
    var value = ko.toJS(valueAccessor());
    if (typeof value === 'string') {
      value = {title: value};
    }

    $(element).tooltip(value);
  }
  , update: function(element, valueAccessor) {
    var value = valueAccessor();
    var title;

    if (typeof value === 'string') {
      title = value;
    } else {
      title = unwrap(value.title);
    }

    $(element).attr('data-original-title', title).tooltip('fixTitle');
  }
}

ko.bindingHandlers.tooltipEvent = {
  init: function(element, valueAccessor) {
    var emitter = unwrap(valueAccessor());
    emitter.on('show', function() {
      $(element).tooltip('show');
    });
    emitter.on('hide', function() {
      $(element).tooltip('hide');
    });
  }
}

ko.bindingHandlers.popover = {
  init: function(element, valueAccessor) {
    var value = ko.toJS(valueAccessor());
    $(element).popover(value);
  }
  , update: function(element, valueAccessor) {
    $(element).attr('data-original-title', unwrap(valueAccessor().title));
    $(element).attr('data-content', unwrap(valueAccessor().content));
  }
};

ko.extenders.variableName = function(target) {

  target.subscribe(function(newValue) {
    newValue = newValue.replace(/[^A-Za-z0-9]/g, '');
    target(newValue);
  });

  return target;

  // var result = ko.computed({
  //   read: target,
  //   write: function(newValue) {
  //     var current = target();
  //     newValue = newValue.replace(/[^A-Za-z0-9]/g, '');

  //     if (current !== newValue) {
  //       target(newValue);
  //     }
  //   }
  // });

  // result(target());

  // return result;

};

})();

//Copied from http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
/*function objectEquals(x, y){
  var p;
  for(p in y) {
      if(typeof(x[p])=='undefined') {return false;}
  }

  for(p in y) {
      if (y[p]) {
          switch(typeof(y[p])) {
              case 'object':
                  if (!objectEquals(x[p], y[p])) { return false; } break;
              case 'function':
                  if (typeof(x[p])=='undefined' ||
                      (p != 'equals' && y[p].toString() != x[p].toString()))
                      return false;
                  break;
              default:
                  if (y[p] != x[p]) { return false; }
          }
      } else {
          if (x[p])
              return false;
      }
  }

  for(p in x) {
      if(typeof(y[p])=='undefined') {return false;}
  }

  return true;
}*/