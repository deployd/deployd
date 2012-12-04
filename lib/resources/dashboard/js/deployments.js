/*globals refreshHeaderDeployments:true */

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



  $('#deploy-new-form .deployment-name').attr('placeholder', Context.appName);

  loadDeployments();
  loadOnlineDeployments();
  // checkAuthentication();

  $('#deployment-list').on('click', '.component-item', onClickDeployment);
  $('#deployment-list').on('click', '.deploy-btn', onClickDeployBtn);
  $('#deployment-list').on('click', '.remove-btn', onClickRemoveBtn);

  $('#deployAuthModal .login-btn').click(onClickLogin);
  $('#deployAuthModal form input').keypress(onKeypressAuthModalInput);
  $('#deploy-new-form').submit(function() {
    deployNew();
    return false;
  });
  $('#existing-deployment-dropdown').change(onSelectExistingDeployment);

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
      showLogin();

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

  function deployNew(name, fn) {
    if (!name) {
      name = $('#deploy-new-form .deployment-name').val();
      name = name || Context.appName;
    }

    for (var i = 0; i < scope.deployments.length; i++) {
      if (scope.deployments[i].name === name) {
        alert("You already have a deployment called \"" + name + "\"");
        if (typeof fn === 'function') fn();
        return;
      }
    }

    if (name) {
      var deployment = {
        name: name
      };
      scope.deployments.push(deployment);
      deploy(deployment, fn);
    } 
  }

  function deploy(deployment, fn) {
    deployment.deploying = true;
    dpdDeployments.post({
      subdomain: deployment.name
    }, function(result, error) {
      deployment.deploying = false;

      if (error) {
        alert("Error while deploying: " + error.message);
        if (!deployment.id) remove(deployment);
      } else {
        Object.keys(result).forEach(function(k) {
          deployment[k] = result[k];
        });
      }

      if (typeof fn == 'function') fn();

      refreshHeaderDeployments();
      renderDeployments();
      loadOnlineDeployments();
    });

    renderDeployments();
  }

  function remove(deployment) {
    dpdDeployments.del(deployment.name, function() {
      var index = scope.deployments.indexOf(deployment);
      scope.deployments.splice(index, 1);

      renderDeployments();
      loadOnlineDeployments();
      refreshHeaderDeployments();
    });
  }

  function getDeployment(el) {
    var $el = $(el);
    var $parent = $el;
    if (!$el.is('.component-item')) {
      $parent = $el.parents('.component-item').first();
    }

    var index = parseInt($parent.attr('data-index'), 10);
    return scope.deployments[index];
  }

  function onClickDeployment(e) {
    if ($(e.target).is('a')) return true;
    var href = $(this).find('.manage-btn').attr('href');
    location.href = href;
  }

  function onClickDeployBtn(e) {
    var deployment = getDeployment(e.target);
    deploy(deployment);

    return false;
  }

  function onClickRemoveBtn(e) {
    var deployment = getDeployment(e.target);
    remove(deployment);

    return false;
  }

  function onKeypressAuthModalInput(e) {
    if (e.keyCode == 13) {
      onClickLogin();
      return false;
    }
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
       if (scope.isAuthenticated) loadOnlineDeployments();
    });
    return false;
  }

  function onSelectExistingDeployment(e) {
    var $dropdown = $(this);
    var name = $dropdown.val();
    if (name === "__") return true;

    $dropdown.attr('disabled', true);

    deployNew(name, function() {
      $dropdown.removeAttr('disabled');
      $dropdown.val("__");
    });
  }

  function showLogin(error) {
    if (scope.isAuthenticated) {
      $modal.modal('hide');
      $('#deployments').show();
      $('#deploy-new-form .deployment-name').focus();
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
      $('#deployment-list-container').show();
    } else {
      $('#deployments-empty').show();
      $('#deployment-list-container').hide();
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
      $dropdown.append('<option value="__">or add an existing deployment...</option>');
      scope.onlineDeployments.forEach(function(o) {
        $dropdown.append('<option value="' + o.name + '">' + o.name + "</option>");
      });
    } else {
      $dropdown.hide();
    }
  }

})();