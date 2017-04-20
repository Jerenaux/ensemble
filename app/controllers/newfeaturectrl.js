app.controller('NewFeatureCtrl',[
    '$scope','$http','postWatcher',
    function($scope,$http,postWatcher){
        $scope.submitted = false;
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
                if(res.status == 201){
                    $scope.confirmation = 'Your feature was successfully added to the list!';
                    $scope.description = '';
                    $scope.postForm.$setUntouched();
                    $scope.postForm.$setPristine();
                    //featuresFactory.dirty = true;
                    postWatcher.changeState();
                    $scope.submitted = true;
                    setTimeout($scope.removeAlert,5000);
                }
            },function(err){});
        };

        $scope.removeAlert = function(){
            $scope.submitted = false;
            $scope.$apply();
        }
    }
]);