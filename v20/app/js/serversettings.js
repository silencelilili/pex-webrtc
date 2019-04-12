'use strict';
angular.module('pexapp')

.constant('serverSettings', angular.extend({
    analyticsReportingEnabled: false,
}, window.serverSettings));
