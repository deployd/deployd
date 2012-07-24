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

  loadResources();

  dpd('__resources').get('types', function(res, err) {
    var types = Object.keys(res).reduce(function(prevValue, curValue) {
      prevValue.push(res[curValue]);
      return prevValue;
    }, []);
    $('#resource-types').html(resourceTypesTemplate({types: types}));
  });

  $('#resource-sidebar').on('click', '.options', function(e) {
    e.preventDefault();
    var menu = ui.menu()
      .add('Rename')
      .add('Delete');

    menu.moveTo(e.pageX, e.pageY).show();

    return false;
  });

  function loadResources() {
    dpd('__resources').get(function(res, err) {
      renderSidebar(res);
    });
  }

  function renderSidebar(resources) {
    var $sidebar = $('#resource-sidebar').empty();

    resources.forEach(function(resource) {
      var $el = $(resourceSidebarTemplate({resource: resource}))
        , menu = ui.menu();
      $el.appendTo($sidebar);
    });
  }
});