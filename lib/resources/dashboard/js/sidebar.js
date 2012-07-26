(function() {
  var key = $.cookie('DpdSshKey');
  $.ajaxSetup({
    headers: {
      'dpd-ssh-key': key || true
    }
  });
})();

$(document).ready(function() {
  var resourceSidebarTemplate = _.template($('#resource-sidebar-template').html())
    , resourceTypesTemplate = _.template($('#resource-types-template').html())
    , resources
    , resourceTypes
    , resourceMenu = ui.menu()
    , currentMenuResource = null;

  
  setupResourceMenu();
  loadResourceTypes();
  loadResources();

  $('#resource-types').on('click', 'a', function() {
    createResource($(this).attr('data-id'));
  });

  function loadResourceTypes() {
    dpd('__resources').get('types', function(res, err) {
      var types = Object.keys(res).reduce(function(prevValue, curValue) {
        res[curValue].id = curValue;
        prevValue.push(res[curValue]);
        return prevValue;
      }, []);
      resourceTypes = res;
      $('#resource-types').html(resourceTypesTemplate({types: types}));
      renderSidebar();
    });
  }
  
  function setupResourceMenu(argument) {
    resourceMenu.add('Rename', function() {
      renameResource(currentMenuResource);
    });
    
    resourceMenu.add('Delete', function() {
      deleteResource(currentMenuResource);
    });
  }

  function loadResources() {
    dpd('__resources').get(function(res, err) {
      resources = res;
      renderSidebar();
    });
  }

  function renderSidebar() {
    if (!resourceTypes || !resources) return;

    var $sidebar = $('#resource-sidebar').empty();

    if (resources.length) {
      $('#resources-empty').hide();
      resources.forEach(function(resource) {
        var $el = $(resourceSidebarTemplate({resource: resource, types: resourceTypes}));

        function showContextMenu(e) {
          var $options = $el.find('.options')
            , pos = $options.offset();
          currentMenuResource = resource;
          resourceMenu.moveTo(pos.left + $options.width(), pos.top + $options.height()).show();
          e.preventDefault();
        }

        $el.find('.pages-header').click(function() {
          $el.find('.pages').slideToggle(200);
          return false;
        })

        $el.find('.options').click(function(e) {
          showContextMenu(e);
          return false;
        });
        $el.on('contextmenu', function(e) {
          showContextMenu(e);
          return false;
        });
        $el.appendTo($sidebar);
      });
    } else {
      $('#resources-empty').show();
    }
  }

  function createResource(typeId) {
    var type = resourceTypes[typeId];
    pathDialog("Create", "Create New " + (type.label || type.id), type.defaultPath, function(path) {
      dpd('__resources').post({
          type: typeId
        , path: path
      }, function(res, err) {
        if (err) { return showError(err, "Could not create resource"); }
        location.href = "/dashboard" + path;
      });
    });
  }

  function deleteResource(resource) {
    ui.confirm("Delete " + resource.id + "?", "This cannot be undone!")
      .ok("Delete")
      .cancel("cancel")
      .show(function(ok) {
        if (ok) {
          dpd('__resources').del(resource.id, function(res, err) {
            if (err) { return showError(err, "Could not delete resource"); }
            loadResources();
            //TODO: If you just deleted the current resource, redirect to dashboard home
          });
        }
      });
  }

  function renameResource(resource) {
    pathDialog("Rename", "Rename " + resource.id, resource.path, function(newPath) {
      resource.$renameFrom = resource.path;
      resource.path = newPath;
      dpd('__resources').put(resource.id, resource, function(res, err) {
        if (err) { return showError(err, "Could not rename resource"); }
        loadResources();
        //TODO: If you just renamed the current resource, redirect to its new dashboard
      });
    });
  }

  function pathDialog(verb, title, defaultValue, fn) {
    var $input = $('<input type="text" />').val(defaultValue)
      , confirm;
    confirm = ui.confirm(title, $input)
      .ok(verb)
      .cancel("cancel")
      .show(function(ok) {
        if (ok) fn($input.val());
      });
    $input.on('keypress', function(e) {
      setTimeout(function() {
        $input.val(sanitizeResourcePath($input.val()));  
        if (e.which == 13) {
          fn($input.val());
          confirm.hide();
        }
      }, 1);
    });
    setTimeout(function() {$input.focus();}, 1);
  }

  function sanitizeResourcePath(path) {
    path = path.toLowerCase().replace(/[ _]/g, '-').replace(/[^a-z0-9\/\-]/g, '');
    if (path.indexOf('/') !== 0) {
      path = '/' + path;
    }
    return path;
  }

  function showError(err, message) {
    var errMessage = err && err.message;
    ui.error(message, errMessage).sticky();
  }
});