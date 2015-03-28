var mod = angular.module('gophervids-directives', []);

mod.directive('goVideo', [
          '$rootScope', '$window', '$timeout', '$log' , function($rootScope, $window, $timeout, $log) {
          return {
              restrict: 'E',
              replace: false,
              scope: {
                  playlist: "=playlist",
                  index: "=index"
              },
              link: function link(scope, element, attrs) {
                  var id = 0;

                  var player=null;

                  function play(src) {
                      // always initialize new player because of techOrder
                      //
                      var v = $('<video id="' + 'go-video-' + id + '" class="video-js vjs-default-skin" controls preload="auto" width="'+ element.attr('width') +'" height="'+ element.attr('height') +'" />');

                      var setup = {
                            techOrder : [],
                            src: src,
                            autoplay: true
                      };

                      if (src.match(/vimeo/)) {
                          setup.techOrder.push('vimeo');
                      } else if (src.match(/youtube/)) {
                          setup.techOrder.push('youtube');
                      }
                      element.empty().append(v);

                      var player = _V_(v[0].id, setup, function(){
                      });

                      player.on("ended", function(){
                          scope.$apply(function() {
                              scope.index++;
                          });
                      });

                      id++;
                  }

                  function update(newValue, oldValue) {
                  }

                  scope.$watch('playlist', function(newValue, oldValue) {
                      if (newValue==null || scope.index == null) {
                          return;
                      }

                      console.debug(newValue[scope.index].url);
                      play(newValue[scope.index].url);
                  });

                  scope.$watch('index', function(newValue, oldValue) {
                      if (newValue==null || scope.playlist == null) {
                          return;
                      }

                      console.debug(scope.playlist[newValue].url);
                      play(scope.playlist[newValue].url);
                  });
              }
          }
}]);


var app = angular.module('gophervids', ['gophervids-directives', function(){
}]);


app.controller('GopherTVController', ['$scope', '$window', '$http', '$log', function($scope, $window, $http, $log) {
    'use strict';

    $http.get('/static/vids.json').success(function(data) {
        $scope.videos = data.sort(function(a, b) {
            return (a.date == b.date ? 0 : (a.date < b.date ? 1 : -1));
        });
        $log.log($scope.videos.length, 'videos loaded');

        $scope.tags = $scope.getList('tags');
        $scope.speakers = $scope.getList('speakers');

        loadPlaylistFromHash();
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
    $scope.currentIndex = 0;

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
        if (haystack==='recent-talks') {
              $scope.recentTalks();
              return;
        } else if (haystack==='new-videos') {
              $scope.newVideos();
              return;
        } else {
            $scope.currentTag = needle;
            if ($scope.searchText) {
                $scope.searchText.title = '';
            }

            document.location.hash = haystack + '=' + needle;

            var playlist = $scope.filterOn(needle, haystack);
            $scope.loadPlaylist(playlist);
        }
    };

    $scope.loadPlaylist = function(playlist) {
        $scope.currentPlaylist = playlist;
        $scope.currentIndex = 0;
    };

    $scope.playVideo = function(id) {
        $log.log('playing video', id);

        $scope.currentIndex = 0;

        // if it's in our current playlist, jump there
        if ($scope.currentPlaylist) {
            $scope.currentPlaylist.forEach(function(v, k) {
                if (v.id == id) {
                    $scope.currentIndex = k;
                }
            });
        }
    };

    $scope.videoExt = false;

    $scope.showMobileMenu = function(){
      if($scope.showMenu == false){
        $scope.showMenu = true;
      }else{
        $scope.showMenu = false;
      };
    };

    $scope.playTag = function(what) {
        $scope.playSomething(what, 'tags');
    };

    $scope.playSpeaker = function(what) {
        $scope.playSomething(what, 'speakers');
    };

    $scope.recentTalks = function() {
        $scope.currentTag = 'recent-talks';
        document.location.hash = 'recent-talks';
        $scope.loadPlaylist($scope.videos);
    };

    $scope.newVideos = function() {
        $scope.currentTag = 'new-videos';
        var vids = $scope.videos.slice().sort(function(a, b) {
            return (a.added == b.added ? 0 : (a.added < b.added ? 1 : -1));
        });
        document.location.hash = 'new-videos';
        $scope.loadPlaylist(vids);
    };

    $scope.clear = function() {
        $scope.showMenu = false;
        document.location.hash = '';

        $scope.currentPlaylist = [{
            'title': 'Get Started with Go',
            'id': '2KmHtgtEZ1s',
            'url': 'http://www.youtube.com/watch?v=2KmHtgtEZ1s',
            'tags': ["getting-started-with-go"]
        }];

        $scope.currentIndex = 0;
        $scope.currentTag = "Welcome to Go";
    };

    $scope.showFiltered = function(){
      angular.element(".video_lists").show(200);
      angular.element(".list_video_tags").hide(100);
      angular.element(".list_speaker_tags").hide(100);
    };

    $scope.resetActive = function(){
      $scope.deActive(".video_lists","activeMobile");
      $scope.deActive(".list_speaker_tags","activeMobile");
      $scope.deActive(".list_video_tags","activeMobile");
    };

    $scope.deActive = function(tag,css){
      angular.element(tag).removeClass(css);
    };

    $scope.proActive = function(tag,css){
      angular.element(tag).addClass(css);
    };

    $scope.showWall = function(){
      angular.element('.video_lists').show(200);
      $scope.wallOpen = true;
    };

    $scope.hideWall = function(){
      angular.element('.video_lists').hide(200);
      $scope.wallOpen = false;
    };

    $scope.hideFilter = function(){
      $scope.videoExt =false;
      angular.element('.mobile').removeClass(css);
    };

    $scope.wallOpen = false;

    $scope.recentWall = false;
    $scope.speakerWall = false;
    $scope.tagWall = false;

    $scope.recentWall = false;
    $scope.newWall = false;
    $scope.clearWall = false;

    $scope.loadTalks = function(){
        $scope.showWall();
        // $scope.recentTalks();
    };

    $scope.pullUp = function(){
      $scope.videoExt = true;
      angular.element(".list_video_tags").removeClass('pullDown');
      angular.element(".list_speaker_tags").removeClass('pullDown');
      angular.element(".video_lists").removeClass('pullDown');
    };

    $scope.pullDown = function(){
      $scope.videoExt = false;
      angular.element(".list_video_tags").addClass('pullDown');
      angular.element(".list_speaker_tags").addClass('pullDown');
      angular.element(".video_lists").addClass('pullDown');
    };

    $scope.recentMobileTalks = function(){
      // $scope.videoExt = true;
      $scope.pullUp();

      if(!$scope.recentWall){
        $scope.recentTalks();
        $scope.recentWall = true;
        $scope.showWall();
      }else{
        if(!$scope.wallOpen){
          $scope.showWall();
        }else{
          $scope.hideWall();
        }
      }

      $scope.clearWall = false;
      $scope.newWall = false;

      angular.element(".list_video_tags").hide();
      angular.element(".list_speaker_tags").hide();
    };

    $scope.newMobileVideos = function(){
      // $scope.videoExt = true;
      $scope.pullUp();

      if(!$scope.newWall){
        $scope.newVideos();
        $scope.newWall = true;
        $scope.showWall();
      }else{
        if(!$scope.wallOpen){
          $scope.showWall();
        }else{
          $scope.hideWall();
        }
      }

      $scope.recentWall = false;
      $scope.clearWall = false;

      angular.element(".list_video_tags").hide();
      angular.element(".list_speaker_tags").hide();
    };

    $scope.speakerTags = function(){
      $scope.clear();
      // $scope.videoExt = false;
      $scope.pullDown();

      if(!$scope.speakerWall){
        angular.element(".list_speaker_tags").show(200);
        $scope.speakerWall = true;
      }else{
        angular.element(".list_speaker_tags").hide(200);
        $scope.speakerWall = false;
      }

      angular.element(".video_lists").hide(100);
      angular.element(".list_video_tags").hide(100);
    };

    $scope.videoTags = function(){
      $scope.clear();
      // $scope.videoExt = false;
      $scope.pullDown();

      if(!$scope.tagWall){
        angular.element(".list_video_tags").show(200);
        $scope.tagWall = true;
      }else{
        angular.element(".list_video_tags").hide(200);
        $scope.tagWall = false;
      }

      angular.element(".video_lists").hide();
      angular.element(".list_speaker_tags").hide();
    };

    $scope.clearMobile = function(){
      $scope.pullDown();

      if(!$scope.clearWall){
        $scope.clear();
        $scope.clearWall = true;
        $scope.showWall();
      }else{
        if(!$scope.wallOpen){
          $scope.showWall();
        }else{
          $scope.hideWall();
        }
      }

      $scope.recentWall = false;
      $scope.newWall = false;

      angular.element(".list_video_tags").hide();
      angular.element(".list_speaker_tags").hide();
    };

    function loadPlaylistFromHash() {
        var h = document.location.hash;
        var re = /^#(tags|speakers)=([-a-z]+)|(new-videos|recent-talks)/;
        var arr = re.exec(h);
        if (arr) {
            $log.log('grabbing playlist from hash', arr[1] || arr[0], '=', arr[2]);
            $scope.playSomething(arr[2], arr[1] || arr[0]);
        } else {
            $scope.currentPlaylist = [{
                'title': 'Get Started with Go',
                'id': '2KmHtgtEZ1s',
                'url': 'http://www.youtube.com/watch?v=2KmHtgtEZ1s'
            }];

            $scope.currentIndex = 0;
            $scope.currentTag = "Welcome to Go";
        }

    };
}]);
