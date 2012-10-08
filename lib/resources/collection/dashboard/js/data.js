/*globals SHIFT_KEYS:false, TEXT_KEYS:false, NUMBER_KEYS:false, alert:false*/
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

    , edit: {
        editingInline: ko.observable(false)
      , editingModal: ko.observable(false)
      , editValue: ko.observable()
      , editProp: null
    }


    , propertiesLoaded: ko.observable(false)

    , undos: ko.observableArray()

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

  vm.edit.isJson = function() {
    var type = vm.selectedProp().type;
    return type === 'object' || type === 'array';
  };

  vm.edit.isEditableInline = function() {
    if (vm.edit.isJson()) return false;

    var type = vm.selectedProp().type;
    var val = vm.selectedRow()[vm.selectedProp().name]();

    if (type === 'string') {
      return !val || val.indexOf('\n') === -1;  
    }

    return true;
  };

  vm.edit.hasChanged = ko.observable(false);
  vm.edit.editValue.subscribe(function(newVal) {
      vm.edit.hasChanged(true);
  });
  

  vm.edit.dismiss = function() {
    setTimeout(function() {
      if (!(vm.edit.editingInline() || vm.edit.editingModal())) return;
      var newVal = vm.edit.editValue();

      var type = vm.selectedProp().type;
      if (type === 'object' || type === 'array') {
        if (newVal.trim() === '') {
          newVal = null;
        } else {
          try {
            newVal = JSON.parse(newVal);
          } catch (ex) {}

          if (type === 'array' && !(newVal instanceof Array)) {
            return alert("Not a valid array");
          } else if (type === 'object' && (typeof newVal !== 'object' || newVal instanceof Array)) {
            return alert("Not a valid object");
          }
        }
      } else if (type === 'boolean') {
        newVal = newVal === 'true' || newVal === true;
      }
      vm.selectedRow()._saveProp(vm.selectedProp(), newVal);
      vm.edit.editingInline(false);
      vm.edit.editingModal(false);
    }, 1);    
  };

  vm.edit.cancel = function() {
    vm.edit.editingInline(false);
    vm.edit.editingModal(false);
  };

  vm.edit.start = function(newVal) {
    if (vm.edit.isEditableInline()) {
      vm.edit.editingInline(true);  
    } else {
      vm.edit.editingModal(true);
    }
    
    vm.edit.editProp = vm.selectedRow()[vm.selectedProp().name];
    if (typeof newVal === 'string' || typeof newVal === 'number') {
      vm.edit.editValue(newVal);
    } else if (vm.selectedProp().type === 'object' || vm.selectedProp().type === 'array') {
      var val = vm.edit.editProp();
      if (val === null || typeof val === 'undefined') {
        val = "";
      } else {
        val = ko.toJSON(vm.edit.editProp(), null, '\t');
      }
      vm.edit.editValue(val);
      
      vm.postbox.notifySubscribers(true, 'selectEditor');
    } else {
      vm.edit.editValue(vm.edit.editProp());  
      vm.postbox.notifySubscribers(true, 'selectEditor');
    }

    if (newVal !== null && typeof newVal === 'undefined') {
      vm.edit.hasChanged(false);
    } else {
      vm.edit.hasChanged(true);
    }
    
  };

  vm.edit.openModal = function() {
    vm.edit.editingInline(false);
    vm.edit.editingModal(true);
    setTimeout(function() {
      vm.postbox.notifySubscribers(true, 'selectEditor');  
    }, 1);
    
  };

  vm.edit.onModalKeyDown = function(e) {
    if (e.which == 13 && e.ctrlKey) { // enter
      vm.edit.dismiss();

      return false;
    }
  };

  vm.edit.onInlineKeyDown = function(e) {
    if (e.which == 27) { // escape
      vm.edit.cancel();
      return false;
    } else if (e.which == 13) { // enter
      if (vm.selectedProp().type === 'string' && (e.ctrlKey || !vm.edit.hasChanged())) {
        vm.edit.openModal();
      } else {
        vm.edit.dismiss();
      }
      
    } else if (e.which == 9) { // tab
      var props = vm.properties();
      var index = props.indexOf(vm.selectedProp());
      if (e.shiftKey) index -= 1;
      else index += 1;

      if (props[index]) {
        vm.edit.dismiss();
        setTimeout(function() {
          vm.selectedProp(props[index]);
          if (vm.edit.isEditableInline()) {
            vm.edit.start();  
          }
        }, 2);  
      }
      return false;
    }

    return true;
  };

  vm.edit.focusInput = ko.computed({
    read: function() {
      return vm.edit.editingInline();
    },
    write: function() {/*no op*/}
  }, vm.edit).extend({throttle: 1});

  vm.edit.focusModal = ko.computed({
    read: function() {
      return vm.edit.editingModal();
    },
    write: function() {/*no op*/}
  }, vm.edit).extend({throttle: 1});

  function createRow(data) {
    var rowVm = {};

    rowVm.id = ko.observable(data.id);

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
        return ko.toJSON(val);
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
        vm.edit.start();
      }, 1);
      return false;
    };

    rowVm._selectCell = function(prop) {
      vm.selectedProp(prop);
      vm.selectedRow(rowVm);
    };

    rowVm._deleteRow = function() {
      if (rowVm.id()) {
        var index = vm.data.indexOf(rowVm);
        dpd(resource).del(rowVm.id(), function(res, err) {
          if (err) return showError("Error deleting row", err);
          vm.data.remove(rowVm);
          var data = vm.data();
          if (index >= data.length) index = data.length - 1;
          if (index < 0) index = 0;
          vm.selectedRow(vm.data()[index]);

          var undo = createUndo("Deleted row", function() {
            var data = rowVm._toJS();
            delete data.id; //TODO: Should be able to POST the id
            dpd(resource).post(data, function(res, err) {
              if (err) {
                showError("Error restoring row", err);
                vm.undos.push(undo);
              }

              var row = createRow(res);
              vm.data.push(row);
              vm.selectedRow(row);
              setTimeout(function() {
                vm.scrollToRow(row);
              }, 1);
            });
          }, true);
        });
      }
    };

    rowVm._toJS = function() {
      var data = {id: rowVm.id()};
      var props = vm.properties();
      props.forEach(function(p) {
        data[p.name] = rowVm[p.name]();
      });
      return data;
    };

    rowVm._saveProp = function(prop, value, dontNotify) {
      var name = prop.name
        , body = {}
        , lastValue = rowVm[name]();

      if (lastValue !== value) {
        rowVm[name](value);

        if (rowVm.id()) {
          if (!dontNotify) {
            createUndo("Changed " + vm.selectedProp().name, function() {
              rowVm._saveProp(prop, lastValue, true);
              vm.selectedProp(prop);
              vm.selectedRow(rowVm);
            });    
          }
          body[name] = value;
          dpd(resource).put(rowVm.id(), body);
        } else {
          rowVm._save();
        }
      }
    };
    

    return rowVm;
  }

  function createNewRow() {
    var rowVm = createRow({})
      , props = vm.properties();
    rowVm._newRow = true;

    rowVm._isValid = ko.computed(function() {
      var props = vm.properties();
      for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        var val = rowVm[prop.name]();
        if (!(val === null || typeof val === 'undefined' || val === false || val === '')) {
          return true;
        }
      }
      return false;
    });

    rowVm._save = function() {
      if (!rowVm._isValid()) return false;
      var data = rowVm._toJS();
      var props = vm.properties();
      dpd(resource).post(data, function(res, err) {
        if (err) throw err;
        var row = createRow(res);
        vm.data.push(row);

        setTimeout(function() {
          vm.view.scrollToRow(row);
          props.forEach(function(p) {
            rowVm[p.name](null);
          });
          if (vm.selectedRow() === vm.newRow) vm.selectedProp(props[0]);
        }, 1);
      });
    };

    var lastProp = props[props.length - 1];
    if (lastProp) {
      rowVm[lastProp.name].subscribe(function(newValue) {
        if (newValue && rowVm._isValid()) {
          rowVm._save();
        }
      }, rowVm);
    }
    
    return rowVm;
  }

  function createUndo(name, fn, important) {
    var undo = {
      name: name
    };

    var reverse = function() {
      fn();
      vm.undos.remove(undo);
    };
    undo.reverse = reverse;

    vm.undos.push(undo);
    if (important) {
      var notification = ui.notify(name, $('<a href="#">Undo</a>').click(function() {
        reverse();
        notification.hide();
      })).effect('slide').closable();
    } else {
      if (!$('#notifications li').length) ui.notify(name).hide(1000).effect('slide');
    }

    return undo;
  }

  function showError(message, error) {
    var errorMessage = error;
    if (typeof error === 'object') {
      if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = null;
      }
    }
    return ui.error(message, errorMessage).sticky().effect('slide');
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
      var val
        , which = e.which
        , $focus = $(':focus');

      if ($focus.length && !$focus.parents('#data').length) {
        return true;
      }

      if (e.which === 83 && (e.ctrlKey || e.metaKey)) { //ctrl-s 
        vm.edit.dismiss();
        if (vm.selectedRow() === vm.newRow) {
          setTimeout(function() {
            vm.newRow._save();
          }, 10);
        }

        return false;
      }

      if (vm.edit.editingModal()) {
        return vm.edit.onModalKeyDown(e);
      }

      if (vm.edit.editingInline()) {
        return vm.edit.onInlineKeyDown(e);
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
        case 9:
          selectionHorizontal(e);
          return false;

        case 90: // z
          if (e.ctrlKey || e.metaKey) {
            var undos = vm.undos();
            if (undos.length) {
              undos[undos.length - 1].reverse();
            }
            return false; 
          }
          break;

        case 46: //delete
          if (e.ctrlKey) {
            vm.selectedRow()._deleteRow();
            return false;
          }
          /* falls through */
        case 8: // backspace
          vm.edit.start("");
          break;

        case 13: //enter
          if (vm.selectedRow() === vm.newRow && e.ctrlKey) {
            if (vm.newRow && vm.newRow._isValid()) vm.newRow._save();
          } else {
            vm.selectedRow()._editProp(vm.selectedProp());  
          }
          return false;
      }

      if (e.ctrlKey) return true; // No combos below this point

      if (vm.selectedProp().type === 'string') {
        if (e.shiftKey) val = SHIFT_KEYS[e.which];
        else val = TEXT_KEYS[e.which];

        if (val) {
          vm.edit.start(val);
          return false;
        } 
      }

      if (vm.selectedProp().type === 'number' && !e.shiftKey) {
        val = NUMBER_KEYS[e.which];

        if (val) {
          vm.edit.start(val);
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
      } else if (e.which == 37 || (e.which == 9 && e.shiftKey)) index -= 1;

      if (e.which == 35 || (e.which == 39 && e.ctrlKey)) { // end or ctrl-right
        index = props.length - 1;
      } else if (e.which == 39 || (e.which == 9 && !e.shiftKey)) index += 1;    

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

      if (!props.length) return fn();

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
      

      vm.selectedProp(props[0]);

      if (typeof fn === 'function') {
        fn(props);
      }

      vm.propertiesLoaded(true);
    });
  }

  function loadPage(page, fn) {
    dpd(resource).get(/*{$limit: PAGE_SIZE}, */function(res, err) {
      if (err) return;
      ko.mapping.fromJS({data: res}, rowMapping, vm);
      if (vm.selectedRow() !== vm.newRow && vm.data().indexOf(vm.selectedRow()) === -1) {
        vm.selectedRow(null);
      }
      if (typeof fn === 'function') {
        fn();
      }
    });
  }

  

  loadProperties(function(props) {
    if (props) {
      ko.applyBindings(vm);
      vm.newRow = createNewRow();
      vm.selectedRow(vm.newRow);

      loadPage(null, function() {
        setTimeout(function() {
          vm.view.scrollY(ROW_HEIGHT * (vm.data().length + 2));  
          bindKeys();
        }, 1);
      });

      dpd.on(resource + ':changed', function() {
        loadPage();
      });  
    } else {
      $('#no-property-warning').show();
      $('#table-container').hide();
    }
    
  });

})();