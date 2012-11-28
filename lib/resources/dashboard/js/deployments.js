(function() {

  var scope = {
      deployments: null
    , onlineDeployments: null
    , checkedAuthentication: false
    , isAuthenticated: false
  };

  var dpdDeployments = dpd('__deployments');
  var deploymentTemplate = _.template($('#deployment-template').html());
  var $modal = $('#deployAuthModal').modal({
    backdrop: 'static',
    keyboard: false,
    show: false
  });

  loadDeployments();
  loadOnlineDeployments();
  // checkAuthentication();

  $('#deployment-list').on('click', '.component-item', onClickDeployment);
  $('#deployAuthModal .login-btn').click(onClickLogin);

  function loadDeployments() {
    dpdDeployments.get(function(deployments, error) {
      scope.deployments = deployments;
      renderDeployments();
    });
  }

  function loadOnlineDeployments()  {
    dpdDeployments.get('online', function(deployments, error) {
      scope.checkedAuthentication = true;
      scope.isAuthenticated = !error;
      showLogin(true);

      scope.onlineDeployments = deployments;
      renderOnlineDeployments();
    });
  }

  function checkAuthentication() {
    dpdDeployments.post('authenticate', {}, function(res, err) {
      scope.isAuthenticated = !err;
      scope.checkedAuthentication = true;

      showLogin();
    });
  }

  function onClickDeployment(e) {
    if ($(e.target).is('a')) return true;
    var href = $(this).find('.manage-btn').attr('href');
    location.href = href;
  }

  function onClickLogin() {
    var email = $('#deployAuthModal #inputEmail').val()
      , password = $('#deployAuthModal #inputPassword').val();

    $('#auth-error').hide();

    dpdDeployments.post('authenticate', {
      username: email,
      password: password
    }, function(res, err) {
       scope.isAuthenticated = !err;
       showLogin(true);
       loadOnlineDeployments();
    });
  }

  function showLogin(error) {
    if (scope.isAuthenticated) {
      $modal.modal('hide');
      $('#deployments').show();
    } else {
      $modal.modal('show');
      $('#deployments').hide();
      if (error) {
        $('#auth-error').show();
      } else {
        $('#auth-error').hide();
      }
    }
    
  }

  function renderDeployments() {
    if (scope.deployments === null || scope.deployments.length) {
      $('#deployments-empty').hide();
    } else {
      $('#deployments-empty').show();
    }

    if (scope.deployments) {
      $('#deployment-list').empty();
      scope.deployments.forEach(function(d, i) {
        $('#deployment-list').append(deploymentTemplate({
          deployment: d,
          index: i
        }));
      });
    }
  }

  function renderOnlineDeployments() {
    var $dropdown = $('#existing-deployment-dropdown');
    if (scope.onlineDeployments && scope.onlineDeployments.length) {
      $dropdown.show().empty();
      $dropdown.append("<option>or add an existing deployment...</option>");
      console.log(scope.onlineDeployments, scope.onlineDeployments.length);
      scope.onlineDeployments.forEach(function(o) {
        $dropdown.append("<option>" + o.name + "</option>");
      });
    } else {
      $dropdown.hide();
    }
  }

})();