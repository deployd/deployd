(function() {

var propertyTemplate = _.template($('#property-template').html())
  , timeouts = {}
  , propertyValues = {}
  , data;

function createForm() {
  var settings = Context.basicDashboard.settings;
  settings.forEach(function(s) {
    var $prop = $(propertyTemplate(s))
      , $input = $prop.find('#prop-' + s.name);

    if (s.type === "checkbox") {
      $input.attr('checked', data[s.name]);
    } else {
      $input.val(data[s.name]);  
    }
    

    propertyValues[s.name] = function() {
      return getValue($input);
    };

    function changeEvent() {
      watchChange(s.name, getValue($input));
    }

    $input.on('input', changeEvent).change(changeEvent);
    $('#save-button-container').before($prop);
  });

  $('#basic-dashboard').show();
  $('#basic-dashboard input').first().focus();
}

function getValue($input) {
  var val = $input.val();
  if ($input.attr('type') === 'checkbox') {
    val = $input.is(':checked');
  } else if ($input.attr('type') === 'number') {
    val = parseInt(val, 10);
  }
  return val;
}

function watchChange(prop, value) {
  $('#save-button').removeAttr('disabled');
  // if (timeouts[prop]) clearTimeout(timeouts[prop]);
  // timeouts[prop] = setTimeout(function() {
  //   change(prop, value);
  // }, 1000);
}

function save() {
  var update = {};
  Object.keys(propertyValues).forEach(function(k) {
    update[k] = propertyValues[k]();
  });
  dpd('__resources').put(Context.resourceId, update, function(res, err) {
    if (err) { ui.error("Error saving", err.message).effect('slide').closable(); }
    ui.notify("Saved").hide(1000).effect('slide');
    $('#save-button').attr('disabled', true);
  });
}

$('#settings-form').submit(function() {
  save();
  return false; 
});

$('#cancel-button').click(function() {
  window.location.reload();
  return false;
});

window.onbeforeunload = function() {
  if (!$('#save-button').attr('disabled')) {
    return "You have unsaved changes to this resource.";
  }
};

dpd('__resources').get(Context.resourceId, function(res, err) {
  data = res;
  createForm();
});

})();