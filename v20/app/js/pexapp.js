'use strict';

angular.module('pexapp', [
    'ngStorage',
    'pascalprecht.translate',
    'bernhardposselt.enhancetext',
    'pasvaz.bindonce'
])

.config(function($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);
  })

.config(function($translateProvider) {
    $translateProvider.useStaticFilesLoader({
        prefix: '',
        suffix: ''
    });
    $translateProvider.useSanitizeValueStrategy('escaped');
    $translateProvider.fallbackLanguage('languages/en-us.json');
    $translateProvider.preferredLanguage('languages/en-us.json');
    $translateProvider.useStorage('pexStorageService');
})

.config(['enhanceTextFilterProvider', function(enhanceTextFilterProvider) {
    enhanceTextFilterProvider.setOptions({
        cache: true, // stores replaced text so angular update does not slow down
        newLineToBr: true, // replaces \n with <br/>
        embedLinks: true, // replaces links with Html links
        embeddedLinkTarget: '_blank', // sets the target of all replaced links
        embedImages: true, // replaces links to images with Html images
        embedVideos: true, // replaces links to videos with Html videos
        embedYoutube: true, // replaces links to youtube videos with iframed youtube videos
        // embeddedYoutubeHeight: 157,
        // embeddedYoutubeWidth: 280,
        // embeddedImagesHeight: 157,
        // embeddedVideosHeight: 157
    });
}])

.config(function($animateProvider) {
    $animateProvider.classNameFilter(/ng-enable-animate/);
})

.factory('regPwdService', function($localStorage) {
    function encrypt(key, password) {
        return window.btoa(window.unescape(encodeURIComponent(password)));
    }

    function decrypt(key, password) {
        return decodeURIComponent(window.escape(window.atob(password)));
    }

    function loadRegPwd() {
        var encrypted = $localStorage.registrationPassword;
        return encrypted ? decrypt(null, encrypted) : '';
    }

    function saveRegPwd(password) {
        $localStorage.registrationPassword = encrypt(null, password || '');
    }

    return {
        load: loadRegPwd,
        save: saveRegPwd
    };
})

.run(function(
    $rootScope,
    $log,
    $localStorage,
    $translate,
    $location,
    platformSettings,
    applicationSettings,
    serverSettings,
    defaultUserSettings,
    callHistory,
    globalService,
    regPwdService) {

    $rootScope.platformSettings = platformSettings;
    $rootScope.applicationSettings = applicationSettings;
    $rootScope.serverSettings = serverSettings;
    $rootScope.callHistory = callHistory;
    $rootScope.globalService = globalService;

    $rootScope.loadRegPwd = regPwdService.load;
    $rootScope.saveRegPwd = regPwdService.save;

    $rootScope.regexIpHost = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3})$|^((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]))$/;

    if (!window.console) {
        window.console = {};
    }
    if (!window.console.log) {
        window.console.log = $log.log;
    }

    function isLocalStorageValid() {
        // TODO: FIXME: sanity check theme etc.

        var isLanguageValid = false;
        angular.forEach(applicationSettings.languages, function(language) {
            if ($localStorage.language === language) {
                isLanguageValid = true;
            }
        });
        if (!isLanguageValid) {
            $log.error('localStorage.language invalid', $localStorage.language);
        }

        var isSettingsVersionValid = $localStorage.settingsVersion === defaultUserSettings.settingsVersion;
        if (!isSettingsVersionValid) {
            $log.error('settingsVersion mismatch', $localStorage.settingsVersion);
        }

        return isLanguageValid && isSettingsVersionValid;
    }

    if (!isLocalStorageValid()) {
        $log.debug('Resetting local settings');
        $localStorage.$reset(defaultUserSettings);
    }
    $rootScope.localStorage = $localStorage.$default(defaultUserSettings);
    $translate.use($localStorage.language);

    if (applicationSettings.clearLastUsed === true) {
        delete $localStorage.conference;
        delete $localStorage.name;
    }

    if (!platformSettings.hasWebRTC) {
        var new_bws = [];
        for (var i = 0; i < applicationSettings.bandwidths.length; i++) {
            var bw = applicationSettings.bandwidths[i];
            if (bw['value'] <= 1864) {
                new_bws.push(bw);
            }
        }
        $rootScope.applicationSettings.bandwidths = new_bws;
    }

    $rootScope.params = angular.extend({}, {
        conference: $localStorage.conference,
        name: $localStorage.name,
        media: $localStorage.media,
        audioonly: $localStorage.audioonly,
        forceFlash: false
    }, $location.search());
    if ($rootScope.params.role === 'guest') {
        $rootScope.params.pin = '';
    }

    if ($rootScope.params.bw && isFinite($rootScope.params.bw)) {
        $localStorage.defaultBandwidth = parseInt($rootScope.params.bw);
    }

    if ($localStorage.defaultBandwidth == 0) {
        $rootScope.params.media = false;
        $rootScope.params.audioonly = false;
    } else if ($localStorage.defaultBandwidth <= 64) {
        $rootScope.params.media = true;
        $rootScope.params.audioonly = true;
    }
})

.factory('pexStorageService', function($localStorage) {
    return {
        put: function(name, value) {
            // $localStorage.language = value;
        },
        get: function(name) {
            return $localStorage.language;
        }
    };
})

.filter('boolToHuman', function() {
    return function(val) {
        return val ? 'IDS_YES' : 'IDS_NO';
    };
})

.filter('values', function($filter) {
    return function(object) {
        var values = [];
        angular.forEach(object, function(value) {
            values.push(value);
        });
        return values;
    };
})

.filter('unsafe', function() {
    return function(value) {
        return value.toString();
    };
})

.filter('keyHumanReadable', [
    function() {
        return function(input) {
            var out = input.replace('_', ' ').replace('-', ' ');
            return out.charAt(0).toUpperCase() + out.slice(1);
        };
    }
])

.directive('pexVolume', function($log, $localStorage) {
    return {
        scope: {
            setOutputDevice: '=',
            pexVolume: '=',
        },
        link: function($scope, element, attrs) {
            var domElement = element[0];

            $scope.$watch('pexVolume', function(value) {
                $log.debug('Setting volume to', $scope.pexVolume);
                domElement.volume = $scope.pexVolume;
                $localStorage.volume = $scope.pexVolume;
            });

            var setOutputDevice = function() {
                var audioOutput = $localStorage.audioOutputId || '';
                $log.debug('Setting audio output:', audioOutput);

                // Workaround for nwjs: need to stop playing before setting sink
                domElement.onplay = undefined;
                var src = domElement.src;
                domElement.src = '';

                domElement.setSinkId(audioOutput)
                    .then(function() {
                        $log.debug('Audio output sat to', audioOutput);
                    })
                    .catch(function(error) {
                        $log.error('Unable to set audio output', error);
                    })
                    .then(function() {
                        // Workaround for nwjs (bis): resume playing the video
                        domElement.src = src;
                    });
            };

            if (domElement.setSinkId) {
                domElement.onplay = setOutputDevice;
                $scope.setOutputDevice = setOutputDevice;
            }
        }
    };
})

.directive('pexLocalstream', function() {
    return {
        link: function($scope, element, attrs) {
            var domElement = element[0];

            if (!$scope.localMediaStreamURL) {
                domElement.srcObject = $scope.localMediaStream;
            }

            $scope.$watch('localMediaStream', function(newValue, oldValue) {
                if ($scope.localMediaStream && !$scope.localMediaStreamURL) {
                    domElement.srcObject = $scope.localMediaStream;
                }
            });
        }
    };
})

.directive('pexSrcobject', function() {
    return {
        link: function($scope, element, attrs) {
            var domElement = element[0];
            var stream = attrs['pexSrcobject'];

            if (stream == 'presentationVideoSrc' && typeof(MediaStream) !== "undefined" && $scope.call[stream] instanceof MediaStream) {
                domElement.srcObject = $scope.call[stream];
            } else if (typeof(MediaStream) !== "undefined" && $scope.connection[stream] instanceof MediaStream) {
                domElement.srcObject = $scope.connection[stream];

                $scope.$watch('connection.' + stream, function(newValue, oldValue) {
                    if ($scope.connection[stream] instanceof MediaStream) {
                        domElement.srcObject = $scope.connection[stream];
                    }
                });
            }
        }
    };
})

.directive('pexDraggable', function() {
    return {
        link: function($scope, element, attrs) {
            element.draggable();
        }
    };
})

.filter('numkeys', function() {
    return function(obj) {
        if (angular.isObject(obj)) {
            return Object.keys(obj).length;
        }
    };
})

.directive('pexNoEmailValidation', function(){
    return {
        require : 'ngModel',
        link : function(scope, element, attrs, ngModel) {
            ngModel.$validators.email = function () {
                return true;
            };
        }
    };
});
