'use strict';

angular.module('pexapp')

.directive('toggle', function(ngIfDirective, toggleService) {
    var ngIf = ngIfDirective[0];
    return {
        transclude: ngIf.transclude,
        priority: ngIf.priority,
        terminal: ngIf.terminal,
        restrict: ngIf.restrict,
        require: ngIf.require,
        link: function(scope, element, attrs) {
            var value = scope.$eval(attrs.initial) || false;
            scope.$on('toggle::' + attrs.id, function(event, newValue) {
                value = angular.isDefined(newValue) ? newValue : !value;
            });
            scope.hide = function() {
                scope.$emit('toggle::' + attrs.id, false);
            };
            scope.setToggle = function(value) {
                scope.$emit('toggle::' + attrs.id, value);
            };

            attrs.ngIf = function() {
                return value;
            };

            ngIf.link.apply(ngIf, arguments);
        },
    };
})

.factory('toggleService', function($rootScope) {
    return {
        toggle: function(id, value) {
            $rootScope.$broadcast('toggle::' + id, value);
        },
    };
});
