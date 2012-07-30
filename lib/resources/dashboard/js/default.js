(function() {

var settings = ""
  , editor
  , timeout;

dpd('__resources').get(Context.resourceId, function(res, err) {
  if (res) {
    delete res.type;
    delete res.path;
    delete res.ctime;

    settings = JSON.stringify(res, null, '\t');
    editor = ace.edit('settings');
    editor.setTheme("ace/theme/deployd");
    editor.session.setMode("ace/mode/json");
    editor.setShowPrintMargin(false);
    editor.getSession().setValue(settings);
    editor.getSession().on('change', function() { trackUpdate() } );
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

function update() {
  try {
    var settings = JSON.parse(editor.getSession().getValue());
    dpd('__resources').put(Context.resourceId, settings, function(res, err) {
      if (err) { ui.error("Error saving", err.message).slide().closable(); }
      if (!$('#notifications li').length) ui.notify("Saved").hide(1000).effect('slide');
    });
  } catch (ex) {}
}



})();