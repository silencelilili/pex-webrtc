angular.module('pexapp').directive('idleTimer', function($interval) {
    'use strict';
    return {
        link: function(scope, element, attrs) {
            var interval = parseInt(attrs.interval) || 500;
            var idleAfter = parseInt(attrs.idleAfter) || 5000;
            var idleTime = 0;
            var disableCheck = attrs.disableIdle;
            var state;

            element.on('mousemove', function() {
                idleTime = 0;
                state = 'active';
                element.removeClass('idle');
            });

            $interval(function() {
                idleTime += interval;
                var enableIdle;
                if (!disableCheck) {
                    enableIdle = true;
                } else {
                    if (scope.connection) {
                        enableIdle = scope.connection[disableCheck];
                    } else {
                        enableIdle = true;
                    }
                }
                if (state !== 'idle' && idleTime >= idleAfter && enableIdle) {
                    state = 'idle';
                    element.addClass('idle');
                }
            }, interval);
        }
    };
});
