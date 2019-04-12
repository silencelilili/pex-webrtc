angular.module('pexapp')

.factory('mediaDevicesService', function($log, $q) {
    'use strict';

    var service = {};

    function parseDevices(devices, keepOriginal) {
        var result = {
            audio: [],
            video: [],
            output: []
        };

        angular.forEach(devices, function(device) {
            if (keepOriginal || device.label !== 'Default') {
                switch (device.kind) {
                    case 'audio':
                    case 'audioinput':
                        result.audio.push({
                            id: device.id || device.deviceId,
                            kind: 'audio',
                            label: device.label || 'Microphone ' + (result.audio.length + 1)
                        });
                        break;
                    case 'video':
                    case 'videoinput':
                        result.video.push({
                            id: device.id || device.deviceId,
                            kind: 'video',
                            label: device.label || 'Camera ' + (result.video.length + 1)
                        });
                        break;
                    case 'audiooutput':
                        result.output.push({
                            id: device.id || device.deviceId,
                            kind: 'output',
                            label: device.label || 'Output ' + (result.output.length + 1)
                        });
                        break;
                }
            }
        });

        if (!keepOriginal) {
            result.video.push({
                id: false,
                kind: 'video',
                label: 'IDS_SETTINGS_CAMERA_NONE'
            });

            result.audio.push({
                id: false,
                kind: 'audio',
                label: 'IDS_SETTINGS_MICROPHONE_NONE'
            });
        }

        return result;
    }

    service.enumerateDevices = function(keepOriginal) {
        $log.log('enumerateDevices');

        var devices = $q.defer();

        function enumerateDevicesSuccess(result) {
            $log.log('enumerateDevices succeeded:', result);
            devices.resolve(parseDevices(result, keepOriginal));
        }

        function enumerateDevicesError(error) {
            $log.error('enumerateDevices failed:', error);
            devices.reject(error);
        }

        if (navigator && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            try {
                navigator.mediaDevices.enumerateDevices()
                    .then(enumerateDevicesSuccess)
                    .catch(enumerateDevicesError);
            } catch (e) {
                enumerateDevicesError(e);
            }
        } else if (window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
            window.MediaStreamTrack.getSources(enumerateDevicesSuccess);
        } else {
            enumerateDevicesError('Unsupported browser');
        }

        return devices.promise;
    };

    service.getInvalidDevices = function(devices) {
        $log.log('Validating media devices', devices);

        return service.enumerateDevices(true)
        .then(function(validDevices) {
            $log.log('Valid devices', validDevices);
            var invalidDevices = [];
            angular.forEach(devices, function(device) {
                var valid = false;
                angular.forEach(validDevices[device.kind] || [], function(validDevice) {
                    if (device.id === validDevice.id) {
                        valid = true;
                    }
                });
                if (!valid) {
                    invalidDevices.push(device);
                }
            });

            if (invalidDevices.length) {
                $log.error('Invalid device IDs:', invalidDevices);
            }

            return {
                invalidDevices: invalidDevices,
                validDevices: validDevices
            };
        })
        .catch(function(error) {
            $log.error('Could not validate devices:', error);
            return {
                invalidDevices: [],
                validDevices: []
            };
        });
    };

    return service;
});
