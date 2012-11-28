(function() {

  var scope = {
      deployments: null
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
  checkAuthentication();

  $('#deployment-list').on('click', '.component-item', onClickDeployment);

  function loadDeployments() {
    dpdDeployments.get(function(deployments, error) {
      scope.deployments = deployments;
      renderDeployments();
    });
  }

  function checkAuthentication() {
    dpdDeployments.post('authenticate', {}, function(res, err) {
      scope.isAuthenticated = !err;
      scope.checkedAuthentication = true;
      if (scope.isAuthenticated) {
        $('#deployments').show();
      } else {
        $modal.modal('show');
      }
    });
  }

  function onClickDeployment(e) {
    if ($(e.target).is('a')) return true;
    var href = $(this).find('.manage-btn').attr('href');
    location.href = href;
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

})();