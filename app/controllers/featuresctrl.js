app.controller('FeaturesCtrl',[
    '$scope','$http','postWatcher',
    function($scope,$http,postWatcher){
        $scope.features = [];
        $scope.nbFeatures = 0;
        $scope.nbAcceptedFeatures = 0;
        // Sorting-related

        // Filter to decide if a feature should be iterated over by ng-repeat (and thus displayed and taken into consideration
        // by limitTo) or not
        $scope.checkDisplay = function(f){
            return (!f.accepted || $scope.displayAccepted);
        };

        $scope.getPreference = function(parameter,defaultValue){ // Retrieve sorting preferences for localStorage or return a default value
            var pref = localStorage.getItem(parameter);
            if(pref === null) return defaultValue;
            // The following is needed because localStorage stores as text
            if(pref == 'true') return true;
            if(pref == 'false') return false;
            return parseInt(pref);
        };

        $scope.setPreference = function(parameter,value){
            localStorage.setItem(parameter,value);
        };

        $scope.sortProperty = {
            1: 'score',
            2: 'stamp',
            3: 'comments.length'
        };
        $scope.reverse = { // whether each type of sorting is reversed or not (reverse = descending order)
            1: $scope.getPreference('score_reverse',true), // by score
            2: $scope.getPreference('date_reverse',false), // by date
            3: $scope.getPreference('comm_reverse',false) // by comments
        };
        $scope.sortID = $scope.getPreference('sortID',1); // Current sorting method, see sortProperty
        $scope.displayAccepted =  $scope.getPreference('displayAccepted',true); // display accepted features or not

        $scope.changeSort = function(sortID){ // Change the current sorting methid
            if($scope.sortID == sortID) $scope.reverse[sortID] = !$scope.reverse[sortID]; // If re-click on the same sorting button, reverse the order
            $scope.sortID = sortID;
            $scope.setPreference('sortID',$scope.sortID);
            if(sortID == 1) $scope.setPreference('score_reverse',$scope.reverse[1]);
            if(sortID == 2) $scope.setPreference('date_reverse',$scope.reverse[2]);
            if(sortID == 3) $scope.setPreference('comm_reverse',$scope.reverse[3]);
        };

        // Pagination-related
        $scope.featuresPerPage = 10;
        $scope.nbPages = 1;
        $scope.currentPage = 1;

        $scope.makePaginationDummy = function(){ // Make a dummy list for ng-repeat to iterate over
            $scope.paginationDummy = [];
            for(var i = 0; i < $scope.nbPages; i++){
                $scope.paginationDummy.push(i);
            }
        };

        $scope.managePages = function(){ // Compute the number of pages based on preferences
            var nb = ($scope.displayAccepted ? $scope.nbFeatures : $scope.nbFeatures - $scope.nbAcceptedFeatures);
            $scope.nbPages = ($scope.featuresPerPage > 0 ? Math.ceil(nb/$scope.featuresPerPage) : 1);
            $scope.makePaginationDummy();
        };

        $scope.changePage = function(page){
            $scope.currentPage = Math.max(1, Math.min(page, $scope.nbPages));
        };

        $scope.updatePages = function(){ // Reacts to the "display accepted features" box being (un)checked
            $scope.managePages();
            if($scope.currentPage > $scope.nbPages) $scope.changePage($scope.nbPages);
            $scope.setPreference('displayAccepted',$scope.displayAccepted);
        };

        // Get features

        $scope.$watch(function(){ // Watch for the signal that a new feature has been posted, and if yes, refresh features list
            return postWatcher.posted;
        }, function(newValue){
            if(newValue == true) $scope.getFeatures();
        });

        $scope.getFeatures = function(){
            $http.get("/api/features/").then(function(res) {
                if(res.status == 200){
                    if(postWatcher.posted == true) postWatcher.changeState();
                    $scope.features = res.data.map($scope.processFeatures);
                    $scope.managePages();
                }
            },function(err){});
        };

        // Voting-related

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
                    f.score = f.upvotes - f.downvotes;
                }
            },function(err){});
        };

        $scope.hasVoted = function(id){ // check if the client has already voted on a given feature
            return (localStorage.getItem('vote_'+id) !== null);
        };

        $scope.processFeatures = function(f){
            // Comments-related preprocessing
            if(f.comments === undefined) f.comments = [];
            f.showCommentForm = false;
            f.canComment = true;
            // Vote-related
            f.score = f.upvotes - f.downvotes;
            $scope.updateArrows(f);
            // Pagination-related
            $scope.nbFeatures++;
            if(f.accepted) $scope.nbAcceptedFeatures++;
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

        // Comments-related

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