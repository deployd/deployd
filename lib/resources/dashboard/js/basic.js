(function() {

var propertyTemplate = _.template($('#property-template').html())
  , timeouts = {}
  , data;

function createForm() {
  var settings = Context.basicDashboard.settings;
  settings.forEach(function(s) {
    var $prop = $(propertyTemplate(s))
      , $input = $prop.find('#prop-' + s.name);

    $input.val(data[s.name]);

    function changeEvent() {
      watchChange(s.name, $input.val());
    }

    $input.on('input', changeEvent).change(changeEvent);
    $('#settings-form').append($prop);
  });

  $('#basic-dashboard').show();
  $('#basic-dashboard input').first().focus();
}

function watchChange(prop, value) {
  if (timeouts[prop]) clearTimeout(timeouts[prop]);
  timeouts[prop] = setTimeout(function() {
    change(prop, value);
  }, 1000);
}

function change(prop, value) {
  var update = {};
  update[prop] = value;
  dpd('__resources').put(Context.resourceId, update, function(res, err) {
    if (err) { ui.error("Error saving " + prop, err.message).effect('slide').closable(); }
    ui.notify("Saved " + prop).hide(1000).effect('slide');
  });
}

dpd('__resources').get(Context.resourceId, function(res, err) {
  data = res;
  createForm();
});

})();