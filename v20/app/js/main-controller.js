'use strict';
/* global angular, require, $ */

if (window.location.search) {
    if (!window.location.origin) {
        window.location.origin =
            window.location.protocol + '//' +
            window.location.hostname +
            (window.location.port ? ':' + window.location.port : '');
    }
    window.location.href =
        window.location.origin +
        window.location.pathname +
        '#/' + window.location.search;
}

angular.module('pexapp')

.filter('removeValues', function() {
    return function(obj, values) {
        var result = [];
        angular.forEach(obj, function(value, key) {
            if (values.indexOf(value) === -1) {
                result.push(value);
            }
        });
        return result;
    };
})

.controller('MainController', function(
    $rootScope,
    $scope,
    $log,
    $sce,
    $q,
    $localStorage,
    $window,
    $timeout,
    $location,
    $translate,
    platformSettings,
    applicationSettings,
    defaultUserSettings,
    serverSettings,
    toast,
    modal,
    callHistory,
    Call,
    srvService,
    toggleService,
    dialHistory,
    flashVideo,
    mediaDevicesService,
    reportingService) {

    $scope.dialHistory = dialHistory;
    $scope.flashVideo = flashVideo;
    $scope.toggle = toggleService.toggle;
    $scope.toastMessages = toast.messages;
    $scope.getModalMessage = modal.getMessage;
    $scope.errorMessage = null;
    $scope.plugins = applicationSettings.plugins;

    if (navigator.userAgent.indexOf("Chrome") != -1) {
        $scope.chrome_ver = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
    } else {
        $scope.chrome_ver = 0;
    }

    if (navigator.userAgent.indexOf("Firefox") != -1) {
        $scope.firefox_ver = parseInt(window.navigator.userAgent.match(/Firefox\/(\d+)\./)[1], 10);
        if ($scope.firefox_ver > 51 || applicationSettings.firefoxScreensharing === true) {
            platformSettings.screenshareSupported = true;
        }
    } else {
        $scope.firefox_ver = 0;
    }

    if (navigator.userAgent.indexOf("Edge") != -1) {
        $scope.edge_ver = parseInt(window.navigator.userAgent.match(/Edge\/\d+\.(\d+)/)[1], 10);
        $scope.chrome_ver = 0;
    } else {
        $scope.edge_ver = 0;
    }

    if ($scope.chrome_ver == 0 && navigator.userAgent.indexOf("Safari") != -1) {
        $scope.safari_ver = parseInt(window.navigator.appVersion.match(/Safari\/(\d+)\./)[1], 10);
        platformSettings.screenshareSupported = false;
    } else {
        $scope.safari_ver = 0;
    }

    $scope.update = function() {
        $scope.$apply(function() {});
    };

    if ($scope.edge_ver > 10527) {
        var adapterScript = document.createElement('script');
        document.body.appendChild(adapterScript);
        adapterScript.src = $sce.trustAsResourceUrl('js/vendor/adapter.js');
        platformSettings.hasWebRTC = true;
        platformSettings.realHasWebRTC = true;
        if ($scope.edge_ver < 14393 || $scope.safari_ver > 0) {
            applicationSettings.enableFullMotionPresentation = false;
        }
    }

    $scope.forceFlashChanged = function() {
        if ($scope.params.forceFlash) {
            platformSettings.hasWebRTC = false;
        } else {
            platformSettings.hasWebRTC = platformSettings.realHasWebRTC;
        }
    };
    $scope.forceFlashChanged();

    function loadPexRTC(host) {
        var deferred = $q.defer();
        var pexrtcScript = document.createElement('script');
        document.body.appendChild(pexrtcScript);
        pexrtcScript.onload = deferred.resolve;
        pexrtcScript.onerror = deferred.reject;
        pexrtcScript.src = $sce.trustAsResourceUrl('https://' + host + '/static/webrtc/js/pexrtc.js');
        $log.log('Loading pexrtc', pexrtcScript.src);
        return deferred.promise;
    }

    $scope.getSelectedDevices = function() {
        var devices = [];
        if ($localStorage.cameraSourceId) {
            devices.push({
                kind: 'video',
                id: $localStorage.cameraSourceId
            });
        }
        if ($localStorage.microphoneSourceId) {
            devices.push({
                kind: 'audio',
                id: $localStorage.microphoneSourceId
            });
        }
        if ($localStorage.audioOutputId) {
            devices.push({
                kind: 'output',
                id: $localStorage.audioOutputId
            });
        }
        return devices;
    };

    $scope.resetInvalidDevices = function() {
        var devices = $scope.getSelectedDevices();
        return mediaDevicesService.getInvalidDevices(devices)
            .then(function(result) {
                angular.forEach(result.invalidDevices, function(invalidDevice) {
                    switch (invalidDevice.kind) {
                        case 'video':
                            $localStorage.cameraSourceId = (result.validDevices.video.length) ? null : false;
                            break;
                        case 'audio':
                            $localStorage.microphoneSourceId = null;
                            break;
                        case 'output':
                            $localStorage.audioOutputId = null;
                            break;
                    }
                });
                return result.invalidDevices;
            });
    };

    $scope.loginApp = function(alias, displayName, skipDeviceSelectionDialog) {
        $log.log('loginApp', alias, displayName, skipDeviceSelectionDialog);

        $scope.resetInvalidDevices()
            .then(function(invalidDevices) {
                if (invalidDevices.length || (!skipDeviceSelectionDialog && $scope.params.media && $scope.localStorage.promptMedia)) {
                    $log.log('Showing escalate dialog');
                    $scope.params.name = displayName;
                    $scope.params.conference = alias;
                    $scope.toggle('dialog-escalate', true);
                    return;
                }
                if ($scope.globalService.join) {
                    $scope.globalService.join(alias, displayName, undefined, undefined, $scope.params.media, $scope.params.audioonly);
                    $scope.params.conference = '';
                } else {
                    $scope.login(alias, displayName);
                }
            });
    };

    $scope.setErrorMessage = function(message) {
        $scope.errorMessage = message;
        if (platformSettings.isAndroidClient) {
            $translate(message).then(function(result) {
                window.srv.service('toast', result);
            });
        }
    };

    function resetConnection() {
        $scope.connection = {
            participants: {},
            stage: [],
            participantAdd: function(uri, protocol, role, userParams) {
                dialHistory.add(uri, protocol, role);
                if (typeof userParams === 'string') {
                    userParams = {
                        presentation_uri: userParams
                    };
                }
                reportingService.send(
                    'dialParticipant', {
                        protocol: protocol,
                        role: role,
                        uuid: $scope.connection.data.uuid,
                        usedPresentation: userParams && userParams.presentation_uri ? true : false
                    },
                    $scope.connection.data.analyticsEnabled);

                $scope.call.participantAdd(uri, protocol, role, userParams);
            },
            participantAddDone: function() {
                $timeout(function() {
                    delete $scope.connection.dialOutState;
                }, 2500);
            },
            participantAddCancel: function() {
                angular.forEach($scope.connection.dialOutState.result, function(uuid) {
                    $scope.call.participantDisconnect({
                        uuid: uuid
                    });
                });
                delete $scope.connection.dialOutState;
            },
            participantAddIgnore: function() {
                delete $scope.connection.dialOutState;
            },
            participantToggleMute: function(participant) {
                $scope.call.participantToggleMute(participant);
            },
            participantUnlock: function(participant) {
                $scope.call.participantUnlock(participant);
            },
            participantTransfer: function(participant, conference_alias, role, pin) {
                $scope.call.participantTransfer(participant, conference_alias, role, pin,
                    function(result) {
                        if (!result) {
                            modal.alert('IDS_TRANSFER_FAILED');
                        }
                    });
            },
            participantDisconnect: function(participant) {
                $translate([
                    'IDS_PARTICIPANT_DISCONNECT',
                    'IDS_PARTICIPANT_DISCONNECT_MESSAGE'
                ], {
                    displayName: participant.displayName
                }).then(function(translations) {
                    modal.confirm(
                        translations.IDS_PARTICIPANT_DISCONNECT,
                        translations.IDS_PARTICIPANT_DISCONNECT_MESSAGE,
                        function() {
                            $scope.call.participantDisconnect(participant);
                        },
                        null,
                        'IDS_BUTTON_DISCONNECT');
                });
            },
            disconnectAll: function() {
                modal.confirm(
                    'IDS_CONFERENCE_DISCONNECT_ALL',
                    'IDS_CONFERENCE_DISCONNECT_ALL_MESSAGE',
                    function() {
                        $scope.call.disconnectAll();
                    },
                    null,
                    'IDS_BUTTON_DISCONNECT');
            },
            toggleCamera: function() {
                $scope.connection.cameraEnabled = !$scope.call.toggleCamera();
            }
        };
    }

    var deferredHistoryEntry;

    $scope.login = function(alias, displayName, pin, token, extension) {
        $log.debug('$scope.login', alias, displayName, pin, token);

        $localStorage.media = $scope.params.media;
        $localStorage.audioonly = $scope.params.audioonly;

        $localStorage.conference = alias;
        if (!platformSettings.isAndroidClient) {
            $localStorage.name = displayName;
        }
        $scope.errorMessage = '';

        if (!displayName) {
            $scope.setErrorMessage('IDS_SETTINGS_DISPLAY_NAME_PLACEHOLDER');
            return;
        }

        $scope.loadingConference = true;
        reportingService.send('callPlaced', null, serverSettings.analyticsReportingEnabled);

        if ($scope.call) {
            $log.debug('$scope.login: setting pin');
            $scope.call.connect(pin, extension);
            return;
        } else if (!$scope.connection) {
            resetConnection();

            var uri = $localStorage.defaultDomain && alias.search('@') < 0 ? alias + '@' + $localStorage.defaultDomain : alias;
            var vmrDetailsPromise = $scope.params.host ? $q.when([$scope.params.host]) : srvService.getVmrDetails(uri);
            vmrDetailsPromise.then(function(servers) {
                servers = $.unique(servers.filter(function(value) {
                    return !!value;
                }));
                $log.log('Got servers ' + servers);

                function tryNextServer() {
                    var server = servers.shift();
                    if (server) {
                        $log.log('Trying connection to', server);
                        loadPexRTC(server).then(function() {
                            if (applicationSettings.scripts) {
                                for (var i = 0; i < applicationSettings.scripts.length; i++) {
                                    var scriptElement = document.createElement('script');
                                    document.body.appendChild(scriptElement);
                                    scriptElement.src = applicationSettings.scripts[i];
                                }
                            }
                            deferredHistoryEntry = function() {
                                callHistory.add(
                                    $scope.params.remote_alias || uri,
                                    $scope.getConferenceAvatarUrl($scope.params.remote_alias || uri, server),
                                    $scope.params.remote_alias ? 'incoming' : 'outgoing');
                                deferredHistoryEntry = null;
                            };
                            if ($scope.params.remote_alias) {
                                deferredHistoryEntry();
                            }
                            $scope.call = new Call(
                                server,
                                uri,
                                displayName,
                                token,
                                $localStorage.registrationToken);
                        }, function(err) {
                            $log.log('Connection to', server, 'failed');
                            tryNextServer();
                        });
                    } else {
                        $log.log('Failed to load pexrtc');
                        $scope.errorMessage = 'IDS_CONNECTION_FAILED';
                        $scope.disconnect();
                    }
                }

                tryNextServer();
            });
        }
    };

    $scope.startMediaCall = function() {
        /* global swfobject */
        $log.log('startMediaCall');
        $scope.connection.connectingMedia = true;
        reportingService.send('escalate', {
                uuid: $scope.connection.data.uuid,
                audio: true,
                video: $scope.params.audioonly ? false : true,
                bandwidth: $localStorage.defaultBandwidth
            },
            $scope.connection.data.analyticsEnabled);

        if (!$scope.platformSettings.hasWebRTC) {
            $scope.useFlash = true;
            var unsubscribe = $rootScope.$on('flash::ready', function() {
                $log.debug('flash::ready');
                var flashElement = swfobject.getObjectById('flashvideo');
                unsubscribe();
                $scope.call.startCall(
                    $scope.params.audioonly ? 'audioonly' : 'rtmp',
                    $localStorage.cameraSourceId,
                    $localStorage.microphoneSourceId,
                    flashElement);
            });
        } else {
            $timeout(function() {
                $scope.call.startCall(
                    $scope.params.audioonly ? 'audioonly' : 'video',
                    $localStorage.cameraSourceId,
                    $localStorage.microphoneSourceId);
            }, 700); // Make sure the preview has released media
        }
    };

    $scope.disconnect = function(navigate, reason) {
        $log.debug('$scope.disconnect', navigate, reason);

        if ($scope.call) {
            if ($scope.call.presentationWindow) {
                $scope.call.presentationWindow.close(true);
                $scope.call.presentationWindow = null;
            }

            $scope.call.disconnect(reason);
        }
        if ($scope.errorMessage !== 'Call Failed: Invalid PIN') {
            delete $scope.pinRequested;
            delete $scope.extensionRequested;
        }
        if (navigate) {
            if (platformSettings.isDesktopClient && !$scope.errorMessage) {
                window.close();
            } else {
                window.location.href = window.location.href.split('#')[0];
            }
        } else {
            delete $scope.loadingConference;
            delete $scope.params.pin;
            delete $scope.params.extension;
            delete $scope.call;
            delete $scope.connection;
        }
    };

    $scope.cancelLogin = function() {
        delete $scope.errorMessage;
        $scope.disconnect(platformSettings.isDesktopClient);
    };

    var _oldOnBeforeUnload = window.onbeforeunload;
    window.onbeforeunload = function() {
        $log.debug('MainController onbeforeunload');
        if (angular.isFunction(_oldOnBeforeUnload)) {
            _oldOnBeforeUnload();
        }
        $scope.disconnect(false, 'Browser closed');
    };

    $scope.$on('$destroy', function() {
        $log.debug('$destroy');
        $scope.disconnect();
    });

    if (window._initDesktopClientWindowHandlers) {
        window._initDesktopClientWindowHandlers($scope);
    }

    $scope.getConferenceAvatarUrl = function(alias, host) {
        return 'https://' + (host || document.domain) + '/api/client/v2/conferences/' + alias + '/avatar.jpg';
    };

    $scope.$on('call::pinRequested', function(event, required) {
        $log.debug('call::pinRequested', required);
        delete $scope.extensionRequested;
        $scope.loadingConference = false;
        if (angular.isDefined($scope.params.pin) || $scope.pinRequested) {
            $scope.call.connect($scope.params.pin);
            delete $scope.params.pin;
            $scope.loadingConference = true;
        }
        $scope.pinRequested = {
            required: required,
            role: required ? null : $scope.params.role || 'guest'
        };
    });

    $scope.$on('call::extensionRequested', function(event, required) {
        $log.debug('call::extensionRequested', required);
        $scope.loadingConference = false;
        if (angular.isDefined($scope.params.extension) || $scope.extensionRequested) {
            $scope.call.connect(null, $scope.params.extension);
            delete $scope.params.extension;
            $scope.loadingConference = true;
        }
        $scope.extensionRequested = {
            required: required
        };
    });

    $scope.$on('call::disconnected', function(event, reason) {
        modal.alert('IDS_MESSAGE_DISCONNECTED', reason ? reason : 'Media process disconnected', function() {
            delete $scope.errorMessage;
            $scope.disconnect(true);
        });
    });

    $scope.$on('call::connected', function(event, data) {
        $timeout(function() {
            reportingService.send(
                'callConnected', {
                    uuid: data.uuid
                },
                data.analyticsEnabled);
            $log.debug('call::connected', data);

            if (!$scope.params.media && $scope.params.escalate) {
                delete $scope.params.escalate;
                $scope.toggle('dialog-escalate', true);
            }

            if (angular.isFunction(deferredHistoryEntry)) {
                deferredHistoryEntry();
            }

            $scope.connection.data = data;
            $scope.connection.data.isChair = $scope.params.forceguest ? false : data.isChair;

            var conferenceHasMedia = false;
            angular.forEach($scope.connection.participants, function(p) {
                if (p.hasMedia && (p.serviceType === 'conference'|| p.serviceType === 'gateway' || p.serviceType === 'lecture')) {
                    conferenceHasMedia = true;
                }
            });
            $scope.connection.data.hasStartedMedia = conferenceHasMedia;

            delete $scope.loadingConference;
            delete $scope.params.pin;
            $location.url($location.path());
            // window.history.pushState(null, 'any', $location.absUrl());
            // window.onpopstate = function(event) {
            //     $log.debug('window.onpopstate', event);
            //     $scope.$apply(function() {
            //         $scope.disconnect();
            //     });
            // };
        });
    });

    $scope.$on('call::error', function(event, reason) {
        $timeout(function() {
            $log.debug('call::error', reason);
            modal.close();
            $scope.setErrorMessage(reason);
            $scope.disconnect(false, reason);
        });
    });
    $scope.$on('call::transfer', function(event, alias) {
        $log.debug('call::transfer', alias);
        $rootScope.$broadcast('call::presentationStopped');
        $scope.params.conference = alias;
        $scope.loadingConference = true;
        resetConnection();
    });
    $scope.$on('call::remoteMediaStream', function(event, stream, type) {
        $log.debug('call::remoteMediaStream', stream, type);
        delete $scope.connection.connectingMedia;
        switch (type) {
            case 'video':
                if (typeof(MediaStream) !== "undefined" && stream instanceof MediaStream) {
                    $scope.connection.remoteAudioStream = stream;
                    $scope.connection.remoteVideoStream = stream;
                } else {
                    $scope.connection.remoteAudioStream = $sce.trustAsResourceUrl(stream);
                    $scope.connection.remoteVideoStream = $sce.trustAsResourceUrl(stream);
                }
                break;
            case 'rtmp':
                $scope.connection.remoteAudioStream = $sce.trustAsResourceUrl(stream);
                $scope.connection.remoteVideoStream = $sce.trustAsResourceUrl(stream);
                if ($localStorage.cameraSourceId !== false) {
                    $scope.connection.localVideoStream = $sce.trustAsResourceUrl(stream);
                }
                if (localStorage.microphoneSourceId !== false) {
                    $scope.connection.localAudioStream = $sce.trustAsResourceUrl(stream);
                }
                break;
            case 'audioonly':
                if (typeof(MediaStream) !== "undefined" && stream instanceof MediaStream) {
                    $scope.connection.remoteAudioStream = stream;
                } else {
                    $scope.connection.remoteAudioStream = $sce.trustAsResourceUrl(stream);
                }
                delete $scope.connection.remoteVideoStream;
                if (!platformSettings.hasWebRTC) {
                    delete $scope.connection.localVideoStream;
                    $scope.connection.localAudioStream = $sce.trustAsResourceUrl(stream);
                }
        }
    });
    $scope.$on('call::localMediaStream', function(event, stream, type) {
        $log.debug('call::localMediaStream', stream, type);
        switch (type) {
            case 'video':
            case 'rtmp':
                if ($localStorage.cameraSourceId !== false) {
                    $scope.connection.cameraEnabled = true;
                    if (typeof(MediaStream) !== "undefined" && stream instanceof MediaStream) {
                        $scope.connection.localVideoStream = stream;
                    } else {
                        $scope.connection.localVideoStream = $sce.trustAsResourceUrl(stream);
                    }
                }
                if (localStorage.microphoneSourceId !== false) {
                    if (typeof(MediaStream) !== "undefined" && stream instanceof MediaStream) {
                        $scope.connection.localAudioStream = stream;
                    } else {
                        $scope.connection.localAudioStream = $sce.trustAsResourceUrl(stream);
                    }
                }
                break;
            case 'audioonly':
                if (localStorage.microphoneSourceId !== false) {
                    if (typeof(MediaStream) !== "undefined" && stream instanceof MediaStream) {
                        $scope.connection.localAudioStream = stream;
                    } else {
                        $scope.connection.localAudioStream = $sce.trustAsResourceUrl(stream);
                    }
                }
        }
    });
    $scope.$on('call::participantUpdate', function(event, participant) {
        if ($scope.connection.dialOutState && $scope.connection.dialOutState.result.indexOf(participant.uuid) !== -1) {
            $scope.connection.dialOutState.waiting.splice($scope.connection.dialOutState.waiting.indexOf(participant.uuid), 1);
            if (!participant.isConnecting) {
                $scope.connection.dialOutState.state = 'IDS_PARTICIPANT_ADD_CONNECTED';
                $scope.connection.participantAddDone();
            }
        }
        if (participant.uuid in $scope.connection.participants) {
            angular.copy(participant, $scope.connection.participants[participant.uuid]);
        } else {
            $scope.connection.participants[participant.uuid] = participant;
        }
        if ($scope.connection.data && participant.uuid === $scope.connection.data.uuid) {
            $scope.connection.participant = $scope.connection.participants[participant.uuid];
            $scope.connection.participant.isSelf = true;
        } else if (participant.isWaiting && $scope.connection.participant && participant.startTime > $scope.connection.participant.startTime) {
            $translate('IDS_MESSAGE_PARTICIPANT_WAITING', {
                displayName: participant.displayName
            }).then(toast.message);
        }

        if ($scope.connection.data) {
            var conferenceHasMedia = false;
            angular.forEach($scope.connection.participants, function(p) {
                if (p.hasMedia && (p.serviceType === 'conference'|| p.serviceType === 'gateway' || p.serviceType === 'lecture')) {
                    conferenceHasMedia = true;
                }
            });
            $scope.connection.data.hasStartedMedia = conferenceHasMedia;
        }
    });
    $scope.$on('call::roleUpdated', function(event, isChair) {
        if (isChair !== $scope.connection.data.isChair) {
            $scope.connection.data.isChair = isChair;
            $translate(isChair ? 'IDS_ROLE_UPDATED_TO_HOST' : 'IDS_ROLE_UPDATED_TO_GUEST').then(toast.message);
        }
    });
    $scope.$on('call::participantDeleted', function(event, uuid) {
        $log.debug('call::participantDeleted', uuid);
        delete $scope.connection.participants[uuid];

        if ($scope.connection.dialOutState && $scope.connection.dialOutState.result.indexOf(uuid) !== -1) {
            $scope.connection.dialOutState.result.splice($scope.connection.dialOutState.result.indexOf(uuid), 1);
            if (!$scope.connection.dialOutState.result.length) {
                $scope.connection.dialOutState.state = 'IDS_PARTICIPANT_ADD_DISCONNECTED';
                $scope.connection.participantAddDone();
            }
        }
    });
    $scope.$on('call::participantAdd', function(event, participant) {
        $log.debug('call::participantAdd', participant);
        $scope.connection.dialOutState = participant;
        if (!participant.result.length) {
            $scope.connection.dialOutState.state = 'IDS_PARTICIPANT_ADD_FAILED';
            $scope.connection.participantAddDone();
        } else {
            $scope.connection.dialOutState.state = 'IDS_PARTICIPANT_ADD_CONNECTING';
        }
    });
    $scope.$on('call::stageUpdated', function(event, stage) {
        angular.copy(stage, $scope.connection.stage);
    });

    $scope.$on('call::presentationStarted', function(event, name) {
        var nameMatch = /(.*)\s<(.*)>/.exec(name);
        $translate('IDS_PRESENTATION_NAME', {
                displayName: nameMatch && (nameMatch[1] || nameMatch[2]) || name
            })
            .then(function(name) {
                $scope.call.presentationName = name;
                $scope.call.presentationMaximized = true;
            });
        if ($localStorage.fullMotionPresentationByDefault && platformSettings.hasWebRTC && applicationSettings.enableFullMotionPresentation) {
            $scope.call.startPresentationVideo();
        }
    });
    $scope.$on('call::presentationStopped', function(event) {
        $log.debug('call::presentationStopped');
        delete $scope.call.presentationName;
        delete $scope.call.presentationImgSrc;
        delete $scope.call.presentationVideoSrc;
    });

    function closePresentationWindowOnEnd(event) {
        if ($scope.call && $scope.call.presentationWindow) {
            $scope.call.presentationWindow.close();
            $log.debug('closing presentation window');
        }
    }
    $scope.$on('call::presentationStopped', closePresentationWindowOnEnd);
    $scope.$on('call::screenshareStopped', closePresentationWindowOnEnd);

    $scope.popOutPresentation = function() {
        $log.log('popOutPresentation');
        if (!$scope.call.presentationWindow) {
            if (platformSettings.isDesktopClient) {
                $scope.call.presentationWindow = nw.Window.open(
                    '../templates/presentation-window.html', {
                        id: 'presentationWindow',
                        title: $scope.call.presentationName,
                        width: 800,
                        height: 600,
                        // toolbar: false,
                        focus: true,
                        show: false,
                        icon: 'configuration/favicon.png',
                    },
                    function(win) {
                        $timeout(function() {
                            $scope.call.presentationWindow = win;
                        });
                        win.on('close', function(event) {
                            $timeout(function() {
                                $scope.call.presentationWindow.close(true);
                                $scope.call.presentationWindow = null;
                                $scope.call.refreshPresentation();
                            });
                        });
                        win.once('loaded', function() {
                            $timeout(function() {
                                $rootScope.$broadcast(
                                    'call::presentationUpdate',
                                    $sce.getTrustedResourceUrl($scope.call.presentationImgSrc));
                                $rootScope.$broadcast(
                                    'call::presentationVideoUpdate',
                                    scope.call.presentationVideoSrc);
                                $scope.call.presentationWindow.show();
                                $scope.call.presentationWindow.focus();
                            });
                        });
                    });

            } else {
                $log.log('popOutPresentation: creating window');

                window.presentationWindowOnLoad = function() {
                    $timeout(function() {
                        $log.log('presentationWindow.onload');
                        $rootScope.$broadcast(
                            'call::presentationUpdate',
                            $sce.getTrustedResourceUrl($scope.call.presentationImgSrc));
                        $rootScope.$broadcast(
                            'call::presentationVideoUpdate',
                            $scope.call.presentationVideoSrc);

                        $scope.call.presentationWindow.onbeforeunload = function() {
                            $timeout(function() {
                                $log.log('presentationWindow.onbeforeunload');
                                if ($scope.call) {
                                    $scope.call.presentationWindow = null;
                                    $scope.call.refreshPresentation();
                                }
                            });
                        };
                    });
                    delete window.presentationWindowOnLoad;
                };

                $scope.call.presentationWindow = window.open(
                    'templates/presentation-window.html',
                    $scope.call.presentationName,
                    'width=800,height=600,directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no');
            }
        }
    };

    $scope.$on('call::screenShareMissing', function(event, stage) {
        toggleService.toggle('dialog-screen-share-missing', true);
    });

    var lastMicActivity = 0;
    $scope.$on('call::onMicActivity', function(event) {
        if ($scope.call && $scope.call.microphoneMuted && (Date.now() - lastMicActivity > 30000)) {
            lastMicActivity = Date.now();
            $scope.micActivity = true;
            $timeout(function() {
                delete $scope.micActivity;
            }, 5000);
        }
    });

    if ($scope.params.join && !$scope.params.token) {
        $scope.login(
            $scope.params.conference,
            $scope.params.name,
            $scope.params.pin,
            undefined,
            $scope.params.extension);
    } else if ($scope.params.join && $scope.params.token) {
        $scope.login(
            $scope.params.conference,
            $scope.params.name,
            '',
            $scope.params.token);
    }
});
