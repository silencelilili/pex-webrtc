'use strict';

angular.module('pexapp')

.directive('swfObject', function ToggleHover($window, flashVideo) {
    /**
     * @description Directive to handle showing the buttonbar when the user wants
     * to do something, then hide it after inactivity.
     */
    return {
        restrict: 'A',
        scope: {
            flashId: '@',
            replaceId: '@',
            width: '@',
            height: '@',
            refId: '@'
        },
        link: function(scope, element, attr) {
            // For version detection, set to min. required Flash Player version, or 0 (or 0.0.0), for no version detection.
            flashVideo.embed(scope.flashId, scope.replaceId, scope.width, scope.height, scope.refId);
        }
    };
})

.factory('flashVideo', function($window, $rootScope, $timeout, $log) {
    $window.flash_is_ready = function () {
        $log.debug('$broadcast flash::ready');
        $rootScope.$broadcast('flash::ready');
    };

    return {
        hasFlashInstalled: function() {
            return swfobject.hasFlashPlayerVersion('11.1.0');
        },
        embed: function(flashId, replaceId, width, height, src) {
            $timeout(function() {
                $log.debug('FLASH EMBED', flashId, replaceId, width, height, src);
                var swfVersionStr = '11.1.0';
                // To use express install, set to playerProductInstall.swf, otherwise the empty string.
                var xiSwfUrlStr = 'playerProductInstall.swf';
                //var flashvars = {'pexipRTMPServer' : '127.0.0.1'};
                var flashvars = {};
                var params = {};
                params.quality = 'high';
                params.bgcolor = '#262626';
                //params.allowscriptaccess = 'sameDomain';
                params.allowscriptaccess = 'always';
                params.allowfullscreen = 'true';
                params.wmode = 'transparent';
                params.scale = 'exactFit';
                var attributes = {};
                attributes.id = flashId;
                attributes.name = 'PexVideo';
                attributes.align = 'middle';
                /* global swfobject */
                swfobject.embedSWF(
                    src, replaceId, width, height,
                    swfVersionStr, xiSwfUrlStr,
                    flashvars, params, attributes);
                // JavaScript enabled so display the flashContent div in case it is not replaced with a swf object.
                // swfobject.createCSS('#flashContent', 'display:block;text-align:left;position:relative');
                swfobject.createCSS(replaceId, 'display:none');
            }, 10);
        }
    };
});
