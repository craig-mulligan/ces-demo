var config = require('../env.json');
var app = angular.module('myApp', []).run(function ($rootScope) {
    $rootScope.activeView = "animation-wrapper";
});
var resin = require("resin-sdk");
var fs = require('fs-extra');
var isWindows = require('is-windows');
var exec = require('child_process').exec;
var child;

var w = window.innerWidth;
var h = window.innerHeight;

function objectify(array) {
  result = {}
  for (var i = 0; i < array.length; i++) {
    result[array[i]] = {};
  }
  return result;
}

function animationCtrl($scope, $rootScope, failSafeService) {
  //defaults
  $scope.animationText = '';
  $rootScope.activeView = "animation-wrapper";
  $scope.logo = 'resin-logo.png';
  // shows start button process
  $scope.start = true;

  $scope.start = function() {
    // starts the process
    $rootScope.$broadcast('start_selector');
    $scope.hasStarted = true;
  }

  $scope.$on('pre_start', function(event) {
    console.log('load');
    $rootScope.activeView = "animation-wrapper";
    $scope.logo = 'resin-logo.png';
    $scope.hasStarted = false;
  });

  $scope.$on('commit', function(event) {
    $rootScope.activeView = "animation-wrapper";
    console.log("commiting");
    $(".element").typed({
      strings: ["$ git commit -a -m 'new image'", "$ git push resin master"],
      typeSpeed: 25,
      callback: function() {
        setTimeout(function() {
          $('.animation h1').html('<span class="element"></span>');
          $rootScope.$broadcast('start_build');
        }, 2000);
      },
    });
   });

  $scope.$on('start_countdown', function(event) {
    $rootScope.activeView = "animation-wrapper";
    $(".element").typed({
      strings: ["YOU JUST UPDATED", 'A FLEET OF DEVICES', 'IN SEATTLE',
        " <b class='noise'>NICE !!!</b>"
      ],
      typeSpeed: 50,

      callback: function() {
        setTimeout(function() {
          // $rootScope.$broadcast('start_tts');
          $('.animation h1').html('<span class="element"></span>');
          $rootScope.$broadcast('pre_start');
        }, 5000);
      },
    });
  });
}


function terminalCtrl($scope, $rootScope, failSafeService) {
  var $cont = $('#tty');
  $cont[0].scrollTop = $cont[0].scrollHeight;
  $scope.$on('start_build', function(event) {

    $rootScope.activeView = "tty-wrapper";
    // run push script and pass path to simple-beast-demo

    if (isWindows()) {
      var script = __dirname + '/push.cmd'
      var cmd = 'cmd.exe';
    } else {
      var script = __dirname + '/push.sh'
      var cmd = 'bash'
    }

    $scope.stderr = []

    var util  = require('util'),
        spawn = require('child_process').spawn,
        command    = spawn('bash', [script]);

    command.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
      $scope.stderr.push(data.toString('utf8'));
      $cont[0].scrollTop = $cont[0].scrollHeight;
    });

    command.on('exit', function (code) {
      console.log("exit");
      setTimeout(function () {
        $rootScope.$broadcast('start_download');
      }, 10);
    });
  });
}


function selectorCtrl($scope, $rootScope, failSafeService) {
  $scope.$on('start_selector', function(event) {
    $rootScope.activeView = "selector-wrapper";
    // declare image options it must have a corresponding raw file in the same dir;
    $scope.images = ["ces", "ericsson", "resin"];
    $scope.select = function(image) {
      $scope.selection = image;
    };

    $scope.changeRepo = function(){
      fs.copy(__dirname + '/images/'+ $scope.selection + '.raw', '../simple-beast-fork/images/image.raw', function (err) {
        if ($scope.selection == null) {
          $scope.warning = "you first need to select an image"
          return;
        } else {
          if (err) return console.error(err)
          console.log("code change success!")
          $rootScope.$broadcast('commit');
        }
      }) // copy image file
    }
  });
}

function devicesCtrl($scope, $rootScope, devicesService, failSafeService) {
  $scope.$on('start_download', function(event) {
    console.log("download starting");
    $rootScope.activeView = "devices-wrapper";
    $scope.devices = devicesService.data;

    console.log(devicesService.data.resp);
    var startedDownloading = false;

    $scope.$watch('devices', function(newDevices, oldDevice) {

      var allIdle = newDevices.resp.every(Idle)

      var Downloading = newDevices.resp.some(downloading)

      var allDownloading = newDevices.resp.every(downloading)

      function downloading(device) {
        if (device.status == "Downloading") {
          return true;
        }
      }

      function Idle(device) {
        if (device.status == "Idle") {
          return true;
        }
      }

      if (Downloading) {
        console.log("started downloading");
        startedDownloading = true;
      }

      if (startedDownloading && allIdle) {
          console.log("ready");
          console.log('download complete');
          startedDownloading = false
          $rootScope.$broadcast('start_countdown');
      }
    }, true);
  });
}
