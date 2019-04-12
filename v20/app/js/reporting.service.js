/* global Keen */

angular.module('pexapp')

.factory('reportingService', function($log, $localStorage, platformSettings) {
    'use strict';

    var keen;

    if (angular.isDefined(window.Keen)) {
        $log.debug('Initializing Keen');
        keen = new Keen({
            projectId: platformSettings.keenProjectId,
            writeKey: platformSettings.keenWriteKey
        });
    }

    function sendKeenEvent(collection, metadata, enabled) {
        if (keen && $localStorage.analyticsReportingEnabled && enabled) {
            $log.debug('Reporting usage', collection);
            var startEvent = {
                user_agent: '${keen.user_agent}',
                ip_address: '${keen.ip}',
                usedWidth: screen.availWidth,
                usedHeight: screen.availHeight,
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                language: navigator.language || navigator.userLanguage,
                keen: {
                    timestamp: new Date().toISOString(),
                    addons: [{
                        name: 'keen:ua_parser',
                        input: {
                            ua_string: 'user_agent'
                        },
                        output: 'parsed_vendor'
                    }, {
                        name: 'keen:ip_to_geo',
                        input: {
                            ip: 'ip_address'
                        },
                        output: 'ip_geo_info'
                    }]
                }
            };
            if (metadata) {
                angular.extend(startEvent, metadata);
            }
            keen.addEvent(collection, startEvent);
        }
    }

    var service = {
        send: sendKeenEvent
    };

    return service;
});
