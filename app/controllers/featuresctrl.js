app.controller('FeaturesCtrl',[
    '$scope','$http','postWatcher',
    function($scope,$http,postWatcher){

        $scope.features = [];

        $scope.$watch(function(){
            return postWatcher.posted;
        }, function(newValue){
            if(newValue == true) $scope.getFeatures();
        });

        $scope.getFeatures = function(){
            $http.get("/api/features/").then(function(res) {
                if(res.status == 200){
                    postWatcher.changeState();
                    $scope.features = res.data.map($scope.updateArrows);
                }
            },function(err){});
        };

        $scope.upVote = function(f){
            $scope.updateVotes(f,1);
        };

        $scope.downVote = function(f){
            $scope.updateVotes(f,-1);
        };

        $scope.updateVotes = function(f,change){
            if($scope.hasVoted(f._id)) return;
            if(f.accepted == true) return;

            $http.post("/api/vote/", {id: f._id,change:change}).then(function(res) {
                if(res.status == 200) {
                    $scope.registerVote(f._id,change);
                    $scope.updateArrows(f);
                    if(change == 1){
                        f.upvotes += 1;
                    }else if(change == -1){
                        f.downvotes += 1;
                    }
                }
            },function(err){});
        };

        $scope.updateArrows = function(f){
            var vote = $scope.getVote(f._id);
            if(vote == 1){
                f.upvoted = true;
            }else if(vote == -1){
                f.downvoted = true;
            }
            return f;
        };

        $scope.hasVoted = function(id){
            return (localStorage.getItem('vote_'+id) !== null);
        };

        $scope.getVote = function(id){
            return localStorage.getItem('vote_'+id);
        };

        $scope.registerVote = function(id,change){
            localStorage.setItem('vote_'+id,change);
        };

        $scope.getFeatures();
        setInterval($scope.getFeatures,2*60*1000);
    }
]);

app.filter('getDelay',function(){
    return function(stamp){
        var diff = (Date.now() - stamp) / 1000;
        if(diff < 60) return Math.round(diff)+' second'+(Math.round(diff) > 1 ? 's' : '');
        diff /= 60;
        if(diff < 60) return Math.round(diff)+' minute'+(Math.round(diff) > 1 ? 's' : '');
        diff /= 60;
        if(diff < 24) return Math.round(diff)+' hour'+(Math.round(diff) > 1 ? 's' : '');
        diff /= 24;
        if(diff < 7) return Math.round(diff)+' day'+(Math.round(diff) > 1 ? 's' : '');;
        diff /= 7;
        if(diff < 4) return Math.round(diff)+' week'+(Math.round(diff) > 1 ? 's' : '');;
        diff /= 4;
        return Math.round(diff)+' month'+(Math.round(diff) > 1 ? 's' : '');
    }
});

app.filter('formatName',function(){
    return function(username){
        if(!username || username.length == 0) username = 'anonymous';
        return 'By '+username+', ';
    }
});

app.filter('filterVotes',function(){
    return function(votes,type){
        return votes+' '+(type == 'up' ? 'up' : 'down')+'vote'+(votes == 1 ? '' : 's');
    };
});