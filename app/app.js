var app = angular.module('ensemble',['ui.router','ngFileUpload']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        $stateProvider.state('home',{
            url: '/',
            views : {
                'features': {
                    templateUrl: '/views/features.html',
                    controller: 'FeaturesCtrl'
                },
                'newfeature': {
                    templateUrl: '/views/newfeature.html',
                    controller: 'NewFeatureCtrl'
                },
                'art': {
                    templateUrl: '/views/art.html',
                    controller: 'ArtCtrl'
                },
                'pullrequests': {
                    templateUrl: '/views/pullrequests.html',
                    controller: 'PRCtrl'
                },
                'what': {
                    templateUrl: '/views/what.html'
                }

            }
        });
        $urlRouterProvider.otherwise('/');
    }
]);

app.factory('postWatcher',function(){
    return {
        posted: false,
        changeState : function(){
            this.posted = !this.posted;
        }
    }
});

app.directive('onFinishRender', function() {
    return function(scope){
        if(scope.$last) manageFocus();
    };
});