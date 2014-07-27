(function() {

var settings
  , editor
  , timeout;

dpd('__resources').get(Context.resourceId, function(res, err) {
  if (res) {
    settings = res;

    var json = _.extend({}, res);

    delete json.type;
    delete json.id;

    json = JSON.stringify(json, null, '\t');
    editor = ace.edit('settings');
    editor.setTheme("ace/theme/deployd");
    editor.session.setMode("ace/mode/json");
    editor.setShowPrintMargin(false);
    editor.getSession().setValue(json);
    editor.getSession().on('change', function() { trackUpdate() } );
    editor.commands.addCommand({
      name: "save",
      bindKey: {win: "Ctrl-S", mac: "Command-S"},
      exec: function(editor) {
        update(true);
      }
    });
    $('#default-editor').show();
  }
});

function trackUpdate(name, editor) {
  if (timeout) {
    clearTimeout(timeout);
  }

  timeout = setTimeout(function() {
    update();
    timeout = undefined;
  }, 1000);
}

function update(showError) {
  if (timeout) {
    clearTimeout(timeout);
    timeout = undefined;
  }
  try {
    var newSettings = JSON.parse(editor.getSession().getValue());
    newSettings.type = settings.type;
    delete newSettings.id;
    newSettings.$setAll = true;
    settings = newSettings;
    dpd('__resources').put(Context.resourceId, settings, function(res, err) {
      if (err) { ui.error("Error saving", err.message).effect('slide').closable(); }
      if (!$('#notifications li').length) ui.notify("Saved").hide(1000).effect('slide');
    });
  } catch (ex) {
    if (showError) { ui.error("Invalid JSON", ex.message).effect('slide').closable(); }
  }
}



})();