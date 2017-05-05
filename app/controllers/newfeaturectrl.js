app.controller('NewFeatureCtrl',[
    '$scope','$http','postWatcher',
    function($scope,$http,postWatcher){
        $scope.submitted = false;
        $scope.canPost = true;
        $scope.postFeature = function(){
            if(!$scope.description || $scope.description.length == 0) return;
            var feature = {
                username: $scope.username,
                //twitter: $scope.twitter,
                desc: $scope.description,
                upvotes: 0,
                downvotes: 0
            };
            $http.post("/api/newfeature/", feature).then(function(res) {
                if(!$scope.canPost) return;
                $scope.canPost = false;
                if(res.status == 201){
                    $scope.confirmation = 'Your feature was successfully added to the list!';
                    $scope.description = '';
                    $scope.postForm.$setUntouched();
                    $scope.postForm.$setPristine();
                    postWatcher.changeState();
                    $scope.submitted = true;
                    setTimeout($scope.removeAlert,5000);
                    $scope.canPost = true;
                }
            },function(err){});
        };

        $scope.removeAlert = function(){
            $scope.submitted = false;
            $scope.$apply();
        };

        $scope.toggleGameControls = function(state){
            Game.toggleGameControls(state);
        };
    }
]);