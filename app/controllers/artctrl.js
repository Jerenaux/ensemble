
app.controller('ArtCtrl', ['$scope', 'Upload', function ($scope, Upload) {
    $scope.postArt = function() {
        $scope.sending = true;
        $scope.sendingMsg = "Sending ...";
        var file = $scope.picFile;
        file.upload = Upload.upload({
            url: '/api/newart/',
            data: {
                username: $scope.username,
                email: $scope.email,
                comment: $scope.comment,
                file: file
            }
        });

        file.upload.then(function (response) {
            if(response.status == 200){
                $scope.confirmationMsg = 'Your art was successfully sent!';
                $scope.submitted = true;
                $scope.sending = false;
                $scope.comment = '';
                $scope.picFile = '';
                $scope.postForm.$setUntouched();
                $scope.postForm.$setPristine();
                setTimeout($scope.removeAlert,5000);
            }
        }, function (response) {
            $scope.errorMsg = 'An error occured : '+response.status;
            $scope.showerror = true;
            $scope.sending = false;
            console.log(response);
            setTimeout($scope.removeAlert,5000);
        });

        $scope.removeAlert = function(){
            $scope.submitted = false;
            $scope.showerror = false;
            $scope.$apply();
        }
    }
}]);