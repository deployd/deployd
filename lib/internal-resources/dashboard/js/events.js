$(document).ready(function() {

  var $eventEditor = $('#event-editor')
    , editors
    , events
    , timeouts = {};


  if (Context.events && $eventEditor && $eventEditor.is('.default-editor')) {
    var template = _.template($('#event-editor-template').html());
    $eventEditor.html(template({ events: Context.events }));
    $eventEditor.show();
    createEditors();
    loadEvents();
  }

  function createEditors() {
    editors = {};
    Context.events.forEach(function(e) {
      var editor = ace.edit('on' + e);
      editor.setTheme("ace/theme/deployd");
      editor.session.setMode("ace/mode/javascript");
      editor.setShowPrintMargin(false);
      editors[e] = editor;
    });
    bindEditors();
  }

  function bindEditors() {
    if (events && editors) {
      Object.keys(editors).forEach(function(e) {
        var code = events[e] || '';
        editors[e].getSession().setValue(code);
        editors[e].getSession().on('change', function() { trackUpdate(e, editors[e]) } );      
        editors[e].commands.addCommand({
            name: "save",
            bindKey: {win: "Ctrl-S", mac: "Command-S"},
            exec: function(editor) {
              update(e, editor);
            }
        });
      });
      $('#events').show();
      $('#event-nav a').click(function(e) {
        var href = $(this).attr('href')
          , editor = $(this).attr('data-editor');

        if (e.which === 2) {
          return true;
        }

        location.hash = href;
        setTimeout(function() { editors[editor].resize(); }, 1);
      });

      if (location.hash) {
        $('#event-nav a[href="' + location.hash + '"]').click();
      }
    }
  }

  function loadEvents() {
    var remaining = Context.events.length
      , _events = {};

    Context.events.forEach(function(e) {
      var fileName = e.toLowerCase() + '.js';
      dpd('__resources').get(Context.resourceId + '/' + fileName, function(res, err) {
        _events[e] = res && res.value;

        remaining--;
        if (remaining <= 0) {
          events = _events;
          bindEditors();
        }
      });
    });
  }

  function trackUpdate(name, editor) {
    if (timeouts[name]) {
      clearTimeout(timeouts[name]);
    }

    timeouts[name] = setTimeout(function() {
      update(name, editor);
      delete timeouts[name];
    }, 1000);
  }

  function update(name, editor) {
    var put = { value: editor.getSession().getValue() }
      , fileName = name.toLowerCase() + '.js';

    if (timeouts[name]) {
      clearTimeout(timeouts[name]);
      delete timeouts[name];
    }

    dpd('__resources').put(Context.resourceId + '/' + fileName, put, function(res, err) {
      if (err) { return ui.error("Error saving event", err.message).effect('slide'); }
      if (!$('#notifications li').length) ui.notify("Saved").hide(1000).effect('slide');
    });
  }

});