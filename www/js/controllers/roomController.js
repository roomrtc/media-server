angular.module("videoconference").controller("roomController", function ($rootScope, $scope, $window, $timeout, $sce, fluidGrid) {
    $scope.localVideo = null;
    $scope.remoteVideos = {};
    $scope.isConnected = false;
    $scope.clients = {};
    $scope.link2Share = 'roomrtc.com/' + $scope.$stateParams.roomName;

    var shuffle = fluidGrid('#remotes >');
    var room = $scope.$stateParams.roomName
    var roomRTC = new RoomRTC({
        url: '/',
        connectMediaServer: true
    });

    function joinMediaServer(room) {
        roomRTC.joinMediaServer(room)
            .then(data => {
                console.log('joinMediaServer ok!', data);
            })
            .catch(err => {
                console.error('joinMediaServer error: ', err);
            });
    }

    $scope.shuffle = shuffle;
    angular.element($window).bind('resize', shuffle);

    $rootScope.$on("$locationChangeStart", function (event, next, current) {
        roomRTC.stop();
    });

    roomRTC.on("readyToCall", function (id) {
        console.log("readyToCall, connectionId: ", id);
        return joinMediaServer(room);
    });

    roomRTC.on("connected", function (id) {
        $scope.isConnected = true;
        console.log("connected connectionId: ", id);
        roomRTC.initMediaSource()
            .then(stream => {
                var streamUrl = roomRTC.getStreamAsUrl(stream);
                $timeout(function () {
                    $scope.localVideo = $sce.trustAsResourceUrl(streamUrl);
                    // joinMediaServer(room);
                });
                return roomRTC.joinRoom(room);
            })
            .then((roomData) => {
                $timeout(function () {
                    $scope.isConnected = true;
                    $scope.clients = roomData.clients;
                    // return joinMediaServer(room);
                });
            })
            .catch(err => {
                console.error("joinRoom error: ", err);
            });
    });

    roomRTC.on("peerCreated", function (peer) {
        $timeout(function () {
            $scope.clients[peer.id] = peer.resources;
        })
    });

    // roomRTC.on("peerStreamRemoved", function (peer, stream) {
    //     console.log('peerStreamRemoved', peer.id, stream.id);
    //     let sid = stream.id;
    //     $timeout(() => {
    //         delete $scope.remoteVideos[sid];
    //     })
    // });

    roomRTC.on("videoAdded", function (pc, stream) {
        // var pid = (pc.id || pc.sid) + ((stream && stream.id) || "_stream");
        var sid = stream.id;
        console.log("Ohh, we have a new participant", pc.id, sid);
        $timeout(function () {
            var streamUrl = roomRTC.getStreamAsUrl(stream);
            var trustUrl = $sce.trustAsResourceUrl(streamUrl);
            $scope.remoteVideos[sid] = trustUrl;
            // $scope.clients[pid] = pc.resources;
        })

        $timeout(shuffle);

    });

    roomRTC.on("videoRemoved", function (pc, stream) {
        // var pid = (pc.id || pc.sid) + ((pc.stream && pc.stream.id) || "_stream");
        var sid = stream.id;
        var url = $scope.remoteVideos[sid];
        roomRTC.revokeObjectURL(url);
        console.log("Ohh, a participant has gone", pc.id, sid);
        $timeout(function () {
            // remove url from remoteVideos
            delete $scope.remoteVideos[sid];
            // delete $scope.clients[sid];
        });
        
        $timeout(shuffle);
    });

    /**
     * Setup control buttons
     * */
    $scope.stop = function () {
        $scope.localVideo = null;
        roomRTC.stop();
    }

    $scope.start = function () {
        roomRTC.initMediaSource().then(stream => {
            var streamUrl = roomRTC.getStreamAsUrl(stream);
            $timeout(function () {
                $scope.localVideo = $sce.trustAsResourceUrl(streamUrl);
            });
        });
    }

    $scope.handleVideoClick = function (e) {
        if (e.target.id == 'localVideo') return;

        // e.target is the video element, we want the container #remotes > div > div
        var container = angular.element(e.target).parent().parent();
        var alreadyFocused = container.hasClass('focused');
        angular.element('.videocontainer').removeClass('focused');

        if (!alreadyFocused) {
            container.addClass('focused');
            $scope.shuffle(container.get(0));
        } else {
            // clicking on the focused element removes focus
            $scope.shuffle();
        }
    };
});