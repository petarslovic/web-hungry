(function () {

  angular.module('Hungry.core.auth', []);
  angular.module('Hungry.core.state', []);
  angular.module('Hungry.core.app-state', []);
  angular.module('Hungry.core.config', []);
  angular.module('Hungry.core.api-helpers', []);
  angular.module('Hungry.core.url-replacer', []);
  angular.module('Hungry.core.api.users', []);
  angular.module('Hungry.core.api.roles', []);
  angular.module('Hungry.core.api.foods', []);
  angular.module('Hungry.core.api.menus', []);
  angular.module('Hungry.app', []);
  angular.module('Hungry.super-admin.users', []);
  angular.module('Hungry.admin.food', []);
  angular.module('Hungry.admin.menus', []);
  
  angular
    .module('Hungry', [
      'ui.router',
      'file-data-url',
      'oitozero.ngSweetAlert',
      'hungry.templates',
      'ngMaterial',

      'Hungry.core.auth',
      'Hungry.core.state',
      'Hungry.core.app-state',
      'Hungry.core.config',
      'Hungry.core.api-helpers',
      'Hungry.core.url-replacer',

      'Hungry.core.api.users',
      'Hungry.core.api.roles',
      'Hungry.core.api.foods',
      'Hungry.core.api.menus',

      'Hungry.app',
      'Hungry.super-admin.users',
      'Hungry.admin.food',
      'Hungry.admin.menus',

    ])
    .config(configureRoutes)
    .run(appRun);

  function configureRoutes ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) {
    $urlRouterProvider.otherwise('/');
    $urlMatcherFactoryProvider.strictMode(false);

    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'login/login',
        role: ''
      })
      .state('app', {
        url: '/',
        abstract: true,
        template: '<div ui-view></div>',
        controller: 'AppController',
        resolve: {
          user: function(Users) {
            return Users.getUser(window.userId);
          },
          roles: function(Roles) {
            return Roles.getRoles();
          },
          foods: function(Foods) {
            return Foods.getFoods();
          }
        }
      })

      .state('app.home', {
        url: '',
        templateUrl: 'home/home',
        role: 'user',
      })
      
      .state('app.users', {
        url: 'users',
        controller: 'UsersController as vm',
        templateUrl: 'super-admin/users/users',
        role: 'super-admin',
      })
      
      .state('app.food', {
        url: 'food',
        controller: 'FoodController as vm',
        templateUrl: 'admin/food/food',
        role: 'admin',
      })
      
      .state('app.food-create', {
        url: 'food/create',
        controller: 'FoodCreateController as vm',
        templateUrl: 'admin/food/create',
        role: 'admin',
      })
      
      .state('app.food-edit', {
        url: 'food/edit/:id',
        controller: 'FoodCreateController as vm',
        templateUrl: 'admin/food/create',
        role: 'admin',
      })

      .state('app.menus', {
        url: 'menus',
        controller: 'MenuController as vm',
        templateUrl: 'admin/menu/menu',
        role: 'admin',
      });
  }

  function appRun ($rootScope, $state, Auth, $http, $window, appConfig) {
    $http.defaults.headers.common['X-CSRF-TOKEN'] = $window.csrfToken;
    
    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
      if (toState.role && !Auth.hasRole(toState.role)){
        $state.transitionTo("login");
        event.preventDefault(); 
      }
    });

    $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams){
      console.log(arguments);
    });

    $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams){
      console.log(arguments);
    });

    $rootScope.helpers = {
      hasRole: Auth.hasRole,
      getDayName: getDayName
    };

    function getDayName(day) {
      return moment(day).format('ddd');
    }
  }

})(); 
(function () {
  angular
    .module('Hungry.app')
    .controller('AppController', AppController);

  function AppController(AppState, user, roles, foods) {
    var vm = this;

    var state = {};
    var changeUser = AppState.change('user');
    var changeRoles = AppState.change('roles');
    var changeFoods = AppState.change('foods');

    AppState.listen('user', function(user) { state.user = user; });
    AppState.listen('roles', function(roles) { state.roles = roles; });
    AppState.listen('foods', function(foods) { state.foods = foods; });

    activate();

    function activate() {
      changeUser(user);
      changeRoles(roles);
      changeFoods(foods);
    }

  }
})(); 
(function () {
  angular
    .module('Hungry.core.api-helpers')
    .service('ApiHelpers', ApiHelpers);

  function ApiHelpers() {
    return {
      extractData: extractData,
      handleError: handleError
    };

    function extractData(response) {
      return response.data;
    }

    function handleError(error) {
      console.log(error);
      return error;
    }
  }
})(); 
angular.module('Hungry.core.app-state').factory('AppState', function(StateService) {
  var state = {
    user: {},
    users: [],
    roles: [],
    foods: [],
    menus: []
  };

  var listeners = [];

  var get    = StateService.get(state);
  var change = StateService.change(state, listeners);
  var listen = StateService.listen(state, listeners);

  return {
    get: get,
    change: change,
    listen: listen
  };
});
(function () {
  angular
    .module('Hungry.core.config')
    .constant('appConfig', {
      api: window.api,
      date: {
        format: 'DD.MM.YY.'
      }
    });

})(); 
angular.module('Hungry.core.state').factory('StateService', function() {
  var clone = R.clone;
  var curry = R.curry;
  var filter = R.filter;

  function get(state) {
    return function() {
      return clone(state);
    };
  }

  function getStateProp(state, prop) {
    return clone(state[prop]);
  }

  var change = curry(function(state, listeners, prop, data) {
    var sameProp = filter(function(l) { return l.prop === prop; });

    state[prop] = data;

    R.forEach(function(listener) {
      listener.action(getStateProp(state, listener.prop));
    }, sameProp(listeners));

    return getStateProp(state, prop);
  });

  var listen = curry(function(state, listeners, prop, action) {
    var listener = {prop: prop, action: action};
    listeners.push(listener);

    var unsubscribe = function() {
      return listeners.splice(listeners.indexOf(listener), 1);
    };

    action(getStateProp(state, prop));

    return unsubscribe;
  });

  return {
    get: get,
    change: change,
    listen: listen
  };
});
(function () {
  angular
    .module('Hungry.core.url-replacer')
    .service('UrlReplacer', UrlReplacer);

  function UrlReplacer() {
    var placeholderSymbol = ':';

    return {
      setPlaceholderSymbol: setPlaceholderSymbol,
      replaceParams: replaceParams
    }

    function setPlaceholderSymbol(symbol) {
      placeholderSymbol = symbol;
    };

    function replaceParams(url, data){
      var joinedKeys = _.map(_.keys(data), function(key) {
        return placeholderSymbol + key;
      }).join('|');
      var re = new RegExp(joinedKeys, 'gi');

      return url.replace(re, function(matched){
          return data[matched.replace(placeholderSymbol, '')];
      });
    };

  }
})(); 
(function () {
  angular
    .module('Hungry.admin.food')
    .controller('ChooseFoodController', ChooseFoodController);

  function ChooseFoodController(AppState, Users, $window, Foods, SweetAlert, $mdDialog, appConfig, menu) {
    var vm = this;

    var state = {};
    var changeFoods = AppState.change('foods');

    vm.state = state;
    vm.menu = menu;
    vm.menuDate = moment(menu.date).format(appConfig.date.format)

    vm.hide = hide;
    vm.cancel = cancel;
    vm.selectFood = selectFood;

    AppState.listen('foods', function(foods) { vm.state.foods = foods; });

    activate();

    function activate() {}

    function hide() {
      $mdDialog.hide();
    }

    function cancel() {
      $mdDialog.cancel();
    }

    function selectFood(food) {
      $mdDialog.hide(food);
    }

  }
})(); 
(function () {
  angular
    .module('Hungry.admin.food')
    .controller('FoodCreateController', FoodCreateController);

  function FoodCreateController($rootScope, $stateParams, AppState, Users, user, $window, Foods, $state) {
    var vm = this;

    var state = {};
    var changeFoods = AppState.change('foods');
    var isEdit = $stateParams.id;

    vm.state = state;
    vm.food = {
      description: '',
      image: ''
    };

    if(isEdit) {
      Foods
        .getFood($stateParams.id)
        .then(function(food) {
          vm.food = food;
        });
    }

    vm.isEdit = isEdit;

    vm.saveFood = saveFood;

    activate();

    function activate() {}

    function saveFood(food) {
      vm.loading = true;
      Foods.saveFood(food)
        .then(function() {
          Foods
            .getFoods()
            .then(changeFoods)
            .then(function() {
              vm.loading = false;
              $state.go('app.food');
            });
        })
    }

  }
})(); 
(function () {
  angular
    .module('Hungry.admin.food')
    .controller('FoodController', FoodController);

  function FoodController(AppState, Users, user, $window, Foods, SweetAlert) {
    var vm = this;

    var state = {};
    var changeFoods = AppState.change('foods');

    vm.state = state;

    vm.deleteFood = deleteFood;

    AppState.listen('foods', function(foods) { state.foods = foods; });

    activate();

    function activate() {
      Foods
        .getFoods()
        .then(changeFoods);
    }

    function deleteFood(food) {
      SweetAlert.swal({
         title: "Delete this food?",
         text: "Your will not be able to recover this!",
         type: "warning",
         showCancelButton: true,
         confirmButtonColor: "#DD6B55",
         confirmButtonText: "Yes, delete it!",
         closeOnConfirm: false,
         showLoaderOnConfirm: true
      }, function(shouldDelete) {
        if(shouldDelete) {
          Foods
            .deleteFood(food)
            .then(function() {
              Foods
                .getFoods()
                .then(changeFoods)
                .then(function() {
                  SweetAlert.swal('Delete successful!');
                });
            });
        }
      });
    }

  }
})(); 
(function () {
  angular
    .module('Hungry.admin.menus')
    .controller('MenuController', MenuController);

  function MenuController($scope, AppState, appConfig, user, $window, Foods, Menus, SweetAlert, $mdDialog) {
    var vm = this;

    var state = {};
    var changeUsers = AppState.change('users');
    var changeFoods = AppState.change('foods');
    var changeMenus = AppState.change('menus');
    vm.changeMenus = changeMenus;

    vm.state = state;
    vm.loading = false;
    vm.menusPublished = false;

    /**
     * Current week start date (monday)
     * @type Moment
     */
    vm.week = moment().startOf('isoWeek');

    vm.showFoodDialog = showFoodDialog;
    vm.setNextWeek = setNextWeek;
    vm.setPrevWeek = setPrevWeek;
    vm.publishMenus = publishMenus;

    AppState.listen('foods', function(foods) { state.foods = foods; });
    AppState.listen('menus', function(menus) { state.menus = menus; checkMenusPublished(); });

    $scope.$watch(function() {
      return vm.week;
    }, function() {
      vm.weekStart = vm.week.format(appConfig.date.format);
      vm.weekEnd = moment(vm.week).add(4, 'days').format(appConfig.date.format);
      activate();
    });

    function activate() {
      vm.loading = true;

      Menus
        .getMenus(vm.week.valueOf())
        .then(changeMenus)
        .then(function() { vm.loading = false; });
    }

    function setNextWeek() {
      vm.week = moment(vm.week).add(1, 'weeks').startOf('isoWeek');
    }

    function setPrevWeek() {
      vm.week = moment(vm.week).subtract(1, 'weeks').startOf('isoWeek');
    }

    function showFoodDialog(menu, ev) {
      $mdDialog.show({
        controller: 'ChooseFoodController as vm',
        templateUrl: 'admin/food/choose',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose:true,
        locals: {
          menu: menu
        }
      })
      .then(function(food) {
        vm.loading = true;
        Menus
          .addFoodToMenu(menu, food)
          .then(changeMenus)
          .then(function() {
            vm.loading = false;
          });
      }, function onUserCanceled() {
        
      });
    }

    function publishMenus(week) {
      SweetAlert.swal({
         title: "Publish menus for this week?",
         text: "When you publish the menus, users will be able to see them and order food.",
         type: "info",
         showCancelButton: true,
         confirmButtonText: "Publish",
         closeOnConfirm: false,
         showLoaderOnConfirm: true
      }, function(shouldPublish) {
        if(shouldPublish) {
          Menus
            .publishMenus(week)
            .then(vm.changeMenus)
            .then(function() {
              SweetAlert.swal('Menus published!');
            });
        }
      });
    }

    function checkMenusPublished() {
      vm.menusPublished = _.all(vm.state.menus, function(menu) {
        return menu.published;
      });
    }

  }
})(); 
(function () {
  angular
    .module('Hungry.core.api.foods')
    .factory('Foods', FoodsFactory);

  function FoodsFactory($http, appConfig, UrlReplacer, ApiHelpers) {
    return {
      saveFood: saveFood,
      getFoods: getFoods,
      getFood: getFood,
      deleteFood: deleteFood
    };

    function saveFood(food) {
      if(food.id) {
        return updateFood(food);
      } else {
        return createFood(food);
      }
    }

    function createFood(food) {
      var url = appConfig.api.concat('/admin/food/create');

      return $http.post(url, food).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }

    function updateFood(food) {
      var url = appConfig.api.concat('/admin/food/:id');
      var realUrl = UrlReplacer.replaceParams(url, {
        id: food.id
      });

      return $http.put(realUrl, food).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }

    function getFoods() {
      var url = appConfig.api.concat('/admin/food');
      return $http.get(url).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }

    function getFood(id) {
      var url = appConfig.api.concat('/admin/food/:id');
      var realUrl = UrlReplacer.replaceParams(url, {
        id: id
      });

      return $http.get(realUrl).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }

    function deleteFood(food) {
      var url = appConfig.api.concat('/admin/food/:id');
      var realUrl = UrlReplacer.replaceParams(url, {
        id: food.id
      });

      return $http.delete(realUrl).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }
  }
})(); 
(function () {
  angular
    .module('Hungry.core.api.menus')
    .factory('Menus', MenusFactory);

  function MenusFactory($http, appConfig, UrlReplacer, ApiHelpers) {
    return {
      getMenus: getMenus,
      addFoodToMenu: addFoodToMenu,
      publishMenus: publishMenus
    };

    /**
     * Gets menus for a week specified by week
     * @param  {string} week - timestamp of the monday for a week
     */
    function getMenus(week) {
      var phpWeek = week/1000;
      var url = appConfig.api.concat('/admin/menus?week=:week');
      var realUrl = UrlReplacer.replaceParams(url, {
        week: phpWeek
      });
      return $http.get(realUrl).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }

    function addFoodToMenu(menu, food) {
      var url = appConfig.api.concat('/admin/menus/:id?food_id=:foodId');
      var realUrl = UrlReplacer.replaceParams(url, {
        id: menu.id,
        foodId: food.id
      });
      return $http.put(realUrl).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }

    function publishMenus(week) {
      var phpWeek = week/1000;
      var url = appConfig.api.concat('/admin/menus/publish?week=:week');
      var realUrl = UrlReplacer.replaceParams(url, {
        week: phpWeek
      });
      return $http.post(realUrl).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }
  }
})(); 
(function () {
  angular
    .module('Hungry.core.api.roles')
    .factory('Roles', RolesFactory);

  function RolesFactory($http, appConfig, UrlReplacer, ApiHelpers) {
    return {
      getRoles: getRoles
    };

    function getRoles() {
      var url = appConfig.api.concat('/roles');
      return $http.get(url, {
        cache: true
      }).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }
  }
})(); 
(function () {
  angular
    .module('Hungry.core.api.users')
    .factory('Users', UsersFactory);

  function UsersFactory($http, appConfig, UrlReplacer, ApiHelpers) {
    return {
      getUser: getUser,
      getUsers: getUsers,
      toggleRole: toggleRole
    };

    function getUser(id) {
      var url = appConfig.api.concat('/users/:id');
      var realUrl = UrlReplacer.replaceParams(url, {
        id: id
      });

      return $http.get(realUrl).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }

    function getUsers() {
      var url = appConfig.api.concat('/users');
      return $http.get(url).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }

    function toggleRole(user, role) {
      var url = appConfig.api.concat('/users/:id/toggle-role/:roleId');
      var realUrl = UrlReplacer.replaceParams(url, {
        id: user.id,
        roleId: role.id
      });

      return $http.put(realUrl).then(ApiHelpers.extractData, ApiHelpers.handleError);
    }
  }
})(); 
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
(function () {
  angular
    .module('Hungry.super-admin.users')
    .controller('UsersController', UsersController);

  function UsersController(AppState, Users, user, $window) {
    var vm = this;

    var state = {};
    var changeUsers = AppState.change('users');

    vm.state = state;

    vm.isCurrentUser = isCurrentUser;
    vm.toggleRole = toggleRole;

    AppState.listen('users', function(users) { state.users = users; });
    AppState.listen('roles', function(roles) { state.roles = roles; });

    activate();

    function activate() {
      Users
        .getUsers()
        .then(changeUsers);
    }

    function isCurrentUser(user) {
      return user.id.toString() === $window.userId;
    }

    function toggleRole(user, role) {
      Users
        .toggleRole(user, role)
        .then(function(user) {
          var oldUser = _.findWhere(state.users, { id: user.id });
          oldUser.roles = user.roles;
          changeUsers(state.users);
        });
    }

  }
})(); 