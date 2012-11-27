(function() {

  var scope = {
    deployments: null
  };

  var dpdDeployments = dpd('__deployments');
  var deploymentTemplate = _.template($('#deployment-template').html());

  loadDeployments();

  $('#deployment-list').on('click', '.component-item', onClickDeployment);

  function loadDeployments() {
    dpdDeployments.get(function(deployments, error) {
      scope.deployments = deployments;
      renderDeployments();
    });
  }

  function onClickDeployment() {
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