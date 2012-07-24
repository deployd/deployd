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

  dpd('__resources').get(function(res, err) {
    $('#resource-sidebar').html(resourceSidebarTemplate({resources: res}));
  });

  dpd('__resources').get('types', function(res, err) {
    var types = Object.keys(res).reduce(function(prevValue, curValue) {
      prevValue.push(res[curValue]);
      return prevValue;
    }, []);
    $('#resource-types').html(resourceTypesTemplate({types: types}));
  });
});