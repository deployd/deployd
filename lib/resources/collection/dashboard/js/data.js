/*globals SHIFT_KEYS:false, TEXT_KEYS:false, NUMBER_KEYS:false, alert:false*/
(function() {

  var ROW_HEIGHT = 39;
  var PAGE_SIZE = 30;

  var resource = Context.resourceId
    , isUser = Context.resourceType === "UserCollection";

  
  var vm = {

      properties: ko.observableArray()
    , data: ko.observableArray()
    , count: ko.observable(0)
    , currentPage: ko.observable(0)

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

    , fadeInRows: ko.observableArray()

    , view: {
        init: ko.observable(false)
      , scrollY: ko.observable(0)
      , scrollX: ko.observable(0)
      , dimensions: ko.observable({})
      , scrollWidth: ko.observable(0)
      , $table: ko.observable()
      , $newRow: ko.observable()
    }
    
  };

  vm.totalCount = ko.computed(function() {
    return Math.max(vm.count(), vm.data().length);
  }, vm);

  vm.view.scrollToRow = function(row, fn) {
    var rowId = row;
    if (typeof row === 'object') rowId = row.id();
    
    setTimeout(function() {
      var $table = vm.view.$table()
        , currentRow = getRowById(rowId)
        , rowIndex = vm.data.indexOf(currentRow);

      if (rowIndex === -1) {
        dpd(resource).get('index-of', rowId, function(res) {
          var index = res.index
            , page = Math.floor(index / PAGE_SIZE);
          if (index == -1) return;
          loadPage(page, function() {
            vm.view.scrollToRow(row, fn);
          });
        });
        return;
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

      if (typeof fn === 'function') {
        fn(currentRow);
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
      var topVisiblePage = Math.max(vm.currentPage() - 1, 0);
      var rowsAbove = topVisiblePage * PAGE_SIZE;
      return rowsAbove * ROW_HEIGHT;
    }
  }, vm.view);

  vm.view.loadSpaceAfter = ko.computed(function() {
    var totalSize = vm.totalCount()*ROW_HEIGHT
      , dataHeight = vm.data().length*ROW_HEIGHT
      , space = totalSize - dataHeight;

    return Math.max(0, space - vm.view.loadSpaceBefore());
  }, vm.view);

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

  ko.computed(function scrollPages() {
    var page = Math.floor(vm.view.scrollY() / ROW_HEIGHT / PAGE_SIZE);
    if (page != vm.currentPage()) {
      loadPage(page);
    }
  }, vm.view).extend({throttle: 150});

  vm.edit.isJson = function() {
    var type = vm.selectedProp().type;
    return type === 'object' || type === 'array';
  };

  vm.edit.isEditableInline = function() {
    if (vm.edit.isJson()) return false;

    var type = vm.selectedProp().type;
    var val = vm.selectedRow()[vm.selectedProp().name]();

    if (type === 'string') {
      return !val || val.toString().indexOf('\n') === -1;  
    }

    return true;
  };

  vm.edit.isEditableModal = function() {
    var type = vm.selectedProp().type;
    return vm.edit.isJson() || type === 'string';
  };

  vm.edit.hasChanged = ko.observable(false);
  vm.edit.editValue.subscribe(function(newVal) {
      vm.edit.hasChanged(true);
  });
  

  vm.edit.dismiss = function(saveOptions) {
    saveOptions = saveOptions || {};
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
      vm.selectedRow()._saveProp(vm.selectedProp(), newVal, saveOptions);
      vm.edit.editingInline(false);
      vm.edit.editingModal(false);
    }, 1);    
  };

  vm.edit.cancel = function() {
    vm.edit.editingInline(false);
    vm.edit.editingModal(false);
  };

  vm.edit.start = function(newVal, options) {
    options = options || {};
    if (vm.edit.isEditableInline() && !options.modal) {
      vm.edit.editingInline(true);  
    } else {
      vm.edit.editingModal(true);
    }
    var editType = vm.selectedProp().type;

    vm.edit.editValue("");
    
    setTimeout(function() {
      vm.edit.editProp = vm.selectedRow()[vm.selectedProp().name];
      if (typeof newVal === 'string' || typeof newVal === 'number') {
        vm.edit.editValue(newVal);
      } else if (editType === 'object' || editType === 'array') {
        var val = vm.edit.editProp();
        if (val === null || typeof val === 'undefined') {
          val = "";
        } else {
          val = ko.toJSON(vm.edit.editProp(), null, '\t');
        }
        vm.edit.editValue(val);
        
        vm.postbox.notifySubscribers(true, 'selectEditor');
      } else {
        var editPropValue = vm.edit.editProp();
        if (editType === 'string' && !editPropValue) editPropValue = "";
        if (editType === 'number' && !editPropValue) editPropValue = 0;
        vm.edit.editValue(editPropValue);  
        vm.postbox.notifySubscribers(true, 'selectEditor');
      }

      if (newVal !== null && typeof newVal === 'undefined') {
        vm.edit.hasChanged(false);
      } else {
        vm.edit.hasChanged(true);
      }
    }, 1); 
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
      if (vm.selectedProp().type === 'string' && e.ctrlKey) {
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
        vm.edit.dismiss({dontSave: true});
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

  vm.edit.typeahead = ko.computed(function() {
    var prop = vm.selectedProp();
    if (!prop) return [];

    return vm.data().map(function(d) {
      return d[prop.name]();
    }).filter(function(d) {
      return d && typeof d === 'string' && d.indexOf('\n') === -1;
    }).reduce(function(prev, curr) {
      if (prev.indexOf(curr) === -1) {
        prev.push(curr);
      }

      return prev;
    }, []);
  }, vm.edit);

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
      } else if (typeof val === 'undefined' || val === null || val === '') {
        return '...';
      } else if (typeof val === 'object') {
        return ko.toJSON(val);
      } else {
        return val;
      }
    };

    rowVm._editProp = function(prop, options) {
      options = options || {};
      vm.view.clearSelection();
      setTimeout(function() {
        if (vm.selectedRow() !== rowVm && vm.selectedProp() !== prop) {
          rowVm._selectCell(prop);
        }
        vm.edit.start(null, options);
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
        dpd(resource).del(rowVm.id(), {$skipEvents: true}, function(res, err) {
          if (err) return showError("Error deleting row", err);
          vm.data.remove(rowVm);
          var data = vm.data();
          if (index >= data.length) index = data.length - 1;
          if (index < 0) index = 0;
          vm.selectedRow(vm.data()[index]);

          var undo = createUndo("Deleted row", function() {
            var data = rowVm._toJS();
            delete data.id; //TODO: Should be able to POST the id
            postRow(data, function(row, err) {
              if (err) {
                showError("Error restoring row", err);
                vm.undos.push(undo);
              } else {
                vm.selectedRow(row);
              }
            });
          });
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

    rowVm._saveProp = function(prop, value, options) {
      var name = prop.name
        , body = {}
        , lastValue = rowVm[name]();

      options = options || {};

      if (lastValue !== value) {
        rowVm[name](value);

        if (rowVm.id()) {
          
          body[name] = value;
          body.$skipEvents = true;
          dpd(resource).put(rowVm.id(), body, function(res, err) {
            if (err) {
              showError("Error updating row", err);
              rowVm[name](lastValue);
            }
            if (!options.dontNotify) {
              createUndo("Changed " + vm.selectedProp().name, function() {
                rowVm._saveProp(prop, lastValue, {dontNotify: true});
                vm.selectedProp(prop);
                vm.selectedRow(rowVm);
              });    
            }
            
          });
        } else if (!options.dontSave) {
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
      postRow(data, function(res, err) {
        if (err) {
          return showError("Could not save row", err);
        }
        props.forEach(function(p) {
          rowVm[p.name](null);
        });
      });
    };
    
    return rowVm;
  }

  function postRow(data, fn) {
    data.$skipEvents = true;
    dpd(resource).post(data, function(res, err) {
      if (err) return fn(null, err);
      vm.fadeInRows.push(getRowById(res.id)); //In case it's already there
      vm.view.scrollToRow(res.id, function(row) {
        vm.fadeInRows.push(row);
        if (typeof fn === 'function') {
          fn(row);  
        }
      });
    });
  }

  function getRowById(id) {
    return vm.data().filter(function(d) {return d.id() === id})[0];
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
      } else if (error.errors) {
        errorMessage = $("<div>" + Object.keys(error.errors).map(function(k) {
          return k + ": " + error.errors[k];
        }).join('<br />') + "</div>");
      } else {
        errorMessage = undefined;
      }
    }
    return ui.error(message, errorMessage).hide(2000).closable().effect('slide');
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
        case 8: // backspace
          if (e.ctrlKey) {
            vm.selectedRow()._deleteRow();
            return false;
          }
        
          vm.edit.start("");
          return false;

        case 13: //enter
          if (e.ctrlKey && vm.edit.isEditableModal()) {
            vm.selectedRow()._editProp(vm.selectedProp(), {modal: true});  
          } else {
            vm.selectedRow()._editProp(vm.selectedProp());  
          }
          return false;

        case 27: // escape
          vm.selectedRow(vm.newRow);
          return false;
      }

      if (e.ctrlKey || e.metaKey) return true; // No combos below this point

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
      
      if (newIndex > data.length - 1 && vm.currentPage() >= getLastPage() - 1) {
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

      if (isUser) {
        props.unshift({
            name: 'username'
          , type: 'string'
          , typeLabel: 'string'
        }, {
            name: 'password'
          , type: 'string'
          , typeLabel: 'password'
        });
      }

      if (!props.length) return fn();

      vm.properties(props);
      

      vm.selectedProp(props[0]);

      if (typeof fn === 'function') {
        fn(props);
      }

      vm.propertiesLoaded(true);
    });
  }

  function loadCount(fn) {
    dpd(resource).get('count', function(res) { 
      vm.count(res.count);
      if (typeof fn === 'function') {
        fn();
      }
    });
  }

  function loadPage(page, fn) {
    if (typeof page === 'undefined') {
      page = vm.currentPage();  
    }

    // Show three pages at a time
    var begin = page - 1;
    begin = Math.max(0, Math.min(begin, getLastPage() - 1));

    dpd(resource).get({$skip: begin*PAGE_SIZE, $limit: PAGE_SIZE*3, $skipEvents: true}, function(res, err) {
      if (err) return;
      vm.currentPage(page);
      ko.mapping.fromJS({data: res}, rowMapping, vm);
      if (vm.selectedRow() !== vm.newRow && vm.data().indexOf(vm.selectedRow()) === -1) {
        var newMappedRow = vm.data().filter(function(d) {return vm.selectedRow() && d.id() === vm.selectedRow().id();})[0];
        if (newMappedRow) vm.selectedRow(newMappedRow);
      }
      if (typeof fn === 'function') {
        fn();
      }
    });
  }

  vm.loadPage = loadPage;



  loadProperties(function(props) {
    $('#data').css('visibility', 'visible');
    if (props) {
      ko.applyBindings(vm);
      vm.newRow = createNewRow();
      vm.selectedRow(vm.newRow);
      window.vm = vm;
      vm.view.init(true);

      loadCount(function() {
        loadPage(getLastPage(), function() {
          setTimeout(function() {
            var bottomRow = ROW_HEIGHT * (vm.totalCount() + 2)
              , height = vm.view.dimensions().height - vm.view.scrollWidth()
              , scrollAmount = bottomRow - height;
            if (scrollAmount > 0) vm.view.scrollY(scrollAmount);  
            bindKeys();
          }, 50);
        });
      });

      dpd.on(resource + ':changed', function() {
        loadPage();
        loadCount();
      });  
    } else {
      $('#no-property-warning').show();
      $('#table-container').hide();
    }
    
  });

  function getLastPage() {
    return Math.floor(vm.totalCount() / PAGE_SIZE);
  }

})();