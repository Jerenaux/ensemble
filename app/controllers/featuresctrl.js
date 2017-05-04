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
                    $scope.features = res.data.map($scope.processFeatures);
                }
            },function(err){});
        };

        $scope.upVote = function(f){
            $scope.updateVotes(f,1);
        };

        $scope.downVote = function(f){
            $scope.updateVotes(f,-1);
        };

        $scope.updateVotes = function(f,vote){
            if(f.accepted == true || f.ongoing == true) return; // can't vote on accepted features
            var previousVote = $scope.getVote(f._id);
            if(vote == previousVote) return; // don't cast the same vote twice

            $http.post("/api/vote/", {id: f._id,vote:vote}).then(function(res) {
                if(res.status == 200) {
                    $scope.registerVote(f._id,vote);
                    $scope.updateArrows(f);
                    var changeUp = (vote == 1 ? 1 : 0);
                    var changeDown = (vote == -1 ? 1 : 0);
                    if(vote == 1 && previousVote && previousVote != vote) changeDown = -1;
                    if(vote == -1 && previousVote && previousVote != vote) changeUp = -1;
                    f.upvotes += changeUp;
                    f.downvotes += changeDown;
                }
            },function(err){});
        };

        $scope.hasVoted = function(id){ // check if the client has already voted on a given feature
            return (localStorage.getItem('vote_'+id) !== null);
        };

        $scope.processFeatures = function(f){
            // Comments-related preprocessing
            f.showCommentForm = false;
            f.canComment = true;
            $scope.updateArrows(f);
            return f;
        };

        $scope.updateArrows = function(f){
            // Change arrows based on vote data
            var vote = $scope.getVote(f._id);
            if(vote == 1){
                f.upvoted = true;
                f.downvoted = false;
            }else if(vote == -1){
                f.downvoted = true;
                f.upvoted = false;
            }
        };

        $scope.getVote = function(id){ // returns the vote that the client has cast for a feature (up = 1, down = -1)
            return localStorage.getItem('vote_'+id);
        };

        $scope.registerVote = function(id,change){
            localStorage.setItem('vote_'+id,change);
        };

        $scope.postComment = function(feature) {
            if(feature.comment === undefined || feature.comment.length == 0) return;
            if(!feature.canComment) return;
            feature.canComment = false;
            var comment = {
                comment: feature.comment,
                username: feature.commentUsername
            };
            $http.post("/api/newcomment/", {
                feature: feature._id,
                doc: comment
            }).then(function(res) {
                if(res.status == 201) {
                    feature.showCommentForm = false;
                    feature.comment = '';
                    $scope.getFeatures();
                }
                feature.canComment = true;
            });
        };

        $scope.getFeatures();
        setInterval($scope.getFeatures,2*60*1000);
    }
]);

app.filter('getDelay',function(){
    return function(stamp){
        var diff = (Date.now() - stamp) / 1000;
        if(diff < 60) return Math.round(diff)+' second'+(Math.round(diff) != 1 ? 's' : '');
        diff /= 60;
        if(diff < 60) return Math.round(diff)+' minute'+(Math.round(diff) != 1 ? 's' : '');
        diff /= 60;
        if(diff < 24) return Math.round(diff)+' hour'+(Math.round(diff) != 1 ? 's' : '');
        diff /= 24;
        if(diff < 7) return Math.round(diff)+' day'+(Math.round(diff) != 1 ? 's' : '');;
        diff /= 7;
        if(diff < 4) return Math.round(diff)+' week'+(Math.round(diff) != 1 ? 's' : '');;
        diff /= 4;
        return Math.round(diff)+' month'+(Math.round(diff) != 1 ? 's' : '');
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