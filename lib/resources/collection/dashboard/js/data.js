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
    init: function(element, valueAccessor, allBindingsAccessor) {
      var val = valueAccessor()
        , allBindings = allBindingsAccessor();

      var calc = function() {
        val(calculateScreenDimensions(element));
      };
      calc();
      $(document).ready(calc);
      $(window).scroll(calc).resize(calc);

      if (allBindings.reflow && allBindings.reflow.subscribe) {
        allBindings.reflow.subscribe(function() {
          setTimeout(calc, 1);
        });
      }
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

  ko.bindingHandlers.element = {
    init: function(element, valueAccessor) {
      var val = valueAccessor();
      val($(element));
    }
  };
})();

(function() {

  var ROW_HEIGHT = 39;
  var PAGE_SIZE = 25;

  var resource = Context.resourceId
    , isUser = Context.resourceType === "UserCollection";

  
  var vm = {

      properties: ko.observableArray()
    , data: ko.observableArray()

    , propertiesLoaded: ko.observable(false)

    , view: {
        scrollY: ko.observable(0)
      , scrollX: ko.observable(0)
      , dimensions: ko.observable({})
      , scrollWidth: ko.observable(0)
      , $table: ko.observable()
    }
    
  };

  vm.view.loadSpaceBefore = ko.computed(function() {
    var totalHeight = 0
      , rows = vm.data().length
      , containerHeight = vm.view.dimensions().height - vm.view.scrollWidth(); 

    totalHeight = (rows + 2) * ROW_HEIGHT; 

    if (totalHeight < containerHeight) {
      return containerHeight - totalHeight;
    } else {
      return 0;
    }
  }, vm);

  function createRow(data) {
    var rowVm = ko.mapping.fromJS(data);

    rowVm.textFor = function(prop) {
      var val = rowVm[prop];
      if (typeof val === 'undefined' || val === null) {
        return '...';
      } else if (typeof val === 'object') {
        return JSON.stringify(val);
      } else {
        return val;
      }
    };

    return rowVm;
  }

  var rowMapping = {
    'data': {
      create: function(options) {
        return createRow(options.data);
      }
    }
  };

  function loadProperties() {
    dpd('__resources').get(resource, function(res, err) {
      var props = CollectionUtil.propsToArray(res.properties);

      if (isUser) {
        props.unshift({
            id: 'username'
          , type: 'string'
          , typeLabel: 'string'
        }, {
            id: 'password'
          , type: 'password'
          , typeLabel: 'password'
        });
      }

      vm.properties(props);
      vm.propertiesLoaded(true);
    });
  }

  function loadPage(page) {
    dpd(resource).get({$limit: PAGE_SIZE}, function(res, err) {
      if (err) return;
      ko.mapping.fromJS({data: res}, rowMapping, vm);
    });
  }

  ko.applyBindings(vm, $('#data')[0]);
  window.vm = vm;

  loadProperties();
  loadPage();

  dpd.on(resource + ':changed', function() {
    loadPage();
  });

})();