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

function loadResource() {
  dpd('__resources').get(Context.resourceId, function(res, err) {
    resource = res;
    renderReference();
  });  
}

function renderReference() {
  var properties = CollectionUtil.propsToArray(resource.properties);
  $('#property-reference').html(propertyReferenceTemplate({properties: properties}));
}

loadResource();

})();