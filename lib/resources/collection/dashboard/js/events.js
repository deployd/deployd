(function() {

var resource
  , editors
  , timeouts = {};

var defaults = {
  onGet: '',
  onPost: '/* Authentication */\n' +
  '// if (!me || !me.isAdmin) {\n' +
  '//   cancel("You must be an admin!", 401);\n'+
  '// }\n'+
  '\n' +
  '/* Automatic properties */\n' +
  '// this.creator = me.id;\n' +
  '// this.creatorName = me.name;\n',
  onPut: '/* Readonly properties */\n' +
  '// protect("creator");\n',
  onDelete: '',
  onValidate: '/* Validation */\n' +
  '// if (this.name.length < 10) {\n' +
  '//   error("name", "Must be at least 10 characters");\n' +
  '// }\n'
};

var propertyReferenceTemplate = _.template($("#property-reference-template").html());

function createEditors() {
  editors = {};
  Object.keys(defaults).forEach(function(e) {
    var editor = ace.edit(e);
    editor.setTheme("ace/theme/deployd");
    editor.session.setMode("ace/mode/javascript");
    editor.setShowPrintMargin(false);
    editors[e] = editor;
  });
  bindEditors();
}

function loadResource() {
  dpd('__resources').get(Context.resourceId, function(res, err) {
    resource = res;
    bindEditors();
    renderReference();
  });
}

function bindEditors() {
  if (resource && editors) {
    Object.keys(editors).forEach(function(e) {
      var code = resource[e] || defaults[e];
      editors[e].getSession().setValue(code);
      editors[e].getSession().on('change', function() { trackUpdate(e, editors[e]) } );      
    });
    $('#events').show();
  }
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
  var update = {};
  update[name] = editor.getSession().getValue();

  dpd('__resources').put(Context.resourceId, update, function(res, err) {
    if (err) { return ui.error("Error saving event", err.message); }
    if (!$('#notifications li').length) ui.notify("Saved").hide(500);
  });
}

function renderReference() {
  var properties = CollectionUtil.propsToArray(resource.properties);
  $('#property-reference').html(propertyReferenceTemplate({properties: properties}));
}

createEditors();
loadResource();

})();