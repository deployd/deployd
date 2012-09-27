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

  ko.bindingHandlers.screenDimensions = {
    init: function(element, valueAccessor) {
      var val = valueAccessor();
      var calc = function() {
        val(calculateScreenDimensions(element));
      };
      calc();
      $(document).ready(calc);
      $(window).scroll(calc).resize(calc);
    }
  };

  function calculateScreenDimensions(element) {
    var $element = $(element)
      , $window = $(window)
      , top = $element.offset().top - $window.scrollTop()
      , left = $element.offset().left - $window.scrollLeft()
      , height = $element.height()
      , width = $element.width()
      , bottom = top + height
      , right = left + width
      , bottomRelative = $(window).height() - bottom;

    return {
        top: top
      , left: left
      , bottom: bottom
      , right: right
      , height: height
      , width: width
      , bottomRelative: bottomRelative
    };
  }

  ko.bindingHandlers.scrollbarWidth = {
    init: function(el, valueAccessor) {
      var $el = $(el)
        , val = valueAccessor()
        , $container = $('<div>')
        , $inner = $('<div>');

      $container.css({
          position: 'relative'
        , height: '100px'
        , 'overflow-y': 'scroll'
      });

      $inner.css({
          position: 'absolute'
        , top: 0
        , left: 0
        , bottom: 0
        , right: 0
      });

      $container.append($inner);
      $el.prepend($container);

      var containerWidth = $container.width();
      var innerWidth = $inner.width();

      $container.remove();

      val(containerWidth - innerWidth);
    }
  };
})();

(function() {
  
  var vm = {

    view: {
        scrollY: ko.observable(0)
      , scrollX: ko.observable(0)
      , dimensions: ko.observable({})
      , scrollWidth: ko.observable(0)
    }
    
  };

  ko.applyBindings(vm, $('#data')[0]);
  window.vm = vm;

})();