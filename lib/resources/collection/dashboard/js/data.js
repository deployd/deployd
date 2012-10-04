/*globals SHIFT_KEYS:false, TEXT_KEYS:false, NUMBER_KEYS:false*/
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
      , editValue: ko.observable()
      , editProp: null
    }

    , propertiesLoaded: ko.observable(false)

    , postbox: new ko.subscribable()

    , view: {
        scrollY: ko.observable(0)
      , scrollX: ko.observable(0)
      , dimensions: ko.observable({})
      , scrollWidth: ko.observable(0)
      , $table: ko.observable()
      , $newRow: ko.observable()
    }
    
  };

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

  vm.view.noOp = function() {
    return true;
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

  vm.view.selectedCellPos = ko.computed(function() {
    var result = {top: 0, left: 0}
      , $cell;
    vm.selectedProp();
    if (vm.selectedRow() === vm.newRow) {
      var $newRow = vm.view.$newRow();
      if (!$newRow) return result;
      result.top = vm.view.dimensions().height - $newRow.outerHeight() - vm.view.scrollWidth();
      $cell = $newRow.find('.highlight');
      var position = $cell.position();
      if (position) result.left = position.left - vm.view.scrollX();
    } else {
      vm.view.scrollY();
      vm.view.scrollX();
      var $table = vm.view.$table();
      if (!$table) return result;
      $cell = $table.find('.highlight');
      if (!$cell.length) return result;
      result = $cell.position();
    }
    return result;
  }).extend({throttle: 1});

  vm.inlineEdit.dismiss = function() {
    setTimeout(function() {
      vm.inlineEdit.editing(false);
      vm.inlineEdit.editProp(vm.inlineEdit.editValue());
    }, 1);    
  };

  vm.inlineEdit.start = function(newVal) {

    vm.inlineEdit.editing(true);
    vm.inlineEdit.editProp = vm.selectedRow()[vm.selectedProp().name];
    if (typeof newVal === 'string' || typeof newVal === 'number') {
      vm.inlineEdit.editValue(newVal);
    }  else {
      vm.inlineEdit.editValue(vm.inlineEdit.editProp());  
      vm.postbox.notifySubscribers(true, 'selectEditor');
    }
    
  };

  vm.inlineEdit.onKeyDown = function(e) {
    if (e.which == 27) { // escape
      vm.inlineEdit.editing(false); //cancel directly, don't apply changes
      return false;
    } else if (e.which == 13) { //enter
      vm.inlineEdit.dismiss();
    }

    return true;
  };

  vm.inlineEdit.focusInput = ko.computed({
    read: function() {
      return vm.inlineEdit.editing();
    },
    write: function() {/*no op*/}
  }, vm.inlineEdit).extend({throttle: 10});

  function createRow(data) {
    var rowVm = {};

    rowVm.id = ko.observable(data.id);
    rowVm._newRow = data._newRow;

    vm.properties().forEach(function(p) {
      var name = p.name;
      rowVm[name] = ko.observable(data[name]);
    });

    rowVm._textFor = function(prop) {
      var val = rowVm[prop.name]();
      if (prop.type === 'boolean') {
        return val ? 'true' : 'false';
      } else if (typeof val === 'undefined' || val === null) {
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


    if (rowVm.id()) {
      vm.properties().forEach(function(p) {
        var name = p.name;
        rowVm[name].subscribe(function(newValue) {
          var body = {};
          body[name] = newValue;
          dpd(resource).put(rowVm.id(), body);
        });
      });
    }
    

    return rowVm;
  }

  var rowMapping = {
    'data': {
      create: function(options) {
        return createRow(options.data);
      }, key: function(data) {
        return ko.utils.unwrapObservable(data.id);
      }
    }
  };

  function bindKeys() {
    $(window).keydown(function(e) {
      var val;
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

      if (e.ctrlKey) return true; // No combos below this point

      if (vm.selectedProp().type === 'string') {
        if (e.shiftKey) val = SHIFT_KEYS[e.which];
        else val = TEXT_KEYS[e.which];

        if (val) {
          vm.inlineEdit.start(val);
          return false;
        } 
      }

      if (vm.selectedProp().type === 'number' && !e.shiftKey) {
        val = NUMBER_KEYS[e.which];

        if (val) {
          vm.inlineEdit.start(val);
          return false;
        }
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
      setTimeout(function() {
        vm.view.scrollToSelected();
      }, 1);
      if (typeof fn === 'function') {
        fn();
      }
    });
  }

  vm.newRow = createRow({_newRow: true});
  vm.selectedRow(vm.newRow);

  ko.applyBindings(vm);


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