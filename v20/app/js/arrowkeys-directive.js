"use strict";
/* global $, swfobject, angular */

angular.module('pexapp')

//FIXME: Put this somewhere approriate
.directive("arrowKeys", function ($document) {
    return {
        link: function (scope, element, attrs) {
            $document.on("keydown", function (e) {
                if (e.target.tagName === "INPUT" ||
                    e.target.tagName === "TEXTAREA") {
                    return;
                }
                switch (e.keyCode) {
                    case 37:
                        if (scope.leftArrowKey) {
                            scope.$apply(scope.leftArrowKey(e));
                        }
                        break;
                    case 38:
                        if (scope.upArrowKey) {
                            scope.$apply(scope.upArrowKey(e));
                        }
                        break;
                    case 39:
                        if (scope.rightArrowKey) {
                            scope.$apply(scope.rightArrowKey(e));
                        }
                        break;
                    case 40:
                        if (scope.downArrowKey) {
                            scope.$apply(scope.downArrowKey(e));
                        }
                        break;
                }
            });
        } 
    };
})
