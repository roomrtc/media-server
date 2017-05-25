angular
    .module('videoconference', [
        'ui.router'
    ])
    .config([
        '$stateProvider',
        '$urlRouterProvider',
        '$locationProvider',
        function ($stateProvider, $urlRouterProvider, $locationProvider) {

            $stateProvider
                .state('home', {
                    url: '/',
                    templateUrl: '/partials/home.html',
                    controller: 'HomeCtrl'
                })
                .state('about', {
                    url: '/about/',
                    //abstract: true,
                    //template: "<ui-view/>",
                    templateUrl: "about.index", //"<h2>About page</h2><ui-view/>",
                })
                .state('about.team', {
                    url: '/team/',
                    templateUrl: 'about.team',
                    controller: 'InfoCtrl'
                })
                .state('about.privacy', {
                    url: '/privacy/',
                    //templateUrl: 'about.privacy',
                    template: "Privacy",
                    controller: 'InfoCtrl'
                })
                .state('about.terms', {
                    url: '/terms/',
                    //templateUrl: 'about.terms',
                    template: "Terms",
                    controller: 'InfoCtrl'
                })
                .state('about.contact', {
                    url: '/contact/',
                    //templateUrl: 'contact',
                    template: "Contact",
                    controller: 'InfoCtrl'
                })
                .state('about.jobs', {
                    url: '/jobs/',
                    //templateUrl: 'jobs',
                    template: "Jobs",
                    controller: 'InfoCtrl'
                });
            // Zoom routes
            $stateProvider
                .state('room', {
                    abstract: true,
                    template: "<ui-view/>"
                })
                .state('room.join', {
                    url: '/:roomName/',
                    templateUrl: '/partials/room.html',
                    controller: 'roomController'
                });
            $urlRouterProvider.otherwise('/404');

            // FIX for trailing slashes. Gracefully "borrowed" from https://github.com/angular-ui/ui-router/issues/50
            $urlRouterProvider.rule(function ($injector, $location) {
                if ($location.protocol() === 'file')
                    return;

                var path = $location.path()
                // Note: misnomer. This returns a query object, not a search string
                    , search = $location.search()
                    , params
                    ;

                // check to see if the path already ends in '/'
                if (path[path.length - 1] === '/') {
                    return;
                }

                // If there was no search string / query params, return with a `/`
                if (Object.keys(search).length === 0) {
                    return path + '/';
                }

                // Otherwise build the search string and return a `/?` prefix
                params = [];
                angular.forEach(search, function (v, k) {
                    params.push(k + '=' + v);
                });
                return path + '/?' + params.join('&');
            });

            $locationProvider.html5Mode(true);

        }
    ])
    .run(['$rootScope', '$state', '$stateParams', '$location', '$window', function ($rootScope, $state, $stateParams, $location, $window) {

        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {

        });
        $rootScope.$on('$stateChangeSuccess', function (event) {
            // Setup _ga:  http://www.arnaldocapo.com/blog/post/google-analytics-and-angularjs-with-ui-router/72
            if (!$window.ga) return;
            $window.ga('send', 'pageview', { page: $location.path() });
        });
    }])
;