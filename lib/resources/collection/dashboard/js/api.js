(function() {

var apiTemplate = _.template($('#api-template').html());

dpd('__resources').get(Context.resourceId, function(res, err) {
  /*jshint boss:true */
  $('#api').show().html(apiTemplate({
      resourceData: res
    , ns: function(path) {
        path = path ? path.replace('/', '') : '';
        if(path.indexOf('-') > -1) path = "['" + path + "']";
        else path = '.' + path;
        return path;
      }
    , getObj: function() {
        var props = res.properties
          , keys = _.keys(props || {})
          , obj = {}
          , key
          , vals = {string: 'foobar', number: 123, boolean: true, date: new Date()}
        ;
        
        while(key = keys.shift()) {
          if(props[key].type != 'date') obj[key] = vals[props[key].type];
        }

        return JSON.stringify(obj);
      }
  }));
  prettyPrint();
});

})();