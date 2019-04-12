'use strict';
angular.module('pexapp')

.directive('focusInput', function() {
    return {
        link: function(scope, element) {
            element[0].focus();
        }
    };
});
