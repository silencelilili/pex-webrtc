'use strict';

angular.module('pexapp')

.factory('toast', function($timeout) {
    var toastMessages = [];
    return {
        messages: toastMessages,
        message: function(message, timeout) {
            toastMessages.push(message);
            $timeout(function() {
                var index = toastMessages.indexOf(message);
                if (index > -1) {
                    toastMessages.splice(index, 1);
                }
            }, timeout || 5000);
        }
    };
})

.factory('modal', function($translate) {
    var modalMessage;
    var service = {
        close: function() {
            modalMessage = null;
        },
        getMessage: function() {
            return modalMessage;
        },
        confirm: function(title, message, yesCallback, noCaption, yesCaption) {
            var actions = [{
                caption: $translate.instant(noCaption || 'IDS_BUTTON_CANCEL'),
                callback: function() {
                    modalMessage = null;
                }}, {
                caption: $translate.instant(yesCaption || 'IDS_BUTTON_OK'),
                callback: function() {
                    if (angular.isFunction(yesCallback)) {
                        yesCallback();
                    }
                    modalMessage = null;
                }
            }];
            service.dialog(title, message, actions);
        },
        alert: function(title, message, callback) {
            modalMessage = {
                title: title,
                message: message,
                dismiss: function() {
                    modalMessage = null;
                    if (angular.isFunction(callback)) {
                        callback();
                    }
                },
                actions: [{
                    caption: 'OK'
                }]
            };
        },

        dialog: function(title, message, actions) {
            modalMessage = {
                title: title,
                message: message,
                actions: actions
            };
        }

    };
    return service;
});
