'use strict';

angular.module('pexapp')

.constant('avatarColors', [
    '#1abc9c', '#16a085', '#38589d', '#3c797b',
    '#3498db', '#2980b9', '#9b59b6', '#8e44ad',
    '#bdc3c7', '#34495e', '#2c3e50', '#95a5a6',
    '#9ba37e', '#b49255', '#7f8c8d', '#8a4968'
])

.directive('avatar', function(avatarColors) {

    function getRandomColor() {
        var colorIndex = Math.floor(Math.random() * (avatarColors.length));
        return avatarColors[colorIndex];
    }

    function getFixedColor(name) {
        var colorIndex = (makeNameHash(name) % avatarColors.length);
        return avatarColors[colorIndex];
    }

    function makeNameHash(name) {
        var hash = 0,
            i, chr, len;
        if (name.length) {
            for (i = 0, len = name.length; i < len; i++) {
                hash += name.charCodeAt(i);
            }
        }
        return hash;
    }

    return {
        templateUrl: 'templates/avatar.svg',
        scope: {
            name: '@',
        },
        link: function(scope, element, attrs) {
            var name = attrs.name || 'Name';
            var charCount = 1;

            scope.getInitials = function() {
                return scope.name.substr(0, charCount).toUpperCase();
            };

            scope.getColor = getFixedColor;
            scope.textColor = '#ffffff';
            scope.fontSize = 20;
            scope.fontWeight = 400;
            scope.fontFamily = 'HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica, Arial,Lucida Grande, sans-serif';
        }
    };
});
