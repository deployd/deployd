/*globals refreshHeaderDeployments:true */

(function() {

  var scope = {
      deployments: null
    , onlineDeployments: null
    , checkedAuthentication: false
    , user: null
  };

  var dpdDeployments = dpd('__deployments');
  var deploymentTemplate = _.template($('#deployment-template').html());
  var $modal = $('#deployAuthModal').modal({
    backdrop: false,
    keyboard: false,
    show: false
  });


  //$('#deploy-new-form .deployment-name').attr('placeholder', Context.appName);

  loadUser();
  loadDeployments();

  $('#deployment-list').on('click', '.component-item', onClickDeployment);
  $('#deployment-list').on('click', '.deploy-btn', onClickDeployBtn);
  $('#deployment-list').on('click', '.remove-btn', onClickRemoveBtn);

  $('#deployments h3 .logout-btn').click(function() {
    onClickLogoutBtn();
    return false;
  });

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
      scope.onlineDeployments = deployments;
      renderOnlineDeployments();
    });
  }

  function loadUser(showError) {
    dpdDeployments.get('me', {}, function(user, err) {
      if (err && err.message !== "Not authenticated") {
        showConnectionError();
        return;
      }

      scope.user = user;
      scope.checkedAuthentication = true;

      showLogin(showError);
      if (scope.user) {
        loadOnlineDeployments();
      }
    });
  }

  function deployNew(name, fn) {
    if (!name) {
      name = $('#deploy-new-form .deployment-name').val();
      if (!name) return;
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
      var oldFn = fn;
      fn = function() {
        $('#deploy-new-form .deployment-name').val('');
        if (oldFn) oldFn();
      };
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
        var confirmation = ui.dialog("Error deploying " + deployment.name, error.message).show().closable();
        $(confirmation.el).addClass('deployment');
        if (!deployment.id) remove(deployment);
      } else {
        Object.keys(result).forEach(function(k) {
          deployment[k] = result[k];
        });
        deployment.id = result.appId;
        deployment.__deployed = true;
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
    var deployment = getDeployment(e.currentTarget);
    if (deployment.deploying) return true;
    var href = "http://" + deployment.name + ".deploydapp.com";
    window.open(href, "_blank");
    window.focus();
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
      loadUser(true);
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

  function onClickLogoutBtn() {
    dpdDeployments.post('logout', function() {
      loadUser();
    });
  }

  function showLogin(error) {
    renderDeployments();
    if (scope.user) {
      $modal.modal('hide');
      $('#deployments h3 .username').text(scope.user.username);
      $('#deploy-new-form .deployment-name').focus();
    } else {
      $modal.modal('show');
      if (error) {
        $('#auth-error').show();
      } else {
        $('#auth-error').hide();
      }
    }
    
  }

  function renderDeployments() {
    if (scope.user) {
     if (scope.deployments === null || scope.deployments.length) {
       $('#deployments-empty').hide();
       $('#inner-deployments').show();
      $('#deploy-new-form').appendTo('#inner-deployments .form-placeholder').show();
     } else {
       $('#deployments-empty').show();
       $('#inner-deployments').hide();
       $('#deploy-new-form').appendTo('#deployments-empty .form-placeholder').show();
       var $input = $('#deploy-new-form .deployment-name');
       if (!$input.val()) $input.val(Context.appName);
     }

     if (scope.deployments) {
       $('#deployment-list').empty();

       // clean up orphaned tooltips
       $('body > .tooltip').each(function() {
         var $tooltip = $(this);
         $tooltip.fadeOut(function() {
           $tooltip.remove();
         });
       });

       scope.deployments.forEach(function(d, i) {
         $('#deployment-list').append(deploymentTemplate({
           deployment: d,
           index: i
         }));

         if (d.__deployed) {
           showDeploymentTooltip(d);
           d.__deployed = false;
         }


       });
     }
    } else {
      $('#deployments-empty').hide();
      $('#deployments-empty').hide();
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

  function showDeploymentTooltip(deployment) {
    var $el = $('#deployment-' + deployment.appId);
    $el.tooltip({
      placement: 'right',
      title: "Deployed!",
      trigger: 'manual'
    }).tooltip('show');

    setTimeout(function() {
      $el.tooltip('hide');
    }, 2500);
  }

  function showConnectionError() {
    $('#deployments-connection-error').show();
    $('#inner-deployments').hide();
  }

})();