var mod = angular.module('gophervids-directives', []);
mod.PlayAll = true;

var ColorRand = function(){
    var space = "0123456789ABCDEF".split("");
    var ind = 0, prefix = "#";
    for(ind ;ind < 6; ind++){
      prefix += space[Math.floor(Math.random()*16)];
    }
    return prefix;
};

var Lock = function(){
  var fnlock;
  return {
    own: function(fn){
      if(typeof fn !== 'function') return;
      if(fnlock){
        fnlock();
      }
      fnlock = fn;
    },
    owner: function(fn){
      return fnlock === fn;
    }
  }
};

var DualLock = function(fn,fx){
  if(typeof fn !== 'function') return;
  if(typeof fx !== 'function') return;
  var state = true;
  return {
    swap: function(){
      if(state){
        fn();
        state = false;
      }else{
        fx();
        state = true;
      }
    },
    reset: function(){
      state = true;
    }
  }
}

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

mod.directive('slideBall',['$rootScope',function($rootScope){

  var link = function(scope,element,attrs){

    element.css({
      'position': 'relative',
      'display':"inline-block",
    })

    var ball = $('<ball />');
    ball.css({
      'display':"block",
    });

    element.append(ball);

    element.on('click',function eventHandle(event){

      if(!element.attr('checked')){
        element.attr('checked',true);
        element.addClass('slided');
      }else{
        element.removeAttr('checked');
        element.removeClass('slided');
      }

    });

  };

  return {
    restrict: "A",
    link: link,
  };

}]);

mod.directive('exVideo',['$rootScope', '$window' ,function($rootScope, $window){

  var locked = Lock();

  var build = function(element,src){
    var width = element.attr('width') || "100%";
    var height = element.attr('height') || "100%";
    return $('<video id="' + 'go-video-' + element.attr('id') + '" class="video-js vjs-default-skin" controls preload="auto" width="'
    + width +'" height="'+ height +'" />');
  };

  var link = function(scope,element,attrs){

    var player,
        vids,
        play = element.find('.playButton'),
        show = DualLock(function(){
          element.vids.show(200);
          element.parent().addClass("selected");
          element.parent().parent().addClass("videoSelection");
          if(vids){ vids.show(); }
          try{
            if(player){ player.play(); }
          }catch(err){
            //incase player looses context and startes error
            console.log("player error, possibly context",err,player)
          }
        },function(){
          if(vids){ vids.hide(); }
          try{
            if(player){ player.pause(); }
          }catch(err){
            //incase player looses context and startes error
            console.log("player error, possibly context",err,player)
          }
          element.vids.hide(200);
          element.parent().removeClass("selected");
          element.parent().parent().removeClass("videoSelection");
        }),
        locker = function(){
          if(vids){ vids.hide(); }
          try{
            if(player){ player.pause(); }
          }catch(err){
            //incase player looses context and startes error
            console.log("player error, possibly context",err,player)
          }
          element.vids.hide(200);
          element.parent().removeClass("selected");
          element.parent().parent().removeClass("videoSelected");
        };

    element.on('click',function eventHandle(event){

      var src = element.attr("url");

      console.log("src",element,"url:",src);

      var order = [];

      if(src.match(/vimeo/)){
        order.push('vimeo');
      }else if(src.match(/youtube/)){
        order.push('youtube');
      }

      if(!element.attr('ready')){
        vids = build(element,src);

        element.attr('ready',true);
        element.append(vids);
        element.vids = vids;
        show.swap();

        player = _V_(vids[0].id,{
          src: src,
          techOrder: order,
          autoplay: true,
        },function(){});

        element.player = player;

        player.on("ended",function(){
          if(mod.PlayAll){
            var sib = element.parent().siblings().first();
            if(sib.length > 0){
              sib.find('exvids').trigger('click');
            }
          }
        });

        locked.own(locker);
        // document.location.hash = element.attr('id');
        return;
      }


      if(locked.owner(locker)){
        if(event.target === play[0]){
          console.log('we got button hit');
          show.swap();
        }
      }else{
        show.reset();
        locked.own(locker);
        show.swap();
      }

      // document.location.hash = element.attr('id');

    });

  };

  return {
    restrict: "A",
    link: link,
    replace: false,
  };

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

    $scope.enableAllPlay = function(){
      if(mod.PlayAll){
        mod.PlayAll = false;
      }else{
        mod.PlayAll = true;
      }
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

    $scope.makeColor = function(){
      return ColorRand();
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
