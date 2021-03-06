(function () {
  angular
    .module('Hungry.core.auth')
    .service('Auth', Auth);

  function Auth ($window) {
    var roles = $window.roles ? $window.roles.split(',') : [];

    return {
      hasRole: hasRole
    };

    function hasRole (role, user) {
      if(!user) {
        return roles.indexOf(role) !== -1;
      } else {
        return !!_.findWhere(user.roles, {
          name: role
        });
      }
    }
  }
})(); 