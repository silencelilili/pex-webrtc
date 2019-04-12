'use strict';

angular.module('pexapp')

.directive('aspectWatcher', function($window) {
    return {
        link: function(scope, element, attrs) {
            var layout;
            var thresholdAspectRatio = 16 / 9;
            var narrowClass = 'narrow-aspect';
            var wideClass = 'wide-aspect';

            function handleResize() {
                var aspectRatio = element.width() / element.height();
                var newLayout = aspectRatio < thresholdAspectRatio ? narrowClass : wideClass;

                if (layout !== newLayout) {
                    element.addClass(newLayout);
                    element.removeClass(layout);
                    layout = newLayout;
                }
            }
            angular.element($window).on('resize', handleResize);
            handleResize();
        }
    };
});
