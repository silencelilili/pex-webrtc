'use strict';
/* global $, swfobject, angular */

angular.module('pexapp')

.controller('ConferenceController',
    function(
        $rootScope,
        $scope,
        $timeout,
        $document,
        $log,
        $sce,
        $window,
        $localStorage,
        $translate,
        platformSettings,
        applicationSettings,
        slideShare,
        reportingService,
        toast, modal) {

        $scope.hideSideBarButton = false;
        if (platformSettings.isAndroidClient) {
            $scope.hideSideBarButton = window.innerWidth < 600 || screen.height < 600;
            window.addEventListener('resize', function(event) {
                $('.chat-container').removeClass('chat-fullscreen');
                if (angular.element(document.getElementById('chat-field')).is(':focus') && window.innerHeight < 600) {
                    $('.chat-container').addClass('chat-fullscreen');
                    return;
                } else {
                    $scope.hideSideBarButton = window.innerWidth < 600 || window.innerHeight < 600;
                    $timeout(function() {
                        // Phone turned sideways
                        if (window.innerWidth > window.innerHeight && window.innerHeight < 600) {
                            $scope.sideBar.toggle(true);
                        } else if (window.innerHeight > window.innerWidth && window.innerWidth < 600) {
                            $scope.sideBar.toggle(false);
                        }
                    });
                }
            });
        }
        window.addEventListener('dragover', function(e) {
            e = e || event;
            e.preventDefault();
        }, false);
        window.addEventListener('drop', function(e) {
            e = e || event;
            e.preventDefault();
        }, false);

        if ($scope.params.media && !($scope.connection.remoteAudioStream || $scope.connection.remoteVideoStream)) {
            $scope.startMediaCall();
        }

        $scope.showParticipant = function(participant) {
            $scope.currentParticipant = participant;
            $scope.toggle('dialog-participant-info', true);
        };

        $scope.sendDTMF = function(digit) {
            var participant_uuid = $scope.currentParticipant ? $scope.currentParticipant.uuid : null;
            $scope.call.sendDTMF(digit, participant_uuid);
        };

        $scope.sendFECC = function(action, axis, direction) {
            var participant_uuid = null;
            if ($scope.currentParticipant) {
                participant_uuid = $scope.currentParticipant.uuid;
            } else if ($scope.connection.data.isGateway && Object.keys($scope.connection.participants).length == 2) {
                for (var uuid in $scope.connection.participants) {
                    if (uuid != $scope.connection.data.uuid) {
                        participant_uuid = uuid;
                    }
                }
            }
            $scope.call.sendFECC(action, axis, direction, participant_uuid);
        };

        $scope.toolbar = {
            disconnect: function() {
                if ($localStorage.promptDisconnect) {
                    $scope.toggle('dialog-disconnect', true);
                } else {
                    $scope.disconnect(true, 'User initiated disconnect');
                }
            }
        };

        $scope.sideBar = {
            hidden: $localStorage.sideBarHidden ||
                ($scope.$parent.connection.data.isGateway && $localStorage.sideBarHiddenInGW),

            toggle: function(value) {
                if (value !== undefined) {
                    $scope.sideBar.hidden = value;
                } else {
                    $scope.sideBar.hidden = !$scope.sideBar.hidden;
                }
                $scope.chat.resetSeenMessages();
                $timeout(function() {
                    $(window).trigger('resize');
                }, 500);
            }
        };

        $scope.selfView = {
            toggle: function() {
                this.hidden = !this.hidden;
                if (!$scope.platformSettings.hasWebRTC) {
                    $scope.call.flashToggleSelfview();
                }
            }
        };

        $scope.volume = {
            value: $localStorage.volume || 1,
            previousValue: null,
            toggleMute: function() {
                if ($scope.volume.value > 0) {
                    $scope.volume.previousValue = $scope.volume.value;
                    $scope.volume.value = 0;
                } else {
                    $scope.volume.value = $scope.volume.previousValue || 1;
                }
            }
        };
        if (!$scope.platformSettings.hasWebRTC) {
            $scope.$watch('volume.value', function() {
                $log.debug('Flash: settings volume to', $scope.volume.value);
                var localFlash = swfobject.getObjectById('flashvideo');
                if (localFlash) {
                    localFlash.setReceiveVolume($scope.volume.value);
                }
            });
        }

        $scope.fullScreen = $document.fullScreen();
        $scope.toggleFullScreen = function() {
            $document.toggleFullScreen();
        };
        $document.bind('fullscreenchange', function(e) {
            $scope.$apply(function() {
                $scope.fullScreen = $document.fullScreen();
            });
        });

        $scope.$on('call::conferenceLocked', function(event, locked) {
            $log.debug('call::conferenceLocked', locked);
            toast.message(locked ? 'IDS_TOAST_CONFERENCE_LOCKED' : 'IDS_TOAST_CONFERENCE_UNLOCKED');
        });

        $scope.$on('call::stageUpdated', function(event, stage) {
            $log.debug('call::stageUpdated', stage);
            angular.forEach(stage, function(element) {
                if ($scope.connection.participants.hasOwnProperty(element.participant_uuid)) {
                    $scope.connection.participants[element.participant_uuid].vad = element.vad;
                }
            });
        });

        $scope.chat = {
            enabled: function() {
                if ($scope.connection.data.chatEnabled && $scope.connection.data.isGateway) {
                    for (var participant_uuid in $scope.connection.participants) {
                        var participant = $scope.connection.participants[participant_uuid];
                        if (participant.uuid != $scope.connection.data.uuid && (participant.protocol == 'mssip' || participant.protocol == 'api' || participant.protocol == 'webrtc' || participant.protocol == 'rtmp')) {
                            return true;
                        }
                    }
                    return false;
                }
                return $scope.connection.data.chatEnabled && $scope.call.currentServiceType() !== 'waiting_room';
            },
            messages: [],
            seenMessages: 0,
            chatSize: 1,
            resetSeenMessages: function() {
                if ($scope.chat.chatSize) {
                    $scope.chat.seenMessages = $scope.chat.messages.length;
                }
            },
            sendMessage: function(payload) {
                if (platformSettings.isAndroidClient) {
                    var element = $('#chat-field');
                    element.attr('readonly', 'readonly'); // Force keyboard to hide on input field.
                    element.attr('disabled', 'true'); // Force keyboard to hide on textarea field.
                    setTimeout(function() {
                        element.blur(); //actually close the keyboard
                        // Remove readonly attribute after keyboard is hidden.
                        element.removeAttr('readonly');
                        element.removeAttr('disabled');
                    }, 100);
                }
                if (payload) {
                    $scope.call.sendChatMessage(payload);
                    $scope.chat.handleMessage({
                        origin: $scope.connection.data.displayName,
                        payload: payload
                    });
                }
            },
            handleMessage: function(message) {
                $timeout(function() {
                    $scope.chat.messages.push(message);
                    $timeout(function() {
                        var chatElement = $('#chatdiv')[0];
                        chatElement.scrollTop = chatElement.scrollHeight;
                    });
                });
            },
            focusInput: function() {
                $('#chat-field').focus();
            }
        };
        $scope.$on('call:chatMessageReceived', function(event, message) {
            $scope.chat.handleMessage(message);
        });

        $scope.startScreenShare = function() {
            reportingService.send(
                'screenShare', {
                    uuid: $scope.connection.data.uuid
                },
                $scope.connection.data.analyticsEnabled);
            $scope.call.startScreenShare();
        };

        $scope.slideShare = {
            slides: slideShare.slides,
            loadingSlideCount: slideShare.loadingSlideCount,
            currentSlide: 0,
            addSlides: function(files) {
                slideShare.addSlidesFromFiles(files);
            },

            start: function() {
                reportingService.send(
                    'slideShare', {
                        slideCount: $scope.slideShare.slides.length,
                        uuid: $scope.connection.data.uuid
                    },
                    $scope.connection.data.analyticsEnabled);
                $scope.call.presentationImgSrc = 'img/video-spinner.svg';
                if (slideShare.slides) {
                    this.currentSlide = 0;
                    $scope.call.imageShareStart(function() {
                        $timeout(function() {
                            $scope.call.presentationImgSrc = $sce.trustAsResourceUrl(
                                slideShare.slides[$scope.slideShare.currentSlide].dataURL);
                            $scope.call.imageShareSetImage(slideShare.slides[$scope.slideShare.currentSlide].blob);
                        });
                    });
                }
            },
            nextSlide: function() {
                this.currentSlide = (this.currentSlide + 1) % slideShare.slides.length;
                $scope.call.presentationImgSrc = $sce.trustAsResourceUrl(slideShare.slides[this.currentSlide].dataURL);
                $scope.call.imageShareSetImage(slideShare.slides[this.currentSlide].blob);
            },
            previousSlide: function() {
                this.currentSlide = (this.currentSlide - 1) % slideShare.slides.length;
                if (this.currentSlide < 0) {
                    this.currentSlide = slideShare.slides.length - 1;
                }
                $scope.call.presentationImgSrc = $sce.trustAsResourceUrl(slideShare.slides[this.currentSlide].dataURL);
                $scope.call.imageShareSetImage(slideShare.slides[this.currentSlide].blob);
            },
            deleteSlide: slideShare.deleteSlide,
            cancelUpload: function() {
                slideShare.resetSlideCount();
            },
            deleteAllSlides: function() {
                slideShare.resetSlideCount();
                angular.copy([], slideShare.slides);
            }
        };

        $scope.$on('call::presentationUpdate', function(event, src) {
            if ($scope.call.presentationWindow) {
                try {
                    $scope.call.presentationWindow.window.postMessage({
                        type: 'presentation-update',
                        src: src,
                        name: $scope.call.presentationName,
                        slides: $scope.slideShare.slides.length,
                        currentSlide: $scope.slideShare.currentSlide,
                        screenShareMode: $scope.call.screenShareMode,
                    }, '*');
                } catch (e) {
                    $scope.call.presentationWindow = null;
                }
            }
        });
        $scope.$on('call::presentationVideoUpdate', function(event, src, reason) {
            if ($scope.call.presentationWindow) {
                $scope.call.presentationWindow.window.postMessage({
                    type: 'presentation-video-update',
                    src: src,
                }, '*');
            }
            if (src === null && reason) {
                toast.message(reason);
            }
        });

        $scope.leftArrowKey = function () {
           if ($scope.slideShare.slides.length === 0) {
                return;
            }
            window.postMessage({
                type: 'slide-share-previous'
            }, '*');
        };

        $scope.rightArrowKey = function () {
            if ($scope.slideShare.slides.length === 0) {
                return;
            }
            window.postMessage({
                type: 'slide-share-next'
            }, '*');
        }

        window.addEventListener('message', function(event) {
            $log.log('Got window message', event.data);
            switch (event.data.type) {
                case 'slide-share-next':
                    $timeout(function() {
                        $scope.slideShare.nextSlide();
                        $rootScope.$broadcast('call::presentationUpdate', $scope.slideShare.slides[$scope.slideShare.currentSlide].dataURL);
                    });
                    break;
                case 'slide-share-previous':
                    $timeout(function() {
                        $scope.slideShare.previousSlide();
                        $rootScope.$broadcast('call::presentationUpdate', $scope.slideShare.slides[$scope.slideShare.currentSlide].dataURL);
                    });
                    break;
            }
        });

        $scope.$on('call::screenshareStopped', function(event, reason) {
            $log.debug('call::screenshareStopped', reason);
            toast.message(reason);
        });

        $scope.$on('$destroy', function() {
            $scope.slideShare.deleteAllSlides();
            if (platformSettings.isAndroidClient) {
                window.onorientationchange = null;
            }
        });

        $scope.protocol = applicationSettings.defaultDialOutProtocol;
        $scope.checkProtocolChange = function(uri) {
            var rtmp_regex = /rtmp[s]{0,1}:\/\/[^\s]*/;
            var rtsp_regex = /rtsp:\/\/[^\s]*/;
            var sip_regex = /sip[s]{0,1}:[^\s]*/;
            var lync_regex = /(lync)|(skype):[^\s]*/;
            var h323_regex = /h323:[^\s]*/;
            if (!uri) {
                return;
            }
            if (uri.match(rtmp_regex)) {
                $scope.protocol = 'rtmp';
            }
            if (uri.match(rtsp_regex)) {
                $scope.protocol = 'rtsp';
            }
            if (uri.match(lync_regex)) {
                $scope.protocol = 'mssip';
            }
            if (uri.match(sip_regex)) {
                $scope.protocol = 'sip';
            }
            if (uri.match(h323_regex)) {
                $scope.protocol = 'h323';
            }
        };
    })

.controller('CallStatisticsController', function($scope, $interval) {
    $scope.stats = $scope.call.getCallStatistics();
    var stopInterval = $interval(function() {
        $scope.stats = $scope.call.getCallStatistics();
    }, 1000);

    $scope.$on('$destroy', function() {
        $interval.cancel(stopInterval);
    });
});
