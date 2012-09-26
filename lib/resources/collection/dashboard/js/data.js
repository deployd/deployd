(function defineBindings() {
  ko.bindingHandlers.scrollX = {
    init: function(element, valueAccessor) {
      var val = valueAccessor();

      if (typeof val === 'function') {
        $(element).scroll(function() {
          val($(element).scrollLeft());
        });
      }
    },
    update: function(element, valueAccessor) {
      var val = ko.utils.unwrapObservable(valueAccessor());
      if ($(element).scrollLeft() !== val) {
        $(element).scrollLeft(val);  
      }
    }
  };

  ko.bindingHandlers.scrollY = {
    init: function(element, valueAccessor) {
      var val = valueAccessor();

      if (typeof val === 'function') {
        $(element).scroll(function() {
          val($(element).scrollTop());
        });
      }
    },
    update: function(element, valueAccessor) {
      var val = ko.utils.unwrapObservable(valueAccessor());
      if ($(element).scrollTop() !== val) {
        $(element).scrollTop(val);  
      }
    }
  };
})();

(function() {
  
  var vm = {

    view: {
        scrollY: ko.observable(0)
      , scrollX: ko.observable(0)  
    }
    
  };

  ko.applyBindings(vm, $('#data')[0]);

})();