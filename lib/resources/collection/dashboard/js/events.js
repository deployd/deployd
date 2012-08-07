(function() {

var resource
  , editors
  , events
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
  // editors = {};
  // Object.keys(defaults).forEach(function(e) {
  //   var editor = ace.edit(e);
  //   editor.setTheme("ace/theme/deployd");
  //   editor.session.setMode("ace/mode/javascript");
  //   editor.setShowPrintMargin(false);
  //   editors[e] = editor;
  // });
  // bindEditors();
}

function loadResource() {
  dpd('__resources').get(Context.resourceId, function(res, err) {
    resource = res;
    renderReference();
  });  
}

function bindEditors() {
  if (events && editors) {
    Object.keys(editors).forEach(function(e) {
      var code = events[e] || defaults[e];
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

function renderReference() {
  var properties = CollectionUtil.propsToArray(resource.properties);
  $('#property-reference').html(propertyReferenceTemplate({properties: properties}));
}

createEditors();
loadResource();

})();