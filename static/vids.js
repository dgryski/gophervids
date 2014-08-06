function GopherTVController($scope, $window, $http, $log) {
    'use strict';

    $http.get('/static/vids.json').success(function(data) {
        $scope.videos = data.sort(function(a, b) {
            return (a.date == b.date ? 0 : (a.date < b.date ? 1 : -1));
        });
        $log.log($scope.videos.length, 'videos loaded');

        $scope.tags = $scope.getList('tags');
        $scope.speakers = $scope.getList('speakers');
    });


    $scope.filterOn = function(needle, haystack) {
        return $scope.videos.filter(function(v) {
            return (v[haystack].indexOf(needle) >= 0);
        });
    };

    $scope.getList = function(what) {
        var all = {};
        $scope.videos.forEach(function(v) {
            v[what].forEach(function(t) {
                all[t] = 1 + (all[t] || 0);
            });
        });
        var k = Object.keys(all).sort();
        return k.map(function(item) {
            return {
                item: item,
                count: all[item]
            };
        });
    };

    $scope.currentPlaylist = null;

    $scope.sidebarVideoList = function() {
        if ($scope.currentPlaylist) {
            return $scope.currentPlaylist;
        }

        if ($scope.searchText && $scope.searchText.title) {
            return $scope.videos;
        }

        return null;
    };

    $scope.playSomething = function(needle, haystack) {
        $log.log('playing', haystack, needle);
        $scope.currentTag = needle;
        if ($scope.searchText) {
            $scope.searchText.title = '';
        }

        document.location.hash = haystack + '=' + needle;

        var playlist = $scope.filterOn(needle, haystack);
        $scope.loadPlaylist(playlist);
    };

    $scope.loadPlaylist = function(playlist) {
        $scope.currentPlaylist = playlist;
        var ids = playlist.map(function(v) {
            return v.id;
        });
        $window.player.cuePlaylist(ids);
        $window.player.playVideo();
    };

    $scope.playVideo = function(id) {
        $log.log('playing video', id);

        // if it's in our current playlist, jump there
        if ($scope.currentPlaylist) {
            $scope.currentPlaylist.forEach(function(v, k) {
                if (v.id == id) {
                    window.player.playVideoAt(k);
                }
            });
        }

        // not in the current playlist
        window.player.loadVideoById(id);
    };


    $scope.playTag = function(what) {
        $scope.playSomething(what, 'tags');
    };

    $scope.playSpeaker = function(what) {
        $scope.playSomething(what, 'speakers');
    };

    $scope.recentTalks = function() {
        $scope.currentTag = 'recent-talks';
        $scope.loadPlaylist($scope.videos);
    };

    $scope.newVideos = function() {
        $scope.currentTag = 'new-videos';
        var vids = $scope.videos.slice().sort(function(a, b) {
            return (a.added == b.added ? 0 : (a.added < b.added ? 1 : -1));
        });
        $scope.loadPlaylist(vids);
    };

    $scope.clear = function() {
        $scope.currentPlaylist = null;
        $scope.currentTag = null;
        document.location.hash = '';
    };

    $window.loadPlaylistFromHash = function() {
        var h = document.location.hash;
        var re = /^#(tags|speakers)=([-a-z]+)/;
        var arr = re.exec(h);
        if (arr) {
            $log.log('grabbing playlist from hash', arr[1], '=', arr[2]);
            $scope.playSomething(arr[2], arr[1]);
            $scope.$apply();
        }
    };
}
