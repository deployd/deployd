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
};

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
};

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

};

ko.bindingHandlers.scrollX = {
  init: function(element, valueAccessor) {
    var val = valueAccessor();

    function update() {
      val($(element).scrollLeft());
    }

    if (typeof val === 'function') {
      $(element).scroll(update);
      $(window).resize(update);
    }
  },
  update: function(element, valueAccessor) {
    var val = ko.utils.unwrapObservable(valueAccessor());
    if ($(element).scrollLeft() !== val) {
      $(element).scrollLeft(val);  
    }
  }
};

ko.bindingHandlers.scrollY = {
  init: function(element, valueAccessor) {
    var val = valueAccessor();

    function update() {
      val($(element).scrollTop());
    }

    if (typeof val === 'function') {
      $(element).scroll(update);
      $(window).resize(update);

      setTimeout(function() {
        update();
      }, 50);
    }
  },
  update: function(element, valueAccessor) {
    var val = ko.utils.unwrapObservable(valueAccessor());
    if ($(element).scrollTop() !== val) {
      $(element).scrollTop(val);  
    }
  }
};

ko.bindingHandlers.screenDimensions = {
  init: function(element, valueAccessor, allBindingsAccessor) {
    var val = valueAccessor()
      , allBindings = allBindingsAccessor();

    var calc = function() {
      val(calculateScreenDimensions(element));
    };
    calc();
    $(document).ready(calc);
    $(window).scroll(calc).resize(calc);

    if (allBindings.reflow && allBindings.reflow.subscribe) {
      allBindings.reflow.subscribe(function() {
        setTimeout(calc, 1);
      });
    }
  }
};

function calculateScreenDimensions(element) {
  var $element = $(element)
    , $window = $(window)
    , top = $element.offset().top - $window.scrollTop()
    , left = $element.offset().left - $window.scrollLeft()
    , height = $element.height()
    , width = $element.width()
    , bottom = top + height
    , right = left + width
    , bottomRelative = $(window).height() - bottom
    , rightRelative = $(window).width() - right;

  return {
      top: top
    , left: left
    , bottom: bottom
    , right: right
    , height: height
    , width: width
    , bottomRelative: bottomRelative
    , rightRelative: rightRelative
  };
}

ko.bindingHandlers.scrollbarWidth = {
  init: function(el, valueAccessor) {
    var $el = $(el)
      , val = valueAccessor()
      , $container = $('<div>')
      , $inner = $('<div>');

    $container.css({
        position: 'relative'
      , height: '100px'
      , 'overflow-y': 'scroll'
    });

    $inner.css({
        position: 'absolute'
      , top: 0
      , left: 0
      , bottom: 0
      , right: 0
    });

    $container.append($inner);
    $el.prepend($container);

    var containerWidth = $container.width();
    var innerWidth = $inner.width();

    $container.remove();

    val(containerWidth - innerWidth);
  }
};

ko.bindingHandlers.element = {
  init: function(element, valueAccessor) {
    var val = valueAccessor();
    val($(element));
  }
};

ko.bindingHandlers.numberValue = {
  init: function(element, valueAccessor, allBindingsAccessor, vm) {
    var prop = valueAccessor()
      , allBindings = allBindingsAccessor()
      , updateMode = allBindings.valueUpdate || 'blur';

    $(element).val(ko.utils.unwrapObservable(prop));

    if (typeof prop === 'function') {

      if (updateMode === 'afterkeydown') {

        $(element).on('keydown', function(e) {
          var num = parseFloat($(element).val());
          if (isNaN(num)) return;

          if (e.which == 38) { // up 
            prop(num + 1);
            return false;
          } else if (e.which == 40) { // down
            prop(num - 1);
            return false;
          }

          setTimeout(function() {
            setNumberProp(element, prop);  
          }, 0);
        });
      }

      $(element).blur(function() {
        setNumberProp(element, prop);
      });

      
    }
  }, update: function(element, valueAccessor) {
    var newVal = ko.utils.unwrapObservable(valueAccessor());
    if (!newVal || newVal.toString() !== $(element).val()) {
      $(element).val(newVal);  
    }
  }
};

function setNumberProp(element, prop) {
  var num = parseFloat($(element).val());
  if (!isNaN(num)) prop(num);
}

ko.bindingHandlers.select = {
  init: function(element, valueAccessor, allBindingsAccessor, vm) {
    var postbox = vm.postbox || allBindingsAccessor().postbox;
    if (!postbox) throw new Error("viewmodel must have a postbox to use select");

    var selectEvent = valueAccessor();
    postbox.subscribe(function() {
      $(element).select();  
    }, vm, selectEvent);
  }
};

ko.bindingHandlers.bootstrapModal = {
  init: function(element, valueAccessor, allBindingsAccessor) {
    var value = valueAccessor();
    var allBindings = allBindingsAccessor();
    var options = allBindings.modalOptions || {};

    options.show = false;

    $(element).modal(options);

    if (typeof value === 'function') {
      $(element).on('shown', function() {
        if (!value()) {
          value(true);
        }
      });
      $(element).on('hidden', function() {
        if (value()) {
          value(false);
        }
      });  
    }
    
  }, update: function(element, valueAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());

    if (value) {
      $('.modal-backdrop').remove();
      $(element).modal('show');
    } else {
      $(element).modal('hide');
    }
  }
};

ko.bindingHandlers.aceEditor = {
  init: function(element, valueAccessor) {
    var editor = ace.edit(element)
      , val = valueAccessor();
    $(element).data('aceEditor', editor);

    editor.getSession().on('change', function(e) {
        var newVal = editor.getValue();
        if (newVal !== val()) {
          val(newVal);  
        }
    });
  }, update: function(element, valueAccessor) {
    var editor = $(element).data('aceEditor')
      , val = ko.utils.unwrapObservable(valueAccessor());

    if (typeof val === 'undefined' || val === null) {
      val = "";
    } else if (typeof val !== 'string') {
      val = val.toString(); 
    }
    

    if (val !== editor.getValue()) {
      editor.setValue(val);
    }
  }
};

ko.bindingHandlers.aceEditorResize = {
  update: function(element, valueAccessor) {
    var editor = $(element).data('aceEditor')
      , val = ko.utils.unwrapObservable(valueAccessor);

    if (val) {
      setTimeout(function() {
        editor.resize();  
      }, 5);
    }
  }
};

ko.bindingHandlers.aceEditorFocus = {
  update: function(element, valueAccessor) {
    var editor = $(element).data('aceEditor')
      , val = ko.utils.unwrapObservable(valueAccessor());

    setTimeout(function() {
      if (val) {      
        editor.focus();  
      } else {
        editor.blur();
      }
    }, 5);
  }
};

ko.bindingHandlers.aceEditorSelect = {
  init: function(element, valueAccessor, allBindingsAccessor, vm) {
    var postbox = vm.postbox || allBindingsAccessor().postbox;
    if (!postbox) throw new Error("viewmodel must have a postbox to use select");

    var selectEvent = valueAccessor();
    postbox.subscribe(function() {
       var editor = $(element).data('aceEditor');
       if (editor) editor.clearSelection();
    }, vm, selectEvent);
  }
};


ko.bindingHandlers.aceEditorOptions = {
  update: function(element, valueAccessor) {
    var editor = $(element).data('aceEditor');
    var options = valueAccessor();

    var mode = ko.utils.unwrapObservable(options.mode);
    editor.getSession().setMode("ace/mode/" + mode);
  }
};

ko.bindingHandlers.typeahead = {
  update: function(element, valueAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
    if (window.typeahead) {
      $(element).typeahead({source: value});  
    } else {
      $(element).typeahead({source: []});  
    }
  }
};

ko.bindingHandlers.fadeInRow = {
  update: function(element, valueAccessor, allBindingsAccessor, vm) {
    var rows = valueAccessor();
    if (rows.indexOf(vm) !== -1 && !$(element).is('.newRow')) {
      $(element).addClass('new-row');
      
      setTimeout(function() {
        $(element).removeClass('new-row');
        rows.remove(vm);
      }, 100);
    }
  }
};

})();
