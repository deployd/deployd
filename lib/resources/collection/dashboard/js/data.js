(function defineBindings() {
  ko.bindingHandlers.scrollX = {
    init: function(element, valueAccessor) {
      var val = valueAccessor();

      if (typeof val === 'function') {
        $(element).scroll(function() {
          val($(element).scrollLeft());
        });
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

      if (typeof val === 'function') {
        $(element).scroll(function() {
          val($(element).scrollTop());
        });
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
      , bottomRelative = $(window).height() - bottom;

    return {
        top: top
      , left: left
      , bottom: bottom
      , right: right
      , height: height
      , width: width
      , bottomRelative: bottomRelative
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
})();

(function() {

  var ROW_HEIGHT = 39;
  var PAGE_SIZE = 25;

  var resource = Context.resourceId
    , isUser = Context.resourceType === "UserCollection";

  
  var vm = {

      properties: ko.observableArray()
    , data: ko.observableArray()

    , selectedRow: ko.observable()
    , selectedProp: ko.observable()

    , inlineEdit: {
      editing: ko.observable(false)
    }

    , propertiesLoaded: ko.observable(false)

    , view: {
        scrollY: ko.observable(0)
      , scrollX: ko.observable(0)
      , dimensions: ko.observable({})
      , scrollWidth: ko.observable(0)
      , $table: ko.observable()
    }
    
  };

  vm.view.loadSpaceBefore = ko.computed(function() {
    var totalHeight = 0
      , rows = vm.data().length
      , containerHeight = vm.view.dimensions().height - vm.view.scrollWidth(); 

    totalHeight = (rows + 2) * ROW_HEIGHT; 

    if (totalHeight < containerHeight) {
      return containerHeight - totalHeight;
    } else {
      return 0;
    }
  }, vm);

  vm.view.scrollToRow = function(row) {
    var $table = vm.view.$table()
      , rowIndex = vm.data.indexOf(row);

    setTimeout(function() {
      if (rowIndex === -1) {
        rowIndex = vm.data().length - 1;
      }

      if (rowIndex >= 0 && rowIndex < $table.find('tbody tr').length) {
        var $row = $table.find('tbody tr').eq(rowIndex + 1) //account for header-spacer
          , headerHeight = $table.find('thead').outerHeight()
          , top = $row.position().top
          , bottom = top + $row.outerHeight()
          , tableHeight = vm.view.dimensions().height - $table.find('tfoot').outerHeight() - vm.view.scrollWidth()
          , topOffset = top - headerHeight
          , bottomOffset = bottom - tableHeight;

        if (topOffset < 0) {
          vm.view.scrollY(vm.view.scrollY() + topOffset); // Scroll by the amount that it's offscreen
        }

        if (bottomOffset > 0) {
          vm.view.scrollY(vm.view.scrollY() + bottomOffset);
        }
      }
    }, 1);    
      
  };

  vm.view.scrollToColumn = function(prop) {
    var $table = vm.view.$table()
      , index = vm.properties.indexOf(prop)
      , $columns = $table.find('thead th');

    if (index === -1) index = 0;

    if (index >= 0 && index < $columns.length + 2) {
      var $col = $columns.eq(index + 2) // account for margin and id columns
        , left = $col.position().left
        , right = left + $col.outerWidth()

        , marginWidth = $columns.filter('.margin').outerWidth()
        , tableWidth = vm.view.dimensions().width - vm.view.scrollWidth()
        , leftOffset = left - marginWidth
        , rightOffset = right - tableWidth;

        if (rightOffset > 0) {
          vm.view.scrollX(vm.view.scrollX() + rightOffset);
        }

        if (leftOffset < 0) {
          vm.view.scrollX(vm.view.scrollX() + leftOffset);
        }

    }
  };

  vm.view.scrollToSelected = function() {
    vm.view.scrollToRow(vm.selectedRow());
    vm.view.scrollToColumn(vm.selectedProp());
  };

  vm.view.clearSelection = function() {
    if(document.selection && document.selection.empty) {
        document.selection.empty();
    } else if(window.getSelection) {
        var sel = window.getSelection();
        sel.removeAllRanges();
    }
  };

  vm.view.getSelectedCell = function() {
    var $table = vm.view.$table();
    if (!$table) return null;
    return $table.find('td.highlight');
  };

  vm.view.selectedCellX = ko.computed(function() {
    vm.view.scrollX(); //dependent
    vm.selectedProp(); 

    var $cell = vm.view.getSelectedCell();
    if ($cell && $cell.length) {
      return $cell.position().left;
    }  

  }, vm.view).extend({throttle: 1});

  vm.view.selectedCellY = ko.computed(function() {
    vm.view.scrollY(); //dependent
    vm.selectedRow(); 
    
    var $cell = vm.view.getSelectedCell();
    if ($cell && $cell.length) {
      return $cell.position().top;
    }
  }, vm.view).extend({throttle: 1});

  vm.inlineEdit.dismiss = function() {
    vm.inlineEdit.editing(false);
  };

  vm.inlineEdit.start = function() {
    vm.inlineEdit.editing(true);
  };

  vm.inlineEdit.onKeyDown = function(e) {
    if (e.which == 27) { // escape
      vm.inlineEdit.editing(false);
      return false;
    }

    return true;
  };

  function createRow(data) {
    var rowVm = {};

    rowVm.id = data.id;
    rowVm._newRow = data._newRow;

    vm.properties().forEach(function(p) {
      var name = p.name;
      rowVm[name] = ko.observable(data[name]);
    });

    rowVm._textFor = function(prop) {
      var val = rowVm[prop]();
      if (typeof val === 'undefined' || val === null) {
        return '...';
      } else if (typeof val === 'object') {
        return JSON.stringify(val);
      } else {
        return val;
      }
    };

    rowVm._editProp = function(prop, e) {
      vm.view.clearSelection();
      setTimeout(function() {
        if (vm.selectedRow() !== rowVm && vm.selectedProp() !== prop) {
          rowVm._selectCell(prop, e);  
        }
        vm.inlineEdit.start();
      }, 1);
      return false;
    };

    rowVm._selectCell = function(prop) {
      vm.selectedProp(prop);
      vm.selectedRow(rowVm);
    };

    return rowVm;
  }

  var rowMapping = {
    'data': {
      create: function(options) {
        return createRow(options.data);
      }, id: function(data) {
        return ko.utils.unwrapObservable(data.id);
      }
    }
  };

  function bindKeys() {
    $(window).keydown(function(e) {
      var which = e.which;

      if (vm.inlineEdit.editing()) {
        return vm.inlineEdit.onKeyDown(e);
      }

      switch (which) {
        case 38: // up/down arrows
        case 40:
        case 33: // pg up/down
        case 34:
          selectionVertical(e);
          return false;
        case 37: // left/right arrows
        case 39: 
        case 36: // home/end
        case 35:
          selectionHorizontal(e);
          return false;

        case 13: //enter
          vm.selectedRow()._editProp(vm.selectedProp());
          return false;
      }

      return true;
    });

    function selectionVertical(e) {
      var offset = 1;
      var row = vm.selectedRow()
        , data = vm.data()
        , currentIndex = data.indexOf(row)
        , newIndex;

      if (e.which == 33 || e.which == 34 || e.ctrlKey) {
        offset = PAGE_SIZE;
      }

      if (e.which == 38 || e.which == 33) {
        offset *= -1;
      }

      if (row == vm.newRow) {
        currentIndex = data.length;
      }

      if (currentIndex == -1 && offset == -1) {
        newIndex = data.length - 1;
      } else {
        newIndex = currentIndex + offset;
      }
      
      if (newIndex > data.length - 1) {
        vm.selectedRow(vm.newRow);
      } else if (newIndex > data.length - 1)  {
        vm.selectedRow(data[data.length - 1]);
      } else if (newIndex < 0) {
        vm.selectedRow(data[0]);
      } else {
        vm.selectedRow(data[newIndex]);
      } 

      vm.view.scrollToSelected();
    }

    function selectionHorizontal(e) {
      var props = vm.properties()
        , index = props.indexOf(vm.selectedProp());


      if (e.which == 36 || (e.which == 37 && e.ctrlKey)) { // home or ctrl-left
        index = 0;
        if (e.which == 36) vm.view.scrollX(0);  
      } else if (e.which == 37) index -= 1;

      if (e.which == 35 || (e.which == 39 && e.ctrlKey)) { // end or ctrl-right
        index = props.length - 1;
      } else if (e.which == 39) index += 1;    

      if (index <= 0 && props.indexOf(vm.selectedProp()) === 0) {
        vm.view.scrollX(0);  
      } else if (index < props.length && index >= 0) {
        vm.selectedProp(props[index]);
        vm.view.scrollToSelected();
      }
    }
  }

  function loadProperties(fn) {
    dpd('__resources').get(resource, function(res, err) {
      var props = CollectionUtil.propsToArray(res.properties);

      if (isUser) {
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

      vm.properties(props);
      vm.propertiesLoaded(true);

      vm.selectedProp(props[0]);

      if (typeof fn === 'function') {
        fn(props);
      }
    });
  }

  function loadPage(page, fn) {
    dpd(resource).get(/*{$limit: PAGE_SIZE}, */function(res, err) {
      if (err) return;
      ko.mapping.fromJS({data: res}, rowMapping, vm);
      if (typeof fn === 'function') {
        fn();
      }
    });
  }

  vm.newRow = createRow({_newRow: true});
  vm.selectedRow(vm.newRow);

  ko.applyBindings(vm, $('#data')[0]);


  window.vm = vm; // TODO: Remove after dev

  loadProperties(function() {
    loadPage(null, function() {
      setTimeout(function() {
        vm.view.scrollY(ROW_HEIGHT * (vm.data().length + 2));  
        bindKeys();
      }, 1);
    });

    dpd.on(resource + ':changed', function() {
      loadPage();
    });  
  });

})();