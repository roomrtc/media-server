angular.module('videoconference')
  .controller('HomeCtrl', function ($scope, $location, $state, $window, guid) {
    var simpleGuy = new Guy({
      'appendElement': document.getElementById('faceGuy'),
      'color': '#D53972'
    });

    $scope.createRoom = function (roomName) {
      var val = roomName.toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '') || guid();
      $state.go("room.join", {
        roomName: val
      });
    };
  })
  .controller('InfoCtrl', function ($scope, $location) {

    this.createZoom = function (zoom) {
      $location.path('/' + zoom);
    };

    return $scope.InfoCtrl = this;
  })
